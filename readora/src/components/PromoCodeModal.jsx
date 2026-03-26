import { useState } from "react";
import { X, Lock, KeyRound } from "lucide-react";
import { verifyPassword } from "../api/books";

const PromoCodeModal = ({ book, onClose, onSuccess }) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await verifyPassword(book.id, code);
      if (res.data.access) {
        onSuccess();
      } else {
        setError("Invalid Promocode");
      }
    } catch {
      setError("Invalid Promocode");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(13,27,42,0.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 relative animate-slide-up"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-xl)",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full transition-colors hover:opacity-60"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "var(--primary)", color: "var(--background)" }}
        >
          <KeyRound size={22} />
        </div>

        <h2
          className="text-lg font-bold mb-1"
          style={{
            fontFamily: "var(--font-lora)",
            color: "var(--text-primary)",
          }}
        >
          Enter Promocode
        </h2>
        <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
          This book requires a private access code.
        </p>

        <form onSubmit={handleVerify} className="space-y-3">
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="password"
              placeholder="Enter access code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "var(--surface-alt)",
                border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
                color: "var(--text-primary)",
              }}
              autoFocus
            />
          </div>

          {error && (
            <p
              className="text-xs font-medium"
              style={{ color: "var(--danger)" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-85 active:scale-95 disabled:opacity-50"
            style={{ background: "var(--primary)", color: "var(--background)" }}
          >
            {loading ? "Verifying..." : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PromoCodeModal;
