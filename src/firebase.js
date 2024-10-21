// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA2Uf5nXzvN5aSRL0iaOepYxOW6m7e2yjM",
  authDomain: "fbproject-c27b4.firebaseapp.com",
  databaseURL: "https://fbproject-c27b4-default-rtdb.firebaseio.com",
  projectId: "fbproject-c27b4",
  storageBucket: "fbproject-c27b4.appspot.com",
  messagingSenderId: "1008151670205",
  appId: "1:1008151670205:web:231a4bf7573ccd5a7ef6d4",
  measurementId: "G-VXYKQYFG9G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore, Storage, and Auth services
const db = getFirestore(app);  // Firestore
const storage = getStorage(app);  // Storage
const auth = getAuth(app);  // Authentication

// Export the services
export { db, storage, auth };