import React from 'react';

const PagePlaceholder: React.FC<{ title: string; subtitle: string; category: string }> = ({
  title,
  subtitle,
  category,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
          <span>{category}</span>
          <span>•</span>
          <span>Phase 37B Standalone Scaffold</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          {title} Placeholder
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Route successfully resolved on <code className="text-emerald-500 font-mono">http://localhost:5180</code>.
          Feature components will be extracted in Phase 37D/37E.
        </p>
      </div>
    </div>
  );
};

export const FinanceDashboardPlaceholder = () => (
  <PagePlaceholder title="Finance Dashboard" subtitle="Overview of income, expenses, and cashbox totals." category="Finance" />
);

export const ElderFinanceDashboardPlaceholder = () => (
  <PagePlaceholder title="Elder Finance Dashboard" subtitle="Overview of elder boarding fees and stipends." category="Finance" />
);

export const CashboxPlaceholder = () => (
  <PagePlaceholder title="Cashbox Ledger" subtitle="Daily receipts and cashbox transaction records." category="Accounts" />
);

export const CashboxPendingPlaceholder = () => (
  <PagePlaceholder title="Pending Approvals" subtitle="Transactions pending manager approval." category="Accounts" />
);

export const IncomePlaceholder = () => (
  <PagePlaceholder title="Income Logging" subtitle="Record income receipts and client payments." category="Accounts" />
);

export const ExpensePlaceholder = () => (
  <PagePlaceholder title="Expense Logging" subtitle="Record vendor payments and operational expenses." category="Accounts" />
);

export const InHouseExpensePlaceholder = () => (
  <PagePlaceholder title="In-House Facility Expenses" subtitle="Facility-level expense records." category="Accounts" />
);

export const InvoicePlaceholder = () => (
  <PagePlaceholder title="Invoice Registry" subtitle="Manage and post financial invoices." category="Finance" />
);

export const PendingPaymentsPlaceholder = () => (
  <PagePlaceholder title="Pending Payments" subtitle="Unpaid invoice balance tracking." category="Finance" />
);

export const AllowanceTrackingPlaceholder = () => (
  <PagePlaceholder title="Allowance Tracking" subtitle="Patient stipend and allowance ledger." category="Finance" />
);

export const RenewalsPlaceholder = () => (
  <PagePlaceholder title="Contract Renewals" subtitle="Service contract renewal alerts and financial terms." category="Finance" />
);

export const ElderBillingPlaceholder = () => (
  <PagePlaceholder title="Elder Care Billing" subtitle="Generate recurring boarding and care invoices." category="Finance" />
);

export const PatientDailyCostPlaceholder = () => (
  <PagePlaceholder title="Patient Daily Cost" subtitle="Daily cost sheet entries and monthly bill aggregation." category="Patient Billing" />
);

export const PatientManualBillingPlaceholder = () => (
  <PagePlaceholder title="Manual Patient Billing" subtitle="Manual itemized billing, subsidies, and PDF export." category="Patient Billing" />
);
