# 🚀 Deploying to Render (Java Spring Boot + React + SQL)

This repository is configured for seamless deployment on **[Render](https://render.com/)** using Docker.

Render builds both the **React Frontend** and the **Java Spring Boot 3 Backend** into a unified, self-contained container running on port `$PORT`.

---

## ⚡ Option A: Automated 1-Click Blueprint (Recommended)

Render Blueprints use the [`render.yaml`](./render.yaml) file in this repository to automatically configure the service.

### Step 1: Push Changes to GitHub
Make sure your latest code is pushed:
```bash
git add .
git commit -m "Configure Render Docker deployment for Java and React"
git push origin main
```

### Step 2: Connect to Render
1. Go to **[dashboard.render.com](https://dashboard.render.com/)** and log in.
2. Click **New +** in the top navigation bar and select **Blueprint**.
3. Select your repository: **`HARSHA65770/Healthcare`**.
4. Render will detect `render.yaml` automatically.
5. Click **Apply**. Render will build the multi-stage Docker image and deploy your service!

---

## 🛠️ Option B: Manual Web Service Setup

If you prefer setting it up manually in the Render dashboard:

1. In Render Dashboard, click **New +** &rarr; **Web Service**.
2. Connect your repository: **`HARSHA65770/Healthcare`**.
3. Fill in the following settings:
   - **Name**: `healthcare-platform` (or your chosen name)
   - **Region**: Choose closest region (e.g. `Oregon`, `Frankfurt`, `Singapore`)
   - **Branch**: `main`
   - **Root Directory**: *(leave blank)*
   - **Runtime**: **`Docker`**
   - **Plan Type**: `Free`
4. Click **Create Web Service**.

Render will automatically build using the [`Dockerfile`](./Dockerfile) and start your application.

---

## 🌐 Verifying Your Deployment

Once Render finishes deploying (marked with a green **Live** badge):

1. **Web App (React PWA & Telemetry Portal)**:
   ```text
   https://<your-service-name>.onrender.com/
   ```
2. **REST APIs**:
   ```text
   https://<your-service-name>.onrender.com/api/v1/hospitals/
   ```
3. **Live Doctor Telemetry WebSocket**:
   ```text
   wss://<your-service-name>.onrender.com/ws/telemetry?district=ALL
   ```

---

## 💡 Persistent Database (Optional)

By default, the embedded SQL database persists locally. If you want permanent multi-region storage across all redeployments:
1. In Render Dashboard, click **New +** &rarr; **PostgreSQL**.
2. Copy the **Internal Database URL** provided by Render.
3. In your Web Service settings, add the environment variable:
   - `SPRING_DATASOURCE_URL`: `jdbc:postgresql://<render-db-host>:5432/<db-name>`
   - `SPRING_DATASOURCE_USERNAME`: `<db-user>`
   - `SPRING_DATASOURCE_PASSWORD`: `<db-password>`
Hibernate JPA will automatically connect and manage the schema!
