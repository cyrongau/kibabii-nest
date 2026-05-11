import 'dart:async';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_background_service_android/flutter_background_service_android.dart';
import 'package:geolocator/geolocator.dart';
import 'package:flutter/services.dart';

@pragma('vm:entry-point')
Future<bool> onStart(ServiceInstance service) async {
  StreamSubscription<Position>? positionSubscription;

  service.on('startTracking').listen((event) async {
    if (event != null && event['lat'] != null && event['lng'] != null) {
      final destinationLat = event['lat'] as double;
      final destinationLng = event['lng'] as double;
      final destinationName = event['name'] as String? ?? 'Destination';

      final locationSettings = LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      );

      positionSubscription = Geolocator.getPositionStream(
        locationSettings: locationSettings,
      ).listen((Position position) {
        final distanceToDestination = Geolocator.distanceBetween(
          position.latitude,
          position.longitude,
          destinationLat,
          destinationLng,
        );

        service.invoke('positionUpdate', {
          'lat': position.latitude,
          'lng': position.longitude,
          'distanceToDestination': distanceToDestination,
          'accuracy': position.accuracy,
        });

        if (service is AndroidServiceInstance) {
          service.setForegroundNotificationInfo(
            title: 'Navigating to $destinationName',
            content: '${distanceToDestination.round()}m remaining',
          );
        }

        if (distanceToDestination < 20) {
          service.invoke('arrived');
          positionSubscription?.cancel();
        }
      });
    }
  });

  service.on('stopTracking').listen((event) {
    positionSubscription?.cancel();
  });

  service.on('stopService').listen((event) {
    positionSubscription?.cancel();
    service.stopSelf();
  });

  return true;
}

class BackgroundTrackingService {
  static final FlutterBackgroundService _service = FlutterBackgroundService();

  static Future<void> initialize() async {
    await _service.configure(
      androidConfiguration: AndroidConfiguration(
        onStart: onStart,
        isForegroundMode: true,
        autoStart: false,
        autoStartOnBoot: false,
        notificationChannelId: 'kibabii_navigation',
        initialNotificationTitle: 'Kibabii Navigation',
        initialNotificationContent: 'Navigation service ready',
        foregroundServiceNotificationId: 888,
        foregroundServiceTypes: [AndroidForegroundType.location],
      ),
      iosConfiguration: IosConfiguration(
        autoStart: false,
        onForeground: onStart,
        onBackground: onStart,
      ),
    );
  }

  static Future<bool> isRunning() async {
    return await _service.isRunning();
  }

  static Future<void> startTracking({
    required double destinationLat,
    required double destinationLng,
    String? destinationName,
  }) async {
    final isRunning = await _service.isRunning();
    if (!isRunning) {
      await _service.startService();
    }
    
    await Future.delayed(const Duration(milliseconds: 500));
    
    _service.invoke('startTracking', {
      'lat': destinationLat,
      'lng': destinationLng,
      'name': destinationName,
    });
  }

  static Future<void> stopTracking() async {
    _service.invoke('stopTracking');
  }

  static Stream<Map<String, dynamic>?> get positionStream {
    return _service.on('positionUpdate');
  }

  static Stream<Map<String, dynamic>?> get arrivedStream {
    return _service.on('arrived');
  }
}