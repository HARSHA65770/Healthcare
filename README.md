# 🏥 Autonomous Rural Preventive Healthcare Platform
### *Client-Side Web PWA, Browser WASM-OCR, Vernacular Voice AI, Java Spring Boot & SQL Telemetry Engine*

[![Java](https://img.shields.io/badge/Java-17_LTS-ED8B00?style=flat&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2+-6DB33F?style=flat&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Web Speech API](https://img.shields.io/badge/Web_Speech_API-Telugu_|_Hindi_|_Tamil-FF6B6B?style=flat)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
[![SQL Database](https://img.shields.io/badge/SQL_Database-H2_|_PostgreSQL_|_MySQL-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

---

## 📖 Executive Summary

The **Autonomous Rural Preventive Healthcare Platform** is an end-to-end, zero-install clinical screening system engineered to eliminate rural healthcare access barriers, hardware dependencies, and app-store friction. 

Built to function reliably even with intermittent 2G/3G connectivity in remote village clusters, the platform operates universally inside mobile and desktop web browsers. It integrates **client-side WebAssembly Optical Character Recognition (WASM-OCR)**, **vernacular multi-lingual speech AI**, **real-time geolocation and nearest hospital routing**, **deterministic clinical triage gates**, and a robust **Java Spring Boot 3 enterprise backend** streaming **sub-second WebSocket telemetry broadcasts** to district doctor workstations.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                      CLIENT TIER (React 18 PWA)                        │
│                                                                        │
│  [HTML5 MediaStream / Torch]          ──>  [WASM Edge OCR (Tesseract)] │
│  [Web Speech API (Telugu/Hindi/Tamil)]──>  [IndexedDB (Dexie.js) Cache]│
│  [Browser Geolocation API (GPS)]      ──>  [Haversine Hospital Routing]│
└───────────────────────────────────▲────────────────────────────────────┘
                                    │
                 REST API (/api/v1/*) │ WebSocket (/ws/telemetry)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   BACKEND TIER (Java Spring Boot 3)                    │
│                                                                        │
│  [Spring Web REST Controllers]        ──>  [Clinical Safety Evaluator] │
│  [Spring WebSocket Telemetry Hub]     ──>  [ESI Emergency Triaging]    │
│  [Spring Data JPA Repositories]       ──>  [Hibernate ORM Engine]      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼ JDBC
┌────────────────────────────────────────────────────────────────────────┐
│                         CENTRAL SQL DATABASE                           │
│               (H2 Embedded File / PostgreSQL / MySQL)                  │
│                                                                        │
│  - users               - vitals_timeseries                             │
│  - triage_records      - hospital_registry                             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Two-Tier Database Architecture

To guarantee zero data loss in remote village clusters with spotty or zero cellular coverage:

1. **Tier 1 — Browser Offline Buffer (`IndexedDB` via Dexie.js)**:
   - When a health worker screens a patient with no internet connection, vitals are saved locally into browser IndexedDB.
   - An "Offline Mode" badge alerts the user.
   - As soon as network connectivity is restored, an automatic background sync flushes pending records to the central SQL database.

2. **Tier 2 — Central SQL Database (`Spring Data JPA`)**:
   - Central relational storage for longitudinal patient analytics, clinical audit logs, and hospital registries.
   - Default: Embedded file-based H2 database (`./rural_health_sql.mv.db`) with zero setup needed.
   - Production ready: Seamlessly switchable to **PostgreSQL** or **MySQL** in `application.properties`.

### SQL Schema Overview

| Table | Description |
| :--- | :--- |
| **`users`** | Patient, ASHA worker, and doctor identities, phone hashes, village codes, and GPS coordinates. |
| **`vitals_timeseries`** | Systolic BP, Diastolic BP, SpO₂, Blood Glucose, recorded timestamp, and urgency level (`NORMAL`, `HIGH`, `CRITICAL`). |
| **`triage_records`** | Voice transcripts, clinical entity JSON extractions, ESI triage scores (1–5), doctor notes, and acknowledgment status. |
| **`hospital_registry`** | Directory of Primary Health Centres (PHC) and District Hospitals, emergency helplines, Ayushman Bharat empaneled status, and coordinates. |

---

## 🚀 Quick Start Guide

### Prerequisites
* **Java 17 LTS** or newer
* **Apache Maven 3.8+**
* **Node.js 18+** & npm

---

### Running with 1-Click Batch Scripts (Windows)

1. **Start Both Services**:
   ```bat
   start_all.bat
   ```
2. **Or Start Individually**:
   * Backend: Double-click [`start_backend.bat`](./start_backend.bat) (or [`start_backend_java.bat`](./start_backend_java.bat))
   * Frontend: Double-click [`start_frontend.bat`](./start_frontend.bat)

---

### Running Manually via Terminal

#### 1. Java Spring Boot Backend
```powershell
cd backend-java
$env:MAVEN_OPTS="-Djavax.net.ssl.trustStoreType=WINDOWS-ROOT"
mvn spring-boot:run -Dmaven.test.skip=true
```
* **Server Address**: `http://127.0.0.1:8000`
* **Interactive SQL Console**: `http://127.0.0.1:8000/h2-console`
  * JDBC URL: `jdbc:h2:file:./rural_health_sql`
  * User Name: `sa`
  * Password: *(leave blank)*

#### 2. React Frontend
```powershell
cd frontend
npm install
npm run dev
```
* **Application URL**: `http://localhost:3000`

---

## 💻 Running in Visual Studio Code

A preconfigured [`.vscode/tasks.json`](./.vscode/tasks.json) is included:

1. Press **`Ctrl + Shift + P`** in VS Code.
2. Select **`Tasks: Run Task`**.
3. Choose **`3. Start Both (Full-Stack)`**.
VS Code will launch both the Spring Boot server and Vite frontend in dedicated terminal tabs automatically.

---

## 📡 REST API Reference

All endpoints are hosted at `/api/v1/*` on port `8000`:

### **Authentication & Patient Directory**
* `POST /api/v1/auth/register` &mdash; Register a new patient or health worker.
* `POST /api/v1/auth/login` &mdash; Phone-based login with GPS location update.
* `GET  /api/v1/auth/users` &mdash; List recent registered patients.

### **Vitals & Clinical Triage**
* `POST /api/v1/triage/ingest` &mdash; Ingest vitals, evaluate deterministic clinical safety bounds, calculate ESI score, and broadcast emergency telemetry.
* `GET  /api/v1/triage/active-triage` &mdash; Fetch unacknowledged triage cases for doctor review.
* `POST /api/v1/triage/acknowledge` &mdash; Doctor acknowledgment and clinical review notes.

### **Biometric History & Analytics**
* `GET  /api/v1/vitals/history/{patientId}` &mdash; Longitudinal biometric timeseries for charting.
* `GET  /api/v1/vitals/analytics/summary` &mdash; Aggregated population screening statistics.

### **Hospitals & Geolocation**
* `GET  /api/v1/hospitals/` &mdash; List all registered healthcare facilities.
* `GET  /api/v1/hospitals/nearest?lat={lat}&lng={lng}&village={name}` &mdash; Real-time Haversine distance and ambulance ETA calculation.

### **Real-Time Telemetry Feed**
* `WebSocket /ws/telemetry?district=ALL` &mdash; Sub-second bi-directional live socket for hospital emergency boards.

---

## 🌐 Deploying to Vercel (Frontend)

The frontend is optimized for deployment on **Vercel**:

1. Push your code to GitHub.
2. Import repository on [vercel.com/new](https://vercel.com/new).
3. Select **Root Directory**: `frontend` (or leave default `./`).
4. Framework Preset: **Vite**.
5. Set `VITE_API_URL` to your production backend URL.
6. Click **Deploy**.

For full deployment instructions, see [`VERCEL_DEPLOYMENT.md`](./VERCEL_DEPLOYMENT.md).

---

## 📄 License
This project is licensed under the Apache 2.0 License.
