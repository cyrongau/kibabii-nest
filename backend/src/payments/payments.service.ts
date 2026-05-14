import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentRecordStatus, TransactionType, TransactionStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { S3Service } from '../uploads/s3.service';
import { callOpenRouter, parseAIJson } from '../common/ai-utils';
import axios from 'axios';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notifications: NotificationsService,
    private s3Service: S3Service
  ) {}

  /**
   * Generate monthly payment records for all active/break-hold tenancies.
   * Called by cron on the 1st of each month.
   */
  async generateMonthlyPayments() {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();

    const tenancies = await this.prisma.tenancy.findMany({
      where: { status: { in: ['ACTIVE', 'BREAK_HOLD', 'NOTICE_GIVEN'] } }
    });

    let created = 0;
    for (const t of tenancies) {
      // Check if payment already exists for this month
      const existing = await this.prisma.payment.findFirst({
        where: { tenancyId: t.id, month, year }
      });
      if (existing) continue;

      // Calculate rent amount
      let amountDue = t.monthlyRent;
      if (t.status === 'BREAK_HOLD' && t.breakPeriodEnabled) {
        // Check if current month is within break period
        if (month >= t.breakPeriodStart && month <= t.breakPeriodEnd) {
          amountDue = t.monthlyRent * (t.breakPeriodRentPct / 100);
        }
      }

      // Calculate due date
      const dueDate = new Date(year, month - 1, t.paymentDeadlineDay);

      await this.prisma.payment.create({
        data: {
          tenancyId: t.id,
          month,
          year,
          amountDue,
          dueDate,
          status: PaymentRecordStatus.PENDING,
        }
      });
      created++;
    }

    this.logger.log(`Generated ${created} payment records for ${month}/${year}`);
    return { created, month, year };
  }

  /**
   * Detect overdue payments and calculate penalties.
   * Called daily by cron.
   */
  async processOverduePayments() {
    const now = new Date();

    const overduePayments = await this.prisma.payment.findMany({
      where: {
        status: PaymentRecordStatus.PENDING,
        dueDate: { lt: now }
      },
      include: { tenancy: true }
    });

    let processed = 0;
    for (const p of overduePayments) {
      if (!p.dueDate || !p.tenancy) continue;
      const daysLate = Math.floor((now.getTime() - p.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const penalty = p.tenancy.latePenaltyPerDay * daysLate;

      await this.prisma.payment.update({
        where: { id: p.id },
        data: {
          status: PaymentRecordStatus.OVERDUE,
          penaltyAmount: penalty,
        }
      });
      processed++;
    }

    this.logger.log(`Processed ${processed} overdue payments`);
    return { processed };
  }

  /**
   * Submit a manual payment receipt with optional SMS text for AI scanning.
   */
  async submitReceipt(paymentId: string, data: { fileUrl?: string; rawText?: string }) {
    const payment = await this.prisma.payment.findUnique({ 
      where: { id: paymentId },
      include: {
        tenancy: { include: { propertyUnit: { include: { property: true } } } },
        booking: { include: { propertyUnit: { include: { property: true } } } }
      }
    });
    if (!payment) throw new NotFoundException('Payment not found');

    // AI-scan the receipt
    let aiData: any = {};
    if (data.fileUrl || data.rawText) {
      aiData = await this.scanReceiptWithAI(data.fileUrl, data.rawText);
    }

    // Validate amount if extracted by AI
    const totalDue = payment.amountDue - (payment.discountAmount || 0) + (payment.penaltyAmount || 0);
    if (aiData.amount !== null && aiData.amount < totalDue) {
      this.logger.warn(`Insufficient payment proof: extracted Ksh ${aiData.amount}, expected Ksh ${totalDue}`);
      throw new BadRequestException('Amount paid not sufficient');
    }

    const receipt = await this.prisma.paymentReceipt.upsert({
      where: { paymentId },
      create: {
        paymentId,
        fileUrl: data.fileUrl || '',
        rawText: data.rawText,
        aiTransactionId: aiData.transactionId,
        aiAmount: aiData.amount,
        aiDate: aiData.date,
        aiSenderName: aiData.senderName,
        aiSenderPhone: aiData.senderPhone,
        aiConfidence: aiData.confidence,
        aiRawResponse: aiData.rawResponse,
      },
      update: {
        fileUrl: data.fileUrl || '',
        rawText: data.rawText,
        aiTransactionId: aiData.transactionId,
        aiAmount: aiData.amount,
        aiDate: aiData.date,
        aiSenderName: aiData.senderName,
        aiSenderPhone: aiData.senderPhone,
        aiConfidence: aiData.confidence,
        aiRawResponse: aiData.rawResponse,
      }
    });

    // Update payment status to SUBMITTED
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentRecordStatus.SUBMITTED }
    });

    // Notify Landlord
    const landlordId = payment.tenancy?.propertyUnit?.property?.landlordId || payment.booking?.propertyUnit?.property?.landlordId;
    if (landlordId) {
      await this.notifications.sendNotification(landlordId, 
        'Payment Verification Required',
        `A manual payment has been submitted for ${payment.tenancy ? 'Rent' : 'Booking'}. Please verify the receipt.`,
        'PAYMENT',
        '/management/payments'
      );
    }

    return receipt;
  }

  /**
   * High-level creation of manual payment (from mobile)
   */
  async createManualPayment(userId: string, data: any) {
    const { bookingId, amount, method, reference, rawData, fileUrl, paymentId: providedPaymentId } = data;
    
    let paymentId = providedPaymentId;

    if (!paymentId && bookingId) {
      const existing = await this.prisma.payment.findUnique({ where: { bookingId } });
      if (existing) {
        paymentId = existing.id;
      } else {
        const p = await this.prisma.payment.create({
          data: {
            bookingId,
            amountDue: parseFloat(amount) || 0,
            status: PaymentRecordStatus.PENDING,
          }
        });
        paymentId = p.id;
      }
    }

    if (!paymentId) throw new BadRequestException('Payment ID or Booking ID required');

    return this.submitReceipt(paymentId, { fileUrl, rawText: rawData });
  }

  /**
   * Landlord verifies (approves) a submitted payment.
   */
  async verifyPayment(paymentId: string, approved: boolean) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { 
        receipt: true,
        tenancy: {
          include: {
            tenant: { select: { id: true, name: true } },
            propertyUnit: {
              include: { property: true }
            }
          }
        },
        booking: {
          include: {
            student: { select: { id: true, name: true } },
            propertyUnit: {
              include: { property: true }
            }
          }
        }
      }
    });
    if (!payment) throw new NotFoundException('Payment not found');

    const userId = payment.tenancy?.tenant?.id || payment.booking?.student?.id;
    if (!userId) throw new BadRequestException('Recipient user not found');

    if (approved) {
      const amountPaid = payment.receipt?.aiAmount || payment.amountDue;
      const landlordId = payment.tenancy?.propertyUnit?.property?.landlordId || payment.booking?.propertyUnit?.property?.landlordId;
      
      if (!landlordId) throw new BadRequestException('Tenancy or property details missing');

      await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentRecordStatus.VERIFIED,
            amountPaid,
            paidDate: new Date(),
          }
        }),
        this.prisma.paymentReceipt.update({
          where: { paymentId },
          data: { verified: true, verifiedAt: new Date() }
        }),
        this.prisma.user.update({
          where: { id: landlordId },
          data: { balance: { increment: amountPaid } }
        })
      ]);

      // Notify User
      await this.notifications.sendNotification(userId, 
        'Payment Verified',
        `Your payment of Ksh ${amountPaid} has been successfully verified.`,
        'PAYMENT',
        payment.bookingId ? '/bookings' : '/residency/tenancy'
      );
    } else {
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: PaymentRecordStatus.REJECTED }
      });

      // Notify User
      await this.notifications.sendNotification(userId, 
        'Payment Rejected',
        `Your payment receipt was rejected. Please contact your landlord or re-upload a clear receipt.`,
        'PAYMENT',
        payment.bookingId ? '/bookings' : '/residency/tenancy'
      );
    }

    return { success: true, status: approved ? 'VERIFIED' : 'REJECTED' };
  }

  /**
   * Apply upfront discount for multi-month advance payments.
   */
  async payUpfront(tenancyId: string, months: number) {
    const tenancy = await this.prisma.tenancy.findUnique({ 
      where: { id: tenancyId },
      include: { propertyUnit: { include: { property: true } } }
    });
    if (!tenancy) throw new NotFoundException('Tenancy not found');
    
    const landlordId = tenancy.propertyUnit.property.landlordId;
    const now = new Date();
    const payments: any[] = [];

    for (let i = 0; i < months; i++) {
      const payMonth = ((now.getMonth() + i) % 12) + 1;
      const payYear = now.getFullYear() + Math.floor((now.getMonth() + i) / 12);

      // Check if already exists
      const existing = await this.prisma.payment.findFirst({
        where: { tenancyId, month: payMonth, year: payYear }
      });
      if (existing) continue;

      let amountDue = tenancy.monthlyRent;
      // Apply break period reduction if applicable
      if (tenancy.breakPeriodEnabled && payMonth >= tenancy.breakPeriodStart && payMonth <= tenancy.breakPeriodEnd) {
        amountDue = tenancy.monthlyRent * (tenancy.breakPeriodRentPct / 100);
      }

      const discount = amountDue * (tenancy.upfrontDiscountPct / 100);
      const dueDate = new Date(payYear, payMonth - 1, tenancy.paymentDeadlineDay);

      const payment = await this.prisma.payment.create({
        data: {
          tenancyId,
          month: payMonth,
          year: payYear,
          amountDue,
          discountAmount: discount,
          amountPaid: amountDue - discount,
          dueDate,
          paidDate: new Date(),
          status: PaymentRecordStatus.PAID,
        }
      });
      payments.push(payment);
    }

    if (payments.length > 0) {
      const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
      await this.prisma.user.update({
        where: { id: landlordId },
        data: { balance: { increment: totalPaid } }
      });
    }

    return { payments, totalDiscount: payments.reduce((s: number, p: any) => s + p.discountAmount, 0) };
  }

  /**
   * M-Pesa STK Push initiation.
   */
  async initiateMpesa(id: string, phoneNumber: string, type: 'payment' | 'wallet' = 'payment') {
    let amount = 0;
    let description = '';
    let accountRef = '';

    this.logger.log(`[MPESA] Initiating ${type} push for ID: ${id}, Phone: ${phoneNumber}`);

    if (type === 'payment') {
      let payment = await this.prisma.payment.findUnique({
        where: { id },
        include: { tenancy: true, booking: true }
      });

      if (!payment) {
        const booking = await this.prisma.booking.findUnique({
          where: { id },
          include: { propertyUnit: true }
        });
        if (booking) {
          payment = await this.prisma.payment.create({
            data: {
              bookingId: booking.id,
              amountDue: booking.amount,
              status: 'PENDING',
            },
            include: { tenancy: true, booking: true }
          });
        } else {
          this.logger.error(`[MPESA] Payment or Booking not found for ID: ${id}`);
          throw new NotFoundException('Payment or Booking not found');
        }
      }
      amount = Math.ceil(payment.amountDue - (payment.discountAmount || 0) + (payment.penaltyAmount || 0));
      description = payment.bookingId ? `Booking for ${payment.bookingId}` : `Rent ${payment.month}/${payment.year}`;
      accountRef = `KNEST-PAY-${payment.id.substring(0, 8).toUpperCase()}`;
    } else {
      const tx = await this.prisma.walletTransaction.findUnique({ where: { id } });
      if (!tx) {
        this.logger.error(`[MPESA] Wallet transaction not found for ID: ${id}`);
        throw new NotFoundException('Wallet transaction not found');
      }
      amount = Math.ceil(tx.amount);
      description = `Wallet Topup: ${tx.id.substring(0, 8)}`;
      accountRef = `KNEST-WAL-${tx.id.substring(0, 8).toUpperCase()}`;
    }

    const config = await this.prisma.systemConfig.findUnique({ where: { id: 'default' } });
    if (!config?.mpesaConsumerKey || !config?.mpesaConsumerSecret || !config?.mpesaShortcode || !config?.mpesaPasskey) {
      this.logger.error('[MPESA] Missing configuration in SystemConfig');
      throw new BadRequestException('M-Pesa is not configured. Please contact the administrator.');
    }

    try {
      // Step 1: Get OAuth token
      const authString = Buffer.from(`${config.mpesaConsumerKey}:${config.mpesaConsumerSecret}`).toString('base64');
      const baseUrl = config.mpesaEnvironment === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke';

      this.logger.log(`[MPESA] Fetching OAuth token from ${baseUrl}`);
      const tokenRes = await axios.get(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: { Authorization: `Basic ${authString}` }
      });
      const accessToken = tokenRes.data.access_token;

      // Step 2: STK Push
      const timestamp = new Date().toISOString().replace(/[-T:\.Z]/g, '').substring(0, 14);
      const password = Buffer.from(`${config.mpesaShortcode}${config.mpesaPasskey}${timestamp}`).toString('base64');

      const payload = {
        BusinessShortCode: config.mpesaShortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber.startsWith('0') ? `254${phoneNumber.substring(1)}` : phoneNumber,
        PartyB: config.mpesaShortcode,
        PhoneNumber: phoneNumber.startsWith('0') ? `254${phoneNumber.substring(1)}` : phoneNumber,
        CallBackURL: config.mpesaCallbackUrl || `${process.env.APP_URL || 'http://localhost:3000'}/payments/mpesa/callback`,
        AccountReference: accountRef,
        TransactionDesc: description,
      };

      const { Password, ...safePayload } = payload;
      this.logger.log(`[MPESA] STK Push Payload: ${JSON.stringify(safePayload)}`);

      const stkRes = await axios.post(`${baseUrl}/mpesa/stkpush/v1/processrequest`, payload, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      this.logger.log(`[MPESA] STK Push Response: ${JSON.stringify(stkRes.data)}`);

      // Update record with checkout request ID
      if (type === 'payment') {
        await this.prisma.payment.update({
          where: { id },
          data: { mpesaCheckoutRequestId: stkRes.data.CheckoutRequestID }
        });
      } else {
        await this.prisma.walletTransaction.update({
          where: { id },
          data: { mpesaCheckoutRequestId: stkRes.data.CheckoutRequestID }
        });
      }

      return {
        success: true,
        checkoutRequestID: stkRes.data.CheckoutRequestID,
        merchantRequestID: stkRes.data.MerchantRequestID,
        message: 'STK Push sent. Please check your phone to complete the payment.',
      };
    } catch (error: any) {
      const errorData = error.response?.data;
      const status = error.response?.status;
      this.logger.error(`[MPESA] Error Status: ${status}`);
      this.logger.error(`[MPESA] Error Data: ${JSON.stringify(errorData || error.message)}`);
      
      if (status === 400 && errorData?.errorMessage?.includes('BusinessShortCode')) {
        this.logger.error('[MPESA] Hint: Check if BusinessShortCode and PartyB match and are valid for the environment.');
      }

      throw new BadRequestException(`M-Pesa payment failed: ${errorData?.errorMessage || error.message}`);
    }
  }

  /**
   * High-level wallet topup initiation
   */
  async initiateWalletTopup(userId: string, amount: number, phoneNumber: string) {
    // 1. Create a pending transaction in wallet
    const walletTx = await this.prisma.walletTransaction.create({
      data: {
        userId,
        amount,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.PENDING,
        description: 'M-Pesa Wallet Top-up',
      }
    });

    // 2. Initiate M-Pesa
    return this.initiateMpesa(walletTx.id, phoneNumber, 'wallet');
  }


  /**
   * M-Pesa callback handler.
   */
  async handleMpesaCallback(data: any) {
    const body = data.Body?.stkCallback;
    if (!body) return;

    const resultCode = body.ResultCode;
    const metadata = body.CallbackMetadata?.Item || [];

    const getItem = (name: string) => metadata.find((m: any) => m.Name === name)?.Value;

    if (resultCode === 0) {
      const receiptNumber = getItem('MpesaReceiptNumber');
      const amount = getItem('Amount');
      const phone = getItem('PhoneNumber')?.toString();
      const transactionDate = getItem('TransactionDate')?.toString();

      // Find the payment by the account reference in the callback
      const checkoutRequestID = body.CheckoutRequestID;
      
      this.logger.log(`M-Pesa callback: Receipt ${receiptNumber}, Amount ${amount}, ID ${checkoutRequestID}`);

      if (receiptNumber && amount && checkoutRequestID) {
        // Try finding a Rent/Booking payment first
        const payment = await this.prisma.payment.findUnique({
          where: { mpesaCheckoutRequestId: checkoutRequestID },
          include: { 
            tenancy: { include: { propertyUnit: { include: { property: true } } } },
            booking: { include: { propertyUnit: { include: { property: true } } } }
          }
        });
        
        if (payment) {
          if (payment.status === PaymentRecordStatus.PENDING) {
            const amountPaid = parseFloat(amount);
            let landlordId: string | undefined;
            
            if (payment.tenancy) {
              landlordId = payment.tenancy.propertyUnit.property.landlordId;
            } else if (payment.booking) {
              landlordId = payment.booking.propertyUnit.property.landlordId;
            }

            await this.prisma.$transaction([
              this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                  status: PaymentRecordStatus.PAID,
                  amountPaid,
                  paidDate: new Date(),
                  mpesaReceiptNumber: receiptNumber,
                  mpesaTransactionDate: transactionDate ? new Date(transactionDate) : new Date(),
                  mpesaPhoneNumber: phone,
                }
              }),
              ...(landlordId ? [
                this.prisma.user.update({
                  where: { id: landlordId },
                  data: { balance: { increment: amountPaid } }
                })
              ] : [])
            ]);
          }
          return;
        }

        // If not a payment, check if it's a wallet top-up
        const walletTx = await this.prisma.walletTransaction.findUnique({
          where: { mpesaCheckoutRequestId: checkoutRequestID }
        });

        if (walletTx && walletTx.status === 'PENDING') {
          const amountPaid = parseFloat(amount);
          await this.prisma.$transaction([
            this.prisma.walletTransaction.update({
              where: { id: walletTx.id },
              data: {
                status: 'COMPLETED',
                reference: receiptNumber,
                description: `M-Pesa Topup - ${receiptNumber}`,
                metadata: {
                  phone,
                  mpesaDate: transactionDate,
                  amount: amountPaid
                }
              }
            }),
            this.prisma.user.update({
              where: { id: walletTx.userId },
              data: { balance: { increment: amountPaid } }
            })
          ]);
        }
      }
    } else {
      this.logger.warn(`M-Pesa payment failed: ${body.ResultDesc}`);
    }
  }

  /**
   * AI-scan a receipt image or SMS text.
   */
  private async scanReceiptWithAI(fileUrl?: string, rawText?: string) {
    try {
      const content: any[] = [
        {
          type: 'text',
          text: `Analyze this payment receipt/transaction record and extract the following details.
          
          Return ONLY a valid JSON object:
          {
            "transactionId": "the transaction/receipt ID or reference number",
            "amount": number (numeric value only, no currency symbols),
            "date": "transaction date in YYYY-MM-DD format",
            "senderName": "name of person who made the payment",
            "senderPhone": "phone number if available",
            "confidence": number (0 to 1, how confident are you in the extraction)
          }
          
          If any value is missing, use null for strings and 0 for numbers.`
        }
      ];

      if (rawText) {
        content[0].text += `\n\nHere is the SMS/text to analyze:\n${rawText}`;
      }

      if (fileUrl) {
        let base64File = '';
        try {
          // Attempt to fetch file as base64 string
          base64File = await this.s3Service.getFileBase64(fileUrl);
        } catch (e: any) {
          this.logger.error('Failed to fetch image base64 from S3 proxy', e.message);
        }

        if (base64File) {
          // Assume common mime types, or derive from extension if needed. Default to jpeg.
          let mimeType = 'image/jpeg';
          if (fileUrl.toLowerCase().endsWith('.png')) mimeType = 'image/png';
          if (fileUrl.toLowerCase().endsWith('.webp')) mimeType = 'image/webp';
          if (fileUrl.toLowerCase().endsWith('.pdf')) mimeType = 'application/pdf';

          content.push({
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64File}` }
          });
        }
      }

      const rawResponse = await callOpenRouter(content, { responseFormat: 'json_object' });
      const parsed = parseAIJson<any>(rawResponse) || {};

      return {
        transactionId: parsed?.transactionId || null,
        amount: (parsed?.amount !== undefined && parsed?.amount !== null) ? Number(parsed.amount) : null,
        date: parsed?.date || null,
        senderName: parsed?.senderName || null,
        senderPhone: parsed?.senderPhone || null,
        confidence: parsed?.confidence || 0,
        rawResponse: rawResponse,
      };
    } catch (error: any) {
      this.logger.error('AI Receipt Scan Error:', error.message);
      return { rawResponse: error.message };
    }
  }

  /**
   * Get payments for a tenancy.
   */
  async findByTenancy(tenancyId: string) {
    return this.prisma.payment.findMany({
      where: { tenancyId },
      include: { receipt: true },
      orderBy: { dueDate: 'desc' }
    });
  }

  /**
   * Get all payments for a landlord's tenancies.
   */
  async findByLandlord(landlordId: string) {
    return this.prisma.payment.findMany({
      where: {
        tenancy: {
          propertyUnit: { property: { landlordId } }
        }
      },
      include: {
        receipt: true,
        tenancy: {
          include: {
            tenant: { select: { name: true, email: true, phone: true } },
            propertyUnit: { include: { property: { select: { name: true } }, type: true } }
          }
        }
      },
      orderBy: { dueDate: 'desc' }
    });
  }

  /**
   * Get finance summary for landlord dashboard.
   */
  async getLandlordFinanceSummary(landlordId: string) {
    const allPayments = await this.prisma.payment.findMany({
      where: {
        tenancy: { propertyUnit: { property: { landlordId } } }
      }
    });

    const now = new Date();
    const thisMonth = now.getMonth() + 1;
    const thisYear = now.getFullYear();

    const totalRevenue = allPayments.filter(p => p.status === 'PAID' || p.status === 'VERIFIED')
      .reduce((sum, p) => sum + p.amountPaid, 0);
    
    const thisMonthRevenue = allPayments
      .filter(p => (p.status === 'PAID' || p.status === 'VERIFIED') && p.month === thisMonth && p.year === thisYear)
      .reduce((sum, p) => sum + p.amountPaid, 0);

    const overdueAmount = allPayments
      .filter(p => p.status === 'OVERDUE')
      .reduce((sum, p) => sum + p.amountDue + p.penaltyAmount, 0);

    const pendingCount = allPayments.filter(p => p.status === 'PENDING').length;
    const overdueCount = allPayments.filter(p => p.status === 'OVERDUE').length;
    const submittedCount = allPayments.filter(p => p.status === 'SUBMITTED').length;

    return {
      totalRevenue,
      thisMonthRevenue,
      overdueAmount,
      pendingCount,
      overdueCount,
      submittedCount,
    };
  }

  async payWithWallet(paymentId: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { 
        tenancy: { include: { propertyUnit: { include: { property: true } } } },
        booking: { include: { propertyUnit: { include: { property: true } } } }
      }
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== PaymentRecordStatus.PENDING) throw new BadRequestException('Payment is already processed');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true }
    });

    const amountToPay = payment.amountDue - payment.discountAmount + payment.penaltyAmount;

    if (!user || user.balance < amountToPay) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    let landlordId: string | undefined;
    if (payment.tenancy) {
      landlordId = payment.tenancy.propertyUnit.property.landlordId;
    } else if (payment.booking) {
      landlordId = payment.booking.propertyUnit.property.landlordId;
    }

    return this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { balance: { decrement: amountToPay } }
      }),
      this.prisma.walletTransaction.create({
        data: {
          userId,
          amount: -amountToPay,
          type: TransactionType.TRANSFER,
          status: TransactionStatus.COMPLETED,
          description: `Rent payment for ${payment.month}/${payment.year}`,
          reference: `PAY-WAL-${payment.id}`
        }
      }),
      this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentRecordStatus.PAID,
          amountPaid: amountToPay,
          paidDate: new Date(),
          mpesaReceiptNumber: `WALLET-${Date.now()}`,
        }
      }),
      ...(landlordId ? [
        this.prisma.user.update({
          where: { id: landlordId },
          data: { balance: { increment: amountToPay } }
        }),
        this.prisma.walletTransaction.create({
          data: {
            userId: landlordId,
            amount: amountToPay,
            type: TransactionType.TRANSFER,
            status: TransactionStatus.COMPLETED,
            description: `Rent payment received from tenant`,
            reference: `REC-WAL-${payment.id}`
          }
        })
      ] : [])
    ]);
  }

  /**
   * Get all payments for a student/user across all their tenancies.
   */
  async findHistoryByUser(userId: string) {
    return this.prisma.payment.findMany({
      where: {
        tenancy: { tenantId: userId }
      },
      include: {
        receipt: true,
        tenancy: {
          include: {
            propertyUnit: { include: { property: { select: { name: true } }, type: true } }
          }
        }
      },
      orderBy: { dueDate: 'desc' }
    });
  }

  /**
   * Get global finance summary for admin dashboard.
   */
  async getAdminFinanceSummary() {
    const allPayments = await this.prisma.payment.findMany();

    const totalRevenue = allPayments
      .filter(p => p.status === 'PAID' || p.status === 'VERIFIED')
      .reduce((sum, p) => sum + p.amountPaid, 0);
    
    const overdueAmount = allPayments
      .filter(p => p.status === 'OVERDUE')
      .reduce((sum, p) => sum + p.amountDue + p.penaltyAmount, 0);

    const pendingCount = allPayments.filter(p => p.status === 'PENDING').length;
    const overdueCount = allPayments.filter(p => p.status === 'OVERDUE').length;
    const submittedCount = allPayments.filter(p => p.status === 'SUBMITTED').length;

    return {
      totalRevenue,
      overdueAmount,
      pendingCount,
      overdueCount,
      submittedCount,
    };
  }

  /**
   * Get all payments on the platform (Admin history).
   */
  async findAllAdmin() {
    return this.prisma.payment.findMany({
      include: {
        receipt: true,
        tenancy: {
          include: {
            tenant: { select: { name: true, email: true, phone: true } },
            propertyUnit: { include: { property: { select: { name: true } }, type: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Query M-Pesa STK Push status.
   */
  async queryMpesaStatus(checkoutRequestID: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { mpesaCheckoutRequestId: checkoutRequestID }
    });

    if (payment) {
      if (payment.status === PaymentRecordStatus.PAID) {
        return { success: true, status: 'PAID', mpesaReceiptNumber: payment.mpesaReceiptNumber };
      }
    } else {
      const walletTx = await this.prisma.walletTransaction.findUnique({
        where: { mpesaCheckoutRequestId: checkoutRequestID }
      });
      if (walletTx && walletTx.status === 'COMPLETED') {
        return { success: true, status: 'PAID', mpesaReceiptNumber: walletTx.reference };
      }
      if (!walletTx) throw new NotFoundException('Transaction record for this M-Pesa request not found');
    }

    const config = await this.prisma.systemConfig.findUnique({ where: { id: 'default' } });
    if (!config?.mpesaConsumerKey || !config?.mpesaConsumerSecret || !config?.mpesaShortcode || !config?.mpesaPasskey) {
      throw new BadRequestException('M-Pesa is not configured.');
    }

    try {
      // Get OAuth token
      const authString = Buffer.from(`${config.mpesaConsumerKey}:${config.mpesaConsumerSecret}`).toString('base64');
      const baseUrl = config.mpesaEnvironment === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke';

      const tokenRes = await axios.get(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: { Authorization: `Basic ${authString}` }
      });
      const accessToken = tokenRes.data.access_token;

      // Query status
      const timestamp = new Date().toISOString().replace(/[-T:\.Z]/g, '').substring(0, 14);
      const password = Buffer.from(`${config.mpesaShortcode}${config.mpesaPasskey}${timestamp}`).toString('base64');

      const queryRes = await axios.post(`${baseUrl}/mpesa/stkpushquery/v1/query`, {
        BusinessShortCode: config.mpesaShortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID,
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      // If Safaricom says it's success but our DB isn't updated yet (callback delay), we can update here too
      if (queryRes.data.ResultCode === '0') {
        return { success: true, status: 'PAID', message: queryRes.data.ResultDesc };
      }

      return { success: false, status: 'PENDING', message: queryRes.data.ResultDesc };
    } catch (error: any) {
      this.logger.error('M-Pesa status query failed:', error.response?.data || error.message);
      return { success: false, status: 'FAILED', message: error.response?.data?.errorMessage || error.message };
    }
  }
}
