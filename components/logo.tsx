'use client';

import { useState, useCallback, useRef } from 'react';
import { useChatStore } from '@/lib/store';
import { useUser } from '@clerk/nextjs';

interface LogoProps {
  className?: string;
}

export function Logo({ className = '' }: LogoProps) {
  const [tapCount, setTapCount] = useState(0);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { setIsChatMode } = useChatStore();
  const { user } = useUser();

  const checkRoomAccess = async (): Promise<boolean> => {
    if (!user?.id) {
      console.log('[Logo] No user ID, access denied');
      return false;
    }

    try {
      console.log('[Logo] Checking room access for user:', user.id);
      const response = await fetch('/api/rooms');
      console.log('[Logo] API response status:', response.status);
      
      if (!response.ok) {
        console.log('[Logo] API response not OK, access denied');
        return false;
      }
      
      const rooms = await response.json();
      console.log('[Logo] Received rooms from API:', rooms.length, 'rooms:', rooms);
      
      const hasAccess = rooms.length > 0;
      console.log('[Logo] Access decision:', hasAccess ? 'GRANTED' : 'DENIED');
      
      return hasAccess;
    } catch (error) {
      console.error('[Logo] Error checking access:', error);
      return false;
    }
  };

  const handleTap = useCallback(async () => {
    // Increment tap count
    const newCount = tapCount + 1;
    setTapCount(newCount);

    // Clear existing timer
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    // Check if we hit 3 taps
    if (newCount === 3) {
      // Check if user has access to at least one room
      const hasAccess = await checkRoomAccess();
      
      if (hasAccess) {
        setIsChatMode(true);
      }
      // If no access, simply do nothing (stay discreet)
      setTapCount(0);
    } else {
      // Reset tap count after 800ms if no new taps
      tapTimerRef.current = setTimeout(() => {
        setTapCount(0);
      }, 800);
    }
  }, [tapCount, setIsChatMode, user]);

  return (
    <div
      onClick={handleTap}
      className={`cursor-pointer select-none ${className}`}
      role="button"
      tabIndex={0}
      aria-label="Logo TaskFlow"
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="clipboardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>
        
        {/* Clipboard background */}
        <rect
          x="10"
          y="12"
          width="28"
          height="32"
          rx="3"
          fill="white"
          stroke="url(#clipboardGradient)"
          strokeWidth="2"
        />
        
        {/* Clipboard clip */}
        <path
          d="M18 12 C18 9.5 20 7.5 24 7.5 C28 7.5 30 9.5 30 12"
          stroke="url(#clipboardGradient)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Checkmark */}
        <path
          d="M16 22 L20 26 L28 18"
          stroke="url(#clipboardGradient)"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Lines for tasks */}
        <line
          x1="16"
          y1="32"
          x2="32"
          y2="32"
          stroke="#9CA3AF"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="16"
          y1="38"
          x2="28"
          y2="38"
          stroke="#9CA3AF"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

