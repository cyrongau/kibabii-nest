import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'dart:ui';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<OnboardingData> _pages = [
    OnboardingData(
      title: 'Find Your Perfect Nest',
      description: 'Discover premium student hostels near Kibabii University, tailored to your lifestyle and academic journey.',
      image: 'assets/images/onboarding_3d_1.png',
      accentColor: const Color(0xFF3B82F6),
    ),
    OnboardingData(
      title: 'Safety First, Always',
      description: 'Every hostel on our platform is physically verified by our team to ensure your safety and peace of mind.',
      image: 'assets/images/onboarding_3d_2.png',
      accentColor: const Color(0xFF10B981),
    ),
    OnboardingData(
      title: 'Explore with Confidence',
      description: 'Use our real-time map and smart filters to find accommodations with high-speed Wi-Fi, security, and more.',
      image: 'assets/images/onboarding_3d_3.png',
      accentColor: const Color(0xFF6366F1),
    ),
    OnboardingData(
      title: 'Secure Your Spot Instantly',
      description: 'Experience premium student living. Your booking is confirmed and your next home is ready.',
      image: 'assets/images/onboarding_3d_4.png',
      accentColor: const Color(0xFFF59E0B),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      body: Stack(
        children: [
          // Background Gradient
          AnimatedContainer(
            duration: const Duration(milliseconds: 500),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: isDark 
                  ? [const Color(0xFF0F172A), const Color(0xFF000000)]
                  : [const Color(0xFFF8FAFC), const Color(0xFFE2E8F0)],
              ),
            ),
          ),
          
          // Background Decorative Blobs (Premium Touch)
          Positioned(
            top: -100,
            right: -100,
            child: _buildBlurBlob(
              color: _pages[_currentPage].accentColor.withOpacity(0.15),
              size: 300,
            ),
          ),
          Positioned(
            bottom: -50,
            left: -50,
            child: _buildBlurBlob(
              color: _pages[_currentPage].accentColor.withOpacity(0.1),
              size: 250,
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                // Top Header
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: const Color(0xFF3B82F6),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.home_rounded, color: Colors.white, size: 20),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            'Kibabii Nest',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.white : const Color(0xFF1E293B),
                            ),
                          ),
                        ],
                      ),
                      TextButton(
                        onPressed: () => context.go('/auth'),
                        child: Text(
                          'Skip',
                          style: GoogleFonts.plusJakartaSans(
                            color: isDark ? Colors.white70 : const Color(0xFF64748B),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                Expanded(
                  child: PageView.builder(
                    controller: _pageController,
                    onPageChanged: (value) => setState(() => _currentPage = value),
                    itemCount: _pages.length,
                    itemBuilder: (context, index) => _OnboardingPage(
                      data: _pages[index],
                      isDark: isDark,
                    ),
                  ),
                ),

                // Bottom Controls
                Padding(
                  padding: const EdgeInsets.all(32.0),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                          _pages.length,
                          (index) => _buildDot(index: index, accentColor: _pages[_currentPage].accentColor),
                        ),
                      ),
                      const SizedBox(height: 32),
                      _buildMainButton(context, isDark),
                      const SizedBox(height: 16),
                      Text(
                        'Step ${_currentPage + 1} of ${_pages.length}',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 1.2,
                          color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBlurBlob({required Color color, required double size}) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
      ),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 50, sigmaY: 50),
        child: Container(color: Colors.transparent),
      ),
    );
  }

  Widget _buildDot({required int index, required Color accentColor}) {
    bool isSelected = _currentPage == index;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.only(right: 8),
      height: 8,
      width: isSelected ? 32 : 8,
      decoration: BoxDecoration(
        color: isSelected ? accentColor : accentColor.withOpacity(0.2),
        borderRadius: BorderRadius.circular(4),
        boxShadow: isSelected ? [
          BoxShadow(
            color: accentColor.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ] : null,
      ),
    );
  }

  Widget _buildMainButton(BuildContext context, bool isDark) {
    bool isLastPage = _currentPage == _pages.length - 1;
    Color accentColor = _pages[_currentPage].accentColor;

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: accentColor.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          )
        ],
      ),
      child: ElevatedButton(
        onPressed: () {
          if (isLastPage) {
            context.go('/auth');
          } else {
            _pageController.nextPage(
              duration: const Duration(milliseconds: 500),
              curve: Curves.easeInOut,
            );
          }
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: accentColor,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 20),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          elevation: 0,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              isLastPage ? 'Get Started' : 'Continue',
              style: GoogleFonts.plusJakartaSans(
                fontWeight: FontWeight.w800,
                fontSize: 16,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.arrow_forward_rounded, size: 20),
          ],
        ),
      ),
    );
  }
}

class OnboardingData {
  final String title;
  final String description;
  final String image;
  final Color accentColor;

  OnboardingData({
    required this.title,
    required this.description,
    required this.image,
    required this.accentColor,
  });
}

class _OnboardingPage extends StatelessWidget {
  final OnboardingData data;
  final bool isDark;
  const _OnboardingPage({required this.data, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Glassmorphism Card for Image
            _buildGlassCard(context),
            const SizedBox(height: 32), // Reduced spacing slightly
            
            // Text Content
            _buildTextContent(),
          ],
        ),
      ),
    );
  }

  Widget _buildGlassCard(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.35, // Slightly reduced height
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(40),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.1) : Colors.white.withOpacity(0.4),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 30,
            offset: const Offset(0, 20),
          )
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(40),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  isDark ? Colors.white.withOpacity(0.05) : Colors.white.withOpacity(0.7),
                  isDark ? Colors.white.withOpacity(0.02) : Colors.white.withOpacity(0.3),
                ],
              ),
            ),
            child: Stack(
              children: [
                // 3D Image with Rounded Corners
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(24), // Added rounded corners to image
                      child: Image.asset(
                        data.image,
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) => Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.image_not_supported_rounded,
                              size: 64,
                              color: data.accentColor.withOpacity(0.5),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Premium Asset',
                              style: GoogleFonts.plusJakartaSans(
                                color: data.accentColor.withOpacity(0.5),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                
                // Overlay Badge (Optional touch)
                if (data.title.contains('Verified'))
                  Positioned(
                    bottom: 20,
                    right: 20,
                    child: _buildBadge('Physically Inspected'),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBadge(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF10B981),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF10B981).withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.verified_rounded, color: Colors.white, size: 16),
          const SizedBox(width: 8),
          Text(
            text,
            style: GoogleFonts.plusJakartaSans(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTextContent() {
    // Splitting the title to highlight the last word with primary color
    List<String> words = data.title.split(' ');
    String lastWord = words.removeLast();
    String firstPart = words.join(' ');

    return Column(
      children: [
        RichText(
          textAlign: TextAlign.center,
          text: TextSpan(
            style: GoogleFonts.plusJakartaSans(
              fontSize: 32,
              fontWeight: FontWeight.w900,
              height: 1.1,
              color: isDark ? Colors.white : const Color(0xFF1E293B),
            ),
            children: [
              TextSpan(text: '$firstPart '),
              TextSpan(
                text: lastWord,
                style: TextStyle(color: data.accentColor),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Text(
          data.description,
          textAlign: TextAlign.center,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 16,
            color: isDark ? Colors.white60 : const Color(0xFF64748B),
            height: 1.6,
            letterSpacing: 0.2,
          ),
        ),
      ],
    );
  }
}
