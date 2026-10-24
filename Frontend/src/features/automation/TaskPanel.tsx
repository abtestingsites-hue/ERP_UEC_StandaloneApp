import { useState } from 'react';
import { StatusHighlighter } from '../../components/StatusHighlighter';

export function TaskPanel() {
    const [tasks] = useState([
        { id: 1, type: 'AUTO', description: 'Immediate Follow-up required for VIP (HOT Lead)', status: 'ASSIGNED', time: 'Just now' }
    ]);

    return (
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 h-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Automation Tasks Queue</h2>
            <div className="space-y-3">
                {tasks.map(t => (
                    <div key={t.id} className="p-4 border-l-4 border-red-500 bg-red-50 rounded-r shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs font-bold text-red-600 uppercase tracking-wide">{t.type} TASK</span>
                                <h4 className="font-semibold text-gray-900 mt-1">{t.description}</h4>
                            </div>
                            <StatusHighlighter value={t.status} />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{t.time}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
