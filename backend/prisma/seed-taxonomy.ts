import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const categories = ['Rental', 'Hostel', 'Airbnb', 'Commercial'];
  const types = ['BEDSITTER', 'SINGLE', 'SHARED', 'APARTMENT', 'STUDIO'];

  for (const name of categories) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log('Categories seeded.');

  for (const name of types) {
    await prisma.propertyType.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log('Property types seeded.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
