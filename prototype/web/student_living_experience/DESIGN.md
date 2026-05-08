---
name: Student Living Experience
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#784b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#996100'
  on-tertiary-container: '#ffeedd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-margin: 20px
  gutter: 16px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

This design system is built to bridge the gap between institutional trust and youthful energy. The target audience is students and young professionals seeking a safe, vibrant, and effortless living arrangement. The brand personality is defined as "The Empowering Roommate"—helpful, organized, and optimistic.

The design style follows a **Modern Minimalism** approach with high-energy accents. It prioritizes clarity through heavy use of whitespace and high-quality typography while utilizing vibrant color pops to keep the interface from feeling clinical. The goal is to evoke a sense of "new beginnings" and "social connection," ensuring the user feels both secure in their financial transactions and excited about their future community.

## Colors

The color strategy uses "Trust Blue" as the anchor for navigation, security, and primary actions, ensuring the platform feels established and reliable. "Growth Green" is used specifically for success states, value-based calls to action (like "Book Now"), and amenity highlights, representing the personal growth associated with student life.

- **Primary (Electric Azure):** Used for core branding, active navigation states, and primary buttons.
- **Secondary (Spring Mint):** Used for highlighting benefits, available statuses, and financial growth indicators.
- **Surface Neutrals:** A range of cool grays starting from a crisp white base to provide a breathable, clean backdrop that makes photos of accommodations stand out.

## Typography

This design system utilizes **Plus Jakarta Sans** for its modern, friendly, and geometric proportions. The high x-height ensures excellent readability on mobile screens where students will be browsing listings on the go. 

Headlines are set with tight letter-spacing and heavy weights to create a bold, editorial feel that guides the eye quickly through sections. Body text is prioritized for legibility with generous line heights to prevent cognitive fatigue during long reading sessions of lease agreements or house rules.

## Layout & Spacing

The layout philosophy follows a **fluid grid system** built on an 8px base unit. On mobile, the system uses a 20px safe-area margin to ensure content doesn't feel cramped against device edges. 

Information is organized into "Stacked Modules." Each logical section of the app (e.g., Search Results, Featured Hostels, Amenities) is separated by a 48px vertical gap to provide a clear mental break. Within cards, a tighter 12px or 16px rhythm is used to keep related data points connected visually.

## Elevation & Depth

To maintain a clean and energetic feel, this design system avoids heavy shadows. Instead, it utilizes **Ambient Shadows** and **Tonal Layers** to create hierarchy:

1.  **The Canvas (Level 0):** The base background uses a very light gray (#F8FAFC) rather than pure white to reduce eye strain.
2.  **Primary Cards (Level 1):** White surfaces with an extra-diffused, 4% opacity shadow tinted with the primary blue. This makes the cards appear to "float" softly above the canvas.
3.  **Active Elements (Level 2):** Interaction states (like a selected hostel card) use a slightly deeper shadow and a thin 1px border in the primary color to indicate focus.
4.  **Overlays:** Modals and bottom sheets use a backdrop blur (glassmorphism) of 12px to maintain context of the background listing while focusing on the action at hand.

## Shapes

The shape language is purposefully **Rounded** to evoke a sense of friendliness and safety. 

- **Standard Elements:** Buttons and input fields use a 0.5rem (8px) radius.
- **Large Containers:** Accommodation cards and image carousels use a 1rem (16px) radius to soften the overall appearance of the grid.
- **Selection Indicators:** Small badges and chips use a "full-pill" radius to distinguish them from interactive buttons.

## Components

### Buttons
Primary buttons are high-contrast Electric Azure with bold white text. Use a slight scale-down transform (0.98) on tap to provide tactile feedback. Secondary buttons should use a ghost style (border only) to maintain hierarchy.

### Cards
Cards are the primary vehicle for hostel discovery. They must include:
- A large-format image with a 16px corner radius.
- A "Growth Green" price tag overlay.
- A "Trust Blue" verification badge for verified hostels.
- Essential metadata (distance to campus, Wi-Fi speed) using friendly, rounded iconography.

### Chips & Badges
Use chips for filtering (e.g., "AC", "Gym", "Private Room"). Active chips should have a light blue background with dark blue text, while inactive chips remain neutral gray.

### Navigation
A persistent bottom navigation bar with clear icon labels. Use "Friendly Iconography"—thicker stroke weights (2px) and rounded endpoints—to match the typography.

### Input Fields
Forms should feel inviting. Use larger-than-standard tap targets (min 48px height) with labels that float or remain visible above the field to ensure students don't lose context while filling out long application forms.