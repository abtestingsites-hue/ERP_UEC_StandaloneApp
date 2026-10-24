import { useState } from 'react';
import { X, Heart, AlertCircle, CheckCircle2 } from 'lucide-react';
import { donorsVolunteersService } from '../donorsVolunteers.service';
import type { CreateDonationPayload, Donation } from '../donorsVolunteers.types';

interface NewDonationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (donation: Donation) => void;
    activeUnitId?: string | null;
}

export function NewDonationModal(props: NewDonationModalProps) {
    if (!props.isOpen) return null;
    return <NewDonationModalContent {...props} />;
}

function NewDonationModalContent({
    onClose,
    onSuccess,
    activeUnitId
}: NewDonationModalProps) {
    const [name, setName] = useState('');
    const [fatherOrHusbandName, setFatherOrHusbandName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [panNumber, setPanNumber] = useState('');
    const [isCorporate, setIsCorporate] = useState(false);
    const [residentialAddress, setResidentialAddress] = useState('');

    const [amount, setAmount] = useState('');
    const [amountInWords, setAmountInWords] = useState('');
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [materialDetails, setMaterialDetails] = useState('');
    const [purpose, setPurpose] = useState('General Charitable Support');
    const [category, setCategory] = useState('General');

    const [taxDeduction, setTaxDeduction] = useState(false);
    const [occasionName, setOccasionName] = useState('');
    const [occasionDate, setOccasionDate] = useState('');
    const [preferredPrayerDate, setPreferredPrayerDate] = useState('');
    const [specialPrayerMessage, setSpecialPrayerMessage] = useState('');
    const [wishToVisitHome, setWishToVisitHome] = useState(false);

    const [ref1Name, setRef1Name] = useState('');
    const [ref1Mobile, setRef1Mobile] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Donor name is required.');
            return;
        }
        if (paymentMode !== 'MATERIAL' && (!amount || Number(amount) <= 0)) {
            setError('Please enter a valid donation amount.');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const references = ref1Name.trim()
                ? [{ name: ref1Name.trim(), mobile: ref1Mobile.trim() || undefined }]
                : undefined;

            const payload: CreateDonationPayload = {
                name: name.trim(),
                fatherOrHusbandName: fatherOrHusbandName.trim() || undefined,
                mobile: mobile.trim() || undefined,
                email: email.trim() || undefined,
                panNumber: panNumber.trim().toUpperCase() || undefined,
                isCorporate,
                residentialAddress: residentialAddress.trim() || undefined,

                amount: Number(amount || 0),
                amountInWords: amountInWords.trim() || undefined,
                paymentMode,
                materialDetails: materialDetails.trim() || undefined,
                purpose: purpose.trim() || undefined,
                category,

                taxDeduction,
                occasionName: occasionName.trim() || undefined,
                occasionDate: occasionDate || undefined,
                preferredPrayerDate: preferredPrayerDate || undefined,
                specialPrayerMessage: specialPrayerMessage.trim() || undefined,
                wishToVisitHome,

                references
            };

            const created = await donorsVolunteersService.createDonation(payload, activeUnitId);
            onSuccess(created);
            onClose();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to record donation.';
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="erp-modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
            <div
                className="erp-modal"
                style={{
                    maxWidth: 680,
                    width: '95vw',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '1.25rem 1.5rem',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: 'var(--surface-color)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: '8px',
                                background: 'rgba(16, 185, 129, 0.12)',
                                color: '#10b981',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Heart size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>
                                Issue UNCF Donation Receipt
                            </h3>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Universal Nature Care and Cure Foundation Intake
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            padding: '4px'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
                        {error && (
                            <div
                                style={{
                                    padding: '0.75rem',
                                    borderRadius: '6px',
                                    marginBottom: '1rem',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Section 1: Donor Profile */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#10b981', marginBottom: '0.75rem' }}>
                                1. Donor Information
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                                <div>
                                    <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                        Donor Name *
                                    </label>
                                    <input
                                        type="text"
                                        className="erp-input"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Full Name or Org Name"
                                        required
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                        Father / Husband Name
                                    </label>
                                    <input
                                        type="text"
                                        className="erp-input"
                                        value={fatherOrHusbandName}
                                        onChange={(e) => setFatherOrHusbandName(e.target.value)}
                                        placeholder="Optional relation"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                                <div>
                                    <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                        Mobile Phone
                                    </label>
                                    <input
                                        type="tel"
                                        className="erp-input"
                                        value={mobile}
                                        onChange={(e) => setMobile(e.target.value)}
                                        placeholder="10-digit number"
                                        maxLength={10}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                        PAN Number (for 80G)
                                    </label>
                                    <input
                                        type="text"
                                        className="erp-input"
                                        value={panNumber}
                                        onChange={(e) => setPanNumber(e.target.value)}
                                        placeholder="e.g. ABCDE1234F"
                                        maxLength={10}
                                        style={{ width: '100%', textTransform: 'uppercase' }}
                                    />
                                </div>
                                <div>
                                    <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        className="erp-input"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="donor@example.com"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={isCorporate}
                                        onChange={(e) => setIsCorporate(e.target.checked)}
                                    />
                                    <span>Corporate / CSR Donation</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={taxDeduction}
                                        onChange={(e) => setTaxDeduction(e.target.checked)}
                                    />
                                    <span>Claim 80G Tax Deduction</span>
                                </label>
                            </div>

                            <div>
                                <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                    Residential / Communication Address
                                </label>
                                <input
                                    type="text"
                                    className="erp-input"
                                    value={residentialAddress}
                                    onChange={(e) => setResidentialAddress(e.target.value)}
                                    placeholder="House/Street, City, Pin"
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>

                        {/* Section 2: Donation & Financials */}
                        <div style={{ marginBottom: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#10b981', marginBottom: '0.75rem' }}>
                                2. Contribution Details
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                                <div>
                                    <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                        Donation Amount (INR) *
                                    </label>
                                    <input
                                        type="number"
                                        className="erp-input"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="e.g. 5000"
                                        style={{ width: '100%', fontSize: '1rem', fontWeight: 600 }}
                                    />
                                </div>
                                <div>
                                    <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                        Payment Mode
                                    </label>
                                    <select
                                        className="erp-input"
                                        value={paymentMode}
                                        onChange={(e) => setPaymentMode(e.target.value)}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="CASH">Cash</option>
                                        <option value="ONLINE">Online Transfer / UPI</option>
                                        <option value="CHEQUE">Cheque / Demand Draft</option>
                                        <option value="MATERIAL">In-Kind / Material Item</option>
                                    </select>
                                </div>
                            </div>

                            {paymentMode === 'MATERIAL' && (
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                        Material / Ration / Item Details
                                    </label>
                                    <input
                                        type="text"
                                        className="erp-input"
                                        value={materialDetails}
                                        onChange={(e) => setMaterialDetails(e.target.value)}
                                        placeholder="e.g. 50 kg rice, blankets, wheelchair"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                                <div>
                                    <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                        Charitable Purpose / Campaign
                                    </label>
                                    <input
                                        type="text"
                                        className="erp-input"
                                        value={purpose}
                                        onChange={(e) => setPurpose(e.target.value)}
                                        placeholder="Elderly Nutrition, Healthcare, Foundation Corpus"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                        Category
                                    </label>
                                    <select
                                        className="erp-input"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="General">General Donation</option>
                                        <option value="Medical">Healthcare & Medicine Aid</option>
                                        <option value="Food">Food & Nutrition Drive</option>
                                        <option value="Infrastructure">Building & Shelter Infrastructure</option>
                                        <option value="Corpus">Corpus Fund</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                    Amount In Words
                                </label>
                                <input
                                    type="text"
                                    className="erp-input"
                                    value={amountInWords}
                                    onChange={(e) => setAmountInWords(e.target.value)}
                                    placeholder="e.g. Five Thousand Rupees Only"
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>

                        {/* Section 3: Occasion, Prayers & Community Reference */}
                        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#10b981', marginBottom: '0.75rem' }}>
                                3. Occasions & Community Reference (Optional)
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                                <div>
                                    <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                        Occasion / In Memory Of
                                    </label>
                                    <input
                                        type="text"
                                        className="erp-input"
                                        value={occasionName}
                                        onChange={(e) => setOccasionName(e.target.value)}
                                        placeholder="Birthday, Memorial, Anniversary"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                        Occasion Date
                                    </label>
                                    <input
                                        type="date"
                                        className="erp-input"
                                        value={occasionDate}
                                        onChange={(e) => setOccasionDate(e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                                <div>
                                    <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                        Special Prayer Intention / Note
                                    </label>
                                    <input
                                        type="text"
                                        className="erp-input"
                                        value={specialPrayerMessage}
                                        onChange={(e) => setSpecialPrayerMessage(e.target.value)}
                                        placeholder="Peace, recovery, blessings..."
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                        Preferred Special Prayer Date
                                    </label>
                                    <input
                                        type="date"
                                        className="erp-input"
                                        value={preferredPrayerDate}
                                        onChange={(e) => setPreferredPrayerDate(e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                                <div>
                                    <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                        Community Reference / Volunteer Name
                                    </label>
                                    <input
                                        type="text"
                                        className="erp-input"
                                        value={ref1Name}
                                        onChange={(e) => setRef1Name(e.target.value)}
                                        placeholder="Volunteer or Coordinator"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                        Reference Mobile
                                    </label>
                                    <input
                                        type="tel"
                                        className="erp-input"
                                        value={ref1Mobile}
                                        onChange={(e) => setRef1Mobile(e.target.value)}
                                        placeholder="10-digit mobile"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                                <input
                                    type="checkbox"
                                    checked={wishToVisitHome}
                                    onChange={(e) => setWishToVisitHome(e.target.checked)}
                                />
                                <span>Donor expresses wish to visit Foundation / Resident Care Home</span>
                            </label>
                        </div>
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            padding: '1rem 1.5rem',
                            borderTop: '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '0.75rem',
                            backgroundColor: 'var(--surface-color)'
                        }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            className="erp-button erp-button-secondary"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="erp-button erp-button-primary"
                            disabled={isSubmitting}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                background: '#10b981',
                                borderColor: '#10b981',
                                color: '#ffffff'
                            }}
                        >
                            <CheckCircle2 size={16} />
                            {isSubmitting ? 'Recording Receipt...' : 'Generate Donation Receipt'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
