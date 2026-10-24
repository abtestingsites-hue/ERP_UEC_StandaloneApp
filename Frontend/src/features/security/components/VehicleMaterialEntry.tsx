import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';

interface VehicleMaterialEntryProps {
    vehicleType: string;
    onChange: (materialDetails: string | null) => void;
    onValidityChange: (isValid: boolean) => void;
}

interface MaterialRow {
    id: string;
    itemType: string;
    customName: string;
    quantity: number;
}

const VEHICLE_TYPE_MATERIAL_MAP: Record<string, string[]> = {
    'Delivery Vehicle': ['Food / Grocery', 'Medicines', 'Medical Supplies', 'Documents', 'Packages / Parcels', 'General Supplies', 'Equipment', 'Other'],
    'Truck': ['Furniture', 'Food Supplies', 'Medical Supplies', 'Construction / Maintenance Material', 'Equipment', 'General Goods', 'Other'],
    'Mini Truck': ['Furniture', 'Food Supplies', 'Medical Supplies', 'Construction / Maintenance Material', 'Equipment', 'General Goods', 'Other'],
    'Ambulance': ['Medical Equipment', 'Medicines', 'Medical Documents', 'Patient Belongings', 'Other'],
    'Service Vehicle': ['Tools', 'Spare Parts', 'Equipment', 'Maintenance Material', 'Other'],
    'Other': ['Documents', 'Packages', 'Equipment', 'Personal Items', 'Other']
};

export function VehicleMaterialEntry({ vehicleType, onChange, onValidityChange }: VehicleMaterialEntryProps) {
    const [rows, setRows] = useState<MaterialRow[]>([]);

    useEffect(() => {
        const finalType = VEHICLE_TYPE_MATERIAL_MAP[vehicleType] ? vehicleType : 'Other';
        const validOptions = VEHICLE_TYPE_MATERIAL_MAP[finalType];
        
        setRows(prevRows => {
            const newRows = prevRows.filter(row => {
                if (row.itemType === 'Other') return true;
                return validOptions.includes(row.itemType);
            });
            if (newRows.length === prevRows.length) return prevRows;
            return newRows;
        });
    }, [vehicleType]);

    const compileValue = useCallback((currentRows: MaterialRow[]): string | null => {
        const validRows = currentRows.filter(row => {
            if (row.itemType === 'Other') {
                return row.customName.trim().length > 0 && row.quantity > 0;
            }
            return row.itemType.length > 0 && row.quantity > 0;
        });

        if (validRows.length === 0) return null;

        return validRows.map(row => {
            const name = row.itemType === 'Other' ? row.customName.trim() : row.itemType;
            return `${name} × ${row.quantity}`;
        }).join(', ');
    }, []);

    const validate = useCallback((currentRows: MaterialRow[]): boolean => {
        if (currentRows.length === 0) return true;
        
        for (const row of currentRows) {
            if (!row.itemType) return false;
            if (row.itemType === 'Other' && !row.customName.trim()) return false;
            if (row.quantity < 1 || isNaN(row.quantity)) return false;
        }
        return true;
    }, []);

    useEffect(() => {
        onChange(compileValue(rows));
        onValidityChange(validate(rows));
    }, [rows, onChange, onValidityChange, compileValue, validate]);

    const addRow = () => {
        setRows([...rows, {
            id: crypto.randomUUID(),
            itemType: '',
            customName: '',
            quantity: 1
        }]);
    };

    const removeRow = (id: string) => {
        setRows(rows.filter(r => r.id !== id));
    };

    const updateRow = (id: string, field: keyof MaterialRow, value: any) => {
        setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleQuantityChange = (id: string, value: string) => {
        const parsed = parseInt(value, 10);
        updateRow(id, 'quantity', isNaN(parsed) ? 0 : parsed);
    };

    const handleIncrement = (id: string, currentQty: number) => {
        updateRow(id, 'quantity', Math.max(1, currentQty + 1));
    };

    const handleDecrement = (id: string, currentQty: number) => {
        updateRow(id, 'quantity', Math.max(1, currentQty - 1));
    };

    const finalType = VEHICLE_TYPE_MATERIAL_MAP[vehicleType] ? vehicleType : 'Other';
    const currentOptions = VEHICLE_TYPE_MATERIAL_MAP[finalType];

    return (
        <div className="space-y-4">
            {rows.map((row, index) => {
                const isCustom = row.itemType === 'Other';
                const isInvalidCustom = isCustom && !row.customName.trim();
                
                return (
                    <div key={row.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 relative">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-bold text-slate-700">Material {index + 1}</h4>
                            <button 
                                type="button" 
                                onClick={() => removeRow(row.id)}
                                className="text-slate-400 hover:text-rose-500 transition-colors"
                                aria-label="Remove item"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Item Category</label>
                                <select 
                                    value={row.itemType} 
                                    onChange={(e) => updateRow(row.id, 'itemType', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-primary-500 bg-white text-sm"
                                >
                                    <option value="">Select Item Category</option>
                                    {currentOptions.map(item => (
                                        <option key={item} value={item}>{item}</option>
                                    ))}
                                </select>
                            </div>

                            {isCustom && (
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                                        Custom Item Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input 
                                        type="text"
                                        value={row.customName}
                                        onChange={(e) => updateRow(row.id, 'customName', e.target.value)}
                                        placeholder="Enter item name"
                                        className={`w-full rounded-xl border p-2.5 outline-none bg-white text-sm ${isInvalidCustom ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-primary-500'}`}
                                    />
                                    {isInvalidCustom && (
                                        <p className="mt-1 text-xs text-rose-500">Custom name is required</p>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Quantity</label>
                                <div className="flex items-center space-x-2">
                                    <button 
                                        type="button" 
                                        onClick={() => handleDecrement(row.id, row.quantity)}
                                        className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <input 
                                        type="number"
                                        min="1"
                                        value={row.quantity || ''}
                                        onChange={(e) => handleQuantityChange(row.id, e.target.value)}
                                        className="w-20 rounded-xl border border-slate-200 p-2.5 text-center outline-none focus:border-primary-500 bg-white text-sm"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handleIncrement(row.id, row.quantity)}
                                        className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            <button
                type="button"
                onClick={addRow}
                className="flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors px-2 py-1 rounded-lg hover:bg-primary-50 w-fit"
            >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Material / Cargo
            </button>
        </div>
    );
}
