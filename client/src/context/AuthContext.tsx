import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { auth, onAuthChange, signInWithGoogle, signInWithEmail, signUpWithEmail, logOut, getAuthClaims, type FirebaseUser } from "@/lib/firebase";
import type { User } from "@shared/schema";

interface FirebaseClaims {
  superAdmin: boolean;
  admin: boolean;
  delegate: boolean;
}

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, name: string, phone?: string, referralCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isDelegate: boolean;
  firebaseClaims: FirebaseClaims;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseClaims, setFirebaseClaims] = useState<FirebaseClaims>({ superAdmin: false, admin: false, delegate: false });

  useEffect(() => {
    const unsubscribe = onAuthChange(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const claims = await getAuthClaims(fbUser);
          setFirebaseClaims(claims);
          
          const response = await fetch(`/api/users/${fbUser.uid}`);
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else if (response.status === 404) {
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user:", error);
          setUser(null);
          setFirebaseClaims({ superAdmin: false, admin: false, delegate: false });
        }
      } else {
        setUser(null);
        setFirebaseClaims({ superAdmin: false, admin: false, delegate: false });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithGoogle();
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: result.user.uid,
          email: result.user.email,
          name: result.user.displayName,
          phone: result.user.phoneNumber,
        }),
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmail(email, password);
      // Fetch user data from our backend
      if (result.user) {
        const response = await fetch(`/api/users/${result.user.uid}`);
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      }
    } catch (error: any) {
      console.error("Email login error:", error);
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      }
      throw error;
    }
  };

  const registerWithEmail = async (
    email: string, 
    password: string, 
    name: string, 
    phone?: string, 
    referralCode?: string
  ) => {
    try {
      const result = await signUpWithEmail(email, password);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: result.user.uid,
          email,
          name,
          phone,
          referralCode,
        }),
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.code === "auth/email-already-in-use") {
        throw new Error("البريد الإلكتروني مسجل مسبقاً. يرجى استخدام تسجيل الدخول بدلاً من إنشاء حساب جديد.");
      }
      if (error.code === "auth/weak-password") {
        throw new Error("كلمة المرور ضعيفة. يجب أن تكون 6 أحرف على الأقل.");
      }
      if (error.code === "auth/invalid-email") {
        throw new Error("البريد الإلكتروني غير صالح.");
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logOut();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const isAdmin = user?.role === "admin" || user?.role === "super_admin" || firebaseClaims.admin;
  const isSuperAdmin = user?.role === "super_admin" || firebaseClaims.superAdmin;
  const isDelegate = user?.role === "delegate" || firebaseClaims.delegate;

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        loading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        isAdmin,
        isSuperAdmin,
        isDelegate,
        firebaseClaims,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
