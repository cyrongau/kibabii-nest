import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('taxonomy')
export class TaxonomyController {
  constructor(private prisma: PrismaService) {}

  @Get('categories')
  async getCategories() {
    return this.prisma.category.findMany({ 
      include: { _count: { select: { properties: true } } },
      orderBy: { name: 'asc' } 
    });
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
    const types = await this.prisma.propertyType.findMany({ 
      include: { _count: { select: { propertyUnits: true } } },
      orderBy: { name: 'asc' } 
    });
    return types.map(t => ({
      ...t,
      _count: {
        units: t._count.propertyUnits
      }
    }));
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
