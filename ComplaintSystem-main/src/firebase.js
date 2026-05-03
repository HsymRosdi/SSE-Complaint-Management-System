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
// SECURITY FIX
// Weakness ID: W5
// Fix ID: F5 - Remove Firebase project ID from console log
// STRIDE: Information Disclosure
// OWASP: A09 Security Logging and Monitoring Failures
// CWE: CWE-532
// CIA: Confidentiality
// ASVS: V7.1 - Log Content
// D3FEND: D3-AL Application Layer Logging
