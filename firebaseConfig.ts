import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCH8l2sNfCMd4nzPPkg9gkPDKLRjKPfOug",
  authDomain: "college-central-52897.firebaseapp.com",
  projectId: "college-central-52897",
  storageBucket: "college-central-52897.firebasestorage.app",
  messagingSenderId: "659896441461",
  appId: "1:659896441461:web:f6d8be928f9f3e180df63c",
  measurementId: "G-W5M2GBTPYJ"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
