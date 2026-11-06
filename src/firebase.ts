/**
 * Firebase Client Initialization & Utilities
 * 
 * Configured for Firestore Database ID:
 * ai-studio-mechmatrixmechan-41e61205-69cf-470b-960a-78ee88d3f4f0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore (handles default or custom databaseId)
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);
export { firebaseConfig };

// Test connection on boot (Requirement: Firebase Integration Skill)
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration: the client is offline.');
      return false;
    }
    return true;
  }
}
testConnection();

// Re-export full suite of CRUD, subscriptions, and error handling from services
export * from './services/firebase';
