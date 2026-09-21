import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, updatePassword } from "firebase/auth";
import { auth, OWNER_EMAIL } from "../firebase";

export function useOwnerAuth() {
  const [user, setUser] = useState(undefined); // undefined = still checking, null = signed out
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  return user;
}

// The dashboard's "PIN" is just the password on one fixed Firebase Auth account (see README) —
// this keeps the familiar PIN-entry UX while giving Firestore security rules a real request.auth
// to check, instead of a client-only check that anyone could bypass by editing the page's JS.
export async function unlockWithPin(pin) {
  await signInWithEmailAndPassword(auth, OWNER_EMAIL, pin);
}

export function lockDashboard() {
  return signOut(auth);
}

export function changePin(newPin) {
  return updatePassword(auth.currentUser, newPin);
}
