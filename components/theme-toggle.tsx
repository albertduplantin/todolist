'use client';

import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/lib/theme-store';
import { Button } from './ui/button';
import { useEffect } from 'react';

export function ThemeToggle() {
  const { isDarkMode, toggleDarkMode } = useThemeStore();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleDarkMode}
      className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
      title={isDarkMode ? 'Mode clair' : 'Mode sombre'}
    >
      {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}

