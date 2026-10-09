# ☕ Java Spring Boot + SQL Backend Architecture

The application now supports a full **Enterprise Java Spring Boot 3 + SQL Database** backend alongside the **React 18** frontend.

---

## 🏗️ Architecture Overview

```
[React 18 Frontend]  (Port 3000)
       │
       ├── REST API: /api/v1/* ─────────────┐
       │                                     ▼
       └── WebSocket: /ws/telemetry ────> [Spring Boot 3 Backend] (Port 8000)
                                             │
                                             ▼ Spring Data JPA (Hibernate)
                                          [SQL Database]
                                          (H2 File DB / PostgreSQL / MySQL)
```

---

## 📁 Java Backend Structure (`backend-java/`)

```
backend-java/
├── pom.xml                                      # Maven dependencies (Spring Web, JPA, WebSocket, Validation, SQL drivers)
└── src/main/
    ├── resources/
    │   └── application.properties               # SQL connection, server port 8000, and H2 console config
    └── java/com/healthcare/
        ├── HealthcareApplication.java          # Spring Boot main entry point
        ├── config/
        │   ├── CorsConfig.java                 # Cross-origin policy for React PWA
        │   ├── WebSocketConfig.java            # WebSocket mapping for /ws/telemetry
        │   └── DataSeeder.java                 # Automatic demo data seeder on first boot
        ├── entity/                             # JPA SQL Entities
        │   ├── User.java                       # Table: users
        │   ├── VitalsTimeseries.java           # Table: vitals_timeseries
        │   ├── TriageRecord.java               # Table: triage_records
        │   └── HospitalRegistry.java           # Table: hospital_registry
        ├── repository/                         # Spring Data JPA Repositories
        │   ├── UserRepository.java
        │   ├── VitalsRepository.java
        │   ├── TriageRecordRepository.java
        │   └── HospitalRepository.java
        ├── dto/                                # Request & Response JSON DTOs
        │   ├── VitalsIngestionRequest.java
        │   ├── IngestionResponse.java
        │   ├── DoctorAcknowledgeRequest.java
        │   ├── UserDTO.java
        │   ├── RegisterRequest.java
        │   ├── LoginRequest.java
        │   └── NearestHospitalResponse.java
        ├── service/
        │   ├── TriageService.java              # Clinical safety gates & ESI calculations
        │   ├── VitalsService.java              # Longitudinal timeseries analytics
        │   ├── HospitalService.java            # Haversine distance & emergency routing
        │   ├── AuthService.java                # Patient/Doctor authentication & hashing
        │   └── WebSocketTelemetryHub.java      # Sub-second live doctor telemetry broadcaster
        └── controller/                         # Spring REST Controllers
            ├── TriageController.java           # /api/v1/triage/*
            ├── VitalsController.java           # /api/v1/vitals/*
            ├── HospitalController.java         # /api/v1/hospitals/*
            └── AuthController.java             # /api/v1/auth/*
```

---

## 🚀 How to Run the Java Backend

### Option A: Using the Batch Script
Simply double-click:
```bat
start_backend_java.bat
```

### Option B: Using Terminal
```powershell
cd backend-java
$env:MAVEN_OPTS="-Djavax.net.ssl.trustStoreType=WINDOWS-ROOT"
mvn spring-boot:run
```

The Spring Boot backend will start on **`http://127.0.0.1:8000`**.

---

## 🌐 Running Frontend with Java Backend

Because the Java backend uses the exact same port (`8000`) and endpoint contracts (`/api/v1/*` and `/ws/telemetry`), **the React frontend connects to it automatically with zero configuration changes!**

1. Start Java Backend: Run [`start_backend_java.bat`](./start_backend_java.bat)
2. Start React Frontend: Run [`start_frontend.bat`](./start_frontend.bat) (runs on `http://localhost:3000`)
3. Open `http://localhost:3000` in your browser. All vitals intake, voice triage, nearest hospital routing, and live doctor feeds will communicate with Java and store into SQL.

---

## 🗄️ Viewing & Querying the SQL Database

An interactive **SQL Web GUI (H2 Console)** is enabled:
1. Open your browser and navigate to: **[http://localhost:8000/h2-console](http://localhost:8000/h2-console)**
2. Enter the following connection parameters:
   - **JDBC URL**: `jdbc:h2:file:./rural_health_sql`
   - **User Name**: `sa`
   - **Password**: *(leave empty)*
3. Click **Connect**.
4. You can write raw SQL queries like:
   ```sql
   SELECT * FROM users;
   SELECT * FROM vitals_timeseries ORDER BY recorded_at DESC;
   SELECT * FROM triage_records;
   SELECT * FROM hospital_registry;
   ```

---

## 🔄 Switching to PostgreSQL or MySQL

By default, the backend uses a local file-based SQL database (`rural_health_sql.mv.db`). To connect to external **PostgreSQL** or **MySQL**:

Open [`backend-java/src/main/resources/application.properties`](./backend-java/src/main/resources/application.properties) and update:

### For PostgreSQL:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/rural_health
spring.datasource.username=postgres
spring.datasource.password=your_password
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
```

### For MySQL:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/rural_health?useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=your_password
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect
```
Hibernate will automatically create all tables and indexes upon starting!
