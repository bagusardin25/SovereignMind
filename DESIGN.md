---
name: Obsidian Kinetic
colors:
  surface: '#0f141b'
  surface-dim: '#0f141b'
  surface-bright: '#343941'
  surface-container-lowest: '#090f15'
  surface-container-low: '#171c23'
  surface-container: '#1b2027'
  surface-container-high: '#252a32'
  surface-container-highest: '#30353d'
  on-surface: '#dee2ec'
  on-surface-variant: '#cbc4d2'
  inverse-surface: '#dee2ec'
  inverse-on-surface: '#2c3138'
  outline: '#948e9c'
  outline-variant: '#494551'
  surface-tint: '#cfbcff'
  primary: '#cfbcff'
  on-primary: '#381e72'
  primary-container: '#6750a4'
  on-primary-container: '#e0d2ff'
  inverse-primary: '#6750a4'
  secondary: '#cdc0e9'
  on-secondary: '#342b4b'
  secondary-container: '#4d4465'
  on-secondary-container: '#bfb2da'
  tertiary: '#e7c365'
  on-tertiary: '#3e2e00'
  tertiary-container: '#c9a74d'
  on-tertiary-container: '#503d00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#cfbcff'
  on-primary-fixed: '#22005d'
  on-primary-fixed-variant: '#4f378a'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#cdc0e9'
  on-secondary-fixed: '#1f1635'
  on-secondary-fixed-variant: '#4b4263'
  tertiary-fixed: '#ffdf93'
  tertiary-fixed-dim: '#e7c365'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#594400'
  background: '#0f141b'
  on-background: '#dee2ec'
  surface-variant: '#30353d'
typography:
  display-2xl:
    fontFamily: Space Grotesk
    fontSize: 72px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.5'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  container-max: 1440px
---

## Brand & Style

The design system is an avant-garde framework designed for high-performance interfaces, blending technical precision with an aggressive, kinetic energy. It is tailored for L1 networks, Web3 disruptors, and elite AI governance platforms where speed and authority are paramount.

The aesthetic direction is **Techno-Brutalist Glassmorphism**. It combines the raw, structural integrity of brutalism—massive typography and heavy borders—with the sophisticated depth of glassmorphism. The interface should feel like a high-end command center: dark, immersive, and vibrating with latent power. Motion is not an afterthought; it is baked into the visual language through high-contrast accents and "glowing" interactive states that simulate data flow.

## Colors

This design system utilizes three distinct high-contrast palettes, each defined by a deep "Obsidian" surface and a hyper-saturated primary accent.

1.  **Electric Cyan (The L1 Feed):** Uses a cold, oceanic dark surface with a neon cyan primary. It evokes the feeling of high-speed fiber optics and liquid-cooled hardware.
2.  **Acid Green (The Rebel Web3):** A gritty, carbon-black surface paired with a caustic green. This is designed for high-impact, edgy interfaces that demand immediate attention.
3.  **Royal Violet (AI Governance):** A deep amethyst-tinted obsidian surface paired with violet and burnished gold. It suggests a more refined, regal, yet technologically superior presence.

In all themes, the Primary color is used for "Active" states and "Glow" effects. The Secondary color is reserved for structural elements like dividers and container strokes.

## Typography

The typography strategy is built on a hierarchy of "Technical Expression."

-   **Headlines:** Use **Space Grotesk** for its geometric, futuristic terminals. Display sizes should be set with tight tracking to create a sense of density and impact.
-   **Body:** Use **Geist** for its extreme legibility and developer-centric aesthetic. It provides a clean, neutral balance to the aggressive headlines.
-   **Data/UI Labels:** Use **JetBrains Mono** for all numerical data, status labels, and code snippets. The monospaced nature reinforces the "Kinetic" and systematic feel of the platform.

All headlines should be treated as architectural elements—don't be afraid of massive scale contrasts between display text and UI labels.

## Layout & Spacing

The design system employs a **Fixed-Grid System** for desktop and a **Fluid-Grid** for mobile. The layout is structured on a 12-column grid with generous 24px gutters to allow the bold typography room to breathe.

Margins are intentionally wide on desktop (64px) to create a "letterboxed" cinematic feel, focusing the user's attention on the central data stream. On mobile, the system collapses to a 4-column grid with 16px margins. Vertical rhythm should follow a strict 8px incremental scale, ensuring that even in "chaotic" artistic layouts, the underlying grid remains disciplined and technical.

## Elevation & Depth

Depth is achieved through **Tonal Layering** and **Luminescent Strokes** rather than traditional drop shadows.

-   **Base Layer:** The obsidian surface (Level 0).
-   **Container Layer:** Surfaces elevated by a 1px solid stroke (Secondary color at 20% opacity) and a slight backdrop blur (12px).
-   **Active State:** When an element is focused or active, it gains a "Primary Glow"—a soft, outer neon blur using the Primary color (8px blur, 30% opacity) and a 1px solid Primary color stroke.
-   **Overlay Layer:** Modals and menus use a higher backdrop blur (24px) and a darker background tint to create a sense of physical separation from the data grid below.

## Shapes

The shape language is **Soft (Level 1)**.

This system utilizes a consistent 0.25rem (4px) base corner radius. This choice maintains a sharp, technical edge reminiscent of precision-milled hardware while avoiding the extreme harshness of 0px corners. Large containers (cards) may use `rounded-lg` (8px) to soften the overall interface slightly, but interactive elements like buttons and input fields should remain strictly at the base 4px radius to preserve the "high-tech" silhouette.

## Components

### Buttons
Primary buttons are solid blocks of the theme's Primary color with black text (using Space Grotesk Bold). Secondary buttons are ghost-style with a 1px Primary stroke and Primary-colored text. All buttons use the base 4px radius.

### Input Fields
Inputs feature a dark, semi-transparent background with a subtle Secondary stroke. Upon focus, the stroke transitions to the Primary color and emits a faint outer glow. Labels are always monospaced and positioned above the field.

### Cards & Containers
Cards are defined by their 1px Secondary strokes and backdrop blurs. In the "Royal Violet" theme, cards may use the burnished gold accent for corner ornaments or top-border accents to signify "Elite" status.

### Chips & Status Indicators
Chips use monospaced text in all-caps. Status indicators use a "pulse" animation—a recurring Primary color glow—to signify live data or active network connectivity.

### Lists
Lists are high-density and separated by thin 1px lines using the Secondary color. Hovering over a list item should trigger a full-width background tint change (Primary color at 5% opacity).