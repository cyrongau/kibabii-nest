import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/widgets/app_modals.dart';
import '../../../services/api_service.dart';

class MaintenanceHubScreen extends StatefulWidget {
  const MaintenanceHubScreen({super.key});

  @override
  State<MaintenanceHubScreen> createState() => _MaintenanceHubScreenState();
}

class _MaintenanceHubScreenState extends State<MaintenanceHubScreen> {
  final ApiService _api = ApiService();
  List<dynamic> _requests = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadRequests();
  }

  Future<void> _loadRequests() async {
    setState(() => _isLoading = true);
    try {
      final requests = await _api.getTenantServiceRequests();
      setState(() {
        _requests = requests;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error loading maintenance requests: $e');
      setState(() => _isLoading = false);
    }
  }

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
      body: _isLoading 
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadRequests,
              child: ListView(
                padding: const EdgeInsets.all(24),
                children: [
                  _buildMaintenanceSummaryCard(),
                  const SizedBox(height: 32),
                  Text('Recent Requests', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                  const SizedBox(height: 16),
                  if (_requests.isEmpty)
                    _buildEmptyState()
                  else
                    ..._requests.map((req) => _buildRequestItem(
                      req['title'] ?? 'No Title',
                      req['priority'] ?? 'MEDIUM',
                      req['status'] ?? 'PENDING',
                      _formatDate(req['createdAt']),
                      _getStatusColor(req['status']),
                    )).toList(),
                ],
              ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showReportIssueSheet(context),
        backgroundColor: const Color(0xFF3B82F6),
        icon: const Icon(LucideIcons.plus, color: Colors.white),
        label: Text('Report Issue', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(40),
      child: Column(
        children: [
          Icon(LucideIcons.wrench, size: 48, color: Colors.grey.withOpacity(0.3)),
          const SizedBox(height: 16),
          Text('No maintenance requests yet', style: GoogleFonts.outfit(color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildMaintenanceSummaryCard() {
    final pendingCount = _requests.where((r) => r['status'] == 'PENDING').length;
    final inProgressCount = _requests.where((r) => r['status'] == 'IN_PROGRESS').length;

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
          Text('$pendingCount Pending', style: GoogleFonts.outfit(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900)),
          const SizedBox(height: 24),
          Row(
            children: [
              _buildSmallStat('IN PROGRESS', inProgressCount.toString()),
              const SizedBox(width: 24),
              _buildSmallStat('RESOLVED', _requests.where((r) => r['status'] == 'RESOLVED').length.toString()),
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

  Widget _buildRequestItem(String title, String priority, String status, String time, Color statusColor) {
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
            child: Icon(_getPriorityIcon(priority), color: statusColor, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                Text('$priority • $time', style: GoogleFonts.outfit(fontSize: 12, color: const Color(0xFF64748B))),
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

  IconData _getPriorityIcon(String priority) {
    switch (priority.toUpperCase()) {
      case 'HIGH': return LucideIcons.alertTriangle;
      case 'MEDIUM': return LucideIcons.wrench;
      case 'LOW': return LucideIcons.info;
      default: return LucideIcons.helpCircle;
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING': return Colors.orange;
      case 'IN_PROGRESS': return Colors.blue;
      case 'RESOLVED': return Colors.green;
      case 'CANCELLED': return Colors.grey;
      default: return Colors.blue;
    }
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('MMM d, h:mm a').format(date);
    } catch (_) {
      return dateStr;
    }
  }

  void _showReportIssueSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _ReportIssueSheet(onSuccess: _loadRequests),
    );
  }
}

class _ReportIssueSheet extends StatefulWidget {
  final VoidCallback onSuccess;
  const _ReportIssueSheet({required this.onSuccess});

  @override
  State<_ReportIssueSheet> createState() => _ReportIssueSheetState();
}

class _ReportIssueSheetState extends State<_ReportIssueSheet> {
  final ApiService _api = ApiService();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  String _selectedPriority = 'MEDIUM';
  String? _selectedPropertyId;
  List<dynamic> _tenancies = [];
  bool _isLoadingProps = true;

  @override
  void initState() {
    super.initState();
    _loadProperties();
  }

  Future<void> _loadProperties() async {
    try {
      final tenancies = await _api.getMyTenancies();
      setState(() {
        _tenancies = tenancies;
        if (_tenancies.isNotEmpty) {
          _selectedPropertyId = _tenancies[0]['propertyUnit']?['propertyId'];
        }
        _isLoadingProps = false;
      });
    } catch (e) {
      debugPrint('Error loading tenancies for maintenance: $e');
      setState(() => _isLoadingProps = false);
    }
  }

  Future<void> _submit() async {
    if (_titleController.text.isEmpty || _selectedPropertyId == null) {
      AppModals.showError(context: context, title: 'Missing Info', message: 'Please provide a title and select a property.');
      return;
    }

    AppModals.showLoading(context: context, message: 'Submitting request...');
    try {
      final success = await _api.createServiceRequest(
        propertyId: _selectedPropertyId!,
        title: _titleController.text,
        description: _descriptionController.text,
        priority: _selectedPriority,
      );
      
      if (mounted) Navigator.pop(context); // Dismiss loading

      if (success) {
        if (mounted) Navigator.pop(context); // Dismiss sheet
        widget.onSuccess();
        AppModals.showSuccess(
          context: context,
          title: 'Submitted!',
          message: 'Maintenance request submitted successfully! Your landlord will be notified.',
        );
      } else {
        AppModals.showError(context: context, title: 'Error', message: 'Failed to submit request.');
      }
    } catch (e) {
      if (mounted) Navigator.pop(context);
      AppModals.showError(context: context, title: 'Error', message: e.toString());
    }
  }

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
            
            if (_isLoadingProps)
              const Center(child: CircularProgressIndicator())
            else if (_tenancies.isEmpty)
              Text('You have no active tenancies to report issues for.', style: GoogleFonts.outfit(color: Colors.red))
            else ...[
              Text('Select Property', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF64748B))),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFF1F5F9)),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedPropertyId,
                    isExpanded: true,
                    items: _tenancies.map((t) => DropdownMenuItem(
                      value: t['propertyUnit']?['propertyId'] as String,
                      child: Text(t['propertyUnit']?['property']?['name'] ?? 'Property'),
                    )).toList(),
                    onChanged: (val) => setState(() => _selectedPropertyId = val),
                  ),
                ),
              ),
              const SizedBox(height: 20),
            ],

            _buildTextField('Issue Title', 'e.g. Broken Light Bulb', LucideIcons.edit3, controller: _titleController),
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

            _buildTextField('Description', 'Tell us more about the problem...', LucideIcons.alignLeft, maxLines: 3, controller: _descriptionController),
            const SizedBox(height: 32),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _submit,
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

  Widget _buildTextField(String label, String hint, IconData icon, {int maxLines = 1, required TextEditingController controller}) {
    return TextField(
      controller: controller,
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
