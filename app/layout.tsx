import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";
import "./globals.css";
import { InactivityMonitor } from "@/components/inactivity-monitor";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TaskFlow - Gestionnaire de Tâches",
  description: "Une application simple et efficace pour gérer vos tâches quotidiennes",
  manifest: "/manifest.json",
  themeColor: "#3b82f6",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TaskFlow",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={frFR}>
      <html lang="fr">
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#3B82F6" />
          {/* Initialize theme before React renders to avoid flash */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    const stored = localStorage.getItem('theme-storage');
                    let isDark = false;
                    
                    if (stored) {
                      const parsed = JSON.parse(stored);
                      isDark = parsed.state?.isDarkMode || false;
                    } else {
                      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    }
                    
                    if (isDark) {
                      document.documentElement.classList.add('dark');
                    }
                  } catch (e) {
                    console.error('Theme initialization error:', e);
                  }
                })();
              `,
            }}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js')
                      .then(reg => console.log('SW registered:', reg))
                      .catch(err => console.log('SW registration failed:', err));
                  });
                }
              `,
            }}
          />
        </head>
        <body className={inter.className}>
          {children}
          <InactivityMonitor />
        </body>
      </html>
    </ClerkProvider>
  );
}
