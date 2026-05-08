import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const kycCount = await prisma.landlordKyc.count();
  const approvedCount = await prisma.landlordKyc.count({ where: { status: 'APPROVED' } });
  const allKyc = await prisma.landlordKyc.findMany({
    include: { user: true }
  });

  console.log('Total KYC Records:', kycCount);
  console.log('Approved KYC Records:', approvedCount);
  console.log('All KYC Statuses:', allKyc.map(k => ({ id: k.id, status: k.status, user: k.user.name })));

  await prisma.$disconnect();
}

main();
