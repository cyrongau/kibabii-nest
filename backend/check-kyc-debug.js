const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const kycs = await prisma.landlordKyc.findMany({
      include: { user: true }
    });
    console.log('--- LANDLORD KYC RECORDS ---');
    console.log(JSON.stringify(kycs, null, 2));
    
    const verifiedUsers = await prisma.user.findMany({
      where: { isVerifiedLandlord: true, role: 'LANDLORD' }
    });
    console.log('--- MANUALLY VERIFIED LANDLORDS ---');
    console.log(JSON.stringify(verifiedUsers, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
