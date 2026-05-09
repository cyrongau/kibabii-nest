const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUrls() {
  const oldHosts = [
    '192.168.0.207:9000',
    'localhost:3000',
    '127.0.0.1:3000',
    '192.168.0.207:3000'
  ];
  // Note: S3_PUBLIC_URL in docker is https://api.kibabii.generexcom.com/s3
  const newBase = 'https://api.kibabii.generexcom.com/s3';

  console.log(`Starting URL migration to: ${newBase}`);

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
    
    // Update images array
    const newImages = prop.images.map(img => {
      let newImg = img;
      for (const host of oldHosts) {
        if (newImg.includes(host)) {
          // Replace http://host or host with newBase
          newImg = newImg.replace(new RegExp(`https?://${host}`, 'g'), newBase);
          newImg = newImg.replace(new RegExp(host, 'g'), newBase.replace('https://', ''));
        }
      }
      return newImg;
    });

    if (JSON.stringify(newImages) !== JSON.stringify(prop.images)) {
      prop.images = newImages;
      updated = true;
    }
    
    // Update agreement template
    if (prop.agreementTemplateUrl) {
      for (const host of oldHosts) {
        if (prop.agreementTemplateUrl.includes(host)) {
          prop.agreementTemplateUrl = prop.agreementTemplateUrl.replace(new RegExp(`https?://${host}`, 'g'), newBase);
          updated = true;
        }
      }
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
  const allUsers = await prisma.user.findMany();
  for (const user of allUsers) {
    if (user.avatar) {
      let newAvatar = user.avatar;
      let updated = false;
      for (const host of oldHosts) {
        if (newAvatar.includes(host)) {
          newAvatar = newAvatar.replace(new RegExp(`https?://${host}`, 'g'), newBase);
          updated = true;
        }
      }
      if (updated) {
        await prisma.user.update({
          where: { id: user.id },
          data: { avatar: newAvatar }
        });
        console.log(`✅ Updated user avatar: ${user.email}`);
      }
    }
  }

  // 3. Fix Student Identities
  const allIdentities = await prisma.studentIdentity.findMany();
  for (const ident of allIdentities) {
    if (ident.documentUrl) {
      let newDoc = ident.documentUrl;
      let updated = false;
      for (const host of oldHosts) {
        if (newDoc.includes(host)) {
          newDoc = newDoc.replace(new RegExp(`https?://${host}`, 'g'), newBase);
          updated = true;
        }
      }
      if (updated) {
        await prisma.studentIdentity.update({
          where: { id: ident.id },
          data: { documentUrl: newDoc }
        });
        console.log(`✅ Updated student identity: ${ident.userId}`);
      }
    }
  }

  console.log('Done!');
  await prisma.$disconnect();
}

fixUrls().catch(err => {
  console.error('Error fixing URLs:', err);
  process.exit(1);
});
