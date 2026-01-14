import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import useTranslation from "../hooks/useTranslation";

export default function LoginPage() {
  const [key, setKey] = useState("");
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();

  const [appName, setAppName] = useState("TwinScreen");

  useEffect(() => {
    fetch("/install/status")
      .then((r) => r.json())
      .then((data) => setAppName(data.appName || "TwinScreen"))
      .catch(() => {});

    if (isAuthenticated) {
      navigate("/home");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      toast.error(t("login_please_enter_key"));
      return;
    }

    setKey("");
    const success = await login(key);

    if (success) {
      navigate("/home");
      setTimeout(() => {
        toast.success(t("login_success"));
      }, 1100);
    } else {
      toast.error(t("login_invalid"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden selection:bg-purple-500/60 selection:text-white">
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[450px] bg-purple-600/40 blur-[40px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[450px] bg-blue-600/30 blur-[60px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-sm p-8 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10">
        <div className="text-center mb-8 space-y-1">
          <h1 className="text-3xl font-bold text-white tracking-tighter">
            {appName.includes("TwinScreen") ? (
              <>
                Twin<span className="text-purple-500">Screen</span>
              </>
            ) : (
              appName
            )}
          </h1>
          <p className="text-sm text-white/40">{t("login_subtitle")}</p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={t("login_placeholder")}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-white/10 border border-white/10 text-white font-bold py-3 rounded-xl transition-transform active:scale-95 active:bg-purple-600/80 active:border-purple-500 flex items-center justify-center"
          >
            {authLoading ? t("login_loading") : t("login_button")}
          </button>
        </form>
      </div>
    </div>
  );
}
