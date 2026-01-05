import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import ConfirmModal from "../components/ConfirmModal";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import {
  Settings as SettingsIcon,
  Users,
  UserPlus,
  Trash2,
  LogOut,
  Globe,
  Smartphone,
  Bell,
  Shield,
  X,
} from "lucide-react";

interface User {
  id: number;
  name: string;
  role: string;
  key: string;
}

interface RoomSettings {
  platform: "web" | "mobil" | "none";
  notifications: boolean;
}

export default function Settings() {
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [userToDeleteId, setUserToDeleteId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { userKey, userRole, logout } = useAuth();
  const settingsFetched = useRef(false);
  const usersFetched = useRef(false);
  const [settings, setSettings] = useState<RoomSettings>({
    platform: "none",
    notifications: false,
  });
  const [users, setUsers] = useState<User[]>([]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("http://localhost:3001/settings", {
        headers: { Authorization: `Bearer ${userKey || ""}` },
      });

      const data = await res.json();
      if (res.ok) setSettings(data);
    } catch (res: any) {
      const data = await res.json();
      toast.error(data.error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:3001/users", {
        headers: { Authorization: `Bearer ${userKey || ""}` },
      });

      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (err) {}
  };

  useEffect(() => {
    if (settingsFetched.current) return;
    settingsFetched.current = true;
    fetchSettings();
  }, []);

  useEffect(() => {
    usersFetched.current = true;
    fetchUsers();
  }, []);

  const handleUpdateSettings = async () => {
    try {
      const res = await fetch("http://localhost:3001/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userKey || ""}`,
        },
        body: JSON.stringify({
          platform: settings.platform,
          notifications: settings.notifications,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
      }
    } catch (res: any) {
      const data = await res.json();
      toast.error(data.error);
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
        const data = await res.json();
        toast.success(data.message);
      }
    } catch (res: any) {
      const data = await res.json();
      toast.error(data.error);
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

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <div className="p-7">
        <TopBar />
        <div className="max-w-2xl mx-auto pt-24 space-y-12">
          <section className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <SettingsIcon size={24} className="text-purple-500" />
              <h2 className="text-2xl font-bold">Genel Ayarlar</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs text-white/40 uppercase font-bold pl-1">
                  Platform
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <button
                      onClick={() =>
                        setSettings({ ...settings, platform: "web" })
                      }
                      className={`w-full p-4 rounded-2xl border-2 transition-all font-bold text-sm uppercase tracking-wider flex flex-col items-center justify-center gap-2 ${
                        settings.platform === "web"
                          ? "bg-purple-500/20 border-purple-500 text-purple-400"
                          : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                      }`}
                    >
                      <Globe size={24} />
                      Web Sayfası
                    </button>
                    <p className="text-[10px] text-white/40 text-center leading-relaxed px-1 h-8 flex items-center justify-center">
                      Gelişmiş sohbet özellikleri ve geniş ekran desteği ile tam
                      masaüstü deneyimi sunar
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() =>
                        setSettings({ ...settings, platform: "mobil" })
                      }
                      className={`w-full p-4 rounded-2xl border-2 transition-all font-bold text-sm uppercase tracking-wider flex flex-col items-center justify-center gap-2 ${
                        settings.platform === "mobil"
                          ? "bg-purple-500/20 border-purple-500 text-purple-400"
                          : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                      }`}
                    >
                      <Smartphone size={24} />
                      Mobil
                    </button>
                    <p className="text-[10px] text-white/40 text-center leading-relaxed px-1 h-8 flex items-center justify-center">
                      Tam ekran video modu ve hızlı tepki butonları ile optimize
                      edilmiş mobil deneyimi sağlar
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl bg-purple-500/20 text-purple-400`}
                    >
                      <Bell size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-sm">
                        Uygulama Dışı Bildirimler
                      </div>
                      <div className="text-[10px] text-white/40 font-medium">
                        Uygulama kapalıyken bile gelişmelerden haberdar ol
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setSettings({
                        ...settings,
                        notifications: !settings.notifications,
                      })
                    }
                    className={`w-12 h-7 rounded-full transition-all relative ${
                      settings.notifications ? "bg-purple-500" : "bg-white/10"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-lg ${
                        settings.notifications ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleUpdateSettings}
              className="w-full bg-purple-600 active:bg-purple-500 text-white font-bold py-4 rounded-2xl transition-all"
            >
              Ayarları Kaydet
            </button>
          </section>
          <div className="flex gap-3">
            {userRole === "admin" && (
              <button
                onClick={() => setIsAdminPanelOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-500/10 active:bg-blue-500/20 text-blue-500 border border-blue-500/20 font-bold py-4 rounded-2xl transition-all"
              >
                <Shield size={20} />
                Yönetici Paneli
              </button>
            )}
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className={`${
                userRole === "admin" ? "flex-1" : "w-full"
              } flex items-center justify-center gap-2 bg-red-500/10 active:bg-red-500/20 text-red-500 border border-red-500/20 font-bold py-4 rounded-2xl transition-all`}
            >
              <LogOut size={20} />
              Oturumu Kapat
            </button>
          </div>
        </div>
      </div>

      {isAdminPanelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f0f13] border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <Shield size={24} className="text-blue-500" />
                <h2 className="text-xl font-bold">Yönetici Paneli</h2>
              </div>
              <button
                onClick={() => setIsAdminPanelOpen(false)}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors"
              >
                <X size={24} className="text-white/50" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8">
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users size={20} className="text-blue-400" />
                    <h3 className="text-lg font-bold text-white/90">
                      Kullanıcı Listesi
                    </h3>
                  </div>
                  <button
                    onClick={addUser}
                    className="flex items-center gap-2 bg-blue-500/10 active:bg-blue-500/20 text-blue-500 border border-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  >
                    <UserPlus size={16} />
                    Yeni Ekle
                  </button>
                </div>

                <div className="space-y-3">
                  {users
                    .filter((u) => u.role !== "admin")
                    .map((user) => (
                      <div
                        key={user.id}
                        className="p-4 bg-white/5 border border-white/10 rounded-xl relative group hover:border-white/20 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="flex-1 w-full space-y-1">
                            <label className="text-[10px] text-white/30 uppercase font-bold pl-1">
                              İsim
                            </label>
                            <input
                              type="text"
                              value={user.name}
                              onChange={(e) =>
                                handleUserChange(
                                  user.id,
                                  "name",
                                  e.target.value
                                )
                              }
                              className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500/50 transition-all font-bold"
                            />
                          </div>

                          <div className="flex-1 w-full space-y-1">
                            <label className="text-[10px] text-white/30 uppercase font-bold pl-1">
                              Erişim Kodu
                            </label>
                            <input
                              type="text"
                              value={user.key}
                              onChange={(e) =>
                                handleUserChange(user.id, "key", e.target.value)
                              }
                              className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500/50 transition-all font-mono text-white/70"
                            />
                          </div>

                          <div className="pt-4 sm:pt-0">
                            <button
                              onClick={() => setUserToDeleteId(user.id)}
                              className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                  {users.filter((u) => u.role !== "admin").length === 0 && (
                    <div className="text-center py-8 text-white/20 text-sm">
                      Henüz hiç kullanıcı eklenmemiş.
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="p-6 border-t border-white/10 shrink-0 bg-[#0f0f13]">
              <button
                onClick={() => {
                  handleUpdateUsers();
                  setIsAdminPanelOpen(false);
                }}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/20"
              >
                Değişiklikleri Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

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
