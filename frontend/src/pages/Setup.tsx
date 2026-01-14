import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  UserPlus,
  Trash2,
  RefreshCw,
  ShieldAlert,
  Copy,
} from "lucide-react";
import toast from "react-hot-toast";
import useTranslation from "../hooks/useTranslation";

export default function Setup() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [adminName, setAdminName] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [appName, setAppName] = useState("TwinScreen");

  const [port, setPort] = useState("3001");
  const [jwtSecret, setJwtSecret] = useState("jwt_key");
  const [vapidEmail, setVapidEmail] = useState("mailto:admin@twinscreen.com");
  const [vapidPublic, setVapidPublic] = useState("");
  const [vapidPrivate, setVapidPrivate] = useState("");

  const [users, setUsers] = useState<Array<{ name: string; key: string }>>([
    { name: "", key: "" },
  ]);

  useEffect(() => {
    fetch("/install/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.config) {
          setPort(data.config.PORT?.toString() || "3001");
          setJwtSecret(data.config.JWT_SECRET || "jwt_key");
          setVapidEmail(data.config.VAPID_EMAIL || "");
          setVapidPublic(data.config.VAPID_PUBLIC_KEY || "");
          setVapidPrivate(data.config.VAPID_PRIVATE_KEY || "");
        }
      });
  }, []);

  const generateVapidKeys = async () => {
    try {
      const res = await fetch("/install/generate-keys");
      const data = await res.json();
      setVapidPublic(data.publicKey);
      setVapidPrivate(data.privateKey);
      toast.success(t("common_success"));
    } catch (error) {
      toast.error(t("common_error"));
    }
  };

  const generateRandomCode = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const handleGenerateAdminKey = () => {
    setAdminKey(generateRandomCode());
    toast.success(t("common_success"));
  };

  const handleGenerateUserKey = (index: number) => {
    updateUserField(index, "key", generateRandomCode());
    toast.success(t("common_success"));
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Kopyalandı!");
  };

  const generateJwtSecret = () => {
    const random = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    setJwtSecret(random);
    toast.success(t("common_success"));
  };

  const addUserField = () => {
    setUsers([...users, { name: "", key: "" }]);
  };

  const removeUserField = (index: number) => {
    setUsers(users.filter((_, i) => i !== index));
  };

  const updateUserField = (
    index: number,
    field: "name" | "key",
    value: string
  ) => {
    const newUsers = [...users];
    newUsers[index][field] = value;
    setUsers(newUsers);
  };

  const handleNext = () => {
    if (step === 1 && (!adminName || !adminKey || !appName)) {
      toast.error(t("login_please_enter_key"));
      return;
    }
    setDirection(1);
    setStep(step + 1);
  };

  const handlePrev = () => {
    setDirection(-1);
    setStep(step - 1);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminName,
          adminKey,
          appName,
          users: users.filter((u) => u.name && u.key),
          advancedConfig: {
            PORT: port,
            JWT_SECRET: jwtSecret,
            VAPID_EMAIL: vapidEmail,
            VAPID_PUBLIC_KEY: vapidPublic,
            VAPID_PRIVATE_KEY: vapidPrivate,
          },
        }),
      });

      if (res.ok) {
        toast.success(t("setup_finish_title"));
        window.location.href = "/";
      } else {
        const data = await res.json();
        toast.error(data.error || t("common_error"));
      }
    } catch (error) {
      toast.error(t("common_error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 20 : -20,
      opacity: 0,
      filter: "blur(4px)",
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 20 : -20,
      opacity: 0,
      filter: "blur(4px)",
    }),
  };

  const springTransition = {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden selection:bg-purple-500/60 selection:text-white">
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[450px] bg-purple-600/30 blur-[40px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[450px] bg-blue-600/20 blur-[60px] rounded-full pointer-events-none" />

      <motion.div
        layout
        className="relative w-full max-w-lg p-10 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl z-10 mx-4"
      >
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
          <p className="text-sm text-white/40">{t("setup_subtitle")}</p>

          <AnimatePresence>
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="overflow-hidden"
              >
                <div className="mt-4 flex items-start gap-3 p-3 bg-purple-500/5 border border-purple-500/10 rounded-2xl text-left mx-auto max-w-[90%]">
                  <ShieldAlert
                    className="text-purple-500 shrink-0 mt-0.5"
                    size={14}
                  />
                  <p className="text-[10px] text-purple-200/60 leading-relaxed font-bold uppercase tracking-wider">
                    GÜVENLİĞİNİZ İÇİN{" "}
                    <span className="text-purple-400">JWT SECRET</span> VE{" "}
                    <span className="text-purple-400">VAPID</span>{" "}
                    ANAHTARLARINIZI GÜNCELLEMENİZ ÖNERİLİR.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-2 mb-8 px-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-700 ${
                step >= i ? "bg-purple-500" : "bg-white/5"
              }`}
            />
          ))}
        </div>

        <div className="relative overflow-visible min-h-[220px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={springTransition}
              className="w-full"
            >
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-white/30 uppercase tracking-wider">
                      Uygulama Adı
                    </label>
                    <input
                      type="text"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="Örn: TwinScreen"
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-white/30 uppercase tracking-wider">
                        Yönetici Adı
                      </label>
                      <input
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="Admin"
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-xs font-semibold text-white/30 uppercase tracking-wider">
                          Giriş Kodu
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => copyToClipboard(adminKey)}
                            className="text-white/20 hover:text-white transition-colors p-1"
                            title="Kopyala"
                          >
                            <Copy size={12} />
                          </button>
                          <button
                            onClick={handleGenerateAdminKey}
                            className="text-purple-500/60 hover:text-purple-400 transition-colors p-1"
                            title="Rastgele Üret"
                          >
                            <RefreshCw size={12} />
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={adminKey}
                        onChange={(e) => setAdminKey(e.target.value)}
                        placeholder="Erişim Kodu"
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 transition-colors font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-[1fr_2fr] gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-white/20 uppercase font-bold tracking-widest ml-1">
                        Port
                      </label>
                      <input
                        type="text"
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all font-bold"
                        placeholder="3001"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[10px] text-white/20 uppercase font-bold tracking-widest">
                          JWT Secret Key
                        </label>
                        <button
                          onClick={generateJwtSecret}
                          className="text-purple-500/60 hover:text-purple-400 transition-colors p-1 rounded-lg hover:bg-purple-500/10"
                        >
                          <RefreshCw size={12} />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={jwtSecret}
                        onChange={(e) => setJwtSecret(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all font-mono text-sm tracking-widest"
                        placeholder="JWT Secret"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between ml-1">
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                        Anlık Bildirim (VAPID)
                      </span>
                      <button
                        onClick={generateVapidKeys}
                        className="text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-widest"
                      >
                        {t("setup_vapid_generate_btn")}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={vapidEmail}
                      onChange={(e) => setVapidEmail(e.target.value)}
                      placeholder="İletişim E-postası (mailto:admin@domain.com)"
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-bold transition-all"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-[9px] font-mono p-3 bg-black/40 rounded-xl border border-white/5 text-white/20 truncate">
                        {vapidPublic || "Public Key"}
                      </div>
                      <div className="text-[9px] font-mono p-3 bg-black/40 rounded-xl border border-white/5 text-white/20 truncate">
                        {vapidPrivate || "Private Key"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-white/30 uppercase tracking-wider">
                      {t("setup_users_title")}
                    </label>
                    <button
                      onClick={addUserField}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white transition-all"
                    >
                      <UserPlus size={14} />
                      {t("admin_add_new_btn")}
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                    {users.map((u, i) => (
                      <div key={i} className="flex gap-2 group">
                        <input
                          type="text"
                          value={u.name}
                          onChange={(e) =>
                            updateUserField(i, "name", e.target.value)
                          }
                          placeholder="İsim"
                          className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                        />
                        <div className="flex-1 relative group/key">
                          <input
                            type="text"
                            value={u.key}
                            onChange={(e) =>
                              updateUserField(i, "key", e.target.value)
                            }
                            placeholder="Kod"
                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-4 pr-16 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50 font-mono"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/key:opacity-100 transition-opacity">
                            <button
                              onClick={() => copyToClipboard(u.key)}
                              className="text-white/20 hover:text-white transition-colors p-1"
                            >
                              <Copy size={12} />
                            </button>
                            <button
                              onClick={() => handleGenerateUserKey(i)}
                              className="text-purple-500/60 hover:text-purple-400 transition-colors p-1"
                            >
                              <RefreshCw size={12} />
                            </button>
                          </div>
                        </div>
                        {users.length > 1 && (
                          <button
                            onClick={() => removeUserField(i)}
                            className="p-2 text-white/10 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-purple-500/10 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
                    <CheckCircle2 size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    {t("setup_finish_title")}
                  </h2>
                  <p className="text-sm text-white/40 px-6 font-medium">
                    {t("setup_finish_desc")}
                  </p>

                  <div className="bg-black/20 border border-white/5 rounded-2xl p-5 text-left grid grid-cols-2 gap-6">
                    <div>
                      <span className="text-[10px] text-white/20 block uppercase font-black tracking-widest mb-1">
                        {t("admin_user_name")}
                      </span>
                      <span className="text-base font-bold text-white">
                        {adminName || "Admin"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/20 block uppercase font-black tracking-widest mb-1">
                        Server Port
                      </span>
                      <span className="text-base font-bold text-white">
                        {port}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex gap-4 mt-6">
          {step > 1 && (
            <button
              onClick={handlePrev}
              className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-bold transition-all active:scale-95 flex items-center justify-center"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          <button
            onClick={step < 4 ? handleNext : handleFinish}
            disabled={isSubmitting}
            className={`flex-1 py-4 font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
              step < 4
                ? "bg-white/10 border border-white/10 text-white hover:bg-white/20"
                : "bg-purple-600 border border-purple-500 text-white shadow-xl shadow-purple-600/20 hover:bg-purple-500"
            }`}
          >
            {isSubmitting ? (
              <RefreshCw className="animate-spin" size={20} />
            ) : (
              <>
                <span className="uppercase text-xs tracking-widest font-black">
                  {step < 4 ? t("setup_next") : t("setup_complete_btn")}
                </span>
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
