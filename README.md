# 🍌 Banana Rush — Enterprise PERN Stack Puzzle Game

**Unit:** CIS046-3 Software For Enterprise (Assignment 1)  
**Author:** Sachin Khatri  
**Stack:** PostgreSQL · Express.js · React 18 · Node.js · Prisma ORM

A fast-paced missing-digit mathematical puzzle game powered by [Marc Conrad's Banana API](https://marcconrad.com/uob/banana/) and engineered around the four CIS046-3 enterprise themes: **Version Control & Modular Architecture**, **Event-Driven Programming**, **Hardened Interoperability (BFF Gateway)**, and **Virtual Identity & Security**.

---

## ✨ Key Capabilities

- **🔐 Dual-Transport Virtual Identity (`HTTP-Only Cookie` + `Bearer JWT`)**:
  - `POST /api/auth/register` and `POST /api/auth/login` hash credentials with `bcryptjs` (10 salt rounds), issue a 7-day HMAC-SHA256 signed JWT (RFC 7519), and set an `HttpOnly`, `SameSite=Strict` (`Secure` in production) cookie named `token` alongside the JSON payload.
  - `authenticateToken` (`server/src/middleware/auth.middleware.js`) verifies either `Authorization: Bearer <token>` or the `token` HTTP-Only cookie (parsed via lightweight `cookieParser` middleware in `server/src/index.js`).
  - `POST /api/auth/logout` clears the HTTP-Only `token` cookie (`res.clearCookie('token', ...)`), invoked alongside client state cleanup in `AuthContext`.
  - **100 FREE Registration Bonus Points**: New accounts are atomically initialized in PostgreSQL `user_metrics` with 100 starting points.
  - **Zero Data Leakage**: `password_hash` and secrets are never returned to clients.

- **⚡ Event-Driven Gameplay & Authoritative Scoring**:
  - **Server-Side `EventEmitter` (`server/src/events/gameEventEmitter.js`)**: Decouples HTTP controllers from asynchronous telemetry and audit logging via two domain events:
    - `round:completed` (`{ userId, scoreAwarded, streak, isCorrect }`) — logs round completion and dispatches 3-streak milestone multiplier alerts (`streak > 0 && streak % 3 === 0`).
    - `hint:unlocked` (`{ userId, hintLevel, cost }`) — logs hint purchase telemetry asynchronously without blocking HTTP responses.
  - **60-Second Step-Wise Timer Tiers** (calculated server-side from authoritative timing):
    - **Blitz Tier (60s–40s remaining)**: ⚡ **+15 pts**
    - **Steady Tier (39s–20s remaining)**: 🔥 **+10 pts**
    - **Clutch Tier (19s–0s remaining)**: ⏱️ **+5 pts**
    - **Streak Multiplier**: `+2` bonus points per consecutive solve.

- **🛡️ Hardened BFF Gateway Pattern & Anti-Cheat (`server/src/controllers/game.controller.js`)**:
  - **Signed `puzzleToken` Anti-Cheat**: `GET /api/game/puzzle` returns `{ question, puzzleToken }` — the puzzle `solution` is **never** exposed in the response payload or browser DevTools.
  - **Server-Side Hint & Answer Verification**:
    - `POST /api/game/hint` validates `{ hintLevel, puzzleToken }` on the server, deducts points immediately in PostgreSQL (`-10`, `-15`, or `-20` pts), emits `hint:unlocked`, and computes `hintText` (Range / Parity / Elimination) server-side.
    - `POST /api/game/round` validates `{ puzzleToken, userAnswer, timeLimitSeconds, timeTakenMs, status }` on the server, verifies correctness against the signed `puzzleToken`, calculates authoritative tier and streak points (ignoring any tampered client score fields), persists `game_rounds` + `user_metrics`, and emits `round:completed`.
  - **PHP Notice Sanitization & Timeout Guard**: Enforces a 5-second `AbortSignal.timeout(5000)` on upstream HTTPS requests and applies `text.match(/\{[\s\S]*\}/)` to strip upstream PHP HTML notices/warnings (`<br /> <b>Warning...`) before `JSON.parse`.
  - **3-Failure Circuit Breaker & Offline Cache**: Trips `OPEN` after 3 consecutive upstream failures (30-second cooldown before `HALF_OPEN` probe) and serves validated puzzles from a rolling cache (`MAX_CACHED_PUZZLES = 20`) and built-in fallback pool for 100% uptime.

- **🏆 PostgreSQL Live Leaderboard & Interactive Practice**:
  - Real-time leaderboard (`GET /api/leaderboard`) queried from PostgreSQL via Prisma ORM.
  - Interactive walkthrough demo, on-screen 0–9 keypad, and keyboard shortcuts (`handleKeyDown`).

---

## 🏗️ CIS046-3 Architectural Evaluation (Themes 1–4)

| Theme | Chosen Architecture | Alternative Contrasted & Trade-Offs |
| :--- | :--- | :--- |
| **Theme 1: Version Control & Code Structure** | **Decoupled PERN Layered Architecture** (`routes/` → `controllers/` → `middleware/` → `events/` / `config/` / `utils/`) with feature branches, `.github/pull_request_template.md`, Conventional Commits, and semantic tag `v1.0.0`. | **Monolithic SSR (e.g., PHP / Java Spring MVC):** Avoids CORS setup and separate package trees, but tightly couples UI rendering to server compute and hinders independent CDN hosting or future mobile clients. |
| **Theme 2: Event-Driven Programming** | **Node.js `EventEmitter` + React `SyntheticEvent` + Drift-Resistant Timestamps:** Top-level event delegation on the React root minimizes DOM listeners; `Date.now() - roundStartTime` avoids `setInterval` main-thread drift; server `gameEvents` keeps audit/milestone logging non-blocking. | **Direct Native DOM Listeners + Synchronous Controller Logging:** Per-button native listeners increase memory overhead and cross-browser inconsistency; inline synchronous logging/telemetry adds latency to HTTP round responses. |
| **Theme 3: Interoperability & BFF Gateway** | **Hardened BFF Proxy (`GET /api/game/puzzle`):** Express mediates HTTPS calls to Marc Conrad's PHP API, strips PHP HTML warnings via regex, enforces a 3-failure circuit breaker with offline cache, and signs `puzzleToken` so `solution` never leaves the server. | **Direct Client `fetch()` to Banana API:** Triggers browser CORS blocks, leaks `{ question, solution }` directly in the browser Network Tab (trivial DevTools cheating), and crashes the UI on upstream PHP warning HTML or outages. |
| **Theme 4: Virtual Identity & Security** | **Dual-Transport Stateless JWT (`HttpOnly`, `SameSite=Strict` Cookie + `Bearer` Header) + `bcryptjs`:** `HttpOnly` blocks JS cookie reads (XSS mitigation) while `SameSite=Strict` + strict CORS `credentials: true` defend against CSRF; Prisma tracks persistent credentials and gamified metrics. | **`localStorage`-only JWT vs Stateful Server Sessions:** `localStorage` exposes tokens to XSS script injection; stateful Redis/DB sessions enable instant token revocation on logout but add per-request storage I/O and shared session-store coupling when scaling horizontally. |

---

## 📁 Repository Structure

```text
banana.api/
├── .github/
│   └── pull_request_template.md   # CIS046-3 architectural PR verification checklist
├── client/                        # React 18 + Vite + Axios frontend
│   ├── eslint.config.js           # ESLint 9 flat configuration
│   └── src/
│       ├── api/                   # Axios client (withCredentials) & service wrappers
│       ├── context/               # AuthContext (session hydration & cookie logout)
│       └── App.jsx                # Gameplay arena, SyntheticEvents & timer state
├── server/                        # Express + Prisma + PostgreSQL BFF backend
│   ├── prisma/schema.prisma       # Relational models (users, user_metrics, game_rounds)
│   ├── test-suite.js              # End-to-end API, cookie, and anti-cheat verification
│   └── src/
│       ├── config/                # cors.js, db.js, prisma.js
│       ├── controllers/           # auth.controller.js, game.controller.js, user.controller.js, leaderboard.controller.js
│       ├── events/                # gameEventEmitter.js (round:completed, hint:unlocked)
│       ├── middleware/            # auth.middleware.js (Bearer + Cookie), validate.middleware.js, error handlers
│       ├── routes/                # /api/auth, /api/game, /api/users, /api/leaderboard
│       └── utils/                 # jwt.utils.js (auth & puzzleToken), logger.js, response.utils.js
├── GRADE_IMPROVEMENT_GUIDE_70_PLUS.md
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **PostgreSQL** running locally on port `5432` with database `banana_game`

### 2. Configure Environment
Copy `.env.example` to `.env` in `server/` and configure `DATABASE_URL` and `JWT_SECRET`:
```bash
cp server/.env.example server/.env
```

### 3. Run the Express Backend
```bash
cd server
npm install
npm run dev
```
The API server starts on `http://localhost:5000` (health check: `GET /api/health`).

### 4. Run the React Frontend
```bash
cd client
npm install
npm run dev
```
The client starts on `http://localhost:5173`.

### 5. Verification, Lint & Build
With the server running on `http://localhost:5000`:
```bash
# End-to-end backend, cookie auth, EventEmitter, and puzzleToken anti-cheat suite
node server/test-suite.js

# Frontend lint and production bundle verification
cd client && npm run lint && npm run build
```

---

## 📚 Academic & Software References

1. **Banana API Specification**: Marc Conrad (2023), *The Banana API*, University of Bedfordshire — https://marcconrad.com/uob/banana/doc.php
2. **Backend-for-Frontend (BFF) Pattern**: Martin Fowler / Sam Newman, *Pattern: Backends For Frontends* — https://martinfowler.com/articles/bff.html
3. **Node.js Event-Driven Architecture**: Node.js Foundation, *Events Documentation (`EventEmitter`)* — https://nodejs.org/api/events.html
4. **Password & Session Security**: OWASP Foundation, *Password Storage Cheat Sheet* & *Session Management Cheat Sheet* — https://cheatsheetseries.owasp.org/
5. **JSON Web Token Standard**: M. Jones, J. Bradley, & N. Sakimura (2015), *JSON Web Token (JWT)*, IETF RFC 7519 — https://datatracker.ietf.org/doc/html/rfc7519
6. **Core Stack Frameworks**:
   - React 18 (`SyntheticEvent` delegation) — https://react.dev/
   - Express.js 4.x — https://expressjs.com/
   - Prisma ORM — https://www.prisma.io/
7. **Generative AI Assistance Acknowledgement**: Portions of architectural refactoring, regex upstream sanitization, circuit breaker fallback logic, HTTP-Only cookie transport, and CIS046-3 source documentation headers were developed with iterative assistance from AI coding assistants (Claude Code and Gemini CLI), reviewed and verified by the author.
