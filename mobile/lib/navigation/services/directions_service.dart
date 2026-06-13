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

  RouteModel _parseRoute(Map<String, dynamic> routeData) {
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

    return RouteModel(
      geometry: geometry.map((e) => List<double>.from(e)).toList(),
      distance: distance,
      duration: duration,
      maneuvers: maneuvers,
    );
  }

  Future<List<RouteModel>> getRoutes({
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
        return [cachedRoute];
      }
    }

    // Make API call only once (optimization #1)
    try {
      final url = '$_baseUrl/$profile/$startLng,$startLat;$endLng,$endLat';
      print('🚗 DirectionsService: Fetching routes from $url');
      
      final response = await _dio.get(
        url,
        queryParameters: {
          'steps': true,
          'geometries': 'geojson',
          'overview': 'full',
          'alternatives': true,
        },
      );

      final responseData = response.data;
      if (response.statusCode == 200 && responseData is Map<String, dynamic> && responseData['routes'] != null) {
        print('✅ DirectionsService: Routes received successfully');
        final routes = responseData['routes'] as List;
        if (routes.isEmpty) {
          print('⚠️ DirectionsService: Empty routes list');
          return [];
        }

        final List<RouteModel> parsedRoutes = [];
        for (var r in routes) {
          parsedRoutes.add(_parseRoute(Map<String, dynamic>.from(r)));
        }

        // Cache the primary route (optimization #5)
        if (useCache && parsedRoutes.isNotEmpty) {
          await RouteCacheService.cacheRoute(
            originKey: cacheKey,
            route: parsedRoutes[0],
            isUrban: true,
            isStaticProperty: true, // Properties don't move
          );
        }

        return parsedRoutes;
      }
      print('❌ DirectionsService: Failed with status ${response.statusCode}');
      print('❌ DirectionsService: Response payload: $responseData');
      return [];
    } catch (e) {
      if (e is DioException) {
        print('❌ DirectionsService: Network error: ${e.type} - ${e.message}');
        if (e.response != null) {
          print('❌ DirectionsService: Response data: ${e.response?.data}');
        }
      } else {
        print('❌ DirectionsService: Unexpected error: $e');
      }
      return [];
    }
  }

  Future<RouteModel?> getRoute({
    required double startLng,
    required double startLat,
    required double endLng,
    required double endLat,
    String profile = 'driving',
    bool useCache = true,
  }) async {
    final routes = await getRoutes(
      startLng: startLng,
      startLat: startLat,
      endLng: endLng,
      endLat: endLat,
      profile: profile,
      useCache: useCache,
    );
    return routes.isNotEmpty ? routes[0] : null;
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

  Future<List<RouteModel>> getWalkingRoutes({
    required double startLng,
    required double startLat,
    required double endLng,
    required double endLat,
    bool useCache = true,
  }) async {
    return getRoutes(
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