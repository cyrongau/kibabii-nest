import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Use the default constructor which relies on DATABASE_URL env var
const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Password@123', 10);

  console.log('Seeding database with URL:', process.env.DATABASE_URL);

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@kibabiinest.com' },
    update: {},
    create: {
      email: 'admin@kibabiinest.com',
      name: 'Kibabii Nest Admin',
      password,
      role: 'ADMIN',
    },
  });

  // Landlord
  await prisma.user.upsert({
    where: { email: 'alex@landlord.com' },
    update: {},
    create: {
      email: 'alex@landlord.com',
      name: 'Alex Thompson',
      password,
      role: 'LANDLORD',
    },
  });

  // Student
  await prisma.user.upsert({
    where: { email: 'sarah@student.com' },
    update: {},
    create: {
      email: 'sarah@student.com',
      name: 'Sarah Jenkins',
      password,
      role: 'STUDENT',
    },
  });

  // Landlord 2
  await prisma.user.upsert({
    where: { email: 'alexfgfgdf@landlord.com' },
    update: {},
    create: {
      email: 'alexfgfgdf@landlord.com',
      name: 'Alex Landlord 2',
      password,
      role: 'LANDLORD',
    },
  });

  // Student 2
  const student2Password = await bcrypt.hash('Cyro@#4001', 10);
  await prisma.user.upsert({
    where: { email: 'cyrongau@gmail.com' },
    update: {},
    create: {
      email: 'cyrongau@gmail.com',
      name: 'Cyro Student',
      password: student2Password,
      role: 'STUDENT',
    },
  });

  console.log('Seed data created successfully!');
  console.log('--- LOGIN CREDENTIALS ---');
  console.log('Admin: admin@kibabiinest.com / Password@123');
  console.log('Landlord: alex@landlord.com / Password@123');
  console.log('Student: sarah@student.com / Password@123');
  console.log('Landlord 2: alexfgfgdf@landlord.com / Password@123');
  console.log('Student 2: cyrongau@gmail.com / Cyro@#4001');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
