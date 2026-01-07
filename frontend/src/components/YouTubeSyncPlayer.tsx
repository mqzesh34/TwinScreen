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
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isRemoteUpdate = useRef(false);
  const [videoId, setVideoId] = useState(initialVideoId);
  const hasSynced = useRef(false);
  const pendingSync = useRef<{ time: number; isPlaying: boolean } | null>(null);

  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownInterval = useRef<any>(null);
  const countdownActive = useRef(false);

  const heartbeatInterval = useRef<any>(null);

  const { t } = useTranslation();

  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };
  }, [videoId]);

  const initPlayer = () => {
    if (!containerRef.current || !videoId) return;
    if (playerRef.current) {
      playerRef.current.destroy();
    }

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
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });
  };

  const warmUpPlayer = () => {
    if (playerRef.current && playerRef.current.playVideo) {
      playerRef.current.mute();
      playerRef.current.playVideo();
      setTimeout(() => {
        playerRef.current.pauseVideo();
        playerRef.current.unMute();
      }, 100);
    }
  };

  const onPlayerReady = (event: any) => {
    if (pendingSync.current) {
      const sync = pendingSync.current;
      isRemoteUpdate.current = true;
      event.target.seekTo(sync.time, true);

      if (sync.isPlaying) {
        event.target.playVideo();
      } else {
        event.target.pauseVideo();
      }

      hasSynced.current = true;
      pendingSync.current = null;

      setTimeout(() => {
        isRemoteUpdate.current = false;
      }, 2000);
    } else {
      hasSynced.current = true;
    }
  };

  const onPlayerStateChange = (event: any) => {
    if (isRemoteUpdate.current) return;

    const state = event.data;
    const currentTime = event.target.getCurrentTime();

    if (state === 1) {
      if (!countdownActive.current) {
        event.target.pauseVideo();

        const targetTime = currentTime;
        socket?.emit("video:countdown", { roomId, targetTime });
      }
    } else if (state === 2) {
      if (countdownActive.current) return;
      socket?.emit("pause_video", { roomId, time: currentTime });
    }
  };

  const [usersActive, setUsersActive] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleInteraction = (notify: boolean) => {
    warmUpPlayer();
    setHasInteracted(true);

    if (notify) {
      socket?.emit("send_room_notification", { roomId }, (response: any) => {
        if (response?.status === "sent") {
          toast.success(t("sync_player_notification_sent"));
        } else if (response?.status === "already_in_room") {
          toast(t("sync_player_partner_already_joined"), { icon: "ℹ️" });
        }
      });
    }
  };

  useEffect(() => {
    if (!socket) return;
    socket.emit("join_video_room", { roomId, initialVideoId });

    socket.on("video:sync", (state: any) => {
      if (!state) return;

      if (state.usersActive !== undefined) {
        setUsersActive(state.usersActive);
      } else {
        if (roomId === "public") setUsersActive(true);
      }

      setVideoId((prev) => {
        if (state.videoId && state.videoId !== prev) {
          return state.videoId;
        }
        return prev;
      });

      if (playerRef.current && playerRef.current.seekTo) {
        isRemoteUpdate.current = true;
        playerRef.current.seekTo(state.time, true);
        if (state.isPlaying) {
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
        setTimeout(() => (isRemoteUpdate.current = false), 2000);
        hasSynced.current = true;
      } else {
        pendingSync.current = { time: state.time, isPlaying: state.isPlaying };
      }
    });

    socket.on("play_video", (data: { time: number }) => {
      if (playerRef.current && playerRef.current.seekTo) {
        isRemoteUpdate.current = true;
        playerRef.current.seekTo(data.time, true);
        playerRef.current.playVideo();
        setTimeout(() => (isRemoteUpdate.current = false), 1000);
      } else {
        pendingSync.current = { time: data.time, isPlaying: true };
      }
    });

    socket.on("pause_video", (data: { time: number | null }) => {
      if (playerRef.current && playerRef.current.pauseVideo) {
        isRemoteUpdate.current = true;
        if (data.time !== null) {
          playerRef.current.seekTo(data.time, true);
        }
        playerRef.current.pauseVideo();
        setTimeout(() => (isRemoteUpdate.current = false), 500);
      } else if (data.time !== null) {
        pendingSync.current = { time: data.time, isPlaying: false };
      }
    });

    socket.on("seek_video", (data: { time: number }) => {
      if (playerRef.current && playerRef.current.seekTo) {
        isRemoteUpdate.current = true;
        playerRef.current.seekTo(data.time, true);
        setTimeout(() => (isRemoteUpdate.current = false), 1000);
      }
    });

    socket.on("change_movie", (newVideoId: string) => {
      setVideoId(newVideoId);
    });

    socket.on("video:countdown", (data: { targetTime: number }) => {
      if (countdownInterval.current) clearInterval(countdownInterval.current);

      let count = 3;
      setCountdown(count);
      countdownActive.current = true;

      if (playerRef.current && playerRef.current.seekTo) {
        isRemoteUpdate.current = true;
        playerRef.current.pauseVideo();
        playerRef.current.seekTo(data.targetTime, true);
        setTimeout(() => (isRemoteUpdate.current = false), 500);
      }

      countdownInterval.current = setInterval(() => {
        count--;
        setCountdown(count);
        if (count === 0) {
          clearInterval(countdownInterval.current);
          setCountdown(null);
          countdownActive.current = false;

          if (playerRef.current && playerRef.current.playVideo) {
            isRemoteUpdate.current = true;
            playerRef.current.playVideo();
            setTimeout(() => (isRemoteUpdate.current = false), 1000);
          }
        }
      }, 1000);
    });

    socket.on(
      "video:force_sync",
      (data: { time: number; reason: string; isPlaying?: boolean }) => {
        if (playerRef.current && playerRef.current.seekTo) {
          isRemoteUpdate.current = true;
          playerRef.current.seekTo(data.time, true);

          if (data.isPlaying) {
            playerRef.current.playVideo();
          }

          setTimeout(() => (isRemoteUpdate.current = false), 1000);
        }
      }
    );

    heartbeatInterval.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        const state = playerRef.current.getPlayerState();
        const isPlaying = state === 1;

        socket.emit("video:heartbeat", { roomId, time, isPlaying });
      }
    }, 2000);

    return () => {
      socket.emit("leave_video_room");
      socket.off("video:sync");
      socket.off("play_video");
      socket.off("pause_video");
      socket.off("seek_video");
      socket.off("change_movie");
      socket.off("video:countdown");
      socket.off("video:force_sync");
      if (countdownInterval.current) clearInterval(countdownInterval.current);
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
    };
  }, [socket, roomId]);

  return (
    <div className="w-full h-full relative bg-black">
      {!hasInteracted && (
        <div className="absolute inset-0 z-[110] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 text-center">
          <div className="p-4 rounded-full bg-blue-500/10 mb-6">
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
              className="text-blue-400"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-4">
            {t("sync_player_notify_title")}
          </h3>
          <p className="text-white/50 max-w-sm mb-8 text-sm">
            {t("sync_player_notify_desc")}
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleInteraction(true)}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white rounded-full font-medium transition-all shadow-lg shadow-blue-500/20"
            >
              {t("sync_player_notify_yes")}
            </button>
            <button
              onClick={() => handleInteraction(false)}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-full font-medium transition-all"
            >
              {t("sync_player_notify_no")}
            </button>
          </div>
        </div>
      )}

      {hasInteracted && !usersActive && roomId !== "public" && (
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
          {onExit && (
            <button
              onClick={onExit}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors text-sm font-medium"
            >
              {t("sync_player_exit")}
            </button>
          )}
        </div>
      )}

      {videoId ? (
        <div ref={containerRef} className="w-full h-full" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
          <div className="p-4 rounded-full bg-white/5 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
          <p>{t("sync_player_no_video")}</p>
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
        <VoiceChat roomId={roomId} enabled={hasInteracted && usersActive} />
      )}
    </div>
  );
}
