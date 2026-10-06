import { Capacitor } from '@capacitor/core';
import type { GenerationConfig } from 'firebase/ai';
// FIX: Updated Firebase imports for v9 compatibility.
// Only import core services - performance and analytics loaded on demand
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

// Model used for all AI extraction. Supported models: https://firebase.google.com/docs/ai-logic/models
const GEMINI_MODEL = 'gemini-3.8-flash';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize Firebase services
const auth = firebase.auth();

// Configure Firestore with modern persistence settings
// Using localCache instead of deprecated enablePersistence()
const db = firebase.firestore();

// Configure persistence and caching through settings
// This replaces the deprecated enablePersistence() API
try {
  db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
    experimentalAutoDetectLongPolling: true,
    merge: true, // Merge with existing settings to avoid override warning
  });
} catch (err) {
  // Settings already set - this is expected on hot reload
  console.debug('Firestore settings already configured');
}

const storage = firebase.storage();

// Lazy load Performance Monitoring and Analytics only when needed
type FirebasePerformance = ReturnType<typeof firebase.performance>;
type FirebaseAnalytics = ReturnType<typeof firebase.analytics>;
let perf: FirebasePerformance | null = null;
let analytics: FirebaseAnalytics | null = null;

// Helper to lazy load performance monitoring
export async function getPerformance(): Promise<FirebasePerformance | null> {
  if (perf) return perf;
  if (typeof window !== 'undefined' && import.meta.env.PROD) {
    try {
      await import('firebase/compat/performance');
      perf = firebase.performance();
      return perf;
    } catch (error) {
      console.warn('Failed to load Firebase Performance:', error);
      return null;
    }
  }
  return null;
}

// Helper to lazy load analytics
export async function getAnalytics(): Promise<FirebaseAnalytics | null> {
  if (analytics) return analytics;
  if (typeof window !== 'undefined' && import.meta.env.PROD) {
    try {
      await import('firebase/compat/analytics');
      analytics = firebase.analytics();
      return analytics;
    } catch (error) {
      console.warn('Failed to load Firebase Analytics:', error);
      return null;
    }
  }
  return null;
}

// App Check proves a request comes from this app. Firebase AI Logic enforces it,
// so it has to be active before the first Gemini call.
let appCheckReady: Promise<void> | null = null;

function initAppCheck(): Promise<void> {
  const siteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY;
  // reCAPTCHA cannot attest the native WebView (it runs on https://localhost)
  if (!siteKey || typeof window === 'undefined' || Capacitor.isNativePlatform()) {
    return Promise.resolve();
  }
  appCheckReady ??= import('firebase/compat/app-check').then(() => {
    if (import.meta.env.DEV) {
      // Logs a debug token to register under App Check > Manage debug tokens
      Object.assign(self, { FIREBASE_APPCHECK_DEBUG_TOKEN: true });
    }
    firebase.appCheck().activate(new firebase.appCheck.ReCaptchaEnterpriseProvider(siteKey), true);
  });
  return appCheckReady;
}

// Helper to lazy load Gemini through Firebase AI Logic. Firebase holds the Gemini
// API key server-side, so there is no key in the bundle - never add one as a VITE_ variable.
export async function getFirebaseAI() {
  const [{ getApp }, { getAI, getGenerativeModel, GoogleAIBackend, SchemaType }] =
    await Promise.all([import('firebase/app'), import('firebase/ai')]);
  await initAppCheck();
  const ai = getAI(getApp(), { backend: new GoogleAIBackend() });

  return {
    SchemaType,
    getModel: (generationConfig?: GenerationConfig) =>
      getGenerativeModel(ai, { model: GEMINI_MODEL, generationConfig }),
  };
}

export { auth, db, storage, perf, analytics };
