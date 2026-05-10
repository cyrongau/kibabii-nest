import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../services/api_service.dart';
import '../../../core/widgets/app_modals.dart';

class ApprovalHubScreen extends StatefulWidget {
  final int initialTab;
  const ApprovalHubScreen({super.key, this.initialTab = 0});

  @override
  State<ApprovalHubScreen> createState() => _ApprovalHubScreenState();
}

class _ApprovalHubScreenState extends State<ApprovalHubScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  List<dynamic> _bookings = [];
  List<dynamic> _payments = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this, initialIndex: widget.initialTab);
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        _apiService.getLandlordBookings(),
        _apiService.getLandlordPayments(),
      ]);
      
      if (mounted) {
        setState(() {
          _bookings = results[0].where((b) => b['status'] == 'PENDING').toList();
          _payments = results[1].where((p) => p['status'] == 'PENDING').toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading approval data: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleBooking(String id, bool approve) async {
    AppModals.showLoading(context: context, message: approve ? 'Approving booking...' : 'Rejecting booking...');
    try {
      final success = await _apiService.updateBookingStatus(id, approve ? 'APPROVED' : 'REJECTED');
      if (mounted) {
        Navigator.pop(context); // Close loading
        if (success) {
          AppModals.showSuccess(
            context: context, 
            title: approve ? 'Booking Approved' : 'Booking Rejected',
            message: approve ? 'The student has been notified to proceed with payment.' : 'The booking request has been declined.',
            onConfirm: _loadData,
          );
        } else {
          AppModals.showError(context: context, title: 'Failed', message: 'Could not update booking status.');
        }
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
        AppModals.showError(context: context, title: 'Error', message: e.toString());
      }
    }
  }

  Future<void> _handlePayment(String id, bool approve) async {
    AppModals.showLoading(context: context, message: approve ? 'Verifying payment...' : 'Rejecting payment...');
    try {
      final success = await _apiService.verifyPayment(id, approve);
      if (mounted) {
        Navigator.pop(context); // Close loading
        if (success) {
          AppModals.showSuccess(
            context: context, 
            title: approve ? 'Payment Verified' : 'Payment Rejected',
            message: approve ? 'The payment has been confirmed and receipt generated.' : 'The payment proof was rejected and student notified.',
            onConfirm: _loadData,
          );
        } else {
          AppModals.showError(context: context, title: 'Failed', message: 'Could not verify payment.');
        }
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
        AppModals.showError(context: context, title: 'Error', message: e.toString());
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text('Approvals Hub', style: GoogleFonts.outfit(color: const Color(0xFF1E293B), fontWeight: FontWeight.bold)),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Color(0xFF1E293B)),
          onPressed: () => context.pop(),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF3B82F6),
          labelColor: const Color(0xFF3B82F6),
          unselectedLabelColor: const Color(0xFF94A3B8),
          labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14),
          tabs: const [
            Tab(text: 'BOOKINGS'),
            Tab(text: 'PAYMENTS'),
          ],
        ),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : TabBarView(
            controller: _tabController,
            children: [
              _buildBookingsQueue(),
              _buildPaymentsQueue(),
            ],
          ),
    );
  }

  Widget _buildBookingsQueue() {
    if (_bookings.isEmpty) return _buildEmptyState('No pending bookings', LucideIcons.calendarCheck);
    
    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.separated(
        padding: const EdgeInsets.all(24),
        itemCount: _bookings.length,
        separatorBuilder: (context, index) => const SizedBox(height: 16),
        itemBuilder: (context, index) {
          return _buildBookingApprovalCard(_bookings[index]);
        },
      ),
    );
  }

  Widget _buildBookingApprovalCard(dynamic b) {
    final student = b['student'] ?? {};
    final unit = b['propertyUnit'] ?? {};
    final property = unit['property'] ?? {};

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 24,
                backgroundColor: const Color(0xFFF1F5F9),
                child: Text(
                  (student['name'] ?? 'U')[0].toUpperCase(),
                  style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF3B82F6)),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(student['name'] ?? 'Unknown Student', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
                    Text(student['email'] ?? 'No email provided', style: GoogleFonts.outfit(fontSize: 12, color: const Color(0xFF64748B))),
                  ],
                ),
              ),
            ],
          ),
          const Padding(padding: EdgeInsets.symmetric(vertical: 20), child: Divider(color: Color(0xFFF1F5F9))),
          Text('PROPERTY REQUEST', style: GoogleFonts.outfit(color: const Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
          const SizedBox(height: 8),
          Text('${property['name'] ?? 'Property'} - ${unit['name'] ?? 'Unit'}', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
          const SizedBox(height: 8),
          Text('Duration: ${b['months'] ?? 1} Months • Amount: Ksh ${b['amount'] ?? 0}', style: GoogleFonts.outfit(fontSize: 13, color: const Color(0xFF64748B))),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: _buildQueueBtn('Reject', Colors.redAccent, false, () => _handleBooking(b['id'], false)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildQueueBtn('Approve', const Color(0xFF10B981), true, () => _handleBooking(b['id'], true)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentsQueue() {
    if (_payments.isEmpty) return _buildEmptyState('No pending payments', LucideIcons.banknote);

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.separated(
        padding: const EdgeInsets.all(24),
        itemCount: _payments.length,
        separatorBuilder: (context, index) => const SizedBox(height: 16),
        itemBuilder: (context, index) {
          return _buildPaymentVerificationCard(_payments[index]);
        },
      ),
    );
  }

  Widget _buildPaymentVerificationCard(dynamic p) {
    final student = p['tenancy']?['tenant'] ?? {};
    final createdAt = DateTime.parse(p['createdAt'] ?? DateTime.now().toIso8601String());
    final timeAgo = DateFormat.jm().format(createdAt);

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(color: const Color(0xFF3B82F6).withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                child: Text('MANUAL VERIFICATION', style: GoogleFonts.outfit(color: const Color(0xFF3B82F6), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
              ),
              Text(timeAgo, style: GoogleFonts.outfit(fontSize: 12, color: const Color(0xFF94A3B8))),
            ],
          ),
          const SizedBox(height: 20),
          _buildInfoRow('Amount', 'Ksh ${p['amountPaid'] ?? 0}', isBold: true),
          _buildInfoRow('Reference', p['reference'] ?? 'N/A'),
          _buildInfoRow('Sender', student['name'] ?? 'Unknown'),
          const SizedBox(height: 12),
          if (p['rawText'] != null && p['rawText'].isNotEmpty)
            GestureDetector(
              onTap: () => _showRawProof(context, p['rawText']),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(12)),
                child: Row(
                  children: [
                    const Icon(LucideIcons.fileText, size: 14, color: Color(0xFF64748B)),
                    const SizedBox(width: 8),
                    Text('View Raw Proof (SMS/OCR)', style: GoogleFonts.outfit(fontSize: 12, color: const Color(0xFF64748B), fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ),
          const Padding(padding: EdgeInsets.symmetric(vertical: 20), child: Divider(color: Color(0xFFF1F5F9))),
          Row(
            children: [
              Expanded(
                child: _buildQueueBtn('Reject', Colors.orange, false, () => _handlePayment(p['id'], false)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildQueueBtn('Verify & Approve', const Color(0xFF10B981), true, () => _handlePayment(p['id'], true)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String message, IconData icon) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 48, color: const Color(0xFFCBD5E1)),
          const SizedBox(height: 16),
          Text(message, style: GoogleFonts.outfit(color: const Color(0xFF64748B), fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  void _showRawProof(BuildContext context, String text) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(32),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(40)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Raw Payment Proof', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w900, color: const Color(0xFF1E293B))),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(20)),
              child: Text(
                text,
                style: GoogleFonts.outfit(color: const Color(0xFF334155), height: 1.5, fontSize: 14),
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF3B82F6),
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                ),
                child: Text('Close', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {bool isBold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.outfit(color: const Color(0xFF64748B), fontSize: 14)),
          Text(value, style: GoogleFonts.outfit(fontWeight: isBold ? FontWeight.w900 : FontWeight.bold, fontSize: 14, color: color ?? const Color(0xFF1E293B))),
        ],
      ),
    );
  }

  Widget _buildQueueBtn(String label, Color color, bool isPrimary, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 50,
        decoration: BoxDecoration(
          color: isPrimary ? color : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: isPrimary ? null : Border.all(color: color.withOpacity(0.3)),
        ),
        child: Center(
          child: Text(
            label, 
            style: GoogleFonts.outfit(color: isPrimary ? Colors.white : color, fontWeight: FontWeight.bold),
          ),
        ),
      ),
    );
  }
}
