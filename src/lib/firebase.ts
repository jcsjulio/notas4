import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';

// Configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyAKrfG5EgqeK0p0YCmsB0Fohe9cDcuBxco",
  authDomain: "notas-31536.firebaseapp.com",
  projectId: "notas-31536",
  storageBucket: "notas-31536.firebasestorage.app",
  messagingSenderId: "588524595344",
  appId: "1:588524595344:web:a7d707c65c0872bd6f1015",
  measurementId: "G-EKV7KF4ZE0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Keep standard firestore paths
export const CARDS_COLLECTION = 'cards';
export const CONFIG_COLLECTION = 'config';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

export { collection, doc, setDoc, getDocs, onSnapshot, updateDoc, deleteDoc };

