# ERP PHASE 01 — PAGE-BY-PAGE LAYOUT SPECIFICATION

**Project:** ElderCare Enterprise ERP (Universal Nature Care & Cure Foundation — UNCF)  
**Application:** `superadminapp`  
**Layout Shell:** `SuperAdminLayout.tsx` & `PortalLayout.tsx`  
**Status Baseline:** VERIFIED from active source code

---

## 1. GLOBAL APPLICATION SHELL ARCHITECTURE

The ERP application shell (`SuperAdminLayout`) is composed of three persistent structural regions:
1. **Left Primary Navigation Sidebar** (`Sidebar.tsx`)
2. **Top Utility & Context Header** (`Topbar.tsx`)
3. **Scrollable Main Workspace Container** (`content-area` -> `content-inner`)

```
+----------------------------------------------------------------------------------------------------+
| SIDEBAR (Fixed: 258px / 78px) | TOPBAR (Fixed: 58px, border-b: #E1E6E1)                            |
| - UNCF Trust Branding         | - Context Eyebrow & Role display | Unit Selector | Profile | Signout|
| - Dashboard NavLink           +--------------------------------------------------------------------+
| - 10 Business Domains         | MAIN WORKSPACE CONTAINER (calc(100vh - 58px), overflow-y: auto)   |
| - Profile & Attendance        | - PageHeader (Eyebrow, H1 Title, Scope Badge, Domain Switcher)     |
| - Collapse Toggle             | - Tab Navigation Pills (inv-tabs-nav-bar)                          |
|                               | - Active Tab Content (Grids, Forms, Recharts, Data Tables)         |
+-------------------------------+--------------------------------------------------------------------+
```

### A. Sidebar Shell Metrics
- **Expanded Width:** `258px` (CSS variable `--sidebar-width: 258px`)
- **Collapsed Width:** `78px` (`.app-shell--collapsed { --sidebar-width: 78px; }`)
- **Z-Index:** `30` (Fixed positioning `inset: 0 auto 0 0`)
- **Background:** `var(--sidebar-bg)` (`#FFFFFF`)
- **Border-Right:** `1px solid var(--sidebar-border)` (`#E1E6E1`)
- **Brand Lockup:**
  - UNCF 28px logo in white rounded container (`border: 1px solid #e1e6e1; border-radius: 8px`).
  - Three-tier typography stack using serif font `Cinzel`:
    1. "UNIVERSAL" — `#039A01`, 15px, font-weight: 900, letter-spacing: 2px.
    2. "NATURE CARE & CURE FOUNDATION" — `#202020`, 7.8px, font-weight: 700.
    3. "(UNCF TRUST - SINCE 2015)" — `#633B32`, 7px, font-weight: 600.
- **Navigation Links (`sidebar-link`):**
  - Padding: `9px 12px`
  - Font size: `12px`, weight: `600`, color: `var(--text-primary)` (`#202020`)
  - Active state: background `var(--brand-green-surface)` (`#E7F4E8`), color `var(--brand-green-text)` (`#026601`), left indicator border `3px solid var(--brand-green)` (`#039A01`).
  - Lucide icons: `18px`, strokeWidth `1.8`.

### B. Topbar Shell Metrics
- **Height:** `58px`
- **Background:** `var(--topbar-bg)` (`#FFFFFF`)
- **Border-Bottom:** `1px solid var(--topbar-border)` (`#E1E6E1`)
- **Left Identity:**
  - Hamburger button (`19px` menu icon) for collapsing desktop sidebar or opening mobile drawer.
  - Workspace title eyebrow: uppercase, `10px`, weight: 700, color: `#5F6962`.
  - User and role sub-line: `12px`, weight: 600, color: `#202020`.
- **Right Context Controls:**
  1. `OperatingUnitSelector`: Dropdown selecting active operating facility (e.g., "Main Center", "Bangalore North", or "Organization Wide").
  2. Quick Attendance Button: `#E7F4E8` background, `#026601` text, `Clock` icon, opens `MyProfileModal`.
  3. User Avatar Pill: Circular container with user initials, opens `MyProfileModal`.
  4. Logout Button: `LogOut` icon (`17px`), clears sessions and redirects to `/login`.

### C. Main Content Container
- **Offset:** `margin-left: var(--sidebar-width)`
- **Background:** `var(--surface-page)` (`#F5F7F5`)
- **Padding:** `24px 28px` on desktop, `16px` on tablet/mobile.
- **Max Width:** Fluid with minimum viewport constraint of `360px`.

---

## 2. WORKSPACE PAGE LAYOUT ARCHITECTURE

All 10 core business domains share an identical, highly disciplined layout structure composed of:

### Phase 1: `PageHeader`
- **Eyebrow:** Displays hierarchy, e.g. `BUSINESS DOMAIN · INVENTORY`.
- **Title:** H1 typography, `24px`, weight: 800, color `#202020`.
- **Description:** `13px`, color `#5F6962`, max-width `720px`.
- **Action Slot:** Houses `DomainSwitcher` (for fast jumping across domains) and `inv-scope-badge` displaying the currently targeted facility unit.

### Phase 2: Navigation Tab Bar (`inv-tabs-nav-bar`)
- **Container:** Full-width horizontal pill navigation bar (`display: flex; gap: 6px; overflow-x: auto; padding-bottom: 6px`).
- **Tab Buttons (`inv-tab-btn`):**
  - Height: `36px`, padding `0 14px`, border-radius: `6px`.
  - Font size: `12px`, font-weight: `600`.
  - Inactive: background `#FFFFFF`, border: `1px solid #E1E6E1`, color `#5F6962`.
  - Active: background `var(--brand-green)` (`#039A01`), border: `1px solid #039A01`, color `#FFFFFF`.
  - Icon: `15px` Lucide icon with `6px` spacing.

### Phase 3: Active Tab Body (`inv-tab-body`)
The active tab body is rendered dynamically based on URL query parameter `?tab=<tab_id>`, preserving deep-linking and browser navigation history.

---

## 3. INDIVIDUAL WORKSPACE LAYOUT SPECIFICATIONS

### 3.1 Executive Command Center (`/dashboard`)
- **Banner:** Green live indicator badge (`LIVE ERP BACKEND ACTIVE · PostgreSQL Real-time`).
- **Summary KPI Cards (`SummaryCards.tsx`):**
  - 4-card grid (`grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))`).
  - Active Admissions, Daily Care Vitals, Low-Stock Alerts, Monthly Billing Total.
  - Border radius `8px`, background `#FFFFFF`, border `1px solid #E1E6E1`, box-shadow `var(--shadow-card)`.
- **Dashboard Columns (`.dashboard-columns`):**
  - 2-column asymmetric layout (`grid-template-columns: 2fr 1.2fr`).
  - Left column: `ModuleGrid` (quick launch tiles into authorized domains).
  - Right column: `RecentActivity` (real-time audit timeline of user events).

### 3.2 Inventory Workspace (`/inventory`)
- **Command Center Tab (`overview`):**
  - Top toolbar with operational title and live "Refresh" button with spin animation.
  - 4 KPI cards: Product Catalog, Total Valuation, Pending Audits, Critical Expiries.
  - Two-panel layout: Recent Stock Movements table on left, High Consumption warning list on right.
- **Product Master Tab (`products`):**
  - Header actions: Search input, Category filter dropdown, "+ Add Product" button.
  - Full-width dense data table: SKU, Item Name, Category, Minimum Level, Reorder Quantity, Action menu.
- **Purchases & Procurement Tab (`purchases`):**
  - Multi-stage pipeline: Purchase Requisition (PR) -> Purchase Order (PO) -> Goods Receipt Note (GRN) -> 3-Way Invoice Match.

### 3.3 Finance Workspace (`/finance`)
- **Command Center Tab (`overview`):**
  - Real-time revenue counter, pending receivables card, unallocated cashbox tally.
- **Elder Billing Tab (`billing`):**
  - Monthly billing batch generator: Cycle selector, Batch execution button, resident dues list.
- **Manual Billing Tab (`manual-billing`):**
  - Two-column billing layout: Form generator on left, live itemized receipt preview on right.
- **Invoices Ledger Tab (`invoices`):**
  - Tabular list of issued GST invoices, payment collection status pills, "Download PDF" buttons.

### 3.4 Inhouse Care & Nursing Workspace (`/inhouse-care`)
- **Daily Operations Tab (`daily-ops`):**
  - Ward selector (e.g. "Floor 1 - Assisted Living", "Floor 2 - Memory Care").
  - Resident grid with vitals status badges (Green = Normal, Amber = Overdue, Red = Critical).
- **Medication Administration Tab (`medication`):**
  - Electronic Medication Administration Record (eMAR).
  - Hourly timeline slots (Morning 08:00, Noon 13:00, Evening 18:00, Night 21:00).
  - One-click administration confirmation dialog with nurse PIN verification.

### 3.5 Home Care Operations (`/home-care`)
- **Manager Command Tab (`overview`):**
  - Today's dispatch map and visit schedule counter.
- **Visit Logs Tab (`visits`):**
  - Chronological visit logs with GPS check-in status, duration tracker, and caregiver notes.

### 3.6 Security & Visitor Gate (`/visitor-security`)
- **Gate Queue Tab (`queue`):**
  - High-contrast touch-friendly interface for gate security guards.
  - Active visitor count badge, "Check In Visitor" modal trigger, "Check Out" quick button.
- **Vehicle Gate Tab (`vehicles`):**
  - License plate entry, driver mobile, vehicle type selector, material gate-pass validator.

### 3.7 Philanthropy & Foundation (`/donors-volunteers`)
- **Donations Register Tab (`donations`):**
  - Donor search, payment mode filter, 80G tax receipt generator.
  - Tax receipt modal preview with UNCF trust registration number and authorized signatory.

### 3.8 HR & Operations (`/hr-operations`)
- **Attendance Roster Tab (`attendance`):**
  - Daily biometric shift roll, late-in flags, half-day indicators.
- **Leave Governance Tab (`leave`):**
  - Leave approval pipeline: Pending requests list, Employee balance widget, "Approve" / "Reject" actions.

### 3.9 Ambulance & Fleet Logistics (`/ambulance`)
- **Dispatch Management Tab (`dispatch`):**
  - Emergency booking cards: Patient condition, pickup location, assigned vehicle, driver phone.
  - Live status pills: `DISPATCHED`, `EN_ROUTE`, `ON_SCENE`, `TRANSPORTING`, `COMPLETED`.

### 3.10 Central Reports & Business Intelligence (`/reports`)
- **Executive BI Overview (`overview`):**
  - Filter bar: Date Range picker (Last 7 Days, Month, Quarter, YTD), Unit Scope.
  - Recharts visualizations: Occupancy trajectory line chart, Revenue vs Expenses bar chart, Inventory consumption area chart.

### 3.11 ElderCare Client & Family Portal (`/portal`)
- **Independent Layout (`PortalLayout.tsx`):**
  - White-label family header with UNCF insignia and active resident selector.
  - Horizontal tab navigation: Overview, Health & Vitals, Daily Care (ADL), Medications, Diet & Nutrition, Billing & Invoices, Care Desk & Feedback.
  - Responsive card grids optimized for non-technical family members viewing on tablets and phones.
