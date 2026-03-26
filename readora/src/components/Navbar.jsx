import { Link, useNavigate, useLocation } from "react-router-dom";
import { BookOpen, LogOut, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

const Navbar = ({ theme, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isLanding = location.pathname === "/";

  return (
    <nav
      className="hidden md:flex fixed top-0 left-0 right-0 z-50 items-center justify-between px-6 py-3"
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Brand */}
      <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
        <BookOpen size={24} style={{ color: "var(--secondary)" }} />
        <span
          className="text-xl font-bold tracking-tight"
          style={{
            fontFamily: "var(--font-lora)",
            color: "var(--text-primary)",
          }}
        >
          Readora
        </span>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <ThemeToggle theme={theme} onToggle={onToggle} />

        {user ? (
          <>
            <Link
              to="/profile"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: "var(--surface-alt)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
              }}
            >
              <User size={15} />
              {user.username}
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg transition-colors hover:opacity-70"
              style={{ color: "var(--danger)" }}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <>
            {!isLanding && (
              <Link
                to="/auth"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                style={{ color: "var(--text-secondary)" }}
              >
                Login
              </Link>
            )}
            <Link
              to="/auth?tab=register"
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-85"
              style={{
                background: "var(--primary)",
                color: "var(--background)",
              }}
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
