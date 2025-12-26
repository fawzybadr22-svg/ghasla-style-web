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
   - Build Command: `npx vite build`
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
curl -X POST https://your-vercel-domain.vercel.app/internal/make-super-admin \
  -H "Content-Type: application/json" \
  -H "X-Super-Admin-Secret: YOUR_SUPER_ADMIN_SECRET" \
  -d '{"email": "fawzybadr22@gmail.com"}'
```

## Project Structure

```
api/
├── index.ts          # Vercel serverless function entry point
└── lib/
    ├── db.ts         # Database connection
    ├── firebaseAdmin.ts  # Firebase Admin SDK
    ├── security.ts   # Rate limiters
    └── storage.ts    # Data access layer

dist/public/          # Vite build output (static files)
vercel.json           # Vercel configuration
```

## Important Notes

1. **Database**: The production PostgreSQL URL should be different from development
2. **CORS**: Make sure to add your production domain to `ALLOWED_ORIGINS`
3. **Firebase Rules**: Deploy Firebase security rules before production
4. **Monitoring**: Set up Vercel Analytics for performance monitoring

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
