import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../services/api_service.dart';
import '../../../core/utils/image_utils.dart';

class StudyBuddyForumScreen extends StatefulWidget {
  final dynamic post;
  const StudyBuddyForumScreen({super.key, required this.post});

  @override
  State<StudyBuddyForumScreen> createState() => _StudyBuddyForumScreenState();
}

class _StudyBuddyForumScreenState extends State<StudyBuddyForumScreen> {
  final ApiService _api = ApiService();
  final TextEditingController _replyController = TextEditingController();
  bool _isSubmitting = false;
  late dynamic _post;

  @override
  void initState() {
    super.initState();
    _post = widget.post;
  }

  Future<void> _submitReply() async {
    if (_replyController.text.trim().isEmpty) return;
    
    setState(() => _isSubmitting = true);
    try {
      final success = await _api.addStudyReply(
        _post['id'],
        _replyController.text.trim(),
      );
      if (success) {
        _replyController.clear();
        // Refresh post
        final updatedPost = await _api.getStudyPostDetails(_post['id']);
        if (updatedPost != null && mounted) {
          setState(() {
            _post = updatedPost;
          });
        }
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Reply posted!')));
        }
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: colorScheme.background,
      appBar: AppBar(
        backgroundColor: colorScheme.surface,
        elevation: 0,
        leading: IconButton(
          icon: Icon(LucideIcons.chevronLeft, color: colorScheme.onSurface),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Discussion',
          style: GoogleFonts.outfit(color: colorScheme.onSurface, fontWeight: FontWeight.bold),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Author Info
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 20,
                        backgroundImage: _post['author']['avatar'] != null ? NetworkImage(ImageUtils.formatUrl(_post['author']['avatar'])) : null,
                        child: _post['author']['avatar'] == null ? const Icon(LucideIcons.user) : null,
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_post['author']['name'] ?? 'Student', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: colorScheme.onSurface)),
                          Text(_post['faculty'] ?? 'General', style: TextStyle(fontSize: 12, color: colorScheme.onSurface.withOpacity(0.5))),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Text(
                    _post['title'],
                    style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold, color: colorScheme.onSurface),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _post['content'],
                    style: TextStyle(fontSize: 16, color: colorScheme.onSurface.withOpacity(0.7), height: 1.6),
                  ),
                  const SizedBox(height: 32),
                  const Divider(),
                  const SizedBox(height: 16),
                  Text('Replies', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
                  const SizedBox(height: 16),
                  
                  // Mock Replies for now or fetch if available
                  if (_post['replies'] != null && (_post['replies'] as List).isNotEmpty)
                    ...(_post['replies'] as List).map((reply) => _buildReplyCard(reply, colorScheme)).toList()
                  else
                    Center(child: Text('No replies yet', style: TextStyle(color: colorScheme.onSurface.withOpacity(0.3)))),
                ],
              ),
            ),
          ),
          
          // Reply Input
          Container(
            padding: EdgeInsets.only(
              left: 20, right: 20, top: 12, 
              bottom: MediaQuery.of(context).padding.bottom + 12
            ),
            decoration: BoxDecoration(
              color: colorScheme.surface,
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(isDark ? 0.3 : 0.05), blurRadius: 10, offset: const Offset(0, -5))],
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _replyController,
                    style: TextStyle(color: colorScheme.onSurface),
                    decoration: InputDecoration(
                      hintText: 'Add a reply...',
                      hintStyle: TextStyle(color: colorScheme.onSurface.withOpacity(0.3)),
                      filled: true,
                      fillColor: colorScheme.onSurface.withOpacity(0.05),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                IconButton(
                  onPressed: _isSubmitting ? null : _submitReply,
                  icon: Icon(LucideIcons.send, color: _isSubmitting ? colorScheme.onSurface.withOpacity(0.2) : colorScheme.primary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReplyCard(dynamic reply, ColorScheme colorScheme) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 12,
                backgroundImage: reply['author']['avatar'] != null ? NetworkImage(ImageUtils.formatUrl(reply['author']['avatar'])) : null,
                child: reply['author']['avatar'] == null ? const Icon(LucideIcons.user, size: 10) : null,
              ),
              const SizedBox(width: 8),
              Text(reply['author']['name'] ?? 'Student', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: colorScheme.onSurface)),
            ],
          ),
          const SizedBox(height: 12),
          Text(reply['content'], style: TextStyle(fontSize: 14, color: colorScheme.onSurface.withOpacity(0.7))),
        ],
      ),
    );
  }
}
