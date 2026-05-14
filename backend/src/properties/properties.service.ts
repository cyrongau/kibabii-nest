import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../notifications/mail.service';

@Injectable()
export class PropertiesService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(data: any) {
    let categoryId = data.categoryId || null;
    if (!categoryId && data.category) {
      const categoryName = typeof data.category === 'string' ? data.category : data.category.name;
      const cat = await this.prisma.category.upsert({
        where: { name: categoryName },
        update: {},
        create: { name: categoryName }
      });
      categoryId = cat.id;
    }

    const resolvedUnits = await Promise.all((data.units || []).map(async (u: any) => {
      let typeId = u.typeId;
      const typeName = u.type?.name || u.type;
      
      if (!typeId && typeName) {
        // Automatically upsert the property type by name
        const pt = await this.prisma.propertyType.upsert({
          where: { name: typeName },
          update: {},
          create: { name: typeName }
        });
        typeId = pt.id;
      }
      
      return {
        typeId,
        price: Number(u.price),
        capacity: Number(u.capacity),
        totalUnits: Number(u.totalUnits) || 1,
        unitNames: u.unitNames || [],
        upfrontDiscountPct: Number(u.upfrontDiscountPct || 0),
      };
    }));

    try {
      const property = await this.prisma.property.create({
        data: {
          name: data.name,
          description: data.description || `Student accommodation at ${data.name || 'Kibabii Nest'}`,
          address: data.address,
          city: data.city || 'Bungoma',
          distanceToCampus: data.distanceToCampus,
          categoryId,
          lat: data.lat,
          lng: data.lng,
          amenities: data.amenities || [],
          services: data.services || [],
          rules: data.rules || [],
          images: data.images || [],
          videoUrl: data.videoUrl,
          landlordId: data.landlordId,
          utilityConfig: data.utilityConfig || {},
          extraCharges: data.extraCharges || {},
          agreementTemplateUrl: data.agreementTemplateUrl,
          useSystemAgreement: data.useSystemAgreement || false,
          units: {
            create: resolvedUnits
          }
        },
      });

      // Notify admin about new property submission
      const landlord = await this.prisma.user.findUnique({ where: { id: data.landlordId } });
      this.mailService.sendNewPropertyNotification(
        property.name,
        landlord?.name || 'Unknown',
        property.address,
        resolvedUnits.length
      ).catch(err => console.warn('Property notification failed:', err.message));

      return property;
    } catch (error: any) {
      console.error('Prisma Property Creation Error:', error);
      throw new InternalServerErrorException(error.message || 'Database error occurred during property creation');
    }
  }
  async update(id: string, data: any) {
    let categoryId = data.categoryId;
    if (!categoryId && data.category) {
      const categoryName = data.category?.name || data.category;
      if (typeof categoryName === 'string') {
        const cat = await this.prisma.category.upsert({
          where: { name: categoryName },
          update: {},
          create: { name: categoryName }
        });
        categoryId = cat.id;
      }
    }

    console.log(`[DEBUG] Updating property ${id}`);
    console.log(`[DEBUG] Received units count: ${data.units?.length || 0}`);

    try {
      // 1. First, update the property basic fields
      const property = await this.prisma.property.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          address: data.address,
          distanceToCampus: data.distanceToCampus !== undefined ? Number(data.distanceToCampus) : undefined,
          categoryId,
          lat: data.lat !== undefined ? Number(data.lat) : undefined,
          lng: data.lng !== undefined ? Number(data.lng) : undefined,
          amenities: data.amenities,
          services: data.services,
          rules: data.rules,
          images: data.images,
          videoUrl: data.videoUrl,
          utilityConfig: data.utilityConfig,
          extraCharges: data.extraCharges,
          agreementTemplateUrl: data.agreementTemplateUrl,
          useSystemAgreement: data.useSystemAgreement,
        }
      });

      // 2. Then, handle units if provided
      if (data.units && Array.isArray(data.units)) {
        const resolvedUnits: Array<{
          id?: string;
          typeId?: string;
          price: number;
          capacity: number;
          totalUnits: number;
          upfrontDiscountPct: number;
          unitNames: string[];
        }> = await Promise.all(data.units.map(async (u: any) => {
          let typeId = u.typeId;
          const typeName = u.type?.name || u.type;
          if (!typeId && typeName) {
            const pt = await this.prisma.propertyType.upsert({
              where: { name: typeName },
              update: {},
              create: { name: typeName }
            });
            typeId = pt.id;
          }
          return {
            id: u.id && !u.id?.toString().startsWith('temp-') ? u.id : undefined,
            typeId,
            price: Number(u.price) || 0,
            capacity: Number(u.capacity) || 1,
            totalUnits: Number(u.totalUnits) || 1,
            upfrontDiscountPct: Number(u.upfrontDiscountPct) || 0,
            unitNames: Array.isArray(u.unitNames) ? u.unitNames : (typeof u.unitNames === 'string' ? u.unitNames.split(',').map((s: string) => s.trim()).filter(Boolean) : [])
          };
        }));

        const existingIds = resolvedUnits.filter(u => u.id).map(u => u.id!);
        console.log(`[DEBUG] Existing unit IDs to keep: ${existingIds.join(', ')}`);

        // Use a transaction for the units
        await this.prisma.$transaction([
          // Delete units not in the list
          this.prisma.propertyUnit.deleteMany({
            where: { 
              propertyId: id,
              id: { notIn: existingIds }
            }
          }),
          // Upsert the rest
          ...resolvedUnits.map((u: any) => this.prisma.propertyUnit.upsert({
            where: { id: (u.id as string) || `new-${Math.random().toString(36).substr(2, 9)}` },
            create: {
              propertyId: id as string,
              typeId: (u.typeId as string) || undefined,
              price: (Number(u.price) || 0) as number,
              capacity: (Number(u.capacity) || 1) as number,
              totalUnits: (Number(u.totalUnits) || 1) as number,
              unitNames: (u.unitNames as string[]) || [],
              upfrontDiscountPct: (Number(u.upfrontDiscountPct) || 0) as number
            },
            update: {
              typeId: (u.typeId as string) || undefined,
              price: (Number(u.price) || 0) as number,
              capacity: (Number(u.capacity) || 1) as number,
              totalUnits: (Number(u.totalUnits) || 1) as number,
              unitNames: (u.unitNames as string[]) || [],
              upfrontDiscountPct: (Number(u.upfrontDiscountPct) || 0) as number
            }
          }))
        ]);
      }

      return await this.prisma.property.findUnique({
        where: { id },
        include: { units: { include: { type: true } } }
      });
    } catch (error: any) {
      console.error('[CRITICAL] Property Update Error:', error);
      if (error.code) console.error('[DEBUG] Prisma Error Code:', error.code);
      throw new InternalServerErrorException(error.message || 'Failed to update property');
    }
  }

  async findAll(filters: any) {
    const { type, minPrice, maxPrice, city, landlordId, search } = filters;
    
    const unitFilter: any = {};
    if (type) unitFilter.type = { name: type };
    if (minPrice || maxPrice) {
      unitFilter.price = {};
      if (minPrice) unitFilter.price.gte = parseFloat(minPrice);
      if (maxPrice) unitFilter.price.lte = parseFloat(maxPrice);
    }

    const where: any = {
      landlordId: landlordId || undefined,
      city: city || undefined,
      ...(Object.keys(unitFilter).length > 0 ? { units: { some: unitFilter } } : {})
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { landlord: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const properties = await this.prisma.property.findMany({
      where,
      include: {
        landlord: { select: { name: true, email: true, phone: true } },
        category: true,
        units: {
          include: {
            type: true,
            bookings: { where: { status: { in: ['APPROVED', 'PENDING'] } } },
            tenancies: {
              where: { status: { in: ['ACTIVE', 'NOTICE_GIVEN', 'BREAK_HOLD'] } },
              include: { vacationNotice: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const now = new Date();

    return properties.map(prop => {
      const unitsWithOccupancy = prop.units.map(u => {
        const activeTenancies = u.tenancies.filter(t => t.status !== 'VACATED');
        const pendingBookings = u.bookings.filter(b => b.status === 'PENDING');
        const occupiedCount = activeTenancies.length + pendingBookings.length;
        const isFull = occupiedCount >= u.totalUnits;

        // Vacation countdown: find tenancies with active notices
        const vacationNotices = activeTenancies
          .filter(t => t.vacationNotice && !t.vacationNotice.processed)
          .map(t => {
            const daysUntil = Math.ceil((t.vacationNotice!.vacationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return { vacationDate: t.vacationNotice!.vacationDate, daysUntilAvailable: Math.max(0, daysUntil) };
          });

        // Check if unit offers upfront discount
        const unitHasDiscount = u.upfrontDiscountPct > 0;

        return {
          ...u,
          tenancies: undefined, // Don't leak full tenancy data
          bookings: undefined,
          occupiedCount,
          isFull,
          vacantCount: u.totalUnits - occupiedCount,
          upcomingVacancies: vacationNotices,
          hasDiscount: unitHasDiscount,
          upfrontDiscountPct: u.upfrontDiscountPct
        };
      });

      const isFullyOccupied = unitsWithOccupancy.length > 0 && unitsWithOccupancy.every(u => u.isFull);
      const hasUpcomingVacancy = unitsWithOccupancy.some(u => u.upcomingVacancies.length > 0);
      const hasDiscount = unitsWithOccupancy.some(u => u.hasDiscount);
      const maxDiscount = Math.max(0, ...unitsWithOccupancy.map(u => u.upfrontDiscountPct || 0));
      const prices = unitsWithOccupancy.map(u => u.price);
      const lowestPrice = prices.length ? Math.min(...prices) : 0;

      return {
        ...prop,
        units: unitsWithOccupancy,
        isFullyOccupied,
        hasUpcomingVacancy,
        hasDiscount,
        maxDiscount,
        price: lowestPrice,
      };
    });
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: { 
        landlord: { select: { name: true, email: true, phone: true, avatar: true } }, 
        reviews: true,
        category: true,
        units: {
          include: { 
            type: true, 
            bookings: { where: { status: { in: ['APPROVED', 'PENDING'] } } },
            tenancies: {
              where: { status: { in: ['ACTIVE', 'NOTICE_GIVEN', 'BREAK_HOLD'] } }
            }
          }
        }
      },
    });
    
    if (!property) throw new NotFoundException('Property not found');

    const unitsWithOccupancy = property.units.map(u => {
      const activeTenancies = (u as any).tenancies || [];
      const pendingBookings = u.bookings.filter(b => b.status === 'PENDING');
      const occupiedCount = activeTenancies.length + pendingBookings.length;
      return {
        ...u,
        tenancies: undefined,
        occupiedCount,
        isFull: occupiedCount >= u.totalUnits,
        hasDiscount: u.upfrontDiscountPct > 0
      };
    });
    const isFullyOccupied = unitsWithOccupancy.length > 0 && unitsWithOccupancy.every(u => u.isFull);
    const hasDiscount = unitsWithOccupancy.some(u => u.hasDiscount);
    const maxDiscount = Math.max(0, ...unitsWithOccupancy.map(u => u.upfrontDiscountPct || 0));
    const prices = unitsWithOccupancy.map(u => u.price);
    const minPrice = prices.length ? Math.min(...prices) : 0;

    return {
      ...property,
      units: unitsWithOccupancy,
      isFullyOccupied,
      hasDiscount,
      maxDiscount,
      price: minPrice
    };
  }

  async generateAIDescription(attributes: { name: string; amenities: string[]; type: string; distance: number }) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
      return "OpenRouter API Key not configured. Please set it in the .env file.";
    }

    const prompt = `Write a persuasive and professional marketing description for a student hostel listing with the following details:
    Name: ${attributes.name}
    Type: ${attributes.type}
    Amenities: ${attributes.amenities.join(', ')}
    Distance to Campus: ${attributes.distance} meters
    
    Make it appealing to university students, highlighting safety, comfort, and proximity to campus. Keep it under 150 words.`;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://kibabiinest.com",
          "X-Title": "Kibabii Nest"
        },
        body: JSON.stringify({
          "model": "google/gemini-2.0-flash-exp:free",
          "messages": [{ "role": "user", "content": prompt }]
        })
      });

      const data: any = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenRouter Error:', error);
      throw new InternalServerErrorException('Failed to generate AI description');
    }
  }

  async findAllLandlord(landlordId: string) {
    const properties = await this.prisma.property.findMany({
      where: { landlordId },
      include: {
        category: true,
        units: { 
          include: { 
            type: true,
            bookings: { where: { status: { in: ['APPROVED', 'PENDING'] } } },
            tenancies: {
              where: { status: { in: ['ACTIVE', 'NOTICE_GIVEN', 'BREAK_HOLD'] } }
            }
          } 
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return properties.map(prop => {
      const unitsWithOccupancy = prop.units.map(u => {
        const activeTenancies = (u as any).tenancies || [];
        const pendingBookings = u.bookings.filter(b => b.status === 'PENDING');
        const occupiedCount = activeTenancies.length + pendingBookings.length;
        return {
          ...u,
          tenancies: undefined,
          occupiedCount,
          isFull: occupiedCount >= u.totalUnits,
          hasDiscount: u.upfrontDiscountPct > 0
        };
      });
      const isFullyOccupied = unitsWithOccupancy.length > 0 && unitsWithOccupancy.every(u => u.isFull);
      const hasDiscount = unitsWithOccupancy.some(u => u.hasDiscount);
      const maxDiscount = Math.max(0, ...unitsWithOccupancy.map(u => u.upfrontDiscountPct || 0));
      const prices = unitsWithOccupancy.map(u => u.price);
      const minPrice = prices.length ? Math.min(...prices) : 0;

      return {
        ...prop,
        units: unitsWithOccupancy,
        isFullyOccupied,
        hasDiscount,
        maxDiscount,
        price: minPrice
      };
    });
  }

  async getLandlordStats(landlordId: string) {
    const totalProperties = await this.prisma.property.count({ where: { landlordId } });

    const activeTenantsCount = await this.prisma.tenancy.count({
      where: {
        propertyUnit: { property: { landlordId } },
        status: { in: ['ACTIVE', 'BREAK_HOLD', 'NOTICE_GIVEN'] }
      }
    });

    const activeBookingsCount = await this.prisma.booking.count({
      where: {
        propertyUnit: { property: { landlordId } },
        status: 'APPROVED',
      },
    });

    const pendingRequestsCount = await this.prisma.booking.count({
      where: {
        propertyUnit: { property: { landlordId } },
        status: 'PENDING',
      },
    });

    // 1. Calculate Total Earnings from all verified payments
    const payments = await this.prisma.payment.findMany({
      where: {
        tenancy: { propertyUnit: { property: { landlordId } } },
        status: { in: ['PAID', 'VERIFIED'] }
      },
      select: { amountPaid: true }
    });
    const totalEarnings = payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);

    // 2. Calculate Total Withdrawals
    const withdrawals = await this.prisma.withdrawal.findMany({
      where: { landlordId, status: 'PROCESSED' },
      select: { amount: true }
    });
    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

    // 3. Expected Balance
    const expectedBalance = Math.max(0, totalEarnings - totalWithdrawn);

    // 4. Fetch current balance and sync if necessary
    const user = await this.prisma.user.findUnique({
      where: { id: landlordId },
      select: { balance: true }
    });

    let currentBalance = user?.balance ?? 0;
    if (Math.abs(currentBalance - expectedBalance) > 0.01) {
      console.log(`[SYNC] Syncing landlord ${landlordId} balance: ${currentBalance} -> ${expectedBalance}`);
      await this.prisma.user.update({
        where: { id: landlordId },
        data: { balance: expectedBalance }
      });
      currentBalance = expectedBalance;
    }
    
    const pendingPaymentsCount = await this.prisma.payment.count({
      where: {
        tenancy: { propertyUnit: { property: { landlordId } } },
        status: 'PENDING'
      }
    });

    return {
      totalEarnings,
      balance: currentBalance,
      activeTenantsCount: Number(activeTenantsCount || 0),
      activeBookingsCount: Number(activeBookingsCount || 0),
      pendingRequestsCount: Number(pendingRequestsCount || 0),
      pendingPaymentsCount: Number(pendingPaymentsCount || 0),
      totalProperties: Number(totalProperties || 0),
    };
  }

  async findAllAdmin(filters: { search?: string; verified?: boolean; page?: number; limit?: number } = {}) {
    const { search, verified, page = 1, limit = 50 } = filters;

    const where: any = {};
    if (verified !== undefined) where.verified = verified;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { landlord: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        include: {
          landlord: { select: { id: true, name: true, email: true, isVerifiedLandlord: true } },
          category: true,
          units: { include: { type: true } },
          _count: { select: { reviews: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.property.count({ where }),
    ]);

    return { properties, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAdminStats() {
    const totalUsers = await this.prisma.user.count();
    const totalProperties = await this.prisma.property.count();
    const verifiedProperties = await this.prisma.property.count({ where: { verified: true } });
    const totalBookings = await this.prisma.booking.count();
    
    const revenuePayments = await this.prisma.payment.findMany({
      where: { status: { in: ['PAID', 'VERIFIED'] } }
    });
    const totalRevenue = revenuePayments.reduce((sum, p) => sum + p.amountPaid, 0);

    const activeTenancies = await this.prisma.tenancy.count({
      where: { status: { in: ['ACTIVE', 'BREAK_HOLD', 'NOTICE_GIVEN'] } }
    });

    return {
      totalUsers,
      totalProperties,
      verifiedProperties,
      totalBookings,
      totalRevenue,
      activeTenancies,
    };
  }

  async verifyProperty(id: string, status: boolean) {
    return this.prisma.property.update({
      where: { id },
      data: { verified: status },
    });
  }
  async remove(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        units: {
          include: {
            tenancies: {
              where: { status: { in: ['ACTIVE', 'BREAK_HOLD', 'NOTICE_GIVEN'] } }
            }
          }
        }
      }
    });

    if (!property) throw new NotFoundException('Property not found');

    const hasActiveTenancies = property.units.some(u => u.tenancies.length > 0);
    if (hasActiveTenancies) {
      throw new InternalServerErrorException('Cannot delete property with active tenancies. Please vacate all units first.');
    }

    return this.prisma.property.delete({
      where: { id }
    });
  }
}
