const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const landlords = await prisma.user.findMany({
      where: { role: 'LANDLORD' },
      include: { kyc: true }
    });

    console.log('Total Landlords:', landlords.length);
    landlords.forEach(u => {
      console.log(`User: ${u.name} (${u.email}) - isVerifiedLandlord: ${u.isVerifiedLandlord}, KYC Status: ${u.kyc?.status || 'NONE'}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
