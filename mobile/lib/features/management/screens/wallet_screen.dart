import 'package:flutter/material.dart';
import 'dart:ui';
import 'dart:async';
import '../../../core/theme.dart';
import '../../../services/api_service.dart';
import 'package:intl/intl.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  final ApiService _apiService = ApiService();
  double _balance = 0.0;
  List<dynamic> _transactions = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchWalletData();
  }

  Future<void> _fetchWalletData() async {
    setState(() => _isLoading = true);
    try {
      final balanceRes = await _apiService.get('/wallet/balance');
      final historyRes = await _apiService.get('/wallet/history');

      debugPrint('Wallet balance raw response: $balanceRes');
      debugPrint('Wallet history raw response: $historyRes');

      setState(() {
        if (balanceRes is Map) {
          _balance = (balanceRes['balance'] ?? 0.0).toDouble();
        } else if (balanceRes is num) {
          _balance = balanceRes.toDouble();
        }
        
        _transactions = (historyRes as List<dynamic>?) ?? [];
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Wallet fetch error: $e');
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load wallet data: $e')),
        );
      }
    }
  }

  Future<void> _initiateTopup() async {
    final amountController = TextEditingController();
    final phoneController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
          top: 24,
          left: 24,
          right: 24,
        ),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Top Up Wallet',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.black87),
            ),
            const SizedBox(height: 8),
            const Text(
              'Funds will be added via M-Pesa STK Push.',
              style: TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: amountController,
              keyboardType: TextInputType.number,
              style: const TextStyle(color: Colors.black),
              decoration: InputDecoration(
                labelText: 'Amount (KES)',
                labelStyle: const TextStyle(color: Colors.black54),
                prefixIcon: const Icon(Icons.attach_money, color: AppTheme.primaryBlue),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: phoneController,
              keyboardType: TextInputType.phone,
              style: const TextStyle(color: Colors.black),
              decoration: InputDecoration(
                labelText: 'M-Pesa Phone Number',
                hintText: '0712345678',
                labelStyle: const TextStyle(color: Colors.black54),
                prefixIcon: const Icon(Icons.phone_android, color: AppTheme.primaryBlue),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: () {
                  final amount = double.tryParse(amountController.text);
                  if (amount == null || amount <= 0) return;
                  
                  Navigator.pop(context);
                  _processTopup(amount, phoneController.text);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryBlue,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('Initiate STK Push', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Future<void> _processTopup(double amount, String phone) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator(color: Colors.white)),
    );

    try {
      final res = await _apiService.post('/payments/wallet-topup-stk', {
        'amount': amount,
        'phoneNumber': phone,
      });

      Navigator.pop(context); // Close loading
      
      if (res?['success'] == true) {
        _showPollingDialog(res?['checkoutRequestID']);
      }
    } catch (e) {
      Navigator.pop(context); // Close loading
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Top-up failed: $e')),
      );
    }
  }

  void _showPollingDialog(String checkoutId) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => PollingDialog(
        checkoutRequestId: checkoutId,
        onSuccess: () {
          _fetchWalletData();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: const Text('Kibabii Nest Wallet', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppTheme.primaryBlue,
              Color(0xFF1E40AF), // Darker blue
              Colors.black,
            ],
          ),
        ),
        child: SafeArea(
          child: RefreshIndicator(
            onRefresh: _fetchWalletData,
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: _buildBalanceCard(),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      children: [
                        Expanded(
                          child: _buildActionBtn(
                            icon: Icons.add_circle_outline,
                            label: 'Top Up',
                            onTap: _initiateTopup,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildActionBtn(
                            icon: Icons.account_balance_wallet_outlined,
                            label: 'Withdraw',
                            onTap: () {
                              Navigator.pushNamed(context, '/withdraw');
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(20, 32, 20, 16),
                    child: Text(
                      'Recent Transactions',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                if (_isLoading)
                  const SliverFillRemaining(
                    child: Center(child: CircularProgressIndicator(color: Colors.white)),
                  )
                else if (_transactions.isEmpty)
                  const SliverFillRemaining(
                    child: Center(
                      child: Text(
                        'No transactions yet',
                        style: TextStyle(color: Colors.white70),
                      ),
                    ),
                  )
                else
                  SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => _buildTransactionItem(_transactions[index]),
                      childCount: _transactions.length,
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBalanceCard() {
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.1),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.white.withOpacity(0.2)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Available Balance',
                    style: TextStyle(color: Colors.white70, fontSize: 16),
                  ),
                  Icon(Icons.account_balance_wallet, color: Colors.white54),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                'KES ${NumberFormat('#,###.00').format(_balance)}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),
              const Row(
                children: [
                  Icon(Icons.security, color: Colors.white54, size: 16),
                  SizedBox(width: 8),
                  Text(
                    'Secure & Encrypted',
                    style: TextStyle(color: Colors.white54, fontSize: 12),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActionBtn({required IconData icon, required String label, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Icon(icon, color: AppTheme.primaryBlue),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(
                color: AppTheme.primaryBlue,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTransactionItem(dynamic tx) {
    final bool isDebit = tx['amount'] < 0;
    final DateTime date = DateTime.parse(tx['createdAt']);
    final String status = tx['status'] ?? 'PENDING';

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isDebit ? Colors.red.withOpacity(0.1) : Colors.green.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isDebit ? Icons.arrow_outward : Icons.arrow_downward,
              color: isDebit ? Colors.redAccent : Colors.greenAccent,
              size: 20,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tx['description'] ?? 'Transaction',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                ),
                Text(
                  DateFormat('MMM dd, yyyy HH:mm').format(date),
                  style: const TextStyle(color: Colors.white60, fontSize: 12),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${isDebit ? "-" : "+"} ${NumberFormat('#,###').format(tx['amount'].abs())}',
                style: TextStyle(
                  color: isDebit ? Colors.redAccent : Colors.greenAccent,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              Text(
                status,
                style: TextStyle(
                  color: status == 'COMPLETED' ? Colors.greenAccent : Colors.orangeAccent,
                  fontSize: 10,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class PollingDialog extends StatefulWidget {
  final String checkoutRequestId;
  final VoidCallback onSuccess;

  const PollingDialog({
    super.key,
    required this.checkoutRequestId,
    required this.onSuccess,
  });

  @override
  State<PollingDialog> createState() => _PollingDialogState();
}

class _PollingDialogState extends State<PollingDialog> {
  String _message = 'Waiting for M-Pesa response...';
  bool _isPolled = false;

  @override
  void initState() {
    super.initState();
    _startPolling();
  }

  Future<void> _startPolling() async {
    final api = ApiService();
    int attempts = 0;
    const maxAttempts = 12; // 1 minute approx

    while (attempts < maxAttempts && !_isPolled) {
      await Future.delayed(const Duration(seconds: 5));
      try {
        final res = await api.get('/payments/mpesa/stk-query/${widget.checkoutRequestId}');
        if (res?['status'] == 'PAID') {
          setState(() {
            _message = 'Payment successful!';
            _isPolled = true;
          });
          widget.onSuccess();
          Future.delayed(const Duration(seconds: 2), () {
            if (mounted) Navigator.pop(context);
          });
          return;
        } else if (res?['status'] == 'FAILED') {
          setState(() {
            _message = 'Payment failed: ${res?['message']}';
            _isPolled = true;
          });
          Future.delayed(const Duration(seconds: 3), () {
            if (mounted) Navigator.pop(context);
          });
          return;
        }
      } catch (e) {
        // Continue polling
      }
      attempts++;
    }

    if (!_isPolled) {
      setState(() {
        _message = 'Status check timed out. Please check your balance in a moment.';
        _isPolled = true;
      });
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) Navigator.pop(context);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (!_isPolled)
            const CircularProgressIndicator()
          else
            const Icon(Icons.info_outline, size: 48, color: AppTheme.primaryBlue),
          const SizedBox(height: 24),
          Text(
            _message,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 16),
          ),
        ],
      ),
    );
  }
}
