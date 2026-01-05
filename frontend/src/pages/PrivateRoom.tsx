import { useState, useEffect } from "react";
import ReactPlayer from "react-player";
import TopBar from "../components/TopBar";
import BottomNavbar from "../components/BottomNavbar";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import { Popcorn, Play, ArrowLeft, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";

interface Room {
  id: number;
  movieId: number;
  movieTitle: string;
  movieUrl: string;
  creator: string;
  invitedUser: string;
  createdAt: string;
}

export default function PrivateRoom() {
  const Player = ReactPlayer;
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [deleteRoomId, setDeleteRoomId] = useState<number | null>(null);
  const { userKey, userProfile } = useAuth();
  const { socket } = useSocket();

  const fetchRooms = async () => {
    try {
      const res = await fetch("http://localhost:3001/private-rooms", {
        headers: { Authorization: `Bearer ${userKey || ""}` },
      });
      if (res.ok) {
        setRooms(await res.json());
      }
    } catch {}
  };

  useEffect(() => {
    fetchRooms();

    if (socket) {
      socket.on("private_rooms_updated", fetchRooms);
    }

    const interval = setInterval(fetchRooms, 15000);
    return () => {
      if (socket) socket.off("private_rooms_updated", fetchRooms);
      clearInterval(interval);
    };
  }, [userKey, socket]);

  const handleDeleteRoom = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteRoomId(id);
  };

  const confirmDelete = async () => {
    if (!deleteRoomId) return;
    try {
      const res = await fetch(
        `http://localhost:3001/private-rooms/${deleteRoomId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${userKey || ""}` },
        }
      );
      if (res.ok) {
        toast.success("Oda kapatıldı");
        fetchRooms();
        if (activeRoom?.id === deleteRoomId) setActiveRoom(null);
        setDeleteRoomId(null);
      } else {
        toast.error("Silinemedi");
      }
    } catch {
      toast.error("Hata");
    }
  };

  return (
    <div className="p-7 min-h-screen pb-32">
      <TopBar />

      <div className="max-w-2xl mx-auto pt-24 space-y-6">
        {activeRoom ? (
          <div className="space-y-4">
            <button
              onClick={() => setActiveRoom(null)}
              className="flex items-center gap-2 text-white hover:text-white/80 transition-colors"
            >
              <ArrowLeft size={20} />
              Odadan Ayrıl
            </button>

            <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden aspect-video relative group">
              <Player
                src={activeRoom.movieUrl}
                width="100%"
                height="100%"
                controls
                playing
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-400">
                <Popcorn size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Özel Odalar</h2>
                <p className="text-sm text-white/40">
                  Size özel davetler ve aktif odalar
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {rooms.length === 0 ? (
                <div className="text-center py-16 text-white bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <Popcorn size={48} className="mx-auto mb-3" />
                  <p className="text-white/50">
                    Henüz aktif bir oda veya davet yok.
                  </p>
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
                      <div className="text-xs text-white/40 flex items-center">
                        {userProfile?.name === room.creator ? (
                          <>
                            <span className="text-purple-400 font-bold mr-1">
                              {room.invitedUser}
                            </span>{" "}
                            kişisini davet ettin
                          </>
                        ) : userProfile?.name === room.invitedUser ? (
                          <>
                            <span className="text-purple-400 font-bold mr-1">
                              {room.creator}
                            </span>{" "}
                            tarafından davet edildin
                          </>
                        ) : (
                          <>
                            <span className="text-white/60 mr-1">
                              {room.creator}
                            </span>
                            <span className="mx-1">→</span>
                            <span className="text-white/60">
                              {room.invitedUser}
                            </span>
                          </>
                        )}
                      </div>
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
        )}
      </div>

      <BottomNavbar />

      <ConfirmModal
        isOpen={!!deleteRoomId}
        onClose={() => setDeleteRoomId(null)}
        onConfirm={confirmDelete}
        title="Odayı Kapat"
        description="Bu oda tüm katılımcılar için kapanacaktır. Emin misiniz?"
        confirmText="Kapat"
        variant="danger"
        icon={<Trash2 size={32} className="text-red-500" />}
      />
    </div>
  );
}
