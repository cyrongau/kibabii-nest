import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../services/api_service.dart';

class FinancialSettingsScreen extends StatefulWidget {
  const FinancialSettingsScreen({super.key});

  @override
  State<FinancialSettingsScreen> createState() => _FinancialSettingsScreenState();
}

class _FinancialSettingsScreenState extends State<FinancialSettingsScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  bool _isSaving = false;

  final _bankNameController = TextEditingController();
  final _accountNumberController = TextEditingController();
  final _accountNameController = TextEditingController();
  final _phoneController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final profile = await _apiService.getMyProfile();
      if (profile != null && mounted) {
        setState(() {
          _bankNameController.text = profile['bankName'] ?? '';
          _accountNumberController.text = profile['accountNumber'] ?? '';
          _accountNameController.text = profile['accountName'] ?? '';
          _phoneController.text = profile['phone'] ?? '';
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleSave() async {
    setState(() => _isSaving = true);
    try {
      final data = {
        'bankName': _bankNameController.text,
        'accountNumber': _accountNumberController.text,
        'accountName': _accountNameController.text,
        'phone': _phoneController.text,
      };

      final result = await _apiService.updateProfile(data);
      if (result != null && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Financial settings updated successfully!'), backgroundColor: Color(0xFF10B981)),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to update settings'), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
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
        title: Text('Financial Settings', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildAlertBox(colorScheme),
                  const SizedBox(height: 32),
                  _buildSectionTitle('Bank Details', 'Used for direct student transfers', colorScheme),
                  const SizedBox(height: 16),
                  _buildInputCard([
                    _buildTextField('Bank Name', _bankNameController, LucideIcons.landmark, context),
                    _buildDivider(colorScheme),
                    _buildTextField('Account Number', _accountNumberController, LucideIcons.hash, context),
                    _buildDivider(colorScheme),
                    _buildTextField('Account Name', _accountNameController, LucideIcons.user, context),
                  ], colorScheme),
                  const SizedBox(height: 32),
                  _buildSectionTitle('Payment Settings', 'Phone number for M-Pesa payouts', colorScheme),
                  const SizedBox(height: 16),
                  _buildInputCard([
                    _buildTextField('M-Pesa Number', _phoneController, LucideIcons.smartphone, context),
                  ], colorScheme),
                  const SizedBox(height: 48),
                  _buildSaveButton(colorScheme),
                  const SizedBox(height: 40), // SafeArea margin
                ],
              ),
            ),
    );
  }

  Widget _buildAlertBox(ColorScheme colorScheme) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colorScheme.primary.withOpacity(0.05),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colorScheme.primary.withOpacity(0.1)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(LucideIcons.shieldCheck, color: colorScheme.primary, size: 24),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Secure Storage', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
                const SizedBox(height: 4),
                Text(
                  'These details are only visible to verified students and our automated payout system.',
                  style: GoogleFonts.outfit(fontSize: 13, color: colorScheme.onSurface.withOpacity(0.5), height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title, String subtitle, ColorScheme colorScheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
        Text(subtitle, style: GoogleFonts.outfit(fontSize: 13, color: colorScheme.onSurface.withOpacity(0.4))),
      ],
    );
  }

  Widget _buildInputCard(List<Widget> children, ColorScheme colorScheme) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
      ),
      child: Column(children: children),
    );
  }

  Widget _buildDivider(ColorScheme colorScheme) {
    return Divider(height: 32, color: colorScheme.onSurface.withOpacity(0.05));
  }

  Widget _buildTextField(String label, TextEditingController controller, IconData icon, BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w900, color: colorScheme.onSurface.withOpacity(0.4), letterSpacing: 0.5)),
        TextField(
          controller: controller,
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface),
          decoration: InputDecoration(
            prefixIcon: Icon(icon, size: 18, color: colorScheme.onSurface.withOpacity(0.3)),
            border: InputBorder.none,
            hintText: 'Enter $label',
            hintStyle: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.2), fontWeight: FontWeight.normal),
          ),
        ),
      ],
    );
  }

  Widget _buildSaveButton(ColorScheme colorScheme) {
    return SizedBox(
      width: double.infinity,
      height: 60,
      child: ElevatedButton(
        onPressed: _isSaving ? null : _handleSave,
        child: _isSaving 
            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : Text('Save Settings', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
      ),
    );
  }
}
