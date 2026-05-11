The use of flutter_mapbox_navigation will not be optimum for our use case and neither is the use of url_launcher intent for google maps. The first one makes the app to crash due to strict android requirements and unmaintained plugin and the second methos is bad for user retention and seamless experience to avoid leakeage of users to external third party applications.
The solution is to build our own "Custom Navigation Orchestration"
Custom Navigation Orchestration means I control everything and this makes for fewer mysterious crashes, easier maintenance, full customization.
Recommended Architecture For Kibabii Nest App

This is the architecture I strongly recommend.

Layer 1 — Maps Rendering

Use:

mapbox_maps_flutter

ONLY for:

displaying maps
markers
polylines
camera movement
map gestures

NOT navigation.

Layer 2 — Location Tracking

Use:

geolocator

for:

GPS updates
foreground tracking
permissions

This package is MUCH more stable.

Layer 3 — Route Generation

Use:

Mapbox Directions API

directly via HTTP requests.

Example:

https://api.mapbox.com/directions/v5/mapbox/driving/{lng},{lat};{lng},{lat}

You fetch:

route geometry
ETA
distance
maneuvers
steps

Then draw the route yourself.

Layer 4 — Navigation Engine

This is your orchestration layer.

You create:

trip session manager
navigation state manager
rerouting manager
progress tracker

Example:

Current Route
Current Step
Current Distance
Arrival Status
Off Route Detection

You manage it in Flutter.

Usually using:

Bloc
Riverpod
Provider
Layer 5 — Voice Navigation

Use:

flutter_tts

Instead of native Mapbox voice.

You convert maneuver instructions into speech.

Example:

tts.speak("Turn right in 200 meters");

This avoids MANY native crashes.

Layer 6 — Background Tracking

For production-grade tracking:

Use:

flutter_background_service

or:

workmanager

You fully control:

notifications
services
lifecycle
persistence

instead of hidden plugin logic.

Layer 7 — Off Route Detection

This is where orchestration becomes powerful.

You continuously compare:

User Current GPS
vs
Current Route Geometry

If distance exceeds threshold:

> 30 meters away from route

Automatically:

request new route
redraw polyline
update voice instruction
What This Looks Like In Practice
Step 1 — User Selects Property
Property Location
↓
Fetch Directions
↓
Render Route
Step 2 — User Starts Navigation
Start GPS stream
↓
Track movement
↓
Update route progress
↓
Read voice instructions
Step 3 — User Goes Off Route
Detect deviation
↓
Request reroute
↓
Update map
↓
Continue guidance
Why This Is Better
1. Much More Stable

You avoid:

plugin lifecycle bugs
service crashes
activity crashes
hidden native exceptions
2. Full UI Control

You can build:

property-themed navigation
branded UI
custom route cards
AI guidance
safety scoring
neighborhood overlays

without plugin limitations.

3. Better For Real Estate

Your app is NOT a dedicated navigation app.

You mainly need:

directions to property
route preview
smooth guidance

not enterprise trucking navigation.

So a lighter orchestrated architecture is ideal.

Example Stack I Recommend

For your project:

dependencies:
  mapbox_maps_flutter:
  geolocator:
  flutter_polyline_points:
  flutter_tts:
  dio:
  riverpod:
  flutter_background_service:
Suggested Project Structure
/lib
 ├── navigation
 │    ├── services
 │    │     ├── directions_service.dart
 │    │     ├── gps_service.dart
 │    │     ├── reroute_service.dart
 │    │
 │    ├── controllers
 │    │     ├── trip_controller.dart
 │    │
 │    ├── models
 │    │     ├── route_model.dart
 │    │     ├── maneuver_model.dart
 │    │
 │    ├── ui
 │    │     ├── navigation_screen.dart
 │    │
 │    └── voice
 │          ├── tts_service.dart
What You Avoid Completely

You avoid:

Mapbox trip service crashes
foreground service crashes
native notification crashes
plugin lifecycle crashes
Android 14 restrictions chaos

because YOU own the lifecycle.