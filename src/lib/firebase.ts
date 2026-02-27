import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDzCYY9gGx-5MZ4xItZWk2_3AowsAJlFlg",
  authDomain: "katara-1.firebaseapp.com",
  projectId: "katara-1",
  storageBucket: "katara-1.firebasestorage.app",
  messagingSenderId: "206557535856",
  appId: "1:206557535856:web:64b685d3457c6aa8c8deb5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
