import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { initializeFirestore, getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, updateDoc, deleteDoc, getDocFromServer, CACHE_SIZE_UNLIMITED, enableNetwork, disableNetwork, memoryLocalCache } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';
import { safeStringify } from './lib/errorHandler';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Storage lazily
let storageInstance: any = null;
export const getStorageInstance = () => {
  if (!storageInstance) {
    try {
      storageInstance = getStorage(app);
    } catch (error) {
      console.error("Firebase Storage initialization failed:", error);
      throw error;
    }
  }
  return storageInstance;
};

// Safety wrapper to prevent duplicate Firestore client initializations on same app instance
const globalAny = globalThis as any;

function getCachedFirestore(databaseId?: string) {
  const cacheKey = databaseId ? `_firestore_db_${databaseId}` : '_firestore_db_default';
  if (!globalAny[cacheKey]) {
    try {
      globalAny[cacheKey] = initializeFirestore(app, {
        ignoreUndefinedProperties: true,
        localCache: memoryLocalCache(),
      }, databaseId);
    } catch (err) {
      console.warn(`initializeFirestore was already configured/setup for key: ${cacheKey}. Reverting to getFirestore reference fallback.`, err);
      globalAny[cacheKey] = getFirestore(app, databaseId);
    }
  }
  return globalAny[cacheKey];
}

// Initialize Firestore with settings to improve connectivity
export const db = getCachedFirestore((firebaseConfig as any).firestoreDatabaseId);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/meetings.space.created');

let cachedAccessToken: string | null = null;
export const getCachedAccessToken = () => cachedAccessToken;
export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

// Auth helper functions
export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (credential?.accessToken) {
    cachedAccessToken = credential.accessToken;
  }
  return result;
};
export const logout = async () => {
  cachedAccessToken = null;
  await signOut(auth);
};

// Firestore error handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

/**
 * Recursively removes undefined values from an object to make it safe for Firestore.
 */
export function sanitizeForFirestore(data: any): any {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeForFirestore);
  }

  const sanitized: any = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      if (value !== undefined) {
        sanitized[key] = sanitizeForFirestore(value);
      }
    }
  }
  return sanitized;
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const fsError = error as any;
  const errorCode = fsError.code || 'unknown';
  const errorMessage = fsError.message || String(error);

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  
  if (errorCode === 'permission-denied' || errorMessage.includes('insufficient permissions')) {
    console.error(`CRITICAL: Permission denied for ${operationType} on ${path}. Check firestore.rules.`);
  }

  console.error('Firestore Error Details: ', safeStringify(errInfo));
  throw new Error(safeStringify(errInfo));
}
