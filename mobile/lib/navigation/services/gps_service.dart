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
      print('GpsService: Location service disabled');
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

      final lastKnown = await Geolocator.getLastKnownPosition();
      if (_isValidPosition(lastKnown)) {
        print('GpsService: Using last known position');
        return lastKnown;
      }

      print('GpsService: Fetching current position with 15s timeout...');
      final settings = LocationSettings(
        accuracy: LocationAccuracy.high,
      );

      final position = await Geolocator.getCurrentPosition(
        locationSettings: settings,
      ).timeout(const Duration(seconds: 15), onTimeout: () {
        print('GpsService: GPS lock timed out (high accuracy)');
        throw TimeoutException('GPS lock timed out');
      });

      if (_isValidPosition(position)) {
        return position;
      }

      print('GpsService: Received invalid GPS coordinates, trying fallback...');
      return await _tryFallbackPosition();
    } catch (e) {
      print('GpsService: Primary location fetch failed: $e');
      return await _tryFallbackPosition();
    }
  }

  Future<Position?> _tryFallbackPosition() async {
    try {
      final lowerSettings = LocationSettings(
        accuracy: LocationAccuracy.medium,
      );

      print('GpsService: Trying fallback position stream (10s)...');
      final position = await Geolocator.getPositionStream(
        locationSettings: lowerSettings,
      ).first.timeout(const Duration(seconds: 10));

      if (_isValidPosition(position)) {
        print('GpsService: Using fallback stream position');
        return position;
      }
    } on TimeoutException catch (_) {
      print('GpsService: Fallback position stream timed out');
    } catch (e) {
      print('GpsService: Fallback position stream failed: $e');
    }

    try {
      final fallback = await Geolocator.getLastKnownPosition();
      if (_isValidPosition(fallback)) {
        print('GpsService: Using last known position after fallback failure');
        return fallback;
      }
    } catch (fallbackError) {
      print('GpsService: Last known position fallback failed: $fallbackError');
    }

    return null;
  }

  bool _isValidPosition(Position? position) {
    if (position == null) return false;
    return position.latitude.abs() > 0.000001 && position.longitude.abs() > 0.000001;
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