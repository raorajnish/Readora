import { Sun, Moon } from 'lucide-react';

const ThemeToggle = ({ theme, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className="p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
      style={{
        background: 'var(--surface-alt)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border)',
      }}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

export default ThemeToggle;
