# CRMApp — Standalone CRM & Enquiry Management Frontend

Standalone micro-frontend application for the CRM, Enquiry, Customer Care, B2P Partner, and Lead Management domain in the UEC Enterprise ERP Ecosystem.

## Architecture
- **Port:** 5181 (`http://127.0.0.1:5181`)
- **Backend API:** Connects to Shared ERP Backend (`https://erp-uec-backend.onrender.com/api/v1`)
- **State Management:** Zustand with persistent storage key `crm_auth_storage`
- **Data Fetching:** Axios + TanStack React Query

## Getting Started
```bash
npm install
npm run dev
```
