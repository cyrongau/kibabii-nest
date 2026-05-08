# Custom Regional Mapping: Google My Maps vs. Mapbox

This report evaluates the most appropriate tools for designing a highly customized and granular map of the **Kibabii region**. Based on your requirements for flexibility, customization, and granular control, this document outlines why Mapbox is the professional choice for this project.

## 1. Comparative Analysis

| Feature | Google My Maps | Mapbox (Recommended) |
| :--- | :--- | :--- |
| **Purpose** | Simple, no-code visual overlays for consumer use. | Developer platform for custom map engines. |
| **Flexibility** | **Very Low.** Limited to predefined icons and shapes. | **Extremely High.** Programmatic control over every pixel. |
| **Customization** | **Basic.** Limited to Google’s standard map styles. | **Total Control.** Design custom styles in **Mapbox Studio**. |
| **Accuracy** | High (Google's data), but hard to correct/add custom data. | High (OSM + Proprietary). Easy to add custom GeoJSON layers. |
| **Granular Control** | None. You cannot hide specific roads or change fonts. | Full control. You can hide features, change terrain, or add 3D. |
| **Integration** | Iframe embed only. No native SDK/API for apps. | Native SDKs for **Flutter**, Android, iOS, and **Next.js**. |

---

## 2. Why Mapbox for the Kibabii Region?

For a specialized project like mapping a specific region (Kibabii), Mapbox offers three critical advantages:

### A. Mapbox Studio (The Designer's Tool)
Mapbox Studio is essentially "Photoshop for Maps." You can:
- **Style every layer:** Change the color of specific buildings, hide irrelevant roads, and use custom typography (e.g., your brand fonts).
- **Custom Terrain:** Enable 3D terrain and building extrusions to give the Kibabii region a premium, volumetric feel.
- **Dynamic Data:** Import custom GeoJSON files (e.g., student hostels, local landmarks, university boundaries) and style them uniquely.

### B. Data-Driven Styling
Instead of static pins, you can style elements based on data. For example:
- Color-code hostels by price range.
- Pulse markers for "Recent Listings" using custom GL shaders.
- Show/hide layers based on the user's zoom level.

### C. Granular Control
Mapbox GL JS and the Mobile SDKs allow you to listen to every camera movement, click, and hover event. You can precisely control when and how labels appear, preventing the map from feeling cluttered.

---

## 3. Integration Guide

### A. Mobile (Flutter)
To integrate Mapbox into your Kibabii Nest mobile app, use the `mapbox_maps_flutter` package.

1. **Add Dependency:**
   ```yaml
   dependencies:
     mapbox_maps_flutter: ^2.0.0
   ```
2. **Setup:**
   - Create a Mapbox account and get an **Access Token**.
   - Configure your `AndroidManifest.xml` and `Info.plist` with the token.
3. **Implementation:**
   ```dart
   import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

   MapWidget(
     key: ValueKey("mapWidget"),
     resourceOptions: ResourceOptions(accessToken: YOUR_ACCESS_TOKEN),
     onMapCreated: (MapboxMap mapboxMap) {
       // Load your custom Kibabii Style from Mapbox Studio
       mapboxMap.loadStyleURI("mapbox://styles/your-username/kibabii-custom-style");
     },
   )
   ```

### B. Web (Next.js)
For the landlord/admin dashboard, use `react-map-gl` (a wrapper for Mapbox GL JS).

1. **Install:**
   ```bash
   npm install react-map-gl mapbox-gl
   ```
2. **Implementation:**
   ```tsx
   import Map from 'react-map-gl';
   import 'mapbox-gl/dist/mapbox-gl.css';

   const KibabiiMap = () => (
     <Map
       initialViewState={{
         longitude: 34.5583, // Kibabii Longitude
         latitude: 0.6219,   // Kibabii Latitude
         zoom: 14
       }}
       style={{width: '100%', height: 400}}
       mapStyle="mapbox://styles/your-username/kibabii-custom-style"
       mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
     />
   );
   ```

## 4. Final Recommendation
**Google My Maps** is unsuitable for a professional software project because it lacks an API and design flexibility. 

**Mapbox** is the definitive choice. It will allow you to build a "Digital Twin" of the Kibabii region that feels fast, looks premium, and provides the exact level of detail needed for property management and discovery.
