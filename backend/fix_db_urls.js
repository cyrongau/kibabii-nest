const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUrls() {
  const oldHost = 'localhost:9000';
  const newHost = '192.168.0.207:9000';

  console.log(`Searching for URLs containing "${oldHost}"...`);

  // 1. Fix Properties images
  const properties = await prisma.property.findMany({
    where: {
      OR: [
        { images: { hasSome: [`http://${oldHost}`] } }, // Prisma doesn't support substring match in string arrays easily
        { agreementTemplateUrl: { contains: oldHost } }
      ]
    }
  });

  // Since Prisma array search is limited, we'll fetch all and filter in JS for simplicity in this script
  const allProperties = await prisma.property.findMany();
  for (const prop of allProperties) {
    let updated = false;
    const newImages = prop.images.map(img => img.replace(oldHost, newHost));
    if (JSON.stringify(newImages) !== JSON.stringify(prop.images)) {
      prop.images = newImages;
      updated = true;
    }
    
    if (prop.agreementTemplateUrl && prop.agreementTemplateUrl.includes(oldHost)) {
      prop.agreementTemplateUrl = prop.agreementTemplateUrl.replace(oldHost, newHost);
      updated = true;
    }

    if (updated) {
      await prisma.property.update({
        where: { id: prop.id },
        data: {
          images: prop.images,
          agreementTemplateUrl: prop.agreementTemplateUrl
        }
      });
      console.log(`✅ Updated property: ${prop.name}`);
    }
  }

  // 2. Fix Users avatar
  const users = await prisma.user.findMany({
    where: { avatar: { contains: oldHost } }
  });
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: user.avatar.replace(oldHost, newHost) }
    });
    console.log(`✅ Updated user avatar: ${user.email}`);
  }

  // 3. Fix Student Identities
  const identities = await prisma.studentIdentity.findMany({
    where: { documentUrl: { contains: oldHost } }
  });
  for (const ident of identities) {
    await prisma.studentIdentity.update({
      where: { id: ident.id },
      data: { documentUrl: ident.documentUrl.replace(oldHost, newHost) }
    });
    console.log(`✅ Updated student identity: ${ident.userId}`);
  }

  console.log('Done!');
  await prisma.$disconnect();
}

fixUrls().catch(err => {
  console.error('Error fixing URLs:', err);
  process.exit(1);
});
