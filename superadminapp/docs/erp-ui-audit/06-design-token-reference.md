# ERP PHASE 01 — DESIGN TOKEN REFERENCE

**Project:** ElderCare Enterprise ERP (Universal Nature Care & Cure Foundation — UNCF)  
**Application:** `superadminapp`  
**Design System:** UNCF Enterprise B2B Design System (White-First Minimalist Architecture)  
**Primary Source:** [src/index.css](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/index.css)  

---

## 1. COLOR TOKENS

### A. Core Surfaces & Neutral Canvas
- `--surface-primary`: `#FFFFFF` — Cards, modals, sidebars, topbars, and elevated containers.
- `--surface-secondary`: `#FAFCFA` — Table header backgrounds and alternating rows.
- `--surface-page`: `#F5F7F5` — Main application canvas background.
- `--surface-elevated`: `#FFFFFF` — Dropdown menus, tooltips, and elevated popovers.
- `--surface-card`: `#FFFFFF` — Standard KPI metric cards and module tiles.
- `--surface-muted`: `#EFF3EF` — Subtle input backgrounds and disabled containers.

### B. Principal Brand Palette (UNCF Green & Roots)
- `--brand-green`: `#039A01` — Company Principal Brand Accent (Primary CTA buttons, active route indicators, brand logo).
- `--brand-green-hover`: `#028001` — Accessible darker companion for button hover states.
- `--brand-green-active`: `#026601` — Pressed button state.
- `--brand-green-surface`: `#E7F4E8` — Pale green surface for active navigation pills and success badges.
- `--brand-green-subtle`: `#F0F8F1` — Ultra-light tint for table selection.
- `--brand-green-border`: `#C8E6CA` — Subtle green border for pill containers.
- `--brand-green-text`: `#026601` — High-contrast accessible text for green badges.

### C. Tree-Root Earthy Accents (UNCF Heritage)
- `--accent-root`: `#633B32` — Tree-Root Brown / Maroon accent used in brand kickers and trust insignia.
- `--accent-root-hover`: `#502E27` — Hover companion.
- `--accent-root-surface`: `#F3E8E3` — Pale earthy surface.
- `--accent-root-border`: `#E0CFC8` — Border for root accents.
- `--accent-root-text`: `#633B32` — Text color.

### D. Supporting Brand Highlights
- `--accent-yellow`: `#FDFE02` — Supporting restrained highlight accent.
- `--accent-yellow-surface`: `#FEFDE6` — Yellow highlight surface.
- `--accent-yellow-border`: `#F3EE7B` — Warning/highlight border.
- `--accent-yellow-text`: `#736902` — Text color.

### E. Typography & High-Contrast Neutral Text
- `--text-primary`: `#202020` — Black / Charcoal primary text (WCAG AAA compliant on white).
- `--text-secondary`: `#5F6962` — Secondary muted metadata, labels, and table subtext.
- `--text-tertiary`: `#849389` — Form field placeholders and disabled text.
- `--text-inverse`: `#FFFFFF` — White text for buttons and solid pills.

### F. Structural Dividers & Borders
- `--border-light`: `#E1E6E1` — Table row dividers and subtle card outlines.
- `--border-default`: `#E1E6E1` — Standard container and panel borders.
- `--border-subtle`: `#EDF1ED` — Sub-panel dividers.
- `--border-focus`: `#039A01` — Active input focus ring border.
- `--focus-ring`: `rgba(3, 154, 1, 0.18)` — Accessible glowing focus outline.

### G. Functional Status Tokens
- **Success**:
  - `--status-success-bg`: `#E7F4E8`
  - `--status-success-border`: `#C8E6CA`
  - `--status-success-text`: `#026601`
- **Warning**:
  - `--status-warning-bg`: `#FFF8E6`
  - `--status-warning-border`: `#FBE5AC`
  - `--status-warning-text`: `#8C5E05`
- **Error / Danger**:
  - `--status-error-bg`: `#FDF2F2`
  - `--status-error-border`: `#F8C8C8`
  - `--status-error-text`: `#B91C1C`
- **Info / Blue**:
  - `--status-info-bg`: `#F0F7FF`
  - `--status-info-border`: `#CBE2FE`
  - `--status-info-text`: `#1D4ED8`
- **Neutral / Draft**:
  - `--status-neutral-bg`: `#F1F4F2`
  - `--status-neutral-border`: `#DDE2DE`
  - `--status-neutral-text`: `#4A5650`

---

## 2. TYPOGRAPHY SYSTEM

### A. Font Families
- **Primary Body & UI**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.
- **Branding & Trust Insignia**: `'Cinzel', 'Times New Roman', Georgia, serif` (Used in brand lockup: "UNIVERSAL NATURE CARE & CURE FOUNDATION").
- **Headings & Display**: `'Inter'` with `-0.01em` letter spacing and bold/semibold weights.

### B. Typographic Hierarchy
| Role | Font Family | Size | Weight | Line Height | Letter Spacing | Color |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Page H1** | Inter | `26px` | 700 (Bold) | 1.25 | `-0.01em` | `#202020` |
| **Section H2** | Inter | `18px` | 600 (Semibold) | 1.3 | Normal | `#202020` |
| **Card H3** | Inter | `15px` | 600 (Semibold) | 1.35 | Normal | `#202020` |
| **Section Kicker** | Inter | `11px` | 700 (Bold) | 1.4 | `0.06em` | `#026601` (Uppercase) |
| **Primary Body** | Inter | `13px` | 400 (Regular) | 1.5 | Normal | `#202020` |
| **Secondary Metadata** | Inter | `11px` | 500 (Medium) | 1.4 | Normal | `#5F6962` |
| **Table Headings** | Inter | `11px` | 700 (Bold) | 1.2 | `0.04em` | `#5F6962` (Uppercase) |
| **Button Text** | Inter | `12px` | 600 (Semibold) | 1.0 | Normal | `#FFFFFF` or `#202020` |
| **Status Badge** | Inter | `10px` | 700 (Bold) | 1.0 | `0.03em` | Varies by status |

---

## 3. GEOMETRY, RADIUS & SHADOW SCALE

### A. Border Radii
- `--radius-xs`: `4px` — Small badges, checkbox corners.
- `--radius-sm`: `6px` — Standard buttons, inputs, navigation links.
- `--radius-md`: `8px` — KPI stat cards, panel containers.
- `--radius-lg`: `12px` — Main workspace cards, popover containers.
- `--radius-xl`: `16px` — Major modal windows and dialog boxes.
- `--radius-full`: `9999px` — Avatars, pill badges, and circular action icons.

### B. Elevation & Drop Shadows
- `--shadow-sm`: `0 1px 2px rgba(0, 0, 0, 0.04)` — Subtle input and button depth.
- `--shadow-card`: `0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)` — Standard card elevation.
- `--shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.03)` — Hovered cards.
- `--shadow-lg`: `0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -4px rgba(0, 0, 0, 0.04)` — Modals and drawers.
- `--shadow-dropdown`: `0 12px 28px -4px rgba(0, 0, 0, 0.10), 0 4px 10px -2px rgba(0, 0, 0, 0.04)` — User popovers and contextual dropdown menus.

### C. Layout Spacing Dimensions
- **Sidebar Width (Default)**: `258px`.
- **Sidebar Width (Collapsed)**: `78px`.
- **Topbar Height**: `64px`.
- **Content Max-Width**: `1600px`.
- **Content Padding (Desktop)**: `24px 28px 40px`.
- **Content Padding (Wide)**: `44px` inline.
- **Content Padding (Mobile)**: `20px` inline.
