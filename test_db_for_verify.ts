import { prisma } from './src/backend/lib/prisma';
async function run() {
  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: 'password123',
      role: 'ADMIN',
      profile: {
        create: {
          id: 'test-admin-1',
          username: 'TestAdmin',
          credits: 1000
        }
      }
    }
  });
  console.log('Seeded test user');
}
run();
