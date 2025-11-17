'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from './ui/button';

export function NotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        new Notification('TaskFlow', {
          body: 'Notifications activées ! Vous recevrez des alertes pour les nouveaux messages.',
          icon: '/icon-192x192.png',
        });
      }
    }
  };

  if (permission === 'granted' || permission === 'denied') {
    return null;
  }

  return (
    <Button
      onClick={requestPermission}
      variant="outline"
      size="sm"
      className="gap-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950"
    >
      <Bell className="h-4 w-4" />
      Activer les notifications
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

