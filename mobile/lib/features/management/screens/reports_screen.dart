import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:intl/intl.dart';
import '../../../services/api_service.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  bool _isExporting = false;
  Map<String, dynamic>? _summary;
  List<dynamic> _payments = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final summary = await _apiService.getLandlordStats();
      final payments = await _apiService.getLandlordPayments();
      
      setState(() {
        _summary = summary;
        _payments = payments;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error loading reports: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _exportAsPDF() async {
    setState(() => _isExporting = true);
    try {
      final pdf = pw.Document();
      final now = DateFormat('yyyy-MM-dd HH:mm').format(DateTime.now());

      pdf.addPage(
        pw.MultiPage(
          build: (pw.Context context) => [
            pw.Header(level: 0, child: pw.Text('Kibabii Nest - Financial Statement', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 24))),
            pw.SizedBox(height: 10),
            pw.Text('Generated on: $now'),
            pw.SizedBox(height: 20),
            pw.Text('Summary', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 18)),
            pw.Divider(),
            pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween, children: [
              pw.Text('Total Earnings:'),
              pw.Text('Ksh ${_summary?['totalEarnings'] ?? 0}', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
            ]),
            pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween, children: [
              pw.Text('Wallet Balance:'),
              pw.Text('Ksh ${_summary?['balance'] ?? 0}', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
            ]),
            pw.SizedBox(height: 30),
            pw.Text('Payment History', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 18)),
            pw.Table.fromTextArray(
              context: context,
              data: <List<String>>[
                <String>['Date', 'Tenant', 'Property', 'Amount', 'Status'],
                ..._payments.map((p) => [
                  p['paidDate'] != null ? DateFormat('MMM dd, yyyy').format(DateTime.parse(p['paidDate'])) : 'N/A',
                  p['tenancy']?['tenant']?['name'] ?? 'N/A',
                  p['tenancy']?['propertyUnit']?['property']?['name'] ?? 'N/A',
                  'Ksh ${p['amountPaid'] ?? p['amountDue'] ?? 0}',
                  p['status']?.toString() ?? 'N/A',
                ]),
              ],
            ),
          ],
        ),
      );

      final output = await getTemporaryDirectory();
      final file = File("${output.path}/statement_${DateTime.now().millisecondsSinceEpoch}.pdf");
      await file.writeAsBytes(await pdf.save());
      
      if (mounted) {
        await Printing.layoutPdf(onLayout: (PdfPageFormat format) async => pdf.save());
      }
    } catch (e) {
      debugPrint('Export Error: $e');
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to export PDF')));
    } finally {
      setState(() => _isExporting = false);
    }
  }

  Future<void> _exportAsCSV() async {
    setState(() => _isExporting = true);
    try {
      String csv = 'Date,Tenant,Property,Amount,Status\n';
      for (var p in _payments) {
        final date = p['paidDate'] != null ? DateFormat('yyyy-MM-dd').format(DateTime.parse(p['paidDate'])) : 'N/A';
        final tenant = p['tenancy']?['tenant']?['name'] ?? 'N/A';
        final property = p['tenancy']?['propertyUnit']?['property']?['name'] ?? 'N/A';
        final amount = p['amountPaid'] ?? p['amountDue'] ?? 0;
        final status = p['status']?.toString() ?? 'N/A';
        csv += '$date,"$tenant","$property",$amount,$status\n';
      }

      final output = await getTemporaryDirectory();
      final file = File("${output.path}/statement_${DateTime.now().millisecondsSinceEpoch}.csv");
      await file.writeAsBytes(csv.codeUnits);
      
      await Share.shareXFiles([XFile(file.path)], text: 'Financial Statement CSV');
    } catch (e) {
      debugPrint('Export Error: $e');
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to export CSV')));
    } finally {
      setState(() => _isExporting = false);
    }
  }

  Future<void> _generateReceipt(Map<String, dynamic> p) async {
    try {
      final pdf = pw.Document();
      final date = p['paidDate'] != null ? DateFormat('MMM dd, yyyy').format(DateTime.parse(p['paidDate'])) : 'N/A';
      final tenant = p['tenancy']?['tenant']?['name'] ?? 'N/A';
      final property = p['tenancy']?['propertyUnit']?['property']?['name'] ?? 'N/A';
      final amount = p['amountPaid'] ?? p['amountDue'] ?? 0;
      final receiptNo = p['mpesaReceiptNumber'] ?? p['id'].toString().substring(0, 8).toUpperCase();

      pdf.addPage(
        pw.Page(
          build: (pw.Context context) => pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('OFFICIAL RECEIPT', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 20)),
                  pw.Text('Kibabii Nest', style: pw.TextStyle(color: PdfColors.blue)),
                ],
              ),
              pw.Divider(),
              pw.SizedBox(height: 20),
              pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween, children: [
                pw.Text('Receipt No:'),
                pw.Text(receiptNo, style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
              ]),
              pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween, children: [
                pw.Text('Date:'),
                pw.Text(date),
              ]),
              pw.SizedBox(height: 20),
              pw.Text('Received From:', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
              pw.Text(tenant),
              pw.SizedBox(height: 10),
              pw.Text('For Property:', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
              pw.Text(property),
              pw.SizedBox(height: 40),
              pw.Container(
                padding: const pw.EdgeInsets.all(20),
                decoration: pw.BoxDecoration(color: PdfColors.grey100),
                child: pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween, children: [
                  pw.Text('TOTAL PAID', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                  pw.Text('Ksh $amount', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 18)),
                ]),
              ),
              pw.Spacer(),
              pw.Center(child: pw.Text('Thank you for choosing Kibabii Nest', style: const pw.TextStyle(fontSize: 10))),
            ],
          ),
        ),
      );

      await Printing.layoutPdf(onLayout: (PdfPageFormat format) async => pdf.save());
    } catch (e) {
      debugPrint('Receipt Gen Error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: colorScheme.background,
      appBar: AppBar(
        title: Text('Financial Reports', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: _isExporting 
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
              : const Icon(LucideIcons.download),
            onPressed: _isExporting ? null : () => _showExportOptions(),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildRevenueCard(colorScheme, isDark),
                    const SizedBox(height: 32),
                    _buildStatsGrid(colorScheme, isDark),
                    const SizedBox(height: 32),
                    Text('Payment History', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onBackground)),
                    const SizedBox(height: 16),
                    _payments.isEmpty
                        ? _buildEmptyPayments(colorScheme)
                        : ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: _payments.length,
                            separatorBuilder: (context, index) => const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final p = _payments[index];
                              return GestureDetector(
                                onTap: () => _generateReceipt(p),
                                child: _buildPaymentTile(p, colorScheme),
                              );
                            },
                          ),
                    const SizedBox(height: 40), // SafeArea padding
                  ],
                ),
              ),
            ),
    );
  }

  void _showExportOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Export Statement', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),
            ListTile(
              leading: const Icon(LucideIcons.fileText, color: Colors.red),
              title: const Text('Export as PDF'),
              onTap: () {
                Navigator.pop(context);
                _exportAsPDF();
              },
            ),
            ListTile(
              leading: const Icon(LucideIcons.fileSpreadsheet, color: Colors.green),
              title: const Text('Export as CSV'),
              onTap: () {
                Navigator.pop(context);
                _exportAsCSV();
              },
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
  Widget _buildRevenueCard(ColorScheme colorScheme, bool isDark) {
    final revenue = _summary?['totalEarnings'] ?? 0;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isDark 
            ? [colorScheme.primary, colorScheme.primary.withOpacity(0.8)]
            : [const Color(0xFF3B82F6), const Color(0xFF2563EB)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(color: colorScheme.primary.withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 10)),
        ],
      ),
      child: Column(
        children: [
          Text('Total Revenue', style: GoogleFonts.outfit(color: Colors.white.withOpacity(0.8), fontWeight: FontWeight.w500)),
          const SizedBox(height: 8),
          Text('Ksh $revenue', style: GoogleFonts.outfit(fontSize: 36, fontWeight: FontWeight.w900, color: Colors.white)),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildMiniStat(LucideIcons.trendingUp, '12%', 'vs last month'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMiniStat(IconData icon, String value, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
      child: Row(
        children: [
          Icon(icon, color: Colors.white, size: 14),
          const SizedBox(width: 8),
          Text(value, style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
          const SizedBox(width: 4),
          Text(label, style: GoogleFonts.outfit(color: Colors.white.withOpacity(0.7), fontSize: 10)),
        ],
      ),
    );
  }

  Widget _buildStatsGrid(ColorScheme colorScheme, bool isDark) {
    return Row(
      children: [
        Expanded(child: _buildSimpleStatCard(colorScheme, 'Occupancy', '${_summary?['activeTenantsCount'] ?? 0}', LucideIcons.users, const Color(0xFF8B5CF6))),
        const SizedBox(width: 16),
        Expanded(child: _buildSimpleStatCard(colorScheme, 'Properties', '${_summary?['totalProperties'] ?? 0}', LucideIcons.home, const Color(0xFFF59E0B))),
      ],
    );
  }

  Widget _buildSimpleStatCard(ColorScheme colorScheme, String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(height: 16),
          Text(value, style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
          Text(label, style: GoogleFonts.outfit(fontSize: 12, color: colorScheme.onSurface.withOpacity(0.5), fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildPaymentTile(Map<String, dynamic> p, ColorScheme colorScheme) {
    final status = p['status']?.toString().toUpperCase() ?? 'PENDING';
    final amount = p['amountPaid'] ?? p['amountDue'] ?? 0;
    final tenant = p['tenancy']?['tenant']?['name'] ?? 'Tenant';
    final property = p['tenancy']?['propertyUnit']?['property']?['name'] ?? 'Property';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: colorScheme.onSurface.withOpacity(0.05), borderRadius: BorderRadius.circular(16)),
            child: Icon(LucideIcons.banknote, color: colorScheme.onSurface.withOpacity(0.5), size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tenant, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
                Text(property, style: GoogleFonts.outfit(fontSize: 12, color: colorScheme.onSurface.withOpacity(0.5))),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('Ksh $amount', style: GoogleFonts.outfit(fontWeight: FontWeight.w900, color: const Color(0xFF10B981))),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: _getStatusColor(status).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(status, style: GoogleFonts.outfit(fontSize: 9, fontWeight: FontWeight.w900, color: _getStatusColor(status))),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'PAID':
      case 'VERIFIED': return const Color(0xFF10B981);
      case 'PENDING': return const Color(0xFFF59E0B);
      case 'OVERDUE': return Colors.redAccent;
      default: return const Color(0xFF64748B);
    }
  }

  Widget _buildEmptyPayments(ColorScheme colorScheme) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          children: [
            Icon(LucideIcons.fileX, size: 48, color: colorScheme.onSurface.withOpacity(0.1)),
            const SizedBox(height: 16),
            Text('No payment records found', style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.5), fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }
}
