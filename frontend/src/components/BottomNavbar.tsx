import { NavLink } from "react-router-dom";

export default function BottomNavbar() {
  const activeStyle =
    "flex items-center gap-2 px-6 py-3 rounded-full text-purple-500 font-medium";
  const passiveStyle =
    "flex items-center gap-2 px-6 py-3 rounded-full text-white/50 font-medium";

  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pb-safe ">
      <div>
        <nav className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-full p-1.5 flex items-center gap-1 shadow-2xl ">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `${isActive ? activeStyle : passiveStyle}`
            }
          >
            <i className="ri-home-2-fill text-xl"></i>
            <span className="text-sm">Ana Sayfa</span>
          </NavLink>

          <NavLink
            to="/backstage"
            className={({ isActive }) =>
              `${isActive ? activeStyle : passiveStyle}`
            }
          >
            <i className="ri-youtube-fill text-xl"></i>
            <span className="text-sm">Film Yöneticisi</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
}
