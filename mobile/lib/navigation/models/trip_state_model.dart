import 'package:geolocator/geolocator.dart';
import 'route_model.dart';

enum TripState {
  idle,
  waitingForGps,
  fetchingRoute,
  loading, // generic fallback
  navigating,
  paused,
  arrived,
  error,
}

class TripStateModel {
  final TripState state;
  final RouteModel? currentRoute;
  final Position? currentPosition;
  final int currentManeuverIndex;
  final double distanceRemaining;
  final double durationRemaining;
  final bool isOffRoute;
  final String? errorMessage;
  final double? destinationLat;
  final double? destinationLng;
  final String? destinationName;

  TripStateModel({
    this.state = TripState.idle,
    this.currentRoute,
    this.currentPosition,
    this.currentManeuverIndex = 0,
    this.distanceRemaining = 0,
    this.durationRemaining = 0,
    this.isOffRoute = false,
    this.errorMessage,
    this.destinationLat,
    this.destinationLng,
    this.destinationName,
  });

  TripStateModel copyWith({
    TripState? state,
    RouteModel? currentRoute,
    Position? currentPosition,
    int? currentManeuverIndex,
    double? distanceRemaining,
    double? durationRemaining,
    bool? isOffRoute,
    String? errorMessage,
    double? destinationLat,
    double? destinationLng,
    String? destinationName,
  }) {
    return TripStateModel(
      state: state ?? this.state,
      currentRoute: currentRoute ?? this.currentRoute,
      currentPosition: currentPosition ?? this.currentPosition,
      currentManeuverIndex: currentManeuverIndex ?? this.currentManeuverIndex,
      distanceRemaining: distanceRemaining ?? this.distanceRemaining,
      durationRemaining: durationRemaining ?? this.durationRemaining,
      isOffRoute: isOffRoute ?? this.isOffRoute,
      errorMessage: errorMessage ?? this.errorMessage,
      destinationLat: destinationLat ?? this.destinationLat,
      destinationLng: destinationLng ?? this.destinationLng,
      destinationName: destinationName ?? this.destinationName,
    );
  }

  bool get isNavigating => state == TripState.navigating;
  bool get hasRoute => currentRoute != null;
  bool get hasError => state == TripState.error;
  bool get hasArrived => state == TripState.arrived;

  String get formattedDistanceRemaining {
    if (distanceRemaining < 1000) {
      return '${distanceRemaining.round()} m';
    } else {
      return '${(distanceRemaining / 1000).toStringAsFixed(1)} km';
    }
  }

  String get formattedDurationRemaining {
    final minutes = (durationRemaining / 60).floor();
    final seconds = (durationRemaining % 60).round();
    
    if (minutes < 1) {
      return '$seconds sec';
    } else if (minutes == 1) {
      return '1 min';
    } else {
      return '$minutes mins';
    }
  }
}