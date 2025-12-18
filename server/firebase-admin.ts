import admin from "firebase-admin";
import type { Request, Response, NextFunction } from "express";

let initialized = false;

export function initializeFirebaseAdmin() {
  if (initialized) return;
  
  try {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    
    if (!projectId) {
      console.warn("Firebase Admin: Missing project ID, some features may not work");
      return;
    }

    if (admin.apps.length === 0) {
      admin.initializeApp({
        projectId,
      });
      console.log("Firebase Admin initialized with project:", projectId);
    }
    
    initialized = true;
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

export function getFirebaseAdmin() {
  if (!initialized) {
    initializeFirebaseAdmin();
  }
  return admin;
}

export interface AuthenticatedRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

export async function requireSuperAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") 
      ? authHeader.slice(7) 
      : null;
    
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const firebaseAdmin = getFirebaseAdmin();
    const decoded = await firebaseAdmin.auth().verifyIdToken(token);
    
    if (decoded.superAdmin === true) {
      req.user = decoded;
      return next();
    }

    return res.status(403).json({ error: "Not super admin" });
  } catch (err) {
    console.error("requireSuperAdmin error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
}

export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") 
      ? authHeader.slice(7) 
      : null;
    
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const firebaseAdmin = getFirebaseAdmin();
    const decoded = await firebaseAdmin.auth().verifyIdToken(token);
    
    if (decoded.superAdmin === true || decoded.admin === true) {
      req.user = decoded;
      return next();
    }

    return res.status(403).json({ error: "Not authorized" });
  } catch (err) {
    console.error("requireAdmin error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
}

export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") 
      ? authHeader.slice(7) 
      : null;
    
    if (token) {
      const firebaseAdmin = getFirebaseAdmin();
      const decoded = await firebaseAdmin.auth().verifyIdToken(token);
      req.user = decoded;
    }
    
    return next();
  } catch (err) {
    return next();
  }
}

export async function setSuperAdmin(email: string): Promise<{ uid: string; success: boolean }> {
  try {
    const firebaseAdmin = getFirebaseAdmin();
    const user = await firebaseAdmin.auth().getUserByEmail(email);
    
    const existingClaims = user.customClaims || {};
    
    await firebaseAdmin.auth().setCustomUserClaims(user.uid, {
      ...existingClaims,
      superAdmin: true,
      admin: true,
    });
    
    console.log(`Set superAdmin claim for ${email} (uid: ${user.uid})`);
    return { uid: user.uid, success: true };
  } catch (error) {
    console.error("setSuperAdmin error:", error);
    throw error;
  }
}

export async function setAdminRole(email: string, isAdmin: boolean): Promise<{ uid: string; success: boolean }> {
  try {
    const firebaseAdmin = getFirebaseAdmin();
    const user = await firebaseAdmin.auth().getUserByEmail(email);
    
    const existingClaims = user.customClaims || {};
    
    await firebaseAdmin.auth().setCustomUserClaims(user.uid, {
      ...existingClaims,
      admin: isAdmin,
    });
    
    console.log(`Set admin=${isAdmin} for ${email} (uid: ${user.uid})`);
    return { uid: user.uid, success: true };
  } catch (error) {
    console.error("setAdminRole error:", error);
    throw error;
  }
}

export { admin };
