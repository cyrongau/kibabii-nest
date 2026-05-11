import '../constants.dart';

class ImageUtils {
  static String formatUrl(String? url) {
    if (url == null || url.isEmpty) return '';
    
    // If it's a relative path starting with /, prepend the base URL
    if (url.startsWith('/')) {
      return '${ApiConstants.baseUrl}$url';
    }

    // Handle localhost replacements for local dev on physical devices
    if (url.contains('localhost') || url.contains('127.0.0.1') || url.contains('192.168.')) {
      final baseUrl = ApiConstants.baseUrl;
      
      // If we are using a production domain (contains kibabii.generexcom.com), 
      // replace the entire localhost origin with the production base URL
      if (baseUrl.contains('kibabii.generexcom.com')) {
        // Replace http://localhost:3000/uploads/proxy/... with https://api.kibabii.generexcom.com/uploads/proxy/...
        return url.replaceAll(RegExp(r'http://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?'), baseUrl);
      }
      
      // Otherwise replace localhost with the configured host IP for local physical device testing
      return url.replaceAll(RegExp(r'localhost|127\.0\.0\.1|192\.168\.\d+\.\d+'), ApiConstants.host);
    }
    
    // If it's just a file path (no protocol, no leading slash), assume it's relative to baseUrl
    if (!url.startsWith('http') && !url.contains('://')) {
      return '${ApiConstants.baseUrl}/$url';
    }
    
    return url;
  }
}
