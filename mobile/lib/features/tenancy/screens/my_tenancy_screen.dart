import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../services/api_service.dart';
import 'package:intl/intl.dart';
import '../../profile/screens/docs_hub_screen.dart';
import 'package:kibabii_nest/features/tenancy/screens/digital_agreement_screen.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../chat/screens/chat_screen.dart';
import '../../../core/widgets/app_modals.dart';
import './payment_history_screen.dart';
import 'package:go_router/go_router.dart';
import '../../../core/utils/image_utils.dart';

class MyTenancyScreen extends StatefulWidget {
  const MyTenancyScreen({super.key});

  @override
  State<MyTenancyScreen> createState() => _MyTenancyScreenState();
}

class _MyTenancyScreenState extends State<MyTenancyScreen> {
  final ApiService _api = ApiService();
  Map<String, dynamic>? _tenancy;
  List<dynamic> _announcements = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadTenancy();
  }

  Future<void> _loadTenancy() async {
    try {
      final tenancies = await _api.getMyTenancies();
      final announcements = await _api.getAnnouncements();
      if (mounted) {
        setState(() {
          _tenancy = tenancies.isNotEmpty ? tenancies[0] : null;
          _announcements = announcements;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _calculateNextDueDate() {
    if (_tenancy == null) return 'N/A';
    
    final payments = (_tenancy!['payments'] as List?) ?? [];
    final paidPayments = payments.where((p) => p['status'] == 'PAID' || p['status'] == 'VERIFIED' || p['status'] == 'SUBMITTED').toList();
    
    final deadlineDay = _tenancy!['paymentDeadlineDay'] ?? 5;
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
    
    // If the next month is already paid (rare but possible if logic changes), 
    // we would ideally iterate, but this handles the current case where 
    // each record is one month.
    
    return DateFormat('d MMM').format(nextDue);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    if (_isLoading) {
      return Scaffold(
        backgroundColor: colorScheme.background,
        body: Center(child: CircularProgressIndicator(color: colorScheme.primary))
      );
    }

    if (_tenancy == null) {
      return Scaffold(
        backgroundColor: colorScheme.background,
        appBar: AppBar(
          title: Text('My Tenancy', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
          backgroundColor: colorScheme.surface,
          elevation: 0,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(LucideIcons.home, size: 64, color: colorScheme.onSurface.withOpacity(0.1)),
              const SizedBox(height: 16),
              Text(
                'No active tenancy found',
                style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface.withOpacity(0.6)),
              ),
              const SizedBox(height: 8),
              Text(
                'Once your booking is approved, your tenancy will appear here.',
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.4)),
              ),
            ],
          ),
        ),
      );
    }

    final property = _tenancy!['propertyUnit']['property'];
    final unitType = _tenancy!['propertyUnit']['type'];
    final payments = (_tenancy!['payments'] as List?) ?? [];

    return Scaffold(
      backgroundColor: colorScheme.background,
      appBar: AppBar(
        title: Text('My Tenancy', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
        backgroundColor: colorScheme.surface,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(LucideIcons.messageSquare, color: colorScheme.primary),
            onPressed: () async {
              if (_tenancy == null) return;
              final landlordId = _tenancy!['propertyUnit']['property']['landlordId'];
              if (landlordId == null) return;

              setState(() => _isLoading = true);
              try {
                final conversation = await _api.getOrCreateConversation(
                  landlordId, 
                  category: 'LANDLORD',
                );
                if (conversation != null && mounted) {
                  context.push('/chat', extra: {
                    'conversationId': conversation['id'],
                    'otherUserId': landlordId,
                    'otherUserName': _tenancy!['propertyUnit']['property']['landlord']?['name'] ?? 'Landlord',
                    'otherUserAvatar': ImageUtils.formatUrl(_tenancy!['propertyUnit']['property']['landlord']?['avatar'] ?? ''),
                  });
                }
              } finally {
                if (mounted) setState(() => _isLoading = false);
              }
            },
          ),
          IconButton(
            icon: Icon(LucideIcons.info, color: colorScheme.onSurface.withOpacity(0.5)),
            onPressed: () {},
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadTenancy,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Property Card
              _buildPropertyHeader(property, unitType, colorScheme, isDark),
              const SizedBox(height: 24),

              // 2. Tenancy Status & Details
              _buildStatusCard(colorScheme, isDark),
              const SizedBox(height: 24),

              // 3. Quick Actions
              _buildQuickActions(colorScheme, isDark),
              const SizedBox(height: 32),

              // 4. Payment History
              _buildPaymentHistory(payments, colorScheme, isDark),
              const SizedBox(height: 32),

              // 5. Announcements Placeholder
              _buildAnnouncements(colorScheme, isDark),
              
              const SizedBox(height: 100),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPropertyHeader(dynamic property, dynamic unitType, ColorScheme colorScheme, bool isDark) {
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
                  ? ImageUtils.formatUrl(property['images'][0]) 
                  : 'https://api.kibabii.generexcom.com/uploads/proxy/placeholder/hostel_1.png'),
                fit: BoxFit.cover,
              ),
            ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(property['name'], style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(LucideIcons.mapPin, size: 12, color: Color(0xFF64748B)),
                    const SizedBox(width: 4),
                    Expanded(child: Text(property['address'], style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.6), fontSize: 13, fontWeight: FontWeight.w500), overflow: TextOverflow.ellipsis)),
                  ],
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF3B82F6).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '${unitType['name']} - Unit ${_tenancy!['unitName'] ?? 'TBD'}',
                    style: GoogleFonts.outfit(color: const Color(0xFF3B82F6), fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusCard(ColorScheme colorScheme, bool isDark) {
    final bool isSigned = _tenancy!['signedAt'] != null;
    
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isDark 
            ? [colorScheme.surface, colorScheme.surface.withOpacity(0.8)]
            : [const Color(0xFF1E293B), const Color(0xFF334155)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: isDark ? [] : [
          BoxShadow(color: const Color(0xFF1E293B).withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 10))
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
                  Text(_tenancy!['status'], style: GoogleFonts.outfit(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                ],
              ),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(LucideIcons.checkCircle, color: Colors.greenAccent, size: 24),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Divider(color: Colors.white24),
          const SizedBox(height: 16),
          Row(
            children: [
              _buildStatusInfo('Rent', 'Ksh ${_tenancy!['monthlyRent']}'),
              const Spacer(),
              _buildStatusInfo('Next Due', _calculateNextDueDate()),
              const Spacer(),
              _buildStatusInfo('Agreement', isSigned ? 'Signed' : 'Pending'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusInfo(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.outfit(color: Colors.white.withOpacity(0.5), fontSize: 10, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(value, style: GoogleFonts.outfit(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildQuickActions(ColorScheme colorScheme, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Quick Actions', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(child: _buildActionButton('Repair', LucideIcons.wrench, Colors.orange, colorScheme, () => _showRepairDialog())),
            const SizedBox(width: 12),
            Expanded(child: _buildActionButton('Docs', LucideIcons.folder, colorScheme.primary, colorScheme, () {
              context.push('/docs-hub', extra: {'tenancy': _tenancy});
            })),
            const SizedBox(width: 12),
            Expanded(child: _buildActionButton('Agreement', LucideIcons.fileSignature, const Color(0xFF10B981), colorScheme, () {
              context.push('/digital-agreement', extra: {'tenancy': _tenancy!});
            })),
            const SizedBox(width: 12),
            Expanded(child: _buildActionButton('Vacate', LucideIcons.logOut, Colors.red, colorScheme, () => _showNoticeDialog())),
          ],
        ),
      ],
    );
  }

  Widget _buildActionButton(String label, IconData icon, Color color, ColorScheme colorScheme, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4)),
          ],
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 8),
            Text(label, style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
          ],
        ),
      ),
    );
  }

  void _showRepairDialog() {
    final TextEditingController controller = TextEditingController();
    File? selectedImage;

    AppModals.showCustom(
      context: context,
      title: 'Report a Repair',
      child: StatefulBuilder(
        builder: (context, setDialogState) => Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: controller,
              maxLines: 3,
              style: GoogleFonts.outfit(),
              decoration: InputDecoration(
                hintText: 'Describe the issue (e.g. broken tap)',
                hintStyle: GoogleFonts.outfit(color: Colors.grey),
                filled: true,
                fillColor: Colors.grey[50],
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
            const SizedBox(height: 16),
            GestureDetector(
              onTap: () async {
                final picker = ImagePicker();
                final image = await picker.pickImage(source: ImageSource.camera);
                if (image != null) {
                  setDialogState(() => selectedImage = File(image.path));
                }
              },
              child: Container(
                height: 120,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey[200]!),
                ),
                child: selectedImage != null 
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Image.file(selectedImage!, fit: BoxFit.cover),
                    )
                  : Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(LucideIcons.camera, color: Colors.grey[400]),
                        const SizedBox(height: 4),
                        Text('Take Photo (Optional)', style: GoogleFonts.outfit(fontSize: 12, color: Colors.grey[500])),
                      ],
                    ),
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton(
                onPressed: () async {
                  if (controller.text.isEmpty) return;
                  
                  Navigator.pop(context); // Close custom modal
                  AppModals.showLoading(context: context, message: 'Submitting request...');
                  
                  try {
                    List<String> photos = [];
                    if (selectedImage != null) {
                      final url = await _api.uploadImage(selectedImage!, folder: 'repairs');
                      if (url != null) photos.add(url);
                    }

                    final success = await _api.createServiceRequest(
                      propertyId: _tenancy!['propertyUnit']['property']['id'],
                      title: 'Repair Request',
                      description: controller.text,
                      photos: photos,
                    );
                    
                    if (mounted) Navigator.pop(context); // Close loading

                    if (success && mounted) {
                      AppModals.showSuccess(
                        context: context,
                        title: 'Success!',
                        message: 'Repair request submitted successfully!',
                      );
                    }
                  } catch (e) {
                    if (mounted) {
                      Navigator.pop(context); // Close loading
                      AppModals.showError(
                        context: context,
                        title: 'Error',
                        message: 'Failed to submit request: $e',
                      );
                    }
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF3B82F6),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: const Text('Submit Request', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAgreementModal() {
    bool isSigned = _tenancy!['signedAt'] != null;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.8,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Tenancy Agreement', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Expanded(
              child: SingleChildScrollView(
                child: Text(
                  'This Tenancy Agreement is made between the Landlord and the Tenant for the property at ${_tenancy!['propertyUnit']['property']['address']}.\n\n'
                  '1. Rent: Ksh ${_tenancy!['monthlyRent']} payable monthly.\n'
                  '2. Duration: 12 months renewable.\n'
                  '3. Rules: No loud music after 10 PM. Maintain cleanliness.\n\n'
                  'By signing below, you agree to the terms and conditions of Kibabii Nest.',
                  style: GoogleFonts.outfit(fontSize: 14, height: 1.6),
                ),
              ),
            ),
            const SizedBox(height: 24),
            if (!isSigned)
              SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton(
                      onPressed: () async {
                        try {
                          await _api.signTenancy(_tenancy!['id']);
                          if (mounted) {
                            Navigator.pop(context);
                            _loadTenancy();
                            AppModals.showSuccess(
                              context: context,
                              title: 'Signed!',
                              message: 'Agreement signed successfully!',
                            );
                          }
                        } catch (e) {
                          AppModals.showError(
                            context: context,
                            title: 'Error',
                            message: 'Error signing agreement: $e',
                          );
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: const Text('Sign Digitally', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                    ),
                  ),
                ),
              )
            else
              Center(
                child: SafeArea(
                  top: false,
                  child: Text('Already Signed', style: GoogleFonts.outfit(color: Colors.green, fontWeight: FontWeight.bold)),
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _showNoticeDialog() {
    AppModals.showConfirm(
      context: context,
      title: 'Vacation Notice',
      message: 'Are you sure you want to file a 30-day notice to vacate? This will notify your landlord and start the move-out process.',
      confirmText: 'Confirm Notice',
      cancelText: 'Cancel',
      confirmColor: Colors.red,
      onConfirm: () async {
        AppModals.showLoading(context: context, message: 'Filing notice...');
        try {
          final success = await _api.fileVacationNotice(_tenancy!['id']);
          if (mounted) Navigator.pop(context); // Close loading
          
          if (success && mounted) {
            _loadTenancy();
            AppModals.showInfo(
              context: context,
              title: 'Notice Filed',
              message: 'Notice filed successfully. Your landlord has been notified.',
            );
          }
        } catch (e) {
          if (mounted) {
            Navigator.pop(context); // Close loading
            AppModals.showError(
              context: context,
              title: 'Error',
              message: 'Failed to file notice: $e',
            );
          }
        }
      },
    );
  }

  Widget _buildPaymentHistory(List<dynamic> payments, ColorScheme colorScheme, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Recent Payments', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
            TextButton(
              onPressed: () => context.push('/payment-history', extra: {'payments': payments}),
              child: Text('See All', style: GoogleFonts.outfit(color: colorScheme.primary, fontWeight: FontWeight.bold))
            ),
          ],
        ),
        if (payments.isEmpty)
          Center(child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 20),
            child: Text('No payment history found', style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.3))),
          ))
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: payments.length,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final p = payments[index];
              final isPaid = p['status'] == 'PAID' || p['status'] == 'VERIFIED';
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
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: (isPaid ? const Color(0xFF10B981) : Colors.orange).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        isPaid ? LucideIcons.check : LucideIcons.clock,
                        color: isPaid ? const Color(0xFF10B981) : Colors.orange,
                        size: 16,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Rent Payment', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14, color: colorScheme.onSurface)),
                          Text(DateFormat('MMM dd, yyyy').format(DateTime.parse(p['dueDate'])), style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.4), fontSize: 12)),
                        ],
                      ),
                    ),
                    Text('Ksh ${p['amountPaid'] > 0 ? p['amountPaid'] : p['amountDue']}', style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 14, color: colorScheme.onSurface)),
                  ],
                ),
              );
            },
          ),
      ],
    );
  }

  Widget _buildAnnouncements(ColorScheme colorScheme, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Property Announcements', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w900, color: colorScheme.onSurface)),
        const SizedBox(height: 16),
        if (_announcements.isEmpty)
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: colorScheme.surface,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
            ),
            child: Column(
              children: [
                Icon(LucideIcons.bell, size: 32, color: colorScheme.onSurface.withOpacity(0.1)),
                const SizedBox(height: 12),
                Text(
                  'No new announcements',
                  style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.3), fontWeight: FontWeight.bold),
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
}
