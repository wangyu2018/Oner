import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeContext } from '../App';

export default function ThemeToggle() {
  const { isDark, toggle } = useThemeContext();

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun size={20} className="text-gray-600 dark:text-gray-400" />
      ) : (
        <Moon size={20} className="text-gray-600 dark:text-gray-400" />
      )}
    </button>
  );
}
