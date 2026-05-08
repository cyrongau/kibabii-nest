import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:image_picker/image_picker.dart';
import 'package:go_router/go_router.dart';
import '../../../services/api_service.dart';

class AddPropertyScreen extends StatefulWidget {
  const AddPropertyScreen({super.key});

  @override
  State<AddPropertyScreen> createState() => _AddPropertyScreenState();
}

class _AddPropertyScreenState extends State<AddPropertyScreen> {
  final ApiService _apiService = ApiService();
  final ImagePicker _picker = ImagePicker();
  int _currentStep = 0;
  bool _isUploading = false;
  bool _isGenerating = false;
  bool _isPublishing = false;

  // Basic Info
  final _nameController = TextEditingController();
  final _addressController = TextEditingController();
  final _distanceController = TextEditingController();
  String _category = 'Hostel';

  // Units Info
  final List<Map<String, dynamic>> _units = [
    {'type': 'Single Room', 'price': '', 'capacity': '1', 'totalUnits': '1'}
  ];

  // Amenities
  final List<String> _selectedAmenities = [];
  final List<String> _availableAmenities = [
    'High-speed Wi-Fi', '24/7 Security', 'Laundry Room', 'Backup Generator',
    'Borehole Water', 'CCTV Cameras', 'Study Common Room', 'Gym',
    'Shared Kitchen', 'Hot Water', 'Trash Collection', 'Fenced'
  ];

  // Media
  final List<File> _images = [];
  File? _video;
  final List<String> _uploadedImageUrls = [];
  String? _uploadedVideoUrl;

  // Review
  String _aiDescription = '';

  Future<void> _pickMedia(bool isVideo, bool fromCamera) async {
    final XFile? pickedFile = isVideo 
        ? await _picker.pickVideo(source: fromCamera ? ImageSource.camera : ImageSource.gallery)
        : await _picker.pickImage(source: fromCamera ? ImageSource.camera : ImageSource.gallery);
        
    if (pickedFile != null) {
      setState(() {
        if (isVideo) {
          _video = File(pickedFile.path);
        } else {
          _images.add(File(pickedFile.path));
        }
      });
    }
  }

  Future<void> _pickMultiImage() async {
    final List<XFile> pickedFiles = await _picker.pickMultiImage();
    if (pickedFiles.isNotEmpty) {
      setState(() {
        _images.addAll(pickedFiles.map((x) => File(x.path)));
      });
    }
  }

  Future<void> _generateDescription() async {
    if (_nameController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a property name first')));
      return;
    }

    setState(() => _isGenerating = true);
    try {
      await Future.delayed(const Duration(seconds: 2));
      final unitTypes = _units.map((u) => u['type']).toSet().join(', ');
      setState(() {
        _aiDescription = "Experience premium student living at ${_nameController.text}. This modern complex offers $unitTypes conveniently located near Kibabii University. Featuring ${_selectedAmenities.join(', ')}, it offers the perfect balance of study and comfort. Secured 24/7 with a focus on student well-being.";
        _isGenerating = false;
        _currentStep = 4; // Move to review
      });
    } catch (e) {
      setState(() => _isGenerating = false);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to generate description')));
    }
  }

  Future<void> _publishProperty() async {
    setState(() => _isPublishing = true);
    try {
      for (var file in _images) {
        final url = await _apiService.uploadImage(file, folder: 'properties');
        if (url != null) _uploadedImageUrls.add(url);
      }

      if (_video != null) {
        _uploadedVideoUrl = await _apiService.uploadVideo(_video!);
      }

      final currentUserId = await _apiService.currentUserId;
      final payload = {
        'name': _nameController.text,
        'address': _addressController.text,
        'distanceToCampus': int.tryParse(_distanceController.text) ?? 0,
        'description': _aiDescription,
        'category': _category,
        'amenities': _selectedAmenities,
        'images': _uploadedImageUrls,
        'videoUrl': _uploadedVideoUrl,
        'landlordId': currentUserId,
        'units': _units.map((u) => {
          'type': u['type'],
          'price': double.tryParse(u['price'].toString()) ?? 0,
          'capacity': int.tryParse(u['capacity'].toString()) ?? 1,
          'totalUnits': int.tryParse(u['totalUnits'].toString()) ?? 1,
        }).toList(),
      };

      final result = await _apiService.createProperty(payload);
      if (result != null) {
        if (mounted) {
          context.go('/landlord-dashboard');
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Property published successfully!')));
        }
      }
    } catch (e) {
      debugPrint('Publish Error: $e');
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to publish property')));
    } finally {
      setState(() => _isPublishing = false);
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
        title: Text('List Your Property', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
      ),
      body: SafeArea(
        bottom: true,
        child: Theme(
          data: theme.copyWith(
            canvasColor: colorScheme.background,
            colorScheme: colorScheme.copyWith(
              primary: colorScheme.primary,
              secondary: colorScheme.secondary,
              onSurface: colorScheme.onSurface,
            ),
          ),
          child: Stepper(
            type: StepperType.vertical,
            currentStep: _currentStep,
            onStepContinue: () => setState(() => _currentStep < 4 ? _currentStep++ : null),
            onStepCancel: () => setState(() => _currentStep > 0 ? _currentStep-- : null),
            elevation: 0,
            controlsBuilder: (context, details) {
              return Padding(
                padding: const EdgeInsets.only(top: 32, bottom: 20),
                child: Row(
                  children: [
                    if (_currentStep < 4)
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _currentStep == 3 ? _generateDescription : details.onStepContinue,
                          child: _isGenerating 
                            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : Text(_currentStep == 3 ? 'Generate AI Description' : 'Continue', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
                        ),
                      ),
                    if (_currentStep == 4)
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _isPublishing ? null : _publishProperty,
                          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
                          child: _isPublishing
                            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : Text('Publish Property', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
                        ),
                      ),
                    if (_currentStep > 0) ...[
                      const SizedBox(width: 12),
                      TextButton(
                        onPressed: details.onStepCancel,
                        child: Text('Back', style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.5), fontWeight: FontWeight.bold)),
                      ),
                    ]
                  ],
                ),
              );
            },
            steps: [
              _buildStep(0, 'Basics', _buildBasicsStep(context, colorScheme), context),
              _buildStep(1, 'Units Configuration', _buildUnitsStep(context, colorScheme), context),
              _buildStep(2, 'Media Upload', _buildMediaStep(context, colorScheme), context),
              _buildStep(3, 'Amenities', _buildAmenitiesStep(context, colorScheme), context),
              _buildStep(4, 'Final Review', _buildReviewStep(context, colorScheme), context),
            ],
          ),
        ),
      ),
    );
  }

  Step _buildStep(int index, String title, Widget content, BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Step(
      isActive: _currentStep >= index,
      state: _currentStep > index ? StepState.complete : StepState.indexed,
      title: Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: colorScheme.onSurface)),
      content: content,
    );
  }

  Widget _buildBasicsStep(BuildContext context, ColorScheme colorScheme) {
    return Column(
      children: [
        _buildTextField('Property Name', _nameController, LucideIcons.building, context),
        const SizedBox(height: 16),
        _buildTextField('Full Address', _addressController, LucideIcons.mapPin, context),
        const SizedBox(height: 16),
        _buildTextField('Distance to Campus (m)', _distanceController, LucideIcons.navigation, context, keyboardType: TextInputType.number),
        const SizedBox(height: 16),
        DropdownButtonFormField<String>(
          value: _category,
          dropdownColor: colorScheme.surface,
          decoration: _inputDecoration('Category', LucideIcons.layers, context),
          style: GoogleFonts.outfit(color: colorScheme.onSurface),
          items: ['Hostel', 'Apartment', 'Bedsitter', 'Studio']
              .map((e) => DropdownMenuItem(value: e, child: Text(e, style: GoogleFonts.outfit(color: colorScheme.onSurface))))
              .toList(),
          onChanged: (val) => setState(() => _category = val!),
        ),
      ],
    );
  }

  Widget _buildUnitsStep(BuildContext context, ColorScheme colorScheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
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
                  value: unit['type'],
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
      ],
    );
  }

  Widget _buildMediaStep(BuildContext context, ColorScheme colorScheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Property Images', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            ..._images.asMap().entries.map((entry) {
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
                      onTap: () => setState(() => _images.removeAt(entry.key)),
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
            _buildMediaPickerButton(LucideIcons.image, 'Gallery', () => _pickMultiImage(), colorScheme),
            _buildMediaPickerButton(LucideIcons.camera, 'Camera', () => _pickMedia(false, true), colorScheme),
          ],
        ),
        const SizedBox(height: 24),
        Text('Property Tour Video', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onSurface)),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _buildMediaPickerButton(LucideIcons.video, 'Gallery', () => _pickMedia(true, false), colorScheme, fullWidth: true)),
            const SizedBox(width: 12),
            Expanded(child: _buildMediaPickerButton(LucideIcons.camera, 'Record', () => _pickMedia(true, true), colorScheme, fullWidth: true)),
          ],
        ),
        if (_video != null) 
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text('Selected: ${_video!.path.split('/').last}', style: GoogleFonts.outfit(fontSize: 12, color: colorScheme.secondary)),
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

  Widget _buildAmenitiesStep(BuildContext context, ColorScheme colorScheme) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: _availableAmenities.map((amenity) {
        final isSelected = _selectedAmenities.contains(amenity);
        return FilterChip(
          label: Text(amenity, style: GoogleFonts.outfit(fontSize: 12, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal, color: isSelected ? Colors.white : colorScheme.onSurface)),
          selected: isSelected,
          onSelected: (val) {
            setState(() {
              val ? _selectedAmenities.add(amenity) : _selectedAmenities.remove(amenity);
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

  Widget _buildReviewStep(BuildContext context, ColorScheme colorScheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: colorScheme.primary.withOpacity(0.05),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: colorScheme.primary.withOpacity(0.1)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(LucideIcons.sparkles, color: colorScheme.primary, size: 16),
                  const SizedBox(width: 8),
                  Text('AI GENERATED DESCRIPTION', style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: colorScheme.primary, letterSpacing: 1)),
                ],
              ),
              const SizedBox(height: 12),
              Text(_aiDescription, style: GoogleFonts.outfit(height: 1.6, color: colorScheme.onSurface)),
            ],
          ),
        ),
        const SizedBox(height: 24),
        _buildReviewSummary(colorScheme),
      ],
    );
  }

  Widget _buildReviewSummary(ColorScheme colorScheme) {
    return Column(
      children: [
        _buildReviewItem('Name', _nameController.text, colorScheme),
        _buildReviewItem('Units', '${_units.length} types defined', colorScheme),
        _buildReviewItem('Media', '${_images.length} photos, ${_video != null ? '1 video' : 'No video'}', colorScheme),
        _buildReviewItem('Amenities', '${_selectedAmenities.length} selected', colorScheme),
      ],
    );
  }

  Widget _buildReviewItem(String label, String value, ColorScheme colorScheme) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.outfit(color: colorScheme.onSurface.withOpacity(0.6), fontWeight: FontWeight.bold)),
          Text(value, style: GoogleFonts.outfit(color: colorScheme.onSurface, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, IconData icon, BuildContext context, {TextInputType keyboardType = TextInputType.text}) {
    final colorScheme = Theme.of(context).colorScheme;
    return TextFormField(
      controller: controller,
      decoration: _inputDecoration(label, icon, context),
      keyboardType: keyboardType,
      style: GoogleFonts.outfit(color: colorScheme.onSurface),
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
