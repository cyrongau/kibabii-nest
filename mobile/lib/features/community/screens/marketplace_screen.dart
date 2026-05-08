import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../../services/api_service.dart';
import '../widgets/product_card.dart';
import './item_details_screen.dart';
import '../../chat/screens/chat_screen.dart';

class MarketplaceScreen extends StatefulWidget {
  const MarketplaceScreen({super.key});

  @override
  State<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends State<MarketplaceScreen> {
  final ApiService _api = ApiService();
  bool _isLoading = false;
  List<dynamic> _items = [];
  String? _selectedCategory;
  final TextEditingController _searchController = TextEditingController();
  bool _showMyItems = false;

  final List<String> _categories = [
    'Electronics',
    'Books',
    'Furniture',
    'Kitchenware',
    'Stationery',
    'Other',
  ];

  @override
  void initState() {
    super.initState();
    _checkOnboarding();
    _fetchItems();
  }

  Future<void> _checkOnboarding() async {
    final profile = await _api.getMyProfile();
    if (profile != null && profile['hasAcceptedMarketplaceTerms'] == false) {
      if (mounted) {
        _showOnboardingSheet();
      }
    }
  }

  void _showOnboardingSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      isDismissible: false,
      enableDrag: false,
      backgroundColor: Colors.transparent,
      builder: (context) => const MarketplaceOnboardingSheet(),
    ).then((accepted) {
      if (accepted == true) {
        _api.acceptMarketplaceTerms();
      }
    });
  }

  Future<void> _fetchItems() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      if (_showMyItems) {
        final items = await _api.getMyMarketplaceItems();
        if (mounted) setState(() => _items = items);
      } else {
        final items = await _api.getMarketplaceItems(
          category: _selectedCategory,
          search: _searchController.text.isNotEmpty ? _searchController.text : null,
        );
        if (mounted) setState(() => _items = items);
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
          'Student Marketplace',
          style: GoogleFonts.outfit(color: colorScheme.onSurface, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: Icon(_showMyItems ? LucideIcons.shoppingBag : LucideIcons.user, color: colorScheme.primary),
            onPressed: () {
              setState(() => _showMyItems = !_showMyItems);
              _fetchItems();
            },
          ),
          IconButton(
            icon: Icon(LucideIcons.plusCircle, color: colorScheme.primary),
            onPressed: () => _showCreateItemDialog(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search & Filter
          Container(
            color: colorScheme.surface,
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  style: GoogleFonts.outfit(color: colorScheme.onSurface),
                  decoration: InputDecoration(
                    hintText: 'Search items...',
                    hintStyle: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.5)),
                    prefixIcon: Icon(LucideIcons.search, size: 20, color: colorScheme.onSurface.withOpacity(0.5)),
                    fillColor: isDark ? colorScheme.background : const Color(0xFFF1F5F9),
                    filled: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                  ),
                  onSubmitted: (_) => _fetchItems(),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 40,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: _categories.length + 1,
                    itemBuilder: (context, index) {
                      final cat = index == 0 ? null : _categories[index - 1];
                      final isSelected = _selectedCategory == cat;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: Text(cat ?? 'All'),
                          selected: isSelected,
                          onSelected: (val) {
                            setState(() => _selectedCategory = val ? cat : null);
                            _fetchItems();
                          },
                          selectedColor: colorScheme.primary.withOpacity(0.2),
                          checkmarkColor: colorScheme.primary,
                          labelStyle: GoogleFonts.outfit(
                            color: isSelected ? colorScheme.primary : colorScheme.onSurface.withOpacity(0.6),
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            fontSize: 12,
                          ),
                          backgroundColor: isDark ? colorScheme.onSurface.withOpacity(0.05) : Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                            side: BorderSide(color: isSelected ? colorScheme.primary : colorScheme.onSurface.withOpacity(0.1)),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
          
          // Items Grid
          Expanded(
            child: _isLoading 
              ? Center(child: CircularProgressIndicator(color: colorScheme.primary))
              : _items.isEmpty
                ? _buildEmptyState(colorScheme)
                : GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.72, // Balanced ratio for better visibility
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                    ),
                    itemCount: _items.length,
                    itemBuilder: (context, index) {
                      final item = _items[index];
                      return ProductCard(
                        id: item['id'],
                        title: item['title'],
                        price: item['price'].toString(),
                        image: item['images'] != null && item['images'].isNotEmpty ? item['images'][0] : null,
                        category: item['category'] ?? 'General',
                        status: item['status'],
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  void _showCreateItemDialog() {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    final titleController = TextEditingController();
    final priceController = TextEditingController();
    final phoneController = TextEditingController();
    final descController = TextEditingController();
    String? category = _categories.first;
    List<File> selectedImages = [];
    bool isSaving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          height: MediaQuery.of(context).size.height * 0.85,
          decoration: BoxDecoration(
            color: colorScheme.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          ),
          padding: EdgeInsets.only(
            top: 24, left: 24, right: 24,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Post New Item', style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
                    IconButton(icon: Icon(LucideIcons.x, color: colorScheme.onSurface), onPressed: () => Navigator.pop(context)),
                  ],
                ),
                const SizedBox(height: 24),
                
                // Multi-Image Picker
                Text('Images (Max 4)', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface.withOpacity(0.6), fontSize: 13)),
                const SizedBox(height: 12),
                SizedBox(
                  height: 100,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      ...selectedImages.map((file) => Container(
                        width: 100,
                        margin: const EdgeInsets.only(right: 8),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          image: DecorationImage(image: FileImage(file), fit: BoxFit.cover),
                        ),
                        child: Align(
                          alignment: Alignment.topRight,
                          child: IconButton(
                            icon: const Icon(LucideIcons.xCircle, color: Colors.white, size: 20),
                            onPressed: () => setModalState(() => selectedImages.remove(file)),
                          ),
                        ),
                      )),
                      if (selectedImages.length < 4)
                        GestureDetector(
                          onTap: () async {
                            final picker = ImagePicker();
                            final image = await picker.pickImage(source: ImageSource.gallery);
                            if (image != null) {
                              setModalState(() => selectedImages.add(File(image.path)));
                            }
                          },
                          child: Container(
                            width: 100,
                            decoration: BoxDecoration(
                              color: isDark ? colorScheme.background : const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: colorScheme.onSurface.withOpacity(0.1)),
                            ),
                            child: Icon(LucideIcons.plus, color: colorScheme.onSurface.withOpacity(0.3)),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                _buildFieldLabel('Item Title', colorScheme),
                TextField(
                  controller: titleController,
                  style: GoogleFonts.outfit(color: colorScheme.onSurface),
                  decoration: _inputDecoration('e.g. Scientific Calculator', colorScheme),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildFieldLabel('Price (Ksh)', colorScheme),
                          TextField(
                            controller: priceController,
                            keyboardType: TextInputType.number,
                            style: GoogleFonts.outfit(color: colorScheme.onSurface),
                            decoration: _inputDecoration('500', colorScheme),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildFieldLabel('Category', colorScheme),
                          DropdownButtonFormField<String>(
                            value: category,
                            dropdownColor: colorScheme.surface,
                            style: GoogleFonts.outfit(color: colorScheme.onSurface, fontSize: 14),
                            items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                            onChanged: (val) => setModalState(() => category = val),
                            decoration: _inputDecoration('', colorScheme),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildFieldLabel('Contact Phone Number', colorScheme),
                TextField(
                  controller: phoneController,
                  keyboardType: TextInputType.phone,
                  style: GoogleFonts.outfit(color: colorScheme.onSurface),
                  decoration: _inputDecoration('07XXXXXXXX', colorScheme),
                ),
                const SizedBox(height: 16),
                _buildFieldLabel('Description', colorScheme),
                TextField(
                  controller: descController,
                  maxLines: 3,
                  style: GoogleFonts.outfit(color: colorScheme.onSurface),
                  decoration: _inputDecoration('Condition, reason for selling etc.', colorScheme),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: isSaving ? null : () async {
                      if (titleController.text.isEmpty || priceController.text.isEmpty || phoneController.text.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all required fields')));
                        return;
                      }
                      setModalState(() => isSaving = true);
                      
                      try {
                        List<String> imageUrls = [];
                        for (var file in selectedImages) {
                          final url = await _api.uploadImage(file, folder: 'marketplace');
                          if (url != null) imageUrls.add(url);
                        }

                        final success = await _api.createMarketplaceItem({
                          'title': titleController.text,
                          'price': double.tryParse(priceController.text) ?? 0.0,
                          'phone': phoneController.text,
                          'description': descController.text,
                          'category': category,
                          'images': imageUrls,
                        });
                        
                        if (success != null) {
                          Navigator.pop(context);
                          _fetchItems();
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Item posted successfully!')));
                        }
                      } finally {
                        setModalState(() => isSaving = false);
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: colorScheme.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: 0,
                    ),
                    child: isSaving 
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Text('Post Item', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFieldLabel(String label, ColorScheme colorScheme) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(label, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface.withOpacity(0.6), fontSize: 13)),
    );
  }

  InputDecoration _inputDecoration(String hint, ColorScheme colorScheme) {
    return InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.3), fontSize: 14),
      filled: true,
      fillColor: colorScheme.onSurface.withOpacity(0.05),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: colorScheme.primary, width: 1)),
    );
  }

  Widget _buildEmptyState(ColorScheme colorScheme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.shoppingCart, size: 64, color: colorScheme.onSurface.withOpacity(0.1)),
          const SizedBox(height: 16),
          Text(
            'No items found',
            style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface.withOpacity(0.6)),
          ),
          const SizedBox(height: 8),
          Text('Try adjusting your filters or search term.', style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.4))),
        ],
      ),
    );
  }
}

class MarketplaceOnboardingSheet extends StatefulWidget {
  const MarketplaceOnboardingSheet({super.key});

  @override
  State<MarketplaceOnboardingSheet> createState() => _MarketplaceOnboardingSheetState();
}

class _MarketplaceOnboardingSheetState extends State<MarketplaceOnboardingSheet> {
  bool _hasAccepted = false;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: colorScheme.onSurface.withOpacity(0.1),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Marketplace Rules & Safety',
            style: GoogleFonts.outfit(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Please review our guidelines to ensure a safe community for everyone.',
            style: GoogleFonts.outfit(
              fontSize: 15,
              color: colorScheme.onSurface.withOpacity(0.6),
            ),
          ),
          const SizedBox(height: 24),
          Expanded(
            child: ListView(
              children: [
                _buildRule(
                  LucideIcons.checkCircle,
                  'Genuine Listings',
                  'Only post items you actually own and intend to sell. Misleading ads are strictly prohibited.',
                  colorScheme,
                ),
                _buildRule(
                  LucideIcons.shieldCheck,
                  'Verified Information',
                  'Ensure your contact details and item descriptions are accurate and honest.',
                  colorScheme,
                ),
                _buildRule(
                  LucideIcons.alertTriangle,
                  'Prohibited Items',
                  'Drugs, alcohol, weapons, and illegal substances are not allowed and will result in a permanent ban.',
                  colorScheme,
                ),
                _buildRule(
                  LucideIcons.messageSquare,
                  'Respectful Communication',
                  'Be polite and professional when communicating with other students.',
                  colorScheme,
                ),
                _buildRule(
                  LucideIcons.userCheck,
                  'Safety First',
                  'Always meet in public places and never send money before seeing the item.',
                  colorScheme,
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: colorScheme.onSurface.withOpacity(0.05),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: colorScheme.onSurface.withOpacity(0.1)),
            ),
            child: Row(
              children: [
                Checkbox(
                  value: _hasAccepted,
                  activeColor: colorScheme.primary,
                  onChanged: (val) => setState(() => _hasAccepted = val ?? false),
                ),
                Expanded(
                  child: Text(
                    'I have read and agree to the Marketplace Rules and Terms of Service.',
                    style: GoogleFonts.outfit(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: colorScheme.onSurface,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: _hasAccepted ? () => Navigator.pop(context, true) : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: colorScheme.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 0,
              ),
              child: Text(
                'Get Started',
                style: GoogleFonts.outfit(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRule(IconData icon, String title, String description, ColorScheme colorScheme) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: colorScheme.primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: colorScheme.primary, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: GoogleFonts.outfit(
                    fontSize: 13,
                    color: colorScheme.onSurface.withOpacity(0.6),
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
