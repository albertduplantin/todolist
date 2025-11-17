'use client';

import { useState, useEffect } from 'react';
import { Download, X, Share, MoreVertical } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Detect device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(userAgent);
    const android = /android/.test(userAgent);
    const mobile = iOS || android || /mobile/.test(userAgent);
    
    setIsIOS(iOS);
    setIsAndroid(android);
    setIsMobile(mobile);

    // Listen for install prompt (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      setShowInstructions(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    // If we have a deferred prompt (Android/Chrome), use it
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsStandalone(true);
      }
      
      setDeferredPrompt(null);
    } else {
      // Otherwise, show instructions
      setShowInstructions(true);
    }
  };

  return (
    <>
      {/* Install Button - Always visible on mobile, icon only when installed */}
      {isMobile && (
        <Button
          onClick={isStandalone ? undefined : handleInstallClick}
          variant="ghost"
          size="icon"
          className={isStandalone 
            ? "text-green-600 dark:text-green-400 cursor-default" 
            : "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"}
          title={isStandalone ? "Application installée" : "Installer l'application"}
          disabled={isStandalone}
        >
          <Download className={`h-4 w-4 ${isStandalone ? 'opacity-50' : ''}`} />
        </Button>
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white dark:bg-gray-800 p-6 max-w-md w-full relative">
            <Button
              onClick={() => setShowInstructions(false)}
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
            >
              <X className="h-4 w-4" />
            </Button>

            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Installer TaskFlow
            </h3>

            {isIOS ? (
              <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <p className="font-medium">Instructions pour iOS (iPhone/iPad) :</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0">1.</span>
                    <span>Appuyez sur le bouton <strong>Partager</strong> <Share className="inline h-4 w-4 mx-1" /> en bas de Safari</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0">2.</span>
                    <span>Faites défiler et appuyez sur <strong>"Sur l'écran d'accueil"</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0">3.</span>
                    <span>Appuyez sur <strong>"Ajouter"</strong> en haut à droite</span>
                  </li>
                </ol>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Note : Cette fonctionnalité n'est disponible que sur Safari sur iOS
                </p>
              </div>
            ) : isAndroid ? (
              <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <p className="font-medium">Instructions pour Android :</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0">1.</span>
                    <span>Appuyez sur le menu <MoreVertical className="inline h-4 w-4 mx-1" /> en haut à droite</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0">2.</span>
                    <span>Sélectionnez <strong>"Installer l'application"</strong> ou <strong>"Ajouter à l'écran d'accueil"</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0">3.</span>
                    <span>Confirmez l'installation</span>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <p>Pour installer cette application sur votre appareil mobile :</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Ouvrez le menu de votre navigateur</li>
                  <li>Recherchez l'option "Installer l'application" ou "Ajouter à l'écran d'accueil"</li>
                  <li>Suivez les instructions à l'écran</li>
                </ol>
              </div>
            )}

            <Button
              onClick={() => setShowInstructions(false)}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Compris
            </Button>
          </Card>
        </div>
      )}
    </>
  );
}

