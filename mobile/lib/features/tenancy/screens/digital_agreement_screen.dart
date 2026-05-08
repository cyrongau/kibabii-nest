import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../services/api_service.dart';

class DigitalAgreementScreen extends StatelessWidget {
  final Map<String, dynamic> tenancy;

  const DigitalAgreementScreen({super.key, required this.tenancy});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;
    
    final property = tenancy['propertyUnit']?['property'] ?? {};
    final tenant = tenancy['tenant'] ?? {};
    final signedAt = tenancy['signedAt'] != null 
        ? DateTime.tryParse(tenancy['signedAt']) 
        : null;

    return Scaffold(
      backgroundColor: colorScheme.background,
      appBar: AppBar(
        title: Text('Tenancy Agreement', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
        backgroundColor: colorScheme.surface,
        elevation: 0,
        leading: IconButton(
          icon: Icon(LucideIcons.chevronLeft, color: colorScheme.onSurface),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: Icon(LucideIcons.download, color: colorScheme.onSurface),
            onPressed: () async {
              String urlStr = tenancy['agreementUrl'] ?? '';
              if (urlStr == 'signed_digitally_via_mobile') {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Digital agreement export is being processed. PDF download will be available soon.')),
                );
                return;
              }
              if (urlStr.isNotEmpty && urlStr != '#') {
                final api = ApiService();
                if (!urlStr.startsWith('http')) {
                  urlStr = '${api.baseUrl}$urlStr';
                }
                final url = Uri.tryParse(urlStr);
                if (url != null && await canLaunchUrl(url)) {
                  await launchUrl(url, mode: LaunchMode.externalApplication);
                  return;
                }
              }
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Agreement PDF is not available for download yet.')),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            // 1. Certificate Header
            _buildCertificateHeader(colorScheme, isDark),
            const SizedBox(height: 32),

            // 2. Parties Involved
            _buildSectionHeader('Parties Involved', LucideIcons.users, colorScheme),
            const SizedBox(height: 16),
            _buildPartiesCard(tenant, property['landlord'] ?? {'name': 'Property Management'}, colorScheme, isDark),
            const SizedBox(height: 32),

            // 3. Property Details
            _buildSectionHeader('Residence Details', LucideIcons.home, colorScheme),
            const SizedBox(height: 16),
            _buildDetailsCard([
              _DetailRow('Property', property['name'] ?? 'N/A'),
              _DetailRow('Unit Number', tenancy['unitName'] ?? 'N/A'),
              _DetailRow('Address', property['address'] ?? 'N/A'),
              _DetailRow('City', property['city'] ?? 'Bungoma'),
            ], colorScheme, isDark),
            const SizedBox(height: 32),

            // 4. Financial Terms
            _buildSectionHeader('Financial Terms', LucideIcons.banknote, colorScheme),
            const SizedBox(height: 16),
            _buildDetailsCard([
              _DetailRow('Monthly Rent', 'Ksh ${tenancy['monthlyRent']}'),
              _DetailRow('Security Deposit', 'Ksh ${tenancy['depositAmount']}'),
              _DetailRow('Payment Deadline', 'Day ${tenancy['paymentDeadlineDay']} of each month'),
              _DetailRow('Late Penalty', 'Ksh ${tenancy['latePenaltyPerDay']} per day'),
            ], colorScheme, isDark),
            const SizedBox(height: 32),

            // 5. Digital Signature Status
            _buildSignatureStatus(signedAt, colorScheme, isDark),
            
            const SizedBox(height: 40),
            Text(
              'This is a digitally generated agreement protected by Kibabii Nest Secure Protocol. All terms are binding upon signature.',
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(
                fontSize: 12,
                color: colorScheme.onSurface.withOpacity(0.4),
                fontStyle: FontStyle.italic,
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildCertificateHeader(ColorScheme colorScheme, bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: colorScheme.primary.withOpacity(0.05),
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: colorScheme.primary.withOpacity(0.1)),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: colorScheme.primary.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(LucideIcons.scrollText, color: colorScheme.primary, size: 48),
          ),
          const SizedBox(height: 24),
          Text(
            'Digital Tenancy Certificate',
            style: GoogleFonts.outfit(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'ID: ${tenancy['id'].toString().substring(0, 12).toUpperCase()}',
            style: GoogleFonts.outfit(
              fontSize: 14,
              color: colorScheme.onSurface.withOpacity(0.5),
              letterSpacing: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon, ColorScheme colorScheme) {
    return Row(
      children: [
        Icon(icon, size: 20, color: colorScheme.primary),
        const SizedBox(width: 12),
        Text(
          title,
          style: GoogleFonts.outfit(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: colorScheme.onSurface,
          ),
        ),
      ],
    );
  }

  Widget _buildPartiesCard(dynamic tenant, dynamic landlord, ColorScheme colorScheme, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
      ),
      child: Column(
        children: [
          _buildPartyRow('Tenant', tenant['name'] ?? 'N/A', LucideIcons.user, colorScheme),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Divider(),
          ),
          _buildPartyRow('Landlord', landlord['name'] ?? 'Property Management', LucideIcons.building, colorScheme),
        ],
      ),
    );
  }

  Widget _buildPartyRow(String label, String name, IconData icon, ColorScheme colorScheme) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: colorScheme.onSurface.withOpacity(0.05),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, size: 20, color: colorScheme.onSurface.withOpacity(0.5)),
        ),
        const SizedBox(width: 16),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: TextStyle(fontSize: 12, color: colorScheme.onSurface.withOpacity(0.4))),
            Text(name, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
          ],
        ),
      ],
    );
  }

  Widget _buildDetailsCard(List<_DetailRow> rows, ColorScheme colorScheme, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
      ),
      child: Column(
        children: rows.map((row) => Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(row.label, style: TextStyle(color: colorScheme.onSurface.withOpacity(0.5))),
              Text(row.value, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
            ],
          ),
        )).toList(),
      ),
    );
  }

  Widget _buildSignatureStatus(DateTime? signedAt, ColorScheme colorScheme, bool isDark) {
    final isSigned = signedAt != null;
    
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isSigned ? const Color(0xFF10B981).withOpacity(0.1) : Colors.orange.withOpacity(0.1),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: (isSigned ? const Color(0xFF10B981) : Colors.orange).withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Icon(
            isSigned ? LucideIcons.checkCircle2 : LucideIcons.alertCircle,
            color: isSigned ? const Color(0xFF10B981) : Colors.orange,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isSigned ? 'Digitally Signed' : 'Pending Signature',
                  style: GoogleFonts.outfit(
                    fontWeight: FontWeight.bold,
                    color: isSigned ? const Color(0xFF10B981) : Colors.orange,
                  ),
                ),
                if (isSigned)
                  Text(
                    'Signed on ${DateFormat('MMM dd, yyyy • HH:mm').format(signedAt!)}',
                    style: TextStyle(fontSize: 12, color: const Color(0xFF10B981).withOpacity(0.7)),
                  )
                else
                  const Text(
                    'Please sign this agreement to finalize your tenancy.',
                    style: TextStyle(fontSize: 12, color: Colors.orange),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailRow {
  final String label;
  final String value;
  _DetailRow(this.label, this.value);
}
