# Module Status Report

Status legend:
- Completed: usable end-to-end with UI, API, database, and auth controls.
- Partially Completed: meaningful implementation exists but gaps remain.
- UI Only: routed UI exists without sufficient backend workflow support.
- Backend Only: API/schema exists with limited or no frontend workflow.
- Placeholder: shell/demo/redirect/fallback behavior dominates.
- Not Started: no meaningful implementation found.

## Evidence Baseline

- `Frontend/src/App.tsx` contains lazy routes for dashboards, CRM, healthcare, operations, inventory, finance, security, omnichannel, ambulance, HR, CMS, profile, task log, and automation.
- `Backend/src/routes/index.js` mounts auth, enquiry, automation, intelligence, analytics, super-admin, HR, accounts, customer-care, client-portal, CMS, location, workflow, admin-files, security, notifications, operations, ambulance, patient-billing, daily-operations, inventory, healthcare, conversation, master, profile, allocation, medical, tasks, business, inhouse-care, welcome-call, vital-sign, and copilot routes.
- Build verification passed for frontend and backend.

## Module Matrix

| Module | Status | Current implementation | Missing implementation | Dependencies | Priority | Effort |
|---|---|---|---|---|---|---:|
| Authentication | Partially Completed | Login service, bcrypt, JWT, auth store, protected routes, token interceptor | Refresh flow, secure cookie option, enforced secret config, MFA/session management | User, Role, Tenant, Unit | Critical | 32h |
| Dashboard | Partially Completed | Dashboard, organization dashboard, role dashboards, reports dashboard routes | Verified live KPI coverage, drilldowns, role-specific correctness | Analytics, all modules | High | 80h |
| Super Admin | Partially Completed | User management UI/API, roles linkage | Full tenant management, audit views, permission administration hardening | Auth, RBAC, Tenant | High | 60h |
| User Management | Partially Completed | HR staff, create login, super-admin users, role assignment | Lifecycle controls, password reset, lockout, approvals, full audit | Auth, HR, RBAC | High | 64h |
| UNCF | Placeholder | Organization dashboard route exists | Specific foundation workflows and backend models are not evident | Dashboard | Medium | 80h |
| UEC | Partially Completed | In-house care, elder operations, elder inventory, finance, task log menus | Cohesive UEC business process and reporting | Healthcare, inventory, finance | High | 120h |
| UHC | Partially Completed | Healthcare and allocation pages/routes exist | Clinical governance, patient timeline, care plans, incidents, compliance | Patient, medical, allocation | High | 140h |
| UA | UI Only | Ambulance pages and minimal ambulance records API | Booking-dispatch-fleet-billing operational backend depth | Ambulance, billing, calls | Medium | 100h |
| UEO | Partially Completed | Enquiry, customer relations, omnichannel, security route groups | Unified enquiry-to-admission-to-customer-care orchestration | CRM, conversation, security | High | 120h |
| CRM | Partially Completed | Enquiry CRUD, follow-up, admissions, customer care UI | Full lead scoring, SLA, communication history integration, closed-loop conversion | Enquiry, conversation, automation | High | 120h |
| Patients | Partially Completed | Patient model, patient dashboard, admission linkage, vitals | Full demographics, consent, medical record, discharge, care plans | Healthcare, admission | Critical | 120h |
| Admissions | Partially Completed | Admission model and enquiry conversion routes | Admission forms are not clearly persisted end-to-end; discharge workflow partial | Enquiry, patient, billing | Critical | 96h |
| Daily Operations | Partially Completed | Daily operations routes and large UI page, task endpoints, report endpoint | Full operational approvals, recurring templates, exception workflow | Tasks, patient billing | High | 100h |
| Patient Care | Partially Completed | Vitals, medication schedule, nutrition, ADL, medical assignments | Care plan, medication safety, MAR audit, incident reporting, escalation | Patient, staff, medical | Critical | 160h |
| Billing | Partially Completed | Patient billing routes, daily cost, invoice generation, uploads | Payment reconciliation, invoice lifecycle, adjustments, tax/compliance | Accounts, inventory, patient | Critical | 120h |
| Payments | Partially Completed | Account transactions and invoice payment endpoint | Gateway integration, receipts, refunds, settlement, reconciliation | Accounts | High | 80h |
| Finance | Partially Completed | Accounts routes for invoice/income/expense/cashbox; finance pages | GL, chart of accounts, period close, bank reconciliation | Accounts, billing | High | 140h |
| Inventory | Partially Completed | Product, stock, purchase, stock issue request schema/API/UI | Purchase approval, vendor integration, expiry/batch, asset lifecycle | Vendor, billing | High | 100h |
| Assets | UI Only | Product asset page files exist; inventory redirects many asset routes to command center | Dedicated asset register, depreciation, maintenance, assignment | Inventory, finance | Medium | 96h |
| Reports | Placeholder | Reports dashboard route and role reports | Report builder, exports, scheduled reports, verified domain metrics | Analytics, all modules | Medium | 120h |
| Notifications | Backend Only | Notification routes for list/read and frontend modal/profile notifications | Notification creation policies, delivery channels, preferences | Users, socket | Medium | 64h |
| Automation | Partially Completed | Automation engine, rules, scoring, tasks, trace, AI services | Production governance, validation, explainability UI coverage, safe retries | Redis, AI, workflow | Medium | 120h |
| Analytics | Partially Completed | KPI, organization dashboard, forecast routes | Data warehouse quality, metric definitions, cache strategy | All operational data | Medium | 120h |
| Settings | UI Only | Settings route exists | System settings API, environment-driven configuration UI, audit controls | Auth, tenant | Medium | 80h |
| HR | Partially Completed | Staff, roles list, attendance, leave, payroll preview/process, documents, job applications | Full payroll, compliance, roster constraints, leave policy engine | User, staff, files | High | 140h |
| Master Data | Partially Completed | City, unit, client services, department, labour, payment category, vendor, room | Strong per-tenant uniqueness, import/export, audit, approval | Tenant, units | High | 80h |
| CMS | Partially Completed | Blog CRUD and upload routes; FAQ/events UI | Full FAQ/event backend, publishing workflow, rich media governance | Storage | Low | 70h |
| Client Portal | Partially Completed | Summary/services/medicines/complaints/feedback routes and UI | Authentication isolation for family/client roles, consent, secure invites | Admissions, clients | High | 100h |
| Conversation / Omnichannel | Partially Completed | Conversation/message routes, internal chat, Twilio/Exotel/webhooks, Socket.IO | Provider verification consistency, delivery retries, unified inbox completeness | Twilio, Exotel, Redis | High | 120h |
| Security Operations | Partially Completed | Security pages and routes with permission usage | Physical security workflow depth, incident escalation, visitor pass audit | Staff, notifications | Medium | 100h |
| Ambulance | UI Only | Many ambulance UI pages; backend only minimal records routes | Dispatch, trip sheet, fleet, billing, call logs, staff assignment persistence | Calls, billing | Medium | 140h |
| Medical Monitor | Partially Completed | Medical dashboard/staff/assignments, MedicalMonitor page | Clinical review workflow, alerts, escalation, audit trails | Healthcare, staff | High | 120h |
| Workflow Timeline | Partially Completed | Timeline route/service and frontend page | Generic event sourcing consistency across modules | WorkflowLog | Medium | 80h |
| File Storage/Admin Files | Partially Completed | Admin file register, uploads, operational records | Virus scanning, file ACL, retention, signed URLs | Storage, auth | High | 100h |

## Module Completion Estimates

| Module group | Estimate |
|---|---:|
| Auth and access | 75% |
| Master data | 70% |
| CRM and enquiry | 70% |
| Admissions and allocation | 60% |
| Healthcare and patient care | 58% |
| Daily operations | 55% |
| Billing and finance | 62% |
| Inventory | 65% |
| HR | 65% |
| Automation/intelligence | 50% |
| Omnichannel | 55% |
| Reports/analytics | 40% |
| Security/compliance | 40% |
| Deployment/testing/docs | 30% |

## Highest Priority Modules

1. Authentication, RBAC, tenant/unit isolation.
2. Patient, admission, allocation, and care workflows.
3. Billing, payment, and inventory posting workflows.
4. Audit logging, file security, and healthcare data protection.
5. Automated testing for critical workflows.
