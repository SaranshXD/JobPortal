import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// ✅ Your Firebase configuration (keep this secure)
const firebaseConfig = {
  apiKey: "AIzaSyDYdMym296lvx_bT9Ri1-6_KmwgXMAYQ9g",
  authDomain: "job-portal-85273.firebaseapp.com",
  projectId: "job-portal-85273",
  storageBucket: "job-portal-85273.appspot.com",
  messagingSenderId: "74497489256",
  appId: "1:74497489256:web:ad7589d1d8b3ce6ce9fedd",
  measurementId: "G-22PXNVEJJR"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Initialize Firebase Authentication
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// ✅ Initialize Firestore Database
export const db = getFirestore(app);