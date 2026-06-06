import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAr4G6UlX0p38pJFrRaAVHKtsN5xwp5m70",
  authDomain: "sitetime-masterbuilders.firebaseapp.com",
  projectId: "sitetime-masterbuilders",
  storageBucket: "sitetime-masterbuilders.firebasestorage.app",
  messagingSenderId: "751395302516",
  appId: "1:751395302516:web:5b27d1d9951f8780207521"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
