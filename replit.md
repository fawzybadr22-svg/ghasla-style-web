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
- **Cloud Functions**: Role management via `functions/src/index.ts`
  - `initSuperAdmin`: One-time Super Admin initialization (email-only, no password)
  - `setUserRole`: Role assignment (Super Admin only)
  - `getUserRole`: Role retrieval

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
- **Firebase Configuration**: Requires environment variables:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_APP_ID`

### Database
- **PostgreSQL**: Primary data store
- **Connection**: Requires `DATABASE_URL` environment variable
- **Session Store**: Uses connect-pg-simple for persistent sessions

### Third-Party Integrations
- **WhatsApp Business**: Direct booking via WhatsApp links (phone: +96596068518)
- **Google Maps**: Embedded maps for location-based services
- **Google Fonts**: Tajawal (Arabic) and Inter (English/French) typefaces

### Key NPM Dependencies
- UI: @radix-ui/* components, class-variance-authority, tailwind-merge
- Data: @tanstack/react-query, drizzle-orm, drizzle-zod
- Forms: react-hook-form, zod
- i18n: i18next, react-i18next, i18next-browser-languagedetector
- Animation: framer-motion
- Icons: lucide-react, react-icons