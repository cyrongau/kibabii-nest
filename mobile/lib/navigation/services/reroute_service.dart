import 'dart:math';
import 'package:geolocator/geolocator.dart';
import '../models/route_model.dart';

class RerouteService {
  static const double defaultThresholdMeters = 50.0;
  final double _threshold;

  RerouteService({double thresholdMeters = defaultThresholdMeters}) 
      : _threshold = thresholdMeters;

  bool isOffRoute(Position currentPosition, RouteModel route) {
    if (route.geometry.isEmpty) return false;

    double minDistance = double.infinity;
    
    for (var point in route.geometry) {
      if (point.length < 2) continue;
      
      final lng = point[0];
      final lat = point[1];
      
      final distance = Geolocator.distanceBetween(
        currentPosition.latitude,
        currentPosition.longitude,
        lat,
        lng,
      );
      
      if (distance < minDistance) {
        minDistance = distance;
      }
    }

    return minDistance > _threshold;
  }

  int findClosestPointIndex(Position currentPosition, RouteModel route) {
    if (route.geometry.isEmpty) return 0;

    double minDistance = double.infinity;
    int closestIndex = 0;

    for (int i = 0; i < route.geometry.length; i++) {
      final point = route.geometry[i];
      if (point.length < 2) continue;

      final lng = point[0];
      final lat = point[1];

      final distance = Geolocator.distanceBetween(
        currentPosition.latitude,
        currentPosition.longitude,
        lat,
        lng,
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }

    return closestIndex;
  }

  double getDistanceToNextManeuver(Position currentPosition, int currentManeuverIndex, RouteModel route) {
    if (currentManeuverIndex >= route.maneuvers.length) return 0;

    final maneuver = route.maneuvers[currentManeuverIndex];
    if (maneuver.location.isEmpty) return 0;

    return Geolocator.distanceBetween(
      currentPosition.latitude,
      currentPosition.longitude,
      maneuver.location[1],
      maneuver.location[0],
    );
  }

  double calculateBearing(double lat1, double lng1, double lat2, double lng2) {
    final dLng = _toRadians(lng2 - lng1);
    final y = sin(dLng) * cos(_toRadians(lat2));
    final x = cos(_toRadians(lat1)) * sin(_toRadians(lat2)) - 
              sin(_toRadians(lat1)) * cos(_toRadians(lat2)) * cos(dLng);
    
    final bearing = atan2(y, x);
    return (_toDegrees(bearing) + 360) % 360;
  }

  double _toRadians(double degrees) => degrees * pi / 180;
  double _toDegrees(double radians) => radians * 180 / pi;

  double calculateDistanceToDestination(Position currentPosition, RouteModel route) {
    if (route.geometry.isEmpty) return 0;

    int closestIndex = findClosestPointIndex(currentPosition, route);
    double remainingDistance = 0;

    final closestPoint = route.geometry[closestIndex];
    if (closestPoint.length >= 2) {
      remainingDistance += Geolocator.distanceBetween(
        currentPosition.latitude,
        currentPosition.longitude,
        closestPoint[1],
        closestPoint[0],
      );
    }

    for (int i = closestIndex; i < route.geometry.length - 1; i++) {
      final point1 = route.geometry[i];
      final point2 = route.geometry[i + 1];
      if (point1.length >= 2 && point2.length >= 2) {
        remainingDistance += Geolocator.distanceBetween(
          point1[1],
          point1[0],
          point2[1],
          point2[0],
        );
      }
    }

    return remainingDistance;
  }
}