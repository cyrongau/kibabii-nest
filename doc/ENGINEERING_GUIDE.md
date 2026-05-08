Kibabii Nest: Developer Handoff Guide

Project Overview

Kibabii Nest is a comprehensive student housing ecosystem designed to connect university students with safe, vetted, and affordable hostel accommodations. The platform serves three distinct user groups: Students, Landlords/Agents, and System Administrators.

1. Visual Identity & UI Style

The app follows a modern, "Clean Tech" aesthetic with a focus on trust, accessibility, and clarity.





Design System: {{DATA:DESIGN_SYSTEM:DESIGN_SYSTEM_1}}



Typography: Plus Jakarta Sans (Modern, friendly, highly readable).



Color Palette:





Primary: #2563EB (Action Blue) - Signals trust and authority.



Secondary: Vibrant Green - Used for "Verified" statuses and growth indicators.



Accents: Soft Blue/Slate backgrounds for tonal depth.



UI Patterns:





Cards: High use of shadowed cards to separate content blocks.



Navigation: Mobile-first bottom navigation for Students/Landlords; Sidebar-style density for Admin views.



Interactions: Micro-interactions on button presses (scale down) and smooth transitions between states.

2. Core Modules & Functionality

A. Student Module (Discovery & Booking)





Onboarding: Introduction to the value prop (Safety, Real-time maps).



Discovery Home: Feed-based discovery with "Near Campus" and "Affordable" quick filters.



Real-time Map: MapBox/Google Maps integration showing pinned properties with pricing overlays.



Hostel Details: Rich media galleries, amenity grids, proximity stats (e.g., "500m from Main Campus"), and neighborhood descriptions.



Booking Flow: A 2-step verification process (Review -> Confirm) with integrated payment breakdowns (Ksh).

B. Landlord/Agent Module (Property Management)





Dashboard: KPI tracking for earnings, occupancy (e.g., "8/10 units filled"), and pending student inquiries.



Listing Engine: Multi-step form for property registration (Basics -> Pricing/Amenities -> Photos -> Review).



Management Hub: CRUD operations for existing listings with "Active/Pending" status toggles.

C. Admin Module (Governance & Operations)





System Overview: Macro-level health metrics (Total Students vs. Landlords).



Verification Queue: Manual review workflow for new property submissions to maintain platform quality.



User Management: Centralized directory for handling account approvals, suspensions, and document verification.



Financial Insights: Tracking platform fees, premium listing revenue, and managing landlord payouts.

D. Authentication & Security





Auth Flow: Email/Password with Social Login (Google/Apple) integrations.



Security: Mandatory 2FA (6-digit code) for account changes and high-value transactions.

3. Suggested Further Adjustments & Features

Immediate Roadmap (V1.1)





In-App Chat: Real-time messaging between students and landlords to discuss house rules before booking.



Push Notifications: Alerts for booking approvals, payment reminders, and verification updates.



Roommate Matching: A module within the profile to help students find compatible peers to share "Shared Dorm" listings.

Long-term Vision (V2.0)





Virtual Tours: Integration of 360-degree photography or video walkthroughs for hostels.



Utility Bill Integration: A way for students to pay electricity/water bills directly through the app.



Campus Events Integration: Showing hostel proximity to student-specific events or shuttle routes.

4. Technical Implementation Notes





Responsive Strategy: While designed for Mobile, the Admin suite should be optimized for Tablet/Desktop density.



Currency: Standardized to Ksh (Kenyan Shilling) across all financial modules.



Map Logic: Requires geolocation services and distance calculation APIs (Haversine formula or similar) to provide accurate "Distance to Campus" data.

