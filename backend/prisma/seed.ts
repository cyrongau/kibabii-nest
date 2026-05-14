import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Use the default constructor which relies on DATABASE_URL env var
const prisma = new PrismaClient();

async function main() {
  const publicUrl = process.env.S3_PUBLIC_URL || 'https://api.kibabii.generexcom.com/uploads/proxy';
  const password = await bcrypt.hash('Password@123', 10);

  console.log('Seeding database with URL:', process.env.DATABASE_URL);
  console.log('Using Public URL for assets:', publicUrl);

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@kibabiinest.com' },
    update: {},
    create: {
      email: 'admin@kibabiinest.com',
      name: 'Kibabii Nest Admin',
      password,
      role: 'ADMIN',
    },
  });

  // Landlord
  await prisma.user.upsert({
    where: { email: 'alex@landlord.com' },
    update: {},
    create: {
      email: 'alex@landlord.com',
      name: 'Alex Thompson',
      password,
      role: 'LANDLORD',
    },
  });

  // Student
  await prisma.user.upsert({
    where: { email: 'sarah@student.com' },
    update: {},
    create: {
      email: 'sarah@student.com',
      name: 'Sarah Jenkins',
      password,
      role: 'STUDENT',
    },
  });

  // Landlord 2
  await prisma.user.upsert({
    where: { email: 'alexfgfgdf@landlord.com' },
    update: {},
    create: {
      email: 'alexfgfgdf@landlord.com',
      name: 'Alex Landlord 2',
      password,
      role: 'LANDLORD',
    },
  });

  // Student 2
  const student2Password = await bcrypt.hash('Cyro@#4001', 10);
  const userCyro = await prisma.user.upsert({
    where: { email: 'cyrongau@gmail.com' },
    update: {},
    create: {
      email: 'cyrongau@gmail.com',
      name: 'Cyro Student',
      password: student2Password,
      role: 'STUDENT',
    },
  });

  // Properties for Landlord 1 (Alex Thompson / alex@landlord.com)
  const landlord1 = await prisma.user.findUnique({ where: { email: 'alex@landlord.com' } });
  if (landlord1) {
    const pType = await prisma.propertyType.upsert({
      where: { name: 'Rental' },
      update: {},
      create: { name: 'Rental' }
    });

    await prisma.property.create({
      data: {
        name: 'Kibabii Orange House',
        description: 'Premium student residence with high security.',
        address: 'Cardinal Otunga Road, Bungoma',
        city: 'Bungoma',
        lat: 0.6170124177529738,
        lng: 34.523624254983,
        landlordId: landlord1.id,
        images: [`${publicUrl}/placeholder/hostel_2.png`],
        amenities: ['WiFi', 'Water', 'Security', 'Electricity'],
        units: {
          create: [
            { 
              typeId: pType.id, 
              price: 2500, 
              capacity: 1, 
              totalUnits: 20,
              unitNames: ['Room 1', 'Room 2'] 
            }
          ]
        }
      }
    });
    console.log('✅ Sample property created for Landlord 1');
  }

  // Properties for Landlord 2 (Alex Thompson / alexfgfgdf@landlord.com)
  const landlord2 = await prisma.user.findUnique({ where: { email: 'alexfgfgdf@landlord.com' } });
  if (landlord2) {
    const pType = await prisma.propertyType.upsert({
      where: { name: 'Hostel' },
      update: {},
      create: { name: 'Hostel' }
    });

    await prisma.property.create({
      data: {
        name: 'Elite Kibabii Hostel',
        description: 'Modern student housing with high-speed internet and 24/7 security.',
        address: 'Kibabii University, Bungoma',
        city: 'Bungoma',
        lat: 0.6170124177529738,
        lng: 34.523624254983,
        landlordId: landlord2.id,
        images: [`${publicUrl}/placeholder/hostel_1.png`],
        amenities: ['WiFi', 'Water', 'Security', 'Electricity'],
        units: {
          create: [
            { 
              typeId: pType.id, 
              price: 5000, 
              capacity: 1, 
              totalUnits: 10,
              unitNames: ['Room A1', 'Room A2', 'Room A3'] 
            }
          ]
        }
      }
    });
    console.log('✅ Sample property created for Landlord 2');
  }

  console.log('Seed data created successfully!');
  console.log('--- LOGIN CREDENTIALS ---');
  console.log('Admin: admin@kibabiinest.com / Password@123');
  console.log('Landlord: alex@landlord.com / Password@123');
  console.log('Student: sarah@student.com / Password@123');
  console.log('Landlord 2: alexfgfgdf@landlord.com / Password@123');
  console.log('Student 2: cyrongau@gmail.com / Cyro@#4001');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
