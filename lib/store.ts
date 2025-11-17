import { create } from 'zustand';

interface Room {
  id: string;
  name: string;
  description?: string;
  unreadCount?: number;
}

interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName?: string;
  content: string;
  messageType: 'text' | 'image';
  imageUrl?: string;
  createdAt: Date;
}

interface ChatStore {
  // Chat visibility
  isChatMode: boolean;
  setIsChatMode: (value: boolean) => void;

  // Current room
  currentRoomId: string | null;
  setCurrentRoomId: (roomId: string | null) => void;

  // Rooms
  rooms: Room[];
  setRooms: (rooms: Room[]) => void;
  addRoom: (room: Room) => void;
  removeRoom: (roomId: string) => void;

  // Messages
  messages: Record<string, Message[]>;
  setMessages: (roomId: string, messages: Message[]) => void;
  addMessage: (roomId: string, message: Message) => void;
  removeMessage: (roomId: string, messageId: string) => void;
  clearMessages: (roomId: string) => void;
  clearAllMessages: () => void;

  // Panic mode
  triggerPanicMode: () => void;

  // Inactivity timer
  lastActivityTime: number;
  updateActivityTime: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  isChatMode: false,
  currentRoomId: null,
  rooms: [],
  messages: {},
  lastActivityTime: Date.now(),

  // Actions
  setIsChatMode: (value) => {
    set({ isChatMode: value });
    if (value) {
      get().updateActivityTime();
    }
  },

  setCurrentRoomId: (roomId) => {
    set({ currentRoomId: roomId });
    get().updateActivityTime();
  },

  setRooms: (rooms) => set({ rooms }),

  addRoom: (room) =>
    set((state) => ({
      rooms: [...state.rooms, room],
    })),

  removeRoom: (roomId) =>
    set((state) => ({
      rooms: state.rooms.filter((r) => r.id !== roomId),
      messages: Object.fromEntries(
        Object.entries(state.messages).filter(([id]) => id !== roomId)
      ),
      currentRoomId:
        state.currentRoomId === roomId ? null : state.currentRoomId,
    })),

  setMessages: (roomId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [roomId]: messages },
    })),

  addMessage: (roomId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: [...(state.messages[roomId] || []), message],
      },
    })),

  removeMessage: (roomId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: (state.messages[roomId] || []).filter(
          (m) => m.id !== messageId
        ),
      },
    })),

  clearMessages: (roomId) =>
    set((state) => ({
      messages: { ...state.messages, [roomId]: [] },
    })),

  clearAllMessages: () => set({ messages: {} }),

  triggerPanicMode: () => {
    // Clear all local state
    set({
      isChatMode: false,
      currentRoomId: null,
      messages: {},
    });

    // Clear encryption keys
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith('room_key_')) {
          localStorage.removeItem(key);
        }
      });
    }
  },

  updateActivityTime: () => set({ lastActivityTime: Date.now() }),
}));

