const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProperties() {
  const properties = await prisma.property.findMany();
  console.log('Properties in DB:', JSON.stringify(properties, null, 2));
  await prisma.$disconnect();
}

checkProperties();
