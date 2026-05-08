const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const property = await prisma.property.update({
    where: { id: 'ceaf7236-6d75-4319-afce-427b8d6cdb9e' },
    data: { verified: true }
  });
  console.log('--- Property Verification Status ---');
  console.log(`ID: ${property.id}, Name: ${property.name}, Verified: ${property.verified}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
