import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('taxonomy')
export class TaxonomyController {
  constructor(private prisma: PrismaService) {}

  @Get('categories')
  async getCategories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  @Post('categories')
  async createCategory(@Body() body: { name: string }) {
    return this.prisma.category.create({ data: { name: body.name } });
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    return this.prisma.category.delete({ where: { id } });
  }

  @Get('types')
  async getTypes() {
    return this.prisma.propertyType.findMany({ orderBy: { name: 'asc' } });
  }

  @Post('types')
  async createType(@Body() body: { name: string }) {
    return this.prisma.propertyType.create({ data: { name: body.name } });
  }

  @Delete('types/:id')
  async deleteType(@Param('id') id: string) {
    return this.prisma.propertyType.delete({ where: { id } });
  }
}
