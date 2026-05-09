import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:io';
import '../../../services/api_service.dart';
import '../../../services/auth_service.dart';
import '../../../core/providers/theme_provider.dart';
import '../../support/screens/support_center_screen.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final ApiService _api = ApiService();
  Map<String, dynamic>? _profile;
  Map<String, dynamic>? _identity;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final profile = await _api.getMyProfile();
      final identity = await _api.getMyIdentity();
      setState(() {
        _profile = profile;
        _identity = identity;
      });
    } catch (e) {
      debugPrint('Error loading profile: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  final ImagePicker _picker = ImagePicker();

  Future<void> _updateAvatar() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image == null) return;

    setState(() => _isLoading = true);
    try {
      final url = await _api.uploadImage(File(image.path), folder: 'avatars');
      if (url != null) {
        await _api.updateProfile({'avatar': url});
        await _loadData();
      }
    } catch (e) {
      debugPrint('Error updating avatar: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _editPhone() async {
    final colorScheme = Theme.of(context).colorScheme;
    final controller = TextEditingController(text: _profile?['phone']);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Edit Phone Number', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.phone,
          decoration: InputDecoration(
            labelText: 'Phone Number',
            hintText: '+254...',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              if (controller.text.isNotEmpty) {
                await _api.updateProfile({'phone': controller.text});
                Navigator.pop(context);
                _loadData();
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: colorScheme.primary),
            child: const Text('Save', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Future<void> _editPassword() async {
    final colorScheme = Theme.of(context).colorScheme;
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Change Password', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: TextField(
          controller: controller,
          obscureText: true,
          decoration: InputDecoration(
            labelText: 'New Password',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              if (controller.text.isNotEmpty) {
                await _api.updateProfile({'password': controller.text});
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password updated!')));
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: colorScheme.primary),
            child: const Text('Update', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      backgroundColor: colorScheme.background,
      appBar: AppBar(
        backgroundColor: colorScheme.surface,
        elevation: 0,
        title: Text('My Profile', style: GoogleFonts.outfit(color: colorScheme.onSurface, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: Icon(LucideIcons.edit, color: colorScheme.onSurface),
            onPressed: _updateAvatar,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    // Profile Header
                    _ProfileHeader(profile: _profile),
                    const SizedBox(height: 24),

                    // Visual Preference (Theme Toggle)
                    _ThemeSection(),
                    const SizedBox(height: 24),

                    // Wallet Section
                    _WalletSection(),
                    const SizedBox(height: 24),

                    // Identity Document Section
                    _IdentitySection(
                      identity: _identity,
                      onUpload: () async {
                        final result = await context.push('/profile/scan-document');
                        if (result == true) _loadData();
                      },
                      onRefresh: _loadData,
                    ),
                    const SizedBox(height: 24),

                    // Account Details
                    _AccountDetails(
                      profile: _profile,
                      onEditPhone: _editPhone,
                      onEditPassword: _editPassword,
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}

class _ThemeSection extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeProvider);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 16, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: colorScheme.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(
                  LucideIcons.palette,
                  color: colorScheme.primary,
                  size: 22,
                ),
              ),
              const SizedBox(width: 14),
              Text(
                'Visual Preference',
                style: GoogleFonts.outfit(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: colorScheme.onSurface,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              _ThemeOption(
                icon: LucideIcons.sun,
                label: 'Light',
                active: themeMode == ThemeMode.light,
                onTap: () => ref.read(themeProvider.notifier).setThemeMode(ThemeMode.light),
              ),
              const SizedBox(width: 12),
              _ThemeOption(
                icon: LucideIcons.moon,
                label: 'Dark',
                active: themeMode == ThemeMode.dark,
                onTap: () => ref.read(themeProvider.notifier).setThemeMode(ThemeMode.dark),
              ),
              const SizedBox(width: 12),
              _ThemeOption(
                icon: LucideIcons.monitor,
                label: 'System',
                active: themeMode == ThemeMode.system,
                onTap: () => ref.read(themeProvider.notifier).setThemeMode(ThemeMode.system),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ThemeOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _ThemeOption({
    required this.icon,
    required this.label,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: active ? colorScheme.primary : colorScheme.background,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: active ? colorScheme.primary : colorScheme.onSurface.withOpacity(0.1),
            ),
          ),
          child: Column(
            children: [
              Icon(
                icon,
                size: 20,
                color: active ? Colors.white : colorScheme.onSurface.withOpacity(0.6),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  fontWeight: active ? FontWeight.bold : FontWeight.w500,
                  color: active ? Colors.white : colorScheme.onSurface.withOpacity(0.6),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  final Map<String, dynamic>? profile;

  const _ProfileHeader({required this.profile});

  @override
  Widget build(BuildContext context) {
    final name = profile?['name'] ?? 'User';
    final email = profile?['email'] ?? '';
    final role = profile?['role'] ?? 'STUDENT';
    final avatar = profile?['avatar'];
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.05)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 16, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        children: [
          CircleAvatar(
            radius: 48,
            backgroundColor: Theme.of(context).colorScheme.primary,
            backgroundImage: avatar != null ? NetworkImage(avatar) : null,
            child: avatar == null
                ? Text(name[0].toUpperCase(), style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white))
                : null,
          ),
          const SizedBox(height: 16),
          Text(name, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
          const SizedBox(height: 4),
          Text(email, style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5), fontSize: 14)),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            decoration: BoxDecoration(
              color: role == 'LANDLORD' 
                  ? colorScheme.primary.withOpacity(0.1) 
                  : colorScheme.secondary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              role == 'LANDLORD' ? '🏠 Landlord' : '🎓 Student',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: role == 'LANDLORD' ? colorScheme.primary : colorScheme.secondary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _IdentitySection extends StatelessWidget {
  final Map<String, dynamic>? identity;
  final VoidCallback onUpload;
  final VoidCallback onRefresh;

  const _IdentitySection({
    required this.identity,
    required this.onUpload,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final hasIdentity = identity != null;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.05)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 16, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: hasIdentity 
                      ? colorScheme.primary.withOpacity(0.1) 
                      : Colors.orange.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(
                  hasIdentity ? Icons.verified_user : Icons.badge_outlined,
                  color: hasIdentity ? colorScheme.primary : Colors.orange,
                  size: 22,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Identity Document', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Theme.of(context).colorScheme.onSurface)),
                    Text(
                      hasIdentity ? 'Document uploaded successfully' : 'Upload your ID for landlord verification',
                      style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5)),
                    ),
                  ],
                ),
              ),
              if (hasIdentity)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: identity!['verified'] == true 
                        ? colorScheme.primary.withOpacity(0.1) 
                        : Colors.orange.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    identity!['verified'] == true ? 'Verified' : 'Pending',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: identity!['verified'] == true ? colorScheme.primary : Colors.orange,
                    ),
                  ),
                ),
            ],
          ),
          if (hasIdentity) ...[
            const SizedBox(height: 20),
            const Divider(height: 1),
            const SizedBox(height: 20),
            _DetailRow(label: 'Full Name', value: identity!['fullName'] ?? 'Not extracted'),
            _DetailRow(label: 'ID Number', value: identity!['idNumber'] ?? 'Not extracted'),
            _DetailRow(label: 'Date of Birth', value: identity!['dateOfBirth'] ?? 'Not extracted'),
            _DetailRow(label: 'Document Type', value: _formatDocType(identity!['documentType'])),
            if (identity!['universityRegNo'] != null)
              _DetailRow(label: 'Reg. Number', value: identity!['universityRegNo']),
            if (identity!['aiConfidence'] != null)
              _DetailRow(
                label: 'AI Confidence',
                value: '${((identity!['aiConfidence'] as num) * 100).toStringAsFixed(0)}%',
                valueColor: (identity!['aiConfidence'] as num) > 0.8 ? colorScheme.primary : Colors.orange,
              ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: onUpload,
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Re-upload Document'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  side: BorderSide(color: colorScheme.primary),
                  foregroundColor: colorScheme.primary,
                ),
              ),
            ),
          ] else ...[
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: onUpload,
                    icon: const Icon(Icons.upload_file, size: 20),
                    label: const Text('Upload ID'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: colorScheme.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onUpload,
                    icon: const Icon(Icons.document_scanner, size: 20),
                    label: const Text('Scan ID'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      side: BorderSide(color: colorScheme.primary),
                      foregroundColor: colorScheme.primary,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  String _formatDocType(String? type) {
    switch (type) {
      case 'NATIONAL_ID':
        return 'National ID';
      case 'PASSPORT':
        return 'Passport';
      case 'STUDENT_ID':
        return 'Student ID Card';
      default:
        return type ?? 'Unknown';
    }
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _DetailRow({required this.label, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5), fontSize: 13)),
          Text(
            value,
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: valueColor ?? Theme.of(context).colorScheme.onSurface),
          ),
        ],
      ),
    );
  }
}

class _AccountDetails extends StatelessWidget {
  final Map<String, dynamic>? profile;
  final VoidCallback onEditPhone;
  final VoidCallback onEditPassword;

  const _AccountDetails({
    required this.profile,
    required this.onEditPhone,
    required this.onEditPassword,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.05)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 16, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Account Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Theme.of(context).colorScheme.onSurface)),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _DetailRow(label: 'Phone', value: profile?['phone'] ?? 'Not set'),
              TextButton(onPressed: onEditPhone, child: const Text('Edit', style: TextStyle(fontSize: 12))),
            ],
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const _DetailRow(label: 'Password', value: '••••••••'),
              TextButton(onPressed: onEditPassword, child: const Text('Change', style: TextStyle(fontSize: 12))),
            ],
          ),
          _DetailRow(label: 'Member Since', value: _formatDate(profile?['createdAt'])),
          _DetailRow(label: 'Total Bookings', value: '${profile?['_count']?['bookings'] ?? 0}'),
          const Divider(height: 32),
          StatefulBuilder(
            builder: (context, setModalState) => Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('2FA Authentication', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Theme.of(context).colorScheme.onSurface)),
                    Text('Secure your account with SMS OTP', style: TextStyle(fontSize: 11, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5))),
                  ],
                ),
                Switch(
                  value: profile?['twoFactorEnabled'] ?? false,
                  onChanged: (val) async {
                    setModalState(() {
                      profile?['twoFactorEnabled'] = val;
                    });
                    await ApiService().updateProfile({'twoFactorEnabled': val});
                  },
                  activeColor: colorScheme.primary,
                ),
              ],
            ),
          ),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => context.push('/saved-properties'),
              icon: const Icon(LucideIcons.heart, size: 18),
              label: const Text('Saved Properties', style: TextStyle(fontWeight: FontWeight.bold)),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                side: BorderSide(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.1)),
                foregroundColor: Theme.of(context).colorScheme.onSurface,
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => context.push('/chat-list'),
              icon: const Icon(LucideIcons.messageSquare, size: 18),
              label: const Text('My Messages', style: TextStyle(fontWeight: FontWeight.bold)),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                side: BorderSide(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.1)),
                foregroundColor: Theme.of(context).colorScheme.onSurface,
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const SupportCenterScreen())),
              icon: const Icon(LucideIcons.helpCircle, size: 18),
              label: const Text('Help & Support Center', style: TextStyle(fontWeight: FontWeight.bold)),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                side: BorderSide(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.1)),
                foregroundColor: Theme.of(context).colorScheme.onSurface,
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () async {
                final auth = AuthService();
                await auth.logout();
                if (context.mounted) context.go('/auth');
              },
              icon: const Icon(LucideIcons.logOut, size: 18),
              label: const Text('Logout', style: TextStyle(fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: colorScheme.error.withOpacity(0.1),
                foregroundColor: colorScheme.error,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 0,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return 'N/A';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return dateStr;
    }
  }
}

class _WalletSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: () => context.push('/wallet'),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [colorScheme.primary, colorScheme.primary.withOpacity(0.8)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(28),
          boxShadow: [
            BoxShadow(color: colorScheme.primary.withOpacity(0.3), blurRadius: 16, offset: const Offset(0, 8)),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(LucideIcons.wallet, color: Colors.white, size: 24),
            ),
            const SizedBox(width: 16),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Nest Wallet',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                  Text(
                    'Manage your funds and payouts',
                    style: TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                ],
              ),
            ),
            const Icon(LucideIcons.chevronRight, color: Colors.white70),
          ],
        ),
      ),
    );
  }
}
