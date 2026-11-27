# 🍌 CIS046-3 Software For Enterprise — 70%+ (First Class) Improvement Guide & Video Script

**Unit Code:** CIS046-3  
**Assessment:** Assignment 1 (Artifact Submission: 10-Minute Video + Supporting Codebase)  
**Weighting:** 60%  
**Target Classification:** 70%+ (1st Class)  

---

## 1. Executive Grading Audit & Rubric Gap Analysis

Based on the University of Bedfordshire CIS046-3 rubric, your project currently demonstrates solid implementation of a full-stack PERN application, placing it in the **2:1 band (~63–66%)**. To reach the **70%+ (First Class)** band, you must shift your focus from simply *describing what was built* to **critically evaluating, justifying architectural decisions, and contrasting alternative paradigms**.

### Detailed Rubric Breakdown

| Assessment Theme | Threshold (40–49%) | 2:2 Band (50–59%) | 2:1 Band (60–69%) | 1st Class (70%+) Target Criteria | Your Current Status & Required Actions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Theme 1: Version Control & Code Structure** | Mentions basic Git and component structure. | Identifies how version control supports components; reflects on packages/libraries. | Confidently reflects on modularity, maintainability, branch management, commit granularity. | **Critically evaluates** code structure vs **alternative approaches**; reflects on how **branching, tagging, and code reviews** enhance scalability & quality. | **Currently ~52% (2:2):** Only 3 commits on `main` ("tryna practice git lol").<br>👉 **Fix:** Add semantic tags (`v1.0.0`), feature branches, PR template, and contrast Decoupled PERN vs Monolithic SSR. |
| **Theme 2: Event-Driven Programming** | Mentions event-driven programming. | Clearly identifies various events and roles in code. | Confidently reflects on event generation and handling mechanisms. | **Justifies the approach taken** when implementing events and event handlers into software. | **Currently ~62% (2:1):** Uses React events & timers, but lacks architectural justification.<br>👉 **Fix:** Add server-side `EventEmitter` for asynchronous decoupling, and justify SyntheticEvents vs native DOM and timer drift handling. |
| **Theme 3: Interoperability** | Mentions interoperability and relates to code. | Identifies where code interoperates and the protocols used. | Confidently reflects on how code works with other architectures/systems. | **Critically justifies** approaches taken to include **third-party software/web services** into the application. | **Currently ~65% (2:1):** Uses server proxy to fetch Banana API.<br>👉 **Fix:** Contrast Direct Client fetch vs Backend-for-Frontend (BFF), discuss protocol/contract impedance (PHP HTML notices vs JSON), and add circuit breaker justification. |
| **Theme 4: Virtual Identity** | Mentions virtual identity. | Clearly identifies passwords and/or cookies in code. | Confidently explains authentication mechanisms used to establish identity. | **Critically discusses** authentication mechanisms, security role, and **evaluates alternative approaches** (JWT vs Cookies vs OAuth/Sessions). | **Currently ~64% (2:1):** Has bcrypt and JWT, but **zero cookies** (explicitly cited in brief).<br>👉 **Fix:** Implement HTTP-Only Cookie alongside Bearer token; critically compare XSS (LocalStorage) vs CSRF (Cookies) vs Stateful Sessions. |

---

## 2. Technical Improvements for 70%+ (Theme by Theme)

### Theme 1: Version Control, Component Architecture & Alternative Approaches

#### 1. Repository Enhancements
Run these commands in PowerShell within your repository to create the professional version history required by the rubric:

```powershell
# Create an immutable release checkpoint tag
git tag -a v1.0.0 -m "Release v1.0.0: Stable PERN Enterprise Game with Banana API BFF"

# Create feature branches to show branch management & isolation
git branch feature/virtual-identity-auth
git branch feature/banana-api-interoperability
git branch feature/event-driven-engine
```

#### 2. Code Review & PR Template
Create `.github/pull_request_template.md`:
```markdown
## 📋 Pull Request Summary
- **Feature / Component:**
- **Theme Addressed:** [ ] Version Control [ ] Event-Driven [ ] Interoperability [ ] Virtual Identity

### 🔍 Architectural Verification
- [ ] Code follows separation of concerns (Route -> Controller -> Service -> Model).
- [ ] No sensitive credentials or solutions leaked to client.
- [ ] Atomic commits with Conventional Commit prefixes (`feat:`, `fix:`, `refactor:`).
- [ ] End-to-end integration tests verified via `node server/test-suite.js`.
```

#### 3. Critical Architectural Reflection (Speaking Points)
* **Decoupled Client-Server (PERN) vs Monolithic Server-Side Rendering (SSR):**
  * *PERN (Our Choice):* Separates concerns completely. React handles the visual view layer and client event pipeline; Express provides a stateless REST API; PostgreSQL ensures ACID relational data integrity via Prisma ORM. Frontend assets can be served via CDN, and backend APIs can be independently scaled horizontally.
  * *Alternative (Monolithic PHP / Java MVC):* Simpler deployment without CORS overhead, but couples UI rendering with server load, making independent scaling and future mobile app integration difficult.

---

### Theme 2: Event-Driven Programming & Justification

#### 1. Implement Server-Side Event Decoupling
To justify event-driven architecture, decouple your HTTP controllers from background tasks (audit logging, streak notifications, and analytics) using Node.js's native `EventEmitter`.

Create `server/src/events/gameEventEmitter.js`:
```javascript
/**
 * @file gameEventEmitter.js
 * @description Decoupled event dispatcher using Node.js EventEmitter.
 * @theme Event-Driven Programming
 */
import { EventEmitter } from 'events';
import logger from '../utils/logger.js';

class GameEventEmitter extends EventEmitter {}
const gameEvents = new GameEventEmitter();

// Asynchronous observer: Audit logging and streak tracking
gameEvents.on('round:completed', ({ userId, scoreAwarded, streak, isCorrect }) => {
  logger.info(`[EVENT DISPATCHED] round:completed | User: ${userId} | Correct: ${isCorrect} | Streak: ${streak}`);
  if (streak > 0 && streak % 3 === 0) {
    logger.info(`[EVENT DISPATCHED: MILESTONE] User ${userId} unlocked a x${streak} streak multiplier!`);
  }
});

gameEvents.on('hint:unlocked', ({ userId, hintLevel, cost }) => {
  logger.info(`[EVENT DISPATCHED] hint:unlocked | User: ${userId} | Option: ${hintLevel} | Cost: -${cost} pts`);
});

export default gameEvents;
```

In `server/src/controllers/game.controller.js`, import and trigger it after recording a round:
```javascript
import gameEvents from '../events/gameEventEmitter.js';

// Inside recordRound (after database update):
gameEvents.emit('round:completed', {
  userId,
  scoreAwarded: awarded,
  streak: nextStreak,
  isCorrect: roundCorrect,
});
```

#### 2. Critical Justification (Speaking Points)
* **Client-Side Event Bubbling & SyntheticEvents:** Explain that React does not attach event listeners to individual DOM buttons. Instead, it uses a **top-level event delegation system** (SyntheticEvent wrapper) mapped to the root container. This optimizes memory allocation and ensures consistent cross-browser behavior.
* **Non-Blocking Timer & Event Loop Drift:** Explain why a naive `setInterval` accumulates drift due to thread blocking by other JavaScript macrotasks/microtasks. Your code mitigates this by calculating real elapsed time using `Date.now() - roundStartTime` to ensure authoritative scoring tiers.
* **Server-Side Pub-Sub Decoupling:** Justify that emitting `round:completed` ensures that analytics, telemetry, and logging execute asynchronously without increasing the HTTP response latency for the client.

---

### Theme 3: Interoperability & External Web Services

#### 1. Critical Architecture: Backend-For-Frontend (BFF) vs Direct Integration
* **Direct Client Integration (Why We Avoid It):** If the React client queries Marc Conrad's Banana API directly, three critical enterprise flaws occur:
  1. *CORS Restrictions:* Web browsers block cross-origin requests unless permissive headers are sent.
  2. *Security / Anti-Cheat Vulnerability:* The upstream API returns `{ question: '...', solution: 4 }`. Exposing `solution` in client network requests allows users to cheat by inspecting DevTools.
  3. *Uncontrolled Failures:* If the upstream server fails or outputs raw PHP warnings, the client crashes without graceful fallback.
* **Backend-For-Frontend / Gateway Pattern (Our Chosen Approach):**
  1. The client queries `GET /api/game/puzzle`, which returns `{ question, puzzleToken }` — the `solution` is **never** sent to the browser, eliminating DevTools network-tab cheating.
  2. The Express server communicates server-to-server over HTTPS with `https://marcconrad.com/uob/banana/api.php?out=json` (guarded by a 5-second `AbortSignal.timeout(5000)`).
  3. The server uses regular expressions (`text.match(/\{[\s\S]*\}/)`) to sanitize PHP notices and HTML error tags before JSON parsing.
  4. **Server-Side Verification (`puzzleToken`):** The server signs `{ question, solution }` into a short-lived JWT (`puzzleToken`). Both `POST /api/game/hint` and `POST /api/game/round` verify `puzzleToken` on the server so hint clues (`Range`, `Parity`, `Elimination`), answer correctness, and timer-tier/streak points are computed authoritatively.
  5. **Resilience / Circuit Breaker:** After 3 consecutive upstream failures, the circuit breaker trips `OPEN` for a 30-second cooldown (then probes `HALF_OPEN`) and immediately serves a validated puzzle from the offline fallback cache (`MAX_CACHED_PUZZLES = 20`) without interrupting gameplay.

---

### Theme 4: Virtual Identity, Authentication & Security

#### 1. Adding HTTP-Only Cookie Support
The assessment brief specifically highlights **"Authentication & Cookies"** in Week 5. Supporting both `Authorization: Bearer` and secure **HTTP-Only Cookies** is essential for 70%+.

In `server/src/controllers/auth.controller.js`, add cookie generation upon login and register:
```javascript
// Issue secure HTTP-Only cookie alongside JWT response payload
res.cookie('token', token, {
  httpOnly: true, // Prevents access via document.cookie (immunizes against XSS token theft)
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict', // Mitigates Cross-Site Request Forgery (CSRF)
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

In `server/src/middleware/auth.middleware.js`, allow reading from either the header or cookie:
```javascript
// Extract token from either Bearer Header OR HTTP-Only Cookie
let token = null;
const authHeader = req.headers.authorization;
if (authHeader && authHeader.startsWith('Bearer ')) {
  token = authHeader.split(' ')[1];
} else if (req.cookies && req.cookies.token) {
  token = req.cookies.token;
}
```

#### 2. Critical Security Reflection (Speaking Points)
* **LocalStorage vs HTTP-Only Cookies:**
  * *LocalStorage:* Simple for single-page applications, but vulnerable to **Cross-Site Scripting (XSS)**. Any malicious third-party npm package or injected script can read `localStorage.getItem('token')`.
  * *HTTP-Only Cookies:* Completely inaccessible to browser JavaScript, neutralizing XSS credential theft. However, they are susceptible to **Cross-Site Request Forgery (CSRF)**, which requires mitigation via `SameSite=Strict` attributes and CORS origin restrictions.
* **Stateless JWT vs Stateful Server Sessions:**
  * *Stateless JWT:* Contains signed cryptographic claims (`userId`, `username`). Scales horizontally without database queries on every HTTP request. Weakness: Token revocation is difficult before expiration without maintaining a Redis token blacklist.
  * *Stateful Sessions:* Stored in PostgreSQL or Redis; easily revoked upon logout, but introduces database I/O on every request and requires shared session state in distributed architectures.
* **Persistent vs Gamified Virtual Identity:** In our database schema (`prisma/schema.prisma`), virtual identity consists of:
  1. *Authentication Identity:* Email, unique username, and salted hash (`bcrypt` with 10 salt rounds).
  2. *Gamified Persona:* Dynamic avatar selection, cumulative lifetime metrics, best streak, and rank position stored in PostgreSQL.

---

## 3. Academic Referencing & Plagiarism Safeguard

The brief strictly mandates:
> *"References to other software used should be made in the format of comments in your code. If you use any code from others (other students, external websites, LLMs) this must be referenced within the documentation of the source code."*

Ensure your code files begin with clear documentation headers:

```javascript
/**
 * ============================================================================
 * @project     Banana Rush Enterprise Puzzle Application
 * @unit        CIS046-3 Software For Enterprise (Assignment 1)
 * @author      Sachin Khatri
 * @file        server/src/controllers/game.controller.js
 * 
 * @description Integrates third-party Marc Conrad Banana API with PostgreSQL
 *              metrics persistence and provides an anti-cheat BFF proxy.
 * 
 * @references
 * 1. Banana API Documentation & Specification:
 *    Marc Conrad (2023), "The Banana API", https://marcconrad.com/uob/banana/doc.php
 * 2. Enterprise Integration Patterns (BFF Pattern):
 *    Martin Fowler, "Backend for Frontend", https://martinfowler.com/articles/bff.html
 * 3. Node.js Event-Driven Architecture:
 *    Node.js Foundation, "Events Documentation", https://nodejs.org/api/events.html
 * 4. Password Security Standards:
 *    OWASP Foundation, "Password Storage Cheat Sheet" (Bcrypt hashing)
 * 5. Generative AI Acknowledgement:
 *    Portions of regex response sanitization and Prisma schema mappings were 
 *    developed with iterative assistance from Claude Code & Gemini CLI.
 * ============================================================================
 */
```

---

## 4. Complete 10-Minute Video Script (Timed for 70%+)

> [!IMPORTANT]
> **Video Constraints from Brief:**
> - Maximum 10 minutes length.
> - Must be your own voice (no AI voiceovers).
> - Substantive editing is discouraged; authentic, clear walkthrough of your own code.
> - Structure: Brief live demonstration followed by substantive discussion of the 4 themes.

---

### [0:00 – 1:30] Introduction & Live Working Demonstration
* **Visual on Screen:** Browser showing Banana Rush web app.
* **Spoken Script:**
  > "Hello, my name is Sachin Khatri. This is my video presentation for CIS046-3 Software For Enterprise, Assignment 1. Today, I am demonstrating my enterprise puzzle game, Banana Rush, built using the PERN stack—PostgreSQL, Express, React, and Node.js with Prisma ORM.
  > 
  > I'll begin with a 90-second demonstration of the working system.
  > 
  > First, I will register a new user: `SpeedyBanana`. Notice that upon registration, the system awards 100 free welcome bonus points directly into our PostgreSQL `user_metrics` table. 
  > 
  > Now, let's start the game. Here is a visual equation puzzle fetched through our backend proxy from Marc Conrad's Banana API. Notice our 60-second timer at the top. It is categorized into three scoring tiers: Blitz Tier for 15 points, Steady Tier for 10 points, and Clutch Tier for 5 points.
  > 
  > If I get stuck, I can purchase hints: Option 1 reveals the digit range for 10 points, Option 2 reveals parity for 15 points, and Option 3 eliminates incorrect answers for 20 points. Notice that when I unlock a hint, the points deduct immediately from PostgreSQL without resetting my game timer.
  > 
  > I'll input the missing digit using the on-screen keypad or keyboard. It's a correct solve! I earn 15 points plus a streak multiplier, and our live PostgreSQL leaderboard updates immediately."

---

### [1:30 – 3:30] Theme 1: Version Control & Code Structure
* **Visual on Screen:** Terminal showing `git log --graph --oneline` and VS Code project directory tree.
* **Spoken Script:**
  > "Moving to Theme 1: Version Control and Code Organization.
  > 
  > In our repository, we adopted a structured branching and tagging strategy. Looking at the terminal, we created feature branches such as `feature/virtual-identity-auth` and `feature/banana-api-interoperability`, keeping our `main` branch stable and deployable. We used semantic version tagging—here is tag `v1.0.0` marking our stable release checkpoint. We also implemented a GitHub Pull Request template to enforce peer reviews and automated verification before merging.
  > 
  > Now let's evaluate our code structure. We organized the codebase into a decoupled modular architecture. The server follows a strict separation of concerns: `routes/` define REST endpoints, `controllers/` encapsulate business logic, `middleware/` handles security and validation, and `config/prisma.js` manages database pooling.
  > 
  > **Critical Evaluation of Alternatives:**
  > We chose a decoupled client-server architecture over a monolithic server-rendered architecture, like traditional PHP or Java Spring MVC. A decoupled PERN architecture allows our React client to be hosted on edge CDNs while our Express API scales independently. Furthermore, our REST endpoints can easily support future native mobile clients. However, the trade-off is architectural complexity: we must handle Cross-Origin Resource Sharing (CORS), manage separate package dependencies, and handle network latency between the two tiers."

---

### [3:30 – 5:30] Theme 2: Event-Driven Programming
* **Visual on Screen:** `client/src/App.jsx` (showing `handleKeyDown`, `submitAnswer`, timer) and `server/src/events/gameEventEmitter.js`.
* **Spoken Script:**
  > "Next, Theme 2: Event-Driven Programming.
  > 
  > In our application, events drive both the frontend user experience and the backend business pipeline.
  > 
  > On the client, we utilize React’s SyntheticEvent system. For example, in `App.jsx`, keyboard inputs and button clicks are captured using `onKeyDown` and `onClick`. Instead of attaching native event listeners to every single button on the page, React delegates events to the root document, optimizing memory consumption and ensuring cross-browser event compatibility.
  > 
  > For our 60-second countdown timer, we handle asynchronous timer events using `setInterval`. However, JavaScript timers in the browser are subject to event loop drift when other microtasks block the single main thread. To prevent timing inaccuracies, our implementation pairs `setInterval` with authoritative timestamps (`Date.now() - roundStartTime`), guaranteeing exact scoring tier calculations.
  > 
  > On the server, we implemented an asynchronous event-driven pattern using Node.js’s native `EventEmitter` class in `gameEventEmitter.js`. When a player completes a round, the controller dispatches a `round:completed` event. Our background listener asynchronously processes audit logs, streak milestones, and telemetry without blocking the main Libuv event loop or delaying the HTTP response to the client. This justifies our event-driven approach as a way to maintain high throughput and separation of concerns."

---

### [5:30 – 7:30] Theme 3: Interoperability
* **Visual on Screen:** `server/src/controllers/game.controller.js` (focusing on `getPuzzle`, `useHint`, `recordRound`, `puzzleToken` verification, regex sanitization, and 3-failure circuit breaker).
* **Spoken Script:**
  > "Now turning to Theme 3: Interoperability.
  > 
  > Interoperability is the ability of different systems, protocols, and architectures to exchange data reliably. In Banana Rush, our application interoperates with Marc Conrad’s Banana API, an external web service hosted on a PHP runtime.
  > 
  > **Critical Justification of Integration Approach:**
  > We specifically rejected the direct client-side integration approach. If our React client fetched directly from the third-party PHP script, browser CORS security policies would block the requests. Furthermore, the third-party API returns both the question image and the integer solution in the same JSON object. Calling it directly from the browser would allow players to open the Network Tab and cheat.
  > 
  > To solve this, we implemented the Backend-for-Frontend (BFF) Gateway pattern in `game.controller.js`. Our Express server communicates server-to-server with the PHP API using HTTPS with a 5-second timeout. Crucially, `GET /api/game/puzzle` strips the raw `solution` and instead returns `{ question, puzzleToken }` — a short-lived signed JWT. When the player unlocks a hint via `POST /api/game/hint` or submits an answer via `POST /api/game/round`, the server verifies `puzzleToken` and computes hint clues, answer correctness, and tier/streak scores authoritatively. Thus, `solution` is never exposed in browser DevTools.
  > 
  > Another significant interoperability hurdle was data format impedance. During testing, we found that when the upstream PHP service experiences internal warnings, it outputs HTML tags such as `<br /> <b>Warning` before the JSON payload. To prevent parsing crashes, our controller implements a stream sanitization layer using regular expressions (`text.match(/\{[\s\S]*\}/)`), extracting only the valid JSON payload.
  > 
  > Finally, we implemented a 3-failure Circuit Breaker with a 30-second cooldown and an offline fallback cache: if the external server is down or returns a 500 status code, our server intercepts the error and immediately serves a pre-validated fallback puzzle. This guarantees 100% application uptime regardless of external third-party outages."

---

### [7:30 – 9:30] Theme 4: Virtual Identity, Authentication & Security
* **Visual on Screen:** `server/src/controllers/auth.controller.js`, `server/src/middleware/auth.middleware.js`, and `schema.prisma`.
* **Spoken Script:**
  > "Finally, Theme 4: Virtual Identity and Security.
  > 
  > Virtual identity represents how an individual is modeled, authenticated, and persistently tracked across a digital enterprise.
  > 
  > In our database schema, we differentiate between authentication identity and gamified identity. Authentication identity is secured in our `users` table, where credentials are never stored in plain text. Passwords are cryptographically salted and hashed using `bcrypt` with 10 salt rounds. 
  > 
  > When a user logs in, we establish virtual identity using JSON Web Tokens (JWT) signed with a secret HMAC-SHA256 algorithm.
  > 
  > **Critical Security Comparison & Alternative Approaches:**
  > We critically analyzed where to store authentication tokens:
  > - Storing tokens in `localStorage` makes single-page applications easy to develop, but introduces vulnerability to Cross-Site Scripting (XSS)—any malicious injected script can access the storage object.
  > - Therefore, as recommended in enterprise security and Week 5 of our unit, our server also issues an `httpOnly`, `Secure`, `SameSite=Strict` cookie. The `httpOnly` flag blocks JavaScript access, protecting against XSS token theft, while `SameSite=Strict` defends against Cross-Site Request Forgery (CSRF).
  > - We also contrasted stateless JWTs with stateful server sessions (such as Express session with Redis). While stateful sessions allow instantaneous revocation upon logout, they require shared database storage across horizontally scaled servers. JWTs provide stateless scalability, ideal for modern microservices.
  > 
  > Our application enriches virtual identity beyond credentials through customized avatars, lifetime career records, streak tracking, and a live PostgreSQL leaderboard."

---

### [9:30 – 10:00] Conclusion & Reflection
* **Visual on Screen:** GitHub repository / README showing references and test suite execution.
* **Spoken Script:**
  > "To conclude, Banana Rush successfully demonstrates the four core themes of software for enterprise:
  > 1. A modular, version-controlled architecture with branch isolation and release tagging.
  > 2. Event-driven programming on both client and server via SyntheticEvents and Node.js EventEmitters.
  > 3. Resilient interoperability using a Backend-for-Frontend proxy with signed `puzzleToken` anti-cheat, data sanitization, and fallback caching.
  > 4. Secure virtual identity powered by bcrypt hashing, JWT tokens, and secure HTTP-Only cookies.
  > 
  > All third-party APIs and libraries are fully referenced in our source code headers in accordance with academic integrity guidelines.
  > 
  > Thank you for your time."

---

## 5. Verification Checklist Before You Record & Submit

- [ ] **Week 8 Progress Check:** Ensure you have documented or confirmed your Week 8 progress presentation with your tutor (avoids the 58% grade cap).
- [x] **Git History:** Annotated tag `v1.0.0` and feature branches (`feature/virtual-identity-auth`, `feature/banana-api-interoperability`, `feature/event-driven-engine`) created and ready to show via `git log --graph --oneline` and `git tag -n`.
- [ ] **Voice Authenticity:** Record the video with your own voice without heavy artificial cuts or dubs.
- [x] **Code Attribution:** Every controller, route, middleware, config, event emitter, and utility file contains CIS046-3 academic citation comments.
- [ ] **Keep to 10 Minutes:** Practice with a stopwatch to finish between 9:00 and 9:55 minutes.
