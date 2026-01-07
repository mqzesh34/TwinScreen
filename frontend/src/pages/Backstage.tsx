import { useState, useEffect, useRef } from "react";
import ReactPlayer from "react-player";
import TopBar from "../components/TopBar";
import BottomNavbar from "../components/BottomNavbar";
import ConfirmModal from "../components/ConfirmModal";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import useTranslation from "../hooks/useTranslation";
import {
  Film,
  Plus,
  Trash2,
  X,
  Clapperboard,
  Popcorn,
  Users,
} from "lucide-react";

interface Movie {
  id: number;
  title: string;
  preview_url: string;
  added_by: string;
  added_at: string;
}

interface User {
  id: number;
  name: string;
  role: string;
}

export default function Backstage() {
  const Player = ReactPlayer;
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const { userKey, userRole, userProfile } = useAuth();
  const { socket } = useSocket();
  const { t } = useTranslation();
  const isFetched = useRef(false);

  const fetchMovies = async () => {
    try {
      const res = await fetch("http://localhost:3001/movies", {
        headers: { Authorization: `Bearer ${userKey || ""}` },
      });
      const data = await res.json();
      if (res.ok) setMovies(data);
    } catch {
      toast.error(t("common_error"));
    }
  };

  useEffect(() => {
    if (isFetched.current) return;
    isFetched.current = true;
    fetchMovies();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("movies_updated", (updatedMovies: Movie[]) => {
      setMovies(updatedMovies);
    });

    return () => {
      socket.off("movies_updated");
    };
  }, [socket]);

  const handleAddMovie = async () => {
    if (!newTitle || !newVideoUrl) return toast.error(t("common_error"));
    try {
      const res = await fetch("http://localhost:3001/movies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userKey || ""}`,
        },
        body: JSON.stringify({ title: newTitle, preview_url: newVideoUrl }),
      });
      if (res.ok) {
        toast.success(t("common_success"));
        setIsAddModalOpen(false);
        setNewTitle("");
        setNewVideoUrl("");
      }
    } catch {
      toast.error(t("common_error"));
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`http://localhost:3001/movies/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${userKey || ""}` },
      });
      if (res.ok) {
        toast.success(t("common_success"));
        setDeleteId(null);
      }
    } catch {
      toast.error(t("common_error"));
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("http://localhost:3001/users", {
          headers: { Authorization: `Bearer ${userKey || ""}` },
        });
        if (res.ok) setUsers(await res.json());
      } catch {}
    };
    fetchUsers();
  }, [userRole, userKey]);

  const handleCreateRoom = async () => {
    if (!selectedMovieId || !selectedUserId)
      return toast.error(t("common_error"));
    try {
      const res = await fetch("http://localhost:3001/private-rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userKey || ""}`,
        },
        body: JSON.stringify({
          movieId: selectedMovieId,
          invitedUserId: selectedUserId,
        }),
      });
      if (res.ok) {
        toast.success(t("backstage_create_room_title"));
        setIsRoomModalOpen(false);
        setSelectedUserId(null);
      } else {
        const data = await res.json();
        toast.error(data.error || t("common_error"));
      }
    } catch {
      toast.error(t("common_error"));
    }
  };

  return (
    <div className="p-7">
      <TopBar />
      <div className="max-w-2xl mx-auto pt-24 pb-22 space-y-6">
        <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden aspect-video">
          {currentMovie ? (
            <Player
              src={currentMovie.preview_url}
              width="100%"
              height="100%"
              controls
              playing={isPlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-white">
              <div className="text-center space-y-2">
                <Clapperboard size={48} className="mx-auto" />
                <p>{t("backstage_no_movie_selected")}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-end pb-4 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold">{t("backstage_title")}</h2>
            <p className="text-white/40 text-sm mt-1">
              {t("backstage_total_movies").replace(
                "{{count}}",
                movies.length.toString()
              )}
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-white/10 active:bg-white/20 border border-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
          >
            <Plus size={18} />
            {t("backstage_add_movie_btn")}
          </button>
        </div>

        <div className="space-y-3">
          {movies.map((m) => (
            <div
              key={m.id}
              onClick={() => {
                setCurrentMovie(m);
                setIsPlaying(true);
              }}
              className={`p-4 rounded-xl flex justify-between items-center border ${
                currentMovie?.id === m.id
                  ? "bg-purple-500/20 border-purple-500/50"
                  : "bg-white/5 border-white/5"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentMovie?.id === m.id
                      ? "bg-purple-500 text-white"
                      : "bg-white/10 text-white"
                  }`}
                >
                  <Film size={18} />
                </div>
                <div className="flex flex-col">
                  <span
                    className={
                      currentMovie?.id === m.id ? "text-white" : "text-white/70"
                    }
                  >
                    {m.title}
                  </span>
                  <span className="text-[10px] text-white/30 uppercase tracking-wider font-bold">
                    {m.added_by} •{" "}
                    {new Date(m.added_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMovieId(m.id);
                    setIsRoomModalOpen(true);
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-white active:text-yellow-500 active:bg-yellow-500/20 transition-all hover:text-yellow-400"
                >
                  <Popcorn size={18} />
                </button>
                {(userRole === "admin" || m.added_by === userProfile?.name) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(m.id);
                    }}
                    className="w-10 h-10 flex items-center justify-center rounded-lg text-white active:text-red-500 active:bg-red-500/20 transition-all hover:text-red-400"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <BottomNavbar />
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <div className="bg-[#121212] p-6 rounded-3xl w-full max-w-md border border-white/10 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">
                {t("backstage_add_movie_title")}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-white p-2"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase">
                  {t("backstage_movie_title_label")}
                </label>
                <input
                  type="text"
                  placeholder="Örn: Inception"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-purple-500/50 outline-none p-4 rounded-2xl text-white placeholder-white/20"
                />
              </div>

              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase">
                  {t("backstage_video_url_label")}
                </label>
                <input
                  type="text"
                  placeholder="https://youtube.com/..."
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-purple-500/50 outline-none p-4 rounded-2xl text-white placeholder-white/20"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 p-4 bg-white/5 border border-white/5 text-white rounded-2xl font-bold"
              >
                {t("backstage_cancel_btn")}
              </button>
              <button
                onClick={handleAddMovie}
                className="flex-1 p-4 bg-purple-600 active:bg-purple-500 text-white rounded-2xl font-bold transition-all"
              >
                {t("backstage_add_btn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {isRoomModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <div className="bg-[#121212] p-6 rounded-3xl w-full max-w-md border border-white/10 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Popcorn className="text-yellow-500" />
                {t("backstage_create_room_title")}
              </h3>
              <button
                onClick={() => setIsRoomModalOpen(false)}
                className="text-white p-2 hover:bg-white/5 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              <p className="text-sm text-white/50">
                {t("backstage_select_user_label")}
              </p>
              {users
                .filter((u) => u.name !== userProfile?.name)
                .map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      selectedUserId === u.id
                        ? "bg-yellow-500/20 border-yellow-500 text-yellow-500"
                        : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                    }`}
                  >
                    <Users size={18} />
                    <span className="font-bold text-sm">{u.name}</span>
                  </button>
                ))}
              {users.filter((u) => u.name !== userProfile?.name).length ===
                0 && (
                <div className="text-center py-4 text-white/30 text-sm">
                  {t("backstage_no_users_found")}
                </div>
              )}
            </div>

            <button
              onClick={handleCreateRoom}
              disabled={!selectedUserId}
              className="w-full p-4 bg-yellow-600 active:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-2xl font-bold transition-all"
            >
              {t("backstage_start_room_btn")}
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title={t("backstage_delete_movie_title")}
        description={t("backstage_delete_movie_desc")}
        confirmText={t("common_delete")}
        variant="danger"
        icon={<Trash2 size={32} className="text-red-500" />}
      />
    </div>
  );
}
