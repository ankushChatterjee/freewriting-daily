import { useState, useEffect, useRef } from 'react';
import { Palette } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const themes = [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
    { id: 'cafe', label: 'Cafe' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleThemeSelect = (themeId) => {
    setTheme(themeId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 transition-opacity hover:opacity-70"
        style={{
          color: 'var(--text-primary)',
          cursor: 'pointer',
        }}
        title="Change theme"
      >
        <Palette size={18} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-1 py-1 z-50"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            minWidth: '100px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => handleThemeSelect(t.id)}
              className="w-full px-3 py-2 text-left transition-all"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                backgroundColor: theme === t.id ? 'var(--border-color)' : 'transparent',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (theme !== t.id) {
                  e.currentTarget.style.backgroundColor = 'var(--text-tertiary)';
                  e.currentTarget.style.opacity = '0.8';
                }
              }}
              onMouseLeave={(e) => {
                if (theme !== t.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.opacity = '1';
                }
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

