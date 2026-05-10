import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../services/api_service.dart';
import '../../../services/auth_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final ApiService _apiService = ApiService();
  final AuthService _authService = AuthService();
  bool _isLoading = true;
  Map<String, dynamic>? _profile;

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
          _profile = profile;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Logout', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Logout'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await _authService.logout();
      if (mounted) context.go('/auth');
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      backgroundColor: colorScheme.background,
      appBar: AppBar(
        title: Text('Account Settings', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    _buildProfileHeader(colorScheme),
                    const SizedBox(height: 32),
                    _buildSectionTitle('Preferences', colorScheme),
                    _buildSettingTile(
                      'Edit Profile', 
                      LucideIcons.user, 
                      colorScheme, 
                      onTap: () => context.push('/profile/edit'),
                    ),
                    _buildSettingTile(
                      'Financial Settings', 
                      LucideIcons.wallet, 
                      colorScheme, 
                      onTap: () => context.push('/landlord/financial-settings'),
                    ),
                    _buildSettingTile(
                      'Notifications', 
                      LucideIcons.bell, 
                      colorScheme, 
                      onTap: () => context.push('/notifications'),
                    ),
                    const SizedBox(height: 32),
                    _buildSectionTitle('Legal & Support', colorScheme),
                    _buildSettingTile(
                      'Privacy Policy', 
                      LucideIcons.shield, 
                      colorScheme, 
                      onTap: () {},
                    ),
                    _buildSettingTile(
                      'Help Center', 
                      LucideIcons.helpCircle, 
                      colorScheme, 
                      onTap: () => context.push('/support'),
                    ),
                    const SizedBox(height: 48),
                    _buildLogoutButton(colorScheme),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildProfileHeader(ColorScheme colorScheme) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 32,
            backgroundColor: colorScheme.primary.withOpacity(0.1),
            backgroundImage: _profile?['avatar'] != null ? NetworkImage(_profile!['avatar']) : null,
            child: _profile?['avatar'] == null ? Icon(LucideIcons.user, color: colorScheme.primary, size: 28) : null,
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _profile?['name'] ?? 'User Name',
                  style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: colorScheme.onSurface),
                ),
                Text(
                  _profile?['email'] ?? 'email@example.com',
                  style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.5), fontSize: 14),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: colorScheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _profile?['role'] ?? 'Landlord',
                    style: GoogleFonts.outfit(color: colorScheme.primary, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title, ColorScheme colorScheme) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 12),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          title.toUpperCase(),
          style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: colorScheme.onSurface.withOpacity(0.4), letterSpacing: 1.2),
        ),
      ),
    );
  }

  Widget _buildSettingTile(String title, IconData icon, ColorScheme colorScheme, {required VoidCallback onTap}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
      ),
      child: ListTile(
        onTap: onTap,
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: colorScheme.onSurface.withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: colorScheme.onSurface.withOpacity(0.6), size: 20),
        ),
        title: Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 15, color: colorScheme.onSurface)),
        trailing: Icon(LucideIcons.chevronRight, size: 18, color: colorScheme.onSurface.withOpacity(0.3)),
      ),
    );
  }

  Widget _buildLogoutButton(ColorScheme colorScheme) {
    return SizedBox(
      width: double.infinity,
      height: 60,
      child: OutlinedButton.icon(
        onPressed: _handleLogout,
        icon: const Icon(LucideIcons.logOut, size: 20, color: Colors.redAccent),
        label: Text('Sign Out', style: GoogleFonts.outfit(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 16)),
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: Colors.redAccent, width: 1.5),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        ),
      ),
    );
  }
}
