import { useEffect, useRef, useState } from "react";
import { useSocket } from "../contexts/SocketContext";
import toast from "react-hot-toast";
import useTranslation from "../hooks/useTranslation";
import VoiceChat from "./VoiceChat";

interface YouTubeSyncPlayerProps {
  initialVideoId?: string;
  roomId?: string;
  onExit?: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function YouTubeSyncPlayer({
  initialVideoId = "",
  roomId = "public",
  onExit,
}: YouTubeSyncPlayerProps) {
  const { socket } = useSocket();
  const { t } = useTranslation();

  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isRemoteUpdate = useRef(false);
  const lastKnownTime = useRef(0);
  const lastKnownState = useRef<number>(-1);
  const isCountdownActive = useRef(false);

  const heartbeatInterval = useRef<any>(null);
  const countdownInterval = useRef<any>(null);
  const forcePauseInterval = useRef<any>(null);

  const [videoId, setVideoId] = useState(initialVideoId);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [usersActive, setUsersActive] = useState(false);

  useEffect(() => {
    if (!socket || roomId === "public") setUsersActive(true);

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => initPlayer();
    } else {
      initPlayer();
    }
  }, [videoId]);

  const initPlayer = () => {
    if (!containerRef.current || !videoId) return;
    if (playerRef.current) playerRef.current.destroy();

    const anchor = document.createElement("div");
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(anchor);

    playerRef.current = new window.YT.Player(anchor, {
      height: "100%",
      width: "100%",
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });
  };

  const onPlayerReady = (event: any) => {
    socket?.emit("join_video_room", { roomId, initialVideoId });

    event.target.mute();
    event.target.playVideo();
    setTimeout(() => {
      event.target.pauseVideo();
      event.target.unMute();
    }, 500);
  };

  const onPlayerStateChange = (event: any) => {
    if (isRemoteUpdate.current || isCountdownActive.current) return;

    const state = event.data;
    const currentTime = event.target.getCurrentTime();

    const timeDiff = Math.abs(currentTime - lastKnownTime.current);
    const isSeeking = timeDiff > 2.0;

    if (state === 1) {
      if (isSeeking) {
        socket?.emit("seek_video", { roomId, time: currentTime });
      }

      if (!countdown) {
        isRemoteUpdate.current = true;
        event.target.pauseVideo();
        setTimeout(() => (isRemoteUpdate.current = false), 200);

        socket?.emit("video:countdown", { roomId, targetTime: currentTime });
      }

      lastKnownTime.current = currentTime;
      lastKnownState.current = 1;
    } else if (state === 2) {
      if (isSeeking) {
        socket?.emit("seek_video", { roomId, time: currentTime });
      }

      socket?.emit("pause_video", { roomId, time: currentTime });

      lastKnownTime.current = currentTime;
      lastKnownState.current = 2;
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("video:sync", (state: any) => {
      if (!state) return;
      if (state.usersActive !== undefined) {
        setUsersActive(state.usersActive);
        if (
          !state.usersActive &&
          roomId !== "public" &&
          playerRef.current?.pauseVideo
        ) {
          isRemoteUpdate.current = true;
          playerRef.current.pauseVideo();
          setTimeout(() => (isRemoteUpdate.current = false), 500);
        }
      } else if (roomId === "public") setUsersActive(true);

      if (state.videoId && state.videoId !== videoId) setVideoId(state.videoId);

      if (playerRef.current && playerRef.current.getCurrentTime) {
        const localTime = playerRef.current.getCurrentTime();
        const diff = Math.abs(localTime - state.time);
        const localState = playerRef.current.getPlayerState();

        if (diff > 2) {
          isRemoteUpdate.current = true;
          playerRef.current.seekTo(state.time, true);
          setTimeout(() => (isRemoteUpdate.current = false), 1000);
        }

        if (state.isPlaying && localState !== 1) {
          isRemoteUpdate.current = true;
          playerRef.current.playVideo();
          setTimeout(() => (isRemoteUpdate.current = false), 500);
        } else if (!state.isPlaying && localState === 1) {
          isRemoteUpdate.current = true;
          playerRef.current.pauseVideo();
          setTimeout(() => (isRemoteUpdate.current = false), 500);
        }
      }
    });

    socket.on("play_video", (data: { time: number; user?: string }) => {
      if (playerRef.current) {
        isRemoteUpdate.current = true;
        playerRef.current.seekTo(data.time, true);
        playerRef.current.playVideo();
        setTimeout(() => (isRemoteUpdate.current = false), 1000);

        lastKnownTime.current = data.time;
      }
    });

    socket.on("pause_video", (data: { time: number; user?: string }) => {
      if (data.user) {
        toast(`${data.user} videoyu duraklattı`, {
          icon: "⏸️",
          style: { fontSize: "12px", background: "#333", color: "#fff" },
        });
      }
      if (playerRef.current) {
        isRemoteUpdate.current = true;
        playerRef.current.seekTo(data.time, true);
        playerRef.current.pauseVideo();
        setTimeout(() => (isRemoteUpdate.current = false), 1000);

        lastKnownTime.current = data.time;
      }
    });

    socket.on("seek_video", (data: { time: number; user?: string }) => {
      if (playerRef.current) {
        isRemoteUpdate.current = true;
        playerRef.current.seekTo(data.time, true);
        setTimeout(() => (isRemoteUpdate.current = false), 1000);

        lastKnownTime.current = data.time;
      }
    });

    socket.on("change_movie", (newId: string) => setVideoId(newId));

    socket.on("video:countdown", (data: { targetTime: number }) => {
      if (countdownInterval.current) clearInterval(countdownInterval.current);
      if (forcePauseInterval.current) clearInterval(forcePauseInterval.current);

      isCountdownActive.current = true;
      let count = 3;
      setCountdown(count);

      if (playerRef.current) {
        isRemoteUpdate.current = true;
        playerRef.current.seekTo(data.targetTime, true);
        playerRef.current.pauseVideo();
        setTimeout(() => (isRemoteUpdate.current = false), 500);
      }

      forcePauseInterval.current = setInterval(() => {
        if (playerRef.current && playerRef.current.getPlayerState() === 1) {
          isRemoteUpdate.current = true;
          playerRef.current.pauseVideo();
          playerRef.current.seekTo(data.targetTime, true);
          setTimeout(() => (isRemoteUpdate.current = false), 100);
        }
      }, 100);

      countdownInterval.current = setInterval(() => {
        count--;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(countdownInterval.current);
          clearInterval(forcePauseInterval.current);
          setCountdown(null);
          isCountdownActive.current = false;

          if (playerRef.current) {
            isRemoteUpdate.current = true;
            playerRef.current.playVideo();
            setTimeout(() => (isRemoteUpdate.current = false), 1000);
          }
        }
      }, 1000);
    });

    socket.on("video:force_sync", (data: { time: number; reason: string }) => {
      toast(data.reason, { icon: "🔄" });
      if (playerRef.current) {
        isRemoteUpdate.current = true;
        playerRef.current.seekTo(data.time, true);
        setTimeout(() => (isRemoteUpdate.current = false), 1000);
      }
    });

    return () => {
      if (roomId !== "public") {
        socket.emit("leave_video_room");
      }

      socket.off("video:sync");
      socket.off("play_video");
      socket.off("pause_video");
      socket.off("seek_video");
      socket.off("change_movie");
      socket.off("video:countdown");
      socket.off("video:force_sync");
    };
  }, [socket, roomId, videoId]);

  useEffect(() => {
    if (!socket || roomId === "public") return;

    heartbeatInterval.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        const state = playerRef.current.getPlayerState();
        const isPlaying = state === 1;

        if (Math.abs(time - lastKnownTime.current) < 5) {
          lastKnownTime.current = time;
        }

        socket.emit("video:heartbeat", { roomId, time, isPlaying });
      }
    }, 2000);

    return () => clearInterval(heartbeatInterval.current);
  }, [socket, roomId]);

  useEffect(() => {
    return () => {
      if (countdownInterval.current) clearInterval(countdownInterval.current);
      if (forcePauseInterval.current) clearInterval(forcePauseInterval.current);
    };
  }, []);

  useEffect(() => {
    if (
      !usersActive &&
      roomId !== "public" &&
      playerRef.current &&
      playerRef.current.pauseVideo
    ) {
      isRemoteUpdate.current = true;
      playerRef.current.pauseVideo();
      setTimeout(() => (isRemoteUpdate.current = false), 500);
    }
  }, [usersActive, roomId]);

  return (
    <div className="w-full h-full relative bg-black">
      {videoId ? (
        <div ref={containerRef} className="w-full h-full" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
          <div className="p-4 rounded-full bg-white/5 mb-4">
            <span className="text-4xl">📺</span>
          </div>
          <p>{t("sync_player_no_video")}</p>
        </div>
      )}

      {roomId !== "public" && !usersActive && (
        <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 text-center">
          <div className="p-4 rounded-full bg-white/10 mb-4 animate-pulse">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-2">
            {t("sync_player_partner_waiting_title")}
          </h3>
          <p className="text-white/50 max-w-sm mb-6">
            {t("sync_player_partner_waiting_desc")}
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => {
                let title = "video";
                if (
                  playerRef.current &&
                  typeof playerRef.current.getVideoData === "function"
                ) {
                  title = playerRef.current.getVideoData().title || "video";
                }
                socket?.emit("send_nudge", { roomId, title });
              }}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95"
            >
              {t("sync_player_nudge_btn")}
            </button>

            {onExit && (
              <button
                onClick={onExit}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors text-sm font-medium"
              >
                {t("sync_player_exit")}
              </button>
            )}
          </div>
        </div>
      )}

      {countdown !== null && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="text-9xl font-bold text-white animate-pulse">
            {countdown}
          </div>
        </div>
      )}

      {roomId !== "public" && (
        <VoiceChat roomId={roomId} enabled={usersActive} />
      )}
    </div>
  );
}
