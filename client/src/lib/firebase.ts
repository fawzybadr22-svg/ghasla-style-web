import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  getIdTokenResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential,
  type User as FirebaseUser,
  type ConfirmationResult,
  type IdTokenResult
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only if not already initialized (prevents duplicate-app error during hot reload)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
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

export const getTokenResult = async (user: FirebaseUser): Promise<IdTokenResult> => 
  getIdTokenResult(user, true);

export const getAuthClaims = async (user: FirebaseUser): Promise<{ 
  superAdmin: boolean; 
  admin: boolean;
  delegate: boolean;
}> => {
  try {
    const tokenResult = await getIdTokenResult(user, true);
    return {
      superAdmin: tokenResult.claims.superAdmin === true,
      admin: tokenResult.claims.admin === true || tokenResult.claims.superAdmin === true,
      delegate: tokenResult.claims.delegate === true,
    };
  } catch (error) {
    console.error("Error getting auth claims:", error);
    return { superAdmin: false, admin: false, delegate: false };
  }
};

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
