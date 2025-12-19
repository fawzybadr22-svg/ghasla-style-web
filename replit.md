# Ghasla Style - Mobile Car Wash Service Platform

## Overview

Ghasla Style (غسلة ستايل) is a production-ready fullstack web application for a Kuwaiti mobile car wash service. The platform features online booking, a loyalty points system, a referral "Friends Club" program, and comprehensive admin dashboard capabilities. The application supports three languages (Arabic RTL default, English, French) with light/dark theme modes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, React Context for auth and theme
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens for brand colors (dark orange and blue)
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Internationalization**: react-i18next with JSON translation files for AR/EN/FR support
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **API Design**: RESTful endpoints under `/api/*` prefix
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Schema Validation**: Zod schemas generated from Drizzle tables via drizzle-zod
- **Session Management**: express-session with connect-pg-simple for PostgreSQL session storage

### Data Storage
- **Primary Database**: PostgreSQL accessed via Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Key Entities**: Users, ServicePackages, Orders, LoyaltyConfig, LoyaltyTransactions, Referrals, BlogPosts, Testimonials, GalleryItems, ContactMessages, AuditLogs

### Authentication
- **Provider**: Firebase Authentication (configured in `client/src/lib/firebase.ts`)
- **Methods**: Email/password, Google OAuth, phone authentication for customers
- **Admin Security**: 2FA support for admin accounts
- **Role-Based Access**: customer, admin, super_admin roles via Firebase Custom Claims
- **Firebase Admin SDK**: Server-side token verification and custom claims management
  - `server/firebase-admin.ts`: Admin SDK initialization and middleware
  - `requireSuperAdmin`, `requireAdmin`: Middleware for protected routes
- **Internal Admin Routes** (require SUPER_ADMIN_SECRET):
  - `POST /internal/make-super-admin`: Set superAdmin claim (one-time setup)
  - `POST /internal/set-admin`: Grant/revoke admin role

### Real-Time Features
- **Firestore Orders**: Real-time order tracking with onSnapshot
- **Dual Storage**: PostgreSQL for backend persistence, Firestore for real-time client updates
- **Loyalty Points**: Automatic calculation and application on order completion

### Project Structure
```
client/               # React frontend application
  src/
    components/       # Reusable UI components
      layout/         # Header, Footer, Layout wrapper
      ui/             # shadcn/ui component library
    context/          # React contexts (Auth, Theme)
    hooks/            # Custom React hooks
    lib/              # Utilities, Firebase config, i18n, query client
      firebase.ts            # Firebase app initialization
      firebase-functions.ts  # Cloud Functions client helpers
      firestore-orders.ts    # Firestore order management
    types/            # TypeScript type definitions
      firestore-order.ts     # Firestore order types
    pages/            # Route page components
      admin/          # Admin dashboard pages
server/               # Express backend
  db.ts              # Database connection
  index.ts           # Express app entry point
  routes.ts          # API route definitions
  storage.ts         # Data access layer
  static.ts          # Static file serving for production
  vite.ts            # Vite dev server integration
shared/               # Shared code between client and server
  schema.ts          # Drizzle database schema and Zod types
functions/            # Firebase Cloud Functions
  src/
    index.ts         # Cloud Functions (initSuperAdmin, setUserRole, getUserRole)
  README.md          # Setup and deployment instructions
```

### Build and Development
- **Development**: `npm run dev` runs tsx for hot-reloading server with Vite middleware
- **Production Build**: `npm run build` compiles client with Vite and bundles server with esbuild
- **Database Migrations**: `npm run db:push` uses drizzle-kit to sync schema with database

## External Dependencies

### Firebase Services
- **Firebase Authentication**: User authentication and identity management
- **Firebase Admin SDK**: Server-side authentication and custom claims
- **Firebase Configuration**: Requires environment variables:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_APP_ID`
  - `FIREBASE_SERVICE_ACCOUNT` (optional): JSON string of service account for production
  - `SUPER_ADMIN_SECRET`: Secret for one-time super admin setup via /internal/* routes

### Database
- **PostgreSQL**: Primary data store
- **Connection**: Requires `DATABASE_URL` environment variable
- **Session Store**: Uses connect-pg-simple for persistent sessions

### Third-Party Integrations
- **WhatsApp Business**: Direct booking via WhatsApp links (phone: +96597960808)
- **Google Maps**: Embedded maps for location-based services
- **Google Fonts**: Tajawal (Arabic) and Inter (English/French) typefaces

### Key NPM Dependencies
- UI: @radix-ui/* components, class-variance-authority, tailwind-merge
- Data: @tanstack/react-query, drizzle-orm, drizzle-zod
- Forms: react-hook-form, zod
- i18n: i18next, react-i18next, i18next-browser-languagedetector
- Animation: framer-motion
- Icons: lucide-react, react-icons
- Security: express-rate-limit, helmet

## Security Configuration

### Rate Limiting (server/security.ts + server/routes.ts)
Rate limiting is implemented using `express-rate-limit` to protect against abuse. Rate limiters are defined in `server/security.ts` and applied to routes in `server/routes.ts`:

| Route Pattern | Limit | Window | Purpose |
|---------------|-------|--------|---------|
| `/api/*` (general) | 100 requests | 1 minute | General API protection |
| `/api/auth/*` | 10 requests | 1 minute | Authentication endpoints |
| `/api/users/*` | 10 requests | 1 minute | User account operations |
| `/api/orders/*` | 20 requests | 1 minute | Order creation/management |
| `/api/contact/*` | 5 requests | 1 minute | Contact form submissions |
| `/internal/*` | 5 requests | 1 hour | Admin setup routes (very strict) |

**To modify limits**: Edit the `rateLimit()` configurations in `server/security.ts`. Adjust `windowMs` (milliseconds) and `max` (request count) values.

### CORS Configuration (server/index.ts)
CORS is configured dynamically based on environment:

**Development Mode**:
- Allows all origins for local testing

**Production Mode**:
- Only allows origins specified in `ALLOWED_ORIGINS` environment variable
- Set `ALLOWED_ORIGINS` as comma-separated list of allowed domains:
  ```
  ALLOWED_ORIGINS=https://ghaslastyle.com,https://admin.ghaslastyle.com,https://delegate.ghaslastyle.com
  ```

**Allowed Methods**: GET, POST, PUT, PATCH, DELETE, OPTIONS
**Allowed Headers**: Content-Type, Authorization, X-Requested-With
**Credentials**: Enabled
**Preflight Cache**: 24 hours (86400 seconds)

### HTTPS Enforcement
- **Automatic Redirect**: In production, all HTTP requests are automatically redirected to HTTPS (301 redirect)
- **Detection**: Uses `x-forwarded-proto` header (standard for reverse proxies like Replit/Cloudflare)
- **Replit**: HTTPS is enforced automatically by Replit's infrastructure

### Security Headers (Helmet)
The `helmet` middleware adds these security headers:
- X-DNS-Prefetch-Control
- X-Frame-Options (clickjacking protection)
- X-Content-Type-Options (MIME sniffing protection)
- Referrer-Policy
- X-XSS-Protection

**Note**: Content-Security-Policy is disabled for development compatibility with Vite HMR.

### Authentication & Authorization Middleware
Located in `server/firebase-admin.ts`:

| Middleware | Access Level | Protected Routes |
|------------|--------------|------------------|
| `requireAuth` | Any authenticated user | Customer-specific data |
| `requireDelegate` | Delegate, Admin, Super Admin | `/api/delegate/*` |
| `requireAdmin` | Admin, Super Admin | `/api/admin/*` (most routes) |
| `requireSuperAdmin` | Super Admin only | `/api/admin/admins/*`, admin management |

### Environment Variables (Secrets)
All sensitive data stored as encrypted secrets (never in code):
- `SUPER_ADMIN_SECRET`: One-time admin setup
- `SESSION_SECRET`: Session encryption
- `FIREBASE_SERVICE_ACCOUNT`: Firebase Admin SDK credentials
- `DATABASE_URL`: PostgreSQL connection string
- `VITE_FIREBASE_*`: Firebase client configuration

### Audit Logging
All admin actions are logged to `auditLogs` table with:
- Action type
- Performing user ID
- Target collection/ID
- Old/new values
- Timestamp

## Firebase Production Deployment

### Deploying Security Rules
Before going to production, deploy Firebase security rules:

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Or deploy everything at once
firebase deploy --only firestore,storage
```

### Security Rules Files
- `firestore.rules` - Firestore database access rules
- `storage.rules` - Firebase Storage access rules
- `firestore.indexes.json` - Composite indexes for queries
- `firebase.json` - Firebase project configuration

### Pre-Production Checklist
1. All secrets configured in Replit Secrets panel (not in code)
2. Firebase security rules deployed (not in test mode)
3. Set `ALLOWED_ORIGINS` for production domains
4. Test all user roles: Super Admin, Admin, Delegate, Customer
5. Verify rate limiting is working correctly
6. Check HTTPS redirect in production