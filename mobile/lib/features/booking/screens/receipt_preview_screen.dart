import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';

class ReceiptPreviewScreen extends StatelessWidget {
  final String bookingId;
  final String propertyName;
  final String price;
  final String unitType;
  final String date;

  const ReceiptPreviewScreen({
    super.key,
    required this.bookingId,
    required this.propertyName,
    required this.price,
    required this.unitType,
    required this.date,
  });

  Future<void> _generatePdf(BuildContext context) async {
    final pdf = pw.Document();

    // To include a real QR code in the PDF, we need to generate it as an image
    final qrValidationUrl = 'https://kibabii-nest.com/verify/$bookingId';
    
    // Create a QR painter
    final qrPainter = QrPainter(
      data: qrValidationUrl,
      version: QrVersions.auto,
      gapless: true,
      color: const Color(0xFF1E293B),
      emptyColor: Colors.white,
    );

    // Convert to image bytes
    final ui.Image qrImage = await qrPainter.toImage(300);
    final ByteData? byteData = await qrImage.toByteData(format: ui.ImageByteFormat.png);
    final Uint8List qrBytes = byteData!.buffer.asUint8List();
    final pw.MemoryImage qrMemoryImage = pw.MemoryImage(qrBytes);

    // Load the brand logo
    final ByteData logoData = await rootBundle.load('assets/images/pdf_brand_logo.png');
    final Uint8List logoBytes = logoData.buffer.asUint8List();
    final pw.MemoryImage logoImage = pw.MemoryImage(logoBytes);

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        build: (pw.Context context) {
          return pw.Container(
            padding: const pw.EdgeInsets.all(40),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                // Header with Logo & Title
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Row(
                      children: [
                        pw.Container(
                          width: 40,
                          height: 40,
                          child: pw.Image(logoImage),
                        ),
                        pw.SizedBox(width: 12),
                        pw.Column(
                          crossAxisAlignment: pw.CrossAxisAlignment.start,
                          children: [
                            pw.Text('KIBABII NEST', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 24, color: PdfColors.blue700)),
                            pw.Text('Student Housing Platform', style: pw.TextStyle(fontSize: 10, color: PdfColors.grey700)),
                          ],
                        ),
                      ],
                    ),
                    pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.end,
                      children: [
                        pw.Text('OFFICIAL RECEIPT', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 14, color: PdfColors.grey900)),
                        pw.Text('No: ${bookingId.substring(0, 8).toUpperCase()}', style: pw.TextStyle(fontSize: 10, color: PdfColors.grey700)),
                      ],
                    ),
                  ],
                ),
                pw.SizedBox(height: 40),
                pw.Divider(thickness: 2, color: PdfColors.blue700),
                pw.SizedBox(height: 40),

                // Transaction Details
                pw.Row(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Expanded(
                      child: pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          _buildPdfInfoRow('Property', propertyName),
                          _buildPdfInfoRow('Unit Type', unitType),
                          _buildPdfInfoRow('Payment Date', date.substring(0, 10)),
                          _buildPdfInfoRow('Status', 'VERIFIED'),
                        ],
                      ),
                    ),
                    pw.SizedBox(width: 40),
                    pw.Container(
                      width: 120,
                      height: 120,
                      padding: const pw.EdgeInsets.all(10),
                      decoration: pw.BoxDecoration(
                        border: pw.Border.all(color: PdfColors.grey300),
                        borderRadius: const pw.BorderRadius.all(pw.Radius.circular(8)),
                      ),
                      child: pw.Image(qrMemoryImage),
                    ),
                  ],
                ),
                pw.SizedBox(height: 60),

                // Financial Summary Table
                pw.Table(
                  border: pw.TableBorder.all(color: PdfColors.grey200),
                  children: [
                    pw.TableRow(
                      decoration: pw.BoxDecoration(color: PdfColors.blue50),
                      children: [
                        pw.Padding(padding: const pw.EdgeInsets.all(10), child: pw.Text('Description', style: pw.TextStyle(fontWeight: pw.FontWeight.bold))),
                        pw.Padding(padding: const pw.EdgeInsets.all(10), child: pw.Text('Amount', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontWeight: pw.FontWeight.bold))),
                      ],
                    ),
                    pw.TableRow(
                      children: [
                        pw.Padding(padding: const pw.EdgeInsets.all(10), child: pw.Text('Rent Payment - $propertyName ($unitType)')),
                        pw.Padding(padding: const pw.EdgeInsets.all(10), child: pw.Text('Ksh $price', textAlign: pw.TextAlign.right)),
                      ],
                    ),
                  ],
                ),
                pw.SizedBox(height: 20),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.end,
                  children: [
                    pw.Text('Total Paid: ', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 16)),
                    pw.Text('Ksh $price', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 16, color: PdfColors.blue700)),
                  ],
                ),

                pw.Spacer(),
                pw.Divider(color: PdfColors.grey300),
                pw.SizedBox(height: 10),
                pw.Center(
                  child: pw.Text('This is a computer generated receipt and does not require a physical signature.', style: pw.TextStyle(fontSize: 8, color: PdfColors.grey500)),
                ),
                pw.SizedBox(height: 4),
                pw.Center(
                  child: pw.Text('Verification URL: $qrValidationUrl', style: pw.TextStyle(fontSize: 8, color: PdfColors.blue600)),
                ),
              ],
            ),
          );
        },
      ),
    );

    await Printing.layoutPdf(onLayout: (PdfPageFormat format) async => pdf.save());
  }

  pw.Widget _buildPdfInfoRow(String label, String value) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 4),
      child: pw.Row(
        children: [
          pw.SizedBox(width: 80, child: pw.Text(label, style: pw.TextStyle(color: PdfColors.grey700, fontSize: 10))),
          pw.Text(': ', style: const pw.TextStyle(fontSize: 10)),
          pw.Expanded(child: pw.Text(value, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10))),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: colorScheme.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(LucideIcons.chevronLeft, color: colorScheme.onSurface),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Official Receipt',
          style: GoogleFonts.outfit(color: colorScheme.onSurface, fontWeight: FontWeight.bold),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Container(
              decoration: BoxDecoration(
                color: colorScheme.surface,
                borderRadius: BorderRadius.circular(32),
                boxShadow: isDark ? [] : [
                  BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 40, offset: const Offset(0, 10))
                ],
                border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
              ),
              child: Column(
                children: [
                  // Receipt Header
                  Container(
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(
                      color: colorScheme.primary,
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'KIBABII NEST',
                              style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20, letterSpacing: 1),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Official Digital Receipt',
                              style: GoogleFonts.outfit(color: Colors.white.withOpacity(0.8), fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16)),
                          child: const Icon(LucideIcons.checkCircle, color: Colors.white, size: 28),
                        ),
                      ],
                    ),
                  ),

                  // Receipt Body
                  Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      children: [
                        _buildInfoRow('Receipt No', bookingId.substring(0, 8).toUpperCase(), colorScheme, isPrimary: true),
                        const SizedBox(height: 24),
                        _buildInfoRow('Hostel', propertyName, colorScheme),
                        const SizedBox(height: 16),
                        _buildInfoRow('Unit', unitType, colorScheme),
                        const SizedBox(height: 16),
                        _buildInfoRow('Date', date.substring(0, 10), colorScheme),
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 24),
                          child: Divider(color: colorScheme.onSurface.withOpacity(0.05), thickness: 2),
                        ),
                        _buildInfoRow('Total Paid', 'Ksh $price', colorScheme, isAmount: true),
                        const SizedBox(height: 40),

                        // QR Code Section
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: colorScheme.onSurface.withOpacity(0.02),
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
                          ),
                          child: Column(
                            children: [
                              QrImageView(
                                data: 'https://kibabii-nest.com/verify/$bookingId',
                                version: QrVersions.auto,
                                size: 140.0,
                                foregroundColor: colorScheme.onSurface,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'SECURE VERIFICATION QR',
                                style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: colorScheme.onSurface.withOpacity(0.3), letterSpacing: 2),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
            
            // Action Buttons
            Container(
              width: double.infinity,
              height: 64,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: colorScheme.primary,
                boxShadow: [
                  BoxShadow(color: colorScheme.primary.withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 10))
                ],
              ),
              child: ElevatedButton.icon(
                onPressed: () => _generatePdf(context),
                icon: const Icon(LucideIcons.download, color: Colors.white, size: 20),
                label: Text(
                  'Download PDF Receipt',
                  style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  shadowColor: Colors.transparent,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Digital record verified by Kibabii Nest Housing Platform',
              style: GoogleFonts.outfit(fontSize: 11, color: colorScheme.onSurface.withOpacity(0.3), fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, ColorScheme colorScheme, {bool isPrimary = false, bool isAmount = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.outfit(
            color: colorScheme.onSurface.withOpacity(0.5),
            fontSize: 13,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          value,
          style: GoogleFonts.outfit(
            color: isAmount ? colorScheme.primary : colorScheme.onSurface,
            fontSize: isAmount ? 20 : 14,
            fontWeight: isPrimary || isAmount ? FontWeight.w900 : FontWeight.bold,
          ),
        ),
      ],
    );
  }
}
