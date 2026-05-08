const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    where: {
      id: { in: [
        "5dcb1918-10a0-46e7-8d09-fadb93d5be52",
        // Add other IDs from logs if any
      ]}
    },
    select: { id: true, name: true, email: true }
  });
  console.log('Users found:', users);
  
  const conversation = await prisma.conversation.findUnique({
    where: { id: "cmouop1o90000xpc3o77cuvrg" }
  });
  console.log('Conversation found:', conversation);
  
  process.exit(0);
}

check();
