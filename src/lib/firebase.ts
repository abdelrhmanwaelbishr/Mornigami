import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  runTransaction,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCs7MTj0iVx11l2YE0vP5YB9fUGhkeMOE4",
  authDomain: "bishr-hub.firebaseapp.com",
  projectId: "bishr-hub",
  storageBucket: "bishr-hub.firebasestorage.app",
  messagingSenderId: "1076184127468",
  appId: "1:1076184127468:web:df8d06aeefdca3728452c9",
  measurementId: "G-6EL974P299",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  runTransaction,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type User,
};
