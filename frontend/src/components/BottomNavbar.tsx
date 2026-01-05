import { NavLink } from "react-router-dom";
import { Home, Film, Popcorn } from "lucide-react";

export default function BottomNavbar() {
  const baseStyle =
    "flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-full font-medium transition-all duration-300";
  const activeStyle = `${baseStyle} text-purple-500`;
  const passiveStyle = `${baseStyle} text-white hover:text-white/80`;

  return (
    <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50 pb-safe px-6 pointer-events-none">
      <nav className="w-full max-w-[350px] bg-[#0f0f13]/90 backdrop-blur-xl border border-white/10 rounded-3xl px-2 py-2 flex items-center shadow-2xl pointer-events-auto relative">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `${isActive ? activeStyle : passiveStyle}`
          }
        >
          <Home size={22} />
          <span className="text-[10px] uppercase tracking-wider font-bold">
            Ana Sayfa
          </span>
        </NavLink>

        <div className="w-20"></div>

        <NavLink
          to="/backstage"
          className={({ isActive }) =>
            `${isActive ? activeStyle : passiveStyle}`
          }
        >
          <Film size={22} />
          <span className="text-[10px] uppercase tracking-wider font-bold">
            Filmler
          </span>
        </NavLink>

        <NavLink
          to="/private-room"
          className={({ isActive }) =>
            `absolute left-1/2 -translate-x-1/2 -top-5 w-16 h-16 rounded-full flex items-center justify-center border-[5px] border-black text-white shadow-xl shadow-purple-500/30 transition-all duration-300 ${
              isActive
                ? "bg-purple-500 scale-110"
                : "bg-purple-600 hover:scale-105"
            }`
          }
        >
          <Popcorn size={28} />
        </NavLink>
      </nav>
    </div>
  );
}
