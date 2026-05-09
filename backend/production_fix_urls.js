const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CONFIG = {
  oldHosts: [
    '192.168.0.207:9000',
    'localhost:9000',
    '127.0.0.1:9000',
    'api.kibabii.generexcom.com:9005', // Common mistake
    'localhost:3000'
  ],
  newBase: 'https://api.kibabii.generexcom.com/s3',
  bucketName: 'kibabii-nest'
};

/**
 * Fixes a single URL by replacing old host patterns with the new production base.
 */
function fixUrl(url) {
  if (!url || typeof url !== 'string') return url;
  
  let newUrl = url;
  
  // 1. Remove double protocol if any (common migration glitch)
  newUrl = newUrl.replace(/https?:\/\/https?:\/\//g, 'https://');

  // 2. Replace known old host patterns
  for (const host of CONFIG.oldHosts) {
    // Replace http://host or https://host
    const hostRegex = new RegExp(`https?://${host}`, 'g');
    newUrl = newUrl.replace(hostRegex, CONFIG.newBase);
    
    // Replace host alone (if it's just the domain part)
    if (newUrl.includes(host) && !newUrl.startsWith('http')) {
       newUrl = newUrl.replace(new RegExp(host, 'g'), CONFIG.newBase.replace('https://', ''));
    }
  }

  // 3. Ensure the bucket name is present once after /s3/
  // URL should look like https://api.kibabii.generexcom.com/s3/kibabii-nest/...
  const s3Part = '/s3/';
  if (newUrl.includes(s3Part)) {
    const parts = newUrl.split(s3Part);
    let afterS3 = parts[1];
    
    // If it doesn't start with bucket name, prepend it
    if (!afterS3.startsWith(CONFIG.bucketName)) {
        // If it starts with a slash, remove it first
        if (afterS3.startsWith('/')) afterS3 = afterS3.substring(1);
        newUrl = `${parts[0]}${s3Part}${CONFIG.bucketName}/${afterS3}`;
    }
    
    // Fix double slashes after s3
    newUrl = newUrl.replace(/\/s3\/\/+/g, '/s3/');
    newUrl = newUrl.replace(new RegExp(`/${CONFIG.bucketName}//+`, 'g'), `/${CONFIG.bucketName}/`);
  }

  return newUrl;
}

async function main() {
  console.log('🚀 Starting Production URL Fix Script...');
  console.log(`Target Base: ${CONFIG.newBase}`);
  console.log(`Bucket: ${CONFIG.bucketName}\n`);

  // --- 1. Fix User Avatars ---
  const users = await prisma.user.findMany({ where: { avatar: { not: null } } });
  let userCount = 0;
  for (const user of users) {
    const fixed = fixUrl(user.avatar);
    if (fixed !== user.avatar) {
      await prisma.user.update({ where: { id: user.id }, data: { avatar: fixed } });
      userCount++;
    }
  }
  console.log(`✅ Fixed ${userCount} user avatars`);

  // --- 2. Fix Property Images & Templates ---
  const properties = await prisma.property.findMany();
  let propCount = 0;
  for (const prop of properties) {
    const fixedImages = (prop.images || []).map(fixUrl);
    const fixedTemplate = fixUrl(prop.agreementTemplateUrl);
    
    let needsUpdate = fixedTemplate !== prop.agreementTemplateUrl;
    if (!needsUpdate) {
        needsUpdate = JSON.stringify(fixedImages) !== JSON.stringify(prop.images);
    }

    if (needsUpdate) {
      await prisma.property.update({
        where: { id: prop.id },
        data: { 
          images: fixedImages,
          agreementTemplateUrl: fixedTemplate
        }
      });
      propCount++;
      console.log(`   - Fixed: ${prop.name}`);
    }
  }
  console.log(`✅ Fixed ${propCount} properties`);

  // --- 3. Fix Marketplace Items ---
  try {
    const items = await prisma.marketplaceItem.findMany();
    let itemCount = 0;
    for (const item of items) {
      const fixedImages = (item.images || []).map(fixUrl);
      if (JSON.stringify(fixedImages) !== JSON.stringify(item.images)) {
        await prisma.marketplaceItem.update({
          where: { id: item.id },
          data: { images: fixedImages }
        });
        itemCount++;
      }
    }
    console.log(`✅ Fixed ${itemCount} marketplace items`);
  } catch (e) {
    console.log('ℹ️ Marketplace table skipped or empty.');
  }

  // --- 4. Fix Reviewer Avatars in Reviews ---
  try {
    const reviews = await prisma.review.findMany();
    // Reviews don't have avatar field directly, but if they did we'd fix them here.
    // Usually linked to User.
  } catch (e) {}

  console.log('\n✨ Database URL correction complete!');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error during fix:', err);
  process.exit(1);
});
