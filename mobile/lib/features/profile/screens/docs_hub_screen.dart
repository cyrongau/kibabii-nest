import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import 'dart:io';
import '../../../services/api_service.dart';
import '../../../core/widgets/app_modals.dart';
import '../../tenancy/screens/digital_agreement_screen.dart';

import 'package:url_launcher/url_launcher.dart';

class DocsHubScreen extends StatefulWidget {
  final Map<String, dynamic>? tenancy;

  const DocsHubScreen({super.key, this.tenancy});

  @override
  State<DocsHubScreen> createState() => _DocsHubScreenState();
}

class _DocsHubScreenState extends State<DocsHubScreen> {
  final ApiService _api = ApiService();
  bool _isLoading = true;
  List<Map<String, dynamic>> _documents = [];

  @override
  void initState() {
    super.initState();
    _loadDocuments();
  }

  Future<void> _loadDocuments() async {
    setState(() => _isLoading = true);
    try {
      final identity = await _api.getMyIdentity();
      
      final List<Map<String, dynamic>> docs = [];
      
      // 1. Student ID
      if (identity != null && identity['documentUrl'] != null) {
        docs.add({
          'name': 'Student Identity Card',
          'type': 'Identity',
          'date': identity['updatedAt'] ?? identity['createdAt'],
          'url': identity['documentUrl'],
          'icon': LucideIcons.userCheck,
          'color': Colors.blue,
        });
      }

      // 2. Tenancy Agreement
      if (widget.tenancy != null) {
        docs.add({
          'name': 'Tenancy Agreement',
          'type': 'Agreement',
          'date': widget.tenancy!['signedAt'] ?? widget.tenancy!['createdAt'],
          'url': widget.tenancy!['agreementUrl'] ?? '#',
          'icon': LucideIcons.fileSignature,
          'color': Colors.green,
          'tenancy': widget.tenancy,
        });

        // 3. Payment Receipts
        final payments = (widget.tenancy!['payments'] as List?) ?? [];
        for (var p in payments) {
          if (p['status'] == 'PAID' || p['status'] == 'VERIFIED') {
            docs.add({
              'name': 'Rent Receipt - ${DateFormat('MMM yyyy').format(DateTime.parse(p['dueDate']))}',
              'type': 'Receipt',
              'date': p['paidDate'] ?? p['updatedAt'],
              'url': p['receiptUrl'] ?? '#',
              'icon': LucideIcons.receipt,
              'color': Colors.orange,
            });
          }
        }
      }

      setState(() {
        _documents = docs;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
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
        title: Text('Documents Vault', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
        backgroundColor: colorScheme.surface,
        elevation: 0,
        leading: IconButton(
          icon: Icon(LucideIcons.chevronLeft, color: colorScheme.onSurface),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _isLoading 
        ? Center(child: CircularProgressIndicator(color: colorScheme.primary))
        : _documents.isEmpty
          ? _buildEmptyState(colorScheme)
          : ListView.builder(
              padding: const EdgeInsets.all(24),
              itemCount: _documents.length,
              itemBuilder: (context, index) => _buildDocCard(_documents[index], colorScheme),
            ),
    );
  }

  Widget _buildDocCard(Map<String, dynamic> doc, ColorScheme colorScheme) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
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
            decoration: BoxDecoration(
              color: (doc['color'] as Color).withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(doc['icon'], color: doc['color'], size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(doc['name'], style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
                Text(
                  '${doc['type']} • ${DateFormat('MMM dd, yyyy').format(DateTime.parse(doc['date']))}',
                  style: TextStyle(fontSize: 12, color: colorScheme.onSurface.withOpacity(0.4)),
                ),
              ],
            ),
          ),
          IconButton(
            icon: Icon(LucideIcons.eye, color: colorScheme.primary),
            onPressed: () async {
              String urlStr = doc['url'] ?? '';

              if ((urlStr == 'signed_digitally_via_mobile' || urlStr == '#' || urlStr.isEmpty) && doc['type'] == 'Agreement' && doc['tenancy'] != null) {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => DigitalAgreementScreen(tenancy: doc['tenancy']),
                  ),
                ).then((_) => _loadDocuments());
                return;
              }

              if (urlStr == '#' || urlStr.isEmpty) {
                if (mounted) {
                  AppModals.showError(
                    context: context,
                    title: 'Not Ready',
                    message: 'This document URL is not available yet. It may be being processed.',
                  );
                }
                return;
              }

              // Prepend baseUrl if it's a relative path
              if (!urlStr.startsWith('http')) {
                urlStr = '${_api.baseUrl}$urlStr';
              }

              final url = Uri.tryParse(urlStr);
              if (url != null && await canLaunchUrl(url)) {
                await launchUrl(url, mode: LaunchMode.externalApplication);
              } else {
                if (mounted) {
                  AppModals.showError(
                    context: context,
                    title: 'Error',
                    message: 'Could not open the document URL. Please try again later.',
                  );
                }
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(ColorScheme colorScheme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.folderOpen, size: 64, color: colorScheme.onSurface.withOpacity(0.1)),
          const SizedBox(height: 16),
          Text(
            'No documents yet',
            style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface.withOpacity(0.6)),
          ),
          Text(
            'Your ID and agreements will appear here.',
            style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.4)),
          ),
        ],
      ),
    );
  }
}
