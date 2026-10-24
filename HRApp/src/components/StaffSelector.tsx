import React from 'react';
import { useStaff } from '../features/hr/hooks/useHR';
import { Select } from './Select';

interface StaffSelectorProps {
    value: string;
    onChange: (staffId: string, staffName?: string) => void;
    departmentId?: string;
    label?: string;
    error?: string;
    required?: boolean;
    className?: string;
}

export function StaffSelector({
    value,
    onChange,
    departmentId,
    label = 'Select Staff',
    error,
    required = false,
    className = ''
}: StaffSelectorProps) {
    const { data: staffList, isLoading } = useStaff(departmentId ? { scope: 'all' } : undefined);

    const options = staffList?.map((s: any) => ({
        value: s.id,
        label: s.firstName ? `${s.firstName} ${s.lastName || ''}`.trim() : (s.name || 'Unknown Staff')
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
            placeholder={isLoading ? 'Loading staff...' : 'Select a staff member...'}
            disabled={isLoading}
        />
    );
}
