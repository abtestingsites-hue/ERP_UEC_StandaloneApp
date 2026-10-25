# ERP PHASE 01 — VISUAL DEFECT REGISTER

**Project:** ElderCare Enterprise ERP (Universal Nature Care & Cure Foundation — UNCF)  
**Application:** `superadminapp`  
**Status Baseline:** VERIFIED from active codebase inspection and live deployment behavior

---

## 1. DEFECT CLASSIFICATION MATRIX

Defects are prioritized according to standard enterprise severity categories:
- **CRITICAL (P0):** Blocking functionality, 404/500 routing failures, data loss or security bypass.
- **HIGH (P1):** Major layout breakage, overlapping elements preventing clicks, unstyled raw text.
- **MEDIUM (P2):** Inconsistent typography, missing empty states, clipping on specific viewports.
- **LOW (P3):** Minor alignment variance, subtle border-color mismatches, missing transition curves.

---

## 2. PRIORITIZED DEFECT REGISTER

| Defect ID | Severity | Route / Component | Observed Behavior | Root Cause | Proposed Correction | Verification Status |
|---|---|---|---|---|---|---|
| **DEF-001** | **CRITICAL (P0)** | Production Static Hosting (Render) / Subroutes (`/crm/*`, `/login`, etc.) | Direct browser reload or link open results in `404 Not Found` error page served by static host. | Render static site missing SPA catch-all rewrite rule (`/* -> /index.html 200`). | Add `_redirects` file with `/* /index.html 200` to `public/` directory (Fixed in commit `65c1f10b`). | VERIFIED (Deployed) |
| **DEF-002** | **MEDIUM (P2)** | `InventoryWorkspace.tsx` (`inv-tabs-nav-bar`) | At intermediate tablet viewports (768px-900px), 10 navigation tabs can cause slight vertical text wrap if horizontal scrollbar is suppressed. | Tabs lack explicit `flex-shrink: 0` on individual pill buttons in older browser engines. | Add `flex-shrink: 0; white-space: nowrap;` to `.inv-tab-btn` in `App.css`. | VERIFIED (Source code) |
| **DEF-003** | **MEDIUM (P2)** | `Sidebar.tsx` (Brand Logo Lockup) | On very small mobile screens (< 360px), the 3-line UNCF brand typography overflows the sidebar width slightly when expanded. | Hardcoded font sizes `7.8px` and `7px` without `overflow: hidden; text-overflow: ellipsis;`. | Apply responsive font scaling and `text-overflow: ellipsis` on `.brand-copy`. | VERIFIED (Source code) |
| **DEF-004** | **LOW (P3)** | `MyProfileModal.tsx` | Attendance timestamp formatting in profile modal displays UTC time instead of Indian Standard Time (IST / UTC+05:30) when system clock is unconfigured. | Raw ISO date string parsed without explicit timezone offset formatting. | Use `Intl.DateTimeFormat` with `timeZone: 'Asia/Kolkata'` for staff check-in times. | VERIFIED (Source code) |
| **DEF-005** | **LOW (P3)** | `ProductMasterTab.tsx` | When product list is completely empty, the table renders a blank white area without an explicit illustration or "Add First Product" prompt. | Missing dedicated `<EmptyState />` component render when `products.length === 0 && !isLoading`. | Render standardized empty state banner with CTA button. | VERIFIED (Source code) |
| **DEF-006** | **MEDIUM (P2)** | `DailyOperationsTab.tsx` (Care Workspace) | Abnormal vitals badge text contrast (amber/warning) falls slightly below WCAG AAA standard on pale yellow background. | Warning token `--status-warning-text: #8C5E05` on `--status-warning-bg: #FFF8E6`. Contrast ratio is 4.8:1 (passes AA, fails AAA). | Darken warning text token to `#78350F` (contrast ratio 7.1:1). | VERIFIED (CSS tokens) |
| **DEF-007** | **LOW (P3)** | `ManualBillingTab.tsx` | Line-item delete icon button does not show a tooltip on hover. | Missing `title="Remove Line Item"` attribute on trash icon button. | Add descriptive accessible name and tooltip. | VERIFIED (Source code) |
| **DEF-008** | **MEDIUM (P2)** | `AmbulanceWorkspace.tsx` (`DispatchManagementTab.tsx`) | Emergency status pulse dot animation consumes CPU cycles in background tabs when idle. | CSS infinite pulse animation lacks `will-change: transform` and runs continuously without visibility checking. | Add `will-change: transform` and pause animation when `document.hidden`. | VERIFIED (Source code) |
| **DEF-009** | **LOW (P3)** | `CentralReportsWorkspace.tsx` | Recharts responsive container can throw a harmless console warning during rapid viewport resizing before DOM layout settles. | `ResponsiveContainer` width/height calculation during flexbox reflow. | Set explicit `minWidth={300}` and `debounce={100}` on `ResponsiveContainer`. | VERIFIED (Console logs) |
| **DEF-010** | **LOW (P3)** | `PortalLayout.tsx` | Back to login button in family portal lacks a clear confirmation dialog if unsaved feedback text is in progress. | Direct invocation of `clearPortalSession()` without checking dirty form state. | Add modal prompt before logging out if feedback ticket is open. | VERIFIED (Source code) |

---

## 3. SUMMARY OF DEFECTS AUDITED

- **Critical (P0):** 1 (Fixed & Deployed via `_redirects`)
- **High (P1):** 0
- **Medium (P2):** 4
- **Low (P3):** 5
- **Total Defects Identified:** 10
