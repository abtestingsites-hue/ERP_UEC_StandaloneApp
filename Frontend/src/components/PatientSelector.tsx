import React, { useState } from 'react';
import { usePatients } from '../hooks/usePatients';
import { Select } from './Select';

interface PatientSelectorProps {
    value: string;
    onChange: (patientId: string, patientName?: string) => void;
    label?: string;
    error?: string;
    required?: boolean;
    className?: string;
}

export function PatientSelector({
    value,
    onChange,
    label = 'Select Patient',
    error,
    required = false,
    className = ''
}: PatientSelectorProps) {
    // For a robust implementation we might want a debounced search input,
    // but for now we fetch all or rely on the backend lookup logic if search isn't provided.
    const { data: patients, isLoading } = usePatients('');

    const options = patients?.map((p: any) => ({
        value: p.id,
        label: p.name || (p.firstName ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : 'Unknown Patient')
    })) || [];

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        const selectedOption = options.find((o: any) => o.value === selectedId);
        onChange(selectedId, selectedOption?.label);
    };

    return (
        <Select
            label={label}
            value={value}
            onChange={handleChange}
            error={error}
            required={required}
            className={className}
            options={options}
            placeholder={isLoading ? 'Loading patients...' : 'Select a patient...'}
            disabled={isLoading}
        />
    );
}
