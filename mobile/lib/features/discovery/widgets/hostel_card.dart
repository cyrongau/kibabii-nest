import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'dart:io';
import '../../../services/api_service.dart';
import '../../../core/utils/image_utils.dart';

class HostelCard extends StatefulWidget {
  final String id;
  final String name;
  final String price;
  final String distance;
  final String rating;
  final List<String> amenities;
  final bool isVerified;
  final String? image;
  final List<dynamic>? images;
  final double? latitude;
  final double? longitude;
  final List<dynamic>? units;
  final Map<String, dynamic>? extraCharges;
  final bool isFull;
  final String? videoUrl;

  const HostelCard({
    super.key,
    required this.id,
    required this.name,
    required this.price,
    required this.distance,
    required this.rating,
    required this.amenities,
    this.isVerified = false,
    this.image,
    this.images,
    this.latitude,
    this.longitude,
    this.units,
    this.extraCharges,
    this.isFull = false,
    this.videoUrl,
  });

  @override
  State<HostelCard> createState() => _HostelCardState();
}

class _HostelCardState extends State<HostelCard> {
  bool _isFavorited = false;
  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    _checkFavoriteStatus();
  }

  void _checkFavoriteStatus() async {
    final status = await _apiService.isFavorited(widget.id);
    if (mounted) setState(() => _isFavorited = status);
  }

  void _toggleFavorite() async {
    final token = await _apiService.getToken();
    if (token == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please log in to save properties')),
        );
      }
      return;
    }

    final newStatus = await _apiService.toggleFavorite(widget.id);
    if (mounted) {
      setState(() => _isFavorited = newStatus);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(newStatus ? 'Added to favorites' : 'Removed from favorites'),
          duration: const Duration(seconds: 1),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    return GestureDetector(
      onTap: () => context.push('/property-detail', extra: {
        'id': widget.id,
        'name': widget.name,
        'price': widget.price,
        'rating': widget.rating,
        'distance': widget.distance,
        'image': widget.image,
        'images': widget.images,
        'lat': widget.latitude,
        'lng': widget.longitude,
        'units': widget.units,
        'extraCharges': widget.extraCharges,
        'videoUrl': widget.videoUrl,
      }),
      child: Container(
        width: 280,
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: BorderRadius.circular(32),
          boxShadow: isDark ? [] : [
            BoxShadow(
              color: const Color(0xFF0F172A).withOpacity(0.06),
              blurRadius: 30,
              offset: const Offset(0, 15),
            ),
          ],
          border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildImageSection(colorScheme, isDark),
            const SizedBox(height: 20),
            _buildDetailsSection(colorScheme, isDark),
            const SizedBox(height: 12),
            _buildAmenitiesSection(colorScheme, isDark),
          ],
        ),
      ),
    );
  }

  Widget _buildImageSection(ColorScheme colorScheme, bool isDark) {
    Widget imageWidget;
    if (widget.image == null) {
      imageWidget = _buildPlaceholder(colorScheme);
    } else if (widget.image!.startsWith('http') || widget.image!.startsWith('/')) {
      imageWidget = CachedNetworkImage(
        imageUrl: ImageUtils.formatUrl(widget.image),
        fit: BoxFit.cover,
        placeholder: (context, url) => Center(child: CircularProgressIndicator(color: colorScheme.primary)),
        errorWidget: (context, url, error) => _buildPlaceholder(colorScheme),
      );
    } else {
      imageWidget = Image.asset(
        'assets/images/${widget.image}',
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => _buildPlaceholder(colorScheme),
      );
    }

    return Stack(
      children: [
        Container(
          height: 160,
          width: double.infinity,
          decoration: BoxDecoration(
            color: colorScheme.onSurface.withOpacity(0.05),
            borderRadius: BorderRadius.circular(24),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: imageWidget,
          ),
        ),
        if (widget.isVerified)
          Positioned(
            top: 12,
            left: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: colorScheme.surface.withOpacity(0.9),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.shieldCheck, color: Color(0xFF10B981), size: 14),
                  const SizedBox(width: 4),
                  Text(
                    'VERIFIED',
                    style: GoogleFonts.outfit(
                      color: const Color(0xFF065F46),
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
        if (widget.isFull)
          Positioned(
            top: widget.isVerified ? 50 : 12,
            left: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.95),
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 4),
                ],
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.alertCircle, color: Colors.white, size: 14),
                  const SizedBox(width: 4),
                  Text(
                    'FULL',
                    style: GoogleFonts.outfit(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
        Positioned(
          top: 12,
          right: 12,
          child: Container(
            decoration: BoxDecoration(
              color: colorScheme.surface.withOpacity(0.9),
              shape: BoxShape.circle,
            ),
            child: IconButton(
              icon: Icon(
                _isFavorited ? Icons.favorite : Icons.favorite_border, 
                size: 20, 
                color: _isFavorited ? Colors.red : colorScheme.onSurface.withOpacity(0.2)
              ),
              onPressed: _toggleFavorite,
              constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
              padding: EdgeInsets.zero,
            ),
          ),
        ),
        Positioned(
          bottom: 12,
          left: 12,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: colorScheme.onSurface.withOpacity(0.8),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Text(
              'Ksh ${widget.price}/mo',
              style: GoogleFonts.outfit(
                color: colorScheme.surface,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPlaceholder(ColorScheme colorScheme) {
    return Container(
      color: colorScheme.onSurface.withOpacity(0.05),
      child: Center(child: Icon(LucideIcons.image, color: colorScheme.onSurface.withOpacity(0.2), size: 40)),
    );
  }

  Widget _buildDetailsSection(ColorScheme colorScheme, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                widget.name,
                style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: colorScheme.onSurface,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Row(
              children: [
                const Icon(LucideIcons.star, color: Color(0xFFF59E0B), size: 14),
                const SizedBox(width: 4),
                Text(
                  widget.rating,
                  style: GoogleFonts.outfit(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFFF59E0B),
                  ),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 6),
        Row(
          children: [
            Icon(LucideIcons.mapPin, size: 14, color: colorScheme.onSurface.withOpacity(0.4)),
            const SizedBox(width: 4),
            Text(
              widget.distance,
              style: GoogleFonts.outfit(
                color: colorScheme.onSurface.withOpacity(0.5),
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildAmenitiesSection(ColorScheme colorScheme, bool isDark) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: widget.amenities.take(2).map((tag) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: colorScheme.onSurface.withOpacity(0.05),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          tag,
          style: GoogleFonts.outfit(
            color: colorScheme.onSurface.withOpacity(0.6),
            fontSize: 11,
            fontWeight: FontWeight.bold,
          ),
        ),
      )).toList(),
    );
  }
}
