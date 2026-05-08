import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../services/api_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
  }

  Future<void> _fetchNotifications() async {
    final data = await _apiService.getNotifications();
    if (mounted) {
      setState(() {
        _notifications = data;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text('Notifications', style: GoogleFonts.outfit(color: const Color(0xFF1E293B), fontWeight: FontWeight.bold)),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Color(0xFF1E293B)),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            onPressed: _fetchNotifications,
            icon: const Icon(LucideIcons.refreshCw, size: 18, color: Color(0xFF3B82F6)),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _isLoading 
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty 
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(LucideIcons.bellOff, size: 64, color: Color(0xFFCBD5E1)),
                      const SizedBox(height: 16),
                      Text('No notifications yet', style: GoogleFonts.outfit(color: const Color(0xFF64748B), fontWeight: FontWeight.bold)),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(24),
                  itemCount: _notifications.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final n = _notifications[index];
                    return _buildNotificationCard(n);
                  },
                ),
    );
  }

  Widget _buildNotificationCard(Map<String, dynamic> n) {
    bool isRead = n['isRead'] ?? false;
    return GestureDetector(
      onTap: () async {
        if (!isRead) {
          await _apiService.markNotificationAsRead(n['id']);
          _fetchNotifications();
        }
        if (mounted && n['link'] != null) {
          context.push(n['link'] as String);
        }
      },
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isRead ? Colors.white : const Color(0xFF3B82F6).withOpacity(0.03),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: isRead ? const Color(0xFFF1F5F9) : const Color(0xFF3B82F6).withOpacity(0.1)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _getIconColor(n['type'] as String).withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(_getIcon(n['type'] as String), color: _getIconColor(n['type'] as String), size: 20),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(n['title'] as String, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                      ),
                      if (!isRead)
                        Container(width: 8, height: 8, decoration: const BoxDecoration(color: Color(0xFF3B82F6), shape: BoxShape.circle)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(n['message'] as String, style: GoogleFonts.outfit(fontSize: 13, color: const Color(0xFF64748B), height: 1.4)),
                  const SizedBox(height: 12),
                  Text(_getTimeAgo(n['createdAt']), style: GoogleFonts.outfit(fontSize: 11, color: const Color(0xFF94A3B8), fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getTimeAgo(String? dateStr) {
    if (dateStr == null) return 'Just now';
    try {
      final date = DateTime.parse(dateStr);
      final diff = DateTime.now().difference(date);
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      return '${diff.inDays}d ago';
    } catch (e) {
      return 'Recently';
    }
  }

  IconData _getIcon(String type) {
    switch (type.toLowerCase()) {
      case 'payment': return LucideIcons.checkCircle;
      case 'booking': return LucideIcons.calendarClock;
      case 'maintenance': return LucideIcons.wrench;
      case 'tenancy': return LucideIcons.logOut;
      default: return LucideIcons.bell;
    }
  }

  Color _getIconColor(String type) {
    switch (type.toLowerCase()) {
      case 'payment': return const Color(0xFF10B981);
      case 'booking': return const Color(0xFFF59E0B);
      case 'maintenance': return const Color(0xFF3B82F6);
      case 'tenancy': return Colors.redAccent;
      default: return const Color(0xFF3B82F6);
    }
  }
}
