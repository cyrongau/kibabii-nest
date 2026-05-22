import 'package:dio/dio.dart';
import '../../core/constants.dart';
import '../models/route_model.dart';
import '../models/maneuver_model.dart';
import 'route_cache_service.dart';

class DirectionsService {
  final Dio _dio;
  final String _baseUrl = '${ApiConstants.baseUrl}/navigation/directions';
  
  DirectionsService() : _dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 15),
    sendTimeout: const Duration(seconds: 15),
  ));

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
      print('🚗 DirectionsService: Fetching route from $url');
      
      final response = await _dio.get(
        url,
        queryParameters: {
          'steps': true,
          'geometries': 'geojson',
          'overview': 'full',
        },
      );

      final responseData = response.data;
      if (response.statusCode == 200 && responseData is Map<String, dynamic> && responseData['routes'] != null) {
        print('✅ DirectionsService: Route received successfully');
        final routes = responseData['routes'] as List;
        if (routes.isEmpty) {
          print('⚠️ DirectionsService: Empty routes list');
          return null;
        }

        final routeData = routes[0];
        final geometry = routeData['geometry']['coordinates'] as List;
        final duration = (routeData['duration'] ?? 0).toDouble();
        final distance = (routeData['distance'] ?? 0).toDouble();
        
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
      print('❌ DirectionsService: Failed with status ${response.statusCode}');
      print('❌ DirectionsService: Response payload: $responseData');
      return null;
    } catch (e) {
      if (e is DioException) {
        print('❌ DirectionsService: Network error: ${e.type} - ${e.message}');
        if (e.response != null) {
          print('❌ DirectionsService: Response data: ${e.response?.data}');
        }
      } else {
        print('❌ DirectionsService: Unexpected error: $e');
      }
      return null;
    }
  }

  Future<RouteModel?> getWalkingRoute({
    required double startLng,
    required double startLat,
    required double endLng,
    required double endLat,
    bool useCache = true,
  }) async {
    return getRoute(
      startLng: startLng,
      startLat: startLat,
      endLng: endLng,
      endLat: endLat,
      profile: 'walking',
      useCache: useCache,
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