import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAIKRiaUoK5hNo5C1wPadDzo3JoVtAh27c",
  authDomain: "lunara-71279.firebaseapp.com",
  projectId: "lunara-71279",
  storageBucket: "lunara-71279.firebasestorage.app",
  messagingSenderId: "393566680229",
  appId: "1:393566680229:web:9a9f694de407bd9162c94c",
  measurementId: "G-6QXCCLB7HN"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
