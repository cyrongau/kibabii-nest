import 'package:flutter/material.dart';
import 'dart:async';
import '../../../services/api_service.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../services/payment_service.dart';

class PaymentScreen extends StatefulWidget {
  final String price;
  final String propertyUnitId;
  final String propertyName;
  final String propertyAddress;
  final String? propertyImage;
  final Map<String, dynamic>? extraCharges;

  final bool isTenancyPayment;
  final String? tenancyId;
  final String? unitName;

  const PaymentScreen({
    super.key, 
    required this.price, 
    required this.propertyUnitId,
    this.propertyName = 'The Azure Commons',
    this.propertyAddress = 'Bungoma, Near Gate A',
    this.propertyImage,
    this.extraCharges,
    this.isTenancyPayment = false,
    this.tenancyId,
    this.unitName,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final ApiService _apiService = ApiService();
  final PaymentService _paymentService = PaymentService();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _smsController = TextEditingController();
  bool _isProcessing = false;
  String _selectedMethod = 'mpesa'; // mpesa, bank, manual
  int _selectedMonths = 1; // 1, 3, 6, 12
  String? _checkoutRequestId;
  Timer? _pollingTimer;
  Timer? _countdownTimer;
  int _countdownSeconds = 60;
  double _walletBalance = 0.0;
  Map<String, dynamic>? _userProfile;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  void _fetchData() async {
    _fetchWalletBalance();
    _fetchUserProfile();
  }

  void _fetchUserProfile() async {
    try {
      final profile = await _apiService.getMyProfile();
      if (mounted && profile != null) {
        setState(() {
          _userProfile = profile;
          if (_phoneController.text.isEmpty && profile['phoneNumber'] != null) {
            _phoneController.text = profile['phoneNumber'];
          }
        });
      }
    } catch (e) {
      // Fail silently
    }
  }

  void _fetchWalletBalance() async {
    try {
      final res = await _apiService.get('/wallet/balance');
      if (mounted) {
        setState(() {
          _walletBalance = (res?['balance'] ?? 0.0).toDouble();
        });
      }
    } catch (e) {
      // Fail silently for balance
    }
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _countdownTimer?.cancel();
    _phoneController.dispose();
    _smsController.dispose();
    super.dispose();
  }

  void _processPayment() async {
    if (_selectedMethod == 'mpesa' && _phoneController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your phone number')),
      );
      return;
    }

    if (_selectedMethod == 'manual' && _smsController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please paste the payment SMS or receipt details')),
      );
      return;
    }

    setState(() => _isProcessing = true);
    
    // 1. Create the booking/payment in the backend
    final double rent = double.tryParse(widget.price.replaceAll(',', '')) ?? 0.0;
    final double serviceFee = widget.isTenancyPayment ? 0.0 : (double.tryParse(widget.extraCharges?['serviceFee']?.toString() ?? '') ?? 150.0);
    final double securityDeposit = widget.isTenancyPayment ? 0.0 : (double.tryParse(widget.extraCharges?['securityDeposit']?.toString() ?? '') ?? 0.0);
    final double discountPct = widget.isTenancyPayment ? 0.0 : (double.tryParse(widget.extraCharges?['upfrontDiscountPct']?.toString() ?? '0') ?? 0.0);
    
    double subtotal = (rent * _selectedMonths);
    if (!widget.isTenancyPayment && _selectedMonths > 1) {
      subtotal = subtotal * (1 - (discountPct / 100));
    }
    final double totalAmount = subtotal + serviceFee + securityDeposit;

    try {
      Map<String, dynamic>? booking;
      
      if (widget.isTenancyPayment) {
        // For rent payments, we might already have a payment record or need to create one
        // For now, we assume we create a 'rent' booking/payment
        booking = await _apiService.post('/payments/initiate-rent', {
          'tenancyId': widget.tenancyId,
          'amount': totalAmount,
          'monthCount': _selectedMonths,
        });
      } else {
        booking = await _apiService.createBooking(
          propertyUnitId: widget.propertyUnitId,
          amount: totalAmount,
          months: _selectedMonths,
        );
      }

      if (booking == null) {
        if (mounted) {
          setState(() => _isProcessing = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(widget.isTenancyPayment ? 'Failed to initiate rent payment.' : 'Failed to create booking. Please ensure the property has available units.')),
          );
        }
        return;
      }

      // 2. Handle M-Pesa STK Push
      if (_selectedMethod == 'mpesa') {
        final res = await _paymentService.initiateMpesa(
          paymentId: booking['id'],
          phoneNumber: _phoneController.text.trim(),
        );

        if (res != null && res['success'] == true) {
          _checkoutRequestId = res['checkoutRequestID'];
          _startPolling(booking);
        } else {
          if (mounted) {
            setState(() => _isProcessing = false);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(res?['message'] ?? 'Failed to initiate M-Pesa payment')),
            );
          }
        }
        return;
      }

      // 2b. Handle Wallet Payment
      if (_selectedMethod == 'wallet') {
        try {
          final res = await _paymentService.payWithWallet(booking['id']);
          if (mounted && res != null && res['success'] == true) {
            setState(() => _isProcessing = false);
            context.push('/booking-confirmation', extra: {
              'price': totalAmount,
              'method': 'wallet',
              'isPending': false,
              'bookingId': booking['id'],
              'propertyName': widget.propertyName,
              'unitType': widget.unitName ?? widget.extraCharges?['unitType'] ?? 'Standard Unit',
            });
          } else {
            if (mounted) {
              setState(() => _isProcessing = false);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(res?['message'] ?? 'Wallet payment failed. Please check your balance.')),
              );
            }
          }
        } catch (e) {
          if (mounted) {
            setState(() => _isProcessing = false);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Wallet payment error: $e')),
            );
          }
        }
        return;
      }

      // 3. Handle Manual/Bank (Log transaction)
      final success = await _paymentService.captureManualPayment(
        bookingId: booking['id'] ?? 'NEST-AUTO',
        amount: totalAmount.toString(),
        method: _selectedMethod,
        reference: _selectedMethod == 'bank' ? 'BANK_TRANS' : 'MANUAL_SCAN',
        rawData: _selectedMethod == 'manual' ? _smsController.text : null,
      );

      if (mounted) {
        setState(() => _isProcessing = false);
        if (success) {
          context.push('/booking-confirmation', extra: {
            'price': totalAmount,
            'method': _selectedMethod,
            'isPending': true,
            'bookingId': booking['id'],
            'propertyName': widget.propertyName,
            'unitType': widget.unitName ?? widget.extraCharges?['unitType'] ?? 'Standard Unit',
          });
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to submit payment proof. Please try again.')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isProcessing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('An error occurred: $e')),
        );
      }
    }
  }

  void _startPolling(dynamic booking) {
    _countdownSeconds = 60;
    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          if (_countdownSeconds > 0) {
            _countdownSeconds--;
          } else {
            timer.cancel();
          }
        });
      }
    });

    int attempts = 0;
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 3), (timer) async {
      attempts++;
      if (attempts > 20) { // Timeout after 60 seconds
        timer.cancel();
        _countdownTimer?.cancel();
        if (mounted) {
          setState(() => _isProcessing = false);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Payment timeout. We will verify once the callback is received.')),
          );
          // Still go to confirmation but marked as pending
          context.push('/booking-confirmation', extra: {
            'price': booking['amount'],
            'method': 'mpesa',
            'isPending': true,
            'bookingId': booking['id'],
            'propertyName': widget.propertyName,
            'unitType': widget.unitName ?? widget.extraCharges?['unitType'] ?? 'Standard Unit',
          });
        }
        return;
      }

      if (_checkoutRequestId != null) {
        final status = await _paymentService.checkMpesaStatus(_checkoutRequestId!);
        if (status != null && status['status'] == 'PAID') {
          timer.cancel();
          _countdownTimer?.cancel();
          if (mounted) {
            setState(() => _isProcessing = false);
            context.push('/booking-confirmation', extra: {
              'price': booking['amount'],
              'method': 'mpesa',
              'isPending': false,
              'bookingId': booking['id'],
              'propertyName': widget.propertyName,
              'unitType': widget.unitName ?? widget.extraCharges?['unitType'] ?? 'Standard Unit',
            });
          }
        } else if (status != null && status['status'] == 'FAILED') {
          timer.cancel();
          _countdownTimer?.cancel();
          if (mounted) {
            setState(() => _isProcessing = false);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(status['message'] ?? 'M-Pesa payment failed')),
            );
          }
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: colorScheme.background,
      appBar: AppBar(
        backgroundColor: colorScheme.surface,
        elevation: 0,
        leading: IconButton(
          icon: Icon(LucideIcons.chevronLeft, color: colorScheme.onSurface),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Checkout',
          style: GoogleFonts.outfit(color: colorScheme.onSurface, fontWeight: FontWeight.w900),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHostelSummary(colorScheme),
              const SizedBox(height: 32),
              _buildDurationSelector(colorScheme),
              const SizedBox(height: 32),
              _buildOrderSummary(colorScheme, isDark),
              const SizedBox(height: 40),
              Text(
                'Select Payment Method',
                style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface),
              ),
              const SizedBox(height: 16),
              _buildPaymentMethod(
                id: 'mpesa',
                title: 'M-Pesa Express',
                subtitle: 'Instant STK Push to your phone',
                icon: LucideIcons.phone,
                color: const Color(0xFF10B981),
                colorScheme: colorScheme,
              ),
              const SizedBox(height: 12),
              _buildPaymentMethod(
                id: 'wallet',
                title: 'Kibabii Nest Wallet',
                subtitle: 'Pay via wallet balance (Ksh ${_walletBalance.toStringAsFixed(0)})',
                icon: LucideIcons.wallet,
                color: const Color(0xFF6366F1),
                colorScheme: colorScheme,
              ),
              const SizedBox(height: 12),
              _buildPaymentMethod(
                id: 'bank',
                title: 'Direct Bank Transfer',
                subtitle: 'Transfer to landlord account',
                icon: LucideIcons.landmark,
                color: const Color(0xFF3B82F6),
                colorScheme: colorScheme,
              ),
              const SizedBox(height: 16),
              _buildPaymentMethod(
                id: 'manual',
                title: 'SMS / Receipt Scan',
                subtitle: 'Upload proof of payment',
                icon: LucideIcons.scan,
                color: const Color(0xFFF59E0B),
                colorScheme: colorScheme,
              ),
              const SizedBox(height: 40),
              if (_selectedMethod == 'mpesa') _buildMpesaInput(colorScheme),
              if (_selectedMethod == 'bank') _buildBankDetails(colorScheme),
              if (_selectedMethod == 'manual') _buildManualInput(colorScheme),
              const SizedBox(height: 40),
              _buildPayButton(colorScheme),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHostelSummary(ColorScheme colorScheme) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              image: DecorationImage(
                image: (widget.propertyImage != null && widget.propertyImage!.startsWith('http'))
                    ? NetworkImage(widget.propertyImage!)
                    : AssetImage('assets/images/${widget.propertyImage ?? 'modern_hostel.png'}') as ImageProvider,
                fit: BoxFit.cover,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.propertyName,
                  style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 18, color: colorScheme.onSurface),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(LucideIcons.mapPin, size: 12, color: colorScheme.onSurface.withOpacity(0.5)),
                    const SizedBox(width: 4),
                    Text(
                      widget.propertyAddress,
                      style: GoogleFonts.outfit(fontSize: 12, color: colorScheme.onSurface.withOpacity(0.5), fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDurationSelector(ColorScheme colorScheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Payment Duration',
          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface),
        ),
        const SizedBox(height: 16),
        Row(
          children: [1, 3, 6].map((months) {
            bool isSelected = _selectedMonths == months;
            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _selectedMonths = months),
                child: Container(
                  margin: EdgeInsets.only(right: months == 6 ? 0 : 12),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    color: isSelected ? colorScheme.primary : colorScheme.onSurface.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: isSelected ? colorScheme.primary : colorScheme.onSurface.withOpacity(0.1)),
                    boxShadow: isSelected ? [BoxShadow(color: colorScheme.primary.withOpacity(0.2), blurRadius: 10, offset: const Offset(0, 4))] : null,
                  ),
                  child: Center(
                    child: Text(
                      '$months Month${months > 1 ? 's' : ''}',
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: isSelected ? Colors.white : colorScheme.onSurface.withOpacity(0.5),
                      ),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildOrderSummary(ColorScheme colorScheme, bool isDark) {
    final double rent = double.tryParse(widget.price.replaceAll(',', '')) ?? 0.0;
    final double serviceFee = double.tryParse(widget.extraCharges?['serviceFee']?.toString() ?? '') ?? 150.0;
    final double securityDeposit = double.tryParse(widget.extraCharges?['securityDeposit']?.toString() ?? '') ?? 0.0;
    final double discountPct = double.tryParse(widget.extraCharges?['upfrontDiscountPct']?.toString() ?? '0') ?? 0.0;
    
    double subtotal = (rent * _selectedMonths);
    double discountAmount = 0;
    if (_selectedMonths > 1 && discountPct > 0) {
      discountAmount = subtotal * (discountPct / 100);
      subtotal = subtotal - discountAmount;
    }
    
    final double total = subtotal + serviceFee + securityDeposit;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: colorScheme.onSurface.withOpacity(0.02),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Monthly Rent', style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.5), fontWeight: FontWeight.w500)),
              Text('Ksh ${widget.price} x $_selectedMonths', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
            ],
          ),
          if (discountAmount > 0) ...[
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Long-stay Discount (${discountPct.toStringAsFixed(0)}%)', style: GoogleFonts.outfit(color: const Color(0xFF10B981), fontWeight: FontWeight.w600)),
                Text('- Ksh ${discountAmount.toStringAsFixed(0)}', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF10B981))),
              ],
            ),
          ],
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Service Fee', style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.5), fontWeight: FontWeight.w500)),
              Text('Ksh ${serviceFee.toStringAsFixed(0)}', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
            ],
          ),
          if (securityDeposit > 0) ...[
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Security Deposit', style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.5), fontWeight: FontWeight.w500)),
                Text('Ksh ${securityDeposit.toStringAsFixed(0)}', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
              ],
            ),
          ],
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Divider(color: colorScheme.onSurface.withOpacity(0.05)),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Total to Pay', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w900, color: colorScheme.onSurface)),
              Text(
                'Ksh ${total.toStringAsFixed(0)}',
                style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w900, color: colorScheme.primary),
              ),
            ],
          ),
          if (securityDeposit > 0)
            Padding(
              padding: const EdgeInsets.only(top: 8.0),
              child: Text(
                '* Includes one-time refundable deposit',
                style: GoogleFonts.outfit(fontSize: 10, color: colorScheme.onSurface.withOpacity(0.3), fontStyle: FontStyle.italic),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildPaymentMethod({required String id, required String title, required String subtitle, required IconData icon, required Color color, required ColorScheme colorScheme}) {
    bool isSelected = _selectedMethod == id;
    return GestureDetector(
      onTap: () => setState(() => _selectedMethod = id),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isSelected ? color.withOpacity(0.05) : colorScheme.surface,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: isSelected ? color : colorScheme.onSurface.withOpacity(0.05), width: 2),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(16)),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
                  Text(subtitle, style: GoogleFonts.outfit(fontSize: 12, color: colorScheme.onSurface.withOpacity(0.5), fontWeight: FontWeight.w500)),
                ],
              ),
            ),
            if (isSelected) Icon(LucideIcons.checkCircle2, color: color, size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildMpesaInput(ColorScheme colorScheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Phone Number',
          style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: colorScheme.onSurface),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: colorScheme.surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: colorScheme.onSurface.withOpacity(0.1)),
          ),
          child: TextField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface),
            decoration: InputDecoration(
              hintText: 'e.g. 0712345678',
              hintStyle: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.3)),
              border: InputBorder.none,
              prefixIcon: Icon(LucideIcons.phone, size: 20, color: colorScheme.onSurface.withOpacity(0.5)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBankDetails(ColorScheme colorScheme) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colorScheme.primary.withOpacity(0.05),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colorScheme.primary.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Landlord Bank Details', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
          const SizedBox(height: 12),
          _buildDetailRow('Bank', 'Co-operative Bank', colorScheme),
          _buildDetailRow('Acc Name', 'Mary Jane (Heights Annex)', colorScheme),
          _buildDetailRow('Acc Number', '01123456789000', colorScheme),
          Divider(height: 24, color: colorScheme.onSurface.withOpacity(0.05)),
          Text(
            'Transfer the exact amount then paste the transaction code below or upload the receipt.',
            style: GoogleFonts.outfit(fontSize: 12, color: colorScheme.onSurface.withOpacity(0.5)),
          ),
          const SizedBox(height: 12),
          _buildManualInput(colorScheme),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, ColorScheme colorScheme) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.outfit(fontSize: 13, color: colorScheme.onSurface.withOpacity(0.5))),
          Text(value, style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
        ],
      ),
    );
  }

  Widget _buildManualInput(ColorScheme colorScheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: colorScheme.surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: colorScheme.onSurface.withOpacity(0.1)),
          ),
          child: TextField(
            controller: _smsController,
            maxLines: 3,
            style: GoogleFonts.outfit(fontSize: 14, color: colorScheme.onSurface),
            decoration: InputDecoration(
              hintText: 'Paste M-Pesa SMS or Transaction ID here...',
              hintStyle: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.3)),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.all(20),
            ),
          ),
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () {}, // Scan feature
          icon: const Icon(LucideIcons.camera, size: 18),
          label: const Text('Scan Receipt'),
          style: OutlinedButton.styleFrom(
            foregroundColor: colorScheme.primary,
            side: BorderSide(color: colorScheme.primary),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
        ),
      ],
    );
  }

  Widget _buildPayButton(ColorScheme colorScheme) {
    return Container(
      width: double.infinity,
      height: 64,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: colorScheme.primary,
        boxShadow: [
          BoxShadow(color: colorScheme.primary.withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 10))
        ],
      ),
      child: ElevatedButton(
        onPressed: _isProcessing ? null : _processPayment,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        ),
        child: _isProcessing
            ? Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)),
                      const SizedBox(width: 12),
                      Text(
                        _selectedMethod == 'mpesa' ? 'Awaiting M-Pesa PIN...' : 'Processing...',
                        style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ],
                  ),
                  if (_selectedMethod == 'mpesa' && _checkoutRequestId != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4.0),
                      child: Text(
                        'Time remaining: $_countdownSeconds seconds',
                        style: GoogleFonts.outfit(fontSize: 10, color: Colors.white70, fontWeight: FontWeight.w500),
                      ),
                    ),
                ],
              )
            : Text(
                _selectedMethod == 'mpesa' ? (widget.isTenancyPayment ? 'Initiate Rent Payment' : 'Pay & Confirm Booking') : 'Submit for Verification',
                style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
              ),
      ),
    );
    }
}
