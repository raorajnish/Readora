import { useState } from "react";
import { X, Lock } from "lucide-react";
import { verifyPassword } from "../api/books";

const PromoCodeModal = ({ 
  book, 
  onClose, 
  onSuccess, 
  title = "Enter Promocode", 
  description = "This book requires a private access code.", 
  errorText = "Invalid Promocode",
  buttonText = "Unlock"
}) => {
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
        setError(errorText);
      }
    } catch {
      setError(errorText);
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

        {/* Icon removed */}

        <h2
          className="text-lg font-bold mb-1"
          style={{
            fontFamily: "var(--font-lora)",
            color: "var(--text-primary)",
          }}
        >
          {title}
        </h2>
        <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
          {description}
        </p>

        <form onSubmit={handleVerify} className="space-y-3">
          <div className="relative">
            <input
              type="password"
              placeholder="Enter access code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
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
            style={{ background: "var(--primary)", color: "var(--text-primary)" }}
          >
            {loading ? "Annotating..." : buttonText}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PromoCodeModal;
