The Biggest API Cost Mistake

BAD architecture:

Every GPS update
    ↓
Call Directions API

This destroys:

API quotas
battery
performance

A moving user can generate:

1 location/sec
3600 calls/hour
per user

Impossible to scale affordably.

Correct Architecture

You should:

1 Route Fetch
+
Local GPS Tracking
+
Occasional Rerouting

This is how professional systems reduce costs.

Your Property App Is Easier Than Ride-Hailing

Your users:

occasionally navigate to a property
do not require centimeter precision
do not require real-time dispatch optimization

So you can aggressively optimize.

Recommended API Usage Strategy
1. Fetch Route ONLY Once

When user clicks:

Navigate to Property

Call:

Mapbox Directions API

ONLY ONCE.

Store:

geometry
maneuvers
ETA
distance

locally.

2. Do GPS Tracking Locally

After route fetch:

DO NOT call API repeatedly.

Use:

geolocator

to track:

current position
movement
heading

entirely on-device.

This costs ZERO API calls.

3. Use Polyline Matching Locally

Instead of asking server:
“Am I still on route?”

You compute locally.

Simple Off-Route Logic

Compare:

Current GPS Position
vs
Nearest Polyline Point

If distance:

< 30 meters

Assume user is still on route.

NO API CALL.

Only Reroute When Necessary

ONLY call Directions API if:

Distance from route > threshold

Example:

50m urban
100m highway

This reduces API usage MASSIVELY.

4. Reduce GPS Frequency

DO NOT track every second unless actively navigating.

Use adaptive tracking.

Recommended Tracking Intervals
Passive Browsing
LocationAccuracy.low

Update:

every 30–60 seconds
Active Navigation
LocationAccuracy.high

Update:

every 5–10 seconds

NOT every second.

5. Cache Routes Aggressively

Many users navigate to same properties repeatedly.

Cache route responses:

origin + destination

Use:

Hive
Isar
SQLite
Example

If:

20 users visit same apartment

You should NOT generate:

20 route requests

Instead:

Check cache first
Cache Duration

Good practical strategy:

Route Type	Cache Time
Urban	30 mins
Rural	6 hrs
Static property	24 hrs

Roads do not change every minute.

6. Use Route Simplification

Mapbox returns huge polyline geometry.

Simplify it locally.

This:

reduces memory
reduces CPU
improves rendering

Use:

flutter_polyline_points

or Douglas-Peucker simplification.

7. Background Tracking Should NOT Hit APIs

Critical rule.

Background service should ONLY:

collect GPS
store coordinates
sync periodically

NOT:

reroute continuously
fetch directions repeatedly
Smart Background Sync Strategy

Instead of:

Send location every second

Use:

Batch updates every 1–5 mins

This dramatically reduces:

API usage
battery
server load
8. Use Geofencing Instead Of Polling

Instead of constant checks:

Use geofences.

Example:

Property Radius = 200m

Trigger:

arrival detection
notifications

WITHOUT constant API calls.

9. Move Expensive Logic To Backend

Your NestJS backend should help.

Backend can:

cache directions
cache geocoding
deduplicate requests
compress responses

Your mobile app should NOT directly hammer Mapbox APIs.

Ideal Flow
Flutter App
    ↓
NestJS Backend
    ↓
Mapbox API

NOT:

Flutter
    ↓
Mapbox directly
Why Backend Proxying Helps

Your backend can:

A. Cache Results

Huge savings.

B. Rate Limit Abuse

Protects your API keys.

C. Compress Responses

Smaller mobile bandwidth.

D. Queue Requests

Avoid spikes.

E. Centralize Billing

Much easier monitoring.

10. Use Snap-To-Road Sparingly

Map matching APIs are expensive.

Do NOT call continuously.

Only use:

when navigation quality degrades
after GPS drift
after reroute
11. Use Offline Map Tiles

Map rendering itself can also become expensive.

Enable:

offline regions
tile caching

with Mapbox offline packs.

This massively reduces:

bandwidth
tile API requests

especially in Kenya where connectivity fluctuates.

12. Use Navigation Sessions

Do not keep navigation alive forever.

When:

app minimized
user stationary
destination reached

Terminate:

GPS high-frequency tracking
rerouting logic
voice engine
Recommended Realistic Architecture For You
Mobile Responsibilities

Flutter app handles:

GPS
Map Rendering
Polyline Tracking
Voice
Off-route Detection
UI
Backend Responsibilities

NestJS handles:

Route Cache
Directions Proxy
Geocoding Cache
Analytics
Rate Limiting
API Key Protection
Massive Cost Reduction Strategy

This alone can reduce API usage by:

80–95%

compared to naive implementations.

Example Efficient Navigation Lifecycle
User starts navigation
    ↓
1 API route request
    ↓
Local GPS tracking
    ↓
No API calls for 15 mins
    ↓
User deviates route
    ↓
1 reroute API call
    ↓
Continue locally

That is how scalable navigation systems are built.

Final Recommendation

For your property platform:

You do NOT need:

ultra-real-time navigation
sub-second rerouting
enterprise dispatch systems

Focus on:

stable navigation
low battery usage
low API consumption
smooth UX

That will scale much better commercially and technically.