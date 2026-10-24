// @ts-nocheck

import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Activity, User } from 'lucide-react';
import { PatientPortalService } from '../services';

const PatientPortalLayout = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await PatientPortalService.logout();
        } catch (e) {
            // ignore
        } finally {
            navigate('/patient-portal/login');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-indigo-600 shadow-sm border-b border-indigo-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Activity className="h-8 w-8 text-white mr-3" />
                            <h1 className="text-xl font-bold text-white tracking-tight">Patient Portal</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-700 hover:bg-indigo-800 focus:outline-none transition-colors"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
};

export default PatientPortalLayout;


