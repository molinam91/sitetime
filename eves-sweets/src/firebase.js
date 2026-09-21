import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Fill these in from your Firebase project settings (Project settings -> General -> Your apps -> SDK setup),
// or set them as REACT_APP_FIREBASE_* environment variables (e.g. in a .env.local file, or in your
// Netlify/Vercel project's environment variables). See README.md for the full setup walkthrough.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "REPLACE_ME",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "REPLACE_ME.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "REPLACE_ME",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "REPLACE_ME.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "REPLACE_ME",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "REPLACE_ME",
};

// The dashboard PIN is stored as the password of this one fixed Firebase Auth user (see README).
// Its own address never needs to be typed by the owner, so any fixed value works.
export const OWNER_EMAIL = process.env.REACT_APP_OWNER_EMAIL || "owner@eves-sweets.local";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
