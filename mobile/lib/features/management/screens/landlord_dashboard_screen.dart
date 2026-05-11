import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../services/api_service.dart';
import '../../../core/utils/image_utils.dart';

class LandlordDashboardScreen extends StatefulWidget {
  const LandlordDashboardScreen({super.key});

  @override
  State<LandlordDashboardScreen> createState() => _LandlordDashboardScreenState();
}

class _LandlordDashboardScreenState extends State<LandlordDashboardScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  Map<String, dynamic> _stats = {
    'balance': '0',
    'totalEarnings': '0',
    'totalProperties': '0',
    'occupancy': '0%',
    'pendingBookings': 0,
    'pendingPayments': 0,
  };
  Map<String, dynamic>? _profile;
  int _unreadNotifications = 0;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() => _isLoading = true);
    try {
      final profile = await _apiService.getMyProfile();
      if (profile != null) {
        setState(() => _profile = profile);
      }

      final notifications = await _apiService.getNotifications();
      final unreadCount = notifications.where((n) => n['isRead'] == false).length;

      final stats = await _apiService.getLandlordStats();
      if (stats != null && mounted) {
        setState(() {
          _unreadNotifications = unreadCount;
          _stats['balance'] = stats['balance']?.toString() ?? '0';
          _stats['totalEarnings'] = stats['totalEarnings']?.toString() ?? '0';
          _stats['totalProperties'] = stats['totalProperties']?.toString() ?? '0';
          
          final int activeCount = int.tryParse(stats['activeTenantsCount']?.toString() ?? '0') ?? 0;
          final int totalProps = int.tryParse(stats['totalProperties']?.toString() ?? '0') ?? 0;
          
          _stats['occupancy'] = totalProps > 0 
              ? '${(activeCount / (totalProps * 5) * 100).toInt()}%' 
              : '0%';
              
          _stats['pendingBookings'] = stats['pendingRequestsCount'] ?? 0;
          _stats['pendingPayments'] = stats['pendingPaymentsCount'] ?? 0; 
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading stats: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: colorScheme.background,
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : RefreshIndicator(
            onRefresh: _loadStats,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                children: [
                  _buildHeader(colorScheme),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildWalletSection(colorScheme, isDark),
                        const SizedBox(height: 32),
                        _buildStatsGrid(colorScheme, isDark),
                        const SizedBox(height: 32),
                        _buildApprovalsHub(colorScheme, isDark),
                        const SizedBox(height: 32),
                        _buildQuickActions(colorScheme, isDark),
                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
    );
  }

  Widget _buildHeader(ColorScheme colorScheme) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 60, 24, 32),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: colorScheme.primary.withOpacity(0.1),
                backgroundImage: _profile?['avatar'] != null ? NetworkImage(ImageUtils.formatUrl(_profile!['avatar'])) : null,
                child: _profile?['avatar'] == null ? Icon(LucideIcons.user, color: colorScheme.primary) : null,
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Welcome back,',
                    style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.6), fontSize: 14),
                  ),
                  Text(
                    _profile?['name']?.split(' ')[0] ?? 'Landlord',
                    style: GoogleFonts.outfit(
                      color: colorScheme.onBackground,
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
            ],
          ),
          IconButton(
            onPressed: () => context.push('/notifications'),
            icon: _unreadNotifications > 0 
              ? Badge(
                  label: Text(_unreadNotifications.toString()),
                  child: Icon(LucideIcons.bell, color: colorScheme.onBackground),
                )
              : Icon(LucideIcons.bell, color: colorScheme.onBackground),
          ),
        ],
      ),
    );
  }

  Widget _buildWalletSection(ColorScheme colorScheme, bool isDark) {
    final balance = _stats['balance'] ?? '0';
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
          BoxShadow(
            color: colorScheme.primary.withOpacity(isDark ? 0.2 : 0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(LucideIcons.wallet, color: Colors.white.withOpacity(0.8), size: 16),
              const SizedBox(width: 8),
              Text(
                'WALLET BALANCE',
                style: GoogleFonts.outfit(
                  color: Colors.white.withOpacity(0.8),
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Ksh $balance',
            style: GoogleFonts.outfit(
              color: Colors.white,
              fontSize: 40,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: () => context.push('/withdraw'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white.withOpacity(0.2),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const Text('Withdraw'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => context.push('/reports'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: colorScheme.primary,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const Text('Statement'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatsGrid(ColorScheme colorScheme, bool isDark) {
    return Row(
      children: [
        Expanded(
          child: _buildKPI(
            colorScheme,
            isDark,
            'Properties',
            _stats['totalProperties']?.toString() ?? '0',
            LucideIcons.building,
            const Color(0xFF8B5CF6),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _buildKPI(
            colorScheme,
            isDark,
            'Occupancy',
            _stats['occupancy']?.toString() ?? '0%',
            LucideIcons.users,
            const Color(0xFFF59E0B),
          ),
        ),
      ],
    );
  }

  Widget _buildKPI(ColorScheme colorScheme, bool isDark, String label, String value, IconData icon, Color color) {
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
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 16),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: colorScheme.onSurface,
            ),
          ),
          Text(
            label,
            style: GoogleFonts.outfit(
              color: colorScheme.onSurface.withOpacity(0.5),
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildApprovalsHub(ColorScheme colorScheme, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Approvals Hub',
          style: GoogleFonts.outfit(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            color: colorScheme.onBackground,
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildApprovalCard(
                colorScheme,
                isDark,
                'Bookings',
                _stats['pendingBookings'].toString(),
                LucideIcons.calendarClock,
                const Color(0xFF3B82F6),
                () => context.push('/approval-hub', extra: {'tab': 0}),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildApprovalCard(
                colorScheme,
                isDark,
                'Payments',
                _stats['pendingPayments'].toString(),
                LucideIcons.banknote,
                const Color(0xFF10B981),
                () => context.push('/approval-hub', extra: {'tab': 1}),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildApprovalCard(ColorScheme colorScheme, bool isDark, String label, String count, IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
        ),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Icon(icon, color: color, size: 20),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    count,
                    style: GoogleFonts.outfit(
                      color: color,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              label,
              style: GoogleFonts.outfit(
                color: colorScheme.onSurface,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActions(ColorScheme colorScheme, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: GoogleFonts.outfit(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            color: colorScheme.onBackground,
          ),
        ),
        const SizedBox(height: 16),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          mainAxisSpacing: 16,
          crossAxisSpacing: 16,
          childAspectRatio: 2.2,
          children: [
            _buildActionItem(colorScheme, isDark, 'Add Property', LucideIcons.plus, () => context.push('/add-property')),
            _buildActionItem(colorScheme, isDark, 'Manage Listings', LucideIcons.list, () => context.push('/my-properties')),
            _buildActionItem(colorScheme, isDark, 'Manage Tours', LucideIcons.calendar, () => context.push('/landlord/tours')),
            _buildActionItem(colorScheme, isDark, 'Maintenance', LucideIcons.wrench, () => context.push('/landlord/maintenance')),
            _buildActionItem(colorScheme, isDark, 'View Reports', LucideIcons.barChart3, () => context.push('/reports')),
            _buildActionItem(colorScheme, isDark, 'Settings', LucideIcons.settings, () => context.push('/settings')),
          ],
        ),
      ],
    );
  }

  Widget _buildActionItem(ColorScheme colorScheme, bool isDark, String label, IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18, color: colorScheme.primary),
            const SizedBox(width: 12),
            Text(
              label,
              style: GoogleFonts.outfit(
                fontWeight: FontWeight.bold,
                fontSize: 13,
                color: colorScheme.onSurface,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
