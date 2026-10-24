import React from 'react';
import { useLinkableUsers } from '../features/hr/hooks/useHR';
import { Select } from './Select';

interface UserSelectorProps {
    value?: string | null;
    onChange: (userId: string, userName?: string) => void;
    label?: string;
    error?: string;
    required?: boolean;
    className?: string;
}

export function UserSelector({
    value,
    onChange,
    label = 'Select User Account to Link',
    error,
    required = false,
    className = ''
}: UserSelectorProps) {
    const { data: users, isLoading } = useLinkableUsers();

    const options = [{ value: '', label: 'None (Do not link a user account)' }];
    
    if (users) {
        users.forEach((u: any) => {
            const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown Name';
            const unitPart = u.unitName ? ` [${u.unitName}]` : '';
            const empIdPart = u.empId ? ` - ${u.empId}` : '';
            const emailPart = u.email ? ` (${u.email})` : '';
            const linkedStatus = (u.isLinked && u.id !== value) ? ' [Already Linked]' : '';
            
            options.push({
                value: u.id,
                label: `${name}${unitPart}${empIdPart}${emailPart}${linkedStatus}`
            });
        });
    }

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        const selectedOption = options.find(o => o.value === selectedId);
        onChange(selectedId, selectedOption?.label);
    };

    return (
        <Select
            label={label}
            value={value || ''}
            onChange={handleChange}
            error={error}
            required={required}
            className={className}
            options={options}
            disabled={isLoading}
        />
    );
}
