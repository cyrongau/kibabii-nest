const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const data = {
  "categories": [
    { "id": "cmooof98p00007ycil07q6mbg", "name": "Rental" },
    { "id": "cmooof99f00017yciut51bggl", "name": "Hostel" },
    { "id": "cmooof99p00027ycicgt80hb7", "name": "Airbnb" },
    { "id": "cmooof99z00037yciqwx3yhnp", "name": "Commercial" }
  ],
  "users": [
    {
      "id": "90b267c7-2ba8-4185-bd12-9ac2a4cceff2",
      "email": "admin@kibabiinest.com",
      "password": "$2b$10$0uA5C706rAWd6fDXmc7asuFP/Obya6X3I40BsjkJoIg3Z0BB.wKnK",
      "name": "Kibabii Nest Admin",
      "role": "ADMIN",
      "phone": "+254715491409",
      "avatar": "http://192.168.0.207:9000/kibabii-nest/avatars/1777889053617-761879856-Cyro-Profile-green-icon.png",
      "isVerifiedLandlord": false
    },
    {
      "id": "a5d89d60-13ac-4ff3-97dc-33bf9a9cd5c2",
      "email": "alex@landlord.com",
      "password": "$2b$10$1jk9nZxHzhkTF9eP1OXWmeqpCzwIRBA2mJWzRSSHXaXlN9bjVhLwG",
      "name": "Alex Thompson",
      "role": "LANDLORD",
      "isVerifiedLandlord": false
    },
    {
      "id": "e120cb19-2a0d-4bdd-9872-766c7ab5bd92",
      "email": "alexfgfgdf@landlord.com",
      "password": "$2b$10$0uA5C706rAWd6fDXmc7asuFP/Obya6X3I40BsjkJoIg3Z0BB.wKnK",
      "name": "Alex Thompson",
      "role": "LANDLORD",
      "phone": "+254769759129",
      "avatar": "http://192.168.0.207:9000/kibabii-nest/images/1777725972293-734142530-Jacob-Musonye.jpg",
      "isVerifiedLandlord": true,
      "balance": 13650
    },
    {
      "id": "6b2abc2c-ce29-4b2a-ab86-85cc1af591d5",
      "email": "sarah@student.com",
      "password": "$2b$10$0uA5C706rAWd6fDXmc7asuFP/Obya6X3I40BsjkJoIg3Z0BB.wKnK",
      "name": "Sarah Jenkins",
      "role": "STUDENT",
      "avatar": "http://192.168.0.207:9000/kibabii-nest/avatars/1778179626102-872405006-1000298760.jpg"
    },
    {
      "id": "5dcb1918-10a0-46e7-8d09-fadb93d5be52",
      "email": "cyrongau@gmail.com",
      "password": "$2b$10$9dCwURC5zQtTQomicD6DNubciJyLvdLuZFvYHFssuu3wq811vo8jq",
      "name": "Cyrus Ongau ",
      "role": "STUDENT",
      "phone": "+254713852552",
      "avatar": "http://192.168.0.207:9000/kibabii-nest/avatars/1778273699034-112413804-1000299549.jpg",
      "googleId": "112447446790328493010"
    }
  ],
  "properties": [
    {
      "id": "ceaf7236-6d75-4319-afce-427b8d6cdb9e",
      "name": "Unit One Plot",
      "description": "Unit One Plot offers affordable single student rooms behind Tuuti Market, near Kibabii University.",
      "address": "Behind Tuuti Market",
      "city": "Bungoma",
      "distanceToCampus": 874,
      "amenities": ["Security", "Study Area", "Token Meter", "Borehole"],
      "images": [
        "http://192.168.0.207:9000/kibabii-nest/images/1778001771695-989646582-1631.jpg",
        "http://192.168.0.207:9000/kibabii-nest/images/1778001788013-388955432-17638.jpg",
        "http://192.168.0.207:9000/kibabii-nest/images/1778001794683-311172940-4736.jpg"
      ],
      "verified": true,
      "landlordId": "e120cb19-2a0d-4bdd-9872-766c7ab5bd92",
      "lat": 0.6138946204971132,
      "lng": 34.52968273711334,
      "rules": ["Quiet Hours: Maintain silence from 10 PM to 6 AM", "Cleanliness", "Visitors Policy", "No Vandalism", "Respect & Safety"],
      "services": ["Cleaning", "Maintenance", "Waste Collection"],
      "categoryId": "cmooof99f00017yciut51bggl",
      "agreementTemplateUrl": "http://192.168.0.207:9000/kibabii-nest/contracts/1778014824747-107454356-KibabiiOrangeHouseTenancyAgreement1.pdf"
    },
    {
      "id": "4bfe60bd-9585-4e29-89a4-826fa10b2bcb",
      "name": "Kibabii Orange House",
      "description": "Student accommodation at Kibabi Orange House",
      "address": "Cardinal Otunga-ACK Road",
      "city": "Bungoma",
      "distanceToCampus": 790,
      "amenities": ["Token Meter", "Borehole", "WiFi", "Security", "Study Area"],
      "images": [
        "http://192.168.0.207:9000/kibabii-nest/properties/1777747811793-267475552-6947.jpg",
        "http://192.168.0.207:9000/kibabii-nest/properties/1777747822566-545505276-9117.jpg",
        "http://192.168.0.207:9000/kibabii-nest/properties/1777747833732-668634581-12633.jpg"
      ],
      "verified": true,
      "landlordId": "e120cb19-2a0d-4bdd-9872-766c7ab5bd92",
      "lat": 0.6177229051292228,
      "lng": 34.52940077598114,
      "rules": ["Respect boundaries", "Cleanliness"],
      "services": ["Maintenance", "Waste Collection", "Cleaning"],
      "categoryId": "cmooof98p00007ycil07q6mbg"
    }
  ]
};

async function main() {
  console.log('Migrating categories...');
  for (const cat of data.categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: cat,
      create: cat
    });
  }

  console.log('Migrating users...');
  for (const user of data.users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: user,
      create: user
    });
  }
  
  console.log('Migrating properties...');
  for (const prop of data.properties) {
    await prisma.property.upsert({
      where: { id: prop.id },
      update: prop,
      create: prop
    });
  }
  
  console.log('Running URL fix script...');
  const oldHosts = ['192.168.0.207:9000', 'localhost:3000', '127.0.0.1:3000'];
  const newBase = 'https://api.kibabii.generexcom.com/s3';

  // Fix Properties
  const properties = await prisma.property.findMany();
  for (const prop of properties) {
    let updated = false;
    const newImages = prop.images.map(img => {
      let newImg = img;
      for (const host of oldHosts) {
        if (newImg.includes(host)) {
          newImg = newImg.replace(new RegExp(`https?://${host}`, 'g'), newBase);
          newImg = newImg.replace(new RegExp(host, 'g'), newBase.replace('https://', ''));
          updated = true;
        }
      }
      return newImg;
    });

    if (updated) {
      await prisma.property.update({
        where: { id: prop.id },
        data: { images: newImages }
      });
      console.log(`✅ Fixed URLs for property: ${prop.name}`);
    }
  }

  console.log('Migration and URL fixing complete!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
