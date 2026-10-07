# 🏥 Autonomous Rural Preventive Healthcare Platform
### *Client-Side Web PWA, Browser WASM-OCR, Vernacular Voice AI, Real-Time Geolocation & Hospital Telemetry*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![WebAssembly OCR](https://img.shields.io/badge/WASM_OCR-Tesseract.js-5c2d91?style=flat)](https://tesseract.projectnaptha.com/)
[![Web Speech API](https://img.shields.io/badge/Web_Speech_API-Telugu_|_Hindi_|_Tamil-FF6B6B?style=flat)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
[![Python Tests](https://img.shields.io/badge/pytest-10_passed-brightgreen?style=flat&logo=pytest&logoColor=white)](https://docs.pytest.org/)

---

## 📖 Executive Summary

The **Autonomous Rural Preventive Healthcare Platform** is an end-to-end, zero-install clinical screening system engineered to eliminate rural healthcare access barriers, hardware dependencies, and app-store friction. 

Built to function seamlessly across intermittent 2G/3G connectivity in remote village clusters, the platform operates universally inside mobile and desktop web browsers. It integrates **client-side WebAssembly Optical Character Recognition (WASM-OCR)**, **vernacular multi-lingual speech AI**, **real-time geolocation and nearest hospital emergency routing**, **deterministic clinical triage gates**, and **sub-second WebSocket telemetry broadcasts** to district doctor workstations.

---

## 🏛️ System Architecture & Data Flow

```
+---------------------------------------------------------------------------------------+
|                             CLIENT TIER (PWA WEB - BYOD)                              |
|                                                                                       |
|  [HTML5 MediaStream (Torch / Mic)]       -->   [Tesseract.js WASM Edge OCR]           |
|  [Web Speech API (Telugu/Hindi/Tamil)]   -->   [IndexedDB (Dexie.js) Offline Buffer]  |
|  [Browser Geolocation API (GPS)]         -->   [Offline Nearest Hospital Engine]      |
+---------------------------------------------------------------------------------------+
                                            │
                         REST API Ingestion / WebSocket Telemetry
                                            ▼
+---------------------------------------------------------------------------------------+
|                           FASTAPI APPLICATION ENGINE CORE                             |
|                                                                                       |
|  [API Gateway & Auth Router]             -->   [Deterministic Clinical Safety Gate]   |
|  [Haversine Nearest Hospital Engine]     -->   [Schema-Locked LLM Triage (JSON)]      |
|  [NeMo Prescription Guardrail Filter]    -->   [Hospital WebSocket Telemetry Hub]     |
|  [SQLAlchemy / SQLite / TimescaleDB]                                                  |
+---------------------------------------------------------------------------------------+
                                            │
                             Sub-Second Live WebSocket Feed
                                            ▼
+---------------------------------------------------------------------------------------+
|                                CLINICAL DISPATCH TIER                                 |
|                                                                                       |
|  [Hospital Doctor Workstation (Live)]    -->   [Automated SMS / IVR Telephony Gateway]|
|  [Primary Health Centre Token Allocator] -->   [ASHA Village Field Worker Alerts]     |
|  [Google Maps Emergency Routing]         -->   [108 Ambulance Dispatch Coordinates]   |
+---------------------------------------------------------------------------------------+
```

---

## 🌟 Key Technical Features

### 1. 📍 Real-Time Geolocation & Nearest Hospital Emergency Routing
- **Dual Geolocation Modes**:
  - Automatically queries device GPS (`navigator.geolocation`) with high precision coordinates.
  - If device GPS is disabled or denied, smoothly falls back to the patient's registered rural village cluster (e.g., *Adilabad Rural*, *Utnoor Tribal Agency*, *Asifabad Komaram Bheem*, *Nirmal Mandal*, *Hyderabad*).
- **Proximity Calculation Engine**:
  - Computes distances using the **Haversine formula** on both the FastAPI backend and within a client-side offline mathematical fallback.
  - Calculates estimated rural ambulance arrival times (averaging 45 km/h response speeds).
- **Emergency Action Card**:
  - Prominently displays the closest healthcare facility with facility classification (*Medical College & District Hospital*, *Community Health Centre (CHC)*, *Primary Health Centre (PHC)*).
  - One-tap direct call to hospital emergency lines and **108 Free Rural Ambulance**.
  - Turn-by-turn **Google Maps navigation** link with live coordinates.
  - Detailed directory of hospital capabilities (ICU, Snakebite Antivenom, Blood Bank, Dialysis, Ayushman Bharat PM-JAY coverage).

### 2. 📸 In-Browser Optical Recognition (WASM-OCR & 7-Segment Regex)
- Accesses camera via HTML5 `MediaStream` with torch toggle for dimly lit rural households.
- Applies client-side canvas pre-processing: greyscale conversion, contrast boosting, and Otsu adaptive thresholding.
- Pattern matching regex extracts 7-segment digital Blood Pressure (SYS/DIA) and Glucose readouts locally inside the browser with zero server round-trip latency.

### 3. 🎙️ Vernacular Voice AI (Indian Regional Languages)
- Native speech recognition and vernacular voice synthesis for:
  - **Telugu** (`te-IN`)
  - **Hindi** (`hi-IN`)
  - **Tamil** (`ta-IN`)
  - **English** (`en-IN`)
- Transcribes regional spoken descriptions into clinical symptoms, generates vernacular spoken guidance, and speaks advice back to the patient.

### 4. 🛡️ Deterministic Clinical Safety Gate & Emergency Triage Matrix
- **Tier 1: Resuscitative Emergency (ESI 1)**:
  - *Criteria*: BP &ge; 180/120 mmHg, SpO2 &lt; 90%, Glucose &gt; 350 or &lt; 60 mg/dL, crushing chest pain radiating to left arm.
  - *Action*: Bypasses queue, triggers audible siren alert on doctor workstations, fires automated emergency SMS/IVR, initiates 108 ambulance dispatch.
- **Tier 2: High Risk / Sub-Acute (ESI 2–3)**:
  - *Criteria*: BP 140–179 mmHg, persistent fever &gt; 3 days, cough &gt; 2 weeks (TB warning), pregnancy complications.
  - *Action*: Reserves priority PHC consultation slot, notifies village ASHA health worker.
- **Tier 3: Moderate Risk (ESI 4)**:
  - *Criteria*: Pre-hypertensive drift, seasonal viral symptoms.
  - *Action*: Issues vernacular hydration/lifestyle guidance, schedules 48-hour follow-up.
- **Tier 4: Preventive Baseline (ESI 5)**:
  - *Criteria*: Normal physiological vitals.
  - *Action*: Saves baseline into database, schedules routine 30-day monitoring.

### 5. 🛑 NeMo Guardrails Anti-Hallucination Pipeline
- Schema-locked JSON responses strictly verified with Pydantic v2.
- Deterministic regex guardrail blocks prescription drug names and dosage recommendations (e.g., *paracetamol*, *500mg*, *amoxicillin*), directing patients to certified medical officers.

### 6. 📶 Offline Buffer & Auto-Sync Recovery
- Telemetry records are buffered into local **IndexedDB (Dexie.js)** when cellular connectivity drops.
- Automatically pushes cached readings to the backend upon network reconnection.
- Generates fallback emergency SMS links (`sms:108?body=...`) if critical emergencies occur offline.

### 7. 💻 Hospital Doctor Workstation & Telemetry Board
- Real-time WebSocket broadcasting (`ws://127.0.0.1:8000/ws/telemetry`) to doctor dashboards.
- Review triage cases, verify AI extractions, add clinical override notes, and track longitudinal vitals trends.

---

## 🗂️ Project Directory Structure

```
HealthCare/
├── backend/
│   ├── main.py                     # FastAPI application entrypoint & middleware
│   ├── models/
│   │   ├── database.py             # SQLAlchemy models (User, Vitals, Triage, Hospital)
│   │   └── schemas.py              # Pydantic v2 request/response validation schemas
│   ├── routers/
│   │   ├── auth_router.py          # Patient registration, authentication & location binding
│   │   ├── hospitals_router.py     # Nearest hospital engine, Haversine lookup & directory
│   │   ├── triage_router.py        # Clinical safety gate & ingestion pipeline
│   │   └── vitals_router.py        # Timeseries longitudinal vitals history
│   ├── services/
│   │   ├── dispatch_service.py     # Automated SMS & IVR telephony dispatch
│   │   ├── guardrails.py           # NeMo anti-prescription safety guardrails
│   │   ├── llm_triage.py           # Clinical evaluation & vernacular translation
│   │   ├── safety_gate.py          # Deterministic physiological bound checks
│   │   └── websocket_hub.py        # Telemetry broadcast hub for doctor workstations
│   └── tests/
│       ├── test_hospitals_location.py # Tests for Haversine distance & nearest hospital API
│       └── test_triage.py             # Tests for deterministic triage tiers & safety gate
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DoctorPortal.tsx           # Hospital doctor review dashboard
│   │   │   ├── HospitalServices.tsx       # Government hospital directory with live distance
│   │   │   ├── LoginPage.tsx              # Mobile/ABHA authentication with GPS check
│   │   │   ├── Navbar.tsx                 # Header navigation & quick controls
│   │   │   ├── NearestHospitalCard.tsx    # Location-aware closest hospital card
│   │   │   ├── OcrModal.tsx               # WASM-OCR live camera modal
│   │   │   ├── OfflineSyncBadge.tsx       # Network connectivity indicator & auto-sync
│   │   │   ├── PatientPwa.tsx             # Primary patient screening interface
│   │   │   ├── ProfileModal.tsx           # Digital Health Card & patient records
│   │   │   ├── RegistrationModal.tsx      # Quick patient registration modal
│   │   │   ├── RegistrationPage.tsx       # Patient intake & ABHA ID generation
│   │   │   └── SimulationsModal.tsx       # Clinical scenario preset selector
│   │   ├── db/
│   │   │   └── indexedDb.ts               # Dexie.js offline persistence
│   │   ├── services/
│   │   │   ├── api.ts                     # API client & WebSocket connector
│   │   │   ├── locationService.ts         # Browser GPS & offline nearest hospital engine
│   │   │   ├── ocrScanner.ts              # Canvas pre-processing & OCR extraction
│   │   │   ├── theme.ts                   # Theme switcher (Dark, Emerald, Slate, Indigo)
│   │   │   └── vernacularVoice.ts         # Web Speech API recognition & synthesis
│   │   ├── App.tsx                        # Master application coordinator
│   │   └── main.tsx                       # React DOM root entry
│   ├── package.json                       # Frontend dependencies & scripts
│   ├── tsconfig.json                      # TypeScript configuration
│   └── vite.config.ts                     # Vite build & proxy settings (Port 3000)
├── .gitignore                             # Git ignore rules for node_modules, cache, logs
├── README.md                              # Complete platform documentation
├── run_tests.bat                          # Automated pytest batch runner
├── start_all.bat                          # 1-Click launcher for Backend + Frontend
├── start_backend.bat                      # Standalone backend launcher
└── start_frontend.bat                     # Standalone frontend launcher
```

---

## ⚙️ Installation & Setup

### Prerequisites
- **Python**: 3.11+
- **Node.js**: v18+ (tested on v20 & v24)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/<YOUR_GITHUB_USERNAME>/HealthCare.git
cd HealthCare
```

### 2. Backend Setup
```bash
# Optional: Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate       # On Windows
# source venv/bin/activate  # On Linux / macOS

# Install dependencies
pip install fastapi uvicorn sqlalchemy pydantic pytest httpx
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cd ..
```

---

## 🚀 Running the Platform

### Option A: 1-Click Launch (Windows)
Double-click `start_all.bat` or run:
```cmd
start_all.bat
```
This launches both the FastAPI backend and Vite frontend in separate terminal windows.

### Option B: Manual Launch

#### Terminal 1 — Backend Core API:
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
- **API Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Live WebSocket Feed**: `ws://127.0.0.1:8000/ws/telemetry`

#### Terminal 2 — Frontend PWA Portal:
```bash
cd frontend
npm run dev
```
- **Web Platform URL**: [http://localhost:3000](http://localhost:3000)

---

## 🧪 Testing Suite

### Run Backend Unit & Integration Tests:
```bash
python -m pytest backend/tests -v
```
Or simply run:
```cmd
run_tests.bat
```

**Test Coverage**:
- `test_hospitals_location.py`:
  - Validates Haversine distance mathematics.
  - Validates ambulance transit time estimation formula.
  - Tests `GET /api/v1/hospitals/nearest` with village presets and device GPS coordinates.
- `test_triage.py`:
  - Validates deterministic Tier 1 hypertensive crisis bounds (BP &ge; 180/120).
  - Validates deterministic Tier 1 hypoxemia bounds (SpO2 &lt; 90%).
  - Validates Tier 2 sub-acute symptoms and TB warning alerts.
  - Validates Tier 4 baseline health tracking.
  - Validates NeMo guardrail filters against unauthorized drug prescriptions.

### Run Frontend Build Check:
```bash
cd frontend
npm run build
```

---

## 📡 API Reference Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Registers a patient profile with contact info and village/GPS coordinates. |
| `POST` | `/api/v1/auth/login` | Authenticates via mobile number or ABHA ID and records user location. |
| `GET`  | `/api/v1/hospitals/nearest` | **Nearest hospital lookup**: accepts `lat`, `lng`, or `village`; returns closest hospital, distance, emergency phone, and Google Maps URL. |
| `GET`  | `/api/v1/hospitals/` | Retrieves the full government hospital directory. |
| `POST` | `/api/v1/triage/ingest` | Primary intake: verifies safety bounds, executes LLM triage, broadcasts critical alerts. |
| `GET`  | `/api/v1/triage/active-triage` | Returns active triage cases for hospital doctor dashboards. |
| `POST` | `/api/v1/triage/acknowledge` | Records doctor review, override notes, and incident resolutions. |
| `GET`  | `/api/v1/vitals/history/{id}` | Retrieves longitudinal biometric timeseries for longitudinal analysis. |
| `WS`   | `/ws/telemetry` | Sub-second WebSocket stream for doctor workstations. |

---

## 🧪 Interactive Scenario Presets

Click the **"Scenario Presets"** button in the top navigation to test all major operational modes:
1. **Scenario 1 — Hypertensive Crisis (Tier 1)**: BP 195/125, SpO2 88%, triggers immediate siren, nearest hospital dispatch, and emergency 108 action.
2. **Scenario 2 — Sub-Acute TB Warning (Tier 2)**: BP 152/96, persistent cough &gt; 2 weeks, fever, reserves priority PHC slot.
3. **Scenario 3 — Pre-Hypertension (Tier 3)**: BP 134/86, generates vernacular lifestyle recommendations.
4. **Scenario 4 — Normal Baseline (Tier 4)**: BP 116/76, SpO2 99%, records baseline data.
5. **Scenario 5 — NeMo Guardrail Filter**: Tests automatic rejection of prescription medications.
6. **Scenario 6 — Offline Disconnect Simulator**: Toggles browser offline mode to demonstrate IndexedDB queuing and auto-sync recovery.

---

## 📄 License
This project is developed for rural public healthcare optimization and preventive community welfare. Distributed under the MIT License.
