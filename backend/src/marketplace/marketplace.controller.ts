import { Controller, Get, Post, Body, UseGuards, Request, Patch, Param, Query, Delete } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get()
  async getAll(@Query('category') category?: string, @Query('search') search?: string) {
    return this.marketplaceService.getAllItems(category, search);
  }

  @Get('my-items')
  @UseGuards(JwtAuthGuard)
  async getMyItems(@Request() req) {
    return this.marketplaceService.getMyItems(req.user.userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createItem(@Request() req, @Body() data: { title: string; description: string; price: number; images: string[]; category?: string; phone?: string }) {
    return this.marketplaceService.createItem(req.user.userId, data);
  }

  @Get(':id')
  async getDetails(@Param('id') id: string) {
    return this.marketplaceService.getItemDetails(id);
  }

  @Patch(':id/sold')
  @UseGuards(JwtAuthGuard)
  async markAsSold(@Request() req, @Param('id') id: string) {
    return this.marketplaceService.markAsSold(req.user.userId, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateItem(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.marketplaceService.updateItem(req.user.userId, id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteItem(@Request() req, @Param('id') id: string) {
    return this.marketplaceService.deleteItem(req.user.userId, id);
  }
}
