import { useState, useEffect, useCallback } from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';

interface VisitorMaterialEntryProps {
    onChange: (materialDetails: string | null) => void;
    onValidityChange: (isValid: boolean) => void;
}

interface MaterialRow {
    id: string;
    itemType: string;
    customName: string;
    quantity: number;
}

const COMMON_ITEMS = [
    'Medicines',
    'Documents',
    'Food',
    'Clothes',
    'Medical Equipment',
    'Electrical Items',
    'Tools',
    'Spare Parts',
    'Cleaning Materials',
    'Office Supplies',
    'Parcel',
    'Donation Items',
    'Other / Custom Item'
];

export function VisitorMaterialEntry({ onChange, onValidityChange }: VisitorMaterialEntryProps) {
    const [rows, setRows] = useState<MaterialRow[]>([{
        id: crypto.randomUUID(),
        itemType: '',
        customName: '',
        quantity: 1
    }]);

    const compileValue = useCallback((currentRows: MaterialRow[]): string | null => {
        const validRows = currentRows.filter(row => {
            if (row.itemType === 'Other / Custom Item') {
                return row.customName.trim().length > 0 && row.quantity > 0;
            }
            return row.itemType.length > 0 && row.quantity > 0;
        });

        if (validRows.length === 0) return null;

        return validRows.map(row => {
            const name = row.itemType === 'Other / Custom Item' ? row.customName.trim() : row.itemType;
            return `${name} × ${row.quantity}`;
        }).join(', ');
    }, []);

    const validate = useCallback((currentRows: MaterialRow[]): boolean => {
        if (currentRows.length === 0) return false;
        
        for (const row of currentRows) {
            if (!row.itemType) return false;
            if (row.itemType === 'Other / Custom Item' && !row.customName.trim()) return false;
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
        if (rows.length === 1) return;
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

    return (
        <div className="space-y-4">
            {rows.map((row, index) => {
                const isCustom = row.itemType === 'Other / Custom Item';
                const isInvalidCustom = isCustom && !row.customName.trim();
                
                return (
                    <div key={row.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 relative">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-bold text-slate-700">Material {index + 1}</h4>
                            {rows.length > 1 && (
                                <button 
                                    type="button" 
                                    onClick={() => removeRow(row.id)}
                                    className="text-slate-400 hover:text-rose-500 transition-colors"
                                    aria-label="Remove item"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Item Name</label>
                                <select 
                                    value={row.itemType} 
                                    onChange={(e) => updateRow(row.id, 'itemType', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-500 bg-white"
                                >
                                    <option value="">Select Item</option>
                                    {COMMON_ITEMS.map(item => (
                                        <option key={item} value={item}>{item}</option>
                                    ))}
                                </select>
                            </div>

                            {isCustom && (
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-slate-700">Custom Item Name</label>
                                    <input 
                                        type="text" 
                                        value={row.customName}
                                        onChange={(e) => updateRow(row.id, 'customName', e.target.value)}
                                        className={`w-full rounded-xl border p-2.5 outline-none focus:border-indigo-500 ${isInvalidCustom ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}`}
                                        placeholder="Please specify..."
                                    />
                                    {isInvalidCustom && (
                                        <p className="text-xs text-rose-500 mt-1 font-semibold">Custom name is required.</p>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Quantity</label>
                                <div className="flex items-center">
                                    <button 
                                        type="button"
                                        onClick={() => handleDecrement(row.id, row.quantity)}
                                        className="h-10 w-10 flex items-center justify-center rounded-l-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
                                        aria-label="Decrease quantity"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <input 
                                        type="text"
                                        inputMode="numeric"
                                        value={row.quantity || ''}
                                        onChange={(e) => handleQuantityChange(row.id, e.target.value)}
                                        onBlur={(e) => {
                                            const val = parseInt(e.target.value, 10);
                                            if (isNaN(val) || val < 1) updateRow(row.id, 'quantity', 1);
                                        }}
                                        className="h-10 w-16 border-y border-slate-200 text-center outline-none font-bold text-slate-700"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => handleIncrement(row.id, row.quantity)}
                                        className="h-10 w-10 flex items-center justify-center rounded-r-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
                                        aria-label="Increase quantity"
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
                className="flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
                <Plus className="w-4 h-4 mr-1" />
                Add Another Item
            </button>
        </div>
    );
}
