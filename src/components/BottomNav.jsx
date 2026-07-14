import React from "react";
import { Home, Tv, Flame, Film, History } from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

const BottomNav = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Hide BottomNav on Video Player screens
  if (location.pathname.includes('/watch/')) return null;

  const isActive = (path) => {
    if (path.includes('?')) {
      const [base, query] = path.split('?');
      const param = new URLSearchParams(query).get('view');
      return location.pathname === base && searchParams.get('view') === param;
    }
    return location.pathname === path && !searchParams.get('view');
  };

  const navItems = [
    { label: "Home", icon: <Home size={22} />, path: "/" },
    { label: "Trending", icon: <Flame size={22} />, path: "/?view=trending&page=1" },
    { label: "Series", icon: <Tv size={22} />, path: "/?view=tv&page=1" },
    { label: "Movies", icon: <Film size={22} />, path: "/?view=animeMovies&page=1" },
    { label: "History", icon: <History size={22} />, path: "/history" },
  ];
  
  return (
    <div className="md:hidden lg:hidden xl:block fixed z-[100] bg-black/80 backdrop-blur-2xl border-t border-white/5 bottom-0 right-0 left-0">
      <div className="flex justify-around items-end h-16">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link key={item.label} to={item.path} className="flex flex-col items-center justify-center w-full py-2 transition-all relative">
              {active && <div className="absolute top-0 w-8 h-1 bg-White rounded-b-full shadow-[0_0_15px_rgba(219,39,119,0.8)]" />}
              <div className={`transition-all ${active ? "text-white scale-110" : "text-gray-500"}`}>{item.icon}</div>
              <span className={`text-[10px] mt-1 font-bold ${active ? "text-white" : "text-gray-500"}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav; // <--- The Export