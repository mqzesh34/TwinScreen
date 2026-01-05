import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { Bell, Settings, LogOut, Home } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import NotificationsModal from "./NotificationsModal";
import { useNotifications } from "../contexts/NotificationContext";

export default function TopBar() {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { unreadCount, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
    setTimeout(() => {
      toast.success("Çıkış yapıldı");
    }, 1100);
  };

  return (
    <div className="fixed top-4 left-0 right-0 flex justify-center z-50">
      <div className="w-[90%] max-w-3xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 flex items-center justify-between gap-12 overflow-hidden">
        <h1 className="text-lg font-bold tracking-tight text-white">
          Twin<span className="text-purple-500">Screen</span>
        </h1>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setIsNotificationsOpen(true);
              markAllAsRead();
            }}
            className="relative text-white hover:text-white/80 transition-all"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-purple-500 rounded-full animate-pulse ring-2 ring-[#121212]" />
            )}
          </button>

          <button
            onClick={() =>
              navigate(pathname === "/settings" ? "/home" : "/settings")
            }
            className="text-white hover:text-white/80 transition-all"
          >
            {pathname === "/settings" ? (
              <Home size={18} />
            ) : (
              <Settings size={18} />
            )}
          </button>
        </div>
      </div>

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
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
