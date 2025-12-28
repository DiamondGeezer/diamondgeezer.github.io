# Mixport Website SPEC

This SPEC is the source of truth for implementing the Mixport marketing site inside the local folder named `Website/`. Codex must follow this document exactly. If anything is unclear, choose the simplest implementation that matches the intent and do not invent new assets, gradients, icons, or pages beyond what is defined here.

## Goals

- Produce a polished, premium, modern marketing site for Mixport with tasteful scroll-driven motion.
- Use only the assets already present in `Website/assets/` and those referenced by `assets/brand/brand.json`.
- Deliver a fast, accessible, mobile-first site suitable for GitHub Pages hosting.
- Maintain a clean architecture that can expand later to add pages like pricing, support, and features.

## Non-Goals

- No backend.
- No user accounts.
- No complex 3D, WebGL, canvas particle systems, or heavy animation that risks jank on iPhone.
- No copying competitor images or copy. Competitor sites are used only as structural inspiration.

## Source of Truth Files

- `assets/brand/brand.json` defines all usable assets and which ones map to homepage sections.
- `assets/gradients/gradients.css` defines all gradient background utilities.
- No other images or gradients may be introduced unless the user adds them to the assets folders and updates `brand.json`.

## Repository Target

All output must be written into the existing GitHub Pages repo folder that corresponds to the domain and is currently hosted by GitHub Pages. The final structure inside the local `Website/` folder should be GitHub Pages compatible.

## Tech Stack

- Use plain HTML, CSS, and JavaScript.
- No framework required.
- Use modern browser APIs.
- Animations should be implemented using:
  - IntersectionObserver + CSS transitions for most section reveals.
  - Optional small parallax effect using requestAnimationFrame and scroll position.
- If an external animation library is used, it must be delivered via a pinned version and remain lightweight. Prefer no library unless absolutely necessary.

## Performance Requirements

- Lighthouse-oriented: prioritize fast first paint and smooth scrolling.
- Use `prefers-reduced-motion` to disable non-essential animation.
- Avoid scroll listeners that do heavy work on every tick. If parallax is used, throttle with requestAnimationFrame.
- Images must be lazy-loaded where appropriate (`loading="lazy"`).
- Avoid layout shift by reserving image aspect ratios.

## Accessibility Requirements

- Respect `prefers-reduced-motion`.
- Maintain readable contrast for all text on top of gradients.
- All interactive elements must be reachable via keyboard.
- Provide focus states.
- Use semantic HTML landmarks: header, main, section, footer.
- Use descriptive alt text for meaningful images. Decorative images should have empty alt.

## Brand and Asset Rules

### Allowed Assets Only
Codex must only use assets listed in `assets/brand/brand.json`. Do not reference any other file paths.

### Gradients
- Only the four PNG gradients are permitted:
  - `assets/gradients/gradient_0.png`
  - `assets/gradients/gradient_1.png`
  - `assets/gradients/gradient_2.png`
  - `assets/gradients/gradient_3.png`
- Gradient usage must be applied using `assets/gradients/gradients.css`.
- Do not create new CSS gradients with hard-coded color stops. The gradient PNGs are the gradients.

### Icons
- Use the transparent glyph (`icon_transparent.png`) as the site favicon and for subtle accents.
- Premium icons (`icon_1.png`, `icon_2.png`, `icon_3.png`) may be used as decorative brand anchors, but do not overwhelm the page.

### Mockups
- Use only the six App Store screenshots located in:
  - `assets/mockups/iPhone_en_1.PNG` through `iPhone_en_6.PNG`
- Treat mockups as product proof. Use them intentionally in specific sections.

## Site Pages

### Required Now
- Home page: `index.html`

### Optional Later (create stubs but do not fully build unless requested)
- `/how-it-works/`
- `/features/`
- `/supported-services/`
- `/pricing/`
- `/support/`
- `/download/`

If these are created now, they should be minimal: nav + hero + “coming soon” and the same footer. Do not fabricate deep content.

## Global Layout

### Navigation Header
- Sticky header with subtle blur or translucent background.
- Contains:
  - Mixport wordmark text (no image required)
  - Links: How it works, Features, Pricing, Support
  - Primary CTA button: Download
- On mobile:
  - Collapse into a hamburger menu with a slide-down panel.

### Typography
- Prefer system fonts for speed and polish.
- Use a clean hierarchy:
  - H1 hero
  - H2 section headings
  - Short paragraphs
- Keep line length comfortable and spacing generous.

### Background and Sections
- Base page background should be a dark neutral or near-black to let gradients pop.
- Alternate neutral sections with gradient-highlight sections for rhythm.

## Homepage Sections (Locked Order)

The home page must implement these sections in this exact order. Each section must have the purpose, content, and scroll behavior described.

### 1. Hero
Purpose: Immediate clarity and confidence

Content:
- Primary value proposition: Transfer playlists and keep them in sync across music services
- Supporting line: Move playlists albums and tracks once then let Mixport keep them aligned
- Primary CTA: Download on the App Store
- Secondary CTA: See how it works

Assets and styling:
- Use the gradient mapped to `hero` in `brand.json` via the gradient classes.
- Optionally use `icon_transparent.png` as a subtle background accent at low opacity.

Scroll behavior:
- Subtle background parallax is allowed but must be gentle and not cause jank.
- CTA buttons fade in on initial load.
- No heavy animation.

### 2. What You Can Transfer
Purpose: Scope reassurance

Content bullets:
- Playlists
- Albums
- Tracks
- Cross service support

Styling:
- Use neutral background.
- Use card grid layout.

Scroll behavior:
- Cards fade and rise into view as they enter viewport.
- Light hover micro-interaction on desktop only.
- No sticky behavior.

### 3. How It Works
Purpose: Remove friction and uncertainty

Content steps:
1. Connect your music services
2. Choose what to transfer or sync
3. Mixport handles the rest automatically

Assets:
- Use mockups from `brand.json` group `howItWorks`:
  - iphoneEn1, iphoneEn2, iphoneEn3
- Present them consistently, either in a simple device frame or a uniform rounded rectangle mask.

Scroll behavior:
- Scroll-triggered step reveal.
- Optional progress indicator is allowed if it remains subtle.
- Must remain clean and readable on mobile.

### 4. Automatic Playlist Sync (Key Differentiator)
Purpose: Clear differentiation from competitors

Content:
- Explain ongoing synchronization
- Changes on one service update everywhere
- No rebuilding playlists

Assets:
- Use the gradient mapped to `automaticSync`.
- Use mockups from `brand.json` group `automaticSync`:
  - iphoneEn4, iphoneEn5

Layout:
- Implement a sticky text column and a visual column.
- As the user scrolls within this section, the visual swaps between the two mockups.
- The swap should be a crossfade, not a hard cut.

Scroll behavior:
- This is the first wow moment.
- Keep motion smooth and premium, not flashy.

### 5. Monitor and Keep Playlists Aligned
Purpose: Power-user credibility

Content:
- Continuous monitoring
- Background updates
- Designed for evolving playlists

Assets:
- Use the gradient mapped to `monitoring`.
- Use mockup from `brand.json` group `monitoring`:
  - iphoneEn6

Layout:
- Continue the visual storytelling style from section 4, but slightly more technical in tone.
- Can be sticky or non-sticky. Prefer sticky if it remains smooth on mobile.

Scroll behavior:
- Scroll-driven storytelling.
- Visual continuity from previous section.

### 6. Supported Services
Purpose: Compatibility confirmation

Content:
- Spotify
- Apple Music
- YouTube Music
- Others as supported

Styling:
- Neutral background.
- Use a simple grid of service names or icons if available. Do not invent service logos unless user provides them.

Scroll behavior:
- Gentle fade-in only.
- No animation overload.

### 7. Pricing
Purpose: Monetization clarity

Content:
- Free tier overview
- Pro features
- Emphasis on sync and automation value

Layout:
- Two or three pricing cards, with Pro emphasized.
- Do not invent prices. Use placeholders like “Free” and “Pro” until user provides pricing.

Scroll behavior:
- Cards slide in subtly.
- Hover emphasis on Pro card.

### 8. Trust and Reliability
Purpose: Reduce hesitation

Content:
- Accuracy
- Safe connections
- Built for reliability

Styling:
- Calm, minimal.
- Use icons only if already provided. Otherwise use simple bullets.

Scroll behavior:
- Minimal animation or none.
- No motion distractions.

### 9. Final Call to Action
Purpose: Conversion

Content:
- Reinforce the core value
- Download Mixport
- Start transferring and syncing

Assets:
- Use the gradient mapped to `finalCTA`.
- Strong visual contrast.
- Clear primary CTA.

Scroll behavior:
- Minimal animation.
- Clear exit point.

### 10. Footer
Purpose: Utility and compliance

Content links:
- Support
- Privacy
- Terms
- Company info

Scroll behavior:
- Static

## Motion System (Rules)

Codex must obey these motion constraints:

- Use only these animation primitives:
  - Fade in with slight upward translate on section entry
  - Crossfade between mockups
  - Subtle parallax on one background element only
- Duration range: 300ms to 700ms for most transitions.
- Easing: use a smooth ease-out.
- All animations must disable under prefers-reduced-motion.

## Responsive Behavior

- Mobile-first layout.
- Sticky sections must degrade gracefully on small screens:
  - If sticky causes issues, switch to stacked layout with the visual above text and use simple reveal animations.
- Ensure tap targets are large and spaced.

## Implementation Notes

- Use a single shared stylesheet and a single shared JS file.
- Suggested structure:

  - `index.html`
  - `styles.css`
  - `main.js`
  - `assets/brand/brand.json`
  - `assets/gradients/gradients.css`
  - `assets/gradients/gradient_0.png` through `gradient_3.png`
  - `assets/icons/`
  - `assets/mockups/`

- `main.js` should:
  - Load `assets/brand/brand.json`
  - Apply the correct gradient classes to mapped sections
  - Wire IntersectionObserver for reveals
  - Wire the sticky mockup swap logic for sections 4 and 5
  - Respect prefers-reduced-motion

## Deliverables

A complete working home page that:

- Builds and runs as static files.
- Uses only assets in brand.json.
- Implements the locked homepage sections and their scroll behaviors.
- Feels premium through spacing, typography, gradients, and restrained motion.

End of SPEC.