'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import { Button } from './ui/button';

export function NotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      setIsSupported(true);
    } else {
      setIsSupported(false);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Les notifications ne sont pas supportées par votre navigateur.');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        new Notification('TaskFlow', {
          body: 'Notifications activées ! Vous recevrez des alertes pour les nouveaux messages.',
          icon: '/icon-192x192.png',
        });
      } else if (result === 'denied') {
        alert('Vous avez refusé les notifications. Vous pouvez les réactiver dans les paramètres de votre navigateur.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      alert('Erreur lors de la demande de permission pour les notifications.');
    }
  };

  if (!isSupported) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="text-gray-400 cursor-not-allowed"
        disabled
        title="Notifications non supportées"
      >
        <BellOff className="h-4 w-4" />
      </Button>
    );
  }

  if (permission === 'granted') {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
        title="Notifications activées"
        disabled
      >
        <Check className="h-4 w-4" />
      </Button>
    );
  }

  if (permission === 'denied') {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
        title="Notifications bloquées - réactiver dans les paramètres du navigateur"
        disabled
      >
        <BellOff className="h-4 w-4" />
      </Button>
    );
  }

  // Default state - request permission
  return (
    <Button
      onClick={requestPermission}
      variant="ghost"
      size="icon"
      className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
      title="Activer les notifications"
    >
      <Bell className="h-4 w-4" />
    </Button>
  );
}

// Function to send notification (can be called from anywhere)
export function sendNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
    });
  }
}

