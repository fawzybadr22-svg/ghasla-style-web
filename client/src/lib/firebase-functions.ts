/**
 * Firebase Cloud Functions Client
 * 
 * Helper functions to call Firebase Cloud Functions for role management.
 * 
 * USAGE:
 * 
 * 1. Initialize Super Admin (one-time only):
 *    await initializeSuperAdmin("MY_INIT_SUPER_SECRET_123");
 * 
 * 2. Set user role (requires Super Admin):
 *    await setUserRoleFunction("user@example.com", "admin");
 * 
 * 3. Get user role:
 *    const role = await getUserRoleFunction("user@example.com");
 */

import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import { app } from "./firebase";

const functions = getFunctions(app);

if (import.meta.env.DEV && import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === "true") {
  connectFunctionsEmulator(functions, "localhost", 5001);
}

export interface InitSuperAdminResponse {
  message: string;
  email: string;
  uid: string;
}

export interface SetUserRoleResponse {
  message: string;
  targetUid: string;
  role: string;
}

export interface GetUserRoleResponse {
  email: string;
  uid: string;
  role: string;
  displayName?: string;
}

/**
 * Initialize the first Super Admin account
 * This function can only be called ONCE
 * 
 * @param initSecret - The initialization secret (set via firebase functions:config:set admin.secret="...")
 * @returns Success response with Super Admin details
 * @throws Error if already initialized or invalid secret
 */
export async function initializeSuperAdmin(initSecret: string): Promise<InitSuperAdminResponse> {
  const initSuperAdmin = httpsCallable<{ initSecret: string }, InitSuperAdminResponse>(
    functions,
    "initSuperAdmin"
  );
  
  const result = await initSuperAdmin({ initSecret });
  return result.data;
}

/**
 * Set a user's role (Super Admin only)
 * 
 * @param targetEmail - Email of the user to update
 * @param role - New role ("admin" | "customer")
 * @returns Success response
 * @throws Error if not Super Admin or invalid parameters
 */
export async function setUserRoleFunction(
  targetEmail: string, 
  role: "admin" | "customer"
): Promise<SetUserRoleResponse> {
  const setUserRole = httpsCallable<{ targetEmail: string; role: string }, SetUserRoleResponse>(
    functions,
    "setUserRole"
  );
  
  const result = await setUserRole({ targetEmail, role });
  return result.data;
}

/**
 * Get a user's role
 * Super Admin/Admin can check any user
 * Regular users can only check themselves
 * 
 * @param email - Email of the user (optional, defaults to current user)
 * @returns User role information
 */
export async function getUserRoleFunction(email?: string): Promise<GetUserRoleResponse> {
  const getUserRole = httpsCallable<{ email?: string }, GetUserRoleResponse>(
    functions,
    "getUserRole"
  );
  
  const result = await getUserRole({ email });
  return result.data;
}

/**
 * Helper to check if current user is Super Admin
 * Use this before showing role management UI
 */
export async function checkIsSuperAdmin(): Promise<boolean> {
  try {
    const result = await getUserRoleFunction();
    return result.role === "super_admin";
  } catch {
    return false;
  }
}

/**
 * Helper to check if current user is Admin or Super Admin
 * Use this for admin dashboard access
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const result = await getUserRoleFunction();
    return result.role === "admin" || result.role === "super_admin";
  } catch {
    return false;
  }
}
