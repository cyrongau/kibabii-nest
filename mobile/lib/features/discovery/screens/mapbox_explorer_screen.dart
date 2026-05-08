import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart' as mbx;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_mapbox_navigation/flutter_mapbox_navigation.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../../services/api_service.dart';
import '../widgets/hostel_card.dart';

class MapboxExplorerScreen extends StatefulWidget {
  final double? targetLat;
  final double? targetLng;

  const MapboxExplorerScreen({
    super.key,
    this.targetLat,
    this.targetLng,
  });

  @override
  State<MapboxExplorerScreen> createState() => _MapboxExplorerScreenState();
}

class _MapboxExplorerScreenState extends State<MapboxExplorerScreen> implements mbx.OnPointAnnotationClickListener, mbx.OnCircleAnnotationClickListener {
  mbx.MapboxMap? _mapboxMap;
  mbx.PointAnnotationManager? _annotationManager;
  mbx.CircleAnnotationManager? _circleManager;
  final ApiService _api = ApiService();
  List<dynamic> _properties = [];
  final Map<String, Map<String, dynamic>> _annotationIdToProperty = {};
  bool _isMapReady = false;
  bool _hasPermission = false;
  bool _isLoading = true;
  String? _errorMessage;
  dynamic _selectedProperty;

  @override
  void initState() {
    super.initState();
    _requestPermissions();
    _loadProperties();
  }

  Future<void> _requestPermissions() async {
    try {
      final status = await Permission.location.request();
      if (status.isGranted) {
        setState(() {
          _hasPermission = true;
          _isLoading = false;
        });
      } else if (status.isPermanentlyDenied) {
        setState(() {
          _errorMessage = "Location permission is permanently denied. Please enable it in settings.";
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = "Location permission is required to show your position on the map.";
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = "Error requesting permissions: $e";
        _isLoading = false;
      });
    }
  }

  @override
  void onPointAnnotationClick(mbx.PointAnnotation annotation) {
    debugPrint("MapboxExplorerScreen: Point clicked: ${annotation.id}");
    final prop = _annotationIdToProperty[annotation.id];
    if (prop != null) {
      _selectProperty(prop);
    }
  }

  @override
  void onCircleAnnotationClick(mbx.CircleAnnotation annotation) {
    debugPrint("MapboxExplorerScreen: Circle clicked: ${annotation.id}");
    final prop = _annotationIdToProperty[annotation.id];
    if (prop != null) {
      _selectProperty(prop);
    }
  }

  void _selectProperty(Map<String, dynamic> prop) {
    setState(() {
      _selectedProperty = prop;
    });
    
    final lat = double.tryParse(prop['lat']?.toString() ?? '');
    final lng = double.tryParse(prop['lng']?.toString() ?? '');
    
    if (lat != null && lng != null) {
      _focusOnLocation(lat, lng);
    }
  }

  Future<void> _loadProperties() async {
    try {
      final props = await _api.getProperties();
      debugPrint("MapboxExplorerScreen: Loaded ${props.length} properties from API");
      if (mounted) {
        setState(() {
          _properties = props;
        });
        if (props.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("No properties found nearby. Check your backend/IP.")),
          );
        }
      }
    } catch (e) {
      debugPrint("Error loading properties: $e");
    }
  }

  void _onMapCreated(mbx.MapboxMap mapboxMap) async {
    debugPrint("MapboxExplorerScreen: Map created successfully");
    _mapboxMap = mapboxMap;
    _isMapReady = true;
    _annotationManager = await mapboxMap.annotations.createPointAnnotationManager();
    _circleManager = await mapboxMap.annotations.createCircleAnnotationManager();
    _addPropertyMarkers();
    
    if (widget.targetLat != null && widget.targetLng != null) {
      _focusOnLocation(widget.targetLat!, widget.targetLng!);
    } else {
      _focusOnLocation(0.6231, 34.5028); // Default Kibabii University Gate
    }
  }

  void _focusOnLocation(double lat, double lng) {
    _mapboxMap?.setCamera(mbx.CameraOptions(
      center: mbx.Point(coordinates: mbx.Position(lng, lat)).toJson(),
      zoom: 16.0,
      pitch: 45,
    ));
  }

  void _addPropertyMarkers() async {
    debugPrint("MapboxExplorerScreen: Adding markers for ${_properties.length} properties");
    if (_annotationManager == null || _circleManager == null || _properties.isEmpty) {
      debugPrint("MapboxExplorerScreen: Early exit - manager: ${_annotationManager == null}, props empty: ${_properties.isEmpty}");
      return;
    }
    
    await _annotationManager!.deleteAll();
    await _circleManager!.deleteAll();
    _annotationIdToProperty.clear();

    final List<mbx.PointAnnotationOptions> pointOptions = [];
    final List<mbx.CircleAnnotationOptions> circleOptions = [];
    final List<Map<String, dynamic>> validProps = [];

    for (var prop in _properties) {
      final lat = double.tryParse(prop['lat']?.toString() ?? '');
      final lng = double.tryParse(prop['lng']?.toString() ?? '');
      
      if (lat != null && lng != null) {
        validProps.add(prop);
        final pos = mbx.Position(lng, lat);

        pointOptions.add(
          mbx.PointAnnotationOptions(
            geometry: mbx.Point(coordinates: pos).toJson(),
            textField: "${prop['name']}\nKsh ${prop['price']}",
            textColor: Colors.white.value,
            textHaloColor: Colors.blue.value,
            textHaloWidth: 2.0,
            textSize: 11.0,
            textOffset: [0, -2.5],
            symbolSortKey: 10.0,
          ),
        );

        circleOptions.add(
          mbx.CircleAnnotationOptions(
            geometry: mbx.Point(coordinates: pos).toJson(),
            circleColor: Colors.blue.value,
            circleRadius: 8.0,
            circleStrokeWidth: 2.0,
            circleStrokeColor: Colors.white.value,
          ),
        );
      }
    }

    if (pointOptions.isNotEmpty) {
      final points = await _annotationManager!.createMulti(pointOptions);
      final circles = await _circleManager!.createMulti(circleOptions);
      
      // Map annotation IDs to properties
      for (int i = 0; i < validProps.length; i++) {
        if (i < points.length && points[i] != null) {
          _annotationIdToProperty[points[i]!.id] = validProps[i];
        }
        if (i < circles.length && circles[i] != null) {
          _annotationIdToProperty[circles[i]!.id] = validProps[i];
        }
      }
      
      _annotationManager!.addOnPointAnnotationClickListener(this);
      _circleManager!.addOnCircleAnnotationClickListener(this);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // Fix status bar rendering issue (the 'dark line')
    SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
    ));

    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_errorMessage != null) {
      return Scaffold(
        appBar: AppBar(title: const Text("Map Explorer")),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.location_off, size: 64, color: Colors.grey),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Text(_errorMessage!, textAlign: TextAlign.center),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _requestPermissions,
                child: const Text("Grant Permission / Retry"),
              ),
            ],
          ),
        ),
      );
    }



    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(
            child: mbx.MapWidget(
              key: const ValueKey("mapbox_map"),
              resourceOptions: mbx.ResourceOptions(
                accessToken: dotenv.get('MAPBOX_PUBLIC_TOKEN', fallback: ''),
              ),
              mapOptions: mbx.MapOptions(
                pixelRatio: MediaQuery.of(context).devicePixelRatio,
              ),
              cameraOptions: mbx.CameraOptions(
                center: mbx.Point(coordinates: mbx.Position(34.523580, 0.616923)).toJson(),
                zoom: 15.0,
              ),
              onMapCreated: _onMapCreated,
              styleUri: isDark 
                  ? "mapbox://styles/mapbox/dark-v11" 
                  : "mapbox://styles/mapbox/streets-v11",
            ),
          ),
          
          if (_selectedProperty != null)
            Positioned.fill(
              child: GestureDetector(
                onTap: () => setState(() => _selectedProperty = null),
                behavior: HitTestBehavior.translucent,
                child: Container(),
              ),
            ),
          
          Positioned(
            top: MediaQuery.of(context).padding.top + 16,
            left: 16,
            right: 16,
            child: _buildSearchBar(),
          ),

          if (_selectedProperty != null)
            _buildPropertySheet(),


          Positioned(
            top: MediaQuery.of(context).padding.top + 16,
            left: 16,
            child: CircleAvatar(
              backgroundColor: theme.cardColor,
              child: IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(left: 48), 
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        height: 50,
        decoration: BoxDecoration(
          color: theme.cardColor.withOpacity(0.95),
          borderRadius: BorderRadius.circular(25),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Row(
          children: [
            const Icon(LucideIcons.search, size: 20, color: Colors.blue),
            const SizedBox(width: 12),
            Expanded(
              child: TextField(
                decoration: InputDecoration(
                  hintText: 'Search Kibabii...',
                  hintStyle: GoogleFonts.outfit(fontSize: 14, color: Colors.grey),
                  border: InputBorder.none,
                ),
              ),
            ),
            Icon(LucideIcons.sliders, size: 18, color: theme.colorScheme.primary),
          ],
        ),
      ),
    );
  }

  Widget _buildPropertySheet() {
    return DraggableScrollableSheet(
      initialChildSize: 0.5,
      minChildSize: 0.2,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 20,
                offset: const Offset(0, -5),
              ),
            ],
          ),
          child: ListView(
            controller: scrollController,
            padding: const EdgeInsets.all(24),
            children: [
              Stack(
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      margin: const EdgeInsets.only(bottom: 24),
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  Positioned(
                    right: 0,
                    top: -10,
                    child: IconButton(
                      icon: const Icon(Icons.close_rounded, color: Colors.grey),
                      onPressed: () => setState(() => _selectedProperty = null),
                    ),
                  ),
                ],
              ),
              HostelCard(
                id: _selectedProperty['id'],
                name: _selectedProperty['name'],
                price: _selectedProperty['price'].toString(),
                distance: '${_selectedProperty['distanceToCampus'] ?? '0'}m from Gate',
                rating: _selectedProperty['avgRating']?.toString() ?? 'New',
                amenities: const ['Wifi', 'Security'],
                isVerified: _selectedProperty['verified'] ?? true,
                image: (_selectedProperty['images'] != null && _selectedProperty['images'].isNotEmpty)
                    ? _selectedProperty['images'][0]
                    : 'hostel_1.png',
                images: _selectedProperty['images'],
                latitude: double.tryParse(_selectedProperty['lat']?.toString() ?? ''),
                longitude: double.tryParse(_selectedProperty['lng']?.toString() ?? ''),
                units: _selectedProperty['units'],
                extraCharges: _selectedProperty['extraCharges'],
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _startNavigation,
                icon: const Icon(Icons.directions, color: Colors.white),
                label: Text(
                  'START NAVIGATION',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.bold, letterSpacing: 1.2),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(200, 60),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  elevation: 8,
                  shadowColor: Colors.blue.withOpacity(0.4),
                ),
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: () => setState(() => _selectedProperty = null),
                child: const Text('CLOSE'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(200, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _startNavigation() async {
    if (_selectedProperty == null) return;
    
    final lat = double.tryParse(_selectedProperty['lat']?.toString() ?? '');
    final lng = double.tryParse(_selectedProperty['lng']?.toString() ?? '');
    
    if (lat == null || lng == null) return;

    final wayPoint = WayPoint(
      name: _selectedProperty['name'],
      latitude: lat,
      longitude: lng,
    );

    List<WayPoint> wayPoints = [wayPoint];

    await MapBoxNavigation.instance.startNavigation(
      wayPoints: wayPoints,
      options: MapBoxOptions(
        mode: MapBoxNavigationMode.walking,
        simulateRoute: true,
        language: "en",
        units: VoiceUnits.metric,
      ),
    );
  }
}
