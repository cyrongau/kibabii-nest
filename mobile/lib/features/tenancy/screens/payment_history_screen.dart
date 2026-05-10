import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';

class PaymentHistoryScreen extends StatelessWidget {
  final List<dynamic> payments;

  const PaymentHistoryScreen({super.key, required this.payments});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: colorScheme.background,
      appBar: AppBar(
        title: Text('Payment History', 
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface)
        ),
        backgroundColor: colorScheme.surface,
        elevation: 0,
        leading: IconButton(
          icon: Icon(LucideIcons.chevronLeft, color: colorScheme.onSurface),
          onPressed: () => context.pop(),
        ),
      ),
      body: payments.isEmpty
          ? _buildEmptyState(colorScheme)
          : ListView.separated(
              padding: const EdgeInsets.all(24),
              itemCount: payments.length,
              separatorBuilder: (context, index) => const SizedBox(height: 16),
              itemBuilder: (context, index) {
                final p = payments[index];
                final status = p['status']?.toString().toUpperCase() ?? 'PENDING';
                final isPaid = status == 'PAID' || status == 'VERIFIED';
                final isPending = status == 'PENDING' || status == 'SUBMITTED';
                
                return Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: colorScheme.surface,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.02),
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
                          color: (isPaid ? const Color(0xFF10B981) : (isPending ? Colors.orange : Colors.red)).withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          isPaid ? LucideIcons.check : (isPending ? LucideIcons.clock : LucideIcons.xCircle),
                          color: isPaid ? const Color(0xFF10B981) : (isPending ? Colors.orange : Colors.red),
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Rent - ${DateFormat('MMMM yyyy').format(DateTime.parse(p['dueDate']))}',
                              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: colorScheme.onSurface),
                            ),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: (isPaid ? const Color(0xFF10B981) : (isPending ? Colors.orange : Colors.red)).withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                status,
                                style: GoogleFonts.outfit(
                                  color: (isPaid ? const Color(0xFF10B981) : (isPending ? Colors.orange : Colors.red)),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            'Ksh ${p['amountPaid'] > 0 ? p['amountPaid'] : p['amountDue']}',
                            style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 16, color: colorScheme.onSurface),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            DateFormat('dd MMM').format(DateTime.parse(p['dueDate'])),
                            style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.4), fontSize: 12),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }

  Widget _buildEmptyState(ColorScheme colorScheme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.creditCard, size: 64, color: colorScheme.onSurface.withOpacity(0.1)),
          const SizedBox(height: 16),
          Text(
            'No payments yet',
            style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface.withOpacity(0.6)),
          ),
        ],
      ),
    );
  }
}
