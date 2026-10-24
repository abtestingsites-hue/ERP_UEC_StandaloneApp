import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';

export function VisitorSelfCheckInCard() {
    const checkInUrl = `${window.location.origin}/visitor-checkin`;

    return (
        <section className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
            <h2 className="text-lg font-bold text-indigo-800 uppercase tracking-wide border-b pb-2 border-indigo-50 w-full text-left">Self-Service Check-In</h2>
            <p className="text-sm text-slate-600 font-medium">
                Visitors can scan this QR code to open the self-service check-in form.
            </p>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 inline-block">
                <QRCodeSVG value={checkInUrl} size={160} />
            </div>
            <Link 
                to="/visitor-checkin"
                className="text-indigo-600 font-bold hover:text-indigo-800 hover:underline flex items-center gap-1 mt-2"
            >
                Open Self-Service Check-In &rarr;
            </Link>
        </section>
    );
}
