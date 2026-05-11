import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/route_model.dart';
import '../models/maneuver_model.dart';

class RouteCacheService {
  static const String _cacheKey = 'route_cache';
  static const Duration _urbanCacheDuration = Duration(minutes: 30);
  static const Duration _ruralCacheDuration = Duration(hours: 6);
  static const Duration _propertyCacheDuration = Duration(hours: 24);

  static Future<void> cacheRoute({
    required String originKey,
    required RouteModel route,
    bool isUrban = true,
    bool isStaticProperty = false,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    
    Duration cacheDuration;
    if (isStaticProperty) {
      cacheDuration = _propertyCacheDuration;
    } else if (isUrban) {
      cacheDuration = _urbanCacheDuration;
    } else {
      cacheDuration = _ruralCacheDuration;
    }

    final cacheData = {
      'route': {
        'geometry': route.geometry,
        'distance': route.distance,
        'duration': route.duration,
        'maneuvers': route.maneuvers.map((m) => {
          'type': m.type,
          'modifier': m.modifier,
          'instruction': m.instruction,
          'distance': m.distance,
          'duration': m.duration,
          'location': m.location,
        }).toList(),
      },
      'cachedAt': DateTime.now().toIso8601String(),
      'expiresAt': DateTime.now().add(cacheDuration).toIso8601String(),
    };

    final cache = await _getCache();
    cache[originKey] = cacheData;
    
    await prefs.setString(_cacheKey, jsonEncode(cache));
  }

  static Future<RouteModel?> getCachedRoute(String originKey) async {
    final cache = await _getCache();
    final cachedData = cache[originKey];
    
    if (cachedData == null) return null;

    final expiresAt = DateTime.parse(cachedData['expiresAt'] as String);
    if (DateTime.now().isAfter(expiresAt)) {
      await _removeFromCache(originKey);
      return null;
    }

    final routeData = cachedData['route'] as Map<String, dynamic>;
    final maneuversData = routeData['maneuvers'] as List;
    
    final maneuvers = maneuversData.map((m) {
      final loc = m['location'] as List;
      return ManeuverModel(
        type: m['type'] as String,
        modifier: m['modifier'] as String,
        instruction: m['instruction'] as String,
        distance: (m['distance'] as num).toDouble(),
        duration: (m['duration'] as num).toDouble(),
        location: loc.map((e) => (e as num).toDouble()).toList(),
      );
    }).toList();

    return RouteModel(
      geometry: (routeData['geometry'] as List)
          .map((p) => (p as List).map((e) => (e as num).toDouble()).toList())
          .toList(),
      distance: (routeData['distance'] as num).toDouble(),
      duration: (routeData['duration'] as num).toDouble(),
      maneuvers: maneuvers,
    );
  }

  static Future<Map<String, dynamic>> _getCache() async {
    final prefs = await SharedPreferences.getInstance();
    final cachedString = prefs.getString(_cacheKey);
    if (cachedString == null) return {};
    
    try {
      return jsonDecode(cachedString) as Map<String, dynamic>;
    } catch (e) {
      return {};
    }
  }

  static Future<void> _removeFromCache(String originKey) async {
    final cache = await _getCache();
    cache.remove(originKey);
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_cacheKey, jsonEncode(cache));
  }

  static Future<void> clearExpiredCache() async {
    final cache = await _getCache();
    final now = DateTime.now();
    
    cache.removeWhere((key, value) {
      final expiresAt = DateTime.parse(value['expiresAt'] as String);
      return now.isAfter(expiresAt);
    });
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_cacheKey, jsonEncode(cache));
  }

  static String generateCacheKey(double startLat, double startLng, double endLat, double endLng) {
    // Round to reduce cache fragmentation
    final startLatRounded = (startLat * 1000).round() / 1000;
    final startLngRounded = (startLng * 1000).round() / 1000;
    final endLatRounded = (endLat * 1000).round() / 1000;
    final endLngRounded = (endLng * 1000).round() / 1000;
    
    return '${startLatRounded}_${startLngRounded}_${endLatRounded}_${endLngRounded}';
  }
}