# 🚀 Deploying to Render

This repository is configured for seamless deployment on **[Render](https://render.com/)**.

You can deploy the application using either **Option A (Automated 1-Click Blueprint - Recommended)** or **Option B (Manual Web Service)**.

---

## ⚡ Option A: Automated 1-Click Blueprint (Recommended)

Render Blueprints use the [`render.yaml`](file:///c:/Users/aareh/OneDrive/Desktop/HealthCare/render.yaml) file in this repository to automatically configure the build command, start command, and environment settings.

### Step 1: Push Changes to GitHub
Make sure your latest code is pushed to your GitHub repository:
```bash
git add .
git commit -m "Configure Render deployment"
git push origin main
```

### Step 2: Connect to Render
1. Go to **[dashboard.render.com](https://dashboard.render.com/)** and log in.
2. Click **New +** in the top navigation bar and select **Blueprint**.
3. Connect your GitHub account and select your repository: **`HARSHA65770/Healthcare`**.
4. Render will detect `render.yaml` automatically.
5. Click **Apply**. Render will start building and deploying your application immediately!

---

## 🛠️ Option B: Manual Web Service Setup

If you prefer to configure the service manually via the Render UI:

1. In Render Dashboard, click **New +** -> **Web Service**.
2. Select your repository: **`HARSHA65770/Healthcare`**.
3. Fill in the following settings:
   - **Name**: `healthcare-platform` (or your preferred name)
   - **Region**: Choose the closest region (e.g., `Oregon`, `Frankfurt`, `Singapore`)
   - **Branch**: `main`
   - **Root Directory**: *(leave blank)*
   - **Runtime**: `Python 3`
   - **Build Command**: `./render-build.sh`  
     *(Or manually: `cd frontend && npm install && npm run build && cd .. && pip install -r backend/requirements.txt`)*
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Plan Type**: `Free`
4. Under **Environment Variables**, add:
   - `PYTHON_VERSION`: `3.11.9`
   - `DATABASE_URL`: `sqlite:///./rural_health.db`
5. Click **Create Web Service**.

---

## 🐳 Option C: Deploy Using Docker

This repository also includes a production multi-stage [`Dockerfile`](file:///c:/Users/aareh/OneDrive/Desktop/HealthCare/Dockerfile).

1. In Render Dashboard, click **New +** -> **Web Service**.
2. Select your repository.
3. Set **Runtime** to **`Docker`**.
4. Render will automatically build the image using the `Dockerfile` and launch the container on `$PORT`.

---

## 🌐 Verifying Your Deployment

Once Render finishes deploying (marked with a green **Live** badge):

1. **Web PWA & Doctor Dashboard**: Open the public URL provided by Render:
   ```
   https://<your-service-name>.onrender.com
   ```
2. **Interactive Swagger API Docs**:
   ```
   https://<your-service-name>.onrender.com/docs
   ```
3. **Live Telemetry WebSocket Feed**:
   ```
   wss://<your-service-name>.onrender.com/ws/telemetry?district=ALL
   ```

---

## 💡 Notes & Best Practices

- **Free Tier Sleep Behavior**: Render's free tier services spin down after 15 minutes of inactivity. When a new request arrives, it may take 30-50 seconds to wake up (cold start).
- **Persistent Database**: By default, SQLite stores data in `./rural_health.db`. On Render's free tier, local disk files reset between redeploys. If you want permanent persistence across restarts, create a free **PostgreSQL Database** on Render, copy its **Internal Database URL**, and set it as the `DATABASE_URL` environment variable in your Web Service settings. The application automatically adapts to PostgreSQL without code modifications.
