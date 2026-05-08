import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../services/api_service.dart';

class MyPropertiesScreen extends StatefulWidget {
  const MyPropertiesScreen({super.key});

  @override
  State<MyPropertiesScreen> createState() => _MyPropertiesScreenState();
}

class _MyPropertiesScreenState extends State<MyPropertiesScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  List<dynamic> _properties = [];

  @override
  void initState() {
    super.initState();
    _loadProperties();
  }

  Future<void> _loadProperties() async {
    setState(() => _isLoading = true);
    try {
      final props = await _apiService.getMyProperties();
      if (mounted) {
        setState(() {
          _properties = props;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading properties: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      backgroundColor: colorScheme.background,
      appBar: AppBar(
        title: Text('My Properties', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: Icon(LucideIcons.plus, color: colorScheme.primary),
            onPressed: () => context.push('/add-property'),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : RefreshIndicator(
            onRefresh: _loadProperties,
            child: _properties.isEmpty
              ? _buildEmptyState(colorScheme)
              : ListView.separated(
                  padding: const EdgeInsets.all(24),
                  itemCount: _properties.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 20),
                  itemBuilder: (context, index) {
                    final p = _properties[index];
                    return _buildPropertyCard(p, colorScheme);
                  },
                ),
          ),
    );
  }

  Widget _buildPropertyCard(Map<String, dynamic> p, ColorScheme colorScheme) {
    final isVerified = p['verified'] == true;
    final images = p['images'] as List?;
    final firstImage = (images != null && images.isNotEmpty) ? images[0] : null;
    final units = p['units'] as List? ?? [];
    
    return Container(
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image Section
          Stack(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                child: firstImage != null
                  ? CachedNetworkImage(
                      imageUrl: firstImage,
                      height: 180,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(color: colorScheme.surfaceVariant, child: const Center(child: CircularProgressIndicator())),
                      errorWidget: (context, url, error) => Container(color: colorScheme.surfaceVariant, child: Icon(LucideIcons.image, color: colorScheme.onSurface.withOpacity(0.2))),
                    )
                  : Container(
                      height: 180,
                      width: double.infinity,
                      color: colorScheme.primary.withOpacity(0.05),
                      child: Icon(LucideIcons.building2, color: colorScheme.primary.withOpacity(0.2), size: 48),
                    ),
              ),
              Positioned(
                top: 16,
                right: 16,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: isVerified ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 8)],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(isVerified ? LucideIcons.checkCircle : LucideIcons.clock, color: Colors.white, size: 12),
                      const SizedBox(width: 6),
                      Text(
                        isVerified ? 'VERIFIED' : 'PENDING',
                        style: GoogleFonts.outfit(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          
          // Content Section
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        p['name'] ?? 'Unknown Property',
                        style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18, color: colorScheme.onSurface),
                      ),
                    ),
                    IconButton(
                      icon: Icon(LucideIcons.edit3, size: 18, color: colorScheme.primary),
                      onPressed: () => context.push('/landlord/properties/${p['id']}/edit'),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(LucideIcons.mapPin, size: 14, color: colorScheme.onSurface.withOpacity(0.4)),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        p['address'] ?? 'No address',
                        style: GoogleFonts.outfit(fontSize: 13, color: colorScheme.onSurface.withOpacity(0.5)),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    _buildFeatureChip(LucideIcons.home, '${units.length} Unit Types', colorScheme),
                    const SizedBox(width: 12),
                    _buildFeatureChip(LucideIcons.layers, p['category']?['name'] ?? 'Hostel', colorScheme),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureChip(IconData icon, String label, ColorScheme colorScheme) {
    return Row(
      children: [
        Icon(icon, size: 14, color: colorScheme.onSurface.withOpacity(0.4)),
        const SizedBox(width: 6),
        Text(
          label,
          style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w600, color: colorScheme.onSurface.withOpacity(0.6)),
        ),
      ],
    );
  }

  Widget _buildEmptyState(ColorScheme colorScheme) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(color: colorScheme.primary.withOpacity(0.05), shape: BoxShape.circle),
              child: Icon(LucideIcons.building, size: 64, color: colorScheme.primary.withOpacity(0.2)),
            ),
            const SizedBox(height: 24),
            Text('No properties listed', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
            const SizedBox(height: 8),
            Text(
              'Start by adding your first property to reach thousands of students.',
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.5)),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () => context.push('/add-property'),
              icon: const Icon(LucideIcons.plus),
              label: const Text('Add New Property'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
