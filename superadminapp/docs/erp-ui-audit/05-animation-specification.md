# ERP PHASE 01 — ANIMATION & MICROINTERACTION SPECIFICATION

**Project:** ElderCare Enterprise ERP (Universal Nature Care & Cure Foundation — UNCF)  
**Application:** `superadminapp`  
**Status Baseline:** VERIFIED from package manifests and active CSS stylesheets

---

## 1. ANIMATION ENGINE & DEPENDENCIES

- **CSS Transitions:** Primary animation mechanism implemented via Vanilla CSS in [src/App.css](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/App.css) and [src/index.css](file:///d:/FINAL/ERP/ERP%20BACKUP/superadminapp/src/index.css).
- **Framer Motion (`framer-motion` v14.6.0):** Present in `package.json` for complex gesture animations and modal backdrops.
- **Microinteraction Philosophy:** Minimal, enterprise-grade, low-latency microinteractions avoiding excessive motion or distracting bounce physics.

---

## 2. CATALOG OF VERIFIED ANIMATIONS & MICROINTERACTIONS

### 2.1 Sidebar Collapse & Expansion
- **Component:** `Sidebar.tsx` / `SuperAdminLayout.tsx`
- **Trigger:** Clicking hamburger menu button (`onToggleSidebar`) or resizing viewport.
- **CSS Property:** `transition: width 200ms ease, transform 200ms cubic-bezier(0.16, 1, 0.3, 1)`.
- **States:**
  - Expanded: `--sidebar-width: 258px`, `translateX(0)`.
  - Collapsed: `--sidebar-width: 78px`. Brand copy hides with `opacity: 0; display: none;`. Nav icons remain centered.
  - Mobile Open: `transform: translateX(0); z-index: 50`.
  - Mobile Closed: `transform: translateX(-100%)`.

### 2.2 Navigation Link Hover & Active Pill Shift
- **Component:** `NavLink` in `Sidebar.tsx` (`sidebar-link`)
- **Trigger:** Pointer hover or route change.
- **Transition:** `transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease`.
- **Hover:** Background shifts from transparent to `var(--sidebar-item-hover)` (`#F5F7F5`).
- **Active:** Background smoothly transitions to `var(--sidebar-item-active-bg)` (`#E7F4E8`), left border appears at `3px solid var(--brand-green)` (`#039A01`).

### 2.3 Workspace Tab Pill Transition
- **Component:** `inv-tab-btn` across all 10 domain workspaces
- **Trigger:** Mouse hover or active tab change.
- **Transition:** `transition: all 120ms ease-in-out`.
- **Hover:** Subtle border darkening (`#C8D1C8`).
- **Active:** Background transitions to solid `var(--brand-green)` (`#039A01`) with white text and sharp border highlight.

### 2.4 Button Hover & Press Feedback
- **Primary Buttons (`inv-btn--primary`, `auth-form__submit`):**
  - Hover: Background darkens from `#039A01` to `#028001` (`transition: background 120ms ease`).
  - Active / Pressed: Scale transform `transform: scale(0.98)` providing tactile haptic feel.
- **Secondary / Outline Buttons:**
  - Hover: Background tint `rgba(3, 154, 1, 0.05)`, border color transitions to `var(--brand-green)`.

### 2.5 Live Refresh Spin Animation
- **Component:** `RefreshCw` icon in `InventoryOverviewTab.tsx` and other command centers.
- **Trigger:** Active data-fetching state (`isLoading = true`).
- **Keyframes:**
  ```css
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .spin-animation {
    animation: spin 800ms linear infinite;
  }
  ```

### 2.6 Modal Dialog Entrance & Scrim Fade
- **Component:** `MyProfileModal.tsx`, Product Master Add Modal, Leave Request Modal.
- **Scrim Backdrop:** `background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(2px); transition: opacity 200ms ease`.
- **Dialog Box:**
  - Entry: `opacity: 0; transform: translateY(12px) scale(0.98)` -> `opacity: 1; transform: translateY(0) scale(1)`.
  - Timing: `duration: 220ms`, easing curve `cubic-bezier(0.16, 1, 0.3, 1)`.

### 2.7 Interactive Card Elevation
- **Component:** `stat-card`, `ModuleCard.tsx`
- **Trigger:** Pointer hover.
- **Transition:** `transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease`.
- **Hover State:** `transform: translateY(-2px)`, shadow increases to `var(--shadow-md)`, border shifts to `var(--brand-green-border)`.

### 2.8 Dropdown Popover Fade
- **Component:** `DomainSwitcher.tsx`, `OperatingUnitSelector.tsx`
- **Trigger:** Click toggle.
- **Transition:** `opacity 150ms ease, transform 150ms ease`.
- **Motion:** Translates `4px` downwards into place (`translateY(4px)` to `translateY(0)`).

---

## 3. ACCESSIBILITY & REDUCED MOTION

- **Media Query Support:**
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```
- **Compliance:** All microinteractions immediately collapse to instantaneous state changes when reduced-motion preference is detected in OS settings.
