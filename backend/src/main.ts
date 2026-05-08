import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();
  await app.init();

  try {
    const prisma = app.get(PrismaService);
    const password = await bcrypt.hash('Password@123', 10);

    const seedUsers = [
      { email: 'admin@kibabiinest.com', name: 'Kibabii Nest Admin', role: 'ADMIN' },
      { email: 'alex@landlord.com', name: 'Alex Thompson', role: 'LANDLORD' },
      { email: 'sarah@student.com', name: 'Sarah Jenkins', role: 'STUDENT' },
    ];

    for (const u of seedUsers) {
      const exists = await prisma.user.findUnique({ where: { email: u.email } });
      if (!exists) {
        await prisma.user.create({
          data: {
            email: u.email,
            name: u.name,
            password,
            role: u.role as any,
          },
        });
        console.log(`✅ User created: ${u.email}`);
      }
    }
  } catch (err) {
    console.error('⚠️ Seeding failed:', err.message);
  }

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`🚀 Application is running on: http://localhost:3000`);
}
bootstrap();
