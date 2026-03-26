import { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

const Toast = ({ message, type = "info", onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    success: <CheckCircle size={18} className="text-green-500" />,
    error: <AlertCircle size={18} className="text-red-500" />,
    info: <Info size={18} className="text-blue-500" />
  };

  const bgStyles = {
    success: "rgba(34, 197, 94, 0.1)",
    error: "rgba(239, 68, 68, 0.1)",
    info: "rgba(59, 130, 246, 0.1)"
  };

  const borderStyles = {
    success: "rgba(34, 197, 94, 0.2)",
    error: "rgba(239, 68, 68, 0.2)",
    info: "rgba(59, 130, 246, 0.2)"
  };

  return (
    <div
      className="fixed bottom-20 md:bottom-10 left-1/2 -translate-x-1/2 z-110 w-full max-w-sm px-4 pointer-events-none bg-(--surface)"
    >
      <div 
        className="shrink-0 p-2 rounded-xl"
        style={{ background: bgStyles[type] }}
      >
        {icons[type]}
      </div>
      <p className="flex-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {message}
      </p>
      <button
        onClick={onClose}
        className="p-1 rounded-lg hover:opacity-60 transition-opacity"
        style={{ color: "var(--text-muted)" }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
