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
          console.log('[ThemeStore] Toggling dark mode:', state.isDarkMode, '→', newMode);
          
          // Apply to document immediately
          if (typeof window !== 'undefined') {
            if (newMode) {
              document.documentElement.classList.add('dark');
              console.log('[ThemeStore] Added "dark" class to document');
            } else {
              document.documentElement.classList.remove('dark');
              console.log('[ThemeStore] Removed "dark" class from document');
            }
            
            // Verify
            const hasClass = document.documentElement.classList.contains('dark');
            console.log('[ThemeStore] Document has "dark" class:', hasClass);
          }
          return { isDarkMode: newMode };
        });
      },
      initializeTheme: () => {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('theme-storage');
          let isDark = false;
          
          console.log('[ThemeStore] Initializing theme, stored value:', stored);
          
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              isDark = parsed.state?.isDarkMode || false;
              console.log('[ThemeStore] Parsed stored value:', isDark);
            } catch (e) {
              // Fallback to system preference
              isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              console.log('[ThemeStore] Parse error, using system preference:', isDark);
            }
          } else {
            // Use system preference if no stored value
            isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            console.log('[ThemeStore] No stored value, using system preference:', isDark);
          }
          
          // Apply to document
          if (isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          
          console.log('[ThemeStore] Theme initialized:', isDark, 'Document has dark class:', document.documentElement.classList.contains('dark'));
          
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

