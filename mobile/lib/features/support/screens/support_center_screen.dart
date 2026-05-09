import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import './submit_ticket_screen.dart';

class SupportCenterScreen extends StatelessWidget {
  const SupportCenterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      backgroundColor: colorScheme.background,
      appBar: AppBar(
        backgroundColor: colorScheme.surface,
        elevation: 0,
        leading: IconButton(
          icon: Icon(LucideIcons.chevronLeft, color: colorScheme.onSurface),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Support Center',
          style: GoogleFonts.outfit(color: colorScheme.onSurface, fontWeight: FontWeight.bold),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Hero Section
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(24, 32, 24, 40),
              decoration: BoxDecoration(
                color: colorScheme.surface,
                borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(40), bottomRight: Radius.circular(40)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: colorScheme.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(LucideIcons.helpCircle, color: colorScheme.primary, size: 28),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'How can we help\nyou today?',
                    style: GoogleFonts.outfit(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      color: colorScheme.onSurface,
                      height: 1.1,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Search for guides or submit a support ticket.',
                    style: GoogleFonts.outfit(
                      fontSize: 15,
                      color: colorScheme.onSurface.withOpacity(0.6),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // Help Categories
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Quick Guides',
                    style: GoogleFonts.outfit(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildGuideCard(
                    context,
                    LucideIcons.home,
                    'How to Book a Hostel',
                    'A step-by-step guide to finding and booking your next stay.',
                    colorScheme.primary,
                    () => _showGuide(context, 'booking', colorScheme),
                  ),
                  const SizedBox(height: 12),
                  _buildGuideCard(
                    context,
                    LucideIcons.shoppingBag,
                    'Using the Marketplace',
                    'Learn how to post ads and stay safe while buying or selling.',
                    const Color(0xFF10B981),
                    () => _showGuide(context, 'marketplace', colorScheme),
                  ),
                  const SizedBox(height: 12),
                  _buildGuideCard(
                    context,
                    LucideIcons.shieldCheck,
                    'Safety & Verification',
                    'Everything you need to know about KYC and platform security.',
                    Colors.orange,
                    () => _showGuide(context, 'safety', colorScheme),
                  ),
                  const SizedBox(height: 12),
                  _buildGuideCard(
                    context,
                    LucideIcons.layers,
                    'Property Classifications',
                    'Learn the difference between Hostels, Apartments, and more.',
                    const Color(0xFF8B5CF6),
                    () => _showGuide(context, 'classification', colorScheme),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 40),

            // Action Sections
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Still need help?',
                    style: GoogleFonts.outfit(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildActionCard(
                    context,
                    LucideIcons.ticket,
                    'Submit a Support Ticket',
                    'Our team will review your request and get back to you via chat.',
                    () => Navigator.push(context, MaterialPageRoute(builder: (context) => const SubmitTicketScreen())),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 40),

            // Legal Links
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: colorScheme.surface,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
                ),
                child: Column(
                  children: [
                    _buildLegalLink(LucideIcons.fileText, 'Terms of Service', 'https://kibabiinest.com/legal/terms', colorScheme),
                    const Divider(height: 32),
                    _buildLegalLink(LucideIcons.lock, 'Privacy Policy', 'https://kibabiinest.com/legal/privacy', colorScheme),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildGuideCard(BuildContext context, IconData icon, String title, String subtitle, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.05)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: Theme.of(context).colorScheme.onSurface),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: GoogleFonts.outfit(fontSize: 13, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6), height: 1.3),
                  ),
                ],
              ),
            ),
            Icon(LucideIcons.chevronRight, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.3), size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard(BuildContext context, IconData icon, String title, String subtitle, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Theme.of(context).colorScheme.primary, Theme.of(context).colorScheme.primary.withOpacity(0.8)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: Colors.white, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: GoogleFonts.outfit(fontSize: 13, color: Colors.white.withOpacity(0.9), height: 1.3),
                  ),
                ],
              ),
            ),
            const Icon(LucideIcons.chevronRight, color: Colors.white, size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildLegalLink(IconData icon, String title, String url, ColorScheme colorScheme) {
    return GestureDetector(
      onTap: () async {
        final uri = Uri.parse(url);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri);
        }
      },
      child: Row(
        children: [
          Icon(icon, color: colorScheme.onSurface.withOpacity(0.5), size: 20),
          const SizedBox(width: 12),
          Text(
            title,
            style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 15, color: colorScheme.onSurface.withOpacity(0.8)),
          ),
          const Spacer(),
          Icon(LucideIcons.externalLink, color: colorScheme.onSurface.withOpacity(0.2), size: 16),
        ],
      ),
    );
  }

  void _showGuide(BuildContext context, String type, ColorScheme colorScheme) {
    String title = '';
    List<Map<String, String>> steps = [];

    if (type == 'booking') {
      title = 'How to Book a Hostel';
      steps = [
        {'title': 'Browse Properties', 'desc': 'Explore hostels on the discovery home screen. Use filters to narrow down by category or price.'},
        {'title': 'Select your Unit', 'desc': 'Open a property to see available units (Single, Bedsitter, etc.). Check amenities and distance to campus.'},
        {'title': 'Schedule a Physical Tour', 'desc': 'Before paying, we highly recommend using the "Navigate" button to find the property and the "Schedule Tour" button to view it physically.'},
        {'title': 'Submit Booking', 'desc': 'Once satisfied, click "Book Now", choose your move-in date and duration, then submit your request.'},
        {'title': 'Wait for Approval', 'desc': 'The landlord will review your booking. You will be notified via chat or notifications once approved.'},
        {'title': 'Complete Payment', 'desc': 'After approval, go to "My Tenancy" to pay your rent and deposit via M-Pesa to confirm your room.'},
      ];
    } else if (type == 'marketplace') {
      title = 'Marketplace Guide';
      steps = [
        {'title': 'Posting an Item', 'desc': 'Click the "+" icon in the Marketplace. Add up to 4 photos, a clear title, price, and your contact phone number.'},
        {'title': 'Safety First', 'desc': 'Never send money to a seller before seeing the item. Always meet in public places like campus security zones.'},
        {'title': 'Buying Items', 'desc': 'Browse items by category. Use the "In-App Chat" or "Call" button to contact the seller directly.'},
        {'title': 'Selling Tips', 'desc': 'Describe your item honestly. Mention any flaws and why you are selling. Honest sellers build better trust.'},
      ];
    } else if (type == 'classification') {
      title = 'Property Classifications';
      steps = [
        {'title': 'Hostels', 'desc': 'Specifically designed for students. Usually feature Single, Double, or Bedsitter units with shared or private amenities.'},
        {'title': 'Bedsitters', 'desc': 'A single room that combines the bedroom, living area, and kitchenette. Private bathroom is usually attached.'},
        {'title': 'Single Rooms', 'desc': 'A single bedroom with shared kitchen and bathroom facilities. The most affordable option for students.'},
        {'title': 'Apartments', 'desc': 'Multi-room residential units (1-bedroom, 2-bedroom). Best for students sharing or those wanting more space.'},
        {'title': 'Rental Houses', 'desc': 'Standalone houses or cottages. Offers more privacy but may be further from campus.'},
      ];
    } else {
      title = 'Safety & Verification';
      steps = [
        {'title': 'Student Verification', 'desc': 'To book, you must upload your Student ID or National ID for verification.'},
        {'title': 'Landlord KYC', 'desc': 'All landlords are verified by the admin team with property ownership documents.'},
        {'title': 'Secure Payments', 'desc': 'Payments are handled through the platform to ensure records are kept and disputes can be resolved.'},
        {'title': 'Data Privacy', 'desc': 'Your documents are encrypted and only accessible by administrators for verification.'},
      ];
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.75,
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(color: colorScheme.onSurface.withOpacity(0.1), borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 24),
            Text(title, style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
            const SizedBox(height: 24),
            Expanded(
              child: ListView.builder(
                itemCount: steps.length,
                itemBuilder: (context, index) => Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 28, height: 28,
                        decoration: BoxDecoration(
                          color: colorScheme.primary,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Center(
                          child: Text(
                            '${index + 1}',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                              Text(
                                steps[index]['title']!,
                                style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: colorScheme.onSurface),
                              ),
                            const SizedBox(height: 4),
                            Text(
                              steps[index]['desc']!,
                              style: GoogleFonts.outfit(fontSize: 14, color: colorScheme.onSurface.withOpacity(0.6), height: 1.4),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: colorScheme.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: Text('Got it', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
