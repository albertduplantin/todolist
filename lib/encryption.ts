import nacl from 'tweetnacl';
import {
  decodeUTF8,
  encodeUTF8,
  encodeBase64,
  decodeBase64,
} from 'tweetnacl-util';

// Generate a new encryption key pair
export function generateKeyPair() {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    secretKey: encodeBase64(keyPair.secretKey),
  };
}

// Generate a random symmetric key for a room
export function generateRoomKey(): string {
  const key = nacl.randomBytes(nacl.secretbox.keyLength);
  return encodeBase64(key);
}

// Encrypt a message with a room key
export function encryptMessage(message: string, roomKeyBase64: string): string {
  try {
    const roomKey = decodeBase64(roomKeyBase64);
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const messageUint8 = decodeUTF8(message);
    const encrypted = nacl.secretbox(messageUint8, nonce, roomKey);

    // Combine nonce + encrypted message
    const fullMessage = new Uint8Array(nonce.length + encrypted.length);
    fullMessage.set(nonce);
    fullMessage.set(encrypted, nonce.length);

    return encodeBase64(fullMessage);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
}

// Decrypt a message with a room key
export function decryptMessage(
  encryptedMessageBase64: string,
  roomKeyBase64: string
): string {
  try {
    const roomKey = decodeBase64(roomKeyBase64);
    const fullMessage = decodeBase64(encryptedMessageBase64);

    const nonce = fullMessage.slice(0, nacl.secretbox.nonceLength);
    const encrypted = fullMessage.slice(nacl.secretbox.nonceLength);

    const decrypted = nacl.secretbox.open(encrypted, nonce, roomKey);

    if (!decrypted) {
      throw new Error('Decryption failed');
    }

    return encodeUTF8(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
}

// In-memory session key for extra security (incognito mode)
const sessionKeys: Map<string, string> = new Map();

function getSessionKey(): string {
  if (!sessionKeys.has('main')) {
    // Generate a session-specific encryption key
    const key = nacl.randomBytes(32);
    sessionKeys.set('main', encodeBase64(key));
  }
  return sessionKeys.get('main')!;
}

function encryptForStorage(data: string): string {
  const sessionKey = decodeBase64(getSessionKey());
  const nonce = nacl.randomBytes(24);
  const encrypted = nacl.secretbox(decodeUTF8(data), nonce, sessionKey);
  return JSON.stringify({
    nonce: encodeBase64(nonce),
    encrypted: encodeBase64(encrypted),
  });
}

function decryptFromStorage(encryptedData: string): string | null {
  try {
    const sessionKey = decodeBase64(getSessionKey());
    const { nonce, encrypted } = JSON.parse(encryptedData);
    const decrypted = nacl.secretbox.open(
      decodeBase64(encrypted),
      decodeBase64(nonce),
      sessionKey
    );
    if (!decrypted) return null;
    return encodeUTF8(decrypted);
  } catch {
    return null;
  }
}

// Store room key in sessionStorage with in-memory encryption (MODE INCOGNITO)
// sessionStorage is cleared when tab closes, providing extra privacy
export function storeRoomKey(roomId: string, roomKey: string) {
  if (typeof window !== 'undefined') {
    // Encrypt the key before storing
    const encrypted = encryptForStorage(roomKey);
    // Use sessionStorage (cleared on tab close) instead of localStorage
    sessionStorage.setItem(`room_key_${roomId}`, encrypted);
  }
}

// Get room key from sessionStorage and decrypt it
export function getRoomKey(roomId: string): string | null {
  if (typeof window !== 'undefined') {
    const encrypted = sessionStorage.getItem(`room_key_${roomId}`);
    if (!encrypted) return null;
    return decryptFromStorage(encrypted);
  }
  return null;
}

// Clear all encryption keys (panic mode + inactivity)
export function clearEncryptionKeys() {
  if (typeof window !== 'undefined') {
    // Clear all room keys from sessionStorage
    const keys = Object.keys(sessionStorage);
    keys.forEach((key) => {
      if (key.startsWith('room_key_')) {
        sessionStorage.removeItem(key);
      }
    });
    // Also clear from localStorage (legacy)
    const localKeys = Object.keys(localStorage);
    localKeys.forEach((key) => {
      if (key.startsWith('room_key_')) {
        localStorage.removeItem(key);
      }
    });
    // Clear in-memory session keys
    sessionKeys.clear();
  }
}

