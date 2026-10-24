export function WorkflowBuilder() {
    return (
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Workflow Builder</h2>
            <div className="space-y-6">
                <div>
                    <label className="block font-medium text-gray-700 mb-2">Trigger Event</label>
                    <select className="w-full border-gray-300 rounded shadow-sm py-2 px-3 border">
                        <option value="enquiry_created">Enquiry Created</option>
                        <option value="transaction_created">Transaction Created</option>
                    </select>
                </div>

                <div>
                    <label className="block font-medium text-gray-700 mb-2">JSON Conditon Tree</label>
                    <textarea
                        className="w-full border-gray-300 rounded shadow-sm py-2 px-3 border font-mono text-sm"
                        rows={4}
                        defaultValue={'{\n  "conditions": [\n    { "field": "computed.score", "operator": ">=", "value": 70 }\n  ]\n}'}
                    />
                </div>

                <div className="border-t border-gray-200 pt-4">
                    <label className="block font-medium text-gray-700 mb-2">Action Executed</label>
                    <select className="w-full border-gray-300 rounded shadow-sm py-2 px-3 border">
                        <option value="create_task">Create Task</option>
                        <option value="send_notification">Send Notification</option>
                    </select>
                </div>
            </div>
            <button className="mt-6 px-6 py-2.5 bg-primary-600 font-medium text-white rounded hover:bg-primary-700 shadow-sm transition">Publish Workflow</button>
        </div>
    );
}
