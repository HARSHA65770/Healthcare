# 🚀 Deploying to Vercel

This repository is configured for deployment on **[Vercel](https://vercel.com/)**.

Depending on how you wish to deploy, you can use:
- **Option 1 (Recommended)**: Deploy the Frontend PWA on Vercel and connect to your Render backend (giving you full WebSocket real-time hospital telemetry + persistent database).
- **Option 2**: Deploy the Entire Monorepo (Frontend + Python Serverless API) on Vercel.

---

## ⚡ Option 1: Frontend on Vercel + Backend on Render (Recommended)

Because Vercel serverless functions do not maintain persistent WebSockets (`/ws/telemetry`), deploying the frontend to Vercel's global Edge CDN while keeping the FastAPI server on Render provides the best experience.

### Step-by-Step Instructions:

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Configure Vercel deployment"
   git push origin main
   ```

2. **Open Vercel Dashboard**:
   - Go to [vercel.com/new](https://vercel.com/new) and log in.
   - Under **Import Git Repository**, select **`HARSHA65770/Healthcare`**.

3. **Configure Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select **`frontend`**
   - **Build Command**: `npm run build` (detected automatically)
   - **Output Directory**: `dist` (detected automatically)

4. **Environment Variables**:
   - Add the following variable:
     - **Name**: `VITE_API_URL`
     - **Value**: Your backend URL (e.g. `https://your-app-name.onrender.com` or leave empty if testing offline mode)

5. **Deploy**:
   - Click **Deploy**. Vercel will build and assign you a production URL (e.g., `https://healthcare-pwa.vercel.app`).

---

## 🌐 Option 2: Deploy Full-Stack (Root Repository) on Vercel

If you want to deploy the repository from the root using Vercel's Python Serverless Function support:

1. Go to [vercel.com/new](https://vercel.com/new) and select **`HARSHA65770/Healthcare`**.
2. Leave **Root Directory** as `./` (default).
3. The root [`vercel.json`](./vercel.json), [`api/index.py`](./api/index.py), and [`requirements.txt`](./requirements.txt) will automatically:
   - Build the frontend into `frontend/dist`.
   - Route `/api/*` to the FastAPI serverless function.
   - Route all web views to the single-page application.
4. Click **Deploy**.

> **Note on WebSockets & Persistence:**
> Serverless platforms like Vercel do not support stateful WebSocket connections. If you use Option 2, the live doctor telemetry feed will automatically fall back to REST polling. For production sub-second telemetry, use Option 1 with Render or a VPS.

---

## 🔍 Verification Checklist

After deployment finishes:
- Open your Vercel deployment URL (e.g. `https://<your-project>.vercel.app`).
- Verify the PWA installs and offline caching works via Service Worker / Dexie.
- Open the Doctor Dashboard to check telemetry connection.
- Test speech recognition / OCR vitals intake.
