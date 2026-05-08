async function test() {
  try {
    // We need a token to test this endpoint
    // I'll skip the token check and just use prisma directly to see what the service would return
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const landlordId = 'e120cb19-2a0d-4bdd-9872-766c7ab5bd92';
    
    const bookings = await prisma.booking.findMany({
      where: {
        propertyUnit: {
          property: { landlordId }
        },
      },
      include: { propertyUnit: { include: { property: true, type: true } }, student: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    
    console.log('Bookings count:', bookings.length);
    if (bookings.length > 0) {
      console.log('First booking student:', bookings[0].student.name);
    }
    await prisma.$disconnect();
  } catch (e) {
    console.error(e);
  }
}
test();
