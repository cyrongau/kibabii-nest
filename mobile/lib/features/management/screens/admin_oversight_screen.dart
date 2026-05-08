import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';

class AdminOversightScreen extends StatefulWidget {
  const AdminOversightScreen({super.key});

  @override
  State<AdminOversightScreen> createState() => _AdminOversightScreenState();
}

class _AdminOversightScreenState extends State<AdminOversightScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text('Admin Oversight', style: GoogleFonts.outfit(color: const Color(0xFF1E293B), fontWeight: FontWeight.bold)),
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
            Tab(text: 'WITHDRAWALS'),
            Tab(text: 'PROPERTIES'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildWithdrawalsQueue(),
          _buildPropertiesQueue(),
        ],
      ),
    );
  }

  Widget _buildWithdrawalsQueue() {
    return ListView.separated(
      padding: const EdgeInsets.all(24),
      itemCount: 2,
      separatorBuilder: (context, index) => const SizedBox(height: 16),
      itemBuilder: (context, index) {
        return _buildWithdrawalApprovalCard();
      },
    );
  }

  Widget _buildWithdrawalApprovalCard() {
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
                decoration: BoxDecoration(color: const Color(0xFF10B981).withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                child: Text('MPESA REQUEST', style: GoogleFonts.outfit(color: const Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
              ),
              Text('5h ago', style: GoogleFonts.outfit(fontSize: 12, color: const Color(0xFF94A3B8))),
            ],
          ),
          const SizedBox(height: 20),
          _buildInfoRow('Amount', 'Ksh 15,200', isBold: true),
          _buildInfoRow('Landlord', 'John Doe'),
          _buildInfoRow('M-Pesa No.', '0712345678'),
          const Padding(padding: EdgeInsets.symmetric(vertical: 20), child: Divider(color: Color(0xFFF1F5F9))),
          Row(
            children: [
              Expanded(
                child: _buildQueueBtn('Reject', Colors.redAccent, false, () {}),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildQueueBtn('Process Payout', const Color(0xFF10B981), true, () {}),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPropertiesQueue() {
    return ListView.separated(
      padding: const EdgeInsets.all(24),
      itemCount: 1,
      separatorBuilder: (context, index) => const SizedBox(height: 16),
      itemBuilder: (context, index) {
        return _buildPropertyApprovalCard();
      },
    );
  }

  Widget _buildPropertyApprovalCard() {
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
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: Container(height: 140, color: const Color(0xFFF1F5F9), child: const Center(child: Icon(LucideIcons.home, size: 48, color: Color(0xFFCBD5E1)))),
          ),
          const SizedBox(height: 20),
          Text('NEW LISTING', style: GoogleFonts.outfit(color: const Color(0xFF3B82F6), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
          const SizedBox(height: 4),
          Text('Kibabii Heights Annex', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
          Text('Owner: Mary Jane • Bungoma', style: GoogleFonts.outfit(fontSize: 12, color: const Color(0xFF64748B))),
          const Padding(padding: EdgeInsets.symmetric(vertical: 20), child: Divider(color: Color(0xFFF1F5F9))),
          Row(
            children: [
              Expanded(
                child: _buildQueueBtn('Reject', Colors.redAccent, false, () {}),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildQueueBtn('Verify Property', const Color(0xFF3B82F6), true, () {}),
              ),
            ],
          ),
        ],
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
