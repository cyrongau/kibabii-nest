import 'dart:convert';
import 'dart:io';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants.dart';
import 'auth_service.dart';

class ApiService {
  final String baseUrl = ApiConstants.baseUrl;

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  Future<Map<String, dynamic>?> _getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr == null) return null;
    return jsonDecode(userStr);
  }

  Map<String, String> _authHeaders(String token) => {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $token',
  };

  Future<String?> get currentUserId async {
    final user = await _getUser();
    return user?['id'];
  }

  // ── Chat & Messaging ──

  Future<List<dynamic>> getConversations() async {
    final token = await getToken();
    if (token == null) return [];

    final response = await http.get(
      Uri.parse('$baseUrl/messages/conversations'),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }

  Future<List<dynamic>> getMessages(String conversationId) async {
    final token = await getToken();
    if (token == null) return [];

    final response = await http.get(
      Uri.parse('$baseUrl/messages/conversations/$conversationId'),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }

  // ── Profile ──

  Future<Map<String, dynamic>?> getMyProfile() async {
    final token = await getToken();
    final user = await _getUser();
    if (token == null || user == null) return null;

    final response = await http.get(
      Uri.parse('$baseUrl/users/${user['id']}'),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return null;
  }

  Future<Map<String, dynamic>?> updateProfile(Map<String, dynamic> data) async {
    final token = await getToken();
    final user = await _getUser();
    if (token == null || user == null) return null;

    final response = await http.patch(
      Uri.parse('$baseUrl/users/${user['id']}'),
      headers: _authHeaders(token),
      body: jsonEncode(data),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return null;
  }

  // ── Student Identity ──

  Future<String?> uploadImage(File file, {String folder = 'avatars'}) async {
    final token = await getToken();
    if (token == null) return null;

    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/uploads/image?folder=$folder'),
    );
    request.headers['Authorization'] = 'Bearer $token';
    
    final mimeType = file.path.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    request.files.add(await http.MultipartFile.fromPath(
      'file', 
      file.path,
      contentType: MediaType.parse(mimeType),
    ));

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 201 || response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['url'];
    }
    return null;
  }

  Future<String?> uploadVideo(File file) async {
    final token = await getToken();
    if (token == null) return null;

    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/uploads/video'),
    );
    request.headers['Authorization'] = 'Bearer $token';
    
    request.files.add(await http.MultipartFile.fromPath(
      'file', 
      file.path,
      contentType: MediaType.parse('video/mp4'),
    ));

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 201 || response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['url'];
    }
    return null;
  }

  Future<String?> uploadDocument(File file, {String folder = 'documents'}) async {
    final token = await getToken();
    if (token == null) return null;

    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/uploads/document?folder=$folder'),
    );
    request.headers['Authorization'] = 'Bearer $token';
    
    String mimeType = 'application/octet-stream';
    final path = file.path.toLowerCase();
    if (path.endsWith('.pdf')) mimeType = 'application/pdf';
    else if (path.endsWith('.png')) mimeType = 'image/png';
    else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) mimeType = 'image/jpeg';

    request.files.add(await http.MultipartFile.fromPath(
      'file', 
      file.path,
      contentType: MediaType.parse(mimeType),
    ));

    final streamedResponse = await request.send().timeout(ApiConstants.extendedTimeout);
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 201 || response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['url'];
    }
    return null;
  }

  Future<Map<String, dynamic>?> submitIdentity({
    required String documentUrl,
    String? documentType,
    String? universityRegNo,
  }) async {
    final token = await getToken();
    if (token == null) return null;

    final response = await http.post(
      Uri.parse('$baseUrl/users/identity/upload'),
      headers: _authHeaders(token),
      body: jsonEncode({
        'documentUrl': documentUrl,
        if (documentType != null) 'documentType': documentType,
        if (universityRegNo != null) 'universityRegNo': universityRegNo,
      }),
    ).timeout(ApiConstants.extendedTimeout);

    if (response.statusCode == 201 || response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return null;
  }

  Future<Map<String, dynamic>?> getMyIdentity() async {
    final token = await getToken();
    if (token == null) return null;

    final response = await http.get(
      Uri.parse('$baseUrl/users/identity/me'),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200) {
      final body = response.body;
      if (body.isEmpty || body == 'null') return null;
      return jsonDecode(body);
    }
    return null;
  }

  Future<Map<String, dynamic>?> getStudentIdentity(String studentId) async {
    final token = await getToken();
    if (token == null) return null;

    final response = await http.get(
      Uri.parse('$baseUrl/users/$studentId/identity'),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return null;
  }

  // ── Bookings ──


  Future<List<dynamic>> getLandlordBookings() async {
    final token = await getToken();
    if (token == null) return [];

    final response = await http.get(
      Uri.parse('$baseUrl/bookings/landlord'),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data is List ? data : [];
    }
    return [];
  }

  Future<bool> updateBookingStatus(String bookingId, String status) async {
    final token = await getToken();
    if (token == null) return false;

    final response = await http.patch(
      Uri.parse('$baseUrl/bookings/$bookingId/status'),
      headers: _authHeaders(token),
      body: jsonEncode({'status': status}),
    );

    return response.statusCode == 200;
  }

  // ── Properties ──

  Future<Map<String, dynamic>?> createProperty(Map<String, dynamic> data) async {
    final token = await getToken();
    if (token == null) return null;

    final response = await http.post(
      Uri.parse('$baseUrl/properties'),
      headers: _authHeaders(token),
      body: jsonEncode(data),
    );

    if (response.statusCode == 201 || response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return null;
  }

  Future<List<dynamic>> getMyProperties() async {
    final token = await getToken();
    if (token == null) return [];

    final response = await http.get(
      Uri.parse('$baseUrl/properties/landlord/all'),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }

  Future<Map<String, dynamic>?> getLandlordStats() async {
    final token = await getToken();
    if (token == null) return null;

    final response = await http.get(
      Uri.parse('$baseUrl/properties/stats/landlord'),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return null;
  }

  Future<List<dynamic>> getLandlordPayments() async {
    final token = await getToken();
    if (token == null) return [];

    final response = await http.get(
      Uri.parse('$baseUrl/payments/landlord'),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }

  Future<bool> verifyPayment(String paymentId, bool approved) async {
    final token = await getToken();
    if (token == null) return false;

    final response = await http.patch(
      Uri.parse('$baseUrl/payments/$paymentId/verify'),
      headers: _authHeaders(token),
      body: jsonEncode({'approved': approved}),
    );

    return response.statusCode == 200;
  }

  Future<Map<String, dynamic>?> getPropertyById(String id) async {
    final token = await getToken();
    if (token == null) return null;

    final response = await http.get(
      Uri.parse('$baseUrl/properties/$id'),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return null;
  }

  Future<Map<String, dynamic>?> updateProperty(String id, Map<String, dynamic> data) async {
    final token = await getToken();
    if (token == null) return null;

    final response = await http.patch(
      Uri.parse('$baseUrl/properties/$id'),
      headers: _authHeaders(token),
      body: jsonEncode(data),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return null;
  }

  Future<List<dynamic>> getProperties({String? search, String? type, double? minPrice, double? maxPrice}) async {
    final token = await getToken();
    try {
      final queryParams = {
        if (search != null) 'search': search,
        if (type != null) 'type': type,
        if (minPrice != null) 'minPrice': minPrice.toString(),
        if (maxPrice != null) 'maxPrice': maxPrice.toString(),
      };
      
      final uri = Uri.parse('$baseUrl/properties').replace(queryParameters: queryParams);
      
      final response = await http.get(
        uri,
        headers: token != null ? _authHeaders(token) : null,
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        print('Error fetching properties: Status ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching properties: $e');
    }
    return [];
  }

  Future<Map<String, dynamic>?> createBooking({
    required String propertyUnitId,
    required double amount,
    int months = 1,
  }) async {
    final token = await getToken();
    if (token == null) {
      print('Booking failed: No auth token found');
      return null;
    }

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/bookings'),
        headers: _authHeaders(token),
        body: jsonEncode({
          'propertyUnitId': propertyUnitId,
          'amount': amount,
          'months': months,
        }),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 201 || response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        print('Booking failed: Status ${response.statusCode}, Body: ${response.body}');
      }
    } catch (e) {
      print('Booking error: $e');
    }
    return null;
  }

  Future<List<dynamic>> getMyBookings() async {
    final token = await getToken();
    if (token == null) return [];

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/bookings/my-bookings'),
        headers: _authHeaders(token),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print('Fetch bookings error: $e');
    }
    return [];
  }

  // ── Favorites ──

  Future<bool> toggleFavorite(String propertyId) async {
    final token = await getToken();
    if (token == null) return false;

    final response = await http.post(
      Uri.parse('$baseUrl/favorites/toggle/$propertyId'),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 201 || response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['favorited'] ?? false;
    }
    return false;
  }

  Future<List<dynamic>> getMyFavorites() async {
    final token = await getToken();
    if (token == null) return [];

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/favorites/my-favorites'),
        headers: _authHeaders(token),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final List<dynamic> favorites = jsonDecode(response.body);
        return favorites
            .map((f) => f['property'])
            .where((p) => p != null)
            .toList();
      }
    } catch (e) {
      // Log error silently or via a logger
    }
    return [];
  }

  Future<bool> isFavorited(String propertyId) async {
    final token = await getToken();
    if (token == null) return false;

    final response = await http.get(
      Uri.parse('$baseUrl/favorites/check/$propertyId'),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['isFavorited'] ?? false;
    }
    return false;
  }

  // ── Reviews ──

  Future<Map<String, dynamic>?> createReview(String propertyId, int rating, String comment) async {
    final token = await getToken();
    if (token == null) return null;

    final response = await http.post(
      Uri.parse('$baseUrl/reviews'),
      headers: _authHeaders(token),
      body: jsonEncode({
        'propertyId': propertyId,
        'rating': rating,
        'comment': comment,
      }),
    );

    if (response.statusCode == 201 || response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return null;
  }

  Future<List<dynamic>> getPropertyReviews(String propertyId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/reviews/property/$propertyId'),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }

  // ── Tenancy ──
  
  Future<List<dynamic>> getMyTenancies() async {
    final token = await getToken();
    if (token == null) return [];

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/tenancy/my-tenancies'),
        headers: _authHeaders(token),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print('Fetch tenancies error: $e');
    }
    return [];
  }

  Future<bool> fileVacationNotice(String tenancyId) async {
    final token = await getToken();
    if (token == null) return false;

    final response = await http.post(
      Uri.parse('$baseUrl/tenancy/$tenancyId/vacation-notice'),
      headers: _authHeaders(token),
    );

    return response.statusCode == 201 || response.statusCode == 200;
  }

  Future<bool> signTenancy(String tenancyId, {String? signatureBase64}) async {
    final token = await getToken();
    if (token == null) return false;

    final response = await http.post(
      Uri.parse('$baseUrl/tenancy/$tenancyId/sign'),
      headers: _authHeaders(token),
      body: jsonEncode({
        'agreementUrl': 'signed_digitally_via_mobile',
        if (signatureBase64 != null) 'signature': signatureBase64,
      }),
    );

    return response.statusCode == 201 || response.statusCode == 200;
  }

  Future<bool> createServiceRequest({
    required String propertyId,
    required String title,
    required String description,
    String priority = 'MEDIUM',
    List<String> photos = const [],
  }) async {
    final token = await getToken();
    if (token == null) return false;

    final response = await http.post(
      Uri.parse('$baseUrl/service-requests'),
      headers: _authHeaders(token),
      body: jsonEncode({
        'propertyId': propertyId,
        'title': title,
        'description': description,
        'priority': priority,
        'photos': photos,
      }),
    );

    return response.statusCode == 201 || response.statusCode == 200;
  }

  Future<List<dynamic>> getTenantServiceRequests() async {
    final token = await getToken();
    if (token == null) return [];

    final response = await http.get(
      Uri.parse('$baseUrl/service-requests/tenant'),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }

  Future<List<dynamic>> getLandlordServiceRequests() async {
    final token = await getToken();
    if (token == null) return [];

    final response = await http.get(
      Uri.parse('$baseUrl/service-requests/landlord'),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }

  Future<bool> updateServiceRequestStatus(String requestId, String status) async {
    final token = await getToken();
    if (token == null) return false;

    final response = await http.patch(
      Uri.parse('$baseUrl/service-requests/$requestId/status'),
      headers: _authHeaders(token),
      body: jsonEncode({'status': status}),
    );

    return response.statusCode == 200;
  }

  // ── Tours & Open Days ──

  Future<Map<String, dynamic>?> requestTour(String propertyId, DateTime tourDate) async {
    final token = await getToken();
    if (token == null) return null;

    final response = await http.post(
      Uri.parse('$baseUrl/tours/request'),
      headers: _authHeaders(token),
      body: jsonEncode({
        'propertyId': propertyId,
        'tourDate': tourDate.toIso8601String(),
      }),
    );

    if (response.statusCode == 201 || response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return null;
  }

  Future<List<dynamic>> getStudentTours() async {
    final token = await getToken();
    if (token == null) return [];

    final response = await http.get(
      Uri.parse('$baseUrl/tours/student'),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }

  Future<List<dynamic>> getLandlordTours() async {
    final token = await getToken();
    if (token == null) return [];

    final response = await http.get(
      Uri.parse('$baseUrl/tours/landlord'),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }

  Future<bool> updateTourStatus(String tourId, String status, {String? feedback}) async {
    final token = await getToken();
    if (token == null) return false;

    final response = await http.patch(
      Uri.parse('$baseUrl/tours/$tourId/status'),
      headers: _authHeaders(token),
      body: jsonEncode({
        'status': status,
        if (feedback != null) 'feedback': feedback,
      }),
    );

    return response.statusCode == 200;
  }

  Future<Map<String, dynamic>?> createOpenDay({
    required String propertyId,
    required DateTime date,
    required String startTime,
    required String endTime,
    String? description,
  }) async {
    final token = await getToken();
    if (token == null) return null;

    final response = await http.post(
      Uri.parse('$baseUrl/tours/open-days'),
      headers: _authHeaders(token),
      body: jsonEncode({
        'propertyId': propertyId,
        'date': date.toIso8601String(),
        'startTime': startTime,
        'endTime': endTime,
        if (description != null) 'description': description,
      }),
    );

    if (response.statusCode == 201 || response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return null;
  }

  Future<List<dynamic>> getPropertyOpenDays(String propertyId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/tours/property/$propertyId/open-days'),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }

  // ── Notifications & Announcements ──

  Future<List<dynamic>> getAnnouncements() async {
    final token = await getToken();
    if (token == null) return [];

    final response = await http.get(
      Uri.parse('$baseUrl/notices/my-notices'),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data is List ? data : [];
    }
    return [];
  }

  Future<List<dynamic>> getNotifications() async {
    final token = await getToken();
    if (token == null) return [];

    final response = await http.get(
      Uri.parse('$baseUrl/notifications'),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data is List ? data : [];
    }
    return [];
  }

  Future<bool> markNotificationAsRead(String id) async {
    final token = await getToken();
    if (token == null) return false;

    final response = await http.patch(
      Uri.parse('$baseUrl/notifications/$id/read'),
      headers: _authHeaders(token),
    );

    return response.statusCode == 200;
  }

  // ── Community Hub ──

  Future<List<dynamic>> getFeaturedTestimonials() async {
    final response = await http.get(Uri.parse('$baseUrl/community/testimonials/featured'));
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }

  Future<bool> submitTestimonial(String content, {int rating = 5}) async {
    final token = await getToken();
    if (token == null) return false;

    final response = await http.post(
      Uri.parse('$baseUrl/community/testimonials'),
      headers: _authHeaders(token),
      body: jsonEncode({'content': content, 'rating': rating}),
    );

    return response.statusCode == 201 || response.statusCode == 200;
  }

  Future<List<dynamic>> getStudentMatches() async {
    final token = await getToken();
    if (token == null) return [];

    final response = await http.get(
      Uri.parse('$baseUrl/community/matching'),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }

  Future<Map<String, dynamic>?> updateCommunityProfile(Map<String, dynamic> data) async {
    final token = await getToken();
    if (token == null) return null;

    final response = await http.patch(
      Uri.parse('$baseUrl/community/profile'),
      headers: _authHeaders(token),
      body: jsonEncode(data),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return null;
  }

  Future<List<dynamic>> getGeneralAnnouncements() async {
    final token = await getToken();
    if (token == null) return [];

    final response = await http.get(
      Uri.parse('$baseUrl/notices/general'),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data is List ? data : [];
    }
    return [];
  }

  Future<Map<String, dynamic>?> getCommunityProfile() async {
    final token = await getToken();
    if (token == null) return null;

    final response = await http.get(
      Uri.parse('$baseUrl/community/profile/me'),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return null;
  }

  Future<List<dynamic>> getMyMarketplaceItems() async {
    final token = await getToken();
    if (token == null) return [];

    final response = await http.get(
      Uri.parse('$baseUrl/marketplace/my-items'),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }

  Future<List<dynamic>> getMarketplaceItems({String? category, String? search}) async {
    final queryParams = {
      if (category != null) 'category': category,
      if (search != null) 'search': search,
    };
    final uri = Uri.parse('$baseUrl/marketplace').replace(queryParameters: queryParams);
    
    final response = await http.get(uri);
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }

  Future<Map<String, dynamic>?> createMarketplaceItem(Map<String, dynamic> data) async {
    final token = await getToken();
    if (token == null) return null;

    final response = await http.post(
      Uri.parse('$baseUrl/marketplace'),
      headers: _authHeaders(token),
      body: jsonEncode(data),
    );

    if (response.statusCode == 201 || response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return null;
  }

  Future<Map<String, dynamic>?> updateMarketplaceItem(String id, Map<String, dynamic> data) async {
    final token = await getToken();
    if (token == null) return null;

    final response = await http.patch(
      Uri.parse('$baseUrl/marketplace/$id'),
      headers: _authHeaders(token),
      body: jsonEncode(data),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return null;
  }

  Future<bool> deleteMarketplaceItem(String id) async {
    final token = await getToken();
    if (token == null) return false;

    final response = await http.delete(
      Uri.parse('$baseUrl/marketplace/$id'),
      headers: _authHeaders(token),
    );

    return response.statusCode == 200;
  }

  Future<bool> markAsSold(String id) async {
    final token = await getToken();
    if (token == null) return false;

    final response = await http.patch(
      Uri.parse('$baseUrl/marketplace/$id/sold'),
      headers: _authHeaders(token),
    );

    return response.statusCode == 200;
  }

  Future<Map<String, dynamic>?> getMarketplaceItemDetails(String id) async {
    final response = await http.get(Uri.parse('$baseUrl/marketplace/$id'));
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return null;
  }

  Future<bool> acceptMarketplaceTerms() async {
    final token = await getToken();
    if (token == null) return false;

    final response = await http.post(
      Uri.parse('$baseUrl/users/marketplace/accept-terms'),
      headers: _authHeaders(token),
    );

    return response.statusCode == 200;
  }

  // ── Study Buddies ──

  Future<List<dynamic>> getStudyPosts({String? faculty}) async {
    final token = await getToken();
    if (token == null) return [];

    final uri = Uri.parse('$baseUrl/community/study-buddies').replace(
      queryParameters: {if (faculty != null) 'faculty': faculty}
    );
    
    final response = await http.get(uri, headers: _authHeaders(token));
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }

  Future<bool> createStudyPost(Map<String, dynamic> data) async {
    final token = await getToken();
    if (token == null) return false;

    final response = await http.post(
      Uri.parse('$baseUrl/community/study-buddies'),
      headers: _authHeaders(token),
      body: jsonEncode(data),
    );

    return response.statusCode == 201 || response.statusCode == 200;
  }

  Future<bool> addStudyReply(String postId, String content) async {
    final token = await getToken();
    if (token == null) return false;

    final response = await http.post(
      Uri.parse('$baseUrl/community/study-buddies/$postId/reply'),
      headers: _authHeaders(token),
      body: jsonEncode({'content': content}),
    );

    return response.statusCode == 201 || response.statusCode == 200;
  }

  Future<Map<String, dynamic>?> getStudyPostDetails(String postId) async {
    final token = await getToken();
    if (token == null) return null;

    final response = await http.get(
      Uri.parse('$baseUrl/community/study-buddies/$postId'),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return null;
  }

  // ── Payments Archive ──

  Future<List<dynamic>> getPaymentArchive() async {
    final token = await getToken();
    final user = await _getUser();
    if (token == null || user == null) return [];

    // Assuming we fetch by all tenancies for the student
    final response = await http.get(
      Uri.parse('$baseUrl/payments/history'), // I'll need to implement this in backend
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }

  // ── Support & Chat ──

  Future<Map<String, dynamic>?> createSupportTicket(Map<String, dynamic> data) async {
    final token = await getToken();
    if (token == null) return null;

    final response = await http.post(
      Uri.parse('$baseUrl/support/tickets'),
      headers: _authHeaders(token),
      body: jsonEncode(data),
    );

    if (response.statusCode == 201 || response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return null;
  }

  Future<List<dynamic>> getMyTickets() async {
    final token = await getToken();
    if (token == null) return [];

    final response = await http.get(
      Uri.parse('$baseUrl/support/my-tickets'),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }

  Future<List<dynamic>> getConversationMessages(String conversationId) async {
    final token = await getToken();
    if (token == null) return [];

    final response = await http.get(
      Uri.parse('$baseUrl/messages/conversation-by-id/$conversationId'),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data is Map && data.containsKey('messages')) {
        return data['messages'] as List<dynamic>;
      }
      return data is List ? data : [];
    }
    return [];
  }

  Future<Map<String, dynamic>?> getOrCreateConversation(String otherUserId, {String category = 'GENERAL', String? marketplaceItemId}) async {
    final token = await getToken();
    if (token == null) return null;

    String url = '$baseUrl/messages/conversation/$otherUserId?category=$category';
    if (marketplaceItemId != null) {
      url += '&marketplaceItemId=$marketplaceItemId';
    }

    final response = await http.get(
      Uri.parse(url),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    }
    return null;
  }

  /// Sends a message via the REST API. Used as a fallback when the socket
  /// is not connected. The backend also broadcasts via socket on success.
  Future<Map<String, dynamic>?> sendMessageRest({
    required String receiverId,
    required String content,
  }) async {
    final token = await getToken();
    if (token == null) return null;

    final response = await http.post(
      Uri.parse('$baseUrl/messages'),
      headers: _authHeaders(token),
      body: jsonEncode({'receiverId': receiverId, 'content': content}),
    ).timeout(ApiConstants.defaultTimeout);

    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    }
    return null;
  }

  Future<List<dynamic>> searchUsers(String query) async {
    final token = await getToken();
    if (token == null) return [];

    final response = await http.get(
      Uri.parse('$baseUrl/messages/search-users?q=$query'),
      headers: _authHeaders(token),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }

  // ── Generic REST Helpers ──

  Future<dynamic> get(String endpoint) async {
    final token = await getToken();
    print('API GET: $baseUrl$endpoint (Token: ${token != null ? 'Present' : 'Missing'})');
    try {
      final response = await http.get(
        Uri.parse('$baseUrl$endpoint'),
        headers: token != null ? _authHeaders(token) : {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return jsonDecode(response.body);
      }
      
      final errorBody = jsonDecode(response.body);
      final message = errorBody['message'] ?? 'An error occurred';
      throw Exception(message is List ? message.join(', ') : message);
    } catch (e) {
      if (e is Exception && !e.toString().contains('Exception:')) {
         rethrow;
      }
      print('API GET Exception [$endpoint]: $e');
      rethrow;
    }
  }

  Future<dynamic> post(String endpoint, Map<String, dynamic> data) async {
    final token = await getToken();
    print('API POST: $baseUrl$endpoint (Token: ${token != null ? 'Present' : 'Missing'})');
    try {
      final response = await http.post(
        Uri.parse('$baseUrl$endpoint'),
        headers: token != null ? _authHeaders(token) : {'Content-Type': 'application/json'},
        body: jsonEncode(data),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return jsonDecode(response.body);
      }

      final errorBody = jsonDecode(response.body);
      final message = errorBody['message'] ?? 'An error occurred';
      throw Exception(message is List ? message.join(', ') : message);
    } catch (e) {
      if (e is Exception && !e.toString().contains('Exception:')) {
         rethrow;
      }
      print('API POST Exception [$endpoint]: $e');
      rethrow;
    }
  }

  Future<dynamic> patch(String endpoint, Map<String, dynamic> data) async {
    final token = await getToken();
    print('API PATCH: $baseUrl$endpoint (Token: ${token != null ? 'Present' : 'Missing'})');
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl$endpoint'),
        headers: token != null ? _authHeaders(token) : {'Content-Type': 'application/json'},
        body: jsonEncode(data),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return jsonDecode(response.body);
      }

      final errorBody = jsonDecode(response.body);
      final message = errorBody['message'] ?? 'An error occurred';
      throw Exception(message is List ? message.join(', ') : message);
    } catch (e) {
      if (e is Exception && !e.toString().contains('Exception:')) {
         rethrow;
      }
      print('API PATCH Exception [$endpoint]: $e');
      rethrow;
    }
  }


}
