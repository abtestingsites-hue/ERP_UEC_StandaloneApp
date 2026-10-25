
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';

export const useStaff = () => {
    return useQuery({
        queryKey: ['staff'],
        queryFn: async () => {
            const res = await api.get('/hr/staff');
            return res.data?.data || [];
        }
    });
};

interface StaffSelectorProps {
    value: string;
    onChange: (staffId: string) => void;
}

export function StaffSelector({ value, onChange }: StaffSelectorProps) {
    const { data: staffList = [], isLoading } = useStaff();

    const options = staffList.map((s: any) => ({
        id: s.id,
        name: s.firstName ? `${s.firstName} ${s.lastName || ''}`.trim() : (s.name || 'Unknown Staff')
    }));

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={isLoading}
            className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 pr-10 text-sm font-medium text-gray-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:opacity-50"
        >
            <option value="">-- Select Staff (Optional) --</option>
            {options.map((staff: any) => (
                <option key={staff.id} value={staff.id}>
                    {staff.name}
                </option>
            ))}
        </select>
    );
}
