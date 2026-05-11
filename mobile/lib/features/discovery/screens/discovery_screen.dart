import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../services/api_service.dart';
import '../widgets/hostel_card.dart';
import '../../community/widgets/product_card.dart';
import '../../booking/screens/my_bookings_screen.dart';
import '../../profile/screens/profile_screen.dart';
import '../../tenancy/screens/my_tenancy_screen.dart';
import '../../community/screens/community_hub_screen.dart';
import 'saved_properties_screen.dart';

class DiscoveryScreen extends ConsumerStatefulWidget {
  const DiscoveryScreen({super.key});

  @override
  ConsumerState<DiscoveryScreen> createState() => _DiscoveryScreenState();
}

class _DiscoveryScreenState extends ConsumerState<DiscoveryScreen> {
  int _selectedIndex = 0;
  
  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    final List<Widget> _screens = [
      _DiscoverContent(onTabChange: _onItemTapped),
      const MyTenancyScreen(),
      const CommunityHubScreen(),
      const MyBookingsScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      backgroundColor: colorScheme.background,
      body: _screens[_selectedIndex],
      bottomNavigationBar: _buildBottomNav(colorScheme, isDark),
      floatingActionButton: _selectedIndex == 0 ? FloatingActionButton.extended(
        onPressed: () => context.push('/map'),
        backgroundColor: colorScheme.onSurface,
        icon: Icon(LucideIcons.map, color: colorScheme.surface, size: 20),
        label: Text('Map View', style: GoogleFonts.outfit(color: colorScheme.surface, fontWeight: FontWeight.bold)),
      ) : null,
    );
  }

  Widget _buildBottomNav(ColorScheme colorScheme, bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: colorScheme.surface,
        boxShadow: isDark ? [] : [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 40, offset: const Offset(0, -10))
        ],
        border: Border(top: BorderSide(color: colorScheme.onSurface.withOpacity(0.05))),
      ),
      child: SafeArea(
        child: BottomNavigationBar(
          elevation: 0,
          backgroundColor: Colors.transparent,
          currentIndex: _selectedIndex,
          onTap: _onItemTapped,
          type: BottomNavigationBarType.fixed,
          selectedItemColor: colorScheme.primary,
          unselectedItemColor: colorScheme.onSurface.withOpacity(0.3),
          selectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 10),
          unselectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.w500, fontSize: 10),
          items: const [
            BottomNavigationBarItem(icon: Icon(LucideIcons.home), label: 'Discover'),
            BottomNavigationBarItem(icon: Icon(LucideIcons.key), label: 'Tenancy'),
            BottomNavigationBarItem(icon: Icon(LucideIcons.users), label: 'Hub'),
            BottomNavigationBarItem(icon: Icon(LucideIcons.calendar), label: 'Bookings'),
            BottomNavigationBarItem(icon: Icon(LucideIcons.user), label: 'Profile'),
          ],
        ),
      ),
    );
  }
}

class _DiscoverContent extends StatefulWidget {
  final Function(int) onTabChange;
  const _DiscoverContent({required this.onTabChange});

  @override
  State<_DiscoverContent> createState() => _DiscoverContentState();
}

class _DiscoverContentState extends State<_DiscoverContent> {
  final ApiService _api = ApiService();
  final TextEditingController _searchController = TextEditingController();
  List<dynamic> _allProperties = [];
  List<dynamic> _recentProducts = [];
  bool _isLoading = true;
  String _selectedFilter = 'All';

  @override
  void initState() {
    super.initState();
    _loadProperties();
  }

  Future<void> _loadProperties({String? search}) async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait<List<dynamic>>([
        _api.getProperties(search: search),
        _api.getMarketplaceItems(),
      ]);
      final props = results[0];
      final products = results[1];
      
      if (mounted) {
        setState(() {
          _allProperties = props;
          _recentProducts = products;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _onSearch(String value) {
    _loadProperties(search: value);
  }

  void _onFilterChanged(String filter) {
    setState(() => _selectedFilter = filter);
  }

  @override
  Widget build(BuildContext context) {
    List<dynamic> filteredProperties = _allProperties;
    
    if (_selectedFilter == 'Near Campus') {
      filteredProperties = _allProperties.where((p) => (p['distanceToCampus'] ?? 9999) <= 1000).toList();
    } else if (_selectedFilter == 'Verified') {
      filteredProperties = _allProperties.where((p) => p['verified'] == true).toList();
    } else if (_selectedFilter == 'Affordable') {
      filteredProperties = _allProperties.where((p) => (p['price'] ?? 0) <= 3000).toList();
    }

    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    if (_isLoading && _allProperties.isEmpty) {
      return Scaffold(
        backgroundColor: colorScheme.background,
        body: Center(child: CircularProgressIndicator(color: colorScheme.primary)),
      );
    }

    final premium = filteredProperties.where((p) => p['verified'] == true).toList();
    final singleRooms = filteredProperties.where((p) => 
      p['category']?.toString().toLowerCase() == 'single' || 
      p['name'].toString().toLowerCase().contains('single')
    ).toList();
    
    final nearby = filteredProperties.where((p) => (p['distanceToCampus'] ?? 9999) <= 1000).toList();
    nearby.sort((a, b) => (a['distanceToCampus'] ?? 9999).compareTo(b['distanceToCampus'] ?? 9999));

    return Scaffold(
      backgroundColor: colorScheme.background,
      body: RefreshIndicator(
        onRefresh: () => _loadProperties(search: _searchController.text),
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Column(
                children: [
                  SafeArea(bottom: false, child: _buildHeader(context)),
                  const SizedBox(height: 20),
                  _buildQuickFilters(),
                  const SizedBox(height: 24),
                ],
              ),
            ),
            
            if (filteredProperties.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(LucideIcons.home, size: 64, color: colorScheme.onSurface.withOpacity(0.1)),
                      const SizedBox(height: 16),
                      Text(
                        'No properties found',
                        style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface.withOpacity(0.6)),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _searchController.text.isNotEmpty 
                          ? 'Try adjusting your search query'
                          : 'Try adjusting your filters',
                        style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.4)),
                      ),
                    ],
                  ),
                ),
              )
            else ...[
              // 1. Premium Section
              if (premium.isNotEmpty) ...[
                SliverToBoxAdapter(
                  child: _buildSectionHeader(context, 'Premium Choices', 'Hand-picked hostels for you'),
                ),
                SliverToBoxAdapter(
                  child: _buildHorizontalList(premium),
                ),
              ],
  
              // 2. Main List Section
              SliverToBoxAdapter(
                child: _buildSectionHeader(context, _selectedFilter == 'All' ? 'All Hostels' : _selectedFilter, 'Explore available options'),
              ),
              SliverToBoxAdapter(
                child: _buildHorizontalList(filteredProperties),
              ),
  
              // 3. Single Rooms
              if (singleRooms.isNotEmpty && _selectedFilter != 'Affordable') ...[
                SliverToBoxAdapter(
                  child: _buildSectionHeader(context, 'Single Rooms', 'Most popular student choice'),
                ),
                SliverToBoxAdapter(
                  child: _buildHorizontalList(singleRooms),
                ),
              ],
  
              // 4. Near Campus
              if (nearby.isNotEmpty && _selectedFilter != 'Near Campus') ...[
                SliverToBoxAdapter(
                  child: _buildSectionHeader(context, 'Near Campus', 'Within 1km from gate'),
                ),
                SliverToBoxAdapter(
                  child: _buildHorizontalList(nearby),
                ),
              ],

              // 5. Recent Marketplace Products
              if (_recentProducts.isNotEmpty && _selectedFilter == 'All') ...[
                SliverToBoxAdapter(
                  child: _buildSectionHeader(
                    context, 
                    'Recent in Marketplace', 
                    'Used items from fellow students',
                    onSeeAll: () => widget.onTabChange(2), // Switch to Hub tab
                  ),
                ),
                SliverToBoxAdapter(
                  child: _buildRecentProducts(),
                ),
              ],
  
              const SliverPadding(padding: EdgeInsets.only(bottom: 100)),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title, String subtitle, {VoidCallback? onSeeAll}) {
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, 
                style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w900, color: colorScheme.onSurface)),
              Text(subtitle, style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.5), fontWeight: FontWeight.w500, fontSize: 13)),
            ],
          ),
          TextButton(
            onPressed: onSeeAll ?? () => context.push('/map'),
            child: Text('See All', style: GoogleFonts.outfit(color: colorScheme.primary, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentProducts() {
    return SizedBox(
      height: 260,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        scrollDirection: Axis.horizontal,
        itemCount: _recentProducts.length > 5 ? 5 : _recentProducts.length,
        separatorBuilder: (context, index) => const SizedBox(width: 16),
        itemBuilder: (context, index) {
          final item = _recentProducts[index];
          return ProductCard(
            id: item['id'],
            title: item['title'],
            price: item['price'].toString(),
            category: item['category'] ?? 'General',
            image: (item['images'] != null && item['images'].isNotEmpty) ? item['images'][0] : null,
          );
        },
      ),
    );
  }

  Widget _buildHorizontalList(List<dynamic> properties) {
    if (properties.isEmpty) return const SizedBox.shrink();
    
    return SizedBox(
      height: 380,
      child: ListView.separated(
        padding: const EdgeInsets.only(left: 24, right: 24, bottom: 40, top: 12),
        scrollDirection: Axis.horizontal,
        itemCount: properties.length,
        separatorBuilder: (context, index) => const SizedBox(width: 20),
        itemBuilder: (context, index) {
          final prop = properties[index];
          return HostelCard(
            id: prop['id'] ?? '',
            name: prop['name'] ?? 'Unknown Property',
            price: prop['price']?.toString() ?? '0',
            distance: '${prop['distanceToCampus'] ?? '?' }m from Gate',
            rating: prop['avgRating']?.toString() ?? 'New', 
            amenities: const ['Wifi', 'Security'], 
            isVerified: prop['verified'] ?? true,
            isFull: prop['isFullyOccupied'] ?? false,
            image: (prop['images'] != null && prop['images'].isNotEmpty) 
              ? prop['images'][0] 
              : 'hostel_1.png',
            images: prop['images'],
            latitude: double.tryParse(prop['lat']?.toString() ?? ''),
            longitude: double.tryParse(prop['lng']?.toString() ?? ''),
            units: prop['units'],
            extraCharges: prop['extraCharges'],
            videoUrl: prop['videoUrl'],
          );
        },
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        height: 64,
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: colorScheme.primary.withOpacity(0.08),
              blurRadius: 30,
              offset: const Offset(0, 12),
            ),
          ],
          border: Border.all(color: colorScheme.onSurface.withOpacity(0.05)),
        ),
        child: Row(
          children: [
            Icon(LucideIcons.search, color: colorScheme.primary, size: 22),
            const SizedBox(width: 16),
            Expanded(
              child: TextField(
                controller: _searchController,
                onSubmitted: _onSearch,
                style: GoogleFonts.outfit(color: colorScheme.onSurface),
                decoration: InputDecoration(
                  hintText: 'Search hostels...',
                  border: InputBorder.none,
                  hintStyle: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.3), fontWeight: FontWeight.w500, fontSize: 15),
                ),
              ),
            ),
            GestureDetector(
              onTap: () => _onSearch(_searchController.text),
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: colorScheme.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(LucideIcons.sliders, color: colorScheme.primary, size: 20),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickFilters() {
    return _FilterList(
      selectedFilter: _selectedFilter,
      onFilterChanged: _onFilterChanged,
    );
  }
}

class _FilterList extends StatelessWidget {
  final String selectedFilter;
  final Function(String) onFilterChanged;

  const _FilterList({required this.selectedFilter, required this.onFilterChanged});

  final List<Map<String, dynamic>> _filters = const [
    {'label': 'All', 'icon': LucideIcons.layoutGrid},
    {'label': 'Near Campus', 'icon': LucideIcons.school},
    {'label': 'Affordable', 'icon': LucideIcons.banknote},
    {'label': 'Verified', 'icon': LucideIcons.shieldCheck},
  ];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Row(
        children: List.generate(_filters.length, (index) {
          final filter = _filters[index];
          return Padding(
            padding: const EdgeInsets.only(right: 12),
            child: GestureDetector(
              onTap: () => onFilterChanged(filter['label'] as String),
              child: _FilterChip(
                label: filter['label'] as String,
                icon: filter['icon'] as IconData,
                isSelected: selectedFilter == filter['label'],
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;

  const _FilterChip({required this.label, required this.icon, this.isSelected = false});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
      decoration: BoxDecoration(
        color: isSelected ? colorScheme.primary : colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isSelected ? Colors.transparent : colorScheme.onSurface.withOpacity(0.05)),
        boxShadow: isSelected ? [
          BoxShadow(color: colorScheme.primary.withOpacity(0.2), blurRadius: 15, offset: const Offset(0, 6))
        ] : [],
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: isSelected ? Colors.white : colorScheme.primary),
          const SizedBox(width: 8),
          Text(
            label,
            style: GoogleFonts.outfit(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: isSelected ? Colors.white : colorScheme.onSurface,
            ),
          ),
        ],
      ),
    );
  }
}
