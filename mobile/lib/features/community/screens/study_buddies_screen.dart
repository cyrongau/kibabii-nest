import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'study_buddy_forum_screen.dart';
import '../../../services/api_service.dart';

class StudyBuddiesScreen extends StatefulWidget {
  const StudyBuddiesScreen({super.key});

  @override
  State<StudyBuddiesScreen> createState() => _StudyBuddiesScreenState();
}

class _StudyBuddiesScreenState extends State<StudyBuddiesScreen> {
  final ApiService _api = ApiService();
  bool _isLoading = false;
  List<dynamic> _posts = [];
  String? _selectedFaculty;

  final List<String> _faculties = [
    'Science & Computing',
    'Education',
    'Business & Economics',
    'Arts & Social Sciences',
    'Engineering',
    'Health Sciences',
    'Agriculture',
  ];

  @override
  void initState() {
    super.initState();
    _fetchPosts();
  }

  Future<void> _fetchPosts() async {
    setState(() => _isLoading = true);
    try {
      final posts = await _api.getStudyPosts(faculty: _selectedFaculty);
      setState(() => _posts = posts);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
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
          'Study Buddies',
          style: GoogleFonts.outfit(
            color: Theme.of(context).colorScheme.onSurface, 
            fontWeight: FontWeight.bold
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(LucideIcons.messageSquare, color: Theme.of(context).colorScheme.primary),
            onPressed: () => _showCreatePostDialog(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Faculty Filter
          Container(
            color: Theme.of(context).colorScheme.surface,
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: SizedBox(
              height: 40,
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: _faculties.length + 1,
                itemBuilder: (context, index) {
                  final fac = index == 0 ? null : _faculties[index - 1];
                  final isSelected = _selectedFaculty == fac;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(fac ?? 'All Faculty'),
                      selected: isSelected,
                      onSelected: (val) {
                        setState(() => _selectedFaculty = val ? fac : null);
                        _fetchPosts();
                      },
                      selectedColor: Theme.of(context).colorScheme.primary,
                      backgroundColor: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.3),
                      labelStyle: TextStyle(
                        color: isSelected 
                          ? Colors.white 
                          : Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        fontSize: 12,
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          
          // Posts List
          Expanded(
            child: _isLoading 
              ? const Center(child: CircularProgressIndicator())
              : _posts.isEmpty
                ? _buildEmptyState()
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _posts.length,
                    itemBuilder: (context, index) {
                      final post = _posts[index];
                      return _buildPostCard(post);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildPostCard(dynamic post) {
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
              CircleAvatar(
                radius: 16,
                backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                backgroundImage: post['author']['avatar'] != null ? NetworkImage(post['author']['avatar']) : null,
                child: post['author']['avatar'] == null 
                  ? Icon(LucideIcons.user, size: 14, color: Theme.of(context).colorScheme.primary) 
                  : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      post['author']['name'] ?? 'Student', 
                      style: TextStyle(
                        fontWeight: FontWeight.bold, 
                        fontSize: 14,
                        color: Theme.of(context).colorScheme.onSurface
                      )
                    ),
                    Text(
                      post['faculty'] ?? 'General', 
                      style: TextStyle(
                        fontSize: 10, 
                        color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5)
                      )
                    ),
                  ],
                ),
              ),
              Icon(LucideIcons.moreHorizontal, size: 18, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.4)),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            post['title'],
            style: GoogleFonts.outfit(
              fontWeight: FontWeight.bold, 
              fontSize: 16, 
              color: Theme.of(context).colorScheme.onSurface
            ),
          ),
          const SizedBox(height: 8),
          Text(
            post['content'],
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 14, 
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6), 
              height: 1.5
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              _buildStat(LucideIcons.messageCircle, '${post['_count']['replies']} replies'),
              const SizedBox(width: 16),
              _buildStat(LucideIcons.tag, post['tags']?.isNotEmpty == true ? post['tags'][0] : 'Discussion'),
              const Spacer(),
              TextButton(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => StudyBuddyForumScreen(post: post)),
                ),
                child: Text(
                  'View Forum', 
                  style: TextStyle(
                    fontWeight: FontWeight.bold, 
                    color: Theme.of(context).colorScheme.primary
                  )
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStat(IconData icon, String label) {
    return Row(
      children: [
        Icon(icon, size: 14, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.4)),
        const SizedBox(width: 4),
        Text(
          label, 
          style: TextStyle(
            fontSize: 12, 
            color: Theme.of(context).colorScheme.onSurface.withOpacity(0.4)
          )
        ),
      ],
    );
  }

  void _showCreatePostDialog() {
    final titleController = TextEditingController();
    final contentController = TextEditingController();
    String? faculty = _faculties.first;
    bool isSaving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          height: MediaQuery.of(context).size.height * 0.75,
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          ),
          padding: EdgeInsets.only(
            top: 24, left: 24, right: 24,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Start Discussion', 
                      style: GoogleFonts.outfit(
                        fontSize: 24, 
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.onSurface
                      )
                    ),
                    IconButton(
                      icon: Icon(LucideIcons.x, color: Theme.of(context).colorScheme.onSurface), 
                      onPressed: () => Navigator.pop(context)
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                _buildFieldLabel('Topic Title'),
                TextField(
                  controller: titleController,
                  style: TextStyle(color: Theme.of(context).colorScheme.onSurface),
                  decoration: _inputDecoration('e.g. Best resources for Calculus II'),
                ),
                const SizedBox(height: 16),
                _buildFieldLabel('Faculty'),
                DropdownButtonFormField<String>(
                  value: faculty,
                  dropdownColor: Theme.of(context).colorScheme.surface,
                  style: TextStyle(color: Theme.of(context).colorScheme.onSurface),
                  items: _faculties.map((f) => DropdownMenuItem(
                    value: f, 
                    child: Text(f, style: const TextStyle(fontSize: 14))
                  )).toList(),
                  onChanged: (val) => setModalState(() => faculty = val),
                  decoration: _inputDecoration(''),
                ),
                const SizedBox(height: 16),
                _buildFieldLabel('Details'),
                TextField(
                  controller: contentController,
                  maxLines: 5,
                  style: TextStyle(color: Theme.of(context).colorScheme.onSurface),
                  decoration: _inputDecoration('Share your thoughts or questions...'),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: isSaving ? null : () async {
                      if (titleController.text.isEmpty || contentController.text.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all fields')));
                        return;
                      }
                      setModalState(() => isSaving = true);
                      final success = await _api.createStudyPost({
                        'title': titleController.text,
                        'content': contentController.text,
                        'faculty': faculty,
                        'tags': ['Discussion'],
                      });
                      setModalState(() => isSaving = false);
                      if (success) {
                        Navigator.pop(context);
                        _fetchPosts();
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Discussion started!')));
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).colorScheme.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: 0,
                    ),
                    child: isSaving 
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Text(
                          'Post Discussion', 
                          style: GoogleFonts.outfit(
                            fontWeight: FontWeight.bold, 
                            fontSize: 16, 
                            color: Colors.white
                          )
                        ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFieldLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        label, 
        style: TextStyle(
          fontWeight: FontWeight.bold, 
          color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6), 
          fontSize: 13
        )
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.3), fontSize: 14),
      filled: true,
      fillColor: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.1),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.users, size: 64, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.2)),
          const SizedBox(height: 16),
          Text(
            'No discussions yet',
            style: GoogleFonts.outfit(
              fontSize: 18, 
              fontWeight: FontWeight.bold, 
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6)
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Be the first to start a conversation!',
            style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.4)),
          ),
        ],
      ),
    );
  }
}
