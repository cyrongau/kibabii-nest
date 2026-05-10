import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'landlord_dashboard_screen.dart';
import 'landlord_tour_management_screen.dart';
import 'my_properties_screen.dart';
import 'booking_requests_screen.dart';
import 'wallet_screen.dart';
import 'reports_screen.dart';
import 'landlord_service_requests_screen.dart';

class LandlordMainScreen extends StatefulWidget {
  final int initialIndex;
  const LandlordMainScreen({super.key, this.initialIndex = 0});

  @override
  State<LandlordMainScreen> createState() => _LandlordMainScreenState();
}

class _LandlordMainScreenState extends State<LandlordMainScreen> {
  late int _selectedIndex;

  final List<Widget> _screens = [
    const LandlordDashboardScreen(),
    const MyPropertiesScreen(),
    const BookingRequestsScreen(),
    const LandlordTourManagementScreen(),
    const LandlordServiceRequestsScreen(),
    const WalletScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _selectedIndex = widget.initialIndex;
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedIndex,
          onTap: _onItemTapped,
          type: BottomNavigationBarType.fixed,
          backgroundColor: colorScheme.surface,
          selectedItemColor: colorScheme.primary,
          unselectedItemColor: colorScheme.onSurface.withOpacity(0.4),
          selectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 10),
          unselectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.medium, fontSize: 10),
          elevation: 0,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.layoutDashboard),
              activeIcon: Icon(LucideIcons.layoutDashboard),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.home),
              activeIcon: Icon(LucideIcons.home),
              label: 'Listings',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.calendarClock),
              activeIcon: Icon(LucideIcons.calendarClock),
              label: 'Bookings',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.calendarRange),
              activeIcon: Icon(LucideIcons.calendarRange),
              label: 'Tours',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.tool),
              activeIcon: Icon(LucideIcons.tool),
              label: 'Fixes',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.wallet),
              activeIcon: Icon(LucideIcons.wallet),
              label: 'Wallet',
            ),
          ],
        ),
      ),
    );
  }
}
