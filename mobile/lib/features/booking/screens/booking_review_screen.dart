import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class BookingReviewScreen extends StatelessWidget {
  final String propertyName;
  final String price;

  const BookingReviewScreen({
    super.key,
    required this.propertyName,
    required this.price,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Review Booking', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(Icons.home, color: Colors.blue),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(propertyName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                            const Text('Kibabii University District', style: TextStyle(color: Colors.grey, fontSize: 12)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 40),
                  _PriceRow(label: 'Monthly Rent', value: 'Ksh $price'),
                  const _PriceRow(label: 'Security Deposit', value: 'Ksh 1,000'),
                  const _PriceRow(label: 'Service Fee', value: 'Ksh 200'),
                  const Divider(height: 40),
                  _PriceRow(label: 'Total Due', value: 'Ksh 5,700', isTotal: true),
                ],
              ),
            ),
            const SizedBox(height: 30),
            const Text('Payment Method', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            ListTile(
              leading: const Icon(Icons.phone_android, color: Colors.green),
              title: const Text('M-Pesa'),
              trailing: const Icon(Icons.check_circle, color: Colors.blue),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: Colors.blue),
              ),
            ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => context.push('/payment', extra: {'price': '5,700'}),
                child: const Text('Proceed to Checkout'),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}

class _PriceRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isTotal;

  const _PriceRow({required this.label, required this.value, this.isTotal = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(
            fontSize: isTotal ? 16 : 14,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            color: isTotal ? Colors.black : Colors.grey[600],
          )),
          Text(value, style: TextStyle(
            fontSize: isTotal ? 20 : 14,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.bold,
            color: isTotal ? Colors.blue[700] : Colors.black,
          )),
        ],
      ),
    );
  }
}
