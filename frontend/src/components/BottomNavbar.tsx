import { NavLink } from "react-router-dom";
import { Home, MessageCircleMore, Film } from "lucide-react";

export default function BottomNavbar() {
  const activeStyle =
    "flex flex-col items-center justify-center gap-1 px-6 py-2.5 rounded-full text-purple-500 font-medium transition-all duration-300";
  const passiveStyle =
    "flex flex-col items-center justify-center gap-1 px-6 py-2.5 rounded-full text-white/50 font-medium transition-all duration-300 hover:text-white/80";

  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pb-safe">
      <nav className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-full p-1.5 flex items-center gap-1 shadow-2xl">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `${isActive ? activeStyle : passiveStyle}`
          }
        >
          <Home size={20} />
          <span className="text-[10px] uppercase tracking-wider font-bold">
            Ana Sayfa
          </span>
        </NavLink>
        <NavLink
          to="/chat"
          className={({ isActive }) =>
            `${isActive ? activeStyle : passiveStyle}`
          }
        >
          <MessageCircleMore size={20} />
          <span className="text-[10px] uppercase tracking-wider font-bold">
            Sohbet
          </span>
        </NavLink>
        <NavLink
          to="/backstage"
          className={({ isActive }) =>
            `${isActive ? activeStyle : passiveStyle}`
          }
        >
          <Film size={20} />
          <span className="text-[10px] uppercase tracking-wider font-bold">
            Filmler
          </span>
        </NavLink>
      </nav>
    </div>
  );
}
