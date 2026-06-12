Build a lightweight, offline-first Flutter geospatial field mapping application that acts as a spatial intelligence collection layer for an already existing production ecosystem called Kibabii Nest.

Context:
Kibabii Nest is an existing Flutter + NestJS property listing and tenant management platform focused on student accommodation and rental discovery around Kibabii University. The application already integrates Mapbox APIs and is in advanced pilot deployment stages.

This new application is NOT the primary consumer-facing platform. It is an internal geospatial intelligence and field mapping system intended to build a verified custom regional map layer that powers Kibabii Nest and future spatial products.

The system should be architected as a standalone spatial infrastructure layer that can later evolve into a broader geospatial intelligence platform.

Primary Objectives:

* Capture and verify local spatial intelligence not available on Google Maps
* Map hostels, rentals, roads, walking paths, landmarks, stages, businesses, and local infrastructure
* Generate custom GeoJSON and vector-ready map layers
* Feed structured geospatial data into Kibabii Nest
* Support future expansion into logistics, mobility, local discovery, delivery, and smart regional mapping

Technical Stack:
Frontend:

* Flutter (Android-first optimization)
* Offline-first architecture
* Native device integration

Backend:

* Existing NestJS ecosystem
* Create a dedicated geo-service/spatial-service module
* PostgreSQL + PostGIS for geospatial indexing and queries

Mapping Stack:

* Mapbox for rendering and layer visualization
* Google Maps APIs only where necessary for route assistance or imagery reference
* OpenStreetMap-compatible data structures where beneficial
* GeoJSON export support

Core Mobile Features:

1. GPS coordinate capture
2. Live road/path tracing
3. Offline-first storage
4. Deferred synchronization
5. Native camera integration
6. Photo compression
7. Place categorization
8. Spatial tagging
9. Local map rendering
10. Background sync engine
11. GeoJSON preview/export
12. Nearby distance calculations
13. Route distance estimation from Kibabii University Main Gate
14. Low-bandwidth optimization
15. Battery-efficient GPS tracking

Spatial Categories:

* Hostel
* Rental House
* Apartment
* Shop
* Stage
* Road
* Footpath
* Hospital
* School
* Church
* Security Post
* Water Point
* Landmark
* Parking
* Business
* Food Point

Road & Path Recording:
Users should be able to:

* start recording movement
* walk/drive paths
* generate polyline geometry
* save custom roads and footpaths
* assign road names and metadata

Offline-First Requirements:

* All actions save locally first
* Use Isar database
* Sync later when network becomes available
* Queue uploads and retry failures safely
* Operate effectively under low connectivity common in rural and semi-urban Kenya

Backend Responsibilities:
The geo-service should handle:

* spatial indexing
* nearby searches
* GeoJSON generation
* vector layer preparation
* geometry validation
* routing cache
* sync orchestration
* verification workflows
* geospatial analytics

Performance Goals:

* Fast startup
* Minimal battery usage
* Minimal API consumption
* Smooth operation on mid-range Android devices
* Stable background operation
* Efficient map rendering
* Optimized sync batching

Architectural Principles:

* Modular
* Scalable
* Offline-first
* Geospatially accurate
* API-efficient
* Future-proof
* Low operational cost
* Maintainable
* Service-oriented architecture

Important:
This project is intended to become a foundational geospatial infrastructure layer whose initial pilot region is Kibabii. The architecture should therefore avoid over-coupling to the Kibabii Nest business logic and instead expose reusable spatial services that other future products can consume.


Recommended Structure

Use a:

Monorepo Architecture

Example:

/generex-ecosystem
│
├── /kibabii-nest-mobile
│      Flutter consumer app
│
├── /gencom-spatial-engine
│      Flutter field mapping app
│
├── /backend
│    ├── /auth-service
│    ├── /property-service
│    ├── /geo-service
│    ├── /tenant-service
│
├── /shared
│    ├── /design-system
│    ├── /shared-models
│    ├── /geo-utils
│    ├── /api-clients
│
├── /docs
│
└── /infrastructure

What SHOULD Be Shared?

Shared logic.

NOT shared application runtime.

Shared Components

You SHOULD share:

/shared
Example Shared Modules
1. Design System
colors
typography
buttons
cards
theme
icons
2. Geo Utilities
distance calculations
coordinate helpers
geometry transformers
GeoJSON helpers
3. Shared API Client
authentication
API interceptors
network handling
tokens
4. Shared Models
Place
Property
Hostel
Road
User
Coordinates
Recommended Flutter Structure

Use:

Melos Monorepo

with Flutter.

Use:

Melos

This is widely used for:

multi-app Flutter ecosystems
shared packages
scalable architecture
Recommended Flutter Monorepo
/apps
   /kibabii_nest
   /geo_mapper

/packages
   /shared_ui
   /geo_core
   /api_core
   /auth_core

VERY scalable.

Backend Recommendation

Your backend SHOULD remain in same ecosystem.

Because:

both apps consume same identity system
same spatial data
same infrastructure

But:

Geo Logic Must Become Its Own Service
Recommended NestJS Structure
/backend
   /apps
      /api-gateway
      /auth-service
      /property-service
      /geo-service

This keeps:

clean service boundaries
future scalability
easier spatial expansion