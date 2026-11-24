---
name: TaskFlow
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#464555'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#4648d4'
  on-secondary: '#ffffff'
  secondary-container: '#6063ee'
  on-secondary-container: '#fffbff'
  tertiary: '#7e3000'
  on-tertiary: '#ffffff'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-xs:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The brand personality centers on focused clarity, quiet efficiency, and cognitive calm. The interface acts as an invisible canvas for productivity, reducing cognitive load rather than demanding attention. Built for knowledge workers, developers, and disciplined professionals who demand friction-free task execution.

The visual direction combines pristine **Minimalism** with subtle **Tactile Precision**. The UI relies on generous whitespace, deliberate micro-interactions, subtle surface differentiation, and precise contrast ratios. It avoids noisy decorative graphics, gradients, and saturated surfaces, prioritizing content hierarchy, crisp alignment, and immediate feedback.

## Colors

The palette leverages a high-purity neutral system paired with a precise indigo core:

- **Canvas & Surfaces:**
  - Base canvas: `#FFFFFF` (pure white for immediate clarity).
  - Subtle secondary surface: `#F8FAFC` (Slate 50) for sidebars, grouped task panels, and table header rows.
  - Tertiary interactive surface: `#F1F5F9` (Slate 100) for hover states, selected lists, and secondary chips.
- **Accents:**
  - Primary Indigo: `#4F46E5` (Indigo 600) reserved exclusively for active states, key completion triggers, and primary actions.
  - Secondary Indigo: `#6366F1` (Indigo 500) for hover states on primary components, focus rings, and active tags.
- **Borders & Dividers:**
  - Standard border: `#E2E8F0` (Slate 200) for delicate 1px containment.
  - Subtle divider: `#F1F5F9` (Slate 100) for lightweight list separators.
- **Typography & Content:**
  - Primary text: `#0F172A` (Slate 900) for maximum legibility without the harshness of pure black.
  - Secondary text: `#475569` (Slate 600) for dates, metadata, and labels.
  - Muted/Placeholder: `#94A3B8` (Slate 400) for hints, disabled states, and completed item text.
- **Semantic Feedback:**
  - Success / Complete: `#10B981` (Emerald 500)
  - Critical / Priority High: `#EF4444` (Red 500)
  - Warning / Priority Medium: `#F59E0B` (Amber 500)

## Typography

The type scale is standardized on **Inter** to ensure maximum legibility and neutral clarity across dense information views. 

- **Weights:** Restricted strictly to `400` (Regular), `500` (Medium), and `600` (Semi-bold).
- **Tracking:** Negative tracking applied to larger headlines (`-0.01em` to `-0.02em`) for crisp, editorial cohesion; slight positive tracking (`0.01em` to `0.04em`) applied to small badges, hotkey indicators, and metadata labels.
- **Completed Tasks:** Retain `body-md` sizing but shift to color `#94A3B8` with an inline strikethrough transition.

## Layout & Spacing

A flexible centered column layout designed for single-task focus:

- **Desktop (1024px+):** Collapsible navigation sidebar fixed at `260px`, primary task canvas constrained to a maximum content width of `768px` to preserve comfortable line lengths and scanability.
- **Tablet (768px - 1023px):** Collapsed icon rail (`64px`) or drawer navigation with a centered task canvas taking `gutter: 1.5rem` and `margin: 1.5rem`.
- **Mobile (< 768px):** Edge-to-edge layout with `margin-mobile: 1rem`, collapsible bottom navigation sheet, and stacked metadata.
- **Vertical Rhythm:** 4px baseline grid. List items maintain a fixed height of `48px` (relaxed) or `36px` (compact) with consistent internal padding of `space-sm` (`0.5rem`) vertical and `space-md` (`1rem`) horizontal.

## Elevation & Depth

Visual hierarchy uses delicate low-contrast outlines coupled with diffused, ambient shadows to maintain a featherlight, distraction-free environment:

- **Level 0 (Flat / Canvas):** Pure background `#FFFFFF` or `#F8FAFC`. Zero elevation, demarcated strictly by delicate `#E2E8F0` borders where structural separation is required.
- **Level 1 (Cards, Popovers, Dropdowns):** Subtle ambient tint. `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)`. Enclosed with a 1px solid `#E2E8F0` stroke.
- **Level 2 (Modals, Overlays, Floating Task Bar):** Pronounced softness without aggressive black contrast. `box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`. Border remains 1px solid `#E2E8F0`.
- **Focus / Active Glow:** For keyboard navigation, a sharp dual-ring focus state: `0 0 0 2px #FFFFFF, 0 0 0 4px #6366F1`.

## Shapes

The design system implements a soft, friendly, and approachable geometric scale:

- **Standard Elements (Buttons, Inputs, List Items):** `0.5rem` (8px, `rounded-md` / base roundedness).
- **Cards, Panels, Floating Drawers:** `0.75rem` to `1rem` (12px to 16px, `rounded-xl`).
- **Modal Dialogs & Command Menus:** `1rem` (16px, `rounded-xl`).
- **Pills & Status Indicators:** `9999px` (fully rounded capsules) for tag badges, due date counters, and keyboard shortcut indicators.

## Components

### Buttons
- **Primary:** Background `#4F46E5`, text `#FFFFFF`, radius `rounded-lg` (8px). Hover: `#4338CA`. Active: scale `0.98`. Height: `36px` (sm) or `40px` (md).
- **Secondary:** Background `#F1F5F9`, text `#0F172A`, border `1px solid transparent`. Hover: `#E2E8F0`.
- **Ghost:** Transparent background, text `#475569`. Hover: `#F8FAFC`, text `#0F172A`.

### Task Checkboxes
- Custom circular or soft-square (4px radius) toggle: `18px × 18px`.
- Unchecked: `1.5px solid #CBD5E1`, background `transparent`. Hover: `#6366F1` border.
- Checked: Background `#4F46E5`, border `#4F46E5`, containing a crisp white micro-check icon. Accompanied by a smooth strike-through and 40% text opacity transition.

### Input Fields & Quick Add
- Inset within task list or floating bottom bar.
- Default: Border `1px solid #E2E8F0`, surface `#FFFFFF`, text `#0F172A`, placeholder `#94A3B8`.
- Focus: Border `#4F46E5`, box-shadow `0 0 0 3px rgba(99, 102, 241, 0.15)`.
- Quick-add input uses an borderless style (`border: none; background: transparent`) inline within list structures, activating only on text entry.

### Task Cards & Rows
- Resting: Surface `#FFFFFF`, border-bottom `1px solid #F1F5F9`, horizontal padding `12px`, vertical padding `10px`.
- Hover: Surface `#F8FAFC`, revealing quick action icons (delete, reschedule, prioritize) at `#94A3B8`.
- Dragging: Elevated to Level 2 shadow, background `#FFFFFF`, border `1px solid #6366F1`.

### Chips & Badges
- Metadata chips (Tags, Dates, Projects): Height `22px`, radius `9999px`, font `label-xs`, padding `2px 8px`.
- Due Date (Normal): Surface `#F1F5F9`, text `#475569`.
- Due Date (Overdue): Surface `#FEE2E2`, text `#DC2626`.
- Priority Flags: Subtle dot indicator or colored badge (Red for High, Amber for Medium, Slate for Low).

### Command Palette (KBar / Quick Navigation)
- Centered modal dialog, surface `#FFFFFF`, Level 2 ambient shadow, border `1px solid #E2E8F0`.
- Search field with `headline-sm` font, seamless divider, keyboard shortcut keys wrapped in `#F1F5F9` rounded-md containers.