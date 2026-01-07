import { useEffect, useRef, useState, useCallback } from "react";
import Peer from "peerjs";
import type { MediaConnection } from "peerjs";
import { useSocket } from "../contexts/SocketContext";
import { Phone, PhoneOff } from "lucide-react";

interface VoiceChatProps {
  roomId: string;
  enabled: boolean;
}

export default function VoiceChat({ roomId, enabled }: VoiceChatProps) {
  const { socket } = useSocket();
  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [manuallyDisconnected, setManuallyDisconnected] = useState(false);

  const cleanup = useCallback(() => {
    if (callRef.current) {
      callRef.current.close();
      callRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setPartnerConnected(false);
  }, []);

  const handleIncomingCall = useCallback((call: MediaConnection) => {
    const streamToSend = localStreamRef.current || new MediaStream();
    call.answer(streamToSend);
    callRef.current = call;

    call.on("stream", (remoteStream) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.volume = 1.0;
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.play().catch(() => {});
      }
      setPartnerConnected(true);
    });

    call.on("close", () => {
      setPartnerConnected(false);
    });
  }, []);

  const callPeer = useCallback((peerId: string) => {
    if (!peerRef.current || !localStreamRef.current) return;
    if (callRef.current) return;

    const call = peerRef.current.call(peerId, localStreamRef.current);
    if (!call) return;

    callRef.current = call;

    call.on("stream", (remoteStream) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.volume = 1.0;
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.play().catch(() => {});
      }
      setPartnerConnected(true);
    });

    call.on("close", () => {
      setPartnerConnected(false);
    });
  }, []);

  const initVoiceChat = useCallback(async () => {
    if (!socket || !enabled) return;

    setIsConnecting(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      localStreamRef.current = stream;

      const peer = new Peer({
        debug: 0,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
        },
      });
      peerRef.current = peer;

      peer.on("open", (id) => {
        socket.emit("voice:register", { roomId, peerId: id });
        setIsConnected(true);
        setIsConnecting(false);
      });

      peer.on("call", handleIncomingCall);

      peer.on("error", () => {
        setIsConnecting(false);
      });
    } catch {
      setIsConnecting(false);
    }
  }, [socket, roomId, enabled, handleIncomingCall]);

  useEffect(() => {
    if (!socket) return;

    socket.on("voice:peer_joined", (data: { peerId: string }) => {
      if (peerRef.current && localStreamRef.current && !callRef.current) {
        callPeer(data.peerId);
      }
    });

    socket.on("voice:peer_left", () => {
      if (callRef.current) {
        callRef.current.close();
        callRef.current = null;
      }
      setPartnerConnected(false);
    });

    return () => {
      socket.off("voice:peer_joined");
      socket.off("voice:peer_left");
      cleanup();
    };
  }, [socket, callPeer, cleanup]);

  useEffect(() => {
    if (enabled && !isConnected && !isConnecting && !manuallyDisconnected) {
      initVoiceChat();
    }
    return () => {
      if (!enabled) cleanup();
    };
  }, [
    enabled,
    isConnected,
    isConnecting,
    manuallyDisconnected,
    initVoiceChat,
    cleanup,
  ]);

  const toggleConnection = () => {
    if (isConnected) {
      setManuallyDisconnected(true);
      cleanup();
    } else {
      setManuallyDisconnected(false);
      initVoiceChat();
    }
  };

  if (!enabled) return null;

  return (
    <>
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{ display: "none" }}
      />

      <div
        className="absolute bottom-6 right-6 z-[60] flex items-center gap-2 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {isConnecting && (
          <div className="bg-yellow-500/20 text-yellow-400 px-2.5 py-1 rounded-full text-xs backdrop-blur-md border border-yellow-500/30 animate-pulse">
            ...
          </div>
        )}

        {isConnected && partnerConnected && (
          <div
            className="w-2 h-2 rounded-full bg-green-500 animate-pulse"
            title="Aktif"
          />
        )}

        <button
          onClick={toggleConnection}
          disabled={isConnecting}
          className={`p-4 rounded-full backdrop-blur-md border transition-all pointer-events-auto ${
            isConnected
              ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30"
              : "bg-white/10 text-white/40 border-white/10 hover:bg-white/20"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isConnected ? "Kapat" : "Sesli Sohbet"}
        >
          {isConnected ? <Phone size={24} /> : <PhoneOff size={24} />}
        </button>
      </div>
    </>
  );
}
