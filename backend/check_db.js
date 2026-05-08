const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const properties = await prisma.property.findMany({
    include: { landlord: { select: { id: true, name: true, email: true } } }
  });
  console.log('--- Properties ---');
  properties.forEach(p => {
    console.log(`ID: ${p.id}, Name: ${p.name}, Landlord: ${p.landlord?.name} (${p.landlord?.id})`);
  });
  
  const users = await prisma.user.findMany({
    where: { role: 'LANDLORD' },
    select: { id: true, name: true, email: true }
  });
  console.log('\n--- Landlords ---');
  users.forEach(u => {
    console.log(`ID: ${u.id}, Name: ${u.name}, Email: ${u.email}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
