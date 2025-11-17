'use client';

import { useState } from 'react';
import { Menu, X, Home, Shield, Bell, Moon, Sun, Download, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { useThemeStore } from '@/lib/theme-store';
import { UserButton, useUser, useClerk } from '@clerk/nextjs';
import { PWAInstallPrompt } from './pwa-install-prompt';
import { NotificationPermission } from './notification-permission';

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useThemeStore();
  const { user } = useUser();
  const { signOut } = useClerk();

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Burger Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="icon"
        className="md:hidden text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Mobile Menu Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {user?.firstName || user?.username || 'Utilisateur'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
            <Button
              onClick={closeMenu}
              variant="ghost"
              size="icon"
              className="text-gray-600 dark:text-gray-400"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {/* Home */}
              <a
                href="/"
                onClick={closeMenu}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
              >
                <Home className="h-5 w-5" />
                <span className="font-medium">Accueil</span>
              </a>

              {/* Admin (if admin) */}
              {user?.publicMetadata?.isAdmin === true && (
                <a
                  href="/admin"
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <Shield className="h-5 w-5" />
                  <span className="font-medium">Administration</span>
                </a>
              )}

              {/* Divider */}
              <div className="border-t border-gray-200 dark:border-gray-700 my-4" />

              {/* Settings Section */}
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Paramètres
                </p>
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => {
                  toggleTheme();
                }}
                className="flex items-center justify-between w-full px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  <span className="font-medium">Mode sombre</span>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${theme === 'dark' ? 'ml-6' : 'ml-0.5'}`} />
                </div>
              </button>

              {/* Notifications */}
              <div className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5" />
                  <span className="font-medium">Notifications</span>
                </div>
                <NotificationPermission />
              </div>

              {/* PWA Install */}
              <div className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
                <div className="flex items-center gap-3">
                  <Download className="h-5 w-5" />
                  <span className="font-medium">Installer l'app</span>
                </div>
                <PWAInstallPrompt />
              </div>
            </div>
          </nav>

          {/* Footer - Sign Out */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                closeMenu();
                signOut();
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

