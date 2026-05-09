const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const data = {
  "users": [
    {
      "id": "90b267c7-2ba8-4185-bd12-9ac2a4cceff2",
      "email": "admin@kibabiinest.com",
      "password": "$2b$10$0uA5C706rAWd6fDXmc7asuFP/Obya6X3I40BsjkJoIg3Z0BB.wKnK",
      "name": "Kibabii Nest Admin",
      "role": "ADMIN",
      "phone": "+254715491409",
      "avatar": "http://192.168.0.207:9000/kibabii-nest/avatars/1777889053617-761879856-Cyro-Profile-green-icon.png",
      "createdAt": "2026-05-02T09:18:49.019Z",
      "updatedAt": "2026-05-05T09:50:51.188Z",
      "isVerifiedLandlord": false
    },
    {
      "id": "a5d89d60-13ac-4ff3-97dc-33bf9a9cd5c2",
      "email": "alex@landlord.com",
      "password": "$2b$10$1jk9nZxHzhkTF9eP1OXWmeqpCzwIRBA2mJWzRSSHXaXlN9bjVhLwG",
      "name": "Alex Thompson",
      "role": "LANDLORD",
      "createdAt": "2026-05-05T14:53:20.697Z",
      "updatedAt": "2026-05-05T14:53:20.697Z",
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
      "createdAt": "2026-05-02T09:18:49.043Z",
      "updatedAt": "2026-05-06T19:16:35.427Z",
      "isVerifiedLandlord": true,
      "balance": 13650
    },
    {
      "id": "6b2abc2c-ce29-4b2a-ab86-85cc1af591d5",
      "email": "sarah@student.com",
      "password": "$2b$10$0uA5C706rAWd6fDXmc7asuFP/Obya6X3I40BsjkJoIg3Z0BB.wKnK",
      "name": "Sarah Jenkins",
      "role": "STUDENT",
      "avatar": "http://192.168.0.207:9000/kibabii-nest/avatars/1778179626102-872405006-1000298760.jpg",
      "createdAt": "2026-05-02T09:18:49.051Z",
      "updatedAt": "2026-05-07T18:47:06.184Z"
    },
    {
      "id": "5dcb1918-10a0-46e7-8d09-fadb93d5be52",
      "email": "cyrongau@gmail.com",
      "password": "$2b$10$9dCwURC5zQtTQomicD6DNubciJyLvdLuZFvYHFssuu3wq811vo8jq",
      "name": "Cyrus Ongau ",
      "role": "STUDENT",
      "phone": "+254713852552",
      "avatar": "http://192.168.0.207:9000/kibabii-nest/avatars/1778273699034-112413804-1000299549.jpg",
      "createdAt": "2026-05-05T14:06:11.858Z",
      "updatedAt": "2026-05-08T20:54:59.308Z",
      "googleId": "112447446790328493010"
    }
  ],
  "properties": [
    {
      "id": "ceaf7236-6d75-4319-afce-427b8d6cdb9e",
      "name": "Unit One Plot",
      "description": "Unit One Plot offers affordable single student rooms behind Tuuti Market, near Kibabii University. Safe, convenient housing with easy access to campus and local amenities.",
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
      "createdAt": "2026-05-05T17:23:43.117Z",
      "updatedAt": "2026-05-05T21:00:28.922Z",
      "lat": 0.6138946204971132,
      "lng": 34.52968273711334,
      "rules": ["Quiet Hours: Maintain silence from 10 PM to 6 AM to respect fellow students’ study and rest time.", "Cleanliness: Keep rooms and shared areas tidy; dispose of trash properly and avoid littering around the compound.", "Visitors Policy: Visitors allowed only during daytime hours (8 AM–7 PM) and must be registered with the caretaker.", "No Vandalism: Protect property—no writing on walls, damaging furniture, or tampering with electrical/plumbing fixtures.", "Respect & Safety: Treat fellow tenants respectfully; no fighting, loud music, or unsafe activities within the premises.", "Failed to extract rules"],
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
      "createdAt": "2026-05-02T18:52:30.284Z",
      "updatedAt": "2026-05-06T20:58:17.013Z",
      "lat": 0.6177229051292228,
      "lng": 34.52940077598114,
      "rules": ["Failed to extract rules"],
      "services": ["Maintenance", "Waste Collection", "Cleaning"],
      "categoryId": "cmooof98p00007ycil07q6mbg"
    }
  ]
};

async function main() {
  console.log('Migrating users...');
  for (const user of data.users) {
    await prisma.user.upsert({
      where: { id: user.id },
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
  
  console.log('Migration complete!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
