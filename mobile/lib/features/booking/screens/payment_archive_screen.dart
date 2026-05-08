import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../../services/api_service.dart';
import 'receipt_preview_screen.dart';

class PaymentArchiveScreen extends StatefulWidget {
  const PaymentArchiveScreen({super.key});

  @override
  State<PaymentArchiveScreen> createState() => _PaymentArchiveScreenState();
}

class _PaymentArchiveScreenState extends State<PaymentArchiveScreen> {
  final ApiService _api = ApiService();
  bool _isLoading = false;
  List<dynamic> _payments = [];

  @override
  void initState() {
    super.initState();
    _fetchHistory();
  }

  Future<void> _fetchHistory() async {
    setState(() => _isLoading = true);
    try {
      final history = await _api.getPaymentArchive();
      setState(() => _payments = history);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: Color(0xFF1E293B)),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Financial Records',
          style: GoogleFonts.outfit(color: const Color(0xFF1E293B), fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.download, color: Color(0xFF3B82F6)),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Statement export (CSV) coming soon!')));
            },
          ),
        ],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : _payments.isEmpty
          ? _buildEmptyState()
          : ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: _payments.length,
              itemBuilder: (context, index) {
                final payment = _payments[index];
                return _buildPaymentCard(payment);
              },
            ),
    );
  }

  Widget _buildPaymentCard(dynamic payment) {
    final status = payment['status'];
    final bool isPaid = status == 'PAID' || status == 'VERIFIED';
    final String propertyName = payment['tenancy']['propertyUnit']['property']['name'] ?? 'Hostel';
    final String unitType = payment['tenancy']['propertyUnit']['type']['name'] ?? 'Room';
    final double amount = (payment['amountPaid'] ?? payment['amountDue']).toDouble();
    final DateTime date = DateTime.parse(payment['dueDate']);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: InkWell(
        onTap: isPaid ? () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => ReceiptPreviewScreen(
                bookingId: payment['id'],
                propertyName: propertyName,
                price: amount.toString(),
                unitType: unitType,
                date: payment['paidDate'] ?? payment['dueDate'],
              ),
            ),
          );
        } : null,
        borderRadius: BorderRadius.circular(24),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isPaid ? const Color(0xFFF0FDF4) : const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(
                      isPaid ? LucideIcons.checkCircle : LucideIcons.alertCircle,
                      color: isPaid ? const Color(0xFF16A34A) : const Color(0xFFEF4444),
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          propertyName,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        Text(
                          DateFormat('MMMM yyyy').format(date),
                          style: const TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'Ksh $amount',
                        style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 16, color: const Color(0xFF1E293B)),
                      ),
                      const SizedBox(height: 4),
                      _buildStatusBadge(status),
                    ],
                  ),
                ],
              ),
              if (isPaid) ...[
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Divider(height: 1, color: Color(0xFFF1F5F9)),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Receipt available', style: TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.bold)),
                    const Icon(LucideIcons.chevronRight, size: 16, color: Color(0xFFCBD5E1)),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    Color bgColor;
    
    switch (status) {
      case 'PAID':
      case 'VERIFIED':
        color = const Color(0xFF16A34A);
        bgColor = const Color(0xFFF0FDF4);
        break;
      case 'PENDING':
        color = const Color(0xFFF59E0B);
        bgColor = const Color(0xFFFFFBEB);
        break;
      case 'OVERDUE':
        color = const Color(0xFFEF4444);
        bgColor = const Color(0xFFFEF2F2);
        break;
      default:
        color = Colors.grey;
        bgColor = Colors.grey.shade100;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(8)),
      child: Text(
        status,
        style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(LucideIcons.creditCard, size: 64, color: Color(0xFFCBD5E1)),
          const SizedBox(height: 16),
          Text(
            'No records found',
            style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF64748B)),
          ),
          const SizedBox(height: 8),
          const Text('Your payment history will appear here.'),
        ],
      ),
    );
  }
}
