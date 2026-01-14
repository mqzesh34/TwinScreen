import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import BottomNavbar from "../components/BottomNavbar";
import { Play, Clock, Popcorn } from "lucide-react";
import useTranslation from "../hooks/useTranslation";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";

interface LastWatched {
  id: number;
  movieTitle: string;
  poster_url?: string;
  creator: string;
  invitedUser: string;
  playback: {
    time: number;
  };
}

export default function Home() {
  const [lastWatched, setLastWatched] = useState<LastWatched | null>(null);
  const [loading, setLoading] = useState(true);
  const { userKey } = useAuth();
  const { socket } = useSocket();

  const { t } = useTranslation();
  const navigate = useNavigate();

  const fetchLastWatched = () => {
    if (!userKey) return;
    fetch("/private-rooms/last-watched", {
      headers: { Authorization: `Bearer ${userKey}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.id) setLastWatched(data);
        else setLastWatched(null);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLastWatched();

    if (socket) {
      socket.on("last_watched_updated", fetchLastWatched);
      socket.on("private_rooms_updated", fetchLastWatched);
    }

    return () => {
      if (socket) {
        socket.off("last_watched_updated", fetchLastWatched);
        socket.off("private_rooms_updated", fetchLastWatched);
      }
    };
  }, [userKey, socket]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen p-7 pb-32">
      <TopBar />

      <main className="max-w-2xl mx-auto pt-24 space-y-10">
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-400">
              <Popcorn size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {t("home_continue_watching")}
              </h2>
              <p className="text-sm text-white/40">
                Kaldığınız yerden devam edin
              </p>
            </div>
          </div>

          {loading ? (
            <div className="w-full h-24 bg-white/5 rounded-2xl animate-pulse" />
          ) : lastWatched ? (
            <div
              onClick={() => navigate(`/private-room/${lastWatched.id}`)}
              className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between group hover:border-purple-500/50 hover:bg-white/10 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="space-y-2 relative z-10">
                <h3 className="font-bold text-lg group-hover:text-purple-400 transition-colors">
                  {lastWatched.movieTitle}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <Clock size={10} className="text-purple-400" />
                    <span className="text-[10px] font-black text-purple-200">
                      {formatTime(lastWatched.playback.time)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                  <Play size={20} fill="currentColor" />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-white bg-white/5 rounded-3xl border border-dashed border-white/10">
              <Popcorn size={48} className="mx-auto mb-3" />
              <p className="text-white/50">{t("home_no_recent_activity")}</p>
            </div>
          )}
        </section>
      </main>

      <BottomNavbar />
    </div>
  );
}
