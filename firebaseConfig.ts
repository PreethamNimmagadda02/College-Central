// FIX: Updated Firebase imports for v9 compatibility.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import 'firebase/compat/performance';
import 'firebase/compat/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Initialize Performance Monitoring
let perf: firebase.performance.Performance | null = null;
let analytics: firebase.analytics.Analytics | null = null;

// Only initialize performance monitoring in production and browser environment
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  try {
    perf = firebase.performance();
    analytics = firebase.analytics();
    console.log('Firebase Performance Monitoring initialized');
  } catch (error) {
    console.warn('Failed to initialize Firebase Performance Monitoring:', error);
  }
}

export { auth, db, storage, perf, analytics };
