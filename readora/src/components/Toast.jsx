import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

const Toast = ({ message, type = "info", onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    success: <CheckCircle size={20} style={{ color: "var(--success)" }} />,
    error: <AlertCircle size={20} style={{ color: "var(--danger)" }} />,
    info: <Info size={20} style={{ color: "var(--info)" }} />
  };

  const toastContent = (
    <div className="fixed top-1/5 left-1/2 z-200 w-full max-w-sm mx-auto pointer-events-none flex justify-center align-center">
      <div 
        className="pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-2xl border animate-toast-in"
        style={{ 
          background: "rgba(13, 27, 42, 0.92)", 
          borderColor: `var(--${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'})`,
          boxShadow: `0 12px 40px rgba(0, 0, 0, 0.5)`
        }}
      >
        <div className="shrink-0">
          {icons[type]}
        </div>
        
        <p className="flex-1 text-sm font-semibold text-white tracking-wide">
          {message}
        </p>

        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-white/10 transition-colors text-white/40 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );

  return createPortal(toastContent, document.body);
};

export default Toast;
