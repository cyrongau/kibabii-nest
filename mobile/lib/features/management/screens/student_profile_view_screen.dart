import 'package:flutter/material.dart';
import '../../../services/api_service.dart';

class StudentProfileViewScreen extends StatefulWidget {
  final String studentId;
  final String studentName;
  final String studentEmail;

  const StudentProfileViewScreen({
    super.key,
    required this.studentId,
    required this.studentName,
    required this.studentEmail,
  });

  @override
  State<StudentProfileViewScreen> createState() => _StudentProfileViewScreenState();
}

class _StudentProfileViewScreenState extends State<StudentProfileViewScreen> {
  final ApiService _api = ApiService();
  Map<String, dynamic>? _identity;
  bool _isLoading = false;
  bool _showIdentity = false;
  String? _error;

  Future<void> _loadIdentity() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final identity = await _api.getStudentIdentity(widget.studentId);
      setState(() {
        _identity = identity;
        _showIdentity = true;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load identity document. The student may not have uploaded one yet.';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Student Profile', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Student Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(28),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 16, offset: const Offset(0, 4)),
                ],
              ),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: const Color(0xFF3B82F6),
                    child: Text(
                      widget.studentName.isNotEmpty ? widget.studentName[0].toUpperCase() : 'S',
                      style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(widget.studentName, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                  const SizedBox(height: 4),
                  Text(widget.studentEmail, style: const TextStyle(color: Colors.grey, fontSize: 14)),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      '🎓 Student',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF3B82F6)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // View ID Button
            if (!_showIdentity && !_isLoading)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(28),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 16, offset: const Offset(0, 4)),
                  ],
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Icon(Icons.badge_outlined, size: 40, color: Color(0xFF64748B)),
                    ),
                    const SizedBox(height: 16),
                    const Text('Identity Document', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF0F172A))),
                    const SizedBox(height: 4),
                    const Text('Tap to view this student\'s ID document', style: TextStyle(color: Colors.grey, fontSize: 13)),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _loadIdentity,
                        icon: const Icon(Icons.visibility, size: 20),
                        label: const Text('View ID', style: TextStyle(fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF3B82F6),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            // Loading
            if (_isLoading)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(40),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(28),
                ),
                child: const Column(
                  children: [
                    CircularProgressIndicator(strokeWidth: 3),
                    SizedBox(height: 16),
                    Text('Loading identity document...', style: TextStyle(color: Colors.grey)),
                  ],
                ),
              ),

            // Error
            if (_error != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFFDE68A)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.warning_amber_rounded, color: Color(0xFFD97706)),
                    const SizedBox(width: 12),
                    Expanded(child: Text(_error!, style: const TextStyle(color: Color(0xFF92400E), fontSize: 13))),
                  ],
                ),
              ),

            // Identity Document Details
            if (_showIdentity && _identity != null) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(28),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 16, offset: const Offset(0, 4)),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF0FDF4),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(Icons.verified_user, color: Color(0xFF16A34A), size: 22),
                        ),
                        const SizedBox(width: 14),
                        const Text('Identity Document', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF0F172A))),
                      ],
                    ),
                    const SizedBox(height: 20),
                    // Document Image
                    if (_identity!['documentUrl'] != null)
                      Container(
                        width: double.infinity,
                        height: 200,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Image.network(
                            _identity!['documentUrl'],
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) => const Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.broken_image, size: 40, color: Colors.grey),
                                  SizedBox(height: 8),
                                  Text('Unable to load image', style: TextStyle(color: Colors.grey, fontSize: 12)),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    const SizedBox(height: 20),
                    const Divider(height: 1),
                    const SizedBox(height: 20),
                    // Extracted Details
                    _DetailRow(label: 'Full Name', value: _identity!['fullName'] ?? 'Not extracted'),
                    _DetailRow(label: 'ID Number', value: _identity!['idNumber'] ?? 'Not extracted'),
                    _DetailRow(label: 'Date of Birth', value: _identity!['dateOfBirth'] ?? 'Not extracted'),
                    _DetailRow(label: 'Document Type', value: _formatDocType(_identity!['documentType'])),
                    if (_identity!['universityRegNo'] != null)
                      _DetailRow(label: 'Reg. Number', value: _identity!['universityRegNo']),
                    if (_identity!['aiConfidence'] != null) ...[
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('AI Confidence', style: TextStyle(color: Colors.grey, fontSize: 13)),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            decoration: BoxDecoration(
                              color: (_identity!['aiConfidence'] as num) > 0.8 ? const Color(0xFFF0FDF4) : const Color(0xFFFEF3C7),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              '${((_identity!['aiConfidence'] as num) * 100).toStringAsFixed(0)}%',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                                color: (_identity!['aiConfidence'] as num) > 0.8 ? const Color(0xFF16A34A) : const Color(0xFFD97706),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatDocType(String? type) {
    switch (type) {
      case 'NATIONAL_ID': return 'National ID';
      case 'PASSPORT': return 'Passport';
      case 'STUDENT_ID': return 'Student ID Card';
      default: return type ?? 'Unknown';
    }
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F172A))),
        ],
      ),
    );
  }
}
