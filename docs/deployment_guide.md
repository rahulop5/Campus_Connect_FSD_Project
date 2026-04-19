# Campus Connect — Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUCTION                               │
│                                                                  │
│   ┌──────────────┐         ┌──────────────────────────────────┐ │
│   │   VERCEL      │  HTTPS  │      RENDER / RAILWAY             │ │
│   │   Frontend    │ ──────► │      Backend (Docker)             │ │
│   │   React SPA   │         │      Express + Apollo             │ │
│   │   (Free tier) │         │                                    │ │
│   └──────────────┘         │  ┌───────┐   ┌──────────────┐    │ │
│                             │  │ Redis │   │ Elasticsearch │    │ │
│                             │  │(addon)│   │   (optional)  │    │ │
│                             │  └───────┘   └──────────────┘    │ │
│                             └──────────────────────────────────┘ │
│                                       │                          │
│                              ┌────────▼────────┐                │
│                              │  MongoDB Atlas   │                │
│                              │   (Cloud DB)     │                │
│                              └─────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Frontend Deployment (Vercel)

### Is the Frontend Folder Independent?
**Yes!** The `frontend/` folder is fully self-contained with its own:
- `package.json` (all dependencies)
- `vite.config.js` (build config)
- `vercel.json` (Vercel routing config)
- No imports from `../backend` — all communication is via API calls

### Step-by-Step: Deploy to Vercel

#### 1. Push Code to GitHub
```bash
git add .
git commit -m "Add deployment config"
git push origin main
```

#### 2. Import Project in Vercel
1. Go to [vercel.com](https://vercel.com) → Sign in with GitHub
2. Click **"Add New Project"**
3. Select your GitHub repo: `Campus_Connect_FSD_Project`
4. **Important**: In the "Root Directory" field, type: **`frontend`**
5. Vercel auto-detects Vite — confirm these settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

#### 3. Configure Environment Variables
In Vercel Dashboard → Project Settings → **Environment Variables**, add:

| Variable | Value | Example |
|----------|-------|---------|
| `VITE_API_URL` | Your deployed backend URL + `/api` | `https://campus-connect-api.onrender.com/api` |
| `VITE_BACKEND_URL` | Your deployed backend URL (no `/api`) | `https://campus-connect-api.onrender.com` |

> **Important**: Vite env variables MUST start with `VITE_` to be exposed to the client.

#### 4. Deploy
Click **"Deploy"** — Vercel will build and deploy automatically.

#### 5. Post-Deploy Checklist
- [ ] App loads at `https://your-app.vercel.app`
- [ ] Login works (API calls reach backend)
- [ ] Google/GitHub OAuth redirects work (update OAuth callback URLs in Google/GitHub console)
- [ ] Profile pictures load correctly
- [ ] Client-side routing works (refresh on `/dashboard` doesn't 404)

### Vercel Files
```
frontend/
├── vercel.json        ← SPA routing config (all routes → index.html)
├── package.json       ← Dependencies + build script
├── vite.config.js     ← Vite build config
└── src/
    └── api/axios.js   ← Uses VITE_API_URL env variable
```

---

## Part 2: Backend Deployment (Docker / Render)

You have several options for deploying the backend with Docker. Here are the most practical ones:

### Option A: Render.com (Recommended — Free Tier + Docker)

Render supports Docker natively and has a free tier.

#### 1. Create a `render.yaml` (Blueprint)
This is already handled — Render auto-detects the Dockerfile.

#### 2. Deploy on Render
1. Go to [render.com](https://render.com) → Sign in with GitHub
2. Click **"New" → "Web Service"**
3. Connect your GitHub repo
4. Configure:
   - **Root Directory**: `backend`
   - **Environment**: **Docker**
   - **Instance Type**: Free (or Starter for paid)

#### 3. Set Environment Variables
In Render Dashboard → Environment:

| Variable | Value |
|----------|-------|
| `PORT` | `3000` |
| `MONGO_URI` | `mongodb+srv://vvrahul2006_db_user:vUNUKrmrEZeJLXCW@cluster0.o5rdsum.mongodb.net/campusconnect` |
| `JWT_SECRET` | `your_jwt_secret` |
| `EXPRESS_SESSION_SECRET` | `your_session_secret` |
| `GOOGLE_CLIENT_ID` | Your Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth secret |
| `GITHUB_CLIENT_ID` | Your GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | Your GitHub OAuth secret |
| `RAZORPAY_KEY_ID` | Your Razorpay key |
| `RAZORPAY_KEY_SECRET` | Your Razorpay secret |
| `REDIS_HOST` | (see Redis addon below) |
| `REDIS_PORT` | `6379` |

#### 4. Add Redis (Optional)
Render has a Redis addon:
1. Go to **"New" → "Redis"**
2. Select Free tier
3. Copy the connection URL
4. Set `REDIS_HOST` in your backend service env

#### 5. Deploy
Click **"Create Web Service"** — Render builds the Docker image and deploys.

Your backend will be available at: `https://campus-connect-api.onrender.com`

---

### Option B: Railway.app (Easy Docker + Redis built-in)

Railway is another great option with built-in Redis and Docker support.

#### 1. Deploy
1. Go to [railway.app](https://railway.app) → Sign in with GitHub
2. Click **"New Project" → "Deploy from GitHub repo"**
3. Select your repo
4. Set **Root Directory**: `backend`
5. Railway auto-detects the Dockerfile

#### 2. Add Redis
1. In your Railway project, click **"+ New" → "Database" → "Add Redis"**
2. Railway automatically creates `REDIS_URL` environment variable
3. Your backend code already handles this via `REDIS_HOST` and `REDIS_PORT`

#### 3. Set Environment Variables
Same as the Render table above, plus Railway auto-provides service URLs.

---

### Option C: Digital Ocean / AWS (Full Docker Compose)

For running the full `docker-compose.yml` with all 4 services:

#### Using a VPS (DigitalOcean Droplet, AWS EC2, etc.)
```bash
# 1. SSH into your server
ssh root@your-server-ip

# 2. Install Docker & Docker Compose
curl -fsSL https://get.docker.com | sh
apt install docker-compose-plugin

# 3. Clone your repo
git clone https://github.com/your-username/Campus_Connect_FSD_Project.git
cd Campus_Connect_FSD_Project

# 4. Create .env file
cat > .env << 'EOF'
MONGO_URI=mongodb+srv://vvrahul2006_db_user:vUNUKrmrEZeJLXCW@cluster0.o5rdsum.mongodb.net/campusconnect
JWT_SECRET=your_jwt_secret
EXPRESS_SESSION_SECRET=your_session_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
EOF

# 5. Build and start everything
docker compose up --build -d

# 6. Check status
docker compose ps

# Frontend: http://your-server-ip
# Backend:  http://your-server-ip:3000
# GraphQL:  http://your-server-ip:3000/graphql
```

---

## Part 3: Post-Deployment Configuration

### 1. Update OAuth Callback URLs

After deploying, update your OAuth apps with the new URLs:

**Google Console** (console.cloud.google.com):
```
Authorized redirect URIs:
  https://campus-connect-api.onrender.com/api/auth/google/callback
```

**GitHub Developer Settings** (github.com/settings/developers):
```
Authorization callback URL:
  https://campus-connect-api.onrender.com/api/auth/github/callback
```

### 2. Update CORS in Backend

Make sure your backend `index.js` allows the Vercel frontend origin:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',                    // Local dev
    'https://your-app.vercel.app',              // Production frontend
    'https://campus-connect.vercel.app'         // Custom domain
  ],
  credentials: true
}));
```

### 3. Update Razorpay Callback URL
In Razorpay Dashboard → Settings → Webhooks, add your production backend URL.

### 4. MongoDB Atlas Network Access
Make sure MongoDB Atlas allows connections from your backend's IP:
- Atlas → Network Access → Add IP Address
- For Render/Railway: Add `0.0.0.0/0` (allow all) or their specific IP ranges

---

## Part 4: Environment Variables Reference

### Frontend (Vercel)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Backend API URL, e.g., `https://campus-connect-api.onrender.com/api` |
| `VITE_BACKEND_URL` | ✅ | Backend base URL (for OAuth, profile pics), e.g., `https://campus-connect-api.onrender.com` |

### Backend (Render/Railway/Docker)
| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | ✅ | Server port (usually 3000) |
| `MONGO_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | JWT signing secret |
| `EXPRESS_SESSION_SECRET` | ✅ | Session encryption key |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth secret |
| `GITHUB_CLIENT_ID` | Optional | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | Optional | GitHub OAuth secret |
| `RAZORPAY_KEY_ID` | Optional | Razorpay payment key |
| `RAZORPAY_KEY_SECRET` | Optional | Razorpay payment secret |
| `REDIS_HOST` | Optional | Redis hostname (defaults to localhost) |
| `REDIS_PORT` | Optional | Redis port (defaults to 6379) |
| `ELASTICSEARCH_URL` | Optional | Elasticsearch URL (defaults to http://localhost:9200) |

---

## Deployment Checklist

### Before Deploying
- [ ] All code pushed to GitHub
- [ ] No hardcoded `localhost` URLs (all use env variables now ✅)
- [ ] `.env` file is in `.gitignore` (never push secrets)

### Frontend (Vercel)
- [ ] Root directory set to `frontend`
- [ ] `VITE_API_URL` and `VITE_BACKEND_URL` set in Vercel env
- [ ] Deployment successful, app loads
- [ ] SPA routing works (refresh on any page works)

### Backend (Render/Railway)
- [ ] Root directory set to `backend` 
- [ ] Dockerfile detected, build succeeds
- [ ] All environment variables set
- [ ] MongoDB Atlas allows the server's IP
- [ ] API health check: `GET /` returns response
- [ ] Swagger docs accessible at `/api-docs`
- [ ] GraphQL playground accessible at `/graphql`

### OAuth
- [ ] Google callback URL updated to production backend
- [ ] GitHub callback URL updated to production backend

### CORS
- [ ] Backend CORS allows Vercel frontend domain
