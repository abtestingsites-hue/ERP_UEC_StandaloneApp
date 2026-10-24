import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/axios';
import { useToast } from '../components/Toast';
import { Headset, ShieldCheck, Eye, EyeOff, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuthStore();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data?.data || response.data;

      const token = data?.accessToken || data?.token;
      const user = data?.user || data;

      if (!token) {
        throw new Error('No authentication token received from server');
      }

      // Fetch authorized units
      let units: Array<{ id: string; name: string; code?: string; unitType?: string }> = [];
      try {
        const unitsRes = await api.get('/master/unit/authorized', {
          headers: { Authorization: `Bearer ${token}` },
        });
        units = Array.isArray(unitsRes.data?.data)
          ? unitsRes.data.data
          : Array.isArray(unitsRes.data)
          ? unitsRes.data
          : [];
      } catch (unitErr) {
        console.warn('Authorized units fetch skipped:', unitErr);
      }

      const formattedUser = {
        id: user.id || 'usr-001',
        email: user.email || email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'CRM User',
        role: typeof user.role === 'object' ? user.role?.name || 'enquiry desk manager' : user.role || 'enquiry desk manager',
        tenantId: user.tenantId || 'tenant-default',
        unitId: user.unitId || null,
        unitAccess: user.unitAccess || [],
        permissions: user.permissions || [],
      };

      const initialUnitId = formattedUser.unitId || (units.length > 0 ? units[0].id : null);

      login(token, formattedUser, units, initialUnitId || undefined);

      toast({
        type: 'success',
        title: 'Authentication Successful',
        message: `Welcome back to CRMApp, ${formattedUser.name}`,
      });

      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('[CRMApp] Login failed:', err);
      const apiMessage = err.response?.data?.message || err.message;
      const displayMsg =
        apiMessage && typeof apiMessage === 'string'
          ? apiMessage
          : 'Authentication failed. Please check your credentials.';
      setError(displayMsg);
      toast({
        type: 'error',
        title: 'Sign In Failed',
        message: displayMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-2xl mb-3 shadow-lg shadow-indigo-600/20">
            <Headset className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">CRMApp Portal</h1>
          <p className="text-xs text-slate-400 mt-1">Standalone CRM & Enquiry Management Desk (Port 5181)</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@uec.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>Sign In to CRMApp</span>
          </button>
        </form>
      </div>
    </div>
  );
};
