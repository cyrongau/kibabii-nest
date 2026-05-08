import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../services/api_service.dart';
import '../../../shared/widgets/nest_alert.dart';
import 'package:intl/intl.dart';
import 'payment_archive_screen.dart';
import '../../profile/screens/docs_hub_screen.dart';

class MyBookingsScreen extends StatefulWidget {
  const MyBookingsScreen({super.key});

  @override
  State<MyBookingsScreen> createState() => _MyBookingsScreenState();
}

class _MyBookingsScreenState extends State<MyBookingsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ApiService _apiService = ApiService();
  List<dynamic> _bookings = [];
  Map<String, dynamic>? _activeTenancy;
  List<dynamic> _announcements = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadBookings();
  }

  Future<void> _loadBookings() async {
    setState(() => _isLoading = true);
    try {
      final bookings = await _apiService.getMyBookings();
      final tenancies = await _apiService.getMyTenancies();
      final announcements = await _apiService.getAnnouncements();
      
      if (mounted) {
        setState(() {
          _bookings = bookings;
          _activeTenancy = tenancies.isNotEmpty ? tenancies[0] : null;
          _announcements = announcements;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _calculateNextDueDate(Map<String, dynamic> tenancy) {
    final payments = (tenancy['payments'] as List?) ?? [];
    final paidPayments = payments.where((p) => p['status'] == 'PAID' || p['status'] == 'VERIFIED' || p['status'] == 'SUBMITTED').toList();
    
    final deadlineDay = tenancy['paymentDeadlineDay'] ?? 5;
    final now = DateTime.now();

    if (paidPayments.isEmpty) {
      DateTime nextDue = DateTime(now.year, now.month, deadlineDay);
      if (nextDue.isBefore(now)) {
        nextDue = DateTime(now.year, now.month + 1, deadlineDay);
      }
      return DateFormat('d MMM').format(nextDue);
    }

    // Sort to find the latest paid month in the future
    paidPayments.sort((a, b) {
      if (a['year'] != b['year']) return b['year'].compareTo(a['year']);
      return b['month'].compareTo(a['month']);
    });

    final latest = paidPayments[0];
    int latestMonth = latest['month'];
    int latestYear = latest['year'];

    DateTime nextDue = DateTime(latestYear, latestMonth + 1, deadlineDay);
    
    return DateFormat('d MMM').format(nextDue);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: colorScheme.background,
      appBar: AppBar(
        backgroundColor: colorScheme.surface,
        elevation: 0,
        centerTitle: false,
        title: Text(
          'My Residencies',
          style: GoogleFonts.outfit(color: colorScheme.onSurface, fontWeight: FontWeight.w900, fontSize: 24),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: colorScheme.primary,
          indicatorWeight: 4,
          labelColor: colorScheme.primary,
          unselectedLabelColor: colorScheme.onSurface.withOpacity(0.4),
          labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14),
          tabs: const [
            Tab(text: 'ACTIVE TENANCY'),
            Tab(text: 'BOOKING REQUESTS'),
          ],
        ),
      ),
      body: _isLoading 
        ? Center(child: CircularProgressIndicator(color: colorScheme.primary))
        : TabBarView(
            controller: _tabController,
            children: [
              _buildActiveTenancyTab(colorScheme, isDark),
              _buildBookingsTab(colorScheme, isDark),
            ],
          ),
    );
  }

  Widget _buildActiveTenancyTab(ColorScheme colorScheme, bool isDark) {
    if (_activeTenancy == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.home, size: 64, color: colorScheme.onSurface.withOpacity(0.1)),
            const SizedBox(height: 16),
            Text(
              'No active tenancy',
              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface.withOpacity(0.6)),
            ),
            Text(
              'Your confirmed residencies will appear here',
              style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.4)),
            ),
          ],
        ),
      );
    }

    final unit = _activeTenancy!['propertyUnit'];
    final property = unit?['property'];
    final unitType = unit?['type'];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Property Header (Consistent with MyTenancyScreen)
          _buildActivePropertyHeader(property, unitType, _activeTenancy!, colorScheme, isDark),
          const SizedBox(height: 24),

          // 2. Status Card
          _buildActiveStatusCard(_activeTenancy!, colorScheme, isDark),
          const SizedBox(height: 24),

          // 3. Quick Actions
          _buildActiveQuickActions(_activeTenancy!, colorScheme),
          const SizedBox(height: 32),

          _buildPaymentSection(colorScheme, isDark),
          const SizedBox(height: 32),

          // 4. Announcements
          _buildActiveAnnouncements(colorScheme, isDark),
          const SizedBox(height: 32),

          // 5. Amenities
          _buildActiveAmenities(property?['amenities'] ?? [], colorScheme, isDark),
        ],
      ),
    );
  }

  Widget _buildActiveAnnouncements(ColorScheme colorScheme, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Announcements', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
        const SizedBox(height: 16),
        if (_announcements.isEmpty)
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: colorScheme.primary.withOpacity(0.05),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: colorScheme.primary.withOpacity(0.1)),
            ),
            child: Row(
              children: [
                Icon(LucideIcons.megaphone, color: colorScheme.primary),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('No new announcements', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14, color: colorScheme.onSurface)),
                      Text('Stay tuned for updates from your landlord.', style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.5), fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _announcements.length,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final a = _announcements[index];
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
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(color: colorScheme.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                          child: Icon(LucideIcons.megaphone, size: 16, color: colorScheme.primary),
                        ),
                        const SizedBox(width: 12),
                        Expanded(child: Text(a['title'] ?? 'Notice', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14, color: colorScheme.onSurface))),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(a['content'] ?? '', style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.6), fontSize: 13, height: 1.5)),
                    const SizedBox(height: 12),
                    Text(
                      DateFormat('MMM dd, yyyy').format(DateTime.parse(a['createdAt'])),
                      style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.3), fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              );
            },
          ),
      ],
    );
  }

  Widget _buildActiveAmenities(List<dynamic> amenities, ColorScheme colorScheme, bool isDark) {
    if (amenities.isEmpty) {
      amenities = ['High-speed WiFi', '24/7 Security', 'Water & Electricity', 'Trash Collection'];
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Services & Amenities', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
        const SizedBox(height: 16),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: amenities.map((a) => Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: colorScheme.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(LucideIcons.checkCircle2, size: 14, color: Color(0xFF10B981)),
                const SizedBox(width: 8),
                Text(a.toString(), style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w600, color: colorScheme.onSurface.withOpacity(0.7))),
              ],
            ),
          )).toList(),
        ),
      ],
    );
  }

  Widget _buildActivePropertyHeader(dynamic property, dynamic unitType, dynamic booking, ColorScheme colorScheme, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
        boxShadow: isDark ? [] : [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 20, offset: const Offset(0, 10))
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              image: DecorationImage(
                image: NetworkImage((property['images'] != null && property['images'].isNotEmpty) 
                  ? property['images'][0] 
                  : 'https://via.placeholder.com/150'),
                fit: BoxFit.cover,
              ),
            ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(property['name'] ?? 'The Azure Commons', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(LucideIcons.mapPin, size: 12, color: colorScheme.onSurface.withOpacity(0.5)),
                    const SizedBox(width: 4),
                    Expanded(child: Text(property['address'] ?? 'Near University Main Gate', style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.5), fontSize: 13, fontWeight: FontWeight.w500), overflow: TextOverflow.ellipsis)),
                  ],
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: colorScheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '${unitType?['name'] ?? 'Standard'} - Unit ${booking['unitName'] ?? 'TBD'}',
                    style: GoogleFonts.outfit(color: colorScheme.primary, fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActiveStatusCard(dynamic tenancy, ColorScheme colorScheme, bool isDark) {
    final bool isSigned = tenancy['signedAt'] != null;
    final price = tenancy['monthlyRent']?.toString() ?? '0';

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isDark 
            ? [colorScheme.surface, colorScheme.surface.withOpacity(0.8)]
            : [const Color(0xFF1E293B), const Color(0xFF334155)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(color: colorScheme.onSurface.withOpacity(0.2), blurRadius: 20, offset: const Offset(0, 10))
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Current Status', style: GoogleFonts.outfit(color: Colors.white.withOpacity(0.6), fontSize: 12, fontWeight: FontWeight.w500)),
                  Text(tenancy['status'] ?? 'ACTIVE', style: GoogleFonts.outfit(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                ],
              ),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(LucideIcons.checkCircle, color: Color(0xFF10B981), size: 28),
              ),
            ],
          ),
          const SizedBox(height: 24),
          const Divider(color: Colors.white12),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildActiveStatusInfo('Rent', 'Ksh $price'),
              _buildActiveStatusInfo('Next Due', _calculateNextDueDate(tenancy)),
              _buildActiveStatusInfo('Agreement', isSigned ? 'Signed' : 'Pending'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActiveStatusInfo(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.outfit(color: Colors.white.withOpacity(0.5), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
        const SizedBox(height: 4),
        Text(value, style: GoogleFonts.outfit(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildActiveQuickActions(dynamic booking, ColorScheme colorScheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Quick Actions', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w900, color: colorScheme.onSurface)),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(child: _buildActionTile(LucideIcons.wrench, 'Repair', () => context.push('/maintenance'), Colors.orange, colorScheme)),
            const SizedBox(width: 16),
            Expanded(child: _buildActionTile(LucideIcons.fileText, 'Docs', () {
              Navigator.push(context, MaterialPageRoute(builder: (context) => DocsHubScreen(tenancy: _activeTenancy)));
            }, colorScheme.primary, colorScheme)),
            const SizedBox(width: 16),
            Expanded(child: _buildActionTile(LucideIcons.logOut, 'Vacate', () => _showVacationConfirmation(context), Colors.red, colorScheme)),
          ],
        ),
      ],
    );
  }

  Widget _buildActionTile(IconData icon, String label, VoidCallback onTap, Color color, ColorScheme colorScheme) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 8),
            Text(label, style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }

  Widget _buildActiveResidencyCard(dynamic booking) {
    final unit = booking['propertyUnit'];
    final property = unit?['property'];
    final roomName = unit?['name'] ?? 'Unit';
    final roomType = unit?['type']?['name'] ?? 'Standard';
    final price = unit?['price']?.toString() ?? '0';

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E293B), Color(0xFF334155)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(color: const Color(0xFF1E293B).withOpacity(0.2), blurRadius: 20, offset: const Offset(0, 10))
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: -20,
            top: -20,
            child: Opacity(
              opacity: 0.1,
              child: Icon(LucideIcons.home, size: 150, color: Colors.white),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(28.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withOpacity(0.2),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        'ACTIVE NOW',
                        style: GoogleFonts.outfit(color: const Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1),
                      ),
                    ),
                    const Icon(LucideIcons.shieldCheck, color: Colors.white, size: 20),
                  ],
                ),
                const SizedBox(height: 24),
                Text(
                  property?['name'] ?? 'The Azure Commons',
                  style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white),
                ),
                Text(
                  '$roomName • $roomType',
                  style: GoogleFonts.outfit(fontSize: 14, color: const Color(0xFF94A3B8), fontWeight: FontWeight.w500),
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Divider(color: Colors.white12),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildQuickStat('NEXT RENT', _calculateNextDueDate(_activeTenancy!)),
                    _buildQuickStat('MONTHLY', 'Ksh ${unit?['price'] ?? '0'}'),
                    _buildQuickStat('AGREEMENT', _activeTenancy!['signedAt'] != null ? 'Signed' : 'Pending'),
                  ],
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: _buildActionBtn(
                        LucideIcons.fileSignature, 
                        'VIEW AGREEMENT', 
                        () {},
                        const Color(0xFF3B82F6),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildActionBtn(
                        LucideIcons.logOut, 
                        'VACATION NOTICE', 
                        () => _showVacationConfirmation(context),
                        Colors.redAccent,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildActionBtn(
                        LucideIcons.creditCard, 
                        'MAKE RENT PAYMENT', 
                        () => _showPaymentOptions(context),
                        const Color(0xFF10B981),
                        isPrimary: true,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildActionBtn(
                        LucideIcons.wrench, 
                        'MAINTENANCE HUB', 
                        () => context.push('/maintenance'),
                        const Color(0xFFF59E0B),
                        isPrimary: true,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionBtn(IconData icon, String label, VoidCallback onTap, Color color, {bool isPrimary = false}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 54,
        decoration: BoxDecoration(
          color: isPrimary ? color : Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(18),
          border: isPrimary ? null : Border.all(color: Colors.white24),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.white, size: 16),
            const SizedBox(width: 8),
            Text(
              label,
              style: GoogleFonts.outfit(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 0.5),
            ),
          ],
        ),
      ),
    );
  }

  void _showVacationConfirmation(BuildContext context) {
    NestAlert.show(
      context,
      title: 'Notice of Vacation',
      message: 'Are you sure you want to file a 30-day notice to vacate? This action will notify the landlord and set your move-out date to ${DateTime.now().add(const Duration(days: 30)).toString().substring(0, 10)}.',
      confirmText: 'File Notice',
      cancelText: 'Cancel',
      type: NestAlertType.danger,
      onConfirm: () {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Vacation notice filed successfully. Landlord notified.')),
        );
      },
    );
  }

  void _showPaymentOptions(BuildContext context) {
    if (_activeTenancy == null) return;
    
    final unit = _activeTenancy!['propertyUnit'];
    final property = unit?['property'];
    
    context.push('/payment', extra: {
      'price': _activeTenancy!['monthlyRent']?.toString() ?? '0',
      'propertyUnitId': unit?['id'] ?? '',
      'propertyName': property?['name'] ?? 'The Azure Commons',
      'propertyAddress': property?['address'] ?? 'Bungoma',
      'propertyImage': (property?['images'] != null && property!['images'].isNotEmpty) ? property!['images'][0] : null,
      'isTenancyPayment': true,
      'tenancyId': _activeTenancy!['id'],
      'unitName': _activeTenancy!['unitName'],
    });
  }

  Widget _buildQuickStat(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.outfit(color: const Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
        const SizedBox(height: 4),
        Text(value, style: GoogleFonts.outfit(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildPaymentSection(ColorScheme colorScheme, bool isDark) {
    final payments = (_activeTenancy?['payments'] as List?) ?? [];
    // Show last 3 payments
    final recentPayments = payments.take(3).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Recent Payments', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
            TextButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const PaymentArchiveScreen())),
              child: Text('View Archive', style: GoogleFonts.outfit(color: colorScheme.primary, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (recentPayments.isEmpty)
          _buildPaymentItem('Monthly Rent', 'Next Rent Cycle', _activeTenancy?['propertyUnit']?['price']?.toString() ?? '0', false, colorScheme, status: 'PENDING')
        else
          ...recentPayments.map((p) => _buildPaymentItem(
            'Rent Payment', 
            DateFormat('MMMM yyyy').format(DateTime.parse(p['dueDate'])), 
            (p['amountPaid'] ?? p['amountDue']).toString(), 
            p['status'] == 'PAID' || p['status'] == 'VERIFIED',
            colorScheme,
            status: p['status']
          )),
      ],
    );
  }

  Widget _buildPaymentItem(String title, String date, String amount, bool isSuccess, ColorScheme colorScheme, {String? status}) {
    Color statusColor = const Color(0xFF10B981);
    if (status == 'PENDING') statusColor = const Color(0xFFF59E0B);
    if (status == 'OVERDUE') statusColor = Colors.red;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: colorScheme.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(16)),
            child: Icon(LucideIcons.receipt, color: colorScheme.primary, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
                Text(date, style: GoogleFonts.outfit(fontSize: 12, color: colorScheme.onSurface.withOpacity(0.5), fontWeight: FontWeight.w500)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('Ksh $amount', style: GoogleFonts.outfit(fontWeight: FontWeight.w900, color: colorScheme.onSurface)),
              Text(status ?? (isSuccess ? 'Success' : 'Failed'), style: GoogleFonts.outfit(fontSize: 10, color: statusColor, fontWeight: FontWeight.w900)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBookingsTab(ColorScheme colorScheme, bool isDark) {
    final pendingBookings = _bookings.where((b) => b['status'] != 'ACTIVE' && b['status'] != 'CONFIRMED').toList();
    
    if (pendingBookings.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.calendar, size: 64, color: colorScheme.onSurface.withOpacity(0.1)),
            const SizedBox(height: 16),
            Text(
              'No booking requests',
              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface.withOpacity(0.6)),
            ),
            Text(
              'Your sent requests will appear here',
              style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.4)),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(24),
      itemCount: pendingBookings.length,
      separatorBuilder: (context, index) => const SizedBox(height: 20),
      itemBuilder: (context, index) {
        final b = pendingBookings[index];
        final unit = b['propertyUnit'];
        final property = unit?['property'];
        
        Color statusColor = const Color(0xFFF59E0B);
        if (b['status'] == 'REJECTED' || b['status'] == 'CANCELLED') statusColor = Colors.red;
        if (b['status'] == 'CONFIRMED' || b['status'] == 'PAID' || b['status'] == 'APPROVED') statusColor = const Color(0xFF16A34A);

        return Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: colorScheme.surface,
            borderRadius: BorderRadius.circular(30),
            border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          property?['name'] ?? 'Unknown Hostel',
                          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w900, color: colorScheme.onSurface),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Requested on ${b['createdAt']?.toString().substring(0, 10) ?? 'Recently'}',
                          style: GoogleFonts.outfit(fontSize: 12, color: colorScheme.onSurface.withOpacity(0.5), fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      b['status'] as String,
                      style: GoogleFonts.outfit(color: statusColor, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.5),
                    ),
                  ),
                ],
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 20),
                child: Divider(color: Colors.white10),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(LucideIcons.banknote, size: 16, color: colorScheme.primary),
                      const SizedBox(width: 8),
                      Text('Ksh ${unit?['price'] ?? '0'}', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
                    ],
                  ),
                  TextButton(
                    onPressed: () => _showBookingDetails(context, b),
                    child: Text('View Details', style: GoogleFonts.outfit(color: colorScheme.primary, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  void _showBookingDetails(BuildContext context, dynamic booking) {
    final unit = booking['propertyUnit'];
    final property = unit?['property'];
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        padding: const EdgeInsets.all(32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 32),
            Text('Booking Details', style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w900, color: const Color(0xFF1E293B))),
            const SizedBox(height: 32),
            _buildDetailRow('Hostel', property?['name'] ?? 'Unknown'),
            _buildDetailRow('Unit Type', unit?['type']?['name'] ?? 'Standard'),
            _buildDetailRow('Status', booking['status'], isStatus: true),
            _buildDetailRow('Rent Amount', 'Ksh ${unit?['price'] ?? '0'}'),
            _buildDetailRow('Request Date', booking['createdAt']?.toString().substring(0, 10) ?? 'N/A'),
            const Spacer(),
            if (booking['status'] == 'PENDING')
              SizedBox(
                width: double.infinity,
                height: 56,
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(context),
                  style: OutlinedButton.styleFrom(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    side: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  child: Text('Cancel Request', style: GoogleFonts.outfit(color: Colors.red, fontWeight: FontWeight.bold)),
                ),
              ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1E293B),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('Close', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {bool isStatus = false}) {
    Color valColor = const Color(0xFF1E293B);
    if (isStatus) {
      if (value == 'APPROVED' || value == 'CONFIRMED' || value == 'ACTIVE') valColor = const Color(0xFF10B981);
      if (value == 'REJECTED' || value == 'CANCELLED') valColor = Colors.red;
      if (value == 'PENDING') valColor = const Color(0xFFF59E0B);
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.outfit(color: const Color(0xFF64748B), fontWeight: FontWeight.bold, fontSize: 14)),
          Text(value, style: GoogleFonts.outfit(color: valColor, fontWeight: FontWeight.w900, fontSize: 14)),
        ],
      ),
    );
  }
}
