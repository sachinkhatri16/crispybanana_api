# 🍌 Banana Rush — Full PERN Stack Puzzle Game

A fast-paced missing-digit puzzle game powered by the [Marc Conrad Banana API](https://marcconrad.com/uob/banana/) and built on the **PERN stack** (PostgreSQL, Express, React, Node.js) with Prisma ORM.

---

## ✨ Features

- **🔐 User Authentication & Authorization**:
  - Full **Registration** and **Login** with bcrypt password hashing (10 salt rounds).
  - JWT token-based authentication with secure session handling.
  - **100 FREE Points Registration Bonus**: Every new player starts with 100 bonus points in PostgreSQL.
  - **Login Required to Play**: Unauthenticated users see an interactive prompt with registration and login shortcuts or practice via the demo.
  - **Zero Data Leakage**: Password hashes and environment credentials are never exposed.

- **⏱️ 60-Second Step-Wise Timer Scoring**:
  - **Tier 1 (Blitz Step: 60s – 40s)**: ⚡ **+15 points**
  - **Tier 2 (Steady Step: 39s – 20s)**: 🔥 **+10 points**
  - **Tier 3 (Clutch Step: 19s – 0s)**: ⏱️ **+5 points**
  - **Streak Multipliers**: +2 bonus points per consecutive solve.

- **💡 3-Option Step-Wise Hints**:
  - **Option 1 (−10 pts)**: Range clue (reveals whether the digit is Low: 0–4 or High: 5–9).
  - **Option 2 (−15 pts)**: Parity clue (reveals whether the digit is Even or Odd).
  - **Option 3 (−20 pts)**: Elimination clue (narrows the digit down to 2 choices).
  - Points deduct **immediately** from PostgreSQL `user_metrics.total_score` and update live on the screen without interrupting the timer or locking the keypad.

- **🛡️ Resilient API & Architecture**:
  - Server proxy sanitizes upstream Marc Conrad PHP notices/warnings (`<br /> <b>Warning...`).
  - Modular architecture with `cors.js`, `prisma.js`, `logger.js`, `error.middleware.js`, `auth.middleware.js`, `axios.js`, and `services.js`.
  - Built-in fallback puzzles guarantee 100% uptime.

- **🎮 Interactive Demo & Practice**:
  - Step-by-step interactive demo explaining equation solving, timer tiers, and hint unlocking.
  - Interactive on-screen 0–9 keypad and practice mode.

- **♛ PostgreSQL Live Leaderboard**:
  - 100% database-driven from PostgreSQL (`banana_game` database) with zero hardcoded entries.
  - Tracks total score, highest score, win rate, and streaks.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **PostgreSQL** running locally on port `5432` with database `banana_game`

### 2. Configure Environment
Copy `.env.example` to `.env` in the `server` directory and adjust if needed:
```bash
cp server/.env.example server/.env
```

### 3. Run the Express Backend
```bash
cd server
npm install
npm run dev
```
The server starts on `http://localhost:5000`.

### 4. Run the React Frontend
```bash
cd client
npm install
npm run dev
```
The client starts on `http://localhost:5173`.

### 5. Run the Test Suite
```bash
node server/test-suite.js
```

---

## 🔒 Security & Data Protection
- Database passwords and secrets are strictly loaded from `.env` (gitignored).
- Passwords are encrypted with `bcryptjs` and stripped before returning user entities.
- Parameterized SQL / Prisma queries prevent SQL injection.
