import { useState, useEffect } from "react";
import ReactPlayer from "react-player";
import TopBar from "../components/TopBar";
import BottomNavbar from "../components/BottomNavbar";
import toast from "react-hot-toast";

interface Movie {
  id: number;
  title: string;
  preview_url: string;
  added_by: string;
  added_at: string;
}

export default function Backstage() {
  const Player = ReactPlayer;
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");

  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const userKey = localStorage.getItem("user_key");

  const fetchMovies = async () => {
    try {
      const res = await fetch("http://localhost:3001/movies", {
        headers: { "x-api-key": userKey || "" },
      });
      const data = await res.json();
      if (res.ok) setMovies(data);
    } catch (err) {
      toast.error("Hata!");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    if (!userKey) return;
    try {
      const res = await fetch("http://localhost:3001/validate-key", {
        headers: { "x-api-key": userKey },
      });
      const data = await res.json();
      if (res.ok) {
        setUserName(data.name);
        setUserRole(data.role);
      }
    } catch (err) {
      console.error("User profile error", err);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchMovies();
  }, []);

  const handleAddMovie = async () => {
    if (!newTitle || !newVideoUrl) return toast.error("Eksik alan!");
    try {
      const res = await fetch("http://localhost:3001/movies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": userKey || "",
        },
        body: JSON.stringify({ title: newTitle, preview_url: newVideoUrl }),
      });
      if (res.ok) {
        toast.success("Eklendi");
        setIsAddModalOpen(false);
        setNewTitle("");
        setNewVideoUrl("");
        fetchMovies();
      }
    } catch (err) {
      toast.error("Hata!");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`http://localhost:3001/movies/${deleteId}`, {
        method: "DELETE",
        headers: { "x-api-key": userKey || "" },
      });
      if (res.ok) {
        toast.success("Silindi");
        setDeleteId(null);
        fetchMovies();
      }
    } catch (err) {
      toast.error("Hata!");
    }
  };

  return (
    <div className="p-7">
      <TopBar />
      <div className="max-w-2xl mx-auto pt-24 space-y-6">
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
            <div className="h-full flex items-center justify-center text-white/20">
              <div className="text-center space-y-2">
                <i className="ri-film-line text-4xl"></i>
                <p>Film seçilmedi</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-end pb-4 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold">Film Arşivi</h2>
            <p className="text-white/40 text-sm mt-1">
              Toplam {movies.length} film
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-white/10 active:bg-white/20 border border-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
          >
            <i className="ri-add-line text-lg"></i>
            Film Ekle
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
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  <i className="ri-movie-2-line"></i>
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
                    {new Date(m.added_at).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                </div>
              </div>

              {userRole === "admin" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(m.id);
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-white/20 active:text-red-500 active:bg-red-500/20 transition-all"
                >
                  <i className="ri-delete-bin-line text-lg"></i>
                </button>
              )}
            </div>
          ))}
        </div>

        <BottomNavbar />
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <div className="bg-[#121212] p-6 rounded-3xl w-full max-w-md border border-white/10 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Yeni Film Ekle</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/40 p-2"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase">
                  Film Başlığı
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
                  Video URL
                </label>
                <input
                  type="text"
                  placeholder="https://..."
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
                İptal
              </button>
              <button
                onClick={handleAddMovie}
                className="flex-1 p-4 bg-purple-600 active:bg-purple-500 text-white rounded-2xl font-bold transition-all"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <div className="bg-[#121212] p-6 rounded-3xl w-full max-w-sm border border-white/10 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <i className="ri-delete-bin-line text-3xl text-red-500"></i>
              </div>
              <h3 className="text-xl font-bold text-white">Emin misiniz?</h3>
              <p className="text-white/40 text-sm px-4">
                Bu film arşivden kalıcı olarak silinecektir. Bu işlem geri
                alınamaz.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 p-4 bg-white/5 border border-white/5 text-white/60 rounded-2xl font-bold"
              >
                Vazgeç
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 p-4 bg-red-500/10 active:bg-red-500/20 text-red-500 border border-red-500/20 rounded-2xl font-bold transition-all"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
