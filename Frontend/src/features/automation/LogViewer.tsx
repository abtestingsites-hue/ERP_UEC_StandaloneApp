import { useState } from 'react';

export function LogViewer() {
    // Mock Data mimicking what comes from Prisma's AutomationLog table
    const [logs] = useState([
        {
            id: 'log-1',
            entityType: 'enquiry',
            event: 'enquiry_created',
            inputData: JSON.stringify({ source: 'whatsapp', message: 'I need nurse immediately' }),
            outputData: JSON.stringify({ computed: { score: 80, priority: 'HOT' }, actions: ['create_task'] }),
            createdAt: new Date().toISOString()
        }
    ]);

    return (
        <div className="p-6 h-full flex flex-col">
            <h2 className="text-2xl font-normal text-gray-800 dark:text-white mb-6">Automation Flow Logs</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Entity</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Event Trigger</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Input Payload</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Computed Decisions</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 uppercase">
                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs">{log.entityType}</span>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-800">{log.event}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 font-mono text-xs">
                                    <div className="bg-gray-900 text-green-400 p-2 rounded overflow-auto max-w-xs whitespace-pre-wrap max-h-32">
                                        {log.inputData}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 font-mono text-xs">
                                    <div className="bg-gray-900 text-blue-400 p-2 rounded overflow-auto max-w-xs whitespace-pre-wrap max-h-32">
                                        {log.outputData}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {new Date(log.createdAt).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
