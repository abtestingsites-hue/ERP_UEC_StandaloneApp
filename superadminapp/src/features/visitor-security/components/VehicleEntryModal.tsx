import { useState } from 'react';
import { X, Car, AlertCircle, PlusCircle } from 'lucide-react';
import type { CreateVehicleEntryPayload } from '../visitorSecurity.types';

interface VehicleEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payload: CreateVehicleEntryPayload) => Promise<void>;
}

export function VehicleEntryModal(props: VehicleEntryModalProps) {
    if (!props.isOpen) return null;
    return <VehicleEntryModalContent {...props} />;
}

function VehicleEntryModalContent({
    onClose,
    onSubmit
}: VehicleEntryModalProps) {
    const [vehicleNo, setVehicleNo] = useState('');
    const [vehicleType, setVehicleType] = useState('CAR');
    const [driverName, setDriverName] = useState('');
    const [driverMobile, setDriverMobile] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [purpose, setPurpose] = useState('DELIVERY');
    const [materialDetails, setMaterialDetails] = useState('');
    const [remarks, setRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vehicleNo.trim()) {
            setError('Please enter the vehicle registration number.');
            return;
        }
        if (!driverName.trim()) {
            setError('Please enter the driver or operator name.');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            await onSubmit({
                vehicleNo: vehicleNo.trim().toUpperCase(),
                vehicleType,
                driverName: driverName.trim(),
                driverMobile: driverMobile.trim() || undefined,
                companyName: companyName.trim() || undefined,
                purpose,
                materialDetails: materialDetails.trim() || undefined,
                remarks: remarks.trim() || undefined
            });
            onClose();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to record vehicle entry';
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
                    maxWidth: 540,
                    width: '90vw',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        padding: '1.25rem 1.5rem',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '8px',
                                background: 'rgba(217, 119, 6, 0.12)',
                                color: '#d97706',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Car size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                                Record Vehicle Gate Entry
                            </h3>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Gate Security Register
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

                <form onSubmit={handleSubmit}>
                    <div style={{ padding: '1.25rem 1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
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

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                    Vehicle Number *
                                </label>
                                <input
                                    type="text"
                                    className="erp-input"
                                    value={vehicleNo}
                                    onChange={(e) => setVehicleNo(e.target.value)}
                                    placeholder="e.g. DL 01 AB 1234"
                                    required
                                    style={{ width: '100%', textTransform: 'uppercase', fontWeight: 600 }}
                                />
                            </div>
                            <div>
                                <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                    Vehicle Type
                                </label>
                                <select
                                    className="erp-input"
                                    value={vehicleType}
                                    onChange={(e) => setVehicleType(e.target.value)}
                                    style={{ width: '100%' }}
                                >
                                    <option value="CAR">Car / SUV</option>
                                    <option value="TWO_WHEELER">Two Wheeler</option>
                                    <option value="DELIVERY_TRUCK">Commercial / Delivery Truck</option>
                                    <option value="AMBULANCE">Ambulance</option>
                                    <option value="AUTO">Auto / Cab</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                    Driver / Operator Name *
                                </label>
                                <input
                                    type="text"
                                    className="erp-input"
                                    value={driverName}
                                    onChange={(e) => setDriverName(e.target.value)}
                                    placeholder="Full Name"
                                    required
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                    Driver Mobile
                                </label>
                                <input
                                    type="tel"
                                    className="erp-input"
                                    value={driverMobile}
                                    onChange={(e) => setDriverMobile(e.target.value)}
                                    placeholder="10-digit number"
                                    maxLength={10}
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                    Purpose *
                                </label>
                                <select
                                    className="erp-input"
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    style={{ width: '100%' }}
                                >
                                    <option value="DELIVERY">Goods Delivery / Logistics</option>
                                    <option value="EMERGENCY">Medical Emergency / Transfer</option>
                                    <option value="GUEST_VISIT">Guest / Visitor Vehicle</option>
                                    <option value="MAINTENANCE">Maintenance / Contractor</option>
                                    <option value="STAFF">Staff Transport</option>
                                    <option value="OTHER">Other Purpose</option>
                                </select>
                            </div>
                            <div>
                                <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                    Company / Agency
                                </label>
                                <input
                                    type="text"
                                    className="erp-input"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="e.g. DHL, FreshFoods, Contractor"
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                Cargo / Material Details
                            </label>
                            <input
                                type="text"
                                className="erp-input"
                                value={materialDetails}
                                onChange={(e) => setMaterialDetails(e.target.value)}
                                placeholder="e.g. 5 boxes medical supplies, challan #884"
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div style={{ marginBottom: '0.5rem' }}>
                            <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                Gate Notes / Security Remarks
                            </label>
                            <textarea
                                className="erp-input"
                                rows={2}
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Gate pass issued, parking bay P-3..."
                                style={{ width: '100%', resize: 'vertical' }}
                            />
                        </div>
                    </div>

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
                                background: '#d97706',
                                borderColor: '#d97706',
                                color: '#ffffff'
                            }}
                        >
                            <PlusCircle size={16} />
                            {isSubmitting ? 'Recording...' : 'Record Vehicle Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
