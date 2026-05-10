import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../features/discovery/screens/discovery_screen.dart';
import '../features/management/screens/add_property_screen.dart';
import '../features/management/screens/landlord_dashboard_screen.dart';
import '../features/management/screens/landlord_main_screen.dart';
import '../features/management/screens/landlord_tour_management_screen.dart';
import '../features/management/screens/my_properties_screen.dart';
import '../features/management/screens/booking_requests_screen.dart';
import '../features/management/screens/student_profile_view_screen.dart';
import '../features/admin/screens/admin_home_screen.dart';
import '../features/booking/screens/booking_review_screen.dart';
import '../features/booking/screens/my_bookings_screen.dart';
import '../features/auth/screens/auth_screen.dart';
import '../features/profile/screens/profile_screen.dart';
import '../features/profile/screens/document_scanner_screen.dart';
import '../features/onboarding/screens/onboarding_screen.dart';
import '../features/auth/screens/registration_screen.dart';
import '../features/discovery/screens/property_detail_screen.dart';
import '../features/discovery/screens/payment_screen.dart';
import '../features/discovery/screens/booking_confirmation_screen.dart';
import '../features/residency/screens/maintenance_hub_screen.dart';
import '../features/management/screens/approval_hub_screen.dart';
import '../features/management/screens/admin_oversight_screen.dart';
import '../features/management/screens/withdrawal_screen.dart';
import '../features/management/screens/financial_settings_screen.dart';
import '../features/discovery/screens/mapbox_explorer_screen.dart';
import '../features/notifications/screens/notifications_screen.dart';
import '../features/booking/screens/receipt_preview_screen.dart';
import '../features/chat/screens/chat_screen.dart';
import '../features/chat/screens/chat_list_screen.dart';
import '../features/support/screens/submit_ticket_screen.dart';
import '../features/management/screens/reports_screen.dart';
import '../features/management/screens/property_edit_screen.dart';
import '../features/management/screens/settings_screen.dart';
import '../features/management/screens/wallet_screen.dart';
import '../features/management/screens/landlord_service_requests_screen.dart';
import '../features/discovery/screens/saved_properties_screen.dart';
import '../features/profile/screens/edit_profile_screen.dart';
import '../features/profile/screens/docs_hub_screen.dart';
import '../features/tenancy/screens/my_tenancy_screen.dart';
import '../features/tenancy/screens/digital_agreement_screen.dart';
import '../features/tenancy/screens/payment_history_screen.dart';

class AppRouter {
  static final router = GoRouter(
    initialLocation: '/onboarding',
    routes: [
      GoRoute(
        path: '/saved-properties',
        builder: (context, state) => const SavedPropertiesScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: '/',
        builder: (context, state) => const DiscoveryScreen(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const DiscoveryScreen(),
      ),
      GoRoute(
        path: '/dashboard/student',
        builder: (context, state) => const DiscoveryScreen(),
      ),
      GoRoute(
        path: '/dashboard/landlord',
        builder: (context, state) => const LandlordMainScreen(),
      ),
      GoRoute(
        path: '/admin',
        builder: (context, state) => const AdminHomeScreen(),
      ),
      GoRoute(
        path: '/landlord-dashboard',
        builder: (context, state) => const LandlordMainScreen(),
      ),
      GoRoute(
        path: '/landlord/tours',
        builder: (context, state) => const LandlordTourManagementScreen(),
      ),
      GoRoute(
        path: '/my-properties',
        builder: (context, state) => const MyPropertiesScreen(),
      ),
      GoRoute(
        path: '/wallet',
        builder: (context, state) => const WalletScreen(),
      ),
      GoRoute(
        path: '/booking-requests',
        builder: (context, state) => const BookingRequestsScreen(),
      ),
      GoRoute(
        path: '/add-property',
        builder: (context, state) => const AddPropertyScreen(),
      ),
      GoRoute(
        path: '/my-bookings',
        builder: (context, state) => const MyBookingsScreen(),
      ),
      GoRoute(
        path: '/review-booking',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return BookingReviewScreen(
            propertyName: extra?['name'] ?? 'The Azure Commons',
            price: extra?['price'] ?? '4,500',
          );
        },
      ),
      GoRoute(
        path: '/payment',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return PaymentScreen(
            price: extra?['price']?.toString() ?? '4,500',
            propertyUnitId: extra?['propertyUnitId'] ?? '',
            propertyName: extra?['propertyName'] ?? 'The Azure Commons',
            propertyAddress: extra?['propertyAddress'] ?? 'Bungoma, Near Gate A',
            propertyImage: extra?['propertyImage'],
            extraCharges: extra?['extraCharges'],
            isTenancyPayment: extra?['isTenancyPayment'] ?? false,
            tenancyId: extra?['tenancyId'],
            unitName: extra?['unitName'],
          );
        },
      ),
      GoRoute(
        path: '/booking-confirmation',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return BookingConfirmationScreen(
            price: extra?['price']?.toString() ?? '4,500',
            isPending: extra?['isPending'] ?? false,
            bookingId: extra?['bookingId'],
            propertyName: extra?['propertyName'],
            unitType: extra?['unitType'],
            checkInDate: extra?['checkInDate'],
          );
        },
      ),
      GoRoute(
        path: '/auth',
        builder: (context, state) => const AuthScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return RegistrationScreen(isStudent: extra?['isStudent'] ?? true);
        },
      ),
      GoRoute(
        path: '/property-detail',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return PropertyDetailScreen(
            id: extra?['id']?.toString() ?? '',
            name: extra?['name']?.toString() ?? 'The Azure Commons',
            price: extra?['price']?.toString() ?? '4,500',
            rating: extra?['rating']?.toString() ?? '4.9',
            distance: extra?['distance']?.toString() ?? '5 mins walk',
            image: extra?['image']?.toString(),
            images: extra?['images'],
            latitude: double.tryParse(extra?['lat']?.toString() ?? ''),
            longitude: double.tryParse(extra?['lng']?.toString() ?? ''),
            units: extra?['units'],
            extraCharges: extra?['extraCharges'],
          );
        },
      ),
      // Profile Routes
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: '/profile/scan-document',
        builder: (context, state) => const DocumentScannerScreen(),
      ),
      GoRoute(
        path: '/profile/edit',
        builder: (context, state) => const EditProfileScreen(),
      ),
      // Landlord: View Student Profile
      GoRoute(
        path: '/student-profile/:id',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return StudentProfileViewScreen(
            studentId: state.pathParameters['id']!,
            studentName: extra?['name'] ?? 'Student',
            studentEmail: extra?['email'] ?? '',
          );
        },
      ),
      GoRoute(
        path: '/maintenance',
        builder: (context, state) => const MaintenanceHubScreen(),
      ),
      GoRoute(
        path: '/approval-hub',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return ApprovalHubScreen(initialTab: extra?['tab'] ?? 0);
        },
      ),
      GoRoute(
        path: '/landlord/maintenance',
        builder: (context, state) => const LandlordServiceRequestsScreen(),
      ),
      GoRoute(
        path: '/withdraw',
        builder: (context, state) => const WithdrawalScreen(),
      ),
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/financial-settings',
        builder: (context, state) => const FinancialSettingsScreen(),
      ),
      GoRoute(
        path: '/admin-oversight',
        builder: (context, state) => const AdminOversightScreen(),
      ),
      GoRoute(
        path: '/receipt-preview',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return ReceiptPreviewScreen(
            bookingId: extra?['bookingId'] ?? 'NEST-0000',
            propertyName: extra?['propertyName'] ?? 'The Azure Commons',
            price: extra?['price'] ?? '0',
            unitType: extra?['unitType'] ?? 'Standard',
            date: extra?['date'] ?? DateTime.now().toString(),
          );
        },
      ),
      GoRoute(
        path: '/map',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          // Use MapboxExplorerScreen as the primary map interface
          return MapboxExplorerScreen(
            targetLat: extra?['lat'],
            targetLng: extra?['lng'],
          );
        },
      ),
      GoRoute(
        path: '/chat-list',
        builder: (context, state) => const ChatListScreen(),
      ),
      GoRoute(
        path: '/chat',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return ChatScreen(
            conversationId: extra?['conversationId'] ?? '',
            otherUserId: extra?['otherUserId'] ?? '',
            otherUserName: extra?['otherUserName'] ?? 'User',
            otherUserAvatar: extra?['otherUserAvatar'],
            isSupportChat: extra?['isSupportChat'] ?? false,
          );
        },
      ),
      GoRoute(
        path: '/reports',
        builder: (context, state) => const ReportsScreen(),
      ),
      GoRoute(
        path: '/landlord/properties/:id/edit',
        builder: (context, state) => PropertyEditScreen(propertyId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsScreen(),
      ),
      GoRoute(
        path: '/landlord/financial-settings',
        builder: (context, state) => const FinancialSettingsScreen(),
      ),
      // Web-to-Mobile Mapping Routes
      GoRoute(
        path: '/dashboard/landlord/bookings/:id',
        builder: (context, state) => const BookingRequestsScreen(), // Mapping to overview for now
      ),
      GoRoute(
        path: '/dashboard/student/tenancy',
        builder: (context, state) => const MyBookingsScreen(),
      ),
      GoRoute(
        path: '/support',
        builder: (context, state) => const SubmitTicketScreen(),
      ),
      GoRoute(
        path: '/docs-hub',
        builder: (context, state) => const DocsHubScreen(),
      ),
      GoRoute(
        path: '/digital-agreement',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return DigitalAgreementScreen(
            bookingId: extra?['bookingId'] ?? '',
            propertyName: extra?['propertyName'] ?? 'The Azure Commons',
            unitType: extra?['unitType'] ?? 'Standard Unit',
          );
        },
      ),
      GoRoute(
        path: '/payment-history',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return PaymentHistoryScreen(payments: extra?['payments'] ?? []);
        },
      ),
      GoRoute(
        path: '/tenancy',
        builder: (context, state) => const MyTenancyScreen(),
      ),
    ],
  );
}
