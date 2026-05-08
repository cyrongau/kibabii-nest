import 'dart:io';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:go_router/go_router.dart';
import '../../../services/api_service.dart';

class DocumentScannerScreen extends StatefulWidget {
  const DocumentScannerScreen({super.key});

  @override
  State<DocumentScannerScreen> createState() => _DocumentScannerScreenState();
}

class _DocumentScannerScreenState extends State<DocumentScannerScreen> {
  final ApiService _api = ApiService();
  final ImagePicker _picker = ImagePicker();

  File? _selectedFile;
  String _documentType = 'NATIONAL_ID';
  final TextEditingController _regNoController = TextEditingController();

  bool _isUploading = false;
  bool _isProcessing = false;
  Map<String, dynamic>? _result;
  String? _error;

  Future<void> _pickFromGallery() async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 2048,
      maxHeight: 2048,
      imageQuality: 85,
    );
    if (image != null) {
      setState(() {
        _selectedFile = File(image.path);
        _result = null;
        _error = null;
      });
    }
  }

  Future<void> _captureFromCamera() async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.camera,
      maxWidth: 2048,
      maxHeight: 2048,
      imageQuality: 90,
    );
    if (image != null) {
      setState(() {
        _selectedFile = File(image.path);
        _result = null;
        _error = null;
      });
    }
  }

  Future<void> _uploadAndScan() async {
    if (_selectedFile == null) return;

    setState(() {
      _isUploading = true;
      _error = null;
    });

    try {
      // Step 1: Upload document
      final documentUrl = await _api.uploadDocument(_selectedFile!, folder: 'identity-docs');
      if (documentUrl == null) {
        setState(() {
          _error = 'Failed to upload document. Please try again.';
          _isUploading = false;
        });
        return;
      }

      setState(() {
        _isUploading = false;
        _isProcessing = true;
      });

      // Step 2: Submit for AI analysis
      final result = await _api.submitIdentity(
        documentUrl: documentUrl,
        documentType: _documentType,
        universityRegNo: _regNoController.text.isNotEmpty ? _regNoController.text : null,
      );

      if (result != null) {
        setState(() {
          _result = result;
          _isProcessing = false;
        });
      } else {
        setState(() {
          _error = 'Failed to process document. Please try again.';
          _isProcessing = false;
        });
      }
    } catch (e) {
      String errorMessage = 'An error occurred. Please try again.';
      if (e is TimeoutException) {
        errorMessage = 'Request timed out. The document processing might be taking longer than expected. Please try again.';
      } else if (e is SocketException) {
        errorMessage = 'Could not connect to the server. Please check your internet connection or the server IP.';
      }
      setState(() {
        _error = errorMessage;
        _isUploading = false;
        _isProcessing = false;
      });
    }
  }

  @override
  void dispose() {
    _regNoController.dispose();
    super.dispose();
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
          icon: Icon(Icons.arrow_back, color: colorScheme.onSurface),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Upload Identity Document',
          style: TextStyle(fontWeight: FontWeight.bold, color: colorScheme.onSurface),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Instructions
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: colorScheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: colorScheme.primary.withOpacity(0.2)),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: colorScheme.primary, size: 22),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(
                      'Take a clear photo or scan of your National ID, Passport, or Student ID card. Our AI will automatically extract your details.',
                      style: TextStyle(fontSize: 13, color: colorScheme.onSurface.withOpacity(0.7), height: 1.5),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Document Type Selector
            const Text('Document Type', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 12),
            Row(
              children: [
                _DocTypeChip(label: 'National ID', value: 'NATIONAL_ID', selected: _documentType == 'NATIONAL_ID', colorScheme: colorScheme, onTap: () => setState(() => _documentType = 'NATIONAL_ID')),
                const SizedBox(width: 8),
                _DocTypeChip(label: 'Passport', value: 'PASSPORT', selected: _documentType == 'PASSPORT', colorScheme: colorScheme, onTap: () => setState(() => _documentType = 'PASSPORT')),
                const SizedBox(width: 8),
                _DocTypeChip(label: 'Student ID', value: 'STUDENT_ID', selected: _documentType == 'STUDENT_ID', colorScheme: colorScheme, onTap: () => setState(() => _documentType = 'STUDENT_ID')),
              ],
            ),
            const SizedBox(height: 24),

            // University Reg No (optional)
            if (_documentType == 'STUDENT_ID') ...[
              const Text('University Registration No.', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 8),
              TextField(
                controller: _regNoController,
                style: TextStyle(color: colorScheme.onSurface),
                decoration: InputDecoration(
                  hintText: 'e.g. BCS/001/2024',
                  hintStyle: TextStyle(color: colorScheme.onSurface.withOpacity(0.3)),
                  filled: true,
                  fillColor: colorScheme.surface,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: colorScheme.onSurface.withOpacity(0.1))),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: colorScheme.onSurface.withOpacity(0.1))),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: colorScheme.primary)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                ),
              ),
              const SizedBox(height: 24),
            ],

            // Image Preview or Picker
            if (_selectedFile != null) ...[
              Container(
                width: double.infinity,
                height: 240,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: colorScheme.onSurface.withOpacity(0.1)),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Image.file(_selectedFile!, fit: BoxFit.cover),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextButton.icon(
                      onPressed: _pickFromGallery,
                      icon: const Icon(Icons.photo_library, size: 18),
                      label: const Text('Change Photo'),
                    ),
                  ),
                  Expanded(
                    child: TextButton.icon(
                      onPressed: _captureFromCamera,
                      icon: const Icon(Icons.camera_alt, size: 18),
                      label: const Text('Retake'),
                    ),
                  ),
                ],
              ),
            ] else ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 48),
                decoration: BoxDecoration(
                  color: colorScheme.surface,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: colorScheme.onSurface.withOpacity(0.1), style: BorderStyle.solid),
                ),
                child: Column(
                  children: [
                    Icon(Icons.document_scanner_outlined, size: 48, color: colorScheme.onSurface.withOpacity(0.2)),
                    const SizedBox(height: 16),
                    Text('No document selected', style: TextStyle(color: colorScheme.onSurface.withOpacity(0.3), fontSize: 14)),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        ElevatedButton.icon(
                          onPressed: _captureFromCamera,
                          icon: const Icon(Icons.camera_alt, size: 18),
                          label: const Text('Camera'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: colorScheme.primary,
                            foregroundColor: colorScheme.onPrimary,
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                        ),
                        const SizedBox(width: 12),
                        OutlinedButton.icon(
                          onPressed: _pickFromGallery,
                          icon: const Icon(Icons.photo_library, size: 18),
                          label: const Text('Gallery'),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            side: BorderSide(color: colorScheme.primary),
                            foregroundColor: colorScheme.primary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 24),

            // Error
            if (_error != null)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: colorScheme.error.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: colorScheme.error.withOpacity(0.2)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error_outline, color: colorScheme.error, size: 20),
                    const SizedBox(width: 12),
                    Expanded(child: Text(_error!, style: TextStyle(color: colorScheme.error, fontSize: 13))),
                    IconButton(
                      icon: Icon(Icons.refresh, color: colorScheme.error, size: 18),
                      onPressed: _uploadAndScan,
                      tooltip: 'Retry',
                    ),
                  ],
                ),
              ),

            // Processing Status
            if (_isUploading || _isProcessing)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: colorScheme.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: colorScheme.onSurface.withOpacity(0.1)),
                ),
                child: Column(
                  children: [
                    const CircularProgressIndicator(strokeWidth: 3),
                    const SizedBox(height: 16),
                    Text(
                      _isUploading ? 'Uploading document...' : 'AI is analyzing your document...',
                      style: TextStyle(fontWeight: FontWeight.bold, color: colorScheme.onSurface),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _isUploading ? 'Please wait while we upload your file' : 'Extracting name, ID number, and other details',
                      style: TextStyle(color: colorScheme.onSurface.withOpacity(0.5), fontSize: 12),
                    ),
                  ],
                ),
              ),

            // Results
            if (_result != null) ...[
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: isDark ? colorScheme.primary.withOpacity(0.05) : Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: isDark ? colorScheme.primary.withOpacity(0.1) : const Color(0xFFBBF7D0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 24),
                        const SizedBox(width: 12),
                        const Text('Document Processed', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF10B981))),
                      ],
                    ),
                    const SizedBox(height: 20),
                    _ResultRow(label: 'Full Name', value: _result!['fullName'] ?? 'Not detected', colorScheme: colorScheme),
                    _ResultRow(label: 'ID Number', value: _result!['idNumber'] ?? 'Not detected', colorScheme: colorScheme),
                    _ResultRow(label: 'Date of Birth', value: _result!['dateOfBirth'] ?? 'Not detected', colorScheme: colorScheme),
                    if (_result!['universityRegNo'] != null)
                      _ResultRow(label: 'Reg. Number', value: _result!['universityRegNo'], colorScheme: colorScheme),
                    if (_result!['aiConfidence'] != null)
                      _ResultRow(
                        label: 'AI Confidence',
                        value: '${((_result!['aiConfidence'] as num) * 100).toStringAsFixed(0)}%',
                        colorScheme: colorScheme,
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context, true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const Text('Done', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
            ],

            // Upload Button
            if (_selectedFile != null && _result == null && !_isUploading && !_isProcessing) ...[
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _uploadAndScan,
                  icon: const Icon(Icons.cloud_upload, size: 20),
                  label: const Text('Upload & Scan with AI', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: colorScheme.primary,
                    foregroundColor: colorScheme.onPrimary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 4,
                  ),
                ),
              ),
            ],
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}

class _DocTypeChip extends StatelessWidget {
  final String label;
  final String value;
  final bool selected;
  final ColorScheme colorScheme;
  final VoidCallback onTap;

  const _DocTypeChip({
    required this.label,
    required this.value,
    required this.selected,
    required this.onTap,
    required this.colorScheme,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: selected ? colorScheme.primary : colorScheme.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: selected ? colorScheme.primary : colorScheme.onSurface.withOpacity(0.1)),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: selected ? colorScheme.onPrimary : colorScheme.onSurface.withOpacity(0.5),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ResultRow extends StatelessWidget {
  final String label;
  final String value;
  final ColorScheme colorScheme;

  const _ResultRow({required this.label, required this.value, required this.colorScheme});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: colorScheme.onSurface.withOpacity(0.4), fontSize: 13)),
          Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: colorScheme.onSurface)),
        ],
      ),
    );
  }
}
