import 'dart:async';
import 'package:geolocator/geolocator.dart';

class GpsService {
  StreamSubscription<Position>? _positionSubscription;
  final StreamController<Position> _positionController = StreamController<Position>.broadcast();
  
  Stream<Position> get positionStream => _positionController.stream;

  Future<bool> checkPermissions() async {
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
      if (!hasPermission) return null;

      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 5,
        ),
      );
    } catch (e) {
      print('GpsService: Error getting current position: $e');
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