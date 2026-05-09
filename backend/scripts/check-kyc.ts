import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  const kycRecords = await prisma.landlordKyc.findMany({
    include: { user: true }
  });

  console.log('--- KYC Records ---');
  kycRecords.forEach(k => {
    console.log(`ID: ${k.id} | User: ${k.user?.name} | Status: ${k.status}`);
  });

  await prisma.$disconnect();
}

main();
