import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { Bell, Settings, LogOut, Home } from "lucide-react";
import ConfirmModal from "./ConfirmModal";

export default function TopBar() {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { userKey, userRole, logout } = useAuth();
  const isSettingsPage = pathname === "/settings";

  const handleLogout = () => {
    logout();
    navigate("/");
    setTimeout(() => {
      toast.success("Çıkış yapıldı");
    }, 1100);
  };

  return (
    <div className="fixed top-8 left-0 right-0 flex justify-center z-50">
      <div className="w-[90%] max-w-3xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 flex items-center justify-between gap-12 overflow-hidden">
        <h1 className="text-lg font-bold tracking-tight text-white">
          TwinScreen
        </h1>

        <div className="flex items-center gap-4">
          <button className="active:opacity-70 transition-opacity">
            <Bell size={20} className="text-white/70" />
          </button>

          {userRole === "admin" ? (
            <button
              onClick={() => navigate(isSettingsPage ? "/home" : "/settings")}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white/70 active:bg-white/20 transition-all"
            >
              {isSettingsPage ? <Home size={18} /> : <Settings size={18} />}
            </button>
          ) : (
            userKey && (
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 active:bg-red-500/20 transition-all"
              >
                <LogOut size={18} />
              </button>
            )
          )}
        </div>
      </div>

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
