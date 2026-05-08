import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';

class ApprovalHubScreen extends StatefulWidget {
  final int initialTab;
  const ApprovalHubScreen({super.key, this.initialTab = 0});

  @override
  State<ApprovalHubScreen> createState() => _ApprovalHubScreenState();
}

class _ApprovalHubScreenState extends State<ApprovalHubScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this, initialIndex: widget.initialTab);
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
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildBookingsQueue(),
          _buildPaymentsQueue(),
        ],
      ),
    );
  }

  Widget _buildBookingsQueue() {
    return ListView.separated(
      padding: const EdgeInsets.all(24),
      itemCount: 3,
      separatorBuilder: (context, index) => const SizedBox(height: 16),
      itemBuilder: (context, index) {
        return _buildBookingApprovalCard();
      },
    );
  }

  Widget _buildBookingApprovalCard() {
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
              const CircleAvatar(
                radius: 24,
                backgroundColor: Color(0xFFF1F5F9),
                child: Icon(LucideIcons.user, color: Color(0xFF3B82F6)),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Kelvin Mwangi', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
                    Text('BSc. Computer Science • Year 2', style: GoogleFonts.outfit(fontSize: 12, color: const Color(0xFF64748B))),
                  ],
                ),
              ),
              const Icon(LucideIcons.chevronRight, color: Color(0xFFCBD5E1), size: 20),
            ],
          ),
          const Padding(padding: EdgeInsets.symmetric(vertical: 20), child: Divider(color: Color(0xFFF1F5F9))),
          Text('PROPERTY REQUEST', style: GoogleFonts.outfit(color: const Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
          const SizedBox(height: 8),
          Text('The Azure Commons - Room B-204', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: _buildQueueBtn('Reject', Colors.redAccent, false, () {}),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildQueueBtn('Approve', const Color(0xFF10B981), true, () {}),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentsQueue() {
    return ListView.separated(
      padding: const EdgeInsets.all(24),
      itemCount: 2,
      separatorBuilder: (context, index) => const SizedBox(height: 16),
      itemBuilder: (context, index) {
        return _buildPaymentVerificationCard();
      },
    );
  }

  Widget _buildPaymentVerificationCard() {
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
                child: Text('NEST-AI VERIFIED', style: GoogleFonts.outfit(color: const Color(0xFF3B82F6), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
              ),
              Text('2 min ago', style: GoogleFonts.outfit(fontSize: 12, color: const Color(0xFF94A3B8))),
            ],
          ),
          const SizedBox(height: 20),
          _buildInfoRow('Amount', 'Ksh 4,500', isBold: true),
          _buildInfoRow('Reference', 'PGE5T8X2W3'),
          _buildInfoRow('Sender', 'Kelvin Mwangi'),
          _buildInfoRow('Confidence', '98%', color: const Color(0xFF10B981)),
          const SizedBox(height: 12),
          GestureDetector(
            onTap: () => _showRawProof(context, 'MPESA: Confirmed. Ksh 4,500.00 sent to Kibabii Nest. Ref: PGE5T8X2W3 on 04/05/2026 at 10:15AM.'),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(12)),
              child: Row(
                children: [
                  const Icon(LucideIcons.fileText, size: 14, color: Color(0xFF64748B)),
                  const SizedBox(width: 8),
                  Text('View Raw Proof (SMS)', style: GoogleFonts.outfit(fontSize: 12, color: const Color(0xFF64748B), fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ),
          const Padding(padding: EdgeInsets.symmetric(vertical: 20), child: Divider(color: Color(0xFFF1F5F9))),
          Row(
            children: [
              Expanded(
                child: _buildQueueBtn('Flag Issue', Colors.orange, false, () {}),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildQueueBtn('Verify & Post', const Color(0xFF10B981), true, () {}),
              ),
            ],
          ),
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
