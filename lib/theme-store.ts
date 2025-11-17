import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeStore {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  initializeTheme: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      isDarkMode: false,
      toggleDarkMode: () => {
        set((state) => {
          const newMode = !state.isDarkMode;
          // Apply to document immediately
          if (typeof window !== 'undefined') {
            if (newMode) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }
          return { isDarkMode: newMode };
        });
      },
      initializeTheme: () => {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('theme-storage');
          let isDark = false;
          
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              isDark = parsed.state?.isDarkMode || false;
            } catch (e) {
              // Fallback to system preference
              isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            }
          } else {
            // Use system preference if no stored value
            isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          }
          
          // Apply to document
          if (isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          
          // Update store
          set({ isDarkMode: isDark });
        }
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);

