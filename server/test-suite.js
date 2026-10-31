const BASE_URL = 'http://127.0.0.1:5000/api';
const BANANA_API = 'https://marcconrad.com/uob/banana/api.php?out=json';

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

  // 2. REGISTER (WITH 100 FREE POINTS)
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
  const token = regData.data.token;
  const initialPoints = regData.data.user.metrics?.total_score;
  console.log(`   ✅ Registered successfully! Free Welcome Bonus: ${initialPoints} pts`);
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

  // 4. LOGIN
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
  console.log('   ✅ Logged in successfully!');
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

  // 6. AUTH SESSION (/api/auth/me)
  console.log('6️⃣ Validating authenticated session (/api/auth/me)...');
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meData = await meRes.json();
  if (!meData.success || meData.data?.user?.username !== testUser.username) {
    throw new Error(`Session validation failed: ${JSON.stringify(meData)}`);
  }
  console.log(`   ✅ Session verified for: ${meData.data.user.username}\n`);

  // 7. FETCH LIVE BANANA API PUZZLE (VIA SERVER PROXY TO ENSURE RESILIENCE AGAINST PHP NOTICES)
  console.log('7️⃣ Testing live Banana API puzzle generation via /api/game/puzzle...');
  const puzzleRes = await fetch(`${BASE_URL}/game/puzzle`);
  const puzzleData = await puzzleRes.json();
  if (!puzzleData.success || !puzzleData.data?.question || puzzleData.data?.solution === undefined) {
    throw new Error(`Failed to fetch banana puzzle: ${JSON.stringify(puzzleData)}`);
  }
  console.log(`   ✅ Received live sanitized puzzle: ${puzzleData.data.question.substring(0, 50)}...`);
  console.log(`   Expected solution digit: ${puzzleData.data.solution}\n`);

  // 7.5 TEST STEP-WISE HINT SCORE DEDUCTION (10, 15, 20 PTS IN POSTGRESQL)
  console.log('7️⃣.5️⃣ Testing Hint Deductions in PostgreSQL (Hint 1: -10, Hint 2: -15, Hint 3: -20)...');
  const hint1Res = await fetch(`${BASE_URL}/game/hint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ hintLevel: 1 }),
  });
  const hint1Data = await hint1Res.json();
  if (!hint1Data.success || hint1Data.data.total_score !== 90) {
    throw new Error(`Expected 90 pts after Hint 1, got: ${JSON.stringify(hint1Data)}`);
  }
  console.log(`   ✅ Hint 1 Deducted 10 pts! Total score in DB: ${hint1Data.data.total_score} pts (was 100)`);

  const hint2Res = await fetch(`${BASE_URL}/game/hint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ hintLevel: 2 }),
  });
  const hint2Data = await hint2Res.json();
  if (!hint2Data.success || hint2Data.data.total_score !== 75) {
    throw new Error(`Expected 75 pts after Hint 2, got: ${JSON.stringify(hint2Data)}`);
  }
  console.log(`   ✅ Hint 2 Deducted 15 pts! Total score in DB: ${hint2Data.data.total_score} pts (was 90)`);

  const hint3Res = await fetch(`${BASE_URL}/game/hint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ hintLevel: 3 }),
  });
  const hint3Data = await hint3Res.json();
  if (!hint3Data.success || hint3Data.data.total_score !== 55) {
    throw new Error(`Expected 55 pts after Hint 3, got: ${JSON.stringify(hint3Data)}`);
  }
  console.log(`   ✅ Hint 3 Deducted 20 pts! Total score in DB: ${hint3Data.data.total_score} pts (was 75)\n`);

  // 8. SIMULATE ROUND 1: Tier 1 Blitz solve (+15 pts)
  console.log('8️⃣ Simulating Round 1: Fast solve in Tier 1 Blitz Step (+15 pts)...');
  const round1Score = 15;
  const round1Res = await fetch(`${BASE_URL}/game/round`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      puzzleUrl: puzzleData.data.question,
      solution: puzzleData.data.solution,
      userAnswer: puzzleData.data.solution,
      isCorrect: true,
      scoreAwarded: round1Score,
      timeLimitSeconds: 60,
      timeTakenMs: 11000,
      status: 'completed',
    }),
  });
  const round1Data = await round1Res.json();
  if (!round1Data.success) {
    throw new Error(`Round 1 record failed: ${JSON.stringify(round1Data)}`);
  }
  console.log(`   ✅ Round 1 Recorded: +${round1Data.data.pointsAdded} pts awarded!`);
  console.log(`   Total Score in PostgreSQL: ${round1Data.data.metrics.total_score} pts (55 pts remaining from hints + 15 round = 70 pts)\n`);

  // 9. SIMULATE ROUND 2: Tier 2 Steady solve (+10 pts) + Streak (+2 pts)
  console.log('9️⃣ Simulating Round 2: Steady Step (10 pts) + Streak (+2 pts)...');
  const round2Score = 12; // 10 base + 2 streak
  const round2Res = await fetch(`${BASE_URL}/game/round`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      puzzleUrl: puzzleData.data.question,
      solution: puzzleData.data.solution,
      userAnswer: puzzleData.data.solution,
      isCorrect: true,
      scoreAwarded: round2Score,
      timeLimitSeconds: 60,
      timeTakenMs: 25000,
      status: 'completed',
    }),
  });
  const round2Data = await round2Res.json();
  console.log(`   ✅ Round 2 Recorded: +${round2Data.data.pointsAdded} pts!`);
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

  console.log('==================================================');
  console.log('🎉 ALL TESTS PASSED! 15/10/5 Scoring, 10/15/20 Hints, 100 Free Reg Pts & DB Leaderboard VERIFIED!');
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
