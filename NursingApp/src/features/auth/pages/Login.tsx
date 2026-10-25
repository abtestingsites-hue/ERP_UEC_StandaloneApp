import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { api } from '../../../lib/axios';
import { LogIn } from 'lucide-react';

const getRoleName = (role: unknown) => {
    if (!role) return 'Employee';
    if (typeof role === 'string') return role;
    if (typeof role === 'object' && 'name' in role) {
        const roleName = (role as { name?: unknown }).name;
        return typeof roleName === 'string' && roleName.trim() ? roleName : 'Employee';
    }
    return 'Employee';
};

export default function Login() {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            const loginData = response.data?.data;
            const user = loginData?.user;
            const accessToken = loginData?.accessToken || loginData?.token;

            if (!user || !accessToken) {
                throw new Error('Login response did not include a user and access token.');
            }

            const sessionUser = {
                id: user.id,
                name: user.name || `${user.firstName} ${user.lastName || ''}`.trim(),
                email: user.email,
                role: getRoleName(user.role),
                permissions: Array.isArray(user.permissions) ? user.permissions : [],
                unitAccess: Array.isArray(user.unitAccess) ? user.unitAccess : [user.unitId].filter(Boolean),
                unitId: user.unitId,
                staffId: user.staffId || null,
                empId: user.empId || null,
            };

            login(sessionUser, accessToken);
            navigate('/', { replace: true });
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Login failed. Please try again.';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 py-6 px-3 sm:px-6 lg:px-8 bg-[url('https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80')] bg-cover bg-center">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"></div>
            <div className="mx-auto w-full max-w-md space-y-6 sm:space-y-8 bg-white dark:bg-[#072E33] p-5 sm:p-8 lg:p-10 rounded-2xl shadow-2xl relative z-10 border border-gray-100 dark:border-[#6DA5C0]/15">
                <div>
                    <div className="mx-auto h-16 w-16 bg-primary-100 dark:bg-[#0F969C]/20 rounded-2xl flex items-center justify-center shadow-inner">
                        <LogIn className="h-8 w-8 text-primary-600 dark:text-[#D8EEF5]" />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                        Sign in to Nursing Care
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-[#B8D9E8]">
                        Secure portal for nursing staff & management
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={onSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-[#D8EEF5]">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white shadow-sm border p-2 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-[#D8EEF5]">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-[#6DA5C0]/20 bg-white dark:bg-[#0B2A30] text-gray-900 dark:text-white shadow-sm border p-2 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                role="checkbox"
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-[#6DA5C0]/20 dark:bg-[#0B2A30] rounded"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-[#D8EEF5]">
                                Remember me
                            </label>
                        </div>
                        <div className="text-sm">
                            <a href="/forgot-password" onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }} className="font-medium text-primary-600 dark:text-[#6DA5C0] hover:text-primary-500 dark:hover:text-white">
                                Forgot your password?
                            </a>
                        </div>
                    </div>

                    <div>
                        {error && (
                            <p className="mb-3 text-sm font-medium text-red-600 dark:text-rose-400">
                                {error}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-[#0F969C] dark:hover:bg-[#0C7075] dark:focus:ring-offset-[#072E33] transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Authenticating...' : 'Sign in securely'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
