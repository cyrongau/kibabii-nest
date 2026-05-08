import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../../services/api_service.dart';

class KibabiiHubScreen extends StatefulWidget {
  const KibabiiHubScreen({super.key});

  @override
  State<KibabiiHubScreen> createState() => _KibabiiHubScreenState();
}

class _KibabiiHubScreenState extends State<KibabiiHubScreen> {
  final ApiService _api = ApiService();
  bool _isLoading = false;
  List<dynamic> _notices = [];

  @override
  void initState() {
    super.initState();
    _fetchNotices();
  }

  Future<void> _fetchNotices() async {
    setState(() => _isLoading = true);
    try {
      final notices = await _api.getGeneralAnnouncements();
      setState(() => _notices = notices);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.background,
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.surface,
        elevation: 0,
        leading: IconButton(
          icon: Icon(LucideIcons.chevronLeft, color: Theme.of(context).colorScheme.onSurface),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Kibabii Hub',
          style: GoogleFonts.outfit(
            color: Theme.of(context).colorScheme.onSurface, 
            fontWeight: FontWeight.bold
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(LucideIcons.refreshCw, size: 20, color: Theme.of(context).colorScheme.onSurface),
            onPressed: _fetchNotices,
          ),
        ],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : _notices.isEmpty
          ? _buildEmptyState()
          : ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: _notices.length,
              itemBuilder: (context, index) {
                final notice = _notices[index];
                return _buildNoticeCard(notice);
              },
            ),
    );
  }

  Widget _buildNoticeCard(dynamic notice) {
    final date = DateTime.parse(notice['createdAt']);
    final formattedDate = DateFormat('MMM dd, yyyy • hh:mm a').format(date);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.3 : 0.02), 
            blurRadius: 10, 
            offset: const Offset(0, 4)
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(LucideIcons.megaphone, color: Theme.of(context).colorScheme.primary, size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      notice['title'] ?? 'Announcement',
                      style: TextStyle(
                        fontWeight: FontWeight.bold, 
                        fontSize: 16,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                    ),
                    Text(
                      formattedDate,
                      style: TextStyle(
                        fontSize: 11, 
                        color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5)
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            notice['content'] ?? '',
            style: TextStyle(
              fontSize: 14, 
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.8), 
              height: 1.5
            ),
          ),
          if (notice['property'] != null) ...[
            const SizedBox(height: 16),
            Divider(color: Theme.of(context).dividerColor.withOpacity(0.1)),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(LucideIcons.home, size: 14, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6)),
                const SizedBox(width: 6),
                Text(
                  'From: ${notice['property']['name']}',
                  style: TextStyle(
                    fontSize: 12, 
                    fontWeight: FontWeight.bold, 
                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6)
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.bellOff, size: 64, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.2)),
          const SizedBox(height: 16),
          Text(
            'No announcements yet',
            style: GoogleFonts.outfit(
              fontSize: 18, 
              fontWeight: FontWeight.bold, 
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6)
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Important updates will appear here.',
            style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.4)),
          ),
        ],
      ),
    );
  }
}
