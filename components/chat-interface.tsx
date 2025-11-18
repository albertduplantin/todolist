'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/lib/store';
import { encryptMessage, decryptMessage, getRoomKey, storeRoomKey, clearEncryptionKeys } from '@/lib/encryption';
import { Send, Image as ImageIcon, ArrowLeft, AlertTriangle, Trash2, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import Pusher from 'pusher-js';
import { useUser } from '@clerk/nextjs';
import { UploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';
import { sendNotification } from './notification-permission';
import { ImageUploadDialog } from './image-upload-dialog';
import { ImageViewer } from './image-viewer';

interface Room {
  id: string;
  name: string;
  description?: string;
  encryptionKey: string;
}

interface Message {
  id: string;
  roomId: string;
  senderId: string;
  encryptedContent: string;
  messageType: 'text' | 'image';
  imageUrl?: string;
  createdAt: Date;
}

export function ChatInterface() {
  const { user } = useUser();
  const {
    currentRoomId,
    setCurrentRoomId,
    rooms,
    setRooms,
    messages,
    setMessages,
    addMessage,
    removeMessage,
    clearMessages,
    triggerPanicMode,
  } = useChatStore();

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const hasAttemptedFetchRef = useRef(false);

  useEffect(() => {
    // ALWAYS fetch rooms when entering chat interface
    // This ensures we have fresh data even if store was cleared
    console.log('[ChatInterface] Mounting - fetching rooms');
    hasAttemptedFetchRef.current = false; // Reset flag on mount
    fetchRooms();
    initializePusher();

    return () => {
      // Cleanup on unmount - only disconnect Pusher
      if (pusherRef.current) {
        pusherRef.current.disconnect();
      }
      // Note: Room cleanup is handled by panic mode and user change detection
    };
  }, []);

  // Force re-fetch if rooms are empty (store was cleared) - only once
  useEffect(() => {
    if (!loading && rooms.length === 0 && user?.id && !hasAttemptedFetchRef.current) {
      console.log('[ChatInterface] Rooms are empty, re-fetching...');
      hasAttemptedFetchRef.current = true;
      fetchRooms();
    }
  }, [loading, rooms.length, user?.id]);

  // Note: Room access is now checked BEFORE entering chat mode (in Logo component)
  // and cleanup is handled by user change detection (in app/page.tsx)

  useEffect(() => {
    if (currentRoomId) {
      fetchMessages(currentRoomId);
      subscribeToRoom(currentRoomId);
    }
  }, [currentRoomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentRoomId]);

  // Auto-disconnect after 30 seconds of inactivity
  useEffect(() => {
    if (!currentRoomId) return;

    const resetInactivityTimer = () => {
      // Clear existing timers
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }

      // Hide warning if it was showing
      setShowInactivityWarning(false);

      // Show warning after 25 seconds
      warningTimerRef.current = setTimeout(() => {
        console.log('[Inactivity] Showing warning - 5 seconds left');
        setShowInactivityWarning(true);
      }, 25000);

      // Auto-disconnect after 30 seconds
      inactivityTimerRef.current = setTimeout(() => {
        console.log('[Inactivity] Auto-disconnect triggered - returning to todo-list');
        setShowInactivityWarning(false);
        // Return to todo-list (exit chat mode completely)
        triggerPanicMode();
      }, 30000);
    };

    // Reset timer on any activity
    const handleActivity = () => {
      console.log('[Inactivity] Activity detected - resetting timer');
      resetInactivityTimer();
    };

    // Initialize timer
    console.log('[Inactivity] Timer initialized for room', currentRoomId);
    resetInactivityTimer();

    // Listen to various events
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      console.log('[Inactivity] Cleaning up timers');
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [currentRoomId, setCurrentRoomId]);

  const initializePusher = () => {
    if (!pusherRef.current) {
      pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      });
    }
  };

  const subscribeToRoom = (roomId: string) => {
    if (!pusherRef.current) {
      console.error('[ChatInterface] Pusher not initialized!');
      return;
    }

    console.log(`[ChatInterface] Subscribing to room-${roomId}`);
    const channel = pusherRef.current.subscribe(`room-${roomId}`);

    // Debug: Listen to all connection events
    pusherRef.current.connection.bind('state_change', (states: any) => {
      console.log(`[Pusher] Connection state changed: ${states.previous} -> ${states.current}`);
    });

    pusherRef.current.connection.bind('error', (err: any) => {
      console.error('[Pusher] Connection error:', err);
    });

    channel.bind('pusher:subscription_succeeded', () => {
      console.log(`[Pusher] Successfully subscribed to room-${roomId}`);
    });

    channel.bind('pusher:subscription_error', (status: any) => {
      console.error(`[Pusher] Subscription error for room-${roomId}:`, status);
    });

    channel.bind('new-message', (data: Message) => {
      console.log('[Pusher] Received new-message event:', data);
      
      const roomKey = getRoomKey(roomId);
      if (!roomKey) {
        console.error('[Pusher] No room key found for decryption');
        return;
      }

      try {
        const decryptedContent = decryptMessage(data.encryptedContent, roomKey);
        console.log('[Pusher] Message decrypted successfully');
        
        // Only add if not from current user (avoid duplicate with local add)
        if (data.senderId !== user?.id) {
          console.log('[Pusher] Adding message from another user');
          addMessage(roomId, {
            ...data,
            content: decryptedContent,
          });

          // Send notification
          sendNotification(
            'Nouveau message',
            decryptedContent.slice(0, 50) + (decryptedContent.length > 50 ? '...' : '')
          );
        } else {
          console.log('[Pusher] Ignoring message from self');
        }
      } catch (error) {
        console.error('[Pusher] Error decrypting message:', error);
      }
    });

    channel.bind('message-deleted', (data: { messageId: string }) => {
      console.log('[Pusher] Received message-deleted event:', data);
      removeMessage(roomId, data.messageId);
    });

    // Listen for typing events
    channel.bind('user-typing', (data: { userId: string; username: string }) => {
      if (data.userId !== user?.id) {
        setTypingUsers(prev => new Set(prev).add(data.username));
        
        // Clear typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.username);
            return newSet;
          });
        }, 3000);
      }
    });
  };

  const fetchRooms = async () => {
    try {
      console.log('[ChatInterface] Fetching rooms for current user...');
      console.log('[ChatInterface] Current rooms in store:', rooms.length);
      
      // Force fresh data with cache busting
      const timestamp = Date.now();
      const response = await fetch(`/api/rooms?_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      
      console.log('[ChatInterface] API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[ChatInterface] Received rooms from API:', data.length, 'rooms:', data);
        
        setRooms(data);
        console.log('[ChatInterface] Rooms set in store');

        // Store encryption keys locally
        data.forEach((room: Room) => {
          storeRoomKey(room.id, room.encryptionKey);
        });
      } else {
        console.error('[ChatInterface] Failed to fetch rooms, status:', response.status);
      }
    } catch (error) {
      console.error('[ChatInterface] Error fetching rooms:', error);
    } finally {
      console.log('[ChatInterface] Setting loading to false');
      setLoading(false);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      const response = await fetch(`/api/messages?roomId=${roomId}`);
      if (response.ok) {
        const data = await response.json();
        const roomKey = getRoomKey(roomId);
        
        if (!roomKey) {
          console.error('Room key not found');
          return;
        }

        // Decrypt messages and add content property
        const decryptedMessages = data.map((msg: Message) => {
          try {
            const content = decryptMessage(msg.encryptedContent, roomKey);
            return { ...msg, content };
          } catch (error) {
            console.error('Error decrypting message:', error);
            return { ...msg, content: '[Message illisible]' };
          }
        });

        setMessages(roomId, decryptedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleTyping = () => {
    if (!currentRoomId || !user || !pusherRef.current) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Trigger typing event
    fetch('/api/messages/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: currentRoomId,
        username: user.firstName || user.username || 'Anonymous',
      }),
    });

    // Auto-stop after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      // Typing stopped
    }, 2000);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentRoomId || !user) return;

    const roomKey = getRoomKey(currentRoomId);
    if (!roomKey) {
      console.error('Room key not found');
      return;
    }

    const messageContent = inputMessage;
    setInputMessage(''); // Clear input immediately for better UX

    try {
      const encrypted = encryptMessage(messageContent, roomKey);

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: currentRoomId,
          encryptedContent: encrypted,
          messageType: 'text',
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        // Add message locally with decrypted content
        addMessage(currentRoomId, {
          ...newMessage,
          content: messageContent, // Add decrypted content
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setInputMessage(messageContent); // Restore message on error
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!currentRoomId) return;
    
    try {
      const response = await fetch(`/api/messages?id=${messageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state immediately
        removeMessage(currentRoomId, messageId);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const uploadImageToServer = async (file: File): Promise<string> => {
    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    // Upload to Uploadthing via custom API route
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const data = await response.json();
    return data.url;
  };

  const sendImageMessage = async (imageUrl: string) => {
    if (!currentRoomId || !user) return;

    const roomKey = getRoomKey(currentRoomId);
    if (!roomKey) {
      console.error('Room key not found');
      return;
    }

    try {
      // Encrypt a placeholder text (the image URL is stored separately)
      const encrypted = encryptMessage('[Image]', roomKey);

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: currentRoomId,
          encryptedContent: encrypted,
          messageType: 'image',
          imageUrl: imageUrl,
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        // Add message locally with decrypted content
        addMessage(currentRoomId, {
          ...newMessage,
          content: '[Image]',
        });
      }
    } catch (error) {
      console.error('Error sending image message:', error);
    }
  };

  const clearAllMessages = async () => {
    if (!currentRoomId) return;

    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir supprimer tous vos messages dans ce salon ?'
    );

    if (confirmed) {
      try {
        await fetch('/api/messages/clear', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: currentRoomId }),
        });

        clearMessages(currentRoomId);
      } catch (error) {
        console.error('Error clearing messages:', error);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const displayMessage = (message: any) => {
    // Message already decrypted in store
    return message.content || '[Message illisible]';
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Get color for avatar
  const getAvatarColor = (userId: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-yellow-500',
      'bg-red-500',
    ];
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-rose-200 border-t-rose-500 mx-auto mb-4"></div>
          <p className="text-rose-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  // Room selection view
  if (!currentRoomId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                Vos conversations
              </h1>
              <p className="text-gray-600 text-sm mt-1">Sélectionnez un salon pour commencer</p>
            </div>
            <Button
              onClick={triggerPanicMode}
              variant="destructive"
              size="sm"
              className="bg-red-500 hover:bg-red-600 shadow-lg"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Sortie
            </Button>
          </div>

          <div className="space-y-3">
            {rooms.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur border border-rose-200 p-12 text-center shadow-lg">
                <p className="text-gray-700 font-medium text-lg">
                  Aucun salon disponible
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Contactez un administrateur pour rejoindre un salon
                </p>
              </Card>
            ) : (
              rooms.map((room: any) => (
                <Card
                  key={room.id}
                  className="bg-white/80 backdrop-blur border border-rose-200 hover:border-rose-300 cursor-pointer transition-all hover:shadow-lg p-4 group"
                  onClick={() => setCurrentRoomId(room.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MessageSquare className="h-5 w-5 text-rose-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {room.name}
                      </h3>
                      {room.description && (
                        <p className="text-sm text-gray-600 mt-0.5">
                          {room.description}
                        </p>
                      )}
                    </div>
                    <ArrowLeft className="h-5 w-5 text-rose-400 rotate-180" />
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Chat view
  const currentRoom = rooms.find((r: any) => r.id === currentRoomId);
  const currentMessages = messages[currentRoomId] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex flex-col">
      {/* Inactivity Warning */}
      {showInactivityWarning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">Déconnexion dans 5 secondes...</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white/80 backdrop-blur border-b border-rose-200 p-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setCurrentRoomId(null)}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour
            </Button>
            <div>
              <h2 className="font-semibold text-gray-900">
                {currentRoom?.name}
              </h2>
              {currentRoom?.description && (
                <p className="text-xs text-gray-500">
                  {currentRoom.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={clearAllMessages} 
              variant="ghost" 
              size="sm"
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              onClick={triggerPanicMode}
              variant="destructive"
              size="sm"
              className="bg-red-500 hover:bg-red-600"
            >
              <AlertTriangle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scrollbar p-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {currentMessages.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-rose-600" />
              </div>
              <p className="text-gray-700 font-medium text-lg">Aucun message</p>
              <p className="text-gray-500 text-sm mt-2">Commencez la conversation</p>
            </div>
          ) : (
            currentMessages.map((message: any) => {
              const isOwn = message.senderId === user?.id;
              const content = displayMessage(message);

              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  {!isOwn && (
                    <div className={`w-8 h-8 rounded-full ${getAvatarColor(message.senderId)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {getInitials(message.senderName || 'Anon')}
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-2xl p-3 shadow-sm ${
                      isOwn
                        ? 'bg-gradient-to-br from-rose-500 to-pink-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    {message.messageType === 'image' && message.imageUrl && (
                      <div className="relative group mb-2">
                        <div
                          onClick={() => setViewingImage(message.imageUrl)}
                          className="cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          <img
                            src={message.imageUrl}
                            alt="Image partagée"
                            className="rounded-lg max-w-full max-h-96 object-cover"
                          />
                        </div>
                        {/* Download button overlay */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const link = document.createElement('a');
                            link.href = message.imageUrl;
                            link.download = message.imageUrl.split('/').pop() || 'image.jpg';
                            link.target = '_blank';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          title="Télécharger l'image"
                        >
                          <svg 
                            className="w-4 h-4" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                    <p className="text-sm break-words leading-relaxed">{content}</p>
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <span className={`text-xs ${isOwn ? 'text-rose-100' : 'text-gray-500'}`}>
                        {new Date(message.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isOwn && (
                        <button
                          onClick={() => deleteMessage(message.id)}
                          className="text-xs text-rose-100 hover:text-white transition-colors"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                  {isOwn && (
                    <div className={`w-8 h-8 rounded-full ${getAvatarColor(user?.id || '')} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {getInitials(user?.firstName || user?.username || 'Me')}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Typing indicator */}
          {typingUsers.size > 0 && (
            <div className="flex gap-2 justify-start">
              <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                ...
              </div>
              <div className="bg-gray-100 border border-gray-200 rounded-2xl p-3 shadow-sm">
                <p className="text-sm text-gray-600">
                  {Array.from(typingUsers).join(', ')} {typingUsers.size > 1 ? 'sont' : 'est'} en train d'écrire...
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Image Upload Dialog */}
      <ImageUploadDialog
        isOpen={showImageUpload}
        onClose={() => setShowImageUpload(false)}
        onUploadComplete={sendImageMessage}
        uploadToServer={uploadImageToServer}
      />

      {/* Image Viewer (Lightbox) */}
      <ImageViewer
        imageUrl={viewingImage || ''}
        isOpen={!!viewingImage}
        onClose={() => setViewingImage(null)}
      />

      {/* Input */}
      <div className="bg-white/80 backdrop-blur border-t border-rose-200 p-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex gap-2 items-end">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => setShowImageUpload(true)}
            title="Envoyer une image"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
              <Input
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  handleTyping();
                }}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Écrivez votre message..."
                className="flex-1 bg-white border-gray-300 rounded-lg"
              />
          <Button 
            onClick={sendMessage}
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-6 rounded-lg shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

