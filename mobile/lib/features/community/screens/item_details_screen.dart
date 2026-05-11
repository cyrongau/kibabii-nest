import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../../core/utils/image_utils.dart';
import '../../../services/api_service.dart';
import '../../chat/screens/chat_screen.dart';
import '../../chat/screens/chat_list_screen.dart';

class MarketplaceItemDetailsScreen extends StatefulWidget {
  final String itemId;

  const MarketplaceItemDetailsScreen({super.key, required this.itemId});

  @override
  State<MarketplaceItemDetailsScreen> createState() => _MarketplaceItemDetailsScreenState();
}

class _MarketplaceItemDetailsScreenState extends State<MarketplaceItemDetailsScreen> {
  final ApiService _api = ApiService();
  bool _isLoading = true;
  dynamic _item;
  Map<String, dynamic>? _currentUser;
  int _currentImageIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final item = await _api.getMarketplaceItemDetails(widget.itemId);
      final profile = await _api.getMyProfile();
      setState(() {
        _item = item;
        _currentUser = profile;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  bool get _isOwner => _currentUser != null && _item != null && _item['sellerId'] == _currentUser!['id'];

  Future<void> _contactSeller() async {
    if (_item == null) return;
    final sellerId = _item['sellerId'];
    if (sellerId == null) return;

    setState(() => _isLoading = true);
    try {
      final conversation = await _api.getOrCreateConversation(
        sellerId, 
        category: 'INQUIRY',
        marketplaceItemId: widget.itemId,
      );
      if (conversation != null && mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ChatScreen(
              conversationId: conversation['id'],
              otherUserId: sellerId,
              otherUserName: _item['seller']?['name'] ?? 'Seller',
              otherUserAvatar: ImageUtils.formatUrl(_item['seller']?['avatar'] ?? ''),
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _viewInquiries() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ChatListScreen(
          marketplaceItemId: widget.itemId,
        ),
      ),
    );
  }

  void _showEditDialog() {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    final titleController = TextEditingController(text: _item['title']);
    final priceController = TextEditingController(text: _item['price'].toString());
    final phoneController = TextEditingController(text: _item['phone']);
    final descController = TextEditingController(text: _item['description']);
    String? category = _item['category'];
    List<dynamic> currentImages = List.from(_item['images'] ?? []);
    bool isSaving = false;

    final List<String> categories = ['Electronics', 'Books', 'Furniture', 'Kitchenware', 'Stationery', 'Other'];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          height: MediaQuery.of(context).size.height * 0.9,
          decoration: BoxDecoration(color: colorScheme.surface, borderRadius: const BorderRadius.vertical(top: Radius.circular(32))),
          padding: EdgeInsets.only(top: 24, left: 24, right: 24, bottom: MediaQuery.of(context).viewInsets.bottom + 24),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Edit Item', style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
                    IconButton(icon: Icon(LucideIcons.x, color: colorScheme.onSurface), onPressed: () => Navigator.pop(context)),
                  ],
                ),
                const SizedBox(height: 20),
                
                // Image Management
                Text('Images (Max 4)', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface.withOpacity(0.6), fontSize: 13)),
                const SizedBox(height: 12),
                SizedBox(
                  height: 100,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      ...currentImages.map((img) => Stack(
                        children: [
                          Container(
                            width: 100,
                            margin: const EdgeInsets.only(right: 8),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              image: DecorationImage(image: NetworkImage(ImageUtils.formatUrl(img)), fit: BoxFit.cover),
                            ),
                          ),
                          Positioned(
                            top: 4, right: 12,
                            child: GestureDetector(
                              onTap: () => setModalState(() => currentImages.remove(img)),
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                                child: const Icon(LucideIcons.trash2, size: 14, color: Colors.white),
                              ),
                            ),
                          ),
                        ],
                      )),
                      if (currentImages.length < 4)
                        GestureDetector(
                          onTap: () async {
                            final picker = ImagePicker();
                            final image = await picker.pickImage(source: ImageSource.gallery);
                            if (image != null) {
                              setModalState(() => isSaving = true);
                              final url = await _api.uploadImage(File(image.path), folder: 'marketplace');
                              setModalState(() {
                                if (url != null) currentImages.add(url);
                                isSaving = false;
                              });
                            }
                          },
                          child: Container(
                            width: 100,
                            decoration: BoxDecoration(
                              color: colorScheme.onSurface.withOpacity(0.05),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: colorScheme.onSurface.withOpacity(0.1), style: BorderStyle.solid),
                            ),
                            child: Icon(LucideIcons.plus, color: colorScheme.onSurface.withOpacity(0.3)),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                _buildFieldLabel('Item Title', colorScheme),
                TextField(controller: titleController, style: GoogleFonts.outfit(color: colorScheme.onSurface), decoration: _inputDecoration('e.g. Scientific Calculator', colorScheme)),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildFieldLabel('Price (Ksh)', colorScheme),
                          TextField(controller: priceController, keyboardType: TextInputType.number, style: GoogleFonts.outfit(color: colorScheme.onSurface), decoration: _inputDecoration('500', colorScheme)),
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
                            value: categories.contains(category) ? category : categories.first,
                            dropdownColor: colorScheme.surface,
                            style: GoogleFonts.outfit(color: colorScheme.onSurface, fontSize: 14),
                            items: categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
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
                TextField(controller: phoneController, keyboardType: TextInputType.phone, style: GoogleFonts.outfit(color: colorScheme.onSurface), decoration: _inputDecoration('07XXXXXXXX', colorScheme)),
                const SizedBox(height: 16),
                _buildFieldLabel('Description', colorScheme),
                TextField(controller: descController, maxLines: 3, style: GoogleFonts.outfit(color: colorScheme.onSurface), decoration: _inputDecoration('Details...', colorScheme)),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: isSaving ? null : () async {
                      setModalState(() => isSaving = true);
                      final success = await _api.updateMarketplaceItem(widget.itemId, {
                        'title': titleController.text,
                        'price': double.tryParse(priceController.text) ?? 0.0,
                        'phone': phoneController.text,
                        'description': descController.text,
                        'category': category,
                        'images': currentImages,
                      });
                      if (success != null) {
                        Navigator.pop(context);
                        _loadData();
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Item updated successfully!')));
                      }
                      setModalState(() => isSaving = false);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: colorScheme.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: isSaving 
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Text('Save Changes', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)),
                  ),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () async {
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (context) => AlertDialog(
                        backgroundColor: colorScheme.surface,
                        title: Text('Delete Item?', style: GoogleFonts.outfit(color: colorScheme.onSurface)),
                        content: Text('Are you sure you want to remove this listing permanently?', style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.7))),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(context, false), child: Text('Cancel', style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.5)))),
                          TextButton(onPressed: () => Navigator.pop(context, true), child: Text('Delete', style: GoogleFonts.outfit(color: Colors.red))),
                        ],
                      ),
                    );
                    if (confirm == true) {
                      final deleted = await _api.deleteMarketplaceItem(widget.itemId);
                      if (deleted) {
                        Navigator.pop(context); // close modal
                        Navigator.pop(context); // go back to grid
                      }
                    }
                  },
                  child: Center(child: Text('Delete Listing', style: GoogleFonts.outfit(color: Colors.red, fontWeight: FontWeight.bold))),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    if (_isLoading) return Scaffold(backgroundColor: colorScheme.background, body: Center(child: CircularProgressIndicator(color: colorScheme.primary)));
    if (_item == null) return Scaffold(backgroundColor: colorScheme.background, body: Center(child: Text('Item not found', style: GoogleFonts.outfit(color: colorScheme.onSurface))));

    final images = _item['images'] as List? ?? [];
    final isSold = _item['isSold'] ?? false;

    return Scaffold(
      backgroundColor: colorScheme.background,
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 400,
                pinned: true,
                backgroundColor: colorScheme.surface,
                leading: IconButton(
                  icon: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: colorScheme.surface.withOpacity(0.7), shape: BoxShape.circle),
                    child: Icon(LucideIcons.chevronLeft, color: colorScheme.onSurface),
                  ),
                  onPressed: () => Navigator.pop(context),
                ),
                flexibleSpace: FlexibleSpaceBar(
                  background: Stack(
                    children: [
                      if (images.isNotEmpty)
                        PageView.builder(
                          itemCount: images.length,
                          onPageChanged: (idx) => setState(() => _currentImageIndex = idx),
                          itemBuilder: (context, idx) => Image.network(ImageUtils.formatUrl(images[idx]), fit: BoxFit.cover),
                        )
                      else
                        Container(color: colorScheme.onSurface.withOpacity(0.05), child: Center(child: Icon(LucideIcons.image, size: 64, color: colorScheme.onSurface.withOpacity(0.1)))),
                      
                      if (_item['isSold'] ?? false)
                        Positioned(
                          top: 100, right: -30,
                          child: Transform.rotate(
                            angle: 0.5,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 8),
                              color: Colors.red,
                              child: Text(
                                'SOLD',
                                style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18, letterSpacing: 2),
                              ),
                            ),
                          ),
                        ),

                      if (images.length > 1)
                        Positioned(
                          bottom: 20, left: 0, right: 0,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: images.asMap().entries.map((entry) {
                              return Container(
                                width: 8, height: 8,
                                margin: const EdgeInsets.symmetric(horizontal: 4),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: _currentImageIndex == entry.key ? colorScheme.primary : Colors.white.withOpacity(0.5),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                    ],
                  ),
                ),
                actions: [
                  if (_isOwner)
                    IconButton(
                      icon: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: colorScheme.surface.withOpacity(0.7), shape: BoxShape.circle),
                        child: Icon(LucideIcons.edit3, color: colorScheme.primary),
                      ),
                      onPressed: _showEditDialog,
                    ),
                ],
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(color: colorScheme.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                            child: Text(_item['category'] ?? 'General', style: GoogleFonts.outfit(color: colorScheme.primary, fontWeight: FontWeight.bold, fontSize: 12)),
                          ),
                          Text(
                            'Ksh ${_item['price'].toString()}',
                            style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w900, color: colorScheme.primary),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text(_item['title'], style: GoogleFonts.outfit(fontSize: 26, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
                      const SizedBox(height: 24),
                      
                      // Seller Info
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: colorScheme.surface, 
                          borderRadius: BorderRadius.circular(20), 
                          border: Border.all(color: colorScheme.onSurface.withOpacity(0.05))
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 24,
                              backgroundImage: _item['seller']?['avatar'] != null ? NetworkImage(ImageUtils.formatUrl(_item['seller']['avatar'])) : null,
                              backgroundColor: colorScheme.onSurface.withOpacity(0.1),
                              child: _item['seller']?['avatar'] == null ? Icon(LucideIcons.user, color: colorScheme.onSurface.withOpacity(0.3)) : null,
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(_item['seller']?['name'] ?? 'Anonymous Seller', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: colorScheme.onSurface)),
                                  Text('Student Seller', style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.5), fontSize: 13)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      
                      const SizedBox(height: 32),
                      Text('Description', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
                      const SizedBox(height: 12),
                      Text(
                        _item['description'] ?? 'No description provided.',
                        style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.7), height: 1.6, fontSize: 15),
                      ),
                      
                      const SizedBox(height: 40),
                      _buildSafetyTipsSection(colorScheme),
                      const SizedBox(height: 120), // Space for bottom buttons
                    ],
                  ),
                ),
              ),
            ],
          ),
          
          // Bottom Actions
          Positioned(
            bottom: 0, left: 0, right: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
              decoration: BoxDecoration(
                color: colorScheme.surface,
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 20, offset: const Offset(0, -5))],
              ),
              child: SafeArea(
                top: false,
                child: Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _isOwner ? _viewInquiries : _contactSeller,
                        icon: const Icon(LucideIcons.messageCircle, color: Colors.white),
                        label: Text(_isOwner ? 'View Inquiries' : 'In-App Chat', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: colorScheme.primary,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          elevation: 0,
                        ),
                      ),
                    ),
                    if (_isOwner) ...[
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () async {
                            final confirm = await showDialog<bool>(
                              context: context,
                              builder: (context) => AlertDialog(
                                backgroundColor: colorScheme.surface,
                                title: Text(isSold ? 'Mark as Available?' : 'Mark as SOLD?', style: GoogleFonts.outfit(color: colorScheme.onSurface)),
                                content: Text(
                                  isSold 
                                    ? 'This will make the item visible again in the marketplace.' 
                                    : 'This will hide the item from the marketplace and prevent new inquiries.', 
                                  style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.7))
                                ),
                                actions: [
                                  TextButton(onPressed: () => Navigator.pop(context, false), child: Text('Cancel', style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.5)))),
                                  TextButton(
                                    onPressed: () => Navigator.pop(context, true), 
                                    child: Text(isSold ? 'Make Available' : 'Mark Sold', style: TextStyle(color: isSold ? colorScheme.primary : Colors.green, fontWeight: FontWeight.bold))
                                  ),
                                ],
                              ),
                            );
                            if (confirm == true) {
                              setState(() => _isLoading = true);
                              final success = await _api.markAsSold(widget.itemId);
                              if (success) {
                                _loadData();
                                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(isSold ? 'Item is now available!' : 'Item marked as SOLD!')));
                              } else {
                                setState(() => _isLoading = false);
                                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to update status.')));
                              }
                            }
                          },
                          icon: Icon(isSold ? LucideIcons.shoppingCart : LucideIcons.checkCircle, color: Colors.white),
                          label: Text(isSold ? 'MAKE AVAILABLE' : 'MARK SOLD', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: isSold ? colorScheme.primary : const Color(0xFF10B981),
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            elevation: 0,
                          ),
                        ),
                      ),
                    ],
                    if (!_isOwner) ...[
                      const SizedBox(width: 12),
                      Container(
                        decoration: BoxDecoration(
                          color: colorScheme.onSurface.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: IconButton(
                          onPressed: () async {
                            final rawPhone = _item['phone'] ?? _item['seller']?['phone'] ?? '0700000000';
                            final telUrl = Uri.parse("tel:$rawPhone");
                            if (await canLaunchUrl(telUrl)) {
                              await launchUrl(telUrl);
                            }
                          },
                          icon: Icon(LucideIcons.phone, color: colorScheme.onSurface),
                          padding: const EdgeInsets.all(16),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSafetyTipsSection(ColorScheme colorScheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(LucideIcons.shieldCheck, color: colorScheme.primary, size: 24),
            const SizedBox(width: 12),
            Text('Safety & Guidelines', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          'Follow these tips to ensure a secure transaction for both parties.',
          style: GoogleFonts.outfit(fontSize: 14, color: colorScheme.onSurface.withOpacity(0.5)),
        ),
        const SizedBox(height: 24),
        _buildTipsCategory(
          '🛡️ Buyer Safety Tips',
          [
            'Verify Seller Identity: Always check the seller’s profile, ratings, and reviews before engaging. A reputable seller should have a consistent history of successful transactions.',
            'Communicate Within the Platform: Use the marketplace’s messaging system instead of personal emails or phone numbers. This ensures your conversations are documented and the platform can assist in case of disputes.',
            'Inspect Before Payment: Arrange to meet in a safe, public place during daylight hours to inspect the item before making any payment. Never send money in advance.',
          ],
          colorScheme.primary,
          colorScheme,
        ),
        const SizedBox(height: 20),
        _buildTipsCategory(
          '🤝 Seller Safety Tips',
          [
            'Verify Buyer Identity: Avoid engaging with accounts that look suspicious or have no transaction history. If something feels off, it’s okay to decline the sale.',
            'Keep Communication on Platform: Stay within the marketplace’s messaging system. This protects your personal contact details and provides a record of the transaction.',
            'Meet in Safe Locations: Choose public meeting points such as campus common areas or well-lit security zones. Avoid isolated locations or meeting late at night.',
          ],
          const Color(0xFF10B981),
          colorScheme,
        ),
      ],
    );
  }

  Widget _buildTipsCategory(String title, List<String> tips, Color accentColor, ColorScheme colorScheme) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: accentColor.withOpacity(0.04),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: accentColor.withOpacity(0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 16, color: accentColor)),
          const SizedBox(height: 16),
          ...tips.map((tip) {
            final parts = tip.split(': ');
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    parts[0],
                    style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: colorScheme.onSurface),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    parts[1],
                    style: GoogleFonts.outfit(fontSize: 13, color: colorScheme.onSurface.withOpacity(0.6), height: 1.5),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildFieldLabel(String label, ColorScheme colorScheme) {
    return Padding(padding: const EdgeInsets.only(bottom: 8), child: Text(label, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface.withOpacity(0.6), fontSize: 13)));
  }

  InputDecoration _inputDecoration(String hint, ColorScheme colorScheme) {
    return InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.3)),
      filled: true,
      fillColor: colorScheme.onSurface.withOpacity(0.05),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: colorScheme.primary, width: 1)),
    );
  }
}
