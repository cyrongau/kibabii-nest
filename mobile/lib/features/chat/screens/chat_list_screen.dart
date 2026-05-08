import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../services/api_service.dart';

class ChatListScreen extends StatefulWidget {
  final String? marketplaceItemId;
  final String? initialCategory;

  const ChatListScreen({
    super.key, 
    this.marketplaceItemId,
    this.initialCategory,
  });

  @override
  State<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  final ApiService _api = ApiService();
  bool _isLoading = true;
  List<dynamic> _conversations = [];
  List<dynamic> _searchResults = [];
  bool _isSearching = false;
  final TextEditingController _searchController = TextEditingController();

  String? _currentUserId;

  @override
  void initState() {
    super.initState();
    _loadConversations();
  }

  Future<void> _loadConversations() async {
    setState(() => _isLoading = true);
    try {
      final id = await _api.currentUserId;
      List<dynamic> conversations = await _api.getConversations();
      
      // Filter by marketplaceItemId if provided
      if (widget.marketplaceItemId != null) {
        conversations = conversations.where((c) => 
          c['marketplaceItemId'] == widget.marketplaceItemId
        ).toList();
      }

      setState(() {
        _currentUserId = id;
        _conversations = conversations;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _onSearch(String query) async {
    if (query.length < 2) {
      setState(() {
        _searchResults = [];
        _isSearching = false;
      });
      return;
    }

    setState(() => _isSearching = true);
    try {
      final results = await _api.searchUsers(query);
      setState(() {
        _searchResults = results;
        _isSearching = false;
      });
    } catch (e) {
      setState(() => _isSearching = false);
    }
  }

  void _startChat(Map<String, dynamic> user) async {
    // Check if we already have a conversation with this user
    final existingConv = _conversations.firstWhere(
      (c) => (c['participants'] as List).any((p) => p['id'] == user['id']),
      orElse: () => null,
    );

    if (existingConv != null) {
      context.push('/chat', extra: {
        'conversationId': existingConv['id'],
        'otherUserId': user['id'],
        'otherUserName': user['name'],
        'otherUserAvatar': user['avatar'],
        'isSupportChat': existingConv['ticketId'] != null,
      });
    } else {
      // Create or get conversation
      final conv = await _api.getOrCreateConversation(user['id']);
      if (conv != null) {
        context.push('/chat', extra: {
          'conversationId': conv['id'],
          'otherUserId': user['id'],
          'otherUserName': user['name'],
          'otherUserAvatar': user['avatar'],
          'isSupportChat': false,
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return DefaultTabController(
      length: 4,
      child: Scaffold(
        backgroundColor: colorScheme.background,
        appBar: AppBar(
          backgroundColor: colorScheme.surface,
          elevation: 0,
          leading: IconButton(
            icon: Icon(LucideIcons.chevronLeft, color: colorScheme.onSurface),
            onPressed: () => Navigator.pop(context),
          ),
          title: Text(
            'Messages',
            style: GoogleFonts.outfit(
              color: colorScheme.onSurface, 
              fontWeight: FontWeight.bold
            ),
          ),
          bottom: TabBar(
            isScrollable: true,
            indicatorColor: colorScheme.primary,
            indicatorWeight: 3,
            labelColor: colorScheme.primary,
            unselectedLabelColor: colorScheme.onSurface.withOpacity(0.4),
            labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13),
            tabs: const [
              Tab(text: 'ALL'),
              Tab(text: 'TENANCY'),
              Tab(text: 'MARKETPLACE'),
              Tab(text: 'SUPPORT'),
            ],
          ),
        ),
        body: Column(
          children: [
            _buildSearchBar(),
            Expanded(
              child: TabBarView(
                children: [
                  _buildChatList(_conversations, colorScheme, isDark),
                  _buildChatList(_conversations.where((c) => c['category'] == 'LANDLORD').toList(), colorScheme, isDark),
                  _buildChatList(_conversations.where((c) => c['category'] == 'MARKETPLACE').toList(), colorScheme, isDark),
                  _buildChatList(_conversations.where((c) => c['ticketId'] != null || c['category'] == 'SUPPORT').toList(), colorScheme, isDark),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChatList(List<dynamic> conversations, ColorScheme colorScheme, bool isDark) {
    if (_searchController.text.isNotEmpty) return _buildSearchResults();
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (conversations.isEmpty) return _buildEmptyState();

    return RefreshIndicator(
      onRefresh: _loadConversations,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: conversations.length,
        itemBuilder: (context, index) {
          final conv = conversations[index];
          final participants = (conv['participants'] as List?) ?? [];
          
          // Improved participant resolution to avoid "Unknown"
          final otherUser = participants.firstWhere(
            (p) => p['id'] != _currentUserId,
            orElse: () => participants.isNotEmpty 
                ? participants[0] 
                : {'name': 'User', 'id': 'unknown'},
          );
          final messages = (conv['messages'] as List?) ?? [];
          final lastMessage = messages.isNotEmpty ? messages.last : null;
          final isSupport = conv['ticketId'] != null || conv['category'] == 'SUPPORT';
          final isMarketplace = conv['category'] == 'MARKETPLACE' || conv['category'] == 'INQUIRY';
          final marketplaceItem = conv['marketplaceItem'];

          return GestureDetector(
            onTap: () {
              context.push('/chat', extra: {
                'conversationId': conv['id'],
                'otherUserId': otherUser['id'],
                'otherUserName': isSupport ? 'Official Support' : otherUser['name'],
                'otherUserAvatar': otherUser['avatar'],
                'isSupportChat': isSupport,
              });
            },
            child: Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: colorScheme.surface,
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
              child: Row(
                children: [
                  Stack(
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundColor: isSupport 
                          ? colorScheme.primary 
                          : colorScheme.surfaceVariant.withOpacity(0.3),
                        backgroundImage: otherUser['avatar'] != null ? NetworkImage(otherUser['avatar']) : null,
                        child: otherUser['avatar'] == null 
                          ? Icon(
                              isSupport ? LucideIcons.shieldCheck : LucideIcons.user, 
                              color: isSupport ? Colors.white : colorScheme.onSurface.withOpacity(0.3)
                            )
                          : null,
                      ),
                      if (isSupport)
                        Positioned(
                          bottom: 0, right: 0,
                          child: Container(
                            padding: const EdgeInsets.all(2),
                            decoration: BoxDecoration(
                              color: colorScheme.surface, 
                              shape: BoxShape.circle
                            ),
                            child: Icon(LucideIcons.checkCircle2, color: colorScheme.primary, size: 14),
                          ),
                        ),
                    ],
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
                              child: Text(
                                isSupport ? 'Official Support' : otherUser['name'] ?? 'User',
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.outfit(
                                  fontWeight: FontWeight.bold, 
                                  fontSize: 16, 
                                  color: colorScheme.onSurface
                                ),
                              ),
                            ),
                            if (lastMessage != null)
                              Text(
                                _formatTime(lastMessage['createdAt']),
                                style: GoogleFonts.outfit(
                                  fontSize: 11, 
                                  color: colorScheme.onSurface.withOpacity(0.4)
                                ),
                              ),
                          ],
                        ),
                        // Show product tag if marketplace item is linked, regardless of category
                        if (marketplaceItem != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              'Product: ${marketplaceItem['title']}',
                              style: GoogleFonts.outfit(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: colorScheme.primary,
                              ),
                            ),
                          ),
                        const SizedBox(height: 4),
                        Text(
                          lastMessage?['text'] ?? 'No messages yet',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.outfit(
                            fontSize: 13, 
                            color: colorScheme.onSurface.withOpacity(0.6),
                            fontWeight: lastMessage != null && !lastMessage['isRead'] && lastMessage['senderId'] != _currentUserId ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.05)),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4)),
          ],
        ),
        child: TextField(
          controller: _searchController,
          onChanged: _onSearch,
          style: TextStyle(color: Theme.of(context).colorScheme.onSurface),
          decoration: InputDecoration(
            hintText: 'Search people to chat...',
            hintStyle: TextStyle(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.3)),
            prefixIcon: Icon(LucideIcons.search, size: 20, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.3)),
            suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(
                    icon: Icon(LucideIcons.x, size: 16, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5)),
                    onPressed: () {
                      _searchController.clear();
                      _onSearch('');
                    },
                  )
                : null,
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
          ),
        ),
      ),
    );
  }

  Widget _buildSearchResults() {
    if (_isSearching) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_searchResults.isEmpty) {
      return Center(
        child: Text(
          'No users found',
          style: GoogleFonts.outfit(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.4)),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      itemCount: _searchResults.length,
      itemBuilder: (context, index) {
        final user = _searchResults[index];
        return ListTile(
          onTap: () => _startChat(user),
          contentPadding: const EdgeInsets.all(8),
          leading: CircleAvatar(
            backgroundColor: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.3),
            backgroundImage: user['avatar'] != null ? NetworkImage(user['avatar']) : null,
            child: user['avatar'] == null 
              ? Icon(LucideIcons.user, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.3)) 
              : null,
          ),
          title: Text(
            user['name'] ?? 'User',
            style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface),
          ),
          subtitle: Text(
            user['role'] ?? '',
            style: GoogleFonts.outfit(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.4)),
          ),
          trailing: Icon(LucideIcons.chevronRight, size: 16, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.2)),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface, 
              borderRadius: BorderRadius.circular(32),
              border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.05)),
            ),
            child: Icon(LucideIcons.messageSquare, size: 48, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.1)),
          ),
          const SizedBox(height: 24),
          Text(
            'No messages yet',
            style: GoogleFonts.outfit(
              fontSize: 18, 
              fontWeight: FontWeight.bold, 
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6)
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Your conversations will appear here.',
            style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.4)),
          ),
        ],
      ),
    );
  }

  String _formatTime(String dateStr) {
    final date = DateTime.parse(dateStr);
    final now = DateTime.now();
    if (date.day == now.day && date.month == now.month && date.year == now.year) {
      return '${date.hour}:${date.minute.toString().padLeft(2, '0')}';
    }
    return '${date.day}/${date.month}';
  }
}
