import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import BottomNavbar from "../components/BottomNavbar";
import toast from "react-hot-toast";

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
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState("");
  const [settings, setSettings] = useState<RoomSettings>({
    room_capacity: 0,
    room_name: "",
  });
  const [users, setUsers] = useState<User[]>([]);
  const userKey = localStorage.getItem("user_key");

  const fetchProfile = async () => {
    if (!userKey) return navigate("/");
    try {
      const res = await fetch("http://localhost:3001/validate-key", {
        headers: { "x-api-key": userKey },
      });
      const data = await res.json();
      if (res.ok) {
        setUserRole(data.role);
      } else {
        navigate("/");
      }
    } catch (err) {
      navigate("/");
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("http://localhost:3001/settings", {
        headers: { "x-api-key": userKey || "" },
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
        headers: { "x-api-key": userKey || "" },
      });
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (err) {
      console.error("User fetch error", err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (userRole === "admin") {
      fetchUsers();
    }
  }, [userRole]);

  const handleUpdateSettings = async () => {
    try {
      const res = await fetch("http://localhost:3001/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": userKey || "",
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
          "x-api-key": userKey || "",
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

  const deleteUser = (id: number) => {
    const userToDelete = users.find((u) => u.id === id);
    if (userToDelete?.role === "admin") {
      return toast.error("Admin kullanıcısı silinemez!");
    }
    setUsers(users.filter((u) => u.id !== id));
  };

  if (userRole !== "admin" && userRole !== "") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-7">
        <div className="text-center space-y-4">
          <i className="ri-lock-password-line text-6xl text-red-500/50"></i>
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
              <i className="ri-home-gear-line text-2xl text-purple-500"></i>
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
                <i className="ri-group-line text-2xl text-blue-500"></i>
                <h2 className="text-2xl font-bold">Kullanıcı Yönetimi</h2>
              </div>
              <button
                onClick={addUser}
                className="flex items-center gap-2 bg-blue-500/10 active:bg-blue-500/20 text-blue-500 border border-blue-500/20 px-4 py-2 rounded-xl text-xs font-bold transition-all"
              >
                <i className="ri-user-add-line"></i>
                Yeni Ekle
              </button>
            </div>

            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4 relative overflow-hidden group"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${
                        user.role === "admin"
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {user.role}
                    </span>
                    {user.role !== "admin" && (
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-white/20 active:text-red-500 p-2 transition-colors"
                      >
                        <i className="ri-delete-bin-line text-lg"></i>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-white/40 uppercase font-bold pl-1">
                        İsim
                      </label>
                      <input
                        type="text"
                        value={user.name}
                        onChange={(e) =>
                          handleUserChange(user.id, "name", e.target.value)
                        }
                        className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-white/40 uppercase font-bold pl-1">
                        Erişim Kodu (Key)
                      </label>
                      <input
                        type="text"
                        value={user.key}
                        onChange={(e) =>
                          handleUserChange(user.id, "key", e.target.value)
                        }
                        className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>
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
              onClick={() => {
                localStorage.clear();
                navigate("/");
                toast.success("Çıkış yapıldı");
              }}
              className="w-full bg-red-500/10 active:bg-red-500/20 text-red-500 border border-red-500/20 font-bold py-4 rounded-2xl transition-all"
            >
              Oturumu Kapat
            </button>
          </section>
        </div>

        <BottomNavbar />
      </div>
    </div>
  );
}
