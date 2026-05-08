import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';

class BookingConfirmationScreen extends StatelessWidget {
  final String price;
  final bool isPending;
  final String? bookingId;
  final String? propertyName;
  final String? unitType;
  final String? checkInDate;

  const BookingConfirmationScreen({
    super.key,
    required this.price,
    this.isPending = false,
    this.bookingId,
    this.propertyName,
    this.unitType,
    this.checkInDate,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 32.0, vertical: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: (isPending ? const Color(0xFFF59E0B) : const Color(0xFF10B981)).withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isPending ? LucideIcons.clock : LucideIcons.checkCircle2,
                  size: 80,
                  color: isPending ? const Color(0xFFF59E0B) : const Color(0xFF10B981),
                ),
              ),
              const SizedBox(height: 40),
              Text(
                isPending ? 'Submission Received!' : 'Booking Confirmed!',
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFF1E293B),
                  letterSpacing: -1,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                isPending
                    ? 'Your payment details have been submitted for verification. The landlord will review and confirm your booking shortly.'
                    : 'Your payment of Ksh $price has been received. Your room is now reserved at Kibabii Nest.',
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  color: const Color(0xFF64748B),
                  fontWeight: FontWeight.w500,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 48),
              _buildTicketCard(context),
              const SizedBox(height: 48),
              _buildActionButton(context),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTicketCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        children: [
          _buildTicketRow('Booking ID', bookingId ?? '#NEST-PENDING'),
          const SizedBox(height: 16),
          _buildTicketRow('Hostel', propertyName ?? 'The Azure Commons'),
          const SizedBox(height: 16),
          _buildTicketRow('Unit Type', unitType ?? 'Standard'),
          const SizedBox(height: 16),
          _buildTicketRow('Status', isPending ? 'PENDING VERIFICATION' : 'CONFIRMED'),
          const SizedBox(height: 16),
          _buildTicketRow('Check-in', checkInDate ?? 'May 10, 2026'),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 20),
            child: Divider(color: Color(0xFFE2E8F0)),
          ),
          InkWell(
            onTap: () => context.push('/map'),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(LucideIcons.mapPin, size: 14, color: Color(0xFF3B82F6)),
                const SizedBox(width: 8),
                Text(
                  'Show directions on map',
                  style: GoogleFonts.outfit(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF3B82F6),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTicketRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: GoogleFonts.outfit(color: const Color(0xFF64748B), fontWeight: FontWeight.bold, fontSize: 12)),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            value,
            textAlign: TextAlign.end,
            style: GoogleFonts.outfit(
              color: (value.contains('PENDING') || value.contains('VERIFICATION')) ? const Color(0xFFF59E0B) : const Color(0xFF1E293B),
              fontWeight: FontWeight.w900,
              fontSize: 14,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton(BuildContext context) {
    return Column(
      children: [
        Container(
          width: double.infinity,
          height: 64,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            color: const Color(0xFF1E293B),
            boxShadow: [
              BoxShadow(color: const Color(0xFF1E293B).withOpacity(0.2), blurRadius: 20, offset: const Offset(0, 10))
            ],
          ),
          child: ElevatedButton(
            onPressed: () => context.go('/'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.transparent,
              shadowColor: Colors.transparent,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            ),
            child: Text(
              'Back to Discovery',
              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
            ),
          ),
        ),
        const SizedBox(height: 16),
        TextButton(
          onPressed: () {
            // Receipt Preview logic
            context.push('/receipt-preview', extra: {
              'bookingId': bookingId,
              'propertyName': propertyName,
              'price': price,
              'unitType': unitType,
              'date': DateTime.now().toString(),
            });
          },
          child: Text(
            'Download Receipt',
            style: GoogleFonts.outfit(color: const Color(0xFF64748B), fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }
}
