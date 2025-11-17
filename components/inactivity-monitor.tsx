'use client';

import { useEffect } from 'react';
import { useChatStore } from '@/lib/store';

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes

export function InactivityMonitor() {
  const { isChatMode, lastActivityTime, triggerPanicMode, updateActivityTime } = useChatStore();

  useEffect(() => {
    // Only monitor when in chat mode
    if (!isChatMode) return;

    const checkInactivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityTime;

      if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
        console.log('Inactivity timeout - triggering panic mode');
        triggerPanicMode();
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkInactivity, 30000);

    // Update activity on user interactions
    const handleActivity = () => {
      if (isChatMode) {
        updateActivityTime();
      }
    };

    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [isChatMode, lastActivityTime, triggerPanicMode, updateActivityTime]);

  // Handle page visibility change (tab switch/close)
  useEffect(() => {
    if (!isChatMode) return;

    const handleVisibilityChange = () => {
      if (document.hidden && isChatMode) {
        // Clear chat data when leaving the tab
        triggerPanicMode();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isChatMode, triggerPanicMode]);

  // Handle beforeunload (page close)
  useEffect(() => {
    if (!isChatMode) return;

    const handleBeforeUnload = () => {
      if (isChatMode) {
        triggerPanicMode();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isChatMode, triggerPanicMode]);

  return null;
}

