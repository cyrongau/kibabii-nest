import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';

class MaintenanceHubScreen extends StatelessWidget {
  const MaintenanceHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text('Maintenance Hub', style: GoogleFonts.outfit(color: const Color(0xFF1E293B), fontWeight: FontWeight.bold)),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Color(0xFF1E293B)),
          onPressed: () => context.pop(),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          _buildMaintenanceSummaryCard(),
          const SizedBox(height: 32),
          Text('Recent Requests', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
          const SizedBox(height: 16),
          _buildRequestItem('Sink Leakage', 'Plumbing', 'PENDING', '2h ago', Colors.orange),
          _buildRequestItem('Broken Socket', 'Electrical', 'IN_PROGRESS', '1d ago', Colors.blue),
          _buildRequestItem('Door Lock Stuck', 'Security', 'RESOLVED', '3d ago', Colors.green),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showReportIssueSheet(context),
        backgroundColor: const Color(0xFF3B82F6),
        icon: const Icon(LucideIcons.plus, color: Colors.white),
        label: Text('Report Issue', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
      ),
    );
  }

  Widget _buildMaintenanceSummaryCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Active Issues', style: GoogleFonts.outfit(color: Colors.white.withOpacity(0.7), fontWeight: FontWeight.w600)),
              const Icon(LucideIcons.wrench, color: Colors.white24),
            ],
          ),
          const SizedBox(height: 12),
          Text('2 Pending', style: GoogleFonts.outfit(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900)),
          const SizedBox(height: 24),
          Row(
            children: [
              _buildSmallStat('Electrical', '1'),
              const SizedBox(width: 24),
              _buildSmallStat('Plumbing', '1'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSmallStat(String label, String count) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.outfit(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
        Text(count, style: GoogleFonts.outfit(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildRequestItem(String title, String category, String status, String time, Color statusColor) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(16)),
            child: Icon(_getCategoryIcon(category), color: statusColor, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                Text('$category • $time', style: GoogleFonts.outfit(fontSize: 12, color: const Color(0xFF64748B))),
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
              status,
              style: GoogleFonts.outfit(color: statusColor, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.5),
            ),
          ),
        ],
      ),
    );
  }

  IconData _getCategoryIcon(String cat) {
    switch (cat.toLowerCase()) {
      case 'plumbing': return LucideIcons.droplets;
      case 'electrical': return LucideIcons.zap;
      case 'security': return LucideIcons.lock;
      default: return LucideIcons.helpCircle;
    }
  }

  void _showReportIssueSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const _ReportIssueSheet(),
    );
  }
}

class _ReportIssueSheet extends StatefulWidget {
  const _ReportIssueSheet();

  @override
  State<_ReportIssueSheet> createState() => _ReportIssueSheetState();
}

class _ReportIssueSheetState extends State<_ReportIssueSheet> {
  String _selectedPriority = 'MEDIUM';

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, top: 32, left: 32, right: 32),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(40)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 32),
            Text('Report New Issue', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w900, color: const Color(0xFF1E293B))),
            const SizedBox(height: 24),
            
            _buildTextField('Issue Title', 'e.g. Broken Light Bulb', LucideIcons.edit3),
            const SizedBox(height: 20),
            
            Text('Category', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF64748B))),
            const SizedBox(height: 12),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildCategoryChip('Plumbing', LucideIcons.droplets, true),
                  _buildCategoryChip('Electrical', LucideIcons.zap, false),
                  _buildCategoryChip('Furniture', LucideIcons.box, false),
                  _buildCategoryChip('Other', LucideIcons.moreHorizontal, false),
                ],
              ),
            ),
            const SizedBox(height: 24),

            Text('Priority', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF64748B))),
            const SizedBox(height: 12),
            Row(
              children: [
                _buildPriorityBtn('LOW', Colors.green),
                const SizedBox(width: 12),
                _buildPriorityBtn('MEDIUM', Colors.orange),
                const SizedBox(width: 12),
                _buildPriorityBtn('HIGH', Colors.red),
              ],
            ),
            const SizedBox(height: 24),

            _buildTextField('Description', 'Tell us more about the problem...', LucideIcons.alignLeft, maxLines: 3),
            const SizedBox(height: 24),

            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFF1F5F9)),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.camera, color: Color(0xFF3B82F6)),
                  const SizedBox(width: 16),
                  Text('Add Photos (Optional)', style: GoogleFonts.outfit(color: const Color(0xFF3B82F6), fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            const SizedBox(height: 32),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Request submitted successfully!')));
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF3B82F6),
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                ),
                child: Text('Submit Request', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16)),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(String label, String hint, IconData icon, {int maxLines = 1}) {
    return TextField(
      maxLines: maxLines,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: Icon(icon, size: 20),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFFF1F5F9))),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFFF1F5F9))),
      ),
    );
  }

  Widget _buildCategoryChip(String label, IconData icon, bool isSelected) {
    return Container(
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isSelected ? const Color(0xFF3B82F6) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isSelected ? const Color(0xFF3B82F6) : const Color(0xFFF1F5F9)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: isSelected ? Colors.white : const Color(0xFF64748B)),
          const SizedBox(width: 8),
          Text(label, style: GoogleFonts.outfit(color: isSelected ? Colors.white : const Color(0xFF64748B), fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildPriorityBtn(String label, Color color) {
    bool isSelected = _selectedPriority == label;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedPriority = label),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? color : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: isSelected ? color : const Color(0xFFF1F5F9)),
          ),
          child: Center(
            child: Text(
              label, 
              style: GoogleFonts.outfit(color: isSelected ? Colors.white : color, fontSize: 10, fontWeight: FontWeight.w900),
            ),
          ),
        ),
      ),
    );
  }
}
