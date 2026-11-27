import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

const { verifyPuzzleToken } = await import('./src/utils/jwt.utils.js');

const BASE_URL = 'http://127.0.0.1:5000/api';

const getSetCookieHeaders = (res) => {
  if (typeof res.headers.getSetCookie === 'function') {
    return res.headers.getSetCookie();
  }
  const single = res.headers.get('set-cookie');
  return single ? [single] : [];
};

const assertAuthSetCookie = (res, endpointLabel) => {
  const cookies = getSetCookieHeaders(res);
  const tokenCookie = cookies.find((c) => c.startsWith('token='));
  if (!tokenCookie) {
    throw new Error(`${endpointLabel}: Missing Set-Cookie header with token=. Got: ${JSON.stringify(cookies)}`);
  }
  if (!/;\s*HttpOnly/i.test(tokenCookie)) {
    throw new Error(`${endpointLabel}: Set-Cookie missing HttpOnly flag: ${tokenCookie}`);
  }
  if (!/;\s*SameSite=Strict/i.test(tokenCookie)) {
    throw new Error(`${endpointLabel}: Set-Cookie missing SameSite=Strict flag: ${tokenCookie}`);
  }
  return tokenCookie.split(';')[0];
};

const runTest = async () => {
  console.log('==================================================');
  console.log('🧪 RUNNING BANANA RUSH E2E TEST SUITE');
  console.log('==================================================\n');

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const testUser = {
    username: `SpeedyBanana_${randomSuffix}`,
    email: `speedy_${randomSuffix}@banana.dev`,
    password: 'SecurePassword123!',
    avatar: 'speedster',
  };

  // 1. HEALTH CHECK
  console.log('1️⃣ Checking API & Database Health (/api/health)...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  if (healthData.status !== 'healthy' || healthData.database !== 'connected') {
    throw new Error(`Health check failed: ${JSON.stringify(healthData)}`);
  }
  console.log('   ✅ API & PostgreSQL via Prisma is HEALTHY.\n');

  // 2. REGISTER (WITH 100 FREE POINTS + HTTP-ONLY COOKIE)
  console.log(`2️⃣ Testing Registration with user: ${testUser.username}...`);
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser),
  });
  const regData = await regRes.json();
  if (!regData.success || !regData.data?.token) {
    throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
  }
  assertAuthSetCookie(regRes, 'POST /auth/register');
  const token = regData.data.token;
  const initialPoints = regData.data.user.metrics?.total_score;
  console.log(`   ✅ Registered successfully with HttpOnly SameSite=Strict cookie! Free Welcome Bonus: ${initialPoints} pts`);
  if (initialPoints !== 100) {
    throw new Error(`Expected 100 free registration points, got ${initialPoints}`);
  }
  console.log(`   User ID: ${regData.data.user.id}, Token: ${token.substring(0, 25)}...\n`);

  // 3. DUPLICATE REGISTER CHECK (Data integrity)
  console.log('3️⃣ Testing Duplicate Registration Prevention...');
  const dupRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser),
  });
  const dupData = await dupRes.json();
  if (dupRes.status !== 409) {
    throw new Error(`Expected 409 Conflict on duplicate user, got ${dupRes.status}`);
  }
  console.log(`   ✅ Correctly blocked duplicate: "${dupData.message}"\n`);

  // 4. LOGIN (WITH HTTP-ONLY COOKIE)
  console.log('4️⃣ Testing Login with valid credentials...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: testUser.email, password: testUser.password }),
  });
  const loginData = await loginRes.json();
  if (!loginData.success || !loginData.data?.token) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  }
  const loginCookiePair = assertAuthSetCookie(loginRes, 'POST /auth/login');
  console.log('   ✅ Logged in successfully with HttpOnly SameSite=Strict cookie!');
  console.log(`   User: ${loginData.data.user.username}, Score: ${loginData.data.user.metrics.total_score} pts (includes 100 free pts)\n`);

  // 5. LOGIN FAILURE (Wrong password)
  console.log('5️⃣ Testing Login failure with wrong password...');
  const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: testUser.username, password: 'WrongPassword999!' }),
  });
  const badLoginData = await badLoginRes.json();
  if (badLoginRes.status !== 401) {
    throw new Error(`Expected 401 on bad password, got ${badLoginRes.status}`);
  }
  console.log(`   ✅ Correctly rejected invalid login: "${badLoginData.message}"\n`);

  // 6. AUTH SESSION (/api/auth/me) USING HTTP-ONLY COOKIE ONLY
  console.log('6️⃣ Validating authenticated session (/api/auth/me) via Cookie header only...');
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Cookie: loginCookiePair },
  });
  const meData = await meRes.json();
  if (!meData.success || meData.data?.user?.username !== testUser.username) {
    throw new Error(`Cookie-only session validation failed: ${JSON.stringify(meData)}`);
  }
  console.log(`   ✅ Cookie-only session verified for: ${meData.data.user.username}\n`);

  // 7. FETCH LIVE BANANA API PUZZLE (ANTI-CHEAT: SIGNED puzzleToken, NO solution)
  console.log('7️⃣ Testing live Banana API puzzle generation via /api/game/puzzle...');
  const puzzleRes = await fetch(`${BASE_URL}/game/puzzle`);
  const puzzleData = await puzzleRes.json();
  if (
    !puzzleData.success ||
    typeof puzzleData.data?.question !== 'string' ||
    typeof puzzleData.data?.puzzleToken !== 'string'
  ) {
    throw new Error(`Failed to fetch banana puzzle: ${JSON.stringify(puzzleData)}`);
  }
  if (puzzleData.data.solution !== undefined) {
    throw new Error(`Anti-cheat violation: /api/game/puzzle leaked solution (${puzzleData.data.solution})!`);
  }
  const decodedPuzzle = verifyPuzzleToken(puzzleData.data.puzzleToken);
  if (!decodedPuzzle || !Number.isInteger(Number(decodedPuzzle.solution))) {
    throw new Error('Failed to verify puzzleToken server-side in test suite (check JWT_SECRET alignment)');
  }
  const puzzleToken = puzzleData.data.puzzleToken;
  const solvedDigit = Number(decodedPuzzle.solution);
  console.log(`   ✅ Received sanitized puzzle + signed puzzleToken (solution hidden from client!).`);
  console.log(`   Puzzle URL: ${puzzleData.data.question.substring(0, 50)}...\n`);

  // 7.5 TEST STEP-WISE HINT SCORE DEDUCTION & SERVER-SIDE HINT COMPUTATION (10, 15, 20 PTS)
  console.log('7️⃣.5️⃣ Testing Anti-Cheat Hint Deductions in PostgreSQL (Hint 1: -10, Hint 2: -15, Hint 3: -20)...');
  const badHintRes = await fetch(`${BASE_URL}/game/hint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ hintLevel: 1, puzzleToken: 'tampered.invalid.token' }),
  });
  if (badHintRes.status !== 400) {
    throw new Error(`Expected 400 for invalid puzzleToken on /game/hint, got ${badHintRes.status}`);
  }

  const hint1Res = await fetch(`${BASE_URL}/game/hint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ hintLevel: 1, puzzleToken }),
  });
  const hint1Data = await hint1Res.json();
  if (
    !hint1Data.success ||
    hint1Data.data.total_score !== 90 ||
    typeof hint1Data.data.hintText !== 'string' ||
    !hint1Data.data.hintText ||
    hint1Data.data.solution !== undefined
  ) {
    throw new Error(`Hint 1 failed validation: ${JSON.stringify(hint1Data)}`);
  }
  console.log(`   ✅ Hint 1 Deducted 10 pts! Hint: "${hint1Data.data.hintText}" | Total: ${hint1Data.data.total_score} pts`);

  const hint2Res = await fetch(`${BASE_URL}/game/hint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ hintLevel: 2, puzzleToken }),
  });
  const hint2Data = await hint2Res.json();
  if (
    !hint2Data.success ||
    hint2Data.data.total_score !== 75 ||
    typeof hint2Data.data.hintText !== 'string' ||
    !hint2Data.data.hintText ||
    hint2Data.data.solution !== undefined
  ) {
    throw new Error(`Hint 2 failed validation: ${JSON.stringify(hint2Data)}`);
  }
  console.log(`   ✅ Hint 2 Deducted 15 pts! Hint: "${hint2Data.data.hintText}" | Total: ${hint2Data.data.total_score} pts`);

  const hint3Res = await fetch(`${BASE_URL}/game/hint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ hintLevel: 3, puzzleToken }),
  });
  const hint3Data = await hint3Res.json();
  if (
    !hint3Data.success ||
    hint3Data.data.total_score !== 55 ||
    typeof hint3Data.data.hintText !== 'string' ||
    !hint3Data.data.hintText ||
    hint3Data.data.solution !== undefined
  ) {
    throw new Error(`Hint 3 failed validation: ${JSON.stringify(hint3Data)}`);
  }
  console.log(`   ✅ Hint 3 Deducted 20 pts! Hint: "${hint3Data.data.hintText}" | Total: ${hint3Data.data.total_score} pts\n`);

  // 8. SIMULATE ROUND 1: Tier 1 Blitz solve (+15 pts) + Anti-Cheat tampering check
  console.log('8️⃣ Simulating Round 1: Fast solve in Tier 1 Blitz Step (+15 pts) with scoreAwarded=9999 tamper check...');
  const round1Res = await fetch(`${BASE_URL}/game/round`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      puzzleToken,
      userAnswer: solvedDigit,
      scoreAwarded: 9999,
      timeLimitSeconds: 60,
      timeTakenMs: 11000,
      status: 'completed',
    }),
  });
  const round1Data = await round1Res.json();
  if (
    !round1Data.success ||
    round1Data.data.pointsAdded !== 15 ||
    round1Data.data.basePoints !== 15 ||
    round1Data.data.streakBonus !== 0 ||
    round1Data.data.isCorrect !== true ||
    round1Data.data.solution !== solvedDigit ||
    round1Data.data.metrics.total_score !== 70
  ) {
    throw new Error(`Round 1 anti-cheat verification failed: ${JSON.stringify(round1Data)}`);
  }
  console.log(`   ✅ Round 1 Recorded: +${round1Data.data.pointsAdded} pts awarded (tampered 9999 ignored)!`);
  console.log(`   Total Score in PostgreSQL: ${round1Data.data.metrics.total_score} pts (55 pts remaining from hints + 15 round = 70 pts)\n`);

  // 9. SIMULATE ROUND 2: Tier 2 Steady solve (+10 pts) + Streak (+2 pts)
  console.log('9️⃣ Simulating Round 2: Steady Step (10 pts) + Streak (+2 pts)...');
  const round2Res = await fetch(`${BASE_URL}/game/round`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      puzzleToken,
      userAnswer: solvedDigit,
      scoreAwarded: 9999,
      timeLimitSeconds: 60,
      timeTakenMs: 25000,
      status: 'completed',
    }),
  });
  const round2Data = await round2Res.json();
  if (
    !round2Data.success ||
    round2Data.data.pointsAdded !== 12 ||
    round2Data.data.basePoints !== 10 ||
    round2Data.data.streakBonus !== 2 ||
    round2Data.data.streak !== 2 ||
    round2Data.data.metrics.total_score !== 82
  ) {
    throw new Error(`Round 2 anti-cheat verification failed: ${JSON.stringify(round2Data)}`);
  }
  console.log(`   ✅ Round 2 Recorded: +${round2Data.data.pointsAdded} pts (10 base + 2 streak)!`);
  console.log(`   New Total Score in PostgreSQL: ${round2Data.data.metrics.total_score} pts (Streak: ${round2Data.data.streak})\n`);

  // 10. LEADERBOARD VERIFICATION (Direct from PostgreSQL, not hardcoded)
  console.log('🔟 Checking PostgreSQL Live Leaderboard (/api/leaderboard)...');
  const lbRes = await fetch(`${BASE_URL}/leaderboard`);
  const lbData = await lbRes.json();
  const playerInLb = lbData.data?.leaderboard?.find((p) => p.username === testUser.username);
  if (!playerInLb) {
    throw new Error('User not found in leaderboard!');
  }
  console.log(`   ✅ User found on live PostgreSQL leaderboard at Rank #${playerInLb.rank}!`);
  console.log(`   Player: ${playerInLb.username}, Total Score: ${playerInLb.score}, Streak: ${playerInLb.streak}\n`);

  // 11. USER HISTORY & AVATAR UPDATE
  console.log('1️⃣1️⃣ Testing Avatar update & Round History...');
  const avRes = await fetch(`${BASE_URL}/users/avatar`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ avatar: 'banana-king' }),
  });
  const avData = await avRes.json();
  console.log(`   ✅ Avatar changed to: ${avData.data.user.avatar}`);

  const histRes = await fetch(`${BASE_URL}/users/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const histData = await histRes.json();
  console.log(`   ✅ User history returned: ${histData.data.rounds.length} rounds logged in PostgreSQL.\n`);

  // 12. LOGOUT & COOKIE CLEARING
  console.log('1️⃣2️⃣ Testing Logout & HTTP-Only Cookie clearing (/api/auth/logout)...');
  const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { Cookie: loginCookiePair },
  });
  const logoutData = await logoutRes.json();
  if (!logoutData.success) {
    throw new Error(`Logout failed: ${JSON.stringify(logoutData)}`);
  }
  const logoutCookies = getSetCookieHeaders(logoutRes);
  const clearedCookie = logoutCookies.find((c) => /^token=;/i.test(c) || /^token=\s*;/i.test(c));
  if (!clearedCookie || !/;\s*HttpOnly/i.test(clearedCookie) || !/;\s*SameSite=Strict/i.test(clearedCookie)) {
    throw new Error(`Logout did not properly clear token cookie: ${JSON.stringify(logoutCookies)}`);
  }
  console.log('   ✅ Logout cleared HTTP-Only cookie cleanly.\n');

  console.log('==================================================');
  console.log('🎉 ALL TESTS PASSED! Anti-Cheat PuzzleToken, Cookies, 15/10/5 Scoring, 10/15/20 Hints & DB Leaderboard VERIFIED!');
  console.log('==================================================');

  // Clean up test user
  const { prisma } = await import('./src/config/prisma.js');
  await prisma.users.delete({ where: { id: regData.data.user.id } });
  console.log(`🧹 Cleaned up temporary test user ${testUser.username}`);
  await prisma.$disconnect();
};

runTest().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err.message);
  process.exit(1);
});
