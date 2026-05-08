const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const targetId = 'e120cb19-2a0d-4bdd-9872-766c7ab5bd92';
  const properties = await prisma.property.findMany({
    where: { landlordId: targetId }
  });
  console.log(`Properties for landlord ${targetId}:`, properties.length);
  properties.forEach(p => console.log(` - ${p.name} (Verified: ${p.verified})`));

  const bookings = await prisma.booking.findMany({
    where: {
      propertyUnit: {
        property: { landlordId: targetId }
      }
    }
  });
  console.log(`Bookings for landlord ${targetId}:`, bookings.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
