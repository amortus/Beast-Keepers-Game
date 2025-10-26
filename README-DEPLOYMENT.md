# Beast Keepers - Production Deployment Guide

This guide will walk you through deploying Beast Keepers to production using **Vercel** (frontend + serverless backend) and **Neon** (PostgreSQL database).

## Prerequisites

- Git repository created on GitHub
- Vercel account (sign up with Google at https://vercel.com)
- Neon account (sign up at https://neon.tech - free tier)

## Phase 1: Database Setup (Neon)

### 1. Create Neon Database

1. Go to https://neon.tech and sign in
2. Click "New Project"
3. Name it "beast-keepers-db"
4. Select region closest to your users
5. Click "Create Project"

### 2. Get Connection String

1. In your Neon project dashboard, click "Connection Details"
2. Copy the connection string that looks like:
   ```
   postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. Save this for later - you'll need it for Vercel

### 3. Run Migrations

**IMPORTANT: You must run migrations on your production database!**

1. Create a temporary `.env` file in `/server` folder:
   ```bash
   DATABASE_URL=postgresql://your-connection-string-here
   ```

2. Run migrations:
   ```bash
   cd server
   npm run migrate
   ```

3. Verify tables were created in Neon dashboard (should see: users, game_saves, beasts, inventory, quests, achievements)

4. **DELETE the temporary `.env` file** - never commit it!

## Phase 2: Deploy to Vercel

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

Choose your Google account when prompted.

### 3. Link Project

In your project root:

```bash
cd E:\PROJETOS\Vectorizer\vanilla-game
vercel link
```

- Select "Create new project"
- Name it "beast-keepers" (or your preferred name)
- Confirm root directory

### 4. Configure Environment Variables

Go to your Vercel dashboard (https://vercel.com/dashboard):

1. Click your "beast-keepers" project
2. Go to "Settings" → "Environment Variables"
3. Add these variables (for Production, Preview, and Development):

**Required Variables:**

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://...` | Your Neon connection string |
| `JWT_SECRET` | Generate strong key* | Used for JWT tokens |
| `NODE_ENV` | `production` | Environment mode |
| `FRONTEND_URL` | Leave empty for now** | Will update after first deploy |

*To generate JWT_SECRET, run:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Optional (Google OAuth):**

| Variable | Value | Description |
|----------|-------|-------------|
| `GOOGLE_CLIENT_ID` | Your Google OAuth ID | From Google Console |
| `GOOGLE_CLIENT_SECRET` | Your Google Secret | From Google Console |
| `GOOGLE_CALLBACK_URL` | Will update later | OAuth callback URL |

### 5. First Deployment

```bash
vercel --prod
```

Vercel will:
- Build your client
- Build your server
- Deploy everything
- Give you a URL like: `https://beast-keepers-xxx.vercel.app`

**Save this URL!**

### 6. Update Environment Variables (Second Deploy)

1. Go back to Vercel dashboard → Environment Variables
2. Update `FRONTEND_URL` to your actual URL: `https://beast-keepers-xxx.vercel.app`
3. If using Google OAuth, update `GOOGLE_CALLBACK_URL` to: `https://beast-keepers-xxx.vercel.app/api/auth/google/callback`
4. Save changes

### 7. Update Client Environment

1. Rename `client/env.production` to `client/.env.production`
2. Update the URL:
   ```
   VITE_API_URL=https://beast-keepers-xxx.vercel.app/api
   ```
3. Commit and push:
   ```bash
   git add -A
   git commit -m "Update production API URL"
   git push origin main
   ```

### 8. Second Deployment

```bash
vercel --prod
```

This will redeploy with the correct environment variables.

## Phase 3: Verification

### Test Your Production Site

1. Open your Vercel URL: `https://beast-keepers-xxx.vercel.app`
2. Create a new account
3. Verify you get a random Beast (not always Brontis!)
4. Test game functionality:
   - ✅ Login/Logout
   - ✅ Beast display
   - ✅ Combat system
   - ✅ Exploration
   - ✅ Save/Load game state

### Monitor Logs

In Vercel dashboard:
- Go to "Deployments" tab
- Click latest deployment
- View "Functions" logs for any errors

### Common Issues

**Problem: "502 Bad Gateway" or API errors**
- Check Vercel function logs
- Verify DATABASE_URL is correct
- Ensure migrations ran successfully

**Problem: "CORS error"**
- Verify FRONTEND_URL matches your actual Vercel URL
- Check browser console for the exact origin being blocked

**Problem: "Database connection failed"**
- Verify Neon database is active
- Check connection string includes `?sslmode=require`
- Ensure migrations ran successfully

## Phase 4: Custom Domain (Optional)

### Add Custom Domain

1. Go to Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `FRONTEND_URL` environment variable
5. Redeploy

## Maintenance

### View Logs

```bash
vercel logs https://your-app.vercel.app
```

### Rollback

```bash
vercel rollback
```

### View Deployments

```bash
vercel list
```

## Database Backups

Neon automatically backs up your database. To manually backup:

1. Go to Neon dashboard
2. Click "Backups" tab
3. Click "Create Backup"

## Security Checklist

- ✅ Database connection uses SSL (`?sslmode=require`)
- ✅ JWT_SECRET is strong and unique (64+ characters)
- ✅ Environment variables are set in Vercel (not in code)
- ✅ CORS is configured to only allow your domain
- ✅ `.env` files are in `.gitignore`
- ✅ Google OAuth credentials are kept secret

## Support

If you encounter issues:

1. Check Vercel function logs
2. Check Neon database status
3. Verify all environment variables are set correctly
4. Test API endpoints directly: `https://your-app.vercel.app/api/health`

## Estimated Costs

- **Vercel**: Free tier (sufficient for most indie games)
- **Neon**: Free tier (0.5GB storage, 200 hours compute/month)
- **Total**: $0/month for moderate traffic

---

**Congratulations!** 🎉 Your Beast Keepers game is now live and players worldwide can enjoy raising their unique Beasts!

