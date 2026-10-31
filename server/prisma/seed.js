import bcrypt from 'bcryptjs';
import prisma from '../src/config/prisma.js';

async function main() {
  console.log('Seeding initial data...');
  const salt = await bcrypt.hash('Password123!', 10);

  const initialUsers = [
    { username: 'BananaKing', email: 'king@example.com', avatar: 'banana-king', score: 838, streak: 5 },
    { username: 'AlgorithmAce', email: 'ace@example.com', avatar: 'speedster', score: 707, streak: 5 },
    { username: 'CodeMaster', email: 'codemaster@example.com', avatar: 'detective', score: 686, streak: 5 },
  ];

  for (const u of initialUsers) {
    const existing = await prisma.users.findUnique({ where: { username: u.username } });
    if (!existing) {
      await prisma.users.create({
        data: {
          username: u.username,
          email: u.email,
          password_hash: salt,
          avatar: u.avatar,
          user_metrics: {
            create: {
              total_games: 10,
              total_wins: 8,
              total_score: u.score,
              highest_score: u.score,
              current_streak: u.streak,
              best_streak: u.streak,
            },
          },
        },
      });
      console.log(`Seeded user: ${u.username}`);
    }
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

