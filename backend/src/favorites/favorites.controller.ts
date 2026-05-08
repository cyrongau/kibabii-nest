import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post('toggle/:propertyId')
  async toggle(@Request() req: any, @Param('propertyId') propertyId: string) {
    return this.favoritesService.toggleFavorite(req.user.userId, propertyId);
  }

  @Get('my-favorites')
  async getMyFavorites(@Request() req: any) {
    return this.favoritesService.getMyFavorites(req.user.userId);
  }

  @Get('check/:propertyId')
  async check(@Request() req: any, @Param('propertyId') propertyId: string) {
    const isFavorited = await this.favoritesService.isFavorited(req.user.userId, propertyId);
    return { isFavorited };
  }
}
