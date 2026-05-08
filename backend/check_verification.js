const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'LANDLORD' },
    select: { id: true, name: true, email: true, isVerifiedLandlord: true }
  });
  console.log('--- Landlords Verification Status ---');
  users.forEach(u => {
    console.log(`ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Verified: ${u.isVerifiedLandlord}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
