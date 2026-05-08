import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../services/api_service.dart';
import './community_profile_setup_screen.dart';
import './marketplace_screen.dart';
import './study_buddies_screen.dart';
import './kibabii_hub_screen.dart';
import '../../chat/screens/chat_screen.dart';

class CommunityHubScreen extends StatefulWidget {
  const CommunityHubScreen({super.key});

  @override
  State<CommunityHubScreen> createState() => _CommunityHubScreenState();
}

class _CommunityHubScreenState extends State<CommunityHubScreen> {
  final ApiService _api = ApiService();
  bool _isLoading = false;
  String _referralCode = "KIBABII-STUDENT-2026";
  final TextEditingController _testimonialController = TextEditingController();
  List<dynamic> _matches = [];
  Map<String, dynamic>? _profile;

  @override
  void initState() {
    super.initState();
    _loadReferralCode();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final matches = await _api.getStudentMatches();
      final profile = await _api.getCommunityProfile();
      if (mounted) {
        setState(() {
          _matches = matches;
          _profile = profile;
        });
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _loadReferralCode() async {
    final prefs = await SharedPreferences.getInstance();
    String? code = prefs.getString('referral_code');
    if (code == null) {
      code = "KIBABII-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}";
      await prefs.setString('referral_code', code);
    }
    if (mounted) setState(() => _referralCode = code!);
  }

  Future<void> _generateReferralCode() async {
    final newCode = "KIBABII-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}";
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('referral_code', newCode);
    if (mounted) setState(() => _referralCode = newCode);
  }

  void _shareReferral() {
    Share.share(
      'Join Kibabii Nest using my referral code: $_referralCode and get Ksh 1000 off your next month rent! 🏠🎓 Download here: https://kibabiinest.com/app',
      subject: 'Kibabii Nest Referral',
    );
  }

  Future<void> _submitTestimonial() async {
    if (_testimonialController.text.isEmpty) return;
    
    setState(() => _isLoading = true);
    try {
      final success = await _api.submitTestimonial(_testimonialController.text);
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Testimonial submitted! Our AI will review and feature it soon.')),
        );
        _testimonialController.clear();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to submit testimonial.')));
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
        title: Text(
          'Community Hub',
          style: GoogleFonts.outfit(color: colorScheme.onSurface, fontWeight: FontWeight.bold),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Referral Card
            _buildReferralCard(colorScheme),
            const SizedBox(height: 24),
            
            // Profile Setup
            _buildProfileSetup(colorScheme, isDark),
            const SizedBox(height: 32),

            // Student Matching
            _buildMatchingSection(colorScheme, isDark),
            const SizedBox(height: 32),
            
            // Communication Center
            _buildCommunicationCenter(colorScheme, isDark),
            const SizedBox(height: 32),
            
            // Testimonial Section
            _buildTestimonialSection(colorScheme, isDark),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildReferralCard(ColorScheme colorScheme) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [colorScheme.primary, colorScheme.primary.withBlue(200)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(color: colorScheme.primary.withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 10)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.gift, color: Colors.white, size: 24),
              const SizedBox(width: 12),
              Text(
                'Refer & Earn Rewards',
                style: GoogleFonts.outfit(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Refer a student & Earn Ksh 50 for each successful booking. Plus, get Ksh 1000 off your next month rent!',
            style: GoogleFonts.outfit(color: Colors.white.withOpacity(0.9), fontSize: 14, height: 1.5),
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.2)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _referralCode,
                  style: GoogleFonts.outfit(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900, letterSpacing: 1),
                ),
                IconButton(
                  onPressed: _shareReferral,
                  icon: const Icon(LucideIcons.share2, color: Colors.white, size: 20),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _generateReferralCode,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: colorScheme.primary,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text('Generate New Code', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMatchingSection(ColorScheme colorScheme, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Student Matching',
              style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: colorScheme.onSurface),
            ),
            TextButton(
              onPressed: () {},
              child: Text('See All', style: GoogleFonts.outfit(color: colorScheme.primary, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 220,
          child: _isLoading 
            ? Center(child: CircularProgressIndicator(color: colorScheme.primary))
            : _matches.isEmpty 
              ? Center(child: Text('No matches found yet', style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.4), fontSize: 13)))
              : ListView.builder(
                  scrollDirection: Axis.horizontal,
                  shrinkWrap: true,
                  physics: const BouncingScrollPhysics(),
                  clipBehavior: Clip.none,
                  itemCount: _matches.length,
                  itemBuilder: (context, index) {
                    final m = _matches[index];
                    return _buildMatchCard(
                      m['user']?['id'] ?? '',
                      m['user']?['name'] ?? 'Student', 
                      '${m['faculty'] ?? 'Student'}, Yr ${m['yearOfStudy'] ?? '?'}', 
                      m['hobbies'] ?? 'None shared', 
                      '95% Match',
                      colorScheme,
                      isDark,
                    );
                  },
                ),
        ),
      ],
    );
  }

  Future<void> _contactStudent(String studentId, String name) async {
    setState(() => _isLoading = true);
    try {
      final conversation = await _api.getOrCreateConversation(studentId);
      if (conversation != null && mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ChatScreen(
              conversationId: conversation['id'],
              otherUserId: studentId,
              otherUserName: name,
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _buildMatchCard(String id, String name, String details, String hobbies, String match, ColorScheme colorScheme, bool isDark) {
    return Container(
      width: 200,
      margin: const EdgeInsets.only(right: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
        boxShadow: isDark ? [] : [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: colorScheme.primary.withOpacity(0.1),
                child: Text(name[0], style: TextStyle(fontWeight: FontWeight.bold, color: colorScheme.primary)),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(match, style: const TextStyle(color: Color(0xFF10B981), fontSize: 9, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(name, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: colorScheme.onSurface)),
          Text(details, style: GoogleFonts.outfit(fontSize: 12, color: colorScheme.onSurface.withOpacity(0.5))),
          const SizedBox(height: 8),
          Text('Hobbies: $hobbies', style: GoogleFonts.outfit(fontSize: 11, color: colorScheme.onSurface.withOpacity(0.4)), maxLines: 1, overflow: TextOverflow.ellipsis),
          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => _contactStudent(id, name),
              style: ElevatedButton.styleFrom(
                backgroundColor: colorScheme.primary.withOpacity(0.05),
                foregroundColor: colorScheme.primary,
                elevation: 0,
                padding: const EdgeInsets.symmetric(vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Connect', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileSetup(ColorScheme colorScheme, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: colorScheme.primary.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(LucideIcons.userCircle, size: 32, color: colorScheme.primary),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Complete Your Profile', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: colorScheme.onSurface)),
                Text('Get better matching results.', style: GoogleFonts.outfit(fontSize: 12, color: colorScheme.onSurface.withOpacity(0.5))),
              ],
            ),
          ),
          const SizedBox(width: 12),
          ElevatedButton(
            onPressed: () async {
              final result = await Navigator.push(
                context, 
                MaterialPageRoute(builder: (context) => const CommunityProfileSetupScreen())
              );
              if (result == true) _fetchData();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: colorScheme.primary,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            child: const Text('Setup', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildCommunicationCenter(ColorScheme colorScheme, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Communication Center',
          style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: colorScheme.onSurface),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: colorScheme.surface,
            borderRadius: BorderRadius.circular(32),
            border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
          ),
          child: Column(
            children: [
              _buildChatTile('Kibabii Hub', 'General announcements for all students', LucideIcons.messageSquare, Colors.blue, colorScheme, () {
                Navigator.push(context, MaterialPageRoute(builder: (context) => const KibabiiHubScreen()));
              }),
              const Divider(height: 48),
              _buildChatTile('Marketplace', 'Buy, sell, or trade with other students', LucideIcons.shoppingBag, Colors.green, colorScheme, () {
                Navigator.push(context, MaterialPageRoute(builder: (context) => const MarketplaceScreen()));
              }),
              const Divider(height: 48),
              _buildChatTile('Study Buddies', 'Find group members for your course', LucideIcons.bookOpen, Colors.purple, colorScheme, () {
                Navigator.push(context, MaterialPageRoute(builder: (context) => const StudyBuddiesScreen()));
              }),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildChatTile(String title, String subtitle, IconData icon, Color color, ColorScheme colorScheme, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: colorScheme.onSurface)),
                Text(subtitle, style: GoogleFonts.outfit(fontSize: 12, color: colorScheme.onSurface.withOpacity(0.5))),
              ],
            ),
          ),
          Icon(LucideIcons.chevronRight, color: colorScheme.onSurface.withOpacity(0.2), size: 20),
        ],
      ),
    );
  }

  Widget _buildTestimonialSection(ColorScheme colorScheme, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Share Your Experience',
          style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: colorScheme.onSurface),
        ),
        const SizedBox(height: 8),
        Text(
          'Your feedback helps other students! Featured testimonies earn extra reward points.',
          style: GoogleFonts.outfit(fontSize: 14, color: colorScheme.onSurface.withOpacity(0.5)),
        ),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: colorScheme.surface,
            borderRadius: BorderRadius.circular(32),
            border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
          ),
          child: Column(
            children: [
              TextField(
                controller: _testimonialController,
                maxLines: 4,
                style: GoogleFonts.outfit(color: colorScheme.onSurface),
                decoration: InputDecoration(
                  hintText: 'What do you love about Kibabii Nest?',
                  hintStyle: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.3)),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(20),
                    borderSide: BorderSide.none,
                  ),
                  fillColor: colorScheme.onSurface.withOpacity(0.05),
                  filled: true,
                  contentPadding: const EdgeInsets.all(20),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _submitTestimonial,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: colorScheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    elevation: 0,
                  ),
                  child: _isLoading 
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Submit Testimony', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

extension ScaffoldMessengerExtension on ScaffoldMessengerState {
  void showToast(String message) {
    showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.all(10),
      ),
    );
  }
}
