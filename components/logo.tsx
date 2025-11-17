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
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  const checkRoomAccess = async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const response = await fetch('/api/rooms');
      if (!response.ok) return false;
      
      const rooms = await response.json();
      return rooms.length > 0; // User has access if they have at least one room
    } catch (error) {
      console.error('Error checking room access:', error);
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
      console.log('Triple tap detected! Checking access...');
      
      // Check if user has access to at least one room
      const hasAccess = await checkRoomAccess();
      
      if (hasAccess) {
        console.log('Access granted! Entering chat mode...');
        setIsChatMode(true);
        setTapCount(0);
      } else {
        console.log('Access denied! No rooms available.');
        setShowAccessDenied(true);
        setTapCount(0);
        
        // Hide the message after 3 seconds
        setTimeout(() => {
          setShowAccessDenied(false);
        }, 3000);
      }
    } else {
      // Reset tap count after 800ms if no new taps
      tapTimerRef.current = setTimeout(() => {
        setTapCount(0);
      }, 800);
    }
  }, [tapCount, setIsChatMode, user]);

  return (
    <div className="relative">
      {/* Access Denied Message */}
      {showAccessDenied && (
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg whitespace-nowrap z-50 animate-pulse">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="font-medium">Accès refusé - Aucun salon disponible</span>
          </div>
        </div>
      )}

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
    </div>
  );
}

