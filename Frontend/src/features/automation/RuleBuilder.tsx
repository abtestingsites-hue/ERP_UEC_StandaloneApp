import { useState } from 'react';

export function RuleBuilder() {
    const [rules] = useState([{ field: '', operator: '=', value: '' }]);

    return (
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Automation Rule Builder</h2>
            <div className="space-y-4">
                {rules.map((_, idx) => (
                    <div key={idx} className="flex flex-wrap gap-4 items-center">
                        <input
                            type="text"
                            placeholder="Data Field (e.g. input.message)"
                            className="flex-1 w-full border-gray-300 rounded shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm border"
                        />
                        <select className="border-gray-300 rounded shadow-sm py-2 px-3 border">
                            <option value="=">Equals (=)</option>
                            <option value=">">Greater Than (&gt;)</option>
                            <option value="contains">Contains / Includes</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Rule Value"
                            className="flex-1 w-full border-gray-300 rounded shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm border"
                        />
                    </div>
                ))}
            </div>
            <button className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded hover:bg-gray-200 shadow-sm">+ Add Condition</button>

            <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-700 mb-3">Action</h3>
                <div className="flex gap-4">
                    <select className="border-gray-300 rounded shadow-sm py-2 px-3 border flex-1">
                        <option value="add_score">Add Score</option>
                        <option value="set_priority">Set Priority</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Action Value (e.g. 50 or HOT)"
                        className="flex-1 w-full border-gray-300 rounded shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm border"
                    />
                </div>
            </div>

            <button className="mt-6 px-6 py-2.5 bg-primary-600 font-medium text-white rounded hover:bg-primary-700 shadow-sm transition">Save Rule Object</button>
        </div>
    );
}
