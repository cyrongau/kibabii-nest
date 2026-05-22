import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart' as mbx;
import 'package:turf/helpers.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import '../controllers/navigation_controller.dart';
import '../models/route_model.dart';
import '../models/trip_state_model.dart';

class NavigationScreen extends ConsumerStatefulWidget {
  final double destinationLat;
  final double destinationLng;
  final String? destinationName;

  const NavigationScreen({
    super.key,
    required this.destinationLat,
    required this.destinationLng,
    this.destinationName,
  });

  @override
  ConsumerState<NavigationScreen> createState() => _NavigationScreenState();
}

class _NavigationScreenState extends ConsumerState<NavigationScreen> {
  mbx.MapboxMap? _mapboxMap;
  mbx.PolylineAnnotationManager? _polylineAnnotationManager;
  mbx.PolylineAnnotation? _routePolyline;
  bool _isMapReady = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startNavigation();
    });
  }

  @override
  void dispose() {
    // Ensure all background tracking and TTS stop when leaving the screen
    ref.read(navigationControllerProvider.notifier).stopNavigation();
    super.dispose();
  }

  Future<void> _startNavigation() async {
    await ref
        .read(navigationControllerProvider.notifier)
        .startNavigation(
          destinationLat: widget.destinationLat,
          destinationLng: widget.destinationLng,
          destinationName: widget.destinationName,
        );
  }

  void _onMapCreated(mbx.MapboxMap mapboxMap) async {
    setState(() {
      _mapboxMap = mapboxMap;
      _isMapReady = true;
    });

    await _mapboxMap?.location.updateSettings(
      mbx.LocationComponentSettings(
        enabled: true,
        pulsingEnabled: true,
      ),
    );

    _polylineAnnotationManager = await mapboxMap.annotations
        .createPolylineAnnotationManager();
    _syncRouteToMap(ref.read(navigationControllerProvider));
  }

  Future<void> _syncRouteToMap(TripStateModel tripState) async {
    if (!_isMapReady || _polylineAnnotationManager == null) return;

    if (!tripState.hasRoute || tripState.currentRoute!.geometry.isEmpty) {
      await _polylineAnnotationManager?.deleteAll();
      _routePolyline = null;
      return;
    }

    await _renderRouteLine(tripState.currentRoute!);
  }

  Future<void> _renderRouteLine(RouteModel route) async {
    if (_polylineAnnotationManager == null || _mapboxMap == null) return;

    final positions = route.geometry
        .where((point) =>
            point.length >= 2 &&
            point[0].abs() <= 180 &&
            point[1].abs() <= 90)
        .map((point) => Position(point[0], point[1]))
        .toList();

    if (positions.length < 2) return;

    final lineGeoJson = LineString(coordinates: positions).toJson();

    if (_routePolyline == null) {
      _routePolyline = await _polylineAnnotationManager!.create(
        mbx.PolylineAnnotationOptions(
          geometry: lineGeoJson,
          lineColor: Theme.of(context).colorScheme.primary.value,
          lineWidth: 8.0,
          lineJoin: mbx.LineJoin.ROUND,
        ),
      );
    } else {
      _routePolyline!.geometry = lineGeoJson;
      await _polylineAnnotationManager!.update(_routePolyline!);
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<TripStateModel>(navigationControllerProvider, (previous, next) {
      if (previous?.currentRoute != next.currentRoute) {
        _syncRouteToMap(next);
      }
      
      if (next.currentPosition != null && _mapboxMap != null) {
        _mapboxMap!.setCamera(
          mbx.CameraOptions(
            center: mbx.Point(
              coordinates: mbx.Position(
                next.currentPosition!.longitude,
                next.currentPosition!.latitude,
              ),
            ).toJson(),
            zoom: 17.5,
            bearing: next.bearing ?? (next.currentPosition!.heading > 0 ? next.currentPosition!.heading : null),
            pitch: 45.0,
          ),
        );
      }
    });

    final tripState = ref.watch(navigationControllerProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(
            child: mbx.MapWidget(
              key: const ValueKey("navigation_map"),
              resourceOptions: mbx.ResourceOptions(
                accessToken: dotenv.get('MAPBOX_PUBLIC_TOKEN', fallback: ''),
              ),
              onMapCreated: _onMapCreated,
              styleUri: isDark
                  ? "mapbox://styles/mapbox/dark-v11"
                  : "mapbox://styles/mapbox/streets-v11",
            ),
          ),

          if (tripState.state == TripState.loading || 
              tripState.state == TripState.waitingForGps || 
              tripState.state == TripState.fetchingRoute)
            Container(
              color: Colors.black54,
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const CircularProgressIndicator(color: Colors.white),
                    const SizedBox(height: 16),
                    Text(
                      tripState.state == TripState.waitingForGps
                          ? 'Getting GPS Location...'
                          : tripState.state == TripState.fetchingRoute
                              ? 'Calculating Route...'
                              : 'Starting Navigation...',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),

          if (tripState.hasError)
            _buildErrorBanner(tripState.errorMessage ?? 'Navigation error'),

          if (tripState.isOffRoute) _buildOffRouteBanner(),

          _buildNavigationCard(tripState),

          _buildControlButtons(tripState),

          if (tripState.hasArrived) _buildArrivedOverlay(),
        ],
      ),
    );
  }

  Widget _buildErrorBanner(String message) {
    return Positioned(
      top: MediaQuery.of(context).padding.top + 16,
      left: 16,
      right: 16,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.red,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            const Icon(Icons.error, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOffRouteBanner() {
    return Positioned(
      top: MediaQuery.of(context).padding.top + 16,
      left: 16,
      right: 16,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.orange,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Row(
          children: [
            Icon(Icons.warning, color: Colors.white),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                'Recalculating route...',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavigationCard(TripStateModel tripState) {
    final theme = Theme.of(context);

    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: theme.cardColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.destinationName ?? 'Destination',
                        style: GoogleFonts.outfit(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${tripState.formattedDistanceRemaining} - ${tripState.formattedDurationRemaining}',
                        style: GoogleFonts.outfit(
                          fontSize: 16,
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      LucideIcons.navigation,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                ],
              ),

              if (tripState.hasRoute &&
                  tripState.currentManeuverIndex <
                      tripState.currentRoute!.maneuvers.length) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primary,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(
                          _getManeuverIcon(
                            tripState
                                .currentRoute!
                                .maneuvers[tripState.currentManeuverIndex]
                                .type,
                            tripState
                                .currentRoute!
                                .maneuvers[tripState.currentManeuverIndex]
                                .modifier,
                          ),
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Text(
                          tripState
                              .currentRoute!
                              .maneuvers[tripState.currentManeuverIndex]
                              .fullInstruction,
                          style: GoogleFonts.outfit(
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  IconData _getManeuverIcon(String type, String modifier) {
    switch (type) {
      case 'turn':
        if (modifier == 'left' || modifier == 'slight left' || modifier == 'sharp left') {
          return LucideIcons.arrowLeft;
        }
        return LucideIcons.arrowRight;
      case 'arrive':
        return LucideIcons.mapPin;
      case 'continue':
        if (modifier == 'straight') return LucideIcons.arrowUp;
        return LucideIcons.arrowRight;
      case 'merge':
        return LucideIcons.gitBranch;
      case 'fork':
        if (modifier == 'left') return LucideIcons.arrowLeft;
        return LucideIcons.arrowRight;
      case 'depart':
        return LucideIcons.arrowUp;
      default:
        return LucideIcons.navigation;
    }
  }

  Widget _buildControlButtons(TripStateModel tripState) {
    return Positioned(
      top: MediaQuery.of(context).padding.top + 16,
      left: 16,
      child: Column(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: Colors.white,
            child: IconButton(
              icon: const Icon(Icons.close),
              onPressed: () {
                ref
                    .read(navigationControllerProvider.notifier)
                    .stopNavigation();
                Navigator.pop(context);
              },
            ),
          ),
          const SizedBox(height: 12),
          if (tripState.isNavigating)
            CircleAvatar(
              radius: 24,
              backgroundColor: Colors.white,
              child: IconButton(
                icon: const Icon(Icons.pause),
                onPressed: () {
                  ref
                      .read(navigationControllerProvider.notifier)
                      .pauseNavigation();
                },
              ),
            ),
          if (tripState.state == TripState.paused)
            CircleAvatar(
              radius: 24,
              backgroundColor: Colors.white,
              child: IconButton(
                icon: const Icon(Icons.play_arrow),
                onPressed: () {
                  ref
                      .read(navigationControllerProvider.notifier)
                      .resumeNavigation();
                },
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildArrivedOverlay() {
    return Container(
      color: Colors.black54,
      child: Center(
        child: Container(
          padding: const EdgeInsets.all(32),
          margin: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                LucideIcons.checkCircle,
                size: 64,
                color: Colors.green,
              ),
              const SizedBox(height: 16),
              Text(
                'You have arrived!',
                style: GoogleFonts.outfit(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () {
                  ref
                      .read(navigationControllerProvider.notifier)
                      .stopNavigation();
                  Navigator.pop(context);
                },
                child: const Text('Done'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
