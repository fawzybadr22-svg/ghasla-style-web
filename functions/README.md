# Ghasla Style - Firebase Cloud Functions

## Overview

This directory contains Firebase Cloud Functions for managing user roles and authentication in the Ghasla Style mobile car wash application.

## Functions

### 1. `initSuperAdmin` (One-time Setup)

Initializes the first Super Admin account. This function can only be called **ONCE**.

**Parameters:**
- `initSecret`: The initialization secret (must match the configured admin.secret)

**Security:**
- Uses a secret key known only to the project owner
- Cannot be called again after successful initialization
- No password involved - relies on pre-registered email

### 2. `setUserRole` (Super Admin Only)

Assigns roles to users. Only Super Admin can call this function.

**Parameters:**
- `targetEmail`: Email of the user to update
- `role`: New role ("admin" | "customer")

**Notes:**
- Cannot assign "super_admin" role (use initSuperAdmin instead)
- Cannot modify the Super Admin's role

### 3. `getUserRole`

Retrieves a user's current role.

**Parameters:**
- `email`: (Optional) Email of user to check. Defaults to caller.

**Access:**
- Super Admin/Admin can check any user
- Regular users can only check themselves

## Setup Instructions

### 1. Configure Firebase CLI

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init functions
```

### 2. Set the Admin Secret

```bash
# Set the initialization secret (choose a strong, unique value)
firebase functions:config:set admin.secret="MY_INIT_SUPER_SECRET_123"
```

### 3. Deploy Functions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### 4. Initialize Super Admin

From your client app or Firebase console, call the `initSuperAdmin` function with the secret you configured:

```typescript
import { initializeSuperAdmin } from "@/lib/firebase-functions";

// Call this ONCE to set up the first Super Admin
const result = await initializeSuperAdmin("MY_INIT_SUPER_SECRET_123");
console.log(result.message); // "Initial super admin created."
```

**Important:** The user with email `fawzybadr22@gmail.com` must already exist in Firebase Auth before calling this function.

## Role Hierarchy

1. **super_admin** - Full system access, can manage all roles
2. **admin** - Dashboard access, can manage customers and orders
3. **customer** - Regular user access, can place orders and track them

## Security Notes

- The `admin.secret` is only used for initial setup and should be kept secure
- After initialization, role management is done through `setUserRole` which requires Super Admin authentication
- Custom claims are stored in Firebase Auth tokens and are verified on every request
- Token refresh is required after role changes for the new role to take effect

## Local Development

To use the Firebase Emulator Suite:

```bash
# Start emulators
firebase emulators:start

# In your client app, set the environment variable
VITE_USE_FUNCTIONS_EMULATOR=true
```

## File Structure

```
functions/
├── src/
│   └── index.ts      # Cloud Functions implementation
├── lib/              # Compiled JavaScript (generated)
├── package.json      # Dependencies
├── tsconfig.json     # TypeScript config
└── README.md         # This file
```
