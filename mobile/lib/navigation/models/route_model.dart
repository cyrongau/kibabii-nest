import 'maneuver_model.dart';

class RouteModel {
  final List<List<double>> geometry;
  final double distance;
  final double duration;
  final List<ManeuverModel> maneuvers;

  RouteModel({
    required this.geometry,
    required this.distance,
    required this.duration,
    required this.maneuvers,
  });

  String get formattedDistance {
    if (distance < 1000) {
      return '${distance.round()} m';
    } else {
      return '${(distance / 1000).toStringAsFixed(1)} km';
    }
  }

  String get formattedDuration {
    final minutes = (duration / 60).floor();
    final seconds = (duration % 60).round();
    
    if (minutes < 1) {
      return '$seconds sec';
    } else if (minutes == 1) {
      return '1 min';
    } else {
      return '$minutes mins';
    }
  }

  int get totalSteps => maneuvers.length;
}