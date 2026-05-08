import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async toggleFavorite(userId: string, propertyId: string) {
    console.log(`Toggling favorite for user ${userId} and property ${propertyId}`);
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    });

    if (existing) {
      console.log(`Found existing favorite (id: ${existing.id}), deleting...`);
      await this.prisma.favorite.delete({
        where: { id: existing.id },
      });
      return { favorited: false };
    } else {
      console.log(`No existing favorite found, creating new one...`);
      const created = await this.prisma.favorite.create({
        data: {
          userId,
          propertyId,
        },
      });
      console.log(`Created favorite (id: ${created.id})`);
      return { favorited: true };
    }
  }

  async getMyFavorites(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        property: {
          include: {
            category: true,
            units: { include: { type: true } },
          },
        },
      },
    });
    console.log(`Found ${favorites.length} favorites for user ${userId}`);
    return favorites;
  }

  async isFavorited(userId: string, propertyId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    });
    return !!favorite;
  }
}
