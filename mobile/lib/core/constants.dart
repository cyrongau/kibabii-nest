import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConstants {
  // Use 10.0.2.2 for Android Emulator, localhost for iOS Simulator
  // Or your computer's local IP for physical devices (e.g., 192.168.0.207)
  static const String androidEmulatorIp = '10.0.2.2';
  static const String physicalDeviceIp = '192.168.0.207'; // User's specific dev IP
  static const String iosSimulatorIp = 'localhost';

  static String get devHost {
    if (kIsWeb) return 'localhost';
    if (Platform.isAndroid) {
      // Common check to see if we are on an emulator
      // Note: In real production you might use environment variables
      return androidEmulatorIp; 
    }
    return iosSimulatorIp;
  }

  // Allow manual override for physical device testing easily in one place
  static const bool usePhysicalIp = true; 

  static String get host => usePhysicalIp ? physicalDeviceIp : devHost;
  
  static String get baseUrl {
    final envUrl = dotenv.env['API_URL'];
    if (envUrl != null && envUrl.isNotEmpty) {
      return envUrl;
    }
    return 'http://$host:3000';
  }

  static String get socketUrl {
    final envUrl = dotenv.env['API_URL'];
    if (envUrl != null && envUrl.isNotEmpty) {
      return envUrl;
    }
    return 'http://$host:3000';
  }

  // Timeouts
  static const Duration defaultTimeout = Duration(seconds: 15);
  static const Duration extendedTimeout = Duration(seconds: 60); // For AI/Uploads
}
