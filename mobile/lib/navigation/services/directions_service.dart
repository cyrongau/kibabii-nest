import 'package:dio/dio.dart';
import '../../core/constants.dart';
import '../models/route_model.dart';
import '../models/maneuver_model.dart';
import 'route_cache_service.dart';

class DirectionsService {
  final Dio _dio;
  final String _baseUrl = '${ApiConstants.baseUrl}/navigation/directions';
  
  DirectionsService() : _dio = Dio();

  Future<RouteModel?> getRoute({
    required double startLng,
    required double startLat,
    required double endLng,
    required double endLat,
    String profile = 'driving',
    bool useCache = true,
  }) async {
    // Generate cache key
    final cacheKey = RouteCacheService.generateCacheKey(
      startLat, startLng, endLat, endLng,
    );

    // Check cache first (optimization #5)
    if (useCache) {
      final cachedRoute = await RouteCacheService.getCachedRoute(cacheKey);
      if (cachedRoute != null) {
        return cachedRoute;
      }
    }

    // Make API call only once (optimization #1)
    try {
      final url = '$_baseUrl/$profile/$startLng,$startLat;$endLng,$endLat';
      
      final response = await _dio.get(
        url,
        queryParameters: {
          'steps': true,
          'geometries': 'geojson',
          'overview': 'full',
        },
      );

      if (response.statusCode == 200 && response.data['routes'] != null) {
        final routes = response.data['routes'] as List;
        if (routes.isEmpty) return null;

        final routeData = routes[0];
        final geometry = routeData['geometry']['coordinates'] as List;
        final duration = routeData['duration'] as double;
        final distance = routeData['distance'] as double;
        
        final legs = routeData['legs'] as List;
        final List<ManeuverModel> maneuvers = [];
        
        for (var leg in legs) {
          final steps = leg['steps'] as List;
          for (var step in steps) {
            final maneuver = step['maneuver'];
            if (maneuver != null) {
              maneuvers.add(ManeuverModel(
                type: maneuver['type'] ?? '',
                modifier: maneuver['modifier'] ?? '',
                instruction: step['name'] ?? '',
                distance: (step['distance'] ?? 0).toDouble(),
                duration: (step['duration'] ?? 0).toDouble(),
                location: List<double>.from(maneuver['location'] ?? []),
              ));
            }
          }
        }

        final route = RouteModel(
          geometry: geometry.map((e) => List<double>.from(e)).toList(),
          distance: distance,
          duration: duration,
          maneuvers: maneuvers,
        );

        // Cache the route (optimization #5)
        if (useCache) {
          await RouteCacheService.cacheRoute(
            originKey: cacheKey,
            route: route,
            isUrban: true,
            isStaticProperty: true, // Properties don't move
          );
        }

        return route;
      }
      return null;
    } catch (e) {
      print('DirectionsService: Error fetching route: $e');
      return null;
    }
  }

  Future<RouteModel?> getWalkingRoute({
    required double startLng,
    required double startLat,
    required double endLng,
    required double endLat,
  }) async {
    return getRoute(
      startLng: startLng,
      startLat: startLat,
      endLng: endLng,
      endLat: endLat,
      profile: 'walking',
    );
  }

  Future<RouteModel?> getDrivingRoute({
    required double startLng,
    required double startLat,
    required double endLng,
    required double endLat,
  }) async {
    return getRoute(
      startLng: startLng,
      startLat: startLat,
      endLng: endLng,
      endLat: endLat,
      profile: 'driving',
    );
  }
}