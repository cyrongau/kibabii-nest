import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:emoji_picker_flutter/emoji_picker_flutter.dart' hide Config;
import 'package:emoji_picker_flutter/emoji_picker_flutter.dart' as emoji;
import 'package:flutter/foundation.dart' as foundation;
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../../services/socket_service.dart';
import '../../../services/api_service.dart';
import '../../../services/auth_service.dart';

class ChatScreen extends StatefulWidget {
  final String conversationId;
  final String otherUserId;
  final String otherUserName;
  final String? otherUserAvatar;
  final bool isSupportChat;

  const ChatScreen({
    super.key,
    required this.conversationId,
    required this.otherUserId,
    required this.otherUserName,
    this.otherUserAvatar,
    this.isSupportChat = false,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<Map<String, dynamic>> _messages = [];
  final SocketService _socket = SocketService();
  final ApiService _api = ApiService();
  bool _showEmoji = false;
  bool _isTyping = false;
  String? _currentUserId;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
    _setupSocket();
  }

  void _loadInitialData() async {
    final user = await AuthService().getUser();
    setState(() => _currentUserId = user?['id']);
    
    // Load existing messages from API
    try {
      final messagesData = await _api.getConversationMessages(widget.conversationId);
      if (mounted) {
        setState(() {
          _messages.clear();
          if (messagesData is List) {
            _messages.addAll(messagesData.map((m) => Map<String, dynamic>.from(m)).toList());
          }
        });
        _scrollToBottom();
      }
    } catch (e) {
      debugPrint('Error loading messages: $e');
    }
  }

  void _setupSocket() async {
    await _socket.connect();
    await _socket.joinConversation(widget.conversationId);
    
    _socket.onNewMessage((data) {
      if (mounted) {
        setState(() {
          // Check if message already exists to prevent duplicates from socket/REST race
          final exists = _messages.any((m) => m['id'] == data['id']);
          if (!exists) {
            _messages.add(Map<String, dynamic>.from(data));
          }
        });
        _scrollToBottom();
      }
    });

    _socket.onUserTyping((data) {
      if (mounted && data['userId'] != _currentUserId) {
        setState(() => _isTyping = data['isTyping']);
      }
    });
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _handleSend() async {
    if (_messageController.text.trim().isEmpty) return;

    final text = _messageController.text.trim();
    _messageController.clear();
    _socket.setTyping(widget.conversationId, false);

    final messageData = {
      'conversationId': widget.conversationId,
      'receiverId': widget.otherUserId,
      'text': text,
      'type': 'TEXT',
    };

    // Try socket first (real-time). If not connected, fall back to REST API.
    // The backend REST endpoint also broadcasts via socket, so other participants
    // still receive the message in real-time.
    if (_socket.connected) {
      try {
        await _socket.sendMessage(messageData);
        return;
      } catch (e) {
        debugPrint('Socket send failed, falling back to REST: $e');
      }
    }

    // REST fallback
    try {
      final result = await _api.sendMessageRest(
        receiverId: widget.otherUserId,
        content: text,
      );
      if (result != null && mounted) {
        final exists = _messages.any((m) => m['id'] == result['id']);
        if (!exists) {
          setState(() => _messages.add(Map<String, dynamic>.from(result)));
          _scrollToBottom();
        }
      } else {
        _restoreMessageOnFailure(text);
      }
    } catch (e) {
      debugPrint('REST send also failed: $e');
      _restoreMessageOnFailure(text);
    }
  }

  void _restoreMessageOnFailure(String text) {
    if (mounted) {
      _messageController.text = text;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to send message. Please check your connection.')),
      );
    }
  }

  Future<void> _handleImagePick() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    
    if (image != null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Uploading image...'), duration: Duration(seconds: 2)),
        );
      }

      final url = await _api.uploadImage(File(image.path), folder: 'chats');
      if (url != null) {
        await _socket.sendMessage({
          'conversationId': widget.conversationId,
          'receiverId': widget.otherUserId,
          'mediaUrl': url,
          'type': 'IMAGE',
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Image sent successfully!'), duration: Duration(seconds: 1)),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to upload image.')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      backgroundColor: colorScheme.background,
      appBar: AppBar(
        backgroundColor: colorScheme.surface,
        elevation: 0,
        titleSpacing: 0,
        title: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: colorScheme.primary.withOpacity(0.1),
              backgroundImage: widget.otherUserAvatar != null ? NetworkImage(widget.otherUserAvatar!) : null,
              child: widget.otherUserAvatar == null 
                  ? Text(widget.otherUserName[0], style: TextStyle(color: colorScheme.primary, fontSize: 14, fontWeight: FontWeight.bold))
                  : null,
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.otherUserName,
                  style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: colorScheme.onSurface),
                ),
                if (_isTyping)
                  Text(
                    'typing...',
                    style: TextStyle(fontSize: 11, color: colorScheme.primary, fontWeight: FontWeight.w500),
                  )
                else
                  Text(
                    widget.isSupportChat ? 'Official Support' : 'Online',
                    style: TextStyle(fontSize: 11, color: colorScheme.onSurface.withOpacity(0.5)),
                  ),
              ],
            ),
          ],
        ),
      ),
      body: _currentUserId == null 
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
          Expanded(
            child: _messages.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(LucideIcons.messageSquare, size: 64, color: colorScheme.onSurface.withOpacity(0.1)),
                        const SizedBox(height: 16),
                        Text(
                          'No messages yet',
                          style: GoogleFonts.outfit(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: colorScheme.onSurface.withOpacity(0.3),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Start the conversation!',
                          style: TextStyle(
                            color: colorScheme.onSurface.withOpacity(0.3),
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(20),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final msg = _messages[index];
                      final isMe = msg['senderId'] == _currentUserId;
                      final isAdmin = msg['sender']?['role'] == 'ADMIN';
                      
                      return _ChatBubble(
                        message: msg,
                        isMe: isMe,
                        isAdmin: isAdmin,
                      );
                    },
                  ),
          ),
          _buildInputArea(colorScheme),
          if (_showEmoji)
            SizedBox(
              height: 250,
              child: EmojiPicker(
                onEmojiSelected: (category, em) {
                  _messageController.text += em.emoji;
                },
                config: emoji.Config(
                  emojiViewConfig: emoji.EmojiViewConfig(
                    columns: 7,
                    emojiSizeMax: 32 * (foundation.defaultTargetPlatform == TargetPlatform.iOS ? 1.30 : 1.0),
                    backgroundColor: colorScheme.surface,
                  ),
                  categoryViewConfig: emoji.CategoryViewConfig(
                    indicatorColor: colorScheme.primary,
                    iconColor: Colors.grey,
                    iconColorSelected: colorScheme.primary,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildInputArea(ColorScheme colorScheme) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        border: Border(top: BorderSide(color: colorScheme.onSurface.withOpacity(0.05))),
      ),
      child: SafeArea(
        child: Row(
          children: [
            IconButton(
              icon: Icon(
                _showEmoji ? LucideIcons.keyboard : LucideIcons.smile,
                color: colorScheme.onSurface.withOpacity(0.5),
              ),
              onPressed: () {
                setState(() => _showEmoji = !_showEmoji);
                if (_showEmoji) FocusScope.of(context).unfocus();
              },
            ),
            IconButton(
              icon: Icon(LucideIcons.image, color: colorScheme.onSurface.withOpacity(0.5)),
              onPressed: _handleImagePick,
            ),
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: colorScheme.background,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
                ),
                child: TextField(
                  controller: _messageController,
                  onChanged: (val) {
                    _socket.setTyping(widget.conversationId, val.isNotEmpty);
                  },
                  onTap: () {
                    if (_showEmoji) setState(() => _showEmoji = false);
                  },
                  decoration: const InputDecoration(
                    hintText: 'Type a message...',
                    border: InputBorder.none,
                    hintStyle: TextStyle(fontSize: 14),
                  ),
                  style: const TextStyle(fontSize: 14),
                ),
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: _handleSend,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: colorScheme.primary,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(color: colorScheme.primary.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4)),
                  ],
                ),
                child: const Icon(LucideIcons.send, color: Colors.white, size: 20),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _socket.setTyping(widget.conversationId, false);
    super.dispose();
  }
}

class _ChatBubble extends StatelessWidget {
  final Map<String, dynamic> message;
  final bool isMe;
  final bool isAdmin;

  const _ChatBubble({
    required this.message,
    required this.isMe,
    required this.isAdmin,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final text = message['text'];
    final imageUrl = message['mediaUrl'];
    final type = message['type'];
    final sender = message['sender'] ?? {};
    final avatar = sender['avatar'];

    final bubbleColor = isMe 
        ? colorScheme.primary 
        : (isAdmin ? const Color(0xFF0F172A) : colorScheme.surface);
    
    final textColor = isMe || isAdmin 
        ? Colors.white 
        : colorScheme.onSurface;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isMe) ...[
            CircleAvatar(
              radius: 14,
              backgroundColor: colorScheme.primary.withOpacity(0.1),
              backgroundImage: avatar != null ? NetworkImage(avatar) : null,
              child: avatar == null 
                  ? Text(sender['name']?[0] ?? '?', style: TextStyle(fontSize: 10, color: colorScheme.primary, fontWeight: FontWeight.bold)) 
                  : null,
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: bubbleColor,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(20),
                  topRight: const Radius.circular(20),
                  bottomLeft: Radius.circular(isMe ? 20 : 4),
                  bottomRight: Radius.circular(isMe ? 4 : 20),
                ),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 5, offset: const Offset(0, 2)),
                ],
              ),
              child: Column(
                crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                children: [
                  if (type == 'IMAGE' && imageUrl != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.network(
                          imageUrl,
                          fit: BoxFit.cover,
                          loadingBuilder: (context, child, loadingProgress) {
                            if (loadingProgress == null) return child;
                            return Container(
                              height: 200,
                              width: double.infinity,
                              color: colorScheme.onSurface.withOpacity(0.05),
                              child: const Center(child: CircularProgressIndicator()),
                            );
                          },
                        ),
                      ),
                    ),
                  if (text != null && text.isNotEmpty)
                    Text(
                      text,
                      style: GoogleFonts.outfit(
                        color: textColor,
                        fontSize: 14,
                        fontWeight: isAdmin ? FontWeight.w600 : FontWeight.normal,
                      ),
                    ),
                ],
              ),
            ),
          ),
          if (isMe) ...[
            const SizedBox(width: 8),
            CircleAvatar(
              radius: 14,
              backgroundColor: colorScheme.primary.withOpacity(0.2),
              backgroundImage: sender['avatar'] != null ? NetworkImage(sender['avatar']) : null,
              child: sender['avatar'] == null 
                  ? Text('Me', style: const TextStyle(fontSize: 8, color: Colors.white, fontWeight: FontWeight.bold)) 
                  : null,
            ),
          ] else
            const SizedBox(width: 32),
        ],
      ),
    );
  }
}
