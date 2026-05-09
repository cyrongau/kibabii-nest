const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'LANDLORD' },
      include: { kyc: true }
    });
    console.log(JSON.stringify(users.map(u => ({
      name: u.name,
      role: u.role,
      isVerified: u.isVerifiedLandlord,
      kycStatus: u.kyc ? u.kyc.status : 'NONE'
    })), null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
