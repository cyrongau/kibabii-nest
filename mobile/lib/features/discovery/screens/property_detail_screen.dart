import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:kibabii_nest/core/widgets/app_modals.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart' as mbx;
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'package:geolocator/geolocator.dart';
import 'dart:io';
import '../../../services/api_service.dart';
import '../widgets/hostel_card.dart';
import '../../../navigation/ui/navigation_screen.dart';

class PropertyDetailScreen extends StatefulWidget {
  final String id;
  final String name;
  final String price;
  final String rating;
  final String distance;
  final String? image;
  final List<dynamic>? images;
  final double? latitude;
  final double? longitude;
  final List<dynamic>? units;
  final Map<String, dynamic>? extraCharges;

  const PropertyDetailScreen({
    super.key,
    required this.id,
    required this.name,
    required this.price,
    required this.rating,
    required this.distance,
    this.image,
    this.images,
    this.latitude,
    this.longitude,
    this.units,
    this.extraCharges,
  });

  @override
  State<PropertyDetailScreen> createState() => _PropertyDetailScreenState();
}

class _PropertyDetailScreenState extends State<PropertyDetailScreen> {
  final ApiService _apiService = ApiService();
  bool _isFavorited = false;
  List<dynamic> _reviews = [];
  bool _isLoadingReviews = true;
  Map<String, dynamic>? _activeTenancy;

  bool _hasLocationPermission = false;

  @override
  void initState() {
    super.initState();
    _requestPermissions();
    _loadData();
  }

  Future<void> _requestPermissions() async {
    final status = await Permission.location.request();
    if (mounted) {
      setState(() {
        _hasLocationPermission = status.isGranted;
      });
    }
  }

  void _loadData() async {
    final results = await Future.wait([
      _apiService.isFavorited(widget.id),
      _apiService.getPropertyReviews(widget.id),
      _apiService.getMyTenancies(),
    ]);
    if (mounted) {
      final tenancies = results[2] as List<dynamic>;
      final active = tenancies.firstWhere(
        (t) => t['propertyUnit']['propertyId'] == widget.id, 
        orElse: () => null
      );

      setState(() {
        _isFavorited = results[0] as bool;
        _reviews = results[1] as List<dynamic>;
        _activeTenancy = active;
        _isLoadingReviews = false;
      });
    }
  }

  Future<void> _startNavigation() async {
    final lat = widget.latitude;
    final lng = widget.longitude;

    if (lat == null || lng == null) {
      AppModals.showError(
        context: context,
        title: 'Location Error',
        message: 'The property location is missing.',
      );
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => NavigationScreen(
          destinationLat: lat,
          destinationLng: lng,
          destinationName: widget.name,
        ),
      ),
    );
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
    
    final status = await _apiService.toggleFavorite(widget.id);
    if (mounted) {
      setState(() => _isFavorited = status);
      AppModals.showInfo(
        context: context,
        title: status ? 'Added to Favorites' : 'Removed',
        message: status 
          ? '${widget.name} has been added to your favorites list.'
          : '${widget.name} has been removed from your favorites.',
      );
    }
  }
  void _scheduleTour() {
    AppModals.showSuccess(
      context: context,
      title: 'Tour Scheduled',
      message: 'Your request has been sent! The landlord will contact you shortly to confirm a suitable time.',
    );
  }

  @override
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: colorScheme.background,
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              _buildAppBar(context),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildMainInfo(colorScheme),
                      const SizedBox(height: 32),
                      _buildGallery(colorScheme),
                      const SizedBox(height: 32),
                      _buildVideoPlaceholder(colorScheme),
                      const SizedBox(height: 32),
                      _buildAmenities(colorScheme),
                      const SizedBox(height: 32),
                      _buildDescription(colorScheme),
                      const SizedBox(height: 32),
                      _buildFinancials(colorScheme),
                      const SizedBox(height: 32),
                      _buildReviews(colorScheme),
                      const SizedBox(height: 32),
                      _buildRelatedProperties(colorScheme),
                      const SizedBox(height: 32),
                      _buildLocation(context, colorScheme),
                      const SizedBox(height: 140), // Bottom padding for floating button
                    ],
                  ),
                ),
              ),
            ],
          ),
          _buildBottomAction(context, colorScheme, isDark),
        ],
      ),
    );
  }

  Widget _buildAppBar(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return SliverAppBar(
      expandedHeight: 350,
      pinned: true,
      backgroundColor: colorScheme.primary,
      leading: Padding(
        padding: const EdgeInsets.all(8.0),
        child: CircleAvatar(
          backgroundColor: colorScheme.surface.withOpacity(0.9),
          child: IconButton(
            icon: Icon(LucideIcons.chevronLeft, color: colorScheme.onSurface),
            onPressed: () => Navigator.pop(context),
          ),
        ),
      ),
      actions: [
        Padding(
          padding: const EdgeInsets.all(8.0),
          child: CircleAvatar(
            backgroundColor: colorScheme.surface.withOpacity(0.9),
            child: IconButton(
              icon: Icon(_isFavorited ? Icons.favorite : Icons.favorite_border, color: const Color(0xFFEF4444)),
              onPressed: _toggleFavorite,
            ),
          ),
        ),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Hero(
          tag: widget.id,
          child: _buildMainImage(colorScheme),
        ),
      ),
    );
  }

  Widget _buildMainImage(ColorScheme colorScheme) {
    if (widget.image != null && widget.image!.startsWith('http')) {
      return Image.network(widget.image!, fit: BoxFit.cover, errorBuilder: (context, error, stackTrace) => _buildPlaceholderImage(colorScheme));
    }
    return Image.asset(
      'assets/images/${widget.image ?? 'hostel_1.png'}',
      fit: BoxFit.cover,
      errorBuilder: (context, error, stackTrace) => _buildPlaceholderImage(colorScheme),
    );
  }

  Widget _buildPlaceholderImage(ColorScheme colorScheme) {
    return Container(color: colorScheme.surface, child: Center(child: Icon(LucideIcons.image, size: 50, color: colorScheme.onSurface.withOpacity(0.1))));
  }

  Widget _buildMainInfo(ColorScheme colorScheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: colorScheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                'HOSTEL',
                style: GoogleFonts.outfit(
                  color: colorScheme.primary,
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1,
                ),
              ),
            ),
            Row(
              children: [
                const Icon(LucideIcons.star, color: Color(0xFFF59E0B), size: 18),
                const SizedBox(width: 4),
                Text(
                  _reviews.isEmpty ? 'New' : (_calculateAverageRating().toStringAsFixed(1)),
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: colorScheme.onSurface,
                  ),
                ),
                if (_reviews.isNotEmpty)
                  Text(
                    ' (${_reviews.length})',
                    style: GoogleFonts.outfit(fontSize: 14, color: colorScheme.onSurface.withOpacity(0.5)),
                  ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 16),
        Text(
          widget.name,
          style: GoogleFonts.outfit(
            fontSize: 28,
            fontWeight: FontWeight.w900,
            color: colorScheme.onSurface,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Icon(LucideIcons.mapPin, color: colorScheme.onSurface.withOpacity(0.5), size: 16),
            const SizedBox(width: 8),
            Text(
              widget.distance,
              style: GoogleFonts.outfit(
                color: colorScheme.onSurface.withOpacity(0.5),
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: _startNavigation,
                icon: const Icon(Icons.directions, size: 20),
                label: const Text('Navigate'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: colorScheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _scheduleTour,
                icon: const Icon(LucideIcons.calendar, size: 20),
                label: const Text('Schedule Tour'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: colorScheme.primary,
                  side: BorderSide(color: colorScheme.primary),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildGallery(ColorScheme colorScheme) {
    final List<String> imagesList = (widget.images != null && widget.images!.isNotEmpty)
        ? widget.images!.map((e) => e.toString()).toList()
        : ['hostel_1.png', 'hostel_2.png', 'hostel_3.png'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Gallery', 
          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
        const SizedBox(height: 16),
        SizedBox(
          height: 120,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: imagesList.length,
            separatorBuilder: (context, index) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final img = imagesList[index];
              return GestureDetector(
                onTap: () => _openLightbox(context, imagesList, index),
                child: Container(
                  width: 160,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    image: DecorationImage(
                      image: img.startsWith('http') 
                        ? NetworkImage(img) 
                        : AssetImage('assets/images/$img') as ImageProvider,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildVideoPlaceholder(ColorScheme colorScheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Video Tour', 
          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
        const SizedBox(height: 16),
        Container(
          height: 200,
          width: double.infinity,
          decoration: BoxDecoration(
            color: colorScheme.onSurface.withOpacity(0.05),
            borderRadius: BorderRadius.circular(24),
            image: const DecorationImage(
              image: NetworkImage('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800'),
              fit: BoxFit.cover,
              opacity: 0.6,
            ),
          ),
          child: Center(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: colorScheme.surface, shape: BoxShape.circle),
              child: Icon(LucideIcons.play, color: colorScheme.primary, size: 32),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAmenities(ColorScheme colorScheme) {
    final amenitiesList = [
      {'icon': LucideIcons.wifi, 'label': 'Fiber Wifi'},
      {'icon': LucideIcons.shieldCheck, 'label': '24/7 Security'},
      {'icon': LucideIcons.utilityPole, 'label': 'Electricity'},
      {'icon': LucideIcons.droplet, 'label': 'Water Inc.'},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Amenities', 
          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
        const SizedBox(height: 16),
        SizedBox(
          height: 90,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: amenitiesList.length,
            separatorBuilder: (context, index) => const SizedBox(width: 16),
            itemBuilder: (context, index) {
              return Container(
                width: 100,
                decoration: BoxDecoration(
                  color: colorScheme.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(amenitiesList[index]['icon'] as IconData, color: colorScheme.primary),
                    const SizedBox(height: 8),
                    Text(
                      amenitiesList[index]['label'] as String,
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: colorScheme.onSurface.withOpacity(0.7),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildDescription(ColorScheme colorScheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('About Property', 
          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
        const SizedBox(height: 12),
        Text(
          'Located just a few minutes from Kibabii University Main Gate, ${widget.name} offers high-quality student living with spacious rooms, a quiet study environment, and reliable utilities. Perfect for students seeking comfort and convenience.',
          style: GoogleFonts.outfit(
            fontSize: 15,
            color: colorScheme.onSurface.withOpacity(0.6),
            height: 1.6,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildFinancials(ColorScheme colorScheme) {
    final extraCharges = widget.extraCharges ?? {};
    final securityDeposit = extraCharges['securityDeposit']?.toString() ?? '0';
    final serviceFee = extraCharges['serviceFee']?.toString() ?? '150';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Financial Details', 
          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: colorScheme.onSurface.withOpacity(0.05),
            borderRadius: BorderRadius.circular(24),
          ),
          child: Column(
            children: [
              _buildFeeRow('Monthly Rent', 'Ksh ${widget.price}', colorScheme, isPrimary: true),
              const Divider(height: 24),
              _buildFeeRow('Security Deposit', 'Ksh $securityDeposit', colorScheme, subtitle: 'Refundable, paid once'),
              const SizedBox(height: 12),
              _buildFeeRow('Monthly Service Fee', 'Ksh $serviceFee', colorScheme, subtitle: 'Security, Garbage, Water'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFeeRow(String label, String value, ColorScheme colorScheme, {bool isPrimary = false, String? subtitle}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: GoogleFonts.outfit(
              fontWeight: isPrimary ? FontWeight.w900 : FontWeight.bold, 
              color: isPrimary ? colorScheme.onSurface : colorScheme.onSurface.withOpacity(0.5),
              fontSize: isPrimary ? 16 : 14
            )),
            if (subtitle != null)
              Text(subtitle, style: GoogleFonts.outfit(fontSize: 11, color: colorScheme.onSurface.withOpacity(0.3))),
          ],
        ),
        Text(value, style: GoogleFonts.outfit(
          fontWeight: FontWeight.w900, 
          fontSize: isPrimary ? 18 : 15,
          color: isPrimary ? colorScheme.primary : colorScheme.onSurface
        )),
      ],
    );
  }

  Widget _buildRelatedProperties(ColorScheme colorScheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Related Properties', 
          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
        const SizedBox(height: 16),
        SizedBox(
          height: 320,
          child: FutureBuilder<List<dynamic>>(
            future: ApiService().getProperties(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return Center(child: CircularProgressIndicator(color: colorScheme.primary));
              }
              final properties = snapshot.data?.where((p) => p['name'] != widget.name).toList() ?? [];
              if (properties.isEmpty) return Text('No related properties found', style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.5)));

              return ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: properties.length,
                separatorBuilder: (context, index) => const SizedBox(width: 16),
                itemBuilder: (context, index) {
                  final prop = properties[index];
                  return Transform.scale(
                    scale: 0.9,
                    child: HostelCard(
                      id: prop['id'] ?? '',
                      name: prop['name'] ?? 'Unknown',
                      price: prop['price']?.toString() ?? '0',
                      distance: '${prop['distanceToCampus'] ?? '?'}m',
                      rating: '4.9',
                      amenities: const ['Wifi'],
                      isVerified: prop['verified'] ?? true,
                      image: prop['images']?.isNotEmpty == true ? prop['images'][0] : 'hostel_1.png',
                      images: prop['images'],
                      units: prop['units'],
                    ),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildLocation(BuildContext context, ColorScheme colorScheme) {
    final lat = widget.latitude ?? 0.6231;
    final lng = widget.longitude ?? 34.5028;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Location', 
          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
        const SizedBox(height: 16),
        Container(
          height: 180,
          width: double.infinity,
          decoration: BoxDecoration(
            color: colorScheme.onSurface.withOpacity(0.05),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: colorScheme.onSurface.withOpacity(0.1)),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: Stack(
              children: [
                Positioned.fill(
                  child: mbx.MapWidget(
                    key: ValueKey("property_map_${widget.id}"),
                    resourceOptions: mbx.ResourceOptions(
                      accessToken: dotenv.get('MAPBOX_PUBLIC_TOKEN', fallback: ''),
                    ),
                    styleUri: isDark 
                        ? "mapbox://styles/mapbox/dark-v11" 
                        : "mapbox://styles/mapbox/streets-v11",
                    onMapCreated: (mapboxMap) async {
                      try {
                        mapboxMap.setCamera(mbx.CameraOptions(
                          center: mbx.Point(coordinates: mbx.Position(lng, lat)).toJson(),
                          zoom: 15.0,
                        ));
                        
                        final annotationManager = await mapboxMap.annotations.createPointAnnotationManager();
                        annotationManager.create(mbx.PointAnnotationOptions(
                          geometry: mbx.Point(coordinates: mbx.Position(lng, lat)).toJson(),
                          iconImage: "marker-15",
                        ));
                      } catch (e) {
                        debugPrint("PropertyDetailScreen: Map error: $e");
                      }
                    },
                  ),
                ),
                Positioned(
                  bottom: 16,
                  left: 16,
                  right: 16,
                  child: Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => context.push('/map', extra: {'lat': lat, 'lng': lng}),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: colorScheme.surface.withOpacity(0.9),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(LucideIcons.map, size: 18, color: colorScheme.primary),
                                const SizedBox(width: 8),
                                Text('View Map', 
                                  style: GoogleFonts.outfit(color: colorScheme.onSurface, fontWeight: FontWeight.bold, fontSize: 12)),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: GestureDetector(
                          onTap: _startNavigation,
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: colorScheme.primary,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.directions, size: 18, color: Colors.white),
                                const SizedBox(width: 8),
                                Text('Navigate', 
                                  style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBottomAction(BuildContext context, ColorScheme colorScheme, bool isDark) {
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: colorScheme.surface,
          boxShadow: isDark ? [] : [
            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 40, offset: const Offset(0, -10))
          ],
          border: Border(top: BorderSide(color: colorScheme.onSurface.withOpacity(0.05))),
        ),
        child: SafeArea(
          top: false,
          child: Row(
            children: [
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Ksh ${widget.price}', 
                    style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w900, color: colorScheme.onSurface)),
                  Text('Per Month', 
                    style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.5), fontWeight: FontWeight.w600, fontSize: 13)),
                ],
              ),
              const SizedBox(width: 32),
              Expanded(
                child: Container(
                  height: 60,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    color: colorScheme.primary,
                    boxShadow: [
                      BoxShadow(color: colorScheme.primary.withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 10))
                    ],
                  ),
                  child: ElevatedButton(
                    onPressed: () {
                      if (_activeTenancy != null) {
                        // User already lives here
                        if (widget.units != null && widget.units!.length > 1) {
                          _showUpgradeDowngradeModal(context);
                        } else {
                          context.push('/payment', extra: {
                            'price': _activeTenancy!['monthlyRent']?.toString(),
                            'propertyUnitId': _activeTenancy!['propertyUnitId'],
                            'propertyName': widget.name,
                          });
                        }
                        return;
                      }

                      if (widget.units != null && widget.units!.length > 1) {
                        _showUnitSelectionModal(context);
                      } else {
                        final unit = (widget.units != null && widget.units!.isNotEmpty) ? widget.units![0] : null;
                        _proceedToPayment(unit);
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      shadowColor: Colors.transparent,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    ),
                    child: Text(
                      _activeTenancy != null 
                        ? (widget.units != null && widget.units!.length > 1 ? 'Upgrade / Downgrade' : 'Pay Rent')
                        : 'Book Now',
                      style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  double _calculateAverageRating() {
    if (_reviews.isEmpty) return 0.0;
    double sum = 0;
    for (var r in _reviews) {
      sum += (r['rating'] as num).toDouble();
    }
    return sum / _reviews.length;
  }

  void _showUpgradeDowngradeModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Upgrade or Downgrade Unit', 
              style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
            const SizedBox(height: 8),
            Text('Change your current room to a different type', 
              style: GoogleFonts.outfit(fontSize: 13, color: const Color(0xFF64748B))),
            const SizedBox(height: 24),
            ...?widget.units?.map((unit) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                title: Text(unit['type']?['name'] ?? 'Unit', style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text('Ksh ${unit['price']}/month'),
                trailing: const Icon(LucideIcons.chevronRight),
                onTap: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Request submitted to landlord.')));
                },
              ),
            )),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  context.push('/payment', extra: {
                    'price': _activeTenancy!['monthlyRent']?.toString(),
                    'propertyUnitId': _activeTenancy!['propertyUnitId'],
                    'propertyName': widget.name,
                  });
                },
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
                child: const Text('Just Pay Rent', style: TextStyle(color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _proceedToPayment(Map<String, dynamic>? unit) {
    if (unit == null) return;
    context.push('/payment', extra: {
      'price': unit['price']?.toString() ?? widget.price,
      'propertyUnitId': unit['id'],
      'propertyName': widget.name,
      'propertyAddress': widget.distance,
      'propertyImage': widget.image,
      'extraCharges': widget.extraCharges,
      'unitType': unit['type']?['name'] ?? 'Unit',
    });
  }

  void _showUnitSelectionModal(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: colorScheme.onSurface.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
              ),
            ),
            const SizedBox(height: 24),
            Text('Select Unit Type', 
              style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w900, color: colorScheme.onSurface)),
            const SizedBox(height: 8),
            Text('Choose your preferred room configuration and pricing', 
              style: GoogleFonts.outfit(fontSize: 14, color: colorScheme.onSurface.withOpacity(0.5))),
            const SizedBox(height: 32),
            ...widget.units!.map((unit) => Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: InkWell(
                onTap: () {
                  Navigator.pop(context);
                  _proceedToPayment(unit);
                },
                borderRadius: BorderRadius.circular(24),
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
                    color: colorScheme.onSurface.withOpacity(0.02),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: colorScheme.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(16)),
                        child: Icon(LucideIcons.doorOpen, color: colorScheme.primary, size: 24),
                      ),
                      const SizedBox(width: 20),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(unit['type']?['name'] ?? 'Standard Unit', 
                              style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 17, color: colorScheme.onSurface)),
                            const SizedBox(height: 4),
                            Text('Ksh ${unit['price']}/month', 
                              style: GoogleFonts.outfit(fontSize: 14, color: colorScheme.primary, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                      Icon(LucideIcons.chevronRight, color: colorScheme.onSurface.withOpacity(0.2), size: 20),
                    ],
                  ),
                ),
              ),
            )),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  void _openLightbox(BuildContext context, List<String> images, int initialIndex) {
    showDialog(
      context: context,
      useSafeArea: false,
      builder: (context) => Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.close, color: Colors.white, size: 30),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: PageView.builder(
          itemCount: images.length,
          controller: PageController(initialPage: initialIndex),
          itemBuilder: (context, index) {
            return Center(
              child: InteractiveViewer(
                minScale: 0.5,
                maxScale: 4.0,
                child: images[index].startsWith('http')
                  ? Image.network(
                      images[index],
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => const Icon(Icons.broken_image, color: Colors.white, size: 50),
                    )
                  : Image.asset(
                      'assets/images/${images[index]}',
                      fit: BoxFit.contain,
                    ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildReviews(ColorScheme colorScheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Reviews', 
              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
            TextButton(
              onPressed: () => _showReviewModal(context, colorScheme),
              child: Text('Write a review', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.primary)),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (_isLoadingReviews)
          Center(child: CircularProgressIndicator(color: colorScheme.primary))
        else if (_reviews.isEmpty)
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: colorScheme.onSurface.withOpacity(0.02),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
            ),
            child: Center(
              child: Column(
                children: [
                  Icon(LucideIcons.messageSquare, color: colorScheme.onSurface.withOpacity(0.1), size: 32),
                  const SizedBox(height: 12),
                  Text('No reviews yet. Be the first to review!', 
                    style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.4), fontSize: 14)),
                ],
              ),
            ),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _reviews.length,
            separatorBuilder: (context, index) => const SizedBox(height: 16),
            itemBuilder: (context, index) {
              final review = _reviews[index];
              return Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: colorScheme.onSurface.withOpacity(0.02),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 16,
                          backgroundImage: (review['student'] != null && review['student']['avatar'] != null) 
                            ? NetworkImage(review['student']['avatar']) 
                            : null,
                          child: (review['student'] == null || review['student']['avatar'] == null) ? Icon(LucideIcons.user, size: 16, color: colorScheme.onSurface.withOpacity(0.3)) : null,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(review['student']?['name'] ?? 'Anonymous', 
                                style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14, color: colorScheme.onSurface)),
                              Row(
                                children: List.generate(5, (i) => Icon(
                                  Icons.star, 
                                  size: 12, 
                                  color: i < (review['rating'] ?? 0) ? const Color(0xFFF59E0B) : colorScheme.onSurface.withOpacity(0.1),
                                )),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          'Recent',
                          style: GoogleFonts.outfit(fontSize: 12, color: colorScheme.onSurface.withOpacity(0.4)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(review['comment'] ?? '', 
                      style: GoogleFonts.outfit(fontSize: 14, color: colorScheme.onSurface.withOpacity(0.7))),
                  ],
                ),
              );
            },
          ),
      ],
    );
  }

  void _showReviewModal(BuildContext context, ColorScheme colorScheme) {
    int rating = 5;
    final controller = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            top: 24, left: 24, right: 24,
          ),
          decoration: BoxDecoration(
            color: colorScheme.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(color: colorScheme.onSurface.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 24),
              Text('Write a Review', 
                style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w900, color: colorScheme.onSurface)),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (i) => IconButton(
                  onPressed: () => setModalState(() => rating = i + 1),
                  icon: Icon(
                    Icons.star, 
                    size: 40,
                    color: i < rating ? const Color(0xFFF59E0B) : colorScheme.onSurface.withOpacity(0.1),
                  ),
                )),
              ),
              const SizedBox(height: 24),
              TextField(
                controller: controller,
                maxLines: 4,
                style: GoogleFonts.outfit(color: colorScheme.onSurface),
                decoration: InputDecoration(
                  hintText: 'Share your experience...',
                  hintStyle: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.3)),
                  filled: true,
                  fillColor: colorScheme.onSurface.withOpacity(0.05),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: () async {
                    final res = await _apiService.createReview(widget.id, rating, controller.text);
                    if (res != null) {
                      Navigator.pop(context);
                      _loadData();
                    } else {
                      AppModals.showError(
                        context: context,
                        title: 'Submission Failed',
                        message: 'You must have a confirmed booking at this property to leave a review.',
                      );
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: colorScheme.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: Text('Submit Review', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}
