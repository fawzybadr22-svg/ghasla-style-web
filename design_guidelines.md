# Ghasla Style Design Guidelines

## Design Approach

**Reference-Based Approach**: Drawing inspiration from Airbnb (booking flow, trust elements), Uber (service tracking, location-based), and regional e-commerce platforms (cultural appropriateness, RTL excellence). This is a service marketplace requiring strong visual trust signals and streamlined booking experience.

## Core Design Principles

1. **Cultural Authenticity**: Design that resonates with Kuwaiti market while maintaining international standards
2. **Trust & Professionalism**: Clean, polished aesthetic that conveys premium mobile service quality
3. **Booking Efficiency**: Clear visual hierarchy guiding users from discovery to booking completion
4. **Bilingual Excellence**: Seamless RTL/LTR experience without visual compromise

## Typography

**Arabic Text**: 
- Primary: Tajawal (Google Fonts) - modern, highly legible Arabic typeface
- Weights: Regular (400), Medium (500), Bold (700)

**English/French Text**:
- Primary: Inter (Google Fonts) - clean, professional sans-serif
- Weights: Regular (400), Medium (500), Semibold (600), Bold (700)

**Hierarchy**:
- Hero Headlines: 3xl to 5xl (Arabic slightly larger for visual balance)
- Section Headers: 2xl to 3xl
- Body Text: base to lg
- Small Print/Labels: sm to base

## Layout System

**Spacing Units**: Tailwind scale - 4, 6, 8, 12, 16, 20, 24 (py-4, px-6, gap-8, etc.)
- Section Padding: py-16 md:py-24 lg:py-32
- Component Spacing: gap-6 to gap-12
- Container Max-Width: max-w-7xl for content, max-w-4xl for forms

**Grid Strategy**:
- Hero: Single column, centered content with background image
- Services/Packages: 1 col mobile → 2 cols tablet → 3 cols desktop
- Testimonials: 1 col mobile → 2 cols tablet → 3 cols desktop  
- Admin Dashboard: Sidebar + main content layout

## Color Application

**Brand Colors** (specific values to be defined in theme):
- Primary Orange: Use for CTAs, active states, key highlights
- Primary Blue: Use for links, secondary actions, trust elements
- Dark Orange variant: Dark mode primary
- Light Blue variant: Backgrounds, subtle highlights

**Neutrals**:
- Light Mode: White backgrounds, gray-50/100 for sections, gray-700/900 for text
- Dark Mode: Gray-900 backgrounds, gray-800 for cards, gray-100/white for text

**Application Strategy**:
- CTAs: Orange gradient with blue accent on hover
- Navigation: Blue for active items, gray for inactive
- Status Indicators: Green (completed), yellow (pending), red (cancelled), blue (in-progress)
- Cards: White (light) / Gray-800 (dark) with subtle borders

## Component Library

### Navigation
- Sticky header with logo (left for LTR, right for RTL), centered nav links, language switcher + theme toggle + account menu (opposite side)
- Mobile: Hamburger menu with slide-out drawer
- Admin: Collapsible sidebar with icon + label navigation

### Hero Section
- Full-width background image showing car wash service in action
- Overlay gradient (dark at bottom for text contrast)
- Centered content: H1 headline, subtitle, dual CTAs (Book Now - orange, Learn More - blue outline)
- Height: 70vh to 80vh on desktop, 60vh on mobile

### Service Cards
- Clean card design with icon/image at top
- Service name, brief description (2-3 lines)
- Pricing table: Sedan / SUV columns
- "Select" button at bottom
- Hover: Subtle lift shadow, orange border accent

### Booking Flow
- Multi-step progress indicator at top (numbered circles with connecting lines)
- Each step: Prominent heading, clear instructions, visual inputs
- Step navigation: Back (gray), Continue (orange) buttons
- Summary sidebar showing selections (desktop only)

### Customer Dashboard
- Tab navigation for sections (Orders, Loyalty, Referrals, Profile)
- Order cards: Status badge, service details, action buttons
- Loyalty: Large point balance display, transaction history table
- Referrals: Copy-to-clipboard referral code box, stats grid

### Admin Dashboard
- Data tables: Striped rows, sortable headers, action dropdown per row
- Form layouts: Label above input, full-width on mobile, 2-column on desktop
- Analytics: Card-based metrics with icons, chart visualizations
- Filters: Collapsible sidebar on desktop, modal on mobile

### Forms
- Floating labels for text inputs
- Clear error states (red border, message below)
- Success states (green checkmark icon)
- Dropdown/Select: Custom styled with chevron icon
- Date/Time pickers: Native styled inputs with calendar icon

### Buttons
- Primary (Orange): py-3 px-6, rounded-lg, bold text, shadow
- Secondary (Blue outline): Same size, border-2, transparent bg
- Small (Utility): py-2 px-4, rounded-md
- Icon buttons: Rounded-full, p-3
- All buttons: Smooth hover/active states (brightness/scale)

### Modals & Overlays
- Centered modal with backdrop blur
- Header with title + close button
- Content area with scrollable body
- Footer with action buttons (right-aligned)

## RTL/LTR Handling

- Mirror all layouts automatically via `dir="rtl/ltr"` on root
- Icons: Use directional-aware icons (arrow-left becomes arrow-right in RTL)
- Padding/Margins: Use logical properties (start/end vs left/right)
- Text alignment: Natural alignment (right for Arabic, left for English)
- Forms: Labels and inputs maintain proper flow direction

## Images

**Hero Image**: High-quality photo of mobile car wash team servicing a luxury vehicle in Kuwait setting (recognizable architecture/landscape). Image should convey professionalism, modern equipment, and premium service quality.

**Services Section**: Icon-based rather than photos to maintain clean aesthetic and fast loading.

**Before/After Gallery**: Grid layout with side-by-side comparison sliders showing transformation. Real customer vehicles with visible results.

**Testimonials**: Optional customer photos (circular avatars) if available, otherwise use elegant quote icon.

**About Us**: Team photo showing uniformed staff with equipment/branded vehicle.

**Blog**: Featured image for each post (16:9 ratio), thumbnail grid for listings.

## Animations

**Minimal, Purposeful Motion**:
- Page transitions: Subtle fade-in (200ms)
- Card hovers: Slight lift + shadow (150ms ease-out)
- Button interactions: Scale 0.98 on press
- Mobile menu: Slide-in from side (250ms)
- Success states: Checkmark draw animation (300ms)
- NO scroll-triggered animations, parallax, or auto-playing elements

## WhatsApp Integration

- Floating action button: Fixed bottom-right (bottom-left for RTL)
- Green circular button with WhatsApp icon
- Shadow + pulse animation to draw attention
- Click opens wa.me link in new tab
- z-index above all content except modals

## Accessibility

- ARIA labels on all interactive elements
- Focus visible states with orange outline
- Sufficient color contrast (WCAG AA minimum)
- Keyboard navigation throughout
- Screen reader friendly (proper heading hierarchy, alt texts)