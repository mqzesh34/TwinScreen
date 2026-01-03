import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import ConfirmModal from "../components/ConfirmModal";

import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import {
  Lock,
  Settings as SettingsIcon,
  Users,
  UserPlus,
  Trash2,
  LogOut,
} from "lucide-react";

interface User {
  id: number;
  name: string;
  role: string;
  key: string;
}

interface RoomSettings {
  room_capacity: number;
  room_name: string;
}

export default function Settings() {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [userToDeleteId, setUserToDeleteId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { userKey, userRole, logout } = useAuth();

  const settingsFetched = useRef(false);
  const usersFetched = useRef(false);

  const [settings, setSettings] = useState<RoomSettings>({
    room_capacity: 0,
    room_name: "",
  });
  const [users, setUsers] = useState<User[]>([]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("http://localhost:3001/settings", {
        headers: { Authorization: `Bearer ${userKey || ""}` },
      });

      const data = await res.json();
      if (res.ok) setSettings(data);
    } catch (err) {
      toast.error("Ayarlar yüklenemedi!");
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:3001/users", {
        headers: { Authorization: `Bearer ${userKey || ""}` },
      });

      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (err) {
      // Sessiz hata yönetimi
    }
  };

  useEffect(() => {
    if (settingsFetched.current) return;
    settingsFetched.current = true;
    fetchSettings();
  }, []);

  useEffect(() => {
    if (userRole === "admin" && !usersFetched.current) {
      usersFetched.current = true;
      fetchUsers();
    }
  }, [userRole]);

  const handleUpdateSettings = async () => {
    try {
      const res = await fetch("http://localhost:3001/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userKey || ""}`,
        },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success("Oda ayarları güncellendi");
      }
    } catch (err) {
      toast.error("Hata oluştu!");
    }
  };

  const handleUpdateUsers = async () => {
    try {
      const res = await fetch("http://localhost:3001/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userKey || ""}`,
        },
        body: JSON.stringify({ users }),
      });
      if (res.ok) {
        toast.success("Kullanıcılar güncellendi");
      }
    } catch (err) {
      toast.error("Hata oluştu!");
    }
  };

  const handleUserChange = (id: number, field: keyof User, value: string) => {
    setUsers(users.map((u) => (u.id === id ? { ...u, [field]: value } : u)));
  };

  const addUser = () => {
    const newUser: User = {
      id: Date.now(),
      name: "Yeni Kullanıcı",
      role: "user",
      key: "key_" + Math.random().toString(36).substring(7),
    };
    setUsers([...users, newUser]);
  };

  const handleConfirmDeleteUser = () => {
    if (userToDeleteId) {
      setUsers(users.filter((u) => u.id !== userToDeleteId));
      setUserToDeleteId(null);
      toast.success("Kullanıcı listeden kaldırıldı");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setTimeout(() => {
      toast.success("Çıkış yapıldı");
    }, 1100);
  };

  if (userRole !== "admin" && userRole !== "") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-7">
        <div className="text-center space-y-4">
          <Lock size={64} className="text-red-500/50 mx-auto" />
          <h1 className="text-2xl font-bold">Yetkisiz Erişim</h1>
          <p className="text-white/40">
            Bu sayfayı görüntülemek için admin yetkisine sahip olmanız
            gerekmektedir.
          </p>
          <button
            onClick={() => navigate("/home")}
            className="bg-white/10 px-6 py-2 rounded-xl border border-white/10"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <div className="p-7">
        <TopBar />

        <div className="max-w-2xl mx-auto pt-24 space-y-12">
          <section className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <SettingsIcon size={24} className="text-purple-500" />
              <h2 className="text-2xl font-bold">Oda Ayarları</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs text-white/40 uppercase font-bold pl-1">
                  Oda İsmi
                </label>
                <input
                  type="text"
                  value={settings.room_name}
                  onChange={(e) =>
                    setSettings({ ...settings, room_name: e.target.value })
                  }
                  disabled={userRole !== "admin"}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-purple-500/50 disabled:opacity-50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white/40 uppercase font-bold pl-1">
                  Oda Kapasitesi
                </label>
                <input
                  type="number"
                  value={settings.room_capacity}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      room_capacity: parseInt(e.target.value),
                    })
                  }
                  disabled={userRole !== "admin"}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-purple-500/50 disabled:opacity-50 transition-all"
                />
              </div>
            </div>

            {userRole === "admin" && (
              <button
                onClick={handleUpdateSettings}
                className="w-full bg-purple-600 active:bg-purple-500 text-white font-bold py-4 rounded-2xl transition-all"
              >
                Oda Ayarlarını Kaydet
              </button>
            )}
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Users size={24} className="text-blue-500" />
                <h2 className="text-2xl font-bold">Kullanıcı Yönetimi</h2>
              </div>
              <button
                onClick={addUser}
                className="flex items-center gap-2 bg-blue-500/10 active:bg-blue-500/20 text-blue-500 border border-blue-500/20 px-4 py-2 rounded-xl text-xs font-bold transition-all"
              >
                <UserPlus size={16} />
                Yeni Ekle
              </button>
            </div>

            <div className="space-y-4">
              {users
                .filter((u) => u.role !== "admin")
                .map((user) => (
                  <div
                    key={user.id}
                    className="p-5 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden group"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                      {/* Rol Etiketi */}
                      <div className="space-y-1.5 min-w-[100px]">
                        <label className="text-[10px] text-white/40 uppercase font-bold pl-1">
                          Rol
                        </label>
                        <div className="w-full text-[10px] font-bold px-3 py-3 rounded-xl uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30 text-center">
                          Kullanıcı
                        </div>
                      </div>

                      {/* İsim Girişi */}
                      <div className="flex-1 space-y-1.5 w-full">
                        <label className="text-[10px] text-white/40 uppercase font-bold pl-1">
                          İsim
                        </label>
                        <input
                          type="text"
                          value={user.name}
                          onChange={(e) =>
                            handleUserChange(user.id, "name", e.target.value)
                          }
                          className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm outline-none focus:border-purple-500/50 transition-all"
                        />
                      </div>

                      {/* Key Girişi */}
                      <div className="flex-1 space-y-1.5 w-full">
                        <label className="text-[10px] text-white/40 uppercase font-bold pl-1">
                          Erişim Kodu
                        </label>
                        <input
                          type="text"
                          value={user.key}
                          onChange={(e) =>
                            handleUserChange(user.id, "key", e.target.value)
                          }
                          className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm outline-none focus:border-blue-500/50 transition-all font-mono"
                        />
                      </div>

                      {/* Silme Butonu */}
                      {user.role !== "admin" && (
                        <button
                          onClick={() => setUserToDeleteId(user.id)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-3 rounded-xl transition-colors mb-[2px]"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            <button
              onClick={handleUpdateUsers}
              className="w-full bg-blue-600 active:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/20"
            >
              Kullanıcıları Sisteme Kaydet
            </button>
          </section>

          <section className="pt-6 border-t border-white/10">
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-red-500/10 active:bg-red-500/20 text-red-500 border border-red-500/20 font-bold py-4 rounded-2xl transition-all"
            >
              <LogOut size={20} />
              Oturumu Kapat
            </button>
          </section>
        </div>
      </div>

      {/* Kullanıcı Silme Onay Modalı */}
      <ConfirmModal
        isOpen={!!userToDeleteId}
        onClose={() => setUserToDeleteId(null)}
        onConfirm={handleConfirmDeleteUser}
        title="Kullanıcı Silinsin mi?"
        description="Bu kullanıcıyı listeden kaldırmak istediğinizden emin misiniz? Değişikliklerin kalıcı olması için kaydetmeyi unutmayın."
        confirmText="Sil"
        variant="danger"
        icon={<Trash2 size={32} className="text-red-500" />}
      />

      {/* Oturum Kapatma Onay Modalı */}
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Oturumu Kapat?"
        description="Mevcut oturumunuz sonlandırılacak. Devam etmek istiyor musunuz?"
        confirmText="Çıkış Yap"
        variant="danger"
        icon={<LogOut size={32} className="text-red-500" />}
      />
    </div>
  );
}
