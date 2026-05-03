import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyBaD3ae03zW-yLMkoxbbkouDUHyx4Gf4gM",
  authDomain: "complaintsystem-70172.firebaseapp.com",
  projectId: "complaintsystem-70172",
  storageBucket: "complaintsystem-70172.firebasestorage.app",
  messagingSenderId: "539663703936",
  appId: "1:539663703936:web:6b1048424e46f9db32ab65",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
console.log("Using Firebase project:", firebaseConfig.projectId);
