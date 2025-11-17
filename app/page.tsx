'use client';

import { useEffect } from 'react';
import { useChatStore } from '@/lib/store';
import { Logo } from '@/components/logo';
import { TodoList } from '@/components/todo-list';
import { ChatInterface } from '@/components/chat-interface';
import { UserButton, useUser } from '@clerk/nextjs';
import { ThemeToggle } from '@/components/theme-toggle';
import { PWAInstallButton } from '@/components/pwa-install-button';
import { NotificationPermission } from '@/components/notification-permission';

export default function Home() {
  const { isChatMode } = useChatStore();
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If in chat mode, show chat interface
  if (isChatMode) {
    return <ChatInterface />;
  }

  // Otherwise show todo list (the cover app)
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-10 transition-colors">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">TaskFlow</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Gestion de tâches
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PWAInstallButton />
            <NotificationPermission />
            <ThemeToggle />
            {user?.publicMetadata?.isAdmin === true && (
              <a
                href="/admin"
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors"
              >
                Admin
              </a>
            )}
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Bonjour, {user?.firstName || 'Utilisateur'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <TodoList />
      </main>
    </div>
  );
}
