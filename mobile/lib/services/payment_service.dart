import 'api_service.dart';

class PaymentService {
  final ApiService _apiService = ApiService();

  Future<bool> captureManualPayment({
    required String bookingId,
    required String amount,
    required String method,
    required String reference,
    String? rawData,
  }) async {
    try {
      final response = await _apiService.post('/payments/manual', {
        'bookingId': bookingId,
        'amount': amount,
        'method': method,
        'reference': reference,
        'rawData': rawData,
      });
      return response != null;
    } catch (e) {
      return false;
    }
  }

  Future<Map<String, dynamic>?> initiateMpesa({
    required String paymentId,
    required String phoneNumber,
  }) async {
    try {
      final response = await _apiService.post('/payments/$paymentId/mpesa', {
        'phoneNumber': phoneNumber,
      });
      return response;
    } catch (e) {
      return null;
    }
  }

  Future<Map<String, dynamic>?> checkMpesaStatus(String checkoutRequestId) async {
    try {
      final response = await _apiService.get('/payments/mpesa/stk-query/$checkoutRequestId');
      return response;
    } catch (e) {
      return null;
    }
  }

  Future<Map<String, dynamic>?> payWithWallet(String paymentId) async {
    try {
      final response = await _apiService.post('/payments/$paymentId/wallet-pay', {});
      return response;
    } catch (e) {
      return null;
    }
  }

  Future<List<Map<String, dynamic>>> getPaymentHistory() async {
    try {
      final response = await _apiService.get('/payments/history');
      if (response is List) {
        return List<Map<String, dynamic>>.from(response as Iterable<dynamic>);
      }
      return [];
    } catch (e) {
      return [];
    }
  }
}
