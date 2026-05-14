import 'dart:async';
import 'package:geolocator/geolocator.dart';

class GpsService {
  StreamSubscription<Position>? _positionSubscription;
  final StreamController<Position> _positionController = StreamController<Position>.broadcast();
  
  Stream<Position> get positionStream => _positionController.stream;

  Future<bool> checkPermissions() async {
    try {
      return await _checkPermissionsLogic().timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          print('GpsService: Permission check timed out');
          return false;
        },
      );
    } catch (e) {
      print('GpsService: Permission check error: $e');
      return false;
    }
  }

  Future<bool> _checkPermissionsLogic() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    return true;
  }

  Future<Position?> getCurrentPosition() async {
    try {
      final hasPermission = await checkPermissions();
      if (!hasPermission) {
        print('GpsService: Location permission denied');
        return null;
      }

      print('GpsService: Fetching current position with 15s timeout...');
      final settings = LocationSettings(
        accuracy: LocationAccuracy.high,
        forceAndroidLocationManager: Platform.isAndroid,
      );

      final position = await Geolocator.getCurrentPosition(
        locationSettings: settings,
      ).timeout(const Duration(seconds: 15), onTimeout: () {
        print('GpsService: GPS lock timed out');
        throw TimeoutException('GPS lock timed out');
      });

      if (position.latitude == 0 && position.longitude == 0) {
        print('GpsService: Received invalid GPS coordinates');
        return null;
      }

      return position;
    } catch (e) {
      print('GpsService: Error getting current position: $e');
      try {
        final fallback = await Geolocator.getLastKnownPosition();
        if (fallback != null) {
          print('GpsService: Using last known position as fallback');
          return fallback;
        }
      } catch (fallbackError) {
        print('GpsService: Last known position fallback failed: $fallbackError');
      }
      return null;
    }
  }

  void startTracking({
    int distanceFilter = 5,
    LocationAccuracy accuracy = LocationAccuracy.high,
  }) {
    stopTracking();

    final locationSettings = LocationSettings(
      accuracy: accuracy,
      distanceFilter: distanceFilter,
    );

    _positionSubscription = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen(
      (Position position) {
        _positionController.add(position);
      },
      onError: (error) {
        print('GpsService: Location stream error: $error');
      },
    );
  }

  void stopTracking() {
    _positionSubscription?.cancel();
    _positionSubscription = null;
  }

  double calculateDistance(double startLat, double startLng, double endLat, double endLng) {
    return Geolocator.distanceBetween(startLat, startLng, endLat, endLng);
  }

  double calculateDistanceFromPosition(Position position, double endLat, double endLng) {
    return calculateDistance(position.latitude, position.longitude, endLat, endLng);
  }

  void dispose() {
    stopTracking();
    _positionController.close();
  }
}