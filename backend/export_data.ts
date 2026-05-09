import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('Exporting data...');
  
  const users = await prisma.user.findMany();
  const properties = await prisma.property.findMany();
  
  const data = {
    users,
    properties
  };
  
  fs.writeFileSync('migration_data.json', JSON.stringify(data, null, 2));
  console.log(`Exported ${users.length} users and ${properties.length} properties to migration_data.json`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
