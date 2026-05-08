const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const user1 = "6b2abc2c-ce29-4b2a-ab86-85cc1af591d5";
  // I need to find what otherUserId was passed.
  // I'll check all users and student profiles to see if there are any mismatches.
  
  const users = await prisma.user.findMany({
    select: { id: true, name: true }
  });
  console.log('Total Users:', users.length);
  
  const studentProfiles = await prisma.studentIdentity.findMany({
    select: { userId: true }
  });
  console.log('Student Profiles:', studentProfiles.length);
  
  // Check if any student profile has a userId that doesn't exist in User table
  const userIds = new Set(users.map(u => u.id));
  const orphans = studentProfiles.filter(p => !userIds.has(p.userId));
  console.log('Orphaned student profiles:', orphans);
  
  process.exit(0);
}

check();
