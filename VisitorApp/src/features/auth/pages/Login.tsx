import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../lib/axios';
import { LogIn, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data.data || response.data;
      
      const token = data.accessToken || data.token;
      const user = data.user || data;

      if (!token) {
        throw new Error('No authentication token received from backend');
      }

      setAuth(token, user);
      navigate('/visitor/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err.response?.data?.message || err.message || 'Authentication failed. Please check credentials.';
      setError(msg);
    } finally {
      setLoading(false);
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
            Sign in to Visitor & Gate Security
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-[#B8D9E8]">
            Secure portal for visitor management & gate control
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-bold text-[#294D61] dark:text-[#B8D9E8]">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="flex h-10 w-full rounded-xl border border-[#6DA5C0]/25 bg-[#F7FAFC] px-3 py-2 text-sm font-medium text-[#05161A] shadow-sm outline-none transition-all placeholder:text-[#6DA5C0] hover:border-[#0F969C]/45 hover:bg-white focus:border-[#0F969C] focus:bg-white focus:ring-2 focus:ring-[#0F969C]/20 dark:border-[#6DA5C0]/25 dark:bg-[#0B2A30] dark:text-[#F7FAFC] dark:placeholder:text-[#8FB7C8] dark:hover:border-[#6DA5C0]/45 dark:hover:bg-[#0A2429] dark:focus:bg-[#0B2A30]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-bold text-[#294D61] dark:text-[#B8D9E8]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex h-10 w-full rounded-xl border border-[#6DA5C0]/25 bg-[#F7FAFC] px-3 py-2 pr-10 text-sm font-medium text-[#05161A] shadow-sm outline-none transition-all placeholder:text-[#6DA5C0] hover:border-[#0F969C]/45 hover:bg-white focus:border-[#0F969C] focus:bg-white focus:ring-2 focus:ring-[#0F969C]/20 dark:border-[#6DA5C0]/25 dark:bg-[#0B2A30] dark:text-[#F7FAFC] dark:placeholder:text-[#8FB7C8] dark:hover:border-[#6DA5C0]/45 dark:hover:bg-[#0A2429] dark:focus:bg-[#0B2A30]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-500 transition-colors hover:text-gray-800 focus:outline-none dark:text-gray-400 dark:hover:text-gray-100 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                role="checkbox"
                type="checkbox"
                className="h-4 w-4 text-[#0F969C] focus:ring-[#0F969C] border-gray-300 dark:border-[#6DA5C0]/20 dark:bg-[#0B2A30] rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-[#D8EEF5] cursor-pointer">
                Remember me
              </label>
            </div>
            <div className="text-sm">
              <a href="#" className="font-medium text-primary-600 dark:text-[#6DA5C0] hover:text-primary-500 dark:hover:text-white">
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
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-[#0F969C] dark:hover:bg-[#0C7075] dark:focus:ring-offset-[#072E33] transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Authenticating...' : 'Sign in securely'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;



