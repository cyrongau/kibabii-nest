import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../../services/api_service.dart';
import '../../../core/widgets/app_modals.dart';

class LandlordServiceRequestsScreen extends StatefulWidget {
  const LandlordServiceRequestsScreen({super.key});

  @override
  State<LandlordServiceRequestsScreen> createState() => _LandlordServiceRequestsScreenState();
}

class _LandlordServiceRequestsScreenState extends State<LandlordServiceRequestsScreen> with SingleTickerProviderStateMixin {
  final ApiService _api = ApiService();
  late TabController _tabController;
  List<dynamic> _requests = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  Future<void> _loadData() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      final requests = await _api.getLandlordServiceRequests();
      if (mounted) {
        setState(() {
          _requests = requests;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading maintenance data: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _updateStatus(String requestId, String status) async {
    AppModals.showLoading(context: context, message: 'Updating status...');
    try {
      final success = await _api.updateServiceRequestStatus(requestId, status);
      if (mounted) Navigator.pop(context); // Dismiss loading

      if (success) {
        AppModals.showSuccess(
          context: context,
          title: 'Success',
          message: 'Service request marked as ${status.replaceAll('_', ' ')}.',
          onConfirm: _loadData,
        );
      } else {
        AppModals.showError(context: context, title: 'Error', message: 'Failed to update request status.');
      }
    } catch (e) {
      if (mounted) Navigator.pop(context);
      AppModals.showError(context: context, title: 'Error', message: e.toString());
    }
  }

  void _showRequestDetails(dynamic request) {
    final property = request['property'] ?? {};
    final status = request['status'] ?? 'PENDING';
    final photos = (request['photos'] as List?) ?? [];

    AppModals.showCustom(
      context: context,
      title: 'Maintenance Request',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildDetailRow('Property', property['name'] ?? property['title'] ?? 'N/A'),
          _buildDetailRow('Unit', request['unitName'] ?? 'TBD'),
          _buildDetailRow('Title', request['title'] ?? 'N/A'),
          const SizedBox(height: 12),
          Text('DESCRIPTION', style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
          const SizedBox(height: 4),
          Text(request['description'] ?? 'No description provided.', style: GoogleFonts.outfit(fontSize: 14)),
          const SizedBox(height: 24),
          if (photos.isNotEmpty) ...[
            Text('PHOTOS', style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
            const SizedBox(height: 12),
            SizedBox(
              height: 120,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: photos.length,
                separatorBuilder: (context, index) => const SizedBox(width: 12),
                itemBuilder: (context, index) => ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.network(photos[index], width: 120, height: 120, fit: BoxFit.cover),
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
          _buildDetailRow('Date', _formatDate(request['createdAt'])),
          _buildDetailRow('Status', status),
          const SizedBox(height: 32),
          if (status == 'PENDING') ...[
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  _updateStatus(request['id'], 'IN_PROGRESS');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('Start Repair', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
              ),
            ),
            const SizedBox(height: 16),
          ] else if (status == 'IN_PROGRESS') ...[
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  _updateStatus(request['id'], 'RESOLVED');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('Mark as Resolved', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.outfit(color: Colors.grey, fontWeight: FontWeight.w600, fontSize: 13)),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              value, 
              textAlign: TextAlign.right,
              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14)
            ),
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
        title: Text('Maintenance Hub', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        bottom: TabBar(
          controller: _tabController,
          labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold),
          tabs: const [
            Tab(text: 'Pending'),
            Tab(text: 'Progress'),
            Tab(text: 'Resolved'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildRequestsList(colorScheme, status: 'PENDING'),
          _buildRequestsList(colorScheme, status: 'IN_PROGRESS'),
          _buildRequestsList(colorScheme, status: 'RESOLVED'),
        ],
      ),
    );
  }

  Widget _buildRequestsList(ColorScheme colorScheme, {required String status}) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    
    final filtered = _requests.where((r) => r['status'] == status).toList();

    if (filtered.isEmpty) {
      return _buildEmptyState(
        'No ${status.toLowerCase().replaceAll('_', ' ')} requests', 
        status == 'RESOLVED' ? LucideIcons.checkCircle2 : LucideIcons.wrench
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.separated(
        padding: const EdgeInsets.all(20),
        itemCount: filtered.length,
        separatorBuilder: (context, index) => const SizedBox(height: 16),
        itemBuilder: (context, index) {
          final request = filtered[index];
          return _buildRequestCard(request, colorScheme);
        },
      ),
    );
  }

  Widget _buildRequestCard(dynamic request, ColorScheme colorScheme) {
    final property = request['property'] ?? {};
    final status = request['status'] ?? 'PENDING';
    final date = request['createdAt'];

    return GestureDetector(
      onTap: () => _showRequestDetails(request),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _getStatusColor(status).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    _getStatusIcon(status),
                    color: _getStatusColor(status),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(request['title'] ?? 'Maintenance', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
                      Text(property['name'] ?? property['title'] ?? 'Property', style: GoogleFonts.outfit(color: Colors.grey, fontSize: 12)),
                    ],
                  ),
                ),
                _StatusBadge(status: status),
              ],
            ),
            const Divider(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Reported Date', style: GoogleFonts.outfit(color: Colors.grey, fontSize: 10)),
                    Text(_formatDate(date), style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 12)),
                  ],
                ),
                Icon(LucideIcons.chevronRight, size: 20, color: colorScheme.primary.withOpacity(0.5)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(String message, IconData icon) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 64, color: Colors.grey.withOpacity(0.3)),
          const SizedBox(height: 16),
          Text(message, style: GoogleFonts.outfit(color: Colors.grey, fontSize: 16)),
        ],
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('MMM d, y • h:mm a').format(date);
    } catch (_) {
      return dateStr;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'RESOLVED': return Colors.green;
      case 'IN_PROGRESS': return Colors.blue;
      default: return Colors.orange;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'RESOLVED': return LucideIcons.check;
      case 'IN_PROGRESS': return LucideIcons.play;
      default: return LucideIcons.wrench;
    }
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color color;
    switch (status) {
      case 'RESOLVED': color = Colors.green; break;
      case 'IN_PROGRESS': color = Colors.blue; break;
      case 'REJECTED': color = Colors.red; break;
      default: color = Colors.orange;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        status.replaceAll('_', ' '),
        style: GoogleFonts.outfit(color: color, fontSize: 10, fontWeight: FontWeight.bold),
      ),
    );
  }
}
