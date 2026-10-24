import { useState, useEffect } from 'react';
import {
    UserCheck,
    Search,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    FileText,
    ShieldCheck,
    Copy,
    Sparkles
} from 'lucide-react';
import { admissionsService } from '../admissions.service';
import { ConsentFormModal } from '../components/ConsentFormModal';
import { saveProvisionedPortalUser } from '../../portal/portalStorage';
import type {
    Patient,
    MasterOption,
    CreateAdmissionPayload,
    AdmissionRecord
} from '../admissions.types';
import type { UnitInfo } from '../../inventory/inventory.types';
import { useActiveUnit } from '../../../context/useActiveUnit';

interface NewAdmissionTabProps {
    onAdmissionCompleted: (newAdmission: AdmissionRecord) => void;
    onNavigateRegisterPatient: () => void;
    initialPatient?: Patient | null;
}

export function NewAdmissionTab({ onAdmissionCompleted, onNavigateRegisterPatient, initialPatient }: NewAdmissionTabProps) {
    const { activeUnitId, units } = useActiveUnit();

    // Patient lookup
    const [patients, setPatients] = useState<Patient[]>([]);
    const [patientSearch, setPatientSearch] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [loadingPatients, setLoadingPatients] = useState(false);

    // Facility & room options
    const [unitId, setUnitId] = useState<string>(activeUnitId || units[0]?.id || '');
    const [floors, setFloors] = useState<MasterOption[]>([]);
    const [rooms, setRooms] = useState<MasterOption[]>([]);
    const [beds, setBeds] = useState<MasterOption[]>([]);

    // Form fields
    const [floor, setFloor] = useState('');
    const [room, setRoom] = useState('');
    const [bed, setBed] = useState('');
    const [admissionPriority, setAdmissionPriority] = useState('NORMAL');
    const [healthCondition, setHealthCondition] = useState('STABLE');
    const [clinicalStatus, setClinicalStatus] = useState('AMBULATORY');

    // Consent
    const [consentAcknowledged, setConsentAcknowledged] = useState(true);
    const [signedByName, setSignedByName] = useState('');
    const [signerRelation, setSignerRelation] = useState('GUARDIAN');
    const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);

    // Family & Guardian Digital Portal Access
    const [enablePortalAccess, setEnablePortalAccess] = useState(true);
    const [portalGuardianName, setPortalGuardianName] = useState('');
    const [portalMobile, setPortalMobile] = useState('');
    const [portalUsername, setPortalUsername] = useState('');
    const [portalPassword, setPortalPassword] = useState('');
    const [portalEmail, setPortalEmail] = useState('');
    const [copiedCredentials, setCopiedCredentials] = useState(false);

    // Submission & Feedback
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successAdmission, setSuccessAdmission] = useState<AdmissionRecord | null>(null);

    const handleUnitChange = (newUnitId: string) => {
        setUnitId(newUnitId);
        setFloor('');
        setRoom('');
        setBed('');
        setFloors([]);
        setRooms([]);
        setBeds([]);
    };

    const handleFloorChange = (newFloor: string) => {
        setFloor(newFloor);
        setRoom('');
        setBed('');
        setRooms([]);
        setBeds([]);
    };

    const handleRoomChange = (newRoom: string) => {
        setRoom(newRoom);
        setBed('');
        setBeds([]);
    };

    // Load registered patients
    useEffect(() => {
        let isMounted = true;
        const fetchPatients = async () => {
            try {
                const data = await admissionsService.listPatients({
                    unitId: unitId || undefined,
                    allUnits: !unitId
                });
                if (isMounted) {
                    setPatients(data);
                    setLoadingPatients(false);
                }
            } catch (err) {
                console.error('Failed to load patients for lookup:', err);
                if (isMounted) {
                    setLoadingPatients(false);
                }
            }
        };
        void fetchPatients();
        return () => { isMounted = false; };
    }, [unitId]);

    // Load floors when unit changes
    useEffect(() => {
        if (!unitId) return;
        let isMounted = true;
        const fetchFloors = async () => {
            const data = await admissionsService.getMasterFloors(unitId);
            if (isMounted) {
                setFloors(data);
            }
        };
        void fetchFloors();
        return () => { isMounted = false; };
    }, [unitId]);

    // Load rooms when unit/floor changes
    useEffect(() => {
        if (!unitId) return;
        let isMounted = true;
        const fetchRooms = async () => {
            const data = await admissionsService.getMasterRooms(unitId, floor || undefined);
            if (isMounted) {
                setRooms(data);
            }
        };
        void fetchRooms();
        return () => { isMounted = false; };
    }, [unitId, floor]);

    // Load beds when room changes
    useEffect(() => {
        if (!room) return;
        let isMounted = true;
        const fetchBeds = async () => {
            const data = await admissionsService.getMasterBeds(room);
            if (isMounted) {
                setBeds(data);
            }
        };
        void fetchBeds();
        return () => { isMounted = false; };
    }, [room]);

    const filteredPatients = patients.filter(p => {
        if (!patientSearch.trim()) return true;
        const q = patientSearch.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.phone?.includes(q);
    });

    const [loadingPatientDetails, setLoadingPatientDetails] = useState(false);

    const handleSelectPatient = async (p: Patient) => {
        setSelectedPatient(p);
        if (p.unitId && p.unitId !== unitId) {
            setUnitId(p.unitId);
        }
        let guardian = (p.primaryContact || p.name || '').trim();
        let phone = (p.phone || p.emergencyContact || '').trim();
        let email = (p.email || '').trim();

        // Apply immediately whatever is already on p
        setSignedByName(guardian);
        setPortalGuardianName(guardian);
        setPortalMobile(phone);
        setPortalUsername(phone || (p.name ? p.name.toLowerCase().replace(/\s+/g, '_') : ''));
        setPortalEmail(email);
        setPortalPassword('');
        setError(null);

        // Fetch full demographic profile because GET /operations/patients only returns a slim summary omitting phone & contact info
        if (p.id) {
            try {
                setLoadingPatientDetails(true);
                const fullP = await admissionsService.getPatient(p.id);
                if (fullP) {
                    setSelectedPatient(prev => ({ ...(prev || p), ...fullP }));
                    guardian = (fullP.primaryContact || fullP.name || guardian).trim();
                    phone = (fullP.phone || fullP.emergencyContact || phone).trim();
                    email = (fullP.email || email).trim();

                    setSignedByName(guardian);
                    setPortalGuardianName(guardian);
                    setPortalMobile(phone);
                    setPortalUsername(phone || (fullP.name ? fullP.name.toLowerCase().replace(/\s+/g, '_') : ''));
                    setPortalEmail(email);
                }
            } catch (err) {
                console.warn('Could not fetch full patient profile for autofill:', err);
            } finally {
                setLoadingPatientDetails(false);
            }
        }
    };

    const handleTogglePortalAccess = async (checked: boolean) => {
        setEnablePortalAccess(checked);
        if (checked && selectedPatient) {
            let phone = (portalMobile || selectedPatient.phone || selectedPatient.emergencyContact || '').trim();
            let guardian = (portalGuardianName || selectedPatient.primaryContact || selectedPatient.name || '').trim();
            let email = (portalEmail || selectedPatient.email || '').trim();

            if (!phone && selectedPatient.id) {
                try {
                    setLoadingPatientDetails(true);
                    const fullP = await admissionsService.getPatient(selectedPatient.id);
                    if (fullP) {
                        setSelectedPatient(prev => ({ ...(prev || selectedPatient), ...fullP }));
                        phone = (fullP.phone || fullP.emergencyContact || phone).trim();
                        guardian = (fullP.primaryContact || fullP.name || guardian).trim();
                        email = (fullP.email || email).trim();
                    }
                } catch (err) {
                    console.warn('Error fetching patient details on portal access toggle:', err);
                } finally {
                    setLoadingPatientDetails(false);
                }
            }

            if (guardian) setPortalGuardianName(guardian);
            if (phone) {
                setPortalMobile(phone);
                if (!portalUsername || portalUsername === selectedPatient.name.toLowerCase().replace(/\s+/g, '_')) {
                    setPortalUsername(phone);
                }
            }
            if (email) setPortalEmail(email);
        }
    };

    useEffect(() => {
        if (initialPatient) {
            void handleSelectPatient(initialPatient);
        }
    }, [initialPatient]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!selectedPatient) {
            setError('Please select a registered patient to admit.');
            return;
        }

        if (!unitId) {
            setError('Please choose an operating care unit.');
            return;
        }

        if (consentAcknowledged && !signedByName.trim()) {
            setError('Signer full name is required for admission consent.');
            return;
        }

        if (enablePortalAccess) {
            if (!portalMobile.trim()) {
                setError('Guardian mobile number is required to enable Family Portal login access.');
                return;
            }
            if (!portalPassword.trim()) {
                setError('Please manually enter a PIN / Password for the family portal access account.');
                return;
            }
        }

        try {
            setIsSubmitting(true);
            const payload: CreateAdmissionPayload = {
                patientId: selectedPatient.id,
                unitId: selectedPatient.unitId || unitId,
                admissionPriority,
                healthCondition,
                clinicalStatus,
                floor: floor || undefined,
                room: room || undefined,
                bed: bed || undefined,
                consent: consentAcknowledged ? {
                    acknowledged: true,
                    signedByName: signedByName.trim(),
                    signerRelation,
                    consentType: 'ADMISSION',
                    version: '1.0',
                    title: 'Resident Admission Consent & Care Agreement',
                    content: 'Resident and guardian acknowledge admission guidelines, medical emergency authorization, and facility terms of service.'
                } : undefined,
                guardianPortalAccess: enablePortalAccess ? {
                    enabled: true,
                    guardianName: (portalGuardianName || signedByName || selectedPatient.name).trim(),
                    mobile: portalMobile.trim(),
                    password: portalPassword.trim(),
                    email: portalEmail.trim() || undefined,
                } : undefined
            };

            const created = await admissionsService.createAdmission(payload);

            if (enablePortalAccess) {
                const finalUsername = (portalUsername || portalMobile).trim();
                const matchedUnit = units.find((u) => u.id === (selectedPatient.unitId || unitId));
                saveProvisionedPortalUser({
                    admissionId: created.id,
                    patientId: selectedPatient.id,
                    patientName: selectedPatient.name,
                    guardianName: (portalGuardianName || signedByName || selectedPatient.name).trim(),
                    username: finalUsername,
                    mobile: portalMobile.trim(),
                    password: portalPassword.trim(),
                    email: portalEmail.trim() || undefined,
                    room: room || undefined,
                    bed: bed || undefined,
                    floor: floor || undefined,
                    unitId: selectedPatient.unitId || unitId,
                    unitName: matchedUnit?.name || 'Authorized Care Facility',
                    createdAt: new Date().toISOString(),
                    status: 'ACTIVE'
                });
            }

            setSuccessAdmission(created);
            onAdmissionCompleted(created);
        } catch (err: unknown) {
            console.error('Admission failed:', err);
            const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to complete admission';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (successAdmission) {
        return (
            <div className="adm-success-card">
                <div className="adm-success-icon-wrap">
                    <CheckCircle2 size={40} className="adm-text-success" />
                </div>
                <h2>Resident Admitted Successfully!</h2>
                <p>
                    Admission record for <strong>{selectedPatient?.name}</strong> has been registered. Bed allocation and clinical tracking workflows are activated.
                </p>
                <div className="adm-success-meta">
                    <div>
                        <span>Admission ID</span>
                        <code>{successAdmission.id}</code>
                    </div>
                    <div>
                        <span>Location</span>
                        <strong>Room {successAdmission.room || '-'} / {successAdmission.bed || '-'}</strong>
                    </div>
                    <div>
                        <span>Priority</span>
                        <span className="adm-badge adm-badge--info">{successAdmission.admissionPriority || 'NORMAL'}</span>
                    </div>
                </div>

                {enablePortalAccess && (
                    <div style={{
                        marginTop: 20,
                        padding: '16px 20px',
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: 12,
                        textAlign: 'left'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <ShieldCheck size={18} color="#15803d" />
                                <strong style={{ color: '#14532d', fontSize: '0.95rem' }}>Family / Guardian Portal Access Activated</strong>
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: 9999 }}>
                                UNIFIED SIGN-IN READY
                            </span>
                        </div>
                        <p style={{ margin: '0 0 12px 0', fontSize: '0.825rem', color: '#166534' }}>
                            The resident&apos;s family can now sign in directly at the central login screen using their mobile number:
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, background: '#ffffff', padding: 12, borderRadius: 8, border: '1px solid #dcfce7' }}>
                            <div>
                                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Login Portal</span>
                                <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>Central /login Screen</strong>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Login Username</span>
                                <code style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 700 }}>{portalUsername || portalMobile}</code>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Registered Mobile</span>
                                <code style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 700 }}>{portalMobile}</code>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Password / PIN</span>
                                <code style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 700 }}>{portalPassword}</code>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Guardian Account</span>
                                <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{portalGuardianName || signedByName || selectedPatient?.name}</strong>
                            </div>
                        </div>
                        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                            <button
                                type="button"
                                className="adm-btn adm-btn--secondary"
                                onClick={() => {
                                    const text = `Welcome to UNCF Elder Care!\n\nYou can access the live Resident Care & Vitals Portal at ${window.location.origin}/login\nUsername: ${portalUsername || portalMobile}\nRegistered Mobile: ${portalMobile}\nPassword: ${portalPassword}\nResident: ${selectedPatient?.name}`;
                                    void navigator.clipboard.writeText(text);
                                    setCopiedCredentials(true);
                                    setTimeout(() => setCopiedCredentials(false), 3000);
                                }}
                                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                            >
                                <Copy size={14} />
                                <span>{copiedCredentials ? 'Copied to Clipboard!' : 'Copy Login Details for Family'}</span>
                            </button>
                        </div>
                    </div>
                )}

                <div className="adm-action-row" style={{ marginTop: 24, justifyContent: 'center' }}>
                    <button
                        type="button"
                        className="adm-btn adm-btn--primary"
                        onClick={() => {
                            setSuccessAdmission(null);
                            setSelectedPatient(null);
                            setRoom('');
                            setBed('');
                        }}
                    >
                        <span>Admit Another Resident</span>
                        <ArrowRight size={15} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="adm-form-layout">
            {error && (
                <div className="adm-alert adm-alert--error" style={{ marginBottom: 20 }}>
                    <AlertCircle size={16} />
                    <div>
                        <strong>Admission Error</strong>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="adm-form">
                {/* Section 1: Patient Selection */}
                <div className="adm-form-section">
                    <div className="adm-section-header">
                        <div className="adm-section-number">01</div>
                        <div>
                            <h3>Select Resident / Patient</h3>
                            <p>Choose an already registered patient or register a new master profile.</p>
                        </div>
                    </div>

                    {selectedPatient ? (
                        <div className="adm-selected-patient-box">
                            <div className="adm-selected-avatar">
                                <UserCheck size={24} />
                            </div>
                            <div className="adm-selected-details">
                                <div className="adm-selected-name-row">
                                    <h4>{selectedPatient.name}</h4>
                                    <span className="adm-badge adm-badge--success">Selected</span>
                                </div>
                                <div className="adm-selected-meta">
                                    <span>Phone: {selectedPatient.phone || (loadingPatientDetails ? 'Fetching phone...' : '-')}</span>
                                    <span>Age: {selectedPatient.age ? `${selectedPatient.age} yrs` : (loadingPatientDetails ? 'Loading...' : '-')}</span>
                                    <span>Gender: {selectedPatient.gender || (loadingPatientDetails ? 'Loading...' : '-')}</span>
                                    <span>Blood Group: {selectedPatient.bloodGroup || (loadingPatientDetails ? 'Loading...' : '-')}</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="adm-btn adm-btn--sm adm-btn--secondary"
                                onClick={() => setSelectedPatient(null)}
                            >
                                Change Patient
                            </button>
                        </div>
                    ) : (
                        <div className="adm-patient-lookup-box">
                            <div className="adm-lookup-bar">
                                <Search size={15} className="adm-search-icon" />
                                <input
                                    type="text"
                                    className="adm-input"
                                    placeholder="Search registered patients by name or phone..."
                                    value={patientSearch}
                                    onChange={(e) => setPatientSearch(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="adm-btn adm-btn--secondary"
                                    onClick={onNavigateRegisterPatient}
                                >
                                    + Register New Patient
                                </button>
                            </div>

                            <div className="adm-lookup-list">
                                {loadingPatients ? (
                                    <div className="adm-loading-state" style={{ padding: '20px 0' }}>
                                        <span className="adm-spinner" />
                                        <p>Searching registered patients...</p>
                                    </div>
                                ) : filteredPatients.length === 0 ? (
                                    <div className="adm-empty-compact">
                                        <p>No matching patient found in the active scope.</p>
                                        <button
                                            type="button"
                                            className="adm-btn adm-btn--sm adm-btn--primary"
                                            onClick={onNavigateRegisterPatient}
                                        >
                                            Register Patient Now
                                        </button>
                                    </div>
                                ) : (
                                    filteredPatients.slice(0, 5).map(p => (
                                        <div
                                            key={p.id}
                                            className="adm-lookup-item"
                                            onClick={() => handleSelectPatient(p)}
                                        >
                                            <div className="adm-lookup-item-info">
                                                <strong>{p.name}</strong>
                                                <span>{p.phone || 'No phone'} · {p.age ? `${p.age}y` : ''} {p.gender ? `· ${p.gender}` : ''}</span>
                                            </div>
                                            <button
                                                type="button"
                                                className="adm-btn adm-btn--sm adm-btn--secondary"
                                            >
                                                Select
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Section 2: Operating Facility & Stay Location */}
                <div className="adm-form-section">
                    <div className="adm-section-header">
                        <div className="adm-section-number">02</div>
                        <div>
                            <h3>Facility & Bed Allocation</h3>
                            <p>Assign the resident to an authorized operating unit, floor, room, and bed.</p>
                        </div>
                    </div>

                    <div className="adm-grid-2">
                        <label className="adm-field">
                            <span className="adm-field-label">Care Unit / Operating Facility *</span>
                            <select
                                className="adm-select"
                                value={unitId}
                                onChange={(e) => handleUnitChange(e.target.value)}
                                required
                            >
                                {units.map((u: UnitInfo) => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                                ))}
                            </select>
                        </label>

                        <label className="adm-field">
                            <span className="adm-field-label">Floor</span>
                            {floors.length > 0 ? (
                                <select
                                    className="adm-select"
                                    value={floor}
                                    onChange={(e) => handleFloorChange(e.target.value)}
                                >
                                    <option value="">Select Floor...</option>
                                    {floors.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    className="adm-input"
                                    placeholder="e.g. Ground Floor, 1st Floor"
                                    value={floor}
                                    onChange={(e) => handleFloorChange(e.target.value)}
                                />
                            )}
                        </label>

                        <label className="adm-field">
                            <span className="adm-field-label">Room Number</span>
                            {rooms.length > 0 ? (
                                <select
                                    className="adm-select"
                                    value={room}
                                    onChange={(e) => handleRoomChange(e.target.value)}
                                >
                                    <option value="">Select Room...</option>
                                    {rooms.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    className="adm-input"
                                    placeholder="e.g. Room 101, Deluxe 2"
                                    value={room}
                                    onChange={(e) => handleRoomChange(e.target.value)}
                                />
                            )}
                        </label>

                        <label className="adm-field">
                            <span className="adm-field-label">Bed Allocation</span>
                            {beds.length > 0 ? (
                                <select
                                    className="adm-select"
                                    value={bed}
                                    onChange={(e) => setBed(e.target.value)}
                                >
                                    <option value="">Select Bed...</option>
                                    {beds.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    className="adm-input"
                                    placeholder="e.g. Bed 1, Bed A"
                                    value={bed}
                                    onChange={(e) => setBed(e.target.value)}
                                />
                            )}
                        </label>
                    </div>
                </div>

                {/* Section 3: Clinical Triage & Priority */}
                <div className="adm-form-section">
                    <div className="adm-section-header">
                        <div className="adm-section-number">03</div>
                        <div>
                            <h3>Clinical Triage & Condition</h3>
                            <p>Specify resident intake priority, medical condition, and mobility status.</p>
                        </div>
                    </div>

                    <div className="adm-grid-3">
                        <label className="adm-field">
                            <span className="adm-field-label">Admission Priority</span>
                            <select
                                className="adm-select"
                                value={admissionPriority}
                                onChange={(e) => setAdmissionPriority(e.target.value)}
                            >
                                <option value="NORMAL">Normal Priority</option>
                                <option value="HIGH">High Priority</option>
                                <option value="URGENT">Urgent Priority</option>
                                <option value="CRITICAL">Critical Care</option>
                            </select>
                        </label>

                        <label className="adm-field">
                            <span className="adm-field-label">Health Condition</span>
                            <select
                                className="adm-select"
                                value={healthCondition}
                                onChange={(e) => setHealthCondition(e.target.value)}
                            >
                                <option value="STABLE">Stable</option>
                                <option value="FAIR">Fair</option>
                                <option value="SERIOUS">Serious</option>
                                <option value="CRITICAL">Critical</option>
                            </select>
                        </label>

                        <label className="adm-field">
                            <span className="adm-field-label">Mobility / Clinical Status</span>
                            <select
                                className="adm-select"
                                value={clinicalStatus}
                                onChange={(e) => setClinicalStatus(e.target.value)}
                            >
                                <option value="AMBULATORY">Ambulatory (Independent)</option>
                                <option value="ASSISTED">Assisted Mobility</option>
                                <option value="WHEELCHAIR">Wheelchair Bound</option>
                                <option value="BEDRIDDEN">Bedridden</option>
                            </select>
                        </label>
                    </div>
                </div>

                {/* Section 4: Resident Consent Agreement */}
                <div className="adm-form-section">
                    <div className="adm-section-header">
                        <div className="adm-section-number">04</div>
                        <div>
                            <h3>Legal Consent & Agreement</h3>
                            <p>Capture admission consent acknowledged by resident or guardian.</p>
                        </div>
                    </div>

                    <div className="adm-consent-container">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--adm-text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Statutory Consent Terms
                            </span>
                            <button
                                type="button"
                                className="adm-btn adm-btn--secondary"
                                onClick={() => setIsConsentModalOpen(true)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '5px 12px',
                                    fontSize: '0.825rem',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                }}
                            >
                                <FileText size={15} />
                                <span>Read Consent Form</span>
                            </button>
                        </div>

                        <label className="adm-checkbox-label">
                            <input
                                type="checkbox"
                                checked={consentAcknowledged}
                                onChange={(e) => setConsentAcknowledged(e.target.checked)}
                            />
                            <span>
                                <strong>Record Admission Consent:</strong> Resident / guardian agrees to facility terms of service, medical treatment authorization, and data privacy guidelines.
                            </span>
                        </label>

                        {consentAcknowledged && (
                            <div className="adm-grid-2" style={{ marginTop: 14 }}>
                                <label className="adm-field">
                                    <span className="adm-field-label">Signer / Guardian Full Name *</span>
                                    <input
                                        type="text"
                                        className="adm-input"
                                        placeholder="Full legal name of person signing consent"
                                        value={signedByName}
                                        onChange={(e) => setSignedByName(e.target.value)}
                                        required={consentAcknowledged}
                                    />
                                </label>

                                <label className="adm-field">
                                    <span className="adm-field-label">Signer Relationship to Resident</span>
                                    <select
                                        className="adm-select"
                                        value={signerRelation}
                                        onChange={(e) => setSignerRelation(e.target.value)}
                                    >
                                        <option value="GUARDIAN">Guardian / Authorized Representative</option>
                                        <option value="SELF">Self (Resident)</option>
                                        <option value="SPOUSE">Spouse</option>
                                        <option value="CHILD">Son / Daughter</option>
                                        <option value="OTHER">Other Relative / Attendant</option>
                                    </select>
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {/* Section 05: Family & Guardian Portal Access */}
                <div className="adm-form-section">
                    <div className="adm-section-header">
                        <div className="adm-section-number">05</div>
                        <div>
                            <h3>Family & Guardian Digital Portal Access</h3>
                            <p>Ask if the family needs secure digital access to track health vitals, daily care updates, doctor visits, and invoices.</p>
                        </div>
                    </div>

                    <div className="adm-consent-container" style={{ borderColor: enablePortalAccess ? '#86efac' : undefined, background: enablePortalAccess ? '#f0fdf4' : undefined }}>
                        <label className="adm-checkbox-label">
                            <input
                                type="checkbox"
                                checked={enablePortalAccess}
                                onChange={(e) => void handleTogglePortalAccess(e.target.checked)}
                            />
                            <span>
                                <strong>Grant Digital Portal Access to Guardian:</strong> Enable the resident&apos;s family/guardian to log in at the central ERP portal using their registered mobile number.
                            </span>
                        </label>

                        {enablePortalAccess && (
                            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #dcfce7' }}>
                                <div className="adm-grid-2">
                                    <label className="adm-field">
                                        <span className="adm-field-label">Guardian / Account Name *</span>
                                        <input
                                            type="text"
                                            className="adm-input"
                                            placeholder="e.g. Son, Daughter, Legal Guardian"
                                            value={portalGuardianName}
                                            onChange={(e) => setPortalGuardianName(e.target.value)}
                                            required={enablePortalAccess}
                                        />
                                    </label>

                                    <label className="adm-field">
                                        <span className="adm-field-label">Login Mobile Number *</span>
                                        <input
                                            type="tel"
                                            className="adm-input"
                                            placeholder="10-digit mobile number"
                                            value={portalMobile}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setPortalMobile(val);
                                                if (!portalUsername || portalUsername === portalMobile) {
                                                    setPortalUsername(val);
                                                }
                                            }}
                                            required={enablePortalAccess}
                                        />
                                    </label>

                                    <label className="adm-field">
                                        <span className="adm-field-label">Login Username (Custom or Mobile)</span>
                                        <input
                                            type="text"
                                            className="adm-input"
                                            placeholder="e.g. 9487946316 or guardian_name"
                                            value={portalUsername || portalMobile}
                                            onChange={(e) => setPortalUsername(e.target.value)}
                                        />
                                        <span style={{ fontSize: '0.72rem', color: '#166534', marginTop: 4 }}>
                                            Guardian can enter either their <strong>Username</strong> or <strong>Mobile Number</strong> at login.
                                        </span>
                                    </label>

                                    <label className="adm-field">
                                        <span className="adm-field-label">Portal Password / PIN * (Enter Manually)</span>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <input
                                                type="text"
                                                className="adm-input"
                                                placeholder="Enter manual PIN or click PIN to generate"
                                                value={portalPassword}
                                                onChange={(e) => setPortalPassword(e.target.value)}
                                                required={enablePortalAccess}
                                            />
                                            <button
                                                type="button"
                                                className="adm-btn adm-btn--secondary"
                                                onClick={() => {
                                                    const pin = Math.floor(100000 + Math.random() * 900000).toString();
                                                    setPortalPassword(pin);
                                                }}
                                                title="Generate 6-digit PIN"
                                                style={{ whiteSpace: 'nowrap', padding: '0 10px', fontSize: '0.75rem' }}
                                            >
                                                PIN
                                            </button>
                                        </div>
                                    </label>
                                </div>

                                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#166534' }}>
                                    <Sparkles size={14} color="#15803d" />
                                    <span>Family can use this mobile number and password directly at the main sign-in screen to view resident vitals & bills.</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit Action */}
                <div className="adm-form-submit-row">
                    <button
                        type="submit"
                        className="adm-btn adm-btn--primary"
                        disabled={isSubmitting || !selectedPatient}
                    >
                        <UserCheck size={16} />
                        <span>{isSubmitting ? 'Processing Admission...' : 'Confirm & Complete Admission'}</span>
                    </button>
                    {!selectedPatient && (
                        <span className="adm-submit-hint">
                            Please select a patient in step 01 to proceed.
                        </span>
                    )}
                </div>
            </form>

            {/* Read Consent Form Modal */}
            <ConsentFormModal
                isOpen={isConsentModalOpen}
                onClose={() => setIsConsentModalOpen(false)}
                patientName={selectedPatient?.name}
            />
        </div>
    );
}
