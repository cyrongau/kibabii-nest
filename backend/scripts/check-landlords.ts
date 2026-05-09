import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  const landlords = await prisma.user.findMany({
    where: { role: 'LANDLORD' },
    include: { kyc: true }
  });

  console.log('--- Landlords ---');
  landlords.forEach(u => {
    console.log(`ID: ${u.id} | Name: ${u.name} | Verified: ${u.isVerifiedLandlord} | KYC Status: ${u.kyc?.status || 'N/A'}`);
  });

  await prisma.$disconnect();
}

main();
