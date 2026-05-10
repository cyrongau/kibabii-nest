import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:signature/signature.dart';
import '../../../services/api_service.dart';
import '../../../core/widgets/app_modals.dart';

class DigitalAgreementScreen extends StatefulWidget {
  final Map<String, dynamic> tenancy;

  const DigitalAgreementScreen({super.key, required this.tenancy});

  @override
  State<DigitalAgreementScreen> createState() => _DigitalAgreementScreenState();
}

class _DigitalAgreementScreenState extends State<DigitalAgreementScreen> {
  final SignatureController _signatureController = SignatureController(
    penStrokeWidth: 3,
    penColor: const Color(0xFF1E293B),
    exportBackgroundColor: Colors.white,
  );

  bool _isSigning = false;

  @override
  void dispose() {
    _signatureController.dispose();
    super.dispose();
  }

  Future<void> _handleSign() async {
    if (_signatureController.isEmpty) {
      AppModals.showError(
        context: context,
        title: 'Empty Signature',
        message: 'Please provide your signature on the canvas before submitting.',
      );
      return;
    }

    final signatureBytes = await _signatureController.toPngBytes();
    if (signatureBytes == null) return;

    final signatureBase64 = base64Encode(signatureBytes);

    if (!mounted) return;
    AppModals.showLoading(context: context, message: 'Signing agreement...');

    try {
      final api = ApiService();
      final success = await api.signTenancy(widget.tenancy['id'], signatureBase64: signatureBase64);
      
      if (!mounted) return;
      Navigator.pop(context); // Close loading

      if (success) {
        AppModals.showSuccess(
          context: context,
          title: 'Success!',
          message: 'Agreement signed successfully!',
          onConfirm: () => Navigator.pop(context), // Go back to refresh
        );
      } else {
        AppModals.showError(
          context: context,
          title: 'Error',
          message: 'Failed to sign the agreement. Please try again.',
        );
      }
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context); // Close loading
      AppModals.showError(
        context: context,
        title: 'Error',
        message: 'An unexpected error occurred: $e',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;
    
    final property = widget.tenancy['propertyUnit']?['property'] ?? {};
    final tenant = widget.tenancy['tenant'] ?? {};
    final signedAt = widget.tenancy['signedAt'] != null 
        ? DateTime.tryParse(widget.tenancy['signedAt']) 
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
              String urlStr = widget.tenancy['agreementUrl'] ?? '';
              if (urlStr == 'signed_digitally_via_mobile') {
                AppModals.showInfo(
                  context: context,
                  title: 'Processing',
                  message: 'Digital agreement export is being processed. PDF download will be available soon.',
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
              AppModals.showError(
                context: context,
                title: 'Not Available',
                message: 'Agreement PDF is not available for download yet.',
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
              _DetailRow('Unit Number', widget.tenancy['unitName'] ?? 'N/A'),
              _DetailRow('Address', property['address'] ?? 'N/A'),
              _DetailRow('City', property['city'] ?? 'Bungoma'),
            ], colorScheme, isDark),
            const SizedBox(height: 32),

            // 4. Financial Terms
            _buildSectionHeader('Financial Terms', LucideIcons.banknote, colorScheme),
            const SizedBox(height: 16),
            _buildDetailsCard([
              _DetailRow('Monthly Rent', 'Ksh ${widget.tenancy['monthlyRent']}'),
              _DetailRow('Security Deposit', 'Ksh ${widget.tenancy['depositAmount']}'),
              _DetailRow('Payment Deadline', 'Day ${widget.tenancy['paymentDeadlineDay']} of each month'),
              _DetailRow('Late Penalty', 'Ksh ${widget.tenancy['latePenaltyPerDay']} per day'),
            ], colorScheme, isDark),
            const SizedBox(height: 32),

            // 5. Digital Signature Status
            _buildSignatureStatus(signedAt, colorScheme, isDark, context),
            
            const SizedBox(height: 32),

            // 6. Signature Section (The "Signing Place")
            if (signedAt == null) ...[
              _buildSectionHeader('Sign Here', LucideIcons.penTool, colorScheme),
              const SizedBox(height: 16),
              _buildSignaturePad(colorScheme, isDark),
            ] else ...[
              _buildSectionHeader('Official Signatures', LucideIcons.penTool, colorScheme),
              const SizedBox(height: 16),
              _buildSignatureLines(tenant['name'] ?? 'Tenant', property['landlord']?['name'] ?? 'Landlord', signedAt, colorScheme),
            ],

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

  Widget _buildSignaturePad(ColorScheme colorScheme, bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colorScheme.onSurface.withOpacity(0.1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            child: Signature(
              controller: _signatureController,
              height: 200,
              backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: colorScheme.onSurface.withOpacity(0.02),
              borderRadius: const BorderRadius.vertical(bottom: Radius.circular(24)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                TextButton.icon(
                  onPressed: () => _signatureController.clear(),
                  icon: const Icon(LucideIcons.rotateCcw, size: 16),
                  label: const Text('Clear'),
                  style: TextButton.styleFrom(foregroundColor: Colors.redAccent),
                ),
                ElevatedButton.icon(
                  onPressed: _handleSign,
                  icon: const Icon(LucideIcons.check, size: 16, color: Colors.white),
                  label: const Text('Submit Signature', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSignatureLines(String tenantName, String landlordName, DateTime? signedAt, ColorScheme colorScheme) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Tenant Signature', style: TextStyle(fontSize: 12, color: colorScheme.onSurface.withOpacity(0.4))),
                    const SizedBox(height: 20),
                    if (signedAt != null)
                      Text(tenantName, style: GoogleFonts.caveat(fontSize: 24, color: colorScheme.primary, fontWeight: FontWeight.bold))
                    else
                      Container(height: 1, color: colorScheme.onSurface.withOpacity(0.2)),
                    const SizedBox(height: 4),
                    Text(tenantName, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
              const SizedBox(width: 40),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Landlord Signature', style: TextStyle(fontSize: 12, color: colorScheme.onSurface.withOpacity(0.4))),
                    const SizedBox(height: 20),
                    Text(landlordName, style: GoogleFonts.caveat(fontSize: 24, color: colorScheme.onSurface.withOpacity(0.6), fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(landlordName, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ],
          ),
          if (signedAt != null) ...[
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Verification Hash: ${widget.tenancy['id'].toString().hashCode.toRadixString(16).toUpperCase()}',
                style: TextStyle(fontSize: 8, color: colorScheme.onSurface.withOpacity(0.3), fontStyle: FontStyle.italic),
              ),
            ),
          ],
        ],
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
            'ID: ${widget.tenancy['id'].toString().substring(0, 12).toUpperCase()}',
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

  Widget _buildSignatureStatus(DateTime? signedAt, ColorScheme colorScheme, bool isDark, BuildContext context) {
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
