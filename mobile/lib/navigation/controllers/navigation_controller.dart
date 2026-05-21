import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../services/directions_service.dart';
import '../services/gps_service.dart';
import '../services/tts_service.dart';
import '../services/reroute_service.dart';
import '../services/background_tracking_service.dart';
import '../models/route_model.dart';
import '../models/trip_state_model.dart';

final directionsServiceProvider = Provider<DirectionsService>((ref) {
  return DirectionsService();
});

final gpsServiceProvider = Provider<GpsService>((ref) {
  final service = GpsService();
  ref.onDispose(() => service.dispose());
  return service;
});

final ttsServiceProvider = Provider<TtsService>((ref) {
  final service = TtsService();
  ref.onDispose(() => service.dispose());
  return service;
});

final rerouteServiceProvider = Provider<RerouteService>((ref) {
  return RerouteService();
});

final navigationControllerProvider = 
    StateNotifierProvider<NavigationController, TripStateModel>((ref) {
  return NavigationController(
    ref.read(directionsServiceProvider),
    ref.read(gpsServiceProvider),
    ref.read(ttsServiceProvider),
    ref.read(rerouteServiceProvider),
  );
});

class NavigationController extends StateNotifier<TripStateModel> {
  final DirectionsService _directionsService;
  final GpsService _gpsService;
  final TtsService _ttsService;
  final RerouteService _rerouteService;
  
  StreamSubscription<Position>? _positionSubscription;
  Timer? _rerouteTimer;
  Timer? _locationPollingTimer;
  int _currentPollingInterval = 5;

  NavigationController(
    this._directionsService,
    this._gpsService,
    this._ttsService,
    this._rerouteService,
  ) : super(TripStateModel()) {
    _initTts();
  }

  Future<void> _initTts() async {
    await _ttsService.initialize();
  }

  Future<bool> startNavigation({
    required double destinationLat,
    required double destinationLng,
    String? destinationName,
  }) async {
    debugPrint('🏁 Navigation: startNavigation called for $destinationLat, $destinationLng');
    
    try {
      // 1. Waiting for GPS phase
      state = state.copyWith(
        state: TripState.waitingForGps,
        destinationLat: destinationLat,
        destinationLng: destinationLng,
        destinationName: destinationName,
        errorMessage: null,
      );

      debugPrint('🏁 Navigation: Checking permissions...');
      final hasPermission = await _gpsService.checkPermissions();
      if (!hasPermission) {
        debugPrint('❌ Navigation: Location permission denied');
        state = state.copyWith(
          state: TripState.error,
          errorMessage: 'Location permission denied. Please enable location access in settings.',
        );
        return false;
      }

      debugPrint('🏁 Navigation: Getting current position...');
      final currentPosition = await _gpsService.getCurrentPosition();

      if (currentPosition == null) {
        debugPrint('❌ Navigation: Could not get current position');
        state = state.copyWith(
          state: TripState.error,
          errorMessage: 'Could not get GPS lock. Try moving to an open area and ensure Location is enabled.',
        );
        return false;
      }

      debugPrint('🏁 Navigation: Current position: ${currentPosition.latitude}, ${currentPosition.longitude}');
      state = state.copyWith(
        currentPosition: currentPosition,
        state: TripState.fetchingRoute,
      );

      // 2. Fetching Route phase
      debugPrint('🏁 Navigation: Fetching route from DirectionsService (15s timeout)...');
      RouteModel? route;
      try {
        route = await _directionsService.getWalkingRoute(
          startLng: currentPosition.longitude,
          startLat: currentPosition.latitude,
          endLng: destinationLng,
          endLat: destinationLat,
        ).timeout(const Duration(seconds: 15));
      } catch (e) {
        debugPrint('❌ Navigation: Route fetch timed out or failed: $e');
      }

      if (route == null) {
        debugPrint('❌ Navigation: Route fetching failed');
        state = state.copyWith(
          state: TripState.error,
          errorMessage: 'Could not find a walking route. Please check your internet connection and try again.',
        );
        return false;
      }

      debugPrint('✅ Navigation: Route found! Distance: ${route.distance}m');

      state = state.copyWith(
        state: TripState.navigating,
        currentRoute: route,
        distanceRemaining: route.distance,
        durationRemaining: route.duration,
        currentManeuverIndex: 0,
        isOffRoute: false,
      );

      _startLocationTracking();
      _speakInstruction('Navigation started. Follow the route to your destination.');
      _checkManeuverDistance();
      
      // Start background tracking
      _startBackgroundTracking();

      return true;
    } catch (e, stackTrace) {
      debugPrint('❌ Critical unhandled error in startNavigation: $e\n$stackTrace');
      state = state.copyWith(
        state: TripState.error,
        errorMessage: 'An unexpected error occurred: ${e.toString()}',
      );
      return false;
    }
  }

  void _startBackgroundTracking() async {
    if (state.destinationLat == null || state.destinationLng == null) return;
    
    try {
      await BackgroundTrackingService.startTracking(
        destinationLat: state.destinationLat!,
        destinationLng: state.destinationLng!,
        destinationName: state.destinationName,
      );
    } catch (e) {
      debugPrint('Background tracking start error: $e');
    }
  }

  void _stopBackgroundTracking() async {
    try {
      await BackgroundTrackingService.stopTracking();
    } catch (e) {
      debugPrint('Background tracking stop error: $e');
    }
  }

  void _startLocationTracking() {
    _positionSubscription?.cancel();
    _locationPollingTimer?.cancel();
    _gpsService.stopTracking();
    
    _pollLocation();
  }

  Future<void> _pollLocation() async {
    if (!state.isNavigating) return;

    final position = await _gpsService.getCurrentPosition();
    if (position != null) {
      _updatePosition(position);
    }

    // Adaptive polling: 5s interval when close, 10s when further
    if (state.distanceRemaining < 200) {
      _currentPollingInterval = 5;
    } else {
      _currentPollingInterval = 10;
    }

    _locationPollingTimer = Timer(Duration(seconds: _currentPollingInterval), _pollLocation);
  }

  void _updatePosition(Position position) {
    if (!state.hasRoute) return;

    final isOffRoute = _rerouteService.isOffRoute(position, state.currentRoute!);
    
    if (isOffRoute && !state.isOffRoute) {
      state = state.copyWith(isOffRoute: true);
      _speakInstruction('You have gone off route. Recalculating...');
      _triggerReroute();
      return;
    }

    if (state.isOffRoute && !isOffRoute) {
      state = state.copyWith(isOffRoute: false);
      _speakInstruction('Route recalculated. Continuing navigation.');
    }

    final distanceToDestination = _rerouteService.calculateDistanceToDestination(
      position,
      state.currentRoute!,
    );

    final newManeuverIndex = _findCurrentManeuverIndex(position);

    if (newManeuverIndex != state.currentManeuverIndex) {
      state = state.copyWith(currentManeuverIndex: newManeuverIndex);
      _speakCurrentManeuver();
    }

    final remainingDuration = _calculateRemainingDuration(position);

    state = state.copyWith(
      currentPosition: position,
      distanceRemaining: distanceToDestination,
      durationRemaining: remainingDuration,
    );

    if (distanceToDestination < 20) {
      _arrived();
    }
  }

  int _findCurrentManeuverIndex(Position position) {
    if (!state.hasRoute || state.currentRoute!.maneuvers.isEmpty) {
      return 0;
    }

    final route = state.currentRoute!;
    final maneuvers = route.maneuvers;
    
    for (int i = 0; i < maneuvers.length; i++) {
      final maneuver = maneuvers[i];
      if (maneuver.location.isEmpty) continue;

      final distance = _gpsService.calculateDistanceFromPosition(
        position,
        maneuver.location[1],
        maneuver.location[0],
      );

      if (distance < 30) {
        return i;
      }
    }

    return state.currentManeuverIndex;
  }

  double _calculateRemainingDuration(Position position) {
    if (!state.hasRoute) return 0;

    final totalDuration = state.currentRoute!.duration;
    final routeLength = state.currentRoute!.geometry.length;
    
    if (routeLength == 0) return totalDuration;

    final closestIndex = _rerouteService.findClosestPointIndex(
      position,
      state.currentRoute!,
    );

    final progress = closestIndex / routeLength;
    return totalDuration * (1 - progress);
  }

  void _checkManeuverDistance() {
    _rerouteTimer?.cancel();
    _rerouteTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!state.isNavigating || !state.hasRoute || state.currentPosition == null) {
        return;
      }

      final currentManeuver = state.currentRoute!.maneuvers[state.currentManeuverIndex];
      final distanceToManeuver = _gpsService.calculateDistanceFromPosition(
        state.currentPosition!,
        currentManeuver.location.isNotEmpty ? currentManeuver.location[1] : 0,
        currentManeuver.location.isNotEmpty ? currentManeuver.location[0] : 0,
      );

      if (distanceToManeuver < 100 && distanceToManeuver > 50) {
        _speakCurrentManeuver();
      }
    });
  }

  void _speakCurrentManeuver() {
    if (!state.hasRoute || state.currentRoute!.maneuvers.isEmpty) return;

    final maneuvers = state.currentRoute!.maneuvers;
    if (state.currentManeuverIndex >= maneuvers.length) return;

    final maneuver = maneuvers[state.currentManeuverIndex];
    final instruction = _ttsService.getManeuverInstruction(
      maneuver.type,
      maneuver.modifier,
      maneuver.distance,
      maneuver.instruction,
    );
    _speakInstruction(instruction);
  }

  void _speakInstruction(String text) {
    try {
      _ttsService.speak(text);
    } catch (e) {
      debugPrint('TTS Error (ignored): $e');
    }
  }

  Future<void> _triggerReroute() async {
    if (state.currentPosition == null || state.destinationLat == null || state.destinationLng == null) {
      return;
    }

    final newRoute = await _directionsService.getWalkingRoute(
      startLng: state.currentPosition!.longitude,
      startLat: state.currentPosition!.latitude,
      endLng: state.destinationLng!,
      endLat: state.destinationLat!,
    );

    if (newRoute != null) {
      state = state.copyWith(
        currentRoute: newRoute,
        distanceRemaining: newRoute.distance,
        durationRemaining: newRoute.duration,
        currentManeuverIndex: 0,
        isOffRoute: false,
      );
      _speakInstruction('New route calculated. Distance ${newRoute.formattedDistance}.');
    }
  }

  void _arrived() {
    _positionSubscription?.cancel();
    _locationPollingTimer?.cancel();
    _rerouteTimer?.cancel();
    _ttsService.stop();
    _stopBackgroundTracking();
    
    state = state.copyWith(state: TripState.arrived);
    _speakInstruction('You have arrived at your destination.');
  }

  void pauseNavigation() {
    _locationPollingTimer?.cancel();
    _gpsService.stopTracking();
    _ttsService.pause();
    state = state.copyWith(state: TripState.paused);
  }

  void resumeNavigation() {
    _startLocationTracking();
    state = state.copyWith(state: TripState.navigating);
    _speakInstruction('Navigation resumed.');
  }

  void stopNavigation() {
    _positionSubscription?.cancel();
    _locationPollingTimer?.cancel();
    _rerouteTimer?.cancel();
    _gpsService.stopTracking();
    _ttsService.stop();
    _stopBackgroundTracking();
    state = TripStateModel(state: TripState.idle);
  }

  @override
  void dispose() {
    _positionSubscription?.cancel();
    _locationPollingTimer?.cancel();
    _rerouteTimer?.cancel();
    super.dispose();
  }
}