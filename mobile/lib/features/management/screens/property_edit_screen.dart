import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:image_picker/image_picker.dart';
import 'package:go_router/go_router.dart';
import '../../../services/api_service.dart';

class PropertyEditScreen extends StatefulWidget {
  final String propertyId;
  const PropertyEditScreen({super.key, required this.propertyId});

  @override
  State<PropertyEditScreen> createState() => _PropertyEditScreenState();
}

class _PropertyEditScreenState extends State<PropertyEditScreen> {
  final ApiService _apiService = ApiService();
  final ImagePicker _picker = ImagePicker();
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = true;
  bool _isSaving = false;

  Map<String, dynamic>? _property;
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _distanceController = TextEditingController();
  final TextEditingController _descController = TextEditingController();
  String _category = 'Hostel';
  
  List<Map<String, dynamic>> _units = [];
  List<String> _amenities = [];
  final List<String> _availableAmenities = [
    'High-speed Wi-Fi', '24/7 Security', 'Laundry Room', 'Backup Generator',
    'Borehole Water', 'CCTV Cameras', 'Study Common Room', 'Gym',
    'Shared Kitchen', 'Hot Water', 'Trash Collection', 'Fenced'
  ];

  // Media
  List<dynamic> _existingImages = [];
  String? _existingVideoUrl;
  final List<File> _newImages = [];
  File? _newVideo;

  @override
  void initState() {
    super.initState();
    _loadProperty();
  }

  Future<void> _loadProperty() async {
    try {
      final prop = await _apiService.getPropertyById(widget.propertyId);
      if (prop != null && mounted) {
        setState(() {
          _property = prop;
          _nameController.text = prop['name'] ?? '';
          _addressController.text = prop['address'] ?? '';
          _distanceController.text = (prop['distanceToCampus'] ?? 0).toString();
          _descController.text = prop['description'] ?? '';
          _category = prop['category']?['name'] ?? 'Hostel';
          _amenities = List<String>.from(prop['amenities'] ?? []);
          _existingImages = List<dynamic>.from(prop['images'] ?? []);
          _existingVideoUrl = prop['videoUrl'];
          
          if (prop['units'] != null) {
            _units = (prop['units'] as List).map((u) => {
              'id': u['id'],
              'type': u['type']?['name'] ?? u['type'],
              'price': u['price'].toString(),
              'capacity': u['capacity'].toString(),
              'totalUnits': u['totalUnits'].toString(),
            }).toList();
          }
          
          if (_units.isEmpty) {
            _units.add({'type': 'Single Room', 'price': '', 'capacity': '1', 'totalUnits': '1'});
          }
          
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading property: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _pickNewMedia(bool isVideo, bool fromCamera) async {
    final XFile? pickedFile = isVideo 
        ? await _picker.pickVideo(source: fromCamera ? ImageSource.camera : ImageSource.gallery)
        : await _picker.pickImage(source: fromCamera ? ImageSource.camera : ImageSource.gallery);
        
    if (pickedFile != null) {
      setState(() {
        if (isVideo) {
          _newVideo = File(pickedFile.path);
        } else {
          _newImages.add(File(pickedFile.path));
        }
      });
    }
  }

  Future<void> _saveChanges() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    try {
      // 1. Upload New Images
      final List<String> allImages = List<String>.from(_existingImages);
      for (var file in _newImages) {
        final url = await _apiService.uploadImage(file, folder: 'properties');
        if (url != null) allImages.add(url);
      }

      // 2. Upload New Video if any
      String? finalVideoUrl = _existingVideoUrl;
      if (_newVideo != null) {
        finalVideoUrl = await _apiService.uploadVideo(_newVideo!);
      }

      final data = {
        'name': _nameController.text,
        'address': _addressController.text,
        'distanceToCampus': int.tryParse(_distanceController.text) ?? 0,
        'description': _descController.text,
        'category': _category,
        'amenities': _amenities,
        'images': allImages,
        'videoUrl': finalVideoUrl,
        'units': _units.map((u) => {
          'id': u['id'],
          'type': u['type'],
          'price': double.tryParse(u['price'].toString()) ?? 0,
          'capacity': int.tryParse(u['capacity'].toString()) ?? 1,
          'totalUnits': int.tryParse(u['totalUnits'].toString()) ?? 1,
        }).toList(),
      };

      await _apiService.updateProperty(widget.propertyId, data);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Property updated successfully!'), backgroundColor: Colors.green),
        );
        context.pop(true);
      }
    } catch (e) {
      debugPrint('Error saving property: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update: $e'), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      backgroundColor: colorScheme.background,
      appBar: AppBar(
        title: Text('Edit Property', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSectionTitle('Basic Information', colorScheme),
                    _buildTextField(_nameController, 'Property Name', LucideIcons.building, context),
                    _buildTextField(_addressController, 'Address / Location', LucideIcons.mapPin, context),
                    _buildTextField(_distanceController, 'Distance to Campus (m)', LucideIcons.navigation, context, keyboardType: TextInputType.number),
                    _buildTextField(_descController, 'Description', LucideIcons.fileText, context, maxLines: 4),
                    
                    const SizedBox(height: 32),
                    _buildSectionTitle('Media Management', colorScheme),
                    _buildMediaGrid(colorScheme),

                    const SizedBox(height: 32),
                    _buildSectionTitle('Units Configuration', colorScheme),
                    ..._buildUnitsList(context, colorScheme),

                    const SizedBox(height: 32),
                    _buildSectionTitle('Amenities', colorScheme),
                    _buildAmenitiesSelector(colorScheme),
                    
                    const SizedBox(height: 48),
                    SafeArea(
                      child: SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: ElevatedButton(
                          onPressed: _isSaving ? null : _saveChanges,
                          child: _isSaving 
                              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : Text('Save Changes', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildMediaGrid(ColorScheme colorScheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Images', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface, fontSize: 14)),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            ..._existingImages.asMap().entries.map((entry) {
              return Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(entry.value, width: 80, height: 80, fit: BoxFit.cover),
                  ),
                  Positioned(
                    right: 0,
                    top: 0,
                    child: GestureDetector(
                      onTap: () => setState(() => _existingImages.removeAt(entry.key)),
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                        child: const Icon(Icons.close, size: 12, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              );
            }),
            ..._newImages.asMap().entries.map((entry) {
              return Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.file(entry.value, width: 80, height: 80, fit: BoxFit.cover),
                  ),
                  Positioned(
                    right: 0,
                    top: 0,
                    child: GestureDetector(
                      onTap: () => setState(() => _newImages.removeAt(entry.key)),
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                        child: const Icon(Icons.close, size: 12, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              );
            }),
            _buildMediaPickerButton(LucideIcons.camera, 'Add', () => _pickNewMedia(false, true), colorScheme),
          ],
        ),
        const SizedBox(height: 20),
        Text('Video Tour', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface, fontSize: 14)),
        const SizedBox(height: 12),
        Row(
          children: [
            if (_existingVideoUrl != null || _newVideo != null)
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: colorScheme.secondary.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                  child: Row(
                    children: [
                      Icon(LucideIcons.video, color: colorScheme.secondary, size: 16),
                      const SizedBox(width: 8),
                      Expanded(child: Text(_newVideo != null ? 'New video selected' : 'Existing video linked', style: GoogleFonts.outfit(fontSize: 12, color: colorScheme.secondary))),
                      IconButton(
                        icon: const Icon(Icons.close, size: 16),
                        onPressed: () => setState(() {
                          _existingVideoUrl = null;
                          _newVideo = null;
                        }),
                      ),
                    ],
                  ),
                ),
              ),
            if (_existingVideoUrl == null && _newVideo == null)
              Expanded(child: _buildMediaPickerButton(LucideIcons.video, 'Upload Tour', () => _pickNewMedia(true, false), colorScheme, fullWidth: true)),
          ],
        ),
      ],
    );
  }

  Widget _buildMediaPickerButton(IconData icon, String label, VoidCallback onTap, ColorScheme colorScheme, {bool fullWidth = false}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: fullWidth ? null : 80,
        height: 80,
        decoration: BoxDecoration(
          color: colorScheme.primary.withOpacity(0.05),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: colorScheme.primary.withOpacity(0.2)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: colorScheme.primary),
            const SizedBox(height: 4),
            Text(label, style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold, color: colorScheme.primary)),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildUnitsList(BuildContext context, ColorScheme colorScheme) {
    return [
      ..._units.asMap().entries.map((entry) {
        int idx = entry.key;
        Map<String, dynamic> unit = entry.value;
        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: colorScheme.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: colorScheme.onSurface.withOpacity(0.1)),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Unit Type ${idx + 1}', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
                  if (_units.length > 1)
                    IconButton(
                      icon: const Icon(LucideIcons.trash2, color: Colors.red, size: 20),
                      onPressed: () => setState(() => _units.removeAt(idx)),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: ['Single Room', 'Shared Room', 'Bedsitter', 'Studio', 'Apartment'].contains(unit['type']) ? unit['type'] : 'Single Room',
                dropdownColor: colorScheme.surface,
                decoration: _inputDecoration('Type', LucideIcons.home, context),
                style: GoogleFonts.outfit(color: colorScheme.onSurface),
                items: ['Single Room', 'Shared Room', 'Bedsitter', 'Studio', 'Apartment']
                    .map((e) => DropdownMenuItem(value: e, child: Text(e, style: GoogleFonts.outfit(color: colorScheme.onSurface))))
                    .toList(),
                onChanged: (val) => setState(() => unit['type'] = val!),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: _buildUnitField('Price/Mo', unit, 'price', context)),
                  const SizedBox(width: 12),
                  Expanded(child: _buildUnitField('Occupants', unit, 'capacity', context)),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: _buildUnitField('Total Units', unit, 'totalUnits', context)),
                  const SizedBox(width: 12),
                  Expanded(child: _buildUnitField('Long-Stay Disc (%)', unit, 'upfrontDiscountPct', context)),
                ],
              ),
            ],
          ),
        );
      }),
      TextButton.icon(
        onPressed: () => setState(() => _units.add({'type': 'Single Room', 'price': '', 'capacity': '1', 'totalUnits': '1'})),
        icon: const Icon(LucideIcons.plusCircle, size: 18),
        label: Text('Add Another Unit Type', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.primary)),
      ),
    ];
  }

  Widget _buildAmenitiesSelector(ColorScheme colorScheme) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: _availableAmenities.map((a) {
        final isSelected = _amenities.contains(a);
        return FilterChip(
          label: Text(a, style: GoogleFonts.outfit(fontSize: 12, color: isSelected ? Colors.white : colorScheme.onSurface)),
          selected: isSelected,
          onSelected: (val) {
            setState(() {
              if (val) _amenities.add(a);
              else _amenities.remove(a);
            });
          },
          selectedColor: colorScheme.primary,
          checkmarkColor: Colors.white,
          backgroundColor: colorScheme.surface,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: colorScheme.onSurface.withOpacity(0.1))),
        );
      }).toList(),
    );
  }

  Widget _buildSectionTitle(String title, ColorScheme colorScheme) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Text(
        title,
        style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colorScheme.onBackground),
      ),
    );
  }

  Widget _buildTextField(TextEditingController controller, String label, IconData icon, BuildContext context, {int maxLines = 1, TextInputType keyboardType = TextInputType.text}) {
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextFormField(
        controller: controller,
        maxLines: maxLines,
        keyboardType: keyboardType,
        style: GoogleFonts.outfit(color: colorScheme.onSurface),
        decoration: _inputDecoration(label, icon, context),
        validator: (val) => val == null || val.isEmpty ? 'Field required' : null,
      ),
    );
  }

  Widget _buildUnitField(String label, Map<String, dynamic> unit, String key, BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return TextFormField(
      initialValue: unit[key].toString(),
      decoration: _inputDecoration(label, null, context),
      keyboardType: TextInputType.number,
      onChanged: (val) => unit[key] = val,
      style: GoogleFonts.outfit(fontSize: 14, color: colorScheme.onSurface),
    );
  }

  InputDecoration _inputDecoration(String label, IconData? icon, BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return InputDecoration(
      labelText: label,
      labelStyle: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.5)),
      prefixIcon: icon != null ? Icon(icon, size: 20, color: colorScheme.onSurface.withOpacity(0.3)) : null,
      filled: true,
      fillColor: colorScheme.surface,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: colorScheme.onSurface.withOpacity(0.1))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: colorScheme.onSurface.withOpacity(0.1))),
    );
  }
}
