import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { Settings, LogOut, Home } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import useTranslation from "../hooks/useTranslation";

export default function TopBar() {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const { t } = useTranslation();
  const [appName, setAppName] = useState("TwinScreen");

  useEffect(() => {
    fetch("/install/status")
      .then((r) => r.json())
      .then((data) => setAppName(data.appName || "TwinScreen"))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
    setTimeout(() => {
      toast.success(t("topbar_logout_success"));
    }, 1100);
  };

  return (
    <div className="fixed top-4 left-0 right-0 flex justify-center z-50">
      <div className="w-[90%] max-w-3xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 flex items-center justify-between gap-12 overflow-hidden">
        <h1 className="text-lg font-bold tracking-tight text-white">
          {appName.includes("TwinScreen") ? (
            <>
              Twin<span className="text-purple-500">Screen</span>
            </>
          ) : (
            appName
          )}
        </h1>

        <div className="flex items-center gap-4">
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

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title={t("confirm_logout_title")}
        description={t("confirm_logout_desc")}
        confirmText={t("confirm_logout_btn")}
        variant="danger"
        icon={<LogOut size={32} className="text-red-500" />}
      />
    </div>
  );
}
