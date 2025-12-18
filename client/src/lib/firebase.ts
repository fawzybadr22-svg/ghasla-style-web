import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential,
  type User as FirebaseUser,
  type ConfirmationResult
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration - DO NOT modify these values
const firebaseConfig = {
  apiKey: "AIzaSyBBDE1w48o4Z9v5AK-LHv_mLUWA12XHkGo",
  authDomain: "ghasla-style.firebaseapp.com",
  projectId: "ghasla-style",
  storageBucket: "ghasla-style.firebasestorage.app",
  messagingSenderId: "7570975896156",
  appId: "1:7570975896156:web:a0a6e074e50a2e8eebfd99",
  measurementId: "G-1C1ZRQGS1W"
};

// Initialize Firebase only if not already initialized (prevents duplicate-app error during hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const signInWithEmail = (email: string, password: string) => 
  signInWithEmailAndPassword(auth, email, password);

export const signUpWithEmail = (email: string, password: string) => 
  createUserWithEmailAndPassword(auth, email, password);

export const logOut = () => signOut(auth);

export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => 
  onAuthStateChanged(auth, callback);

export const setupRecaptcha = (buttonId: string) => {
  const recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
    size: 'invisible',
    callback: () => {},
  });
  return recaptchaVerifier;
};

export const sendPhoneOTP = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier): Promise<ConfirmationResult> => {
  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
};

export const linkPhoneToAccount = async (verificationId: string, otp: string) => {
  const credential = PhoneAuthProvider.credential(verificationId, otp);
  if (auth.currentUser) {
    return linkWithCredential(auth.currentUser, credential);
  }
  throw new Error("No user logged in");
};

export type { FirebaseUser, ConfirmationResult };
