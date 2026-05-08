import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();
  
  final String baseUrl = ApiConstants.baseUrl;

  Future<Map<String, dynamic>?> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      ).timeout(const Duration(seconds: 30));

      debugPrint("AuthService: Backend responded with status: ${response.statusCode}");

      if (response.statusCode == 201 || response.statusCode == 200) {
        final result = jsonDecode(response.body);
        await _saveAuthData(result);
        return result;
      } else {
        debugPrint("AuthService: Backend authentication failed. Body: ${response.body}");
      }
      return null;
    } catch (e) {
      print('Error during login: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> register(Map<String, dynamic> data) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(data),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final result = jsonDecode(response.body);
        await _saveAuthData(result);
        return result;
      }
      return null;
    } catch (e) {
      print('Error during registration: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> signInWithGoogle() async {
    try {
      debugPrint("AuthService: Starting Google Sign-In");
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        debugPrint("AuthService: Google Sign-In cancelled by user or failed (googleUser is null)");
        return null;
      }
      debugPrint("AuthService: Google Sign-In successful: ${googleUser.email}");

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      debugPrint("AuthService: Got Google Auth tokens. idToken length: ${googleAuth.idToken?.length ?? 0}");
      
      if (googleAuth.idToken == null) {
        debugPrint("AuthService: Google idToken is null!");
        return null;
      }
      
      // Send token to our backend with timeout
      debugPrint("AuthService: Sending tokens to backend: $baseUrl/auth/google");
      final response = await http.post(
        Uri.parse('$baseUrl/auth/google'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'idToken': googleAuth.idToken,
          'accessToken': googleAuth.accessToken,
        }),
      ).timeout(const Duration(seconds: 30));

      debugPrint("AuthService: Backend responded with status: ${response.statusCode}");

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await _saveAuthData(data);
        debugPrint("AuthService: Backend authentication successful");
        return data;
      } else {
        debugPrint("AuthService: Backend authentication failed. Body: ${response.body}");
        return null;
      }
    } catch (e) {
      print('Error during Google Sign-In: $e');
      return null;
    }
  }

  Future<void> sendOtp(String phone, Function(String) onCodeSent) async {
    await _auth.verifyPhoneNumber(
      phoneNumber: phone,
      verificationCompleted: (PhoneAuthCredential credential) async {
        // Auto-resolution (optional)
      },
      verificationFailed: (FirebaseAuthException e) {
        print('Phone verification failed: ${e.message}');
      },
      codeSent: (String verificationId, int? resendToken) {
        onCodeSent(verificationId);
      },
      codeAutoRetrievalTimeout: (String verificationId) {},
    );
  }

  Future<Map<String, dynamic>?> verifyOtp(String userId, String code) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/2fa/verify'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'userId': userId, 'code': code}),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        await _saveAuthData(data);
        return data;
      }
      return null;
    } catch (e) {
      print('Error verifying OTP: $e');
      return null;
    }
  }

  Future<void> _saveAuthData(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('access_token', data['access_token']);
    await prefs.setString('user', jsonEncode(data['user']));
  }

  Future<Map<String, dynamic>?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr == null) return null;
    return jsonDecode(userStr);
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    await _auth.signOut();
    await _googleSignIn.signOut();
  }
}
