/**
 * Ghasla Style - Firebase Cloud Functions
 * 
 * This file contains Cloud Functions for:
 * - initSuperAdmin: One-time initialization of the first Super Admin
 * - setUserRole: Role management by Super Admin
 * 
 * SETUP INSTRUCTIONS:
 * Before deploying, set the admin secret from Firebase CLI:
 * 
 *   firebase functions:config:set admin.secret="MY_INIT_SUPER_SECRET_123"
 * 
 * Then deploy the functions:
 * 
 *   cd functions
 *   npm install
 *   npm run build
 *   firebase deploy --only functions
 * 
 * To call initSuperAdmin from client (one-time only):
 * 
 *   const initSuperAdmin = httpsCallable(functions, 'initSuperAdmin');
 *   await initSuperAdmin({ initSecret: 'MY_INIT_SUPER_SECRET_123' });
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const INITIAL_SUPER_ADMIN_EMAIL = "fawzybadr22@gmail.com";

/**
 * Get the admin secret from Firebase Functions config
 * Set via: firebase functions:config:set admin.secret="YOUR_SECRET"
 */
function getAdminSecret(): string {
  const config = functions.config();
  if (!config.admin?.secret) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Admin secret not configured. Run: firebase functions:config:set admin.secret=\"YOUR_SECRET\""
    );
  }
  return config.admin.secret;
}

/**
 * initSuperAdmin - One-time HTTPS Callable Function
 * 
 * Initializes the first Super Admin account using email only (no password).
 * This function can only be called ONCE - subsequent calls will fail.
 * 
 * @param data.initSecret - The initialization secret (must match admin.secret config)
 * @returns Success message or throws error
 * 
 * Security:
 * - Uses a secret key known only to the project owner
 * - Can only be executed once (checks if super_admin already exists)
 * - No password involved - relies on email + secret verification
 */
export const initSuperAdmin = functions.https.onCall(
  async (data: { initSecret?: string }) => {
    const SUPER_SECRET = getAdminSecret();

    if (!data.initSecret) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "initSecret is required"
      );
    }

    if (data.initSecret !== SUPER_SECRET) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Invalid initialization secret"
      );
    }

    try {
      const user = await admin.auth().getUserByEmail(INITIAL_SUPER_ADMIN_EMAIL);
      
      if (user.customClaims?.role === "super_admin") {
        throw new functions.https.HttpsError(
          "already-exists",
          "Super Admin has already been initialized. This function can only be called once."
        );
      }

      await admin.auth().setCustomUserClaims(user.uid, { 
        role: "super_admin",
        initializedAt: new Date().toISOString()
      });

      console.log(`Super Admin initialized successfully for: ${INITIAL_SUPER_ADMIN_EMAIL}`);

      return { 
        message: "Initial super admin created.",
        email: INITIAL_SUPER_ADMIN_EMAIL,
        uid: user.uid
      };

    } catch (error: unknown) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      const firebaseError = error as { code?: string; message?: string };
      
      if (firebaseError.code === "auth/user-not-found") {
        throw new functions.https.HttpsError(
          "not-found",
          `User with email ${INITIAL_SUPER_ADMIN_EMAIL} does not exist. Please create the account first.`
        );
      }

      console.error("Error initializing super admin:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to initialize super admin"
      );
    }
  }
);

/**
 * setUserRole - HTTPS Callable Function for Role Management
 * 
 * Allows Super Admin to assign roles to other users.
 * Only users with role === "super_admin" can call this function.
 * 
 * @param data.targetEmail - Email of the user to update
 * @param data.role - New role to assign ("admin" | "customer")
 * @returns Success message or throws error
 * 
 * Valid roles:
 * - "super_admin" - Cannot be assigned via this function (only via initSuperAdmin)
 * - "admin" - Full admin access to dashboard
 * - "customer" - Regular customer access
 */
export const setUserRole = functions.https.onCall(
  async (
    data: { targetEmail?: string; role?: string },
    context: functions.https.CallableContext
  ) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to manage user roles"
      );
    }

    const callerRole = context.auth.token.role as string | undefined;
    if (callerRole !== "super_admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only Super Admin can manage user roles"
      );
    }

    if (!data.targetEmail) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "targetEmail is required"
      );
    }

    if (!data.role) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "role is required"
      );
    }

    const validRoles = ["admin", "customer"];
    if (!validRoles.includes(data.role)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        `Invalid role. Valid roles are: ${validRoles.join(", ")}. Use initSuperAdmin to create super_admin.`
      );
    }

    try {
      const targetUser = await admin.auth().getUserByEmail(data.targetEmail);

      if (targetUser.customClaims?.role === "super_admin") {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Cannot modify Super Admin role"
        );
      }

      await admin.auth().setCustomUserClaims(targetUser.uid, { 
        role: data.role,
        updatedAt: new Date().toISOString(),
        updatedBy: context.auth.uid
      });

      console.log(`Role ${data.role} assigned to ${data.targetEmail} by ${context.auth.token.email}`);

      return { 
        message: `Role "${data.role}" assigned successfully to ${data.targetEmail}`,
        targetUid: targetUser.uid,
        role: data.role
      };

    } catch (error: unknown) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      const firebaseError = error as { code?: string };
      
      if (firebaseError.code === "auth/user-not-found") {
        throw new functions.https.HttpsError(
          "not-found",
          `User with email ${data.targetEmail} does not exist`
        );
      }

      console.error("Error setting user role:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to set user role"
      );
    }
  }
);

/**
 * getUserRole - HTTPS Callable Function to get a user's role
 * 
 * Allows checking a user's current role.
 * Super Admin can check any user's role.
 * Regular users can only check their own role.
 * 
 * @param data.email - Email of the user to check (optional, defaults to caller)
 * @returns User's role information
 */
export const getUserRole = functions.https.onCall(
  async (
    data: { email?: string },
    context: functions.https.CallableContext
  ) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in"
      );
    }

    const callerRole = context.auth.token.role as string | undefined;
    const callerEmail = context.auth.token.email;
    const targetEmail = data.email || callerEmail;

    if (targetEmail !== callerEmail && callerRole !== "super_admin" && callerRole !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You can only check your own role"
      );
    }

    try {
      const user = await admin.auth().getUserByEmail(targetEmail!);
      
      return {
        email: targetEmail,
        uid: user.uid,
        role: user.customClaims?.role || "customer",
        displayName: user.displayName
      };

    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      
      if (firebaseError.code === "auth/user-not-found") {
        throw new functions.https.HttpsError(
          "not-found",
          `User not found`
        );
      }

      throw new functions.https.HttpsError(
        "internal",
        "Failed to get user role"
      );
    }
  }
);
