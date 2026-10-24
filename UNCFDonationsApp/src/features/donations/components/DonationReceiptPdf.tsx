import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDonation, markDonationSent } from '../services/donationService';
import { X, Send, Printer, Loader2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { UNCF_BRANDING } from '../../../assets/branding';

export const DonationReceiptPdf = ({ donationId, onClose }: { donationId: string; onClose: () => void }) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    const { data: donation, isLoading } = useQuery({
        queryKey: ['uncf-donation', donationId],
        queryFn: () => getDonation(donationId)
    });

    const markSentMutation = useMutation({
        mutationFn: () => markDonationSent(donationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['uncf-donations'] });
            queryClient.invalidateQueries({ queryKey: ['uncf-donation', donationId] });
            onClose();
        }
    });

    const handlePrint = (mode: 'FULL' | 'DONOR' = 'FULL') => {
        if (!printRef.current || !donation) return;
        setIsDownloading(true);

        setTimeout(() => {
            try {
                const iframe = document.createElement('iframe');
                iframe.style.position = 'fixed';
                iframe.style.right = '0';
                iframe.style.bottom = '0';
                iframe.style.width = '0';
                iframe.style.height = '0';
                iframe.style.border = '0';
                document.body.appendChild(iframe);

                const iframeDoc = iframe.contentWindow?.document;
                if (!iframeDoc) throw new Error('Could not access iframe document');

                let styles = '';
                document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
                    styles += node.outerHTML;
                });

                const html = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8" />
                        <title>Receipt_${donation.receiptNo || 'UNCF'}${mode === 'DONOR' ? '_Donor_Copy' : ''}</title>
                        ${styles}
                        <style>
                            ${mode === 'DONOR' ? '.office-copy { display: none !important; } .dotted-border { display: none !important; }' : ''}
                            @media print {
                                body { margin: 0; padding: 20px; }
                                @page { margin: 0.5cm; }
                            }
                        </style>
                    </head>
                    <body class="bg-white">
                        <div style="font-family: Arial, sans-serif;">
                            ${printRef.current?.outerHTML || ''}
                        </div>
                    </body>
                    </html>
                `;

                iframeDoc.open();
                iframeDoc.write(html);
                iframeDoc.close();

                setTimeout(() => {
                    try {
                        iframe.contentWindow?.focus();
                        iframe.contentWindow?.print();
                    } catch (e) {
                        console.error('Print dialog error:', e);
                    } finally {
                        setTimeout(() => {
                            if (document.body.contains(iframe)) {
                                document.body.removeChild(iframe);
                            }
                            setIsDownloading(false);
                        }, 500);
                    }
                }, 300);
            } catch (err) {
                console.error('Print failure:', err);
                setIsDownloading(false);
            }
        }, 100);
    };

    if (isLoading || !donation) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs">
                <div className="rounded-2xl bg-white p-6 shadow-xl flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                    <span className="font-bold text-slate-800">Loading donation receipt...</span>
                </div>
            </div>
        );
    }

    const gitaQuote = UNCF_BRANDING.gitaQuotes[0];

    const renderReceiptBody = (title: string) => (
        <div className="rounded-xl border border-slate-300 bg-white p-6 text-slate-900 text-xs shadow-xs space-y-4">
            {/* Receipt Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                <div>
                    <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">{UNCF_BRANDING.organizationName}</h2>
                    <p className="text-[10px] font-semibold text-slate-500">{UNCF_BRANDING.tagline}</p>
                    <p className="text-[10px] text-slate-500">{UNCF_BRANDING.address} | Phone: {UNCF_BRANDING.phone}</p>
                    <p className="text-[10px] font-bold text-emerald-700 mt-0.5">{UNCF_BRANDING.taxExemptionText}</p>
                </div>
                <div className="text-right">
                    <span className="inline-block rounded-md bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-700">
                        {title}
                    </span>
                    <p className="mt-1 text-sm font-black text-primary-700">No: {donation.receiptNo}</p>
                    <p className="text-[11px] font-bold text-slate-600">Date: {format(new Date(donation.date), 'dd/MM/yyyy')}</p>
                </div>
            </div>

            {/* Donor & Donation Details Table */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <p><strong className="text-slate-600">Donor Name:</strong> <span className="font-bold text-slate-900">{donation.donor?.name || 'Anonymous'}</span></p>
                    {donation.donor?.fatherOrHusbandName && <p><strong className="text-slate-600">S/o, D/o, W/o:</strong> {donation.donor.fatherOrHusbandName}</p>}
                    <p><strong className="text-slate-600">Mobile:</strong> {donation.donor?.mobile || donation.donor?.whatsappNumber || '-'}</p>
                    <p><strong className="text-slate-600">Address:</strong> {donation.donor?.residentialAddress || '-'}</p>
                    {donation.donor?.panNumber && <p><strong className="text-slate-600">PAN No:</strong> {donation.donor.panNumber}</p>}
                </div>

                <div className="space-y-1.5 border-l border-slate-100 pl-4">
                    <p><strong className="text-slate-600">Payment Mode:</strong> <span className="font-bold">{donation.paymentMode}</span></p>
                    <p><strong className="text-slate-600">Category:</strong> {donation.category || 'General'}</p>
                    {donation.purpose && <p><strong className="text-slate-600">Purpose / Occasion:</strong> {donation.purpose} {donation.occasionName ? `(${donation.occasionName})` : ''}</p>}
                    {donation.materialDetails && <p><strong className="text-slate-600">Transaction Details:</strong> {donation.materialDetails}</p>}
                    {donation.taxDeduction && (
                        <p className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                            80G Tax Exemption Claimed
                        </p>
                    )}
                </div>
            </div>

            {/* Amount Banner */}
            <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-3">
                <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount Received</span>
                    <p className="text-xs font-semibold text-slate-700 italic">{donation.amountInWords || `Rupees ${donation.amount} Only`}</p>
                </div>
                <div className="text-lg font-black text-slate-900 bg-white border border-slate-300 rounded-lg px-4 py-1">
                    ₹{donation.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
            </div>

            {/* Special Notes / Prayer Message */}
            {(donation.specialPrayerMessage || donation.preferredPrayerDate || donation.wishToVisitHome) && (
                <div className="rounded-lg bg-amber-50/70 border border-amber-200 p-2.5 text-[11px] text-amber-900">
                    {donation.specialPrayerMessage && <p><strong>Prayer Request:</strong> "{donation.specialPrayerMessage}"</p>}
                    {donation.wishToVisitHome && <p className="mt-0.5"><strong>Visit Wish:</strong> Donor expressed desire to visit foundation home.</p>}
                </div>
            )}

            {/* Footer / Quote */}
            <div className="border-t border-slate-100 pt-2 flex items-end justify-between">
                <p className="max-w-md text-[10px] italic text-slate-500 leading-normal">{gitaQuote}</p>
                <div className="text-right">
                    <p className="text-[11px] font-bold text-slate-800">Authorized Signatory</p>
                    <p className="text-[9px] text-slate-500">For {UNCF_BRANDING.shortName}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                    <div>
                        <h3 className="text-base font-extrabold text-slate-900">Donation Receipt Details</h3>
                        <p className="text-xs font-semibold text-slate-500">Receipt No: {donation.receiptNo}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePrint('DONOR')}
                            disabled={isDownloading}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50"
                        >
                            <Printer className="h-4 w-4 text-primary-600" />
                            Print Donor Copy
                        </button>
                        <button
                            onClick={() => handlePrint('FULL')}
                            disabled={isDownloading}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary-700 disabled:opacity-50"
                        >
                            <Printer className="h-4 w-4" />
                            Print Both Copies
                        </button>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 app-scrollbar" ref={printRef}>
                    {renderReceiptBody('DONOR COPY')}
                    <div className="dotted-border border-b-2 border-dashed border-slate-300 my-4" />
                    <div className="office-copy">{renderReceiptBody('OFFICE COPY')}</div>
                </div>

                {/* Footer Action */}
                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
                    <span className="text-xs font-semibold text-slate-500">
                        Status: {donation.isReceiptSent ? 'Receipt sent to donor' : 'Receipt generated'}
                    </span>
                    <div className="flex items-center gap-3">
                        {!donation.isReceiptSent ? (
                            <button
                                onClick={() => markSentMutation.mutate()}
                                disabled={markSentMutation.isPending}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                            >
                                <CheckCircle className="h-4 w-4" />
                                {markSentMutation.isPending ? 'Updating...' : 'Mark Receipt Sent'}
                            </button>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                                <CheckCircle className="h-3.5 w-3.5" />
                                Receipt Marked Sent ({donation.receiptSentAt ? format(new Date(donation.receiptSentAt), 'dd MMM yyyy') : ''})
                            </span>
                        )}
                        <button
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
