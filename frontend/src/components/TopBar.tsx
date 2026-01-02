import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function TopBar() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState("");
  const userKey = localStorage.getItem("user_key");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userKey) return;
      try {
        const res = await fetch("http://localhost:3001/validate-key", {
          headers: { "x-api-key": userKey },
        });
        const data = await res.json();
        if (res.ok) setUserRole(data.role);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, [userKey]);

  const handleLogout = () => {
    localStorage.removeItem("user_key");
    navigate("/");
    toast.success("Çıkış yapıldı");
  };

  return (
    <div className="fixed top-8 left-0 right-0 flex justify-center z-50">
      <div className="w-[90%] max-w-3xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 flex items-center justify-between gap-12 overflow-hidden">
        <h1 className="text-lg font-bold tracking-tight text-white">
          TwinScreen
        </h1>

        <div className="flex items-center gap-4">
          <button className="active:opacity-70 transition-opacity cursor-pointer">
            <i className="ri-notification-2-line text-white/70 text-lg"></i>
          </button>

          {userRole === "admin" ? (
            <button
              onClick={() => navigate("/settings")}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white/70 active:bg-white/20 transition-all cursor-pointer"
            >
              <i className="ri-settings-3-line text-lg"></i>
            </button>
          ) : (
            userKey && (
              <button
                onClick={handleLogout}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 active:bg-red-500/20 transition-all cursor-pointer"
              >
                <i className="ri-logout-box-line text-lg"></i>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
