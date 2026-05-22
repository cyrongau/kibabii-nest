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
  Position? _previousPosition;
  String? _lastSpokenInstruction;
  DateTime? _lastSpokenTime;
  DateTime? _lastRerouteTime;
  bool _isRerouting = false;

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
      _previousPosition = currentPosition;
      
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
    _gpsService.stopTracking();
    
    _gpsService.startTracking(distanceFilter: 3);
    
    _positionSubscription = _gpsService.positionStream.listen(
      (Position position) {
        _updatePosition(position);
      },
      onError: (error) {
        debugPrint('Navigation: Position stream error: $error');
      },
      onDone: () {
        debugPrint('Navigation: Position stream closed');
      },
      cancelOnError: false,
    );
  }

  void _updatePosition(Position position) {
    if (!state.hasRoute) return;

    final distanceToDestination = _rerouteService.calculateDistanceToDestination(
      position,
      state.currentRoute!,
    );

    if (distanceToDestination < 20) {
      _arrived();
      return;
    }

    final isOffRoute = _rerouteService.isOffRoute(position, state.currentRoute!);

    if (isOffRoute && !_isRerouting) {
      if (!state.isOffRoute) {
        state = state.copyWith(isOffRoute: true);
      }
      final now = DateTime.now();
      if (_lastRerouteTime == null ||
          now.difference(_lastRerouteTime!) > const Duration(seconds: 20)) {
        _rerouteTimer?.cancel();
        _speakInstruction('You have gone off route. Recalculating...');
        _triggerReroute();
      }
    } else if (state.isOffRoute) {
      state = state.copyWith(isOffRoute: false);
    }

    final newManeuverIndex = _findCurrentManeuverIndex(position);

    if (newManeuverIndex != state.currentManeuverIndex) {
      state = state.copyWith(currentManeuverIndex: newManeuverIndex);
      _speakCurrentManeuver();
    }

    final remainingDuration = _calculateRemainingDuration(
      position,
      distanceToDestination,
    );
    
    double? bearing;
    if (_previousPosition != null) {
      final movement = Geolocator.distanceBetween(
        _previousPosition!.latitude, _previousPosition!.longitude,
        position.latitude, position.longitude,
      );
      if (movement > 2) {
        bearing = _rerouteService.calculateBearing(
          _previousPosition!.latitude, _previousPosition!.longitude,
          position.latitude, position.longitude,
        );
      }
    }
    _previousPosition = position;

    state = state.copyWith(
      currentPosition: position,
      distanceRemaining: distanceToDestination,
      durationRemaining: remainingDuration,
      bearing: bearing,
    );
  }

  int _findCurrentManeuverIndex(Position position) {
    if (!state.hasRoute || state.currentRoute!.maneuvers.isEmpty) {
      return 0;
    }

    final route = state.currentRoute!;
    final maneuvers = route.maneuvers;
    final startIndex = state.currentManeuverIndex.clamp(0, maneuvers.length - 1);
    
    for (int i = startIndex; i < maneuvers.length; i++) {
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

  double _calculateRemainingDuration(Position position, double remainingDistance) {
    if (!state.hasRoute || state.currentRoute!.distance <= 0) return 0;

    final totalDistance = state.currentRoute!.distance;
    return (remainingDistance / totalDistance) * state.currentRoute!.duration;
  }

  void _checkManeuverDistance() {
    _rerouteTimer?.cancel();
    _rerouteTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!state.isNavigating || !state.hasRoute || state.currentPosition == null || _isRerouting) {
        return;
      }

      final maneuvers = state.currentRoute!.maneuvers;
      if (state.currentManeuverIndex >= maneuvers.length) return;

      final currentManeuver = maneuvers[state.currentManeuverIndex];
      if (currentManeuver.type == 'depart' || currentManeuver.location.isEmpty) return;

      final distanceToManeuver = _gpsService.calculateDistanceFromPosition(
        state.currentPosition!,
        currentManeuver.location[1],
        currentManeuver.location[0],
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
    if (text == _lastSpokenInstruction &&
        _lastSpokenTime != null &&
        DateTime.now().difference(_lastSpokenTime!) < const Duration(seconds: 15)) {
      return;
    }
    try {
      _ttsService.speak(text);
      _lastSpokenInstruction = text;
      _lastSpokenTime = DateTime.now();
    } catch (e) {
      debugPrint('TTS Error (ignored): $e');
    }
  }

  Future<void> _triggerReroute() async {
    if (state.currentPosition == null || state.destinationLat == null || state.destinationLng == null) {
      return;
    }

    _isRerouting = true;
    _lastRerouteTime = DateTime.now();

    final newRoute = await _directionsService.getWalkingRoute(
      startLng: state.currentPosition!.longitude,
      startLat: state.currentPosition!.latitude,
      endLng: state.destinationLng!,
      endLat: state.destinationLat!,
      useCache: false,
    );

    _isRerouting = false;

    if (newRoute != null) {
      state = state.copyWith(
        currentRoute: newRoute,
        distanceRemaining: newRoute.distance,
        durationRemaining: newRoute.duration,
        currentManeuverIndex: 0,
        isOffRoute: false,
      );
      _checkManeuverDistance();
      _speakInstruction('New route calculated. Distance ${newRoute.formattedDistance}.');
    }
  }

  void _arrived() {
    _positionSubscription?.cancel();
    _rerouteTimer?.cancel();
    _gpsService.stopTracking();
    _ttsService.stop();
    _stopBackgroundTracking();
    _isRerouting = false;
    _lastRerouteTime = null;
    
    state = state.copyWith(state: TripState.arrived);
    _speakInstruction('You have arrived at your destination.');
  }

  void pauseNavigation() {
    _positionSubscription?.cancel();
    _rerouteTimer?.cancel();
    _gpsService.stopTracking();
    _ttsService.pause();
    state = state.copyWith(state: TripState.paused);
  }

  void resumeNavigation() {
    _startLocationTracking();
    _checkManeuverDistance();
    state = state.copyWith(state: TripState.navigating);
    _speakInstruction('Navigation resumed.');
  }

  void stopNavigation() {
    _positionSubscription?.cancel();
    _rerouteTimer?.cancel();
    _gpsService.stopTracking();
    _ttsService.stop();
    _stopBackgroundTracking();
    _previousPosition = null;
    _lastSpokenInstruction = null;
    _lastSpokenTime = null;
    _lastRerouteTime = null;
    _isRerouting = false;
    state = TripStateModel(state: TripState.idle);
  }

  @override
  void dispose() {
    _positionSubscription?.cancel();
    _rerouteTimer?.cancel();
    _previousPosition = null;
    _lastSpokenInstruction = null;
    _lastSpokenTime = null;
    _lastRerouteTime = null;
    _isRerouting = false;
    super.dispose();
  }
}