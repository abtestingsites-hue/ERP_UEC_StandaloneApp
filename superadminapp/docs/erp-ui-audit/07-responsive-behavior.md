# ERP PHASE 01 — RESPONSIVE BEHAVIOR & VIEWPORT SPECIFICATION

**Project:** ElderCare Enterprise ERP (Universal Nature Care & Cure Foundation — UNCF)  
**Application:** `superadminapp`  
**Status Baseline:** VERIFIED from active CSS breakpoints and layout inspection

---

## 1. BREAKPOINT SCALE

The ERP application utilizes standard responsive viewport thresholds:

| Breakpoint Name | Threshold | Targeted Device Class |
|---|---|---|
| **Mobile** | `< 768px` | Smartphones (iPhone 14/15/16, Samsung Galaxy, Pixel) — `360px - 767px` |
| **Tablet** | `768px - 1023px` | Tablets portrait and smaller laptops (iPad Mini, iPad Air, Surface) |
| **Laptop / Desktop** | `1024px - 1439px` | Standard Enterprise Laptops (1366x768, 1440x900) |
| **Wide Desktop** | `>= 1440px` | High-Resolution Monitors & 4K Displays (1920x1080 and above) |

---

## 2. VIEWPORT-SPECIFIC LAYOUT BEHAVIOR

### 2.1 Desktop & Laptop Viewports (1440 × 900 & 1366 × 768)
- **Sidebar:** Permanently visible left vertical drawer, fixed at `258px`. Clicking collapse reduces width to `78px` with tooltip badges on hover.
- **Topbar:** Fixed at top, height `58px`, `margin-left: var(--sidebar-width)`. Full title, operating unit dropdown, attendance trigger, and user profile visible.
- **Main Content:** Padded at `28px 32px`. Fluid 2-column or 4-column metric card grids (`repeat(auto-fit, minmax(240px, 1fr))`).
- **Data Tables:** Dense horizontal tables with complete column visibility (e.g., SKU, Item, Category, Unit, Min Level, Reorder, Valuation, Status, Actions).
- **Tab Navigation Bar:** Single horizontal row with visible labels and icons.

### 2.2 Tablet Viewport (768 × 1024)
- **Sidebar:**
  - Auto-collapses to `78px` icon mode to preserve horizontal workspace real estate.
  - Can be expanded on demand via the topbar hamburger menu.
- **Topbar:**
  - Workspace title shortens to concise domain label.
  - Quick attendance button remains visible alongside unit selector.
- **Main Content:**
  - Padding reduces to `20px 20px`.
  - KPI metric cards reflow to a 2x2 grid.
  - Complex forms (e.g. New Admission 4-stage wizard) reflow from multi-column inputs to 2-column inputs.
- **Data Tables:**
  - Table containers utilize horizontal overflow scrolling (`overflow-x: auto; -webkit-overflow-scrolling: touch;`). Sticky action columns on right ensure edit/view buttons remain reachable.

### 2.3 Mobile Viewport (390 × 844 & below)
- **Sidebar:**
  - Completely hidden off-canvas (`transform: translateX(-100%); position: fixed; inset: 0 auto 0 0; width: 280px; z-index: 50`).
  - Opens as a slide-out drawer with a dark semi-transparent scrim (`.sidebar-scrim { background: rgba(0,0,0,0.5); }`).
  - Clicking any navigation item or clicking the scrim automatically closes the drawer.
- **Topbar:**
  - Height adjusted to `52px`.
  - Hamburger menu button is prominent on the left.
  - Right controls condense: Unit selector collapses to a compact pill; staff attendance and profile trigger accessible via avatar tap.
- **Workspace Navigation Tabs:**
  - Horizontal scroll snapping enabled (`overflow-x: auto; white-space: nowrap; scroll-padding: 12px; gap: 8px`).
  - Users swipe horizontally to access all 10 domain tabs without layout breakage.
- **Content Grids & Forms:**
  - All multi-column layouts collapse to single-column vertical stacks (`grid-template-columns: 1fr`).
  - Metric summary cards stack vertically.
  - Form action buttons expand to full width (`width: 100%`) for easy thumb tapping.
- **Modals & Drawers:**
  - Full-screen modal sheets (`width: 100%; height: 100%; border-radius: 0; padding: 16px; inset: 0`).

---

## 3. VIEWPORT VERIFICATION MATRIX

| Screen / Module | 1440 × 900 (Desktop) | 1366 × 768 (Laptop) | 768 × 1024 (Tablet) | 390 × 844 (Mobile) |
|---|---|---|---|---|
| **Staff Login (`/login`)** | Centered 440px card | Centered 440px card | Centered 440px card | Full-width padded card (100%) |
| **Command Center (`/dashboard`)** | 2-col (2fr + 1.2fr) | 2-col (2fr + 1.2fr) | Single-column stacked | Single-column stacked |
| **Inventory (`/inventory`)** | Full 10 tabs, 4-col KPIs | Full 10 tabs, 4-col KPIs | Horizontal swipe tabs, 2-col KPIs | Horizontal swipe tabs, 1-col KPIs |
| **Finance Billing (`/finance`)** | 2-col form + receipt | 2-col form + receipt | Stacks form over receipt | Stacks form over receipt |
| **Clinical Care (`/inhouse-care`)**| Full eMAR hourly grid | Full eMAR hourly grid | Horizontal scroll table | Shift card list view |
| **Visitor Security (`/visitor-security`)**| Full gate dashboard | Full gate dashboard | 2-column gate queue | Touch queue cards |
| **Central Reports (`/reports`)** | 2 Recharts per row | 2 Recharts per row | 1 Rechart per row | 1 Rechart per row |
| **Family Portal (`/portal`)** | Max 1200px container | Max 1200px container | Fluid 100% container | Fluid 100% container |
