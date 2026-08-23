# CatchQ Healthcare & Clinic Queue Management System

A comprehensive healthcare clinic management and real-time patient queue system.

---

## ??? Architecture Overview

The system consists of 5 main sub-projects:

| Project | Stack | Default Port | Description |
| :--- | :--- | :--- | :--- |
| **`catchq-landing`** | Next.js (Tailwind) | `http://localhost:3000` | Marketing & product landing page |
| **`clinic-backend`** | NestJS (TypeORM, Socket.io) | `http://localhost:3001` | Core REST API & WebSocket server |
| **`final-frontend`** | Next.js 15 (shadcn/ui) | `http://localhost:3002` | Clinic Admin Dashboard & live queue manager |
| **`clinic-registration`**| Next.js | `http://localhost:3003` | Clinic onboarding & doctor schedule setup |
| **`Mobile-App`** | React Native (Redux) | Android / iOS | Patient appointment booking & queue tracking |
| **`Database`** | PostgreSQL 16 | `localhost:5432` | Relational database (tables, wards, beds, queues) |

---

## ?? Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18+ or v20+
- **Docker**: Docker Desktop (or local PostgreSQL 16)
- **npm** or **pnpm**

### 2. Start Local Database
Launch the pre-configured PostgreSQL database with schemas and sample seed data:
```bash
docker compose up -d
```
*Database will be available at `localhost:5432` (db: `catchq`, user: `postgres`, password: `postgrespassword`).*

### 3. Environment Configuration
Copy the `.env.example` templates to `.env` / `.env.local` files:

- **`clinic-backend/.env`**:
  ```env
  DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/catchq
  DB_SSL=false
  PORT=3001
  NODE_ENV=development
  CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003
  ```
- **`final-frontend/.env.local`**:
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:3001/api
  NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
  ```
- **`clinic-registration/.env.local`**:
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:3001/api
  NEXT_PUBLIC_ADMIN_URL=http://localhost:3002
  ```

### 4. Run All Services Concurrently
From the root directory:
```bash
# Start backend, admin dashboard, landing page, and registration portal
npm run dev
```

Or run individual services:
```bash
npm run dev:backend    # Starts NestJS Backend on :3001
npm run dev:admin      # Starts Admin Dashboard on :3002
npm run dev:landing    # Starts Landing Page on :3000
npm run dev:register   # Starts Registration Portal on :3003
```

---

## ?? Mobile App Setup (`Mobile-App`)

1. Navigate to the mobile app folder:
   ```bash
   cd Mobile-App
   ```
2. Configure `.env.development`:
   - Android Emulator: `BACKEND_HOST=http://10.0.2.2:3001`
   - iOS Simulator: `BACKEND_HOST=http://localhost:3001`
   - Physical Device: `BACKEND_HOST=http://<YOUR_COMPUTER_IP>:3001`
3. Launch:
   ```bash
   npm run android:dev   # For Android
   npm run ios:dev       # For iOS
   ```

---

## ?? Verification & Building

Run type checks across all packages:
```bash
npm run typecheck
```

Build all web packages:
```bash
npm run build:all
```
