import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { Select } from './Select';

interface MasterDataSelectorProps {
    type: 'departments' | 'units' | 'floors' | 'rooms' | 'beds' | 'categories';
    value: string;
    onChange: (id: string, name?: string) => void;
    parentId?: string; // e.g., unitId for floors, floorId for rooms
    label?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
}

export function MasterDataSelector({
    type,
    value,
    onChange,
    parentId,
    label,
    error,
    required = false,
    disabled = false,
    className = ''
}: MasterDataSelectorProps) {
    const isParentRequired = type === 'floors' || type === 'rooms' || type === 'beds';
    const isParentMissing = isParentRequired && !parentId;

    const { data, isLoading } = useQuery({
        queryKey: ['master-data', type, parentId],
        queryFn: async () => {
            let url = `/master/${type}`;
            if (parentId) {
                const paramName = type === 'floors' ? 'unitId' : type === 'rooms' ? 'floorId' : type === 'beds' ? 'roomId' : 'parentId';
                url += `?${paramName}=${encodeURIComponent(parentId)}`;
            }
            const res = await api.get(url);
            return res.data?.data || res.data || [];
        },
        enabled: !isParentMissing
    });

    const options = data?.map((item: any) => ({
        value: typeof item === 'string' ? item : (item.id || item.code),
        label: typeof item === 'string' ? item : (item.name || item.code || item.title || item.id || 'Unknown')
    })) || [];

    const defaultLabel = label || `Select ${type.slice(0, -1)}...`;

    const getPlaceholder = () => {
        if (isLoading) return 'Loading...';
        if (isParentMissing) {
            const parentName = type === 'floors' ? 'unit' : type === 'rooms' ? 'floor' : type === 'beds' ? 'room' : 'parent';
            return `Select ${parentName} first...`;
        }
        if (!options.length) return `No ${type} available`;
        return `Select a ${type.slice(0, -1)}...`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        const selectedOption = options.find((o: any) => o.value === selectedId);
        onChange(selectedId, selectedOption?.label);
    };

    return (
        <Select
            label={defaultLabel}
            value={value}
            onChange={handleChange}
            error={error}
            required={required}
            className={className}
            options={options}
            placeholder={getPlaceholder()}
            disabled={disabled || isLoading || isParentMissing || !options.length}
        />
    );
}


