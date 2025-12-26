# Vercel Deployment Guide for Ghasla Style

## Prerequisites

1. A Vercel account linked to your GitHub/GitLab repository
2. A PostgreSQL database (Neon, Supabase, or other provider)
3. Firebase project with Authentication enabled

## Environment Variables

Set these environment variables in Vercel Dashboard > Project Settings > Environment Variables:

### Required Secrets
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Random string for session encryption
- `SUPER_ADMIN_SECRET` - Secret for admin setup (keep this secure)
- `FIREBASE_SERVICE_ACCOUNT` - Firebase Admin SDK service account JSON

### Firebase Client Config (prefix with VITE_)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

### Security
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins (e.g., `https://yourdomain.com,https://www.yourdomain.com`)

## Package.json Setup (IMPORTANT)

Before deploying, you must manually add these to your package.json:

```json
{
  "scripts": {
    "build:vercel": "vite build"
  },
  "engines": {
    "node": ">=20.11.0"
  }
}
```

## Deployment Steps

1. **Push to Repository**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push
   ```

2. **Import Project in Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Framework: Vite
   - Build Command: `npm run build:vercel`
   - Output Directory: `dist/public`

3. **Configure Environment Variables**
   - Add all the environment variables listed above
   - Make sure sensitive values are marked as "Encrypted"

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete

## Post-Deployment Setup

### Set Up Super Admin
After deployment, run this curl command to set up the super admin:

```bash
curl -X POST https://YOUR_DOMAIN.vercel.app/api/internal/make-super-admin \
  -H "Content-Type: application/json" \
  -H "X-Super-Admin-Secret: YOUR_SUPER_ADMIN_SECRET" \
  -d '{"email": "fawzybadr22@gmail.com"}'
```

### Test API Health
```bash
curl https://YOUR_DOMAIN.vercel.app/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-01-01T00:00:00.000Z"}
```

## Project Structure

```
api/
├── index.ts          # Express app (Vercel serverless entry)
├── [...path].ts      # Catch-all handler for /api/*
└── lib/
    ├── db.ts         # Database connection
    ├── firebaseAdmin.ts  # Firebase Admin SDK
    ├── security.ts   # Rate limiters
    └── storage.ts    # Data access layer

dist/public/          # Vite build output (static files)
vercel.json           # Vercel configuration
```

## API Routes

All API routes are under `/api/*`:
- `GET /api/health` - Health check
- `GET /api/packages` - Service packages
- `GET /api/areas` - Kuwait service areas
- `POST /api/internal/make-super-admin` - Setup super admin
- `POST /api/internal/set-admin` - Set admin role
- `POST /api/internal/set-delegate` - Set delegate role

## Important Notes

1. **Database**: The production PostgreSQL URL should be different from development
2. **CORS**: Make sure to add your production domain to `ALLOWED_ORIGINS`
3. **Firebase Rules**: Deploy Firebase security rules before production
4. **Monitoring**: Set up Vercel Analytics for performance monitoring
5. **Node Version**: Requires Node.js >= 20.11.0 for `import.meta.dirname` support

## Troubleshooting

### API returns 500 errors
- Check Vercel Function logs in the dashboard
- Verify DATABASE_URL is correct
- Ensure all required environment variables are set

### CORS issues
- Add your domain to ALLOWED_ORIGINS
- Make sure the domain matches exactly (with/without www)

### Firebase Authentication fails
- Verify all VITE_FIREBASE_* variables are set correctly
- Check that FIREBASE_SERVICE_ACCOUNT JSON is valid

### Build fails with import.meta.dirname error
- Ensure `engines.node` is set to `>=20.11.0` in package.json
- Vercel should use Node 20+ automatically
