import { NavLink, useNavigate } from "react-router-dom";
import { Home, Search, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const BottomNav = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const tabs = [
    { to: "/dashboard", icon: Home, label: "Home" },
    { to: "/search", icon: Search, label: "Search" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-100 md:hidden flex justify-around items-center h-16 bg-[var(--surface)] border-t border-[var(--border)] px-6 shadow-lg"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4px)",
      }}
    >
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 ${
              isActive ? "scale-105" : "opacity-60 hover:opacity-80"
            }`
          }
          style={({ isActive }) => ({
            color: isActive ? "var(--secondary)" : "var(--text-primary)",
          })}
        >
          <Icon size={22} strokeWidth={label === "Add" ? 2.5 : 2} />
          <span className="text-[10px] font-medium tracking-wide">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
