    export function Settings() {
    return (
        <div className="flex flex-col h-full gap-4">
            {/* Header Area */}
            <div className="flex justify-between items-center shrink-0">
                <h2 className="text-[17px] font-extrabold text-gray-900 tracking-tight">Settings</h2>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-50 flex flex-col p-8 flex-1">
                <p className="text-sm text-gray-500 mb-8 max-w-lg">Manage your account preferences, notifications, and application behavior here.</p>

                <div className="space-y-6 max-w-2xl">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-6 group cursor-pointer transition-all">
                        <div>
                            <h3 className="font-bold text-gray-800 text-[14px]">Email Notifications</h3>
                            <p className="text-[12px] font-medium text-gray-400 mt-0.5">Receive daily summary updates and alerts directly to your inbox</p>
                        </div>
                        <div className="w-10 h-5 bg-[#0F969C] rounded-full relative shadow-inner">
                            <div className="w-[14px] h-[14px] bg-white rounded-full absolute top-[3px] left-[22px] shadow-sm transition-all" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-b border-gray-100 pb-6 group cursor-pointer transition-all">
                        <div>
                            <h3 className="font-bold text-gray-800 text-[14px]">Sound Alerts</h3>
                            <p className="text-[12px] font-medium text-gray-400 mt-0.5">Play a notification dot sound when important actions occur</p>
                        </div>
                        <div className="w-10 h-5 bg-gray-200 rounded-full relative shadow-inner">
                            <div className="w-[14px] h-[14px] bg-white rounded-full absolute top-[3px] left-[4px] shadow-sm transition-all" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-b border-gray-100 pb-6 group cursor-pointer transition-all">
                        <div>
                            <h3 className="font-bold text-gray-800 text-[14px]">Two-Factor Authentication (2FA)</h3>
                            <p className="text-[12px] font-medium text-gray-400 mt-0.5">Protect your account using an authenticator app</p>
                        </div>
                        <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                            Configure
                        </button>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button className="px-4 py-2 border border-gray-200 rounded-lg text-[13px] font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                            Discard Changes
                        </button>
                        <button className="px-4 py-2 bg-gray-900 rounded-lg text-[13px] font-bold text-white hover:bg-gray-800 shadow-sm transition-colors">
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
