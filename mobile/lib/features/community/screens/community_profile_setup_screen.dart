import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../services/api_service.dart';

class CommunityProfileSetupScreen extends StatefulWidget {
  const CommunityProfileSetupScreen({super.key});

  @override
  State<CommunityProfileSetupScreen> createState() => _CommunityProfileSetupScreenState();
}

class _CommunityProfileSetupScreenState extends State<CommunityProfileSetupScreen> {
  final ApiService _api = ApiService();
  final _formKey = GlobalKey<FormState>();
  
  String? _selectedFaculty;
  final TextEditingController _hobbiesController = TextEditingController();
  final TextEditingController _bioController = TextEditingController();
  int _yearOfStudy = 1;
  bool _isLoading = false;

  final List<String> _faculties = [
    'Science & Computing',
    'Education',
    'Business & Economics',
    'Arts & Social Sciences',
    'Engineering',
    'Health Sciences',
    'Agriculture',
  ];

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() => _isLoading = true);
    try {
      final profile = await _api.getCommunityProfile();
      if (profile != null) {
        setState(() {
          _selectedFaculty = profile['faculty'];
          _hobbiesController.text = profile['hobbies'] ?? '';
          _bioController.text = profile['bio'] ?? '';
          _yearOfStudy = profile['yearOfStudy'] ?? 1;
        });
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);
    try {
      final success = await _api.updateCommunityProfile({
        'faculty': _selectedFaculty,
        'yearOfStudy': _yearOfStudy,
        'hobbies': _hobbiesController.text,
        'bio': _bioController.text,
      });

      if (success != null && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated successfully!')),
        );
        Navigator.pop(context, true);
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
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
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Community Identity',
          style: GoogleFonts.outfit(color: colorScheme.onSurface, fontWeight: FontWeight.bold),
        ),
      ),
      body: _isLoading && _selectedFaculty == null
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(24),
                children: [
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: colorScheme.primary.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: colorScheme.primary.withOpacity(0.1)),
                    ),
                    child: Column(
                      children: [
                        Icon(LucideIcons.userPlus, size: 48, color: colorScheme.primary),
                        const SizedBox(height: 16),
                        Text(
                          'Help us find your tribe',
                          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Sharing your faculty and hobbies allows our AI to match you with compatible roommates.',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.outfit(fontSize: 13, color: colorScheme.onSurface.withOpacity(0.6)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                  
                  _buildLabel('Select Faculty', colorScheme),
                  DropdownButtonFormField<String>(
                    value: _selectedFaculty,
                    dropdownColor: colorScheme.surface,
                    style: TextStyle(color: colorScheme.onSurface),
                    decoration: _inputDecoration('Choose your faculty', colorScheme),
                    items: _faculties.map((f) => DropdownMenuItem(value: f, child: Text(f))).toList(),
                    onChanged: (val) => setState(() => _selectedFaculty = val),
                    validator: (val) => val == null ? 'Please select a faculty' : null,
                  ),
                  
                  const SizedBox(height: 24),
                  _buildLabel('Year of Study', colorScheme),
                  Row(
                    children: List.generate(5, (index) {
                      final year = index + 1;
                      final isSelected = _yearOfStudy == year;
                      return Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _yearOfStudy = year),
                          child: Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: isSelected ? colorScheme.primary : colorScheme.surface,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: isSelected ? colorScheme.primary : colorScheme.onSurface.withOpacity(0.1)),
                            ),
                            child: Center(
                              child: Text(
                                'Yr $year',
                                style: TextStyle(
                                  color: isSelected ? colorScheme.onPrimary : colorScheme.onSurface.withOpacity(0.5),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                  
                  const SizedBox(height: 24),
                  _buildLabel('Hobbies', colorScheme),
                  TextFormField(
                    controller: _hobbiesController,
                    style: TextStyle(color: colorScheme.onSurface),
                    decoration: _inputDecoration('e.g. Football, Gaming, Reading', colorScheme),
                    validator: (val) => val!.isEmpty ? 'Please share some hobbies' : null,
                  ),
                  
                  const SizedBox(height: 24),
                  _buildLabel('Short Bio', colorScheme),
                  TextFormField(
                    controller: _bioController,
                    maxLines: 3,
                    style: TextStyle(color: colorScheme.onSurface),
                    decoration: _inputDecoration('Tell potential roommates about yourself', colorScheme),
                  ),
                  
                  const SizedBox(height: 40),
                  SizedBox(
                    height: 60,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _saveProfile,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: colorScheme.primary,
                        foregroundColor: colorScheme.onPrimary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        elevation: 0,
                      ),
                      child: _isLoading 
                        ? CircularProgressIndicator(color: colorScheme.onPrimary)
                        : Text('Save Identity', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildLabel(String text, ColorScheme colorScheme) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 4),
      child: Text(
        text,
        style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14, color: colorScheme.onSurface),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint, ColorScheme colorScheme) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(color: colorScheme.onSurface.withOpacity(0.3), fontSize: 14),
      fillColor: colorScheme.onSurface.withOpacity(0.05),
      filled: true,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: colorScheme.onSurface.withOpacity(0.1))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: colorScheme.onSurface.withOpacity(0.1))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: colorScheme.primary)),
    );
  }
}
