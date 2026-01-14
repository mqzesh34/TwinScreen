import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import YouTubeSyncPlayer from "../components/YouTubeSyncPlayer";
import TopBar from "../components/TopBar";
import BottomNavbar from "../components/BottomNavbar";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import { Popcorn, Play, ArrowLeft, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";
import useTranslation from "../hooks/useTranslation";

interface Room {
  id: number;
  movieId: number;
  movieTitle: string;
  movieUrl: string;
  creator: string;
  invitedUser: string;
  createdAt: string;
}
const getVideoId = (url: string): string | null => {
  const youtubeRegex =
    /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/;
  const match = url.match(youtubeRegex);
  return match ? match[1] : null;
};

export default function PrivateRoom() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [deleteRoomId, setDeleteRoomId] = useState<number | null>(null);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const { userKey } = useAuth();
  const { socket } = useSocket();
  const { t } = useTranslation();
  const { roomId: urlRoomId } = useParams();

  const fetchRooms = async () => {
    try {
      const res = await fetch("/private-rooms", {
        headers: { Authorization: `Bearer ${userKey || ""}` },
      });
      if (res.ok) {
        setRooms(await res.json());
      }
    } catch {}
  };

  const fetchRoomsWithReturn = async () => {
    try {
      const res = await fetch("/private-rooms", {
        headers: { Authorization: `Bearer ${userKey || ""}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
        return data;
      }
    } catch {}
    return null;
  };

  useEffect(() => {
    fetchRoomsWithReturn().then((roomsList) => {
      // URL'de roomId varsa ve henüz activeRoom set edilmemişse otomatik aç
      if (urlRoomId && roomsList) {
        const id = parseInt(urlRoomId.replace("private_", ""));
        const room = roomsList.find((r: Room) => r.id === id);
        if (room) setActiveRoom(room);
      }
    });

    if (socket) {
      socket.on("private_rooms_updated", fetchRooms);
    }

    const interval = setInterval(fetchRooms, 15000);
    return () => {
      if (socket) socket.off("private_rooms_updated", fetchRooms);
      clearInterval(interval);
    };
  }, [userKey, socket, urlRoomId]);

  const handleDeleteRoom = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteRoomId(id);
  };

  const confirmDelete = async () => {
    if (!deleteRoomId) return;
    try {
      const res = await fetch(`/private-rooms/${deleteRoomId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${userKey || ""}` },
      });
      if (res.ok) {
        toast.success(t("private_rooms_delete_success"));
        fetchRooms();
        if (activeRoom?.id === deleteRoomId) setActiveRoom(null);
        setDeleteRoomId(null);
      } else {
        toast.error(t("private_rooms_delete_error"));
      }
    } catch {
      toast.error(t("private_rooms_error"));
    }
  };
  const confirmDeleteAll = async () => {
    try {
      const res = await fetch("/private-rooms", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${userKey || ""}` },
      });
      if (res.ok) {
        toast.success(t("private_rooms_delete_all_success"));
        fetchRooms();
        setActiveRoom(null);
        setIsDeleteAllOpen(false);
      } else {
        toast.error(t("private_rooms_delete_error"));
      }
    } catch {
      toast.error(t("private_rooms_error"));
    }
  };

  return (
    <div className={`min-h-screen ${activeRoom ? "bg-black" : "p-7 pb-32"}`}>
      {!activeRoom && <TopBar />}

      {activeRoom ? (
        <div className="fixed inset-0 z-50 bg-black">
          <button
            onClick={() => setActiveRoom(null)}
            className="absolute top-6 left-6 z-[60] bg-black/50 p-3 rounded-full text-white hover:bg-black/70 backdrop-blur-md transition-all group border border-white/10"
          >
            <ArrowLeft
              size={24}
              className="group-hover:-translate-x-1 transition-transform"
            />
          </button>
          <YouTubeSyncPlayer
            roomId={`private_${activeRoom.id}`}
            initialVideoId={getVideoId(activeRoom.movieUrl) || ""}
            onExit={() => setActiveRoom(null)}
          />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto pt-24 space-y-6">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-400">
                <Popcorn size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {t("private_rooms_title")}
                </h2>
                <p className="text-sm text-white/40">
                  {t("private_rooms_subtitle")}
                </p>
              </div>
              {rooms.length > 0 && (
                <button
                  onClick={() => setIsDeleteAllOpen(true)}
                  className="ml-auto flex items-center gap-2 bg-red-500/10 active:bg-red-500/20 text-red-500 border border-red-500/10 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  <Trash2 size={16} />
                  {t("private_rooms_delete_all_btn")}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {rooms.length === 0 ? (
                <div className="text-center py-16 text-white bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <Popcorn size={48} className="mx-auto mb-3" />
                  <p className="text-white/50">{t("private_rooms_empty")}</p>
                </div>
              ) : (
                rooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => setActiveRoom(room)}
                    className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between group hover:border-purple-500/50 hover:bg-white/10 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="space-y-1 relative z-10">
                      <h3 className="font-bold text-lg">{room.movieTitle}</h3>
                    </div>

                    <div className="flex items-center gap-3 relative z-10">
                      <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                        <Play size={20} fill="currentColor" />
                      </div>

                      <button
                        onClick={(e) => handleDeleteRoom(room.id, e)}
                        className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors ml-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {!activeRoom && <BottomNavbar />}

      <ConfirmModal
        isOpen={!!deleteRoomId}
        onClose={() => setDeleteRoomId(null)}
        onConfirm={confirmDelete}
        title={t("private_rooms_confirm_delete_title")}
        description={t("private_rooms_confirm_delete_desc")}
        confirmText={t("private_rooms_confirm_delete_btn")}
        variant="danger"
        icon={<Trash2 size={32} className="text-red-500" />}
      />
      <ConfirmModal
        isOpen={isDeleteAllOpen}
        onClose={() => setIsDeleteAllOpen(false)}
        onConfirm={confirmDeleteAll}
        title={t("private_rooms_confirm_delete_all_title")}
        description={t("private_rooms_confirm_delete_all_desc")}
        confirmText={t("private_rooms_delete_all_btn")}
        variant="danger"
        icon={<Trash2 size={32} className="text-red-500" />}
      />
    </div>
  );
}
