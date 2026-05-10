import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/router.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  bool _initialized = false;

  Future<void> initialize(BuildContext context) async {
    if (_initialized) return;

    // 1. Request Permissions
    NotificationSettings settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      debugPrint('User granted notification permissions');
    }

    // 2. Handle Initial Message (App opened from terminated state)
    RemoteMessage? initialMessage = await _fcm.getInitialMessage();
    if (initialMessage != null) {
      _handleDeepLink(initialMessage);
    }

    // 3. Handle Foreground Messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('Foreground Message: ${message.notification?.title}');
      // In a real app, you might show a custom in-app snackbar or banner
    });

    // 4. Handle Notification Click (App in background)
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      debugPrint('Notification Clicked: ${message.data}');
      _handleDeepLink(message);
    });

    _initialized = true;
  }

  void _handleDeepLink(RemoteMessage message) {
    String? link = message.data['link'];
    if (link != null && link.isNotEmpty) {
      debugPrint('Original Deep Link: $link');

      // Map web-style links to mobile routes
      if (link.contains('/dashboard/landlord/bookings/')) {
        link = '/booking-requests';
      } else if (link.contains('/dashboard/landlord/tours')) {
        link = '/landlord/tours';
      } else if (link.contains('/dashboard/landlord/maintenance')) {
        link = '/landlord/maintenance';
      } else if (link == '/dashboard/student/tenancy' || link == '/dashboard/student') {
        link = '/my-bookings';
      } else if (link.startsWith('/dashboard/landlord/properties/') && link.endsWith('/edit')) {
        final id = link.split('/')[4];
        link = '/landlord/properties/$id/edit';
      }

      debugPrint('Navigating to mapped link: $link');
      AppRouter.router.push(link);
    }
  }

  Future<void> subscribeToUserTopic() async {
    final prefs = await SharedPreferences.getInstance();
    final String? userId = prefs.getString('user_id');
    
    if (userId != null) {
      await _fcm.subscribeToTopic('user_$userId');
      debugPrint('Subscribed to topic: user_$userId');
    }
  }

  Future<void> unsubscribeFromUserTopic() async {
    final prefs = await SharedPreferences.getInstance();
    final String? userId = prefs.getString('user_id');
    
    if (userId != null) {
      await _fcm.unsubscribeFromTopic('user_$userId');
      debugPrint('Unsubscribed from topic: user_$userId');
    }
  }
}
