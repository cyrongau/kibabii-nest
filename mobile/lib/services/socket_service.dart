import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:flutter/foundation.dart';
import '../core/constants.dart';
import 'auth_service.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  io.Socket? _socket;
  
  String get _baseUrl => ApiConstants.socketUrl;

  Future<void> connect() async {
    if (_socket?.connected ?? false) return;
    
    final token = await AuthService().getToken();
    if (token == null) return;

    _socket = io.io(_baseUrl, {
      'transports': ['websocket'],
      'autoConnect': false,
      'auth': {'token': token}
    });

    _socket?.connect();

    final completer = Completer<void>();
    
    _socket?.onConnect((_) {
      debugPrint('Socket connected: ${_socket?.id}');
      if (!completer.isCompleted) completer.complete();
    });

    _socket?.onDisconnect((_) {
      debugPrint('Socket disconnected');
    });

    _socket?.onConnectError((err) {
      debugPrint('Socket connect error: $err');
      if (!completer.isCompleted) completer.completeError(err);
    });

    return completer.future.timeout(ApiConstants.defaultTimeout, onTimeout: () {
      if (!completer.isCompleted) completer.complete();
    });
  }

  Future<void> joinConversation(String conversationId) async {
    if (!(_socket?.connected ?? false)) await connect();
    _socket?.emit('join_conversation', conversationId);
  }

  Future<void> sendMessage(Map<String, dynamic> data) async {
    if (!(_socket?.connected ?? false)) await connect();
    _socket?.emit('send_message', data);
  }

  void setTyping(String conversationId, bool isTyping) {
    _socket?.emit('typing', {'conversationId': conversationId, 'isTyping': isTyping});
  }

  void onNewMessage(Function(dynamic) callback) {
    _socket?.on('new_message', callback);
  }

  void onUserTyping(Function(dynamic) callback) {
    _socket?.on('user_typing', callback);
  }

  void dispose() {
    _socket?.dispose();
  }
  
  bool get connected => _socket?.connected ?? false;
}
