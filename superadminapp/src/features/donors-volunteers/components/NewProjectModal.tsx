import { useState } from 'react';
import { X, FolderPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { donorsVolunteersService } from '../donorsVolunteers.service';
import type { Project } from '../donorsVolunteers.types';

interface NewProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (project: Project) => void;
    activeUnitId?: string | null;
}

export function NewProjectModal(props: NewProjectModalProps) {
    if (!props.isOpen) return null;
    return <NewProjectModalContent {...props} />;
}

function NewProjectModalContent({
    onClose,
    onSuccess,
    activeUnitId
}: NewProjectModalProps) {
    const [name, setName] = useState('');
    const [totalBudget, setTotalBudget] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('ACTIVE');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Project name is required.');
            return;
        }
        if (!totalBudget || Number(totalBudget) <= 0) {
            setError('Please enter a valid target budget.');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const created = await donorsVolunteersService.createProject({
                name: name.trim(),
                totalBudget: Number(totalBudget),
                description: description.trim() || undefined,
                status
            }, activeUnitId);
            onSuccess(created);
            onClose();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to create charitable project.';
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
                    maxWidth: 500,
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
                                background: 'rgba(59, 130, 246, 0.12)',
                                color: '#3b82f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <FolderPlus size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                                Create Charitable Project
                            </h3>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                UNCF Foundation Project Registry
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
                    <div style={{ padding: '1.25rem 1.5rem' }}>
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

                        <div style={{ marginBottom: '1rem' }}>
                            <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                Project Name *
                            </label>
                            <input
                                type="text"
                                className="erp-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Free Medical Camp 2026, Senior Dialysis Fund"
                                required
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                    Target Budget (INR) *
                                </label>
                                <input
                                    type="number"
                                    className="erp-input"
                                    value={totalBudget}
                                    onChange={(e) => setTotalBudget(e.target.value)}
                                    placeholder="e.g. 500000"
                                    required
                                    style={{ width: '100%', fontWeight: 600 }}
                                />
                            </div>
                            <div>
                                <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                    Initial Status
                                </label>
                                <select
                                    className="erp-input"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    style={{ width: '100%' }}
                                >
                                    <option value="ACTIVE">Active</option>
                                    <option value="PLANNED">Planned</option>
                                    <option value="COMPLETED">Completed</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: '0.5rem' }}>
                            <label className="erp-label" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                Project Objectives & Description
                            </label>
                            <textarea
                                className="erp-input"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Scope, beneficiaries, timeline..."
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
                                background: '#3b82f6',
                                borderColor: '#3b82f6',
                                color: '#ffffff'
                            }}
                        >
                            <CheckCircle2 size={16} />
                            {isSubmitting ? 'Creating...' : 'Register Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
