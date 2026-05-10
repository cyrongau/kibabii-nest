import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../../services/api_service.dart';
import '../../../core/widgets/app_modals.dart';

class LandlordTourManagementScreen extends StatefulWidget {
  const LandlordTourManagementScreen({super.key});

  @override
  State<LandlordTourManagementScreen> createState() => _LandlordTourManagementScreenState();
}

class _LandlordTourManagementScreenState extends State<LandlordTourManagementScreen> with SingleTickerProviderStateMixin {
  final ApiService _api = ApiService();
  late TabController _tabController;
  List<dynamic> _tours = [];
  List<dynamic> _myProperties = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        _api.getLandlordTours(),
        _api.getMyProperties(),
      ]);
      if (mounted) {
        setState(() {
          _tours = results[0];
          _myProperties = results[1];
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading tour data: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _updateStatus(String tourId, String status, {String? feedback}) async {
    AppModals.showLoading(context: context, message: 'Updating status...');
    try {
      final success = await _api.updateTourStatus(tourId, status, feedback: feedback);
      if (mounted) Navigator.pop(context); // Dismiss loading

      if (success) {
        AppModals.showSuccess(
          context: context,
          title: 'Success',
          message: 'Tour status updated to ${status.toLowerCase()}.',
          onConfirm: _loadData,
        );
      } else {
        AppModals.showError(context: context, title: 'Error', message: 'Failed to update tour status.');
      }
    } catch (e) {
      if (mounted) Navigator.pop(context);
      AppModals.showError(context: context, title: 'Error', message: e.toString());
    }
  }

  void _showTourDetails(dynamic tour) {
    final student = tour['student'] ?? {};
    final property = tour['property'] ?? {};
    final status = tour['status'] ?? 'PENDING';

    AppModals.showCustom(
      context: context,
      title: 'Tour Details',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildDetailRow('Property', property['name'] ?? 'N/A'),
          _buildDetailRow('Student', student['name'] ?? 'N/A'),
          _buildDetailRow('Email', student['email'] ?? 'N/A'),
          _buildDetailRow('Date', _formatDate(tour['tourDate'])),
          _buildDetailRow('Status', status),
          if (tour['feedback'] != null) _buildDetailRow('Landlord Note', tour['feedback']),
          const SizedBox(height: 32),
          if (status == 'PENDING') ...[
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      _updateStatus(tour['id'], 'REJECTED');
                    },
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.red),
                      foregroundColor: Colors.red,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: const Text('Decline'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      _showConfirmationDialog(tour['id']);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: const Text('Confirm'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ],
      ),
    );
  }

  void _showConfirmationDialog(String tourId) {
    final feedbackController = TextEditingController();
    AppModals.showCustom(
      context: context,
      title: 'Confirm Tour',
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('Add a message or instructions for the student (optional):', style: GoogleFonts.outfit(fontSize: 14)),
          const SizedBox(height: 16),
          TextField(
            controller: feedbackController,
            style: GoogleFonts.outfit(),
            decoration: InputDecoration(
              hintText: 'e.g. Please call me when you arrive.',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
            maxLines: 3,
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 54,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                _updateStatus(tourId, 'APPROVED', feedback: feedbackController.text);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text('Confirm Tour', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.outfit(color: Colors.grey, fontWeight: FontWeight.w600, fontSize: 14)),
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
        title: Text('Tour Management', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        bottom: TabBar(
          controller: _tabController,
          labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold),
          tabs: const [
            Tab(text: 'Requests'),
            Tab(text: 'Schedule'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildRequestsTab(colorScheme),
          _buildScheduleTab(colorScheme),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateOpenDayModal,
        icon: const Icon(LucideIcons.plus),
        label: Text('Create Open Day', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildRequestsTab(ColorScheme colorScheme) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    
    final pendingTours = _tours.where((t) => t['status'] == 'PENDING').toList();

    if (pendingTours.isEmpty) {
      return _buildEmptyState('No pending requests', LucideIcons.calendarX);
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.separated(
        padding: const EdgeInsets.all(20),
        itemCount: pendingTours.length,
        separatorBuilder: (context, index) => const SizedBox(height: 16),
        itemBuilder: (context, index) {
          final tour = pendingTours[index];
          return _buildTourCard(tour, colorScheme);
        },
      ),
    );
  }

  Widget _buildScheduleTab(ColorScheme colorScheme) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    
    final scheduledTours = _tours.where((t) => t['status'] != 'PENDING').toList();

    if (scheduledTours.isEmpty) {
      return _buildEmptyState('No scheduled tours', LucideIcons.calendar);
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.separated(
        padding: const EdgeInsets.all(20),
        itemCount: scheduledTours.length,
        separatorBuilder: (context, index) => const SizedBox(height: 16),
        itemBuilder: (context, index) {
          final tour = scheduledTours[index];
          return _buildTourCard(tour, colorScheme);
        },
      ),
    );
  }

  Widget _buildTourCard(dynamic tour, ColorScheme colorScheme) {
    final student = tour['student'] ?? {};
    final property = tour['property'] ?? {};
    final status = tour['status'] ?? 'PENDING';
    final date = tour['tourDate'];

    return GestureDetector(
      onTap: () => _showTourDetails(tour),
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
                CircleAvatar(
                  radius: 24,
                  backgroundColor: colorScheme.primary.withOpacity(0.1),
                  child: Text(
                    (student['name'] ?? 'S')[0].toUpperCase(),
                    style: TextStyle(color: colorScheme.primary, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(student['name'] ?? 'Student', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
                      Text(property['name'] ?? 'Property', style: GoogleFonts.outfit(color: Colors.grey, fontSize: 12)),
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
                    Text('Tour Date', style: GoogleFonts.outfit(color: Colors.grey, fontSize: 10)),
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

  void _showCreateOpenDayModal() {
    if (_myProperties.isEmpty) {
      AppModals.showError(context: context, title: 'No Properties', message: 'You need to have at least one property to create an open day.');
      return;
    }

    String? selectedPropertyId = _myProperties[0]['id'];
    DateTime selectedDate = DateTime.now().add(const Duration(days: 1));
    TimeOfDay startTime = const TimeOfDay(hour: 9, minute: 0);
    TimeOfDay endTime = const TimeOfDay(hour: 17, minute: 0);
    final descriptionController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          height: MediaQuery.of(context).size.height * 0.8,
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          ),
          padding: const EdgeInsets.all(32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Schedule Open Day', style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 24),
              
              Text('SELECT PROPERTY', style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.withOpacity(0.2)),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: selectedPropertyId,
                    isExpanded: true,
                    items: _myProperties.map((p) => DropdownMenuItem(
                      value: p['id'] as String,
                      child: Text(p['name'] ?? 'Unnamed'),
                    )).toList(),
                    onChanged: (val) => setModalState(() => selectedPropertyId = val),
                  ),
                ),
              ),
              
              const SizedBox(height: 24),
              Text('DATE', style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
              const SizedBox(height: 8),
              InkWell(
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: selectedDate,
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 90)),
                  );
                  if (picked != null) setModalState(() => selectedDate = picked);
                },
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey.withOpacity(0.2)),
                  ),
                  child: Row(
                    children: [
                      const Icon(LucideIcons.calendar, size: 20, color: Colors.blue),
                      const SizedBox(width: 12),
                      Text(DateFormat('EEEE, MMM d, y').format(selectedDate), style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('START TIME', style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
                        const SizedBox(height: 8),
                        InkWell(
                          onTap: () async {
                            final picked = await showTimePicker(context: context, initialTime: startTime);
                            if (picked != null) setModalState(() => startTime = picked);
                          },
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.withOpacity(0.2))),
                            child: Text(startTime.format(context), style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('END TIME', style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
                        const SizedBox(height: 8),
                        InkWell(
                          onTap: () async {
                            final picked = await showTimePicker(context: context, initialTime: endTime);
                            if (picked != null) setModalState(() => endTime = picked);
                          },
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.withOpacity(0.2))),
                            child: Text(endTime.format(context), style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 24),
              Text('DESCRIPTION (OPTIONAL)', style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
              const SizedBox(height: 8),
              TextField(
                controller: descriptionController,
                decoration: InputDecoration(
                  hintText: 'e.g. Viewing available units in Block C',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                ),
                maxLines: 2,
              ),
              
              const Spacer(),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    _submitOpenDay(
                      propertyId: selectedPropertyId!,
                      date: selectedDate,
                      startTime: startTime.format(context),
                      endTime: endTime.format(context),
                      description: descriptionController.text,
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: Text('Create Open Day', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submitOpenDay({
    required String propertyId,
    required DateTime date,
    required String startTime,
    required String endTime,
    String? description,
  }) async {
    AppModals.showLoading(context: context, message: 'Scheduling open day...');
    try {
      final result = await _api.createOpenDay(
        propertyId: propertyId,
        date: date,
        startTime: startTime,
        endTime: endTime,
        description: description,
      );
      if (mounted) Navigator.pop(context);

      if (result != null) {
        AppModals.showSuccess(
          context: context,
          title: 'Scheduled!',
          message: 'The open day has been scheduled and interested students have been notified.',
        );
      } else {
        AppModals.showError(context: context, title: 'Error', message: 'Failed to schedule open day.');
      }
    } catch (e) {
      if (mounted) Navigator.pop(context);
      AppModals.showError(context: context, title: 'Error', message: e.toString());
    }
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('MMM d, y • h:mm a').format(date);
    } catch (_) {
      return dateStr;
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
      case 'APPROVED': color = Colors.green; break;
      case 'REJECTED': color = Colors.red; break;
      case 'COMPLETED': color = Colors.blue; break;
      default: color = Colors.orange;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        status,
        style: GoogleFonts.outfit(color: color, fontSize: 10, fontWeight: FontWeight.bold),
      ),
    );
  }
}
