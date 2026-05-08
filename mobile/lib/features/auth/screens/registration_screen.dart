import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../services/auth_service.dart';

class RegistrationScreen extends StatefulWidget {
  final bool isStudent;
  const RegistrationScreen({super.key, this.isStudent = true});

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends State<RegistrationScreen> {
  final PageController _pageController = PageController();
  final AuthService _authService = AuthService();
  
  int _currentStep = 0;
  bool _isLoading = false;

  // Controllers
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _uniController = TextEditingController(text: 'Kibabii University');
  final TextEditingController _regNoController = TextEditingController();
  final TextEditingController _yearController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();

  void _nextStep() {
    if (_currentStep < 2) {
      _pageController.nextPage(duration: const Duration(milliseconds: 400), curve: Curves.easeInOut);
      setState(() => _currentStep++);
    } else {
      _handleRegistration();
    }
  }

  void _prevStep() {
    if (_currentStep > 0) {
      _pageController.previousPage(duration: const Duration(milliseconds: 400), curve: Curves.easeInOut);
      setState(() => _currentStep--);
    }
  }

  void _handleRegistration() async {
    if (_passwordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Passwords do not match')));
      return;
    }

    setState(() => _isLoading = true);
    
    final data = {
      'name': _nameController.text,
      'email': _emailController.text,
      'phone': _phoneController.text,
      'password': _passwordController.text,
      'role': widget.isStudent ? 'STUDENT' : 'LANDLORD',
      if (widget.isStudent) ...{
        'university': _uniController.text,
        'admissionNo': _regNoController.text,
        'yearOfStudy': int.tryParse(_yearController.text) ?? 1,
      }
    };

    final result = await _authService.register(data);
    setState(() => _isLoading = false);

    if (result != null) {
      if (mounted) context.go('/');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Registration failed. Please try again.')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    
    return Scaffold(
      backgroundColor: colorScheme.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(LucideIcons.chevronLeft, color: colorScheme.onBackground),
          onPressed: _currentStep == 0 ? () => Navigator.pop(context) : _prevStep,
        ),
        title: Text(
          'Step ${_currentStep + 1} of 3',
          style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.5), fontSize: 14, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Column(
          children: [
            _buildProgressIndicator(context),
            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  _buildStepOne(context),
                  _buildStepTwo(context),
                  _buildStepThree(context),
                ],
              ),
            ),
            _buildBottomNav(context),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressIndicator(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
      child: Row(
        children: List.generate(3, (index) {
          bool active = index <= _currentStep;
          return Expanded(
            child: Container(
              height: 4,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              decoration: BoxDecoration(
                color: active ? colorScheme.primary : colorScheme.onSurface.withOpacity(0.1),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildStepOne(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Identity Details', style: GoogleFonts.outfit(fontSize: 28, fontWeight: FontWeight.w900, color: colorScheme.onBackground)),
          const SizedBox(height: 8),
          Text('Tell us who you are.', style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.6))),
          const SizedBox(height: 40),
          _buildTextField(context, _nameController, 'Full Name', LucideIcons.user),
          const SizedBox(height: 24),
          _buildTextField(context, _emailController, 'Email Address', LucideIcons.mail, keyboardType: TextInputType.emailAddress),
          const SizedBox(height: 24),
          _buildTextField(context, _phoneController, 'Phone Number', LucideIcons.phone, keyboardType: TextInputType.phone),
        ],
      ),
    );
  }

  Widget _buildStepTwo(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(widget.isStudent ? 'Academic Info' : 'Professional Info', style: GoogleFonts.outfit(fontSize: 28, fontWeight: FontWeight.w900, color: colorScheme.onBackground)),
          const SizedBox(height: 8),
          Text(widget.isStudent ? 'Your university details.' : 'Your business details.', style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.6))),
          const SizedBox(height: 40),
          if (widget.isStudent) ...[
            _buildTextField(context, _uniController, 'University', LucideIcons.school, enabled: false),
            const SizedBox(height: 24),
            _buildTextField(context, _regNoController, 'Admission Number', LucideIcons.hash),
            const SizedBox(height: 24),
            _buildTextField(context, _yearController, 'Year of Study', LucideIcons.calendar, keyboardType: TextInputType.number),
          ] else ...[
             _buildTextField(context, _nameController, 'Business Name (Optional)', LucideIcons.building),
             const SizedBox(height: 24),
             _buildTextField(context, _phoneController, 'Business Phone', LucideIcons.phone),
          ],
        ],
      ),
    );
  }

  Widget _buildStepThree(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Security', style: GoogleFonts.outfit(fontSize: 28, fontWeight: FontWeight.w900, color: colorScheme.onBackground)),
          const SizedBox(height: 8),
          Text('Secure your account.', style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.6))),
          const SizedBox(height: 40),
          _buildTextField(context, _passwordController, 'Password', LucideIcons.lock, isPassword: true),
          const SizedBox(height: 24),
          _buildTextField(context, _confirmPasswordController, 'Confirm Password', LucideIcons.shieldCheck, isPassword: true),
        ],
      ),
    );
  }

  Widget _buildTextField(BuildContext context, TextEditingController controller, String label, IconData icon, {bool isPassword = false, TextInputType? keyboardType, bool enabled = true}) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(label.toUpperCase(), style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: theme.colorScheme.onSurface.withOpacity(0.4), letterSpacing: 1.2)),
        ),
        TextFormField(
          controller: controller,
          obscureText: isPassword,
          keyboardType: keyboardType,
          enabled: enabled,
          style: GoogleFonts.outfit(color: theme.colorScheme.onSurface),
          decoration: InputDecoration(
            prefixIcon: Icon(icon, size: 20),
            hintText: label,
          ),
        ),
      ],
    );
  }

  Widget _buildBottomNav(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.all(32),
      child: SizedBox(
        width: double.infinity,
        height: 60,
        child: ElevatedButton(
          onPressed: _isLoading ? null : _nextStep,
          style: ElevatedButton.styleFrom(
            backgroundColor: colorScheme.primary,
            foregroundColor: colorScheme.onPrimary,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            elevation: 8,
            shadowColor: colorScheme.primary.withOpacity(0.4),
          ),
          child: _isLoading 
            ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(_currentStep == 2 ? 'Complete Registration' : 'Continue', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                  if (_currentStep < 2) ...[
                    const SizedBox(width: 8),
                    const Icon(LucideIcons.arrowRight, size: 20),
                  ],
                ],
              ),
        ),
      ),
    );
  }
}
