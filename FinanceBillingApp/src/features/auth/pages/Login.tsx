import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { api } from '../../../lib/axios';
import { useToast } from '../../../components/Toast';
import { Wallet, ShieldCheck, Eye, EyeOff, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

      // Attempt to fetch authorized units
      let units: Array<{ id: string; name: string; code?: string }> = [];
      try {
        const unitsRes = await api.get('/master/unit/authorized', {
          headers: { Authorization: `Bearer ${token}` }
        });
        units = Array.isArray(unitsRes.data?.data) ? unitsRes.data.data : (Array.isArray(unitsRes.data) ? unitsRes.data : []);
      } catch (unitErr) {
        console.warn('Authorized units fetch skipped:', unitErr);
      }

      // Standardize user object
      const formattedUser = {
        id: user.id || 'usr-001',
        email: user.email || email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Finance Manager',
        role: typeof user.role === 'object' ? user.role?.name || 'finance manager' : user.role || 'finance manager',
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
        message: `Welcome back, ${formattedUser.name}`,
      });

      navigate('/finance/dashboard', { replace: true });
    } catch (err: any) {
      console.error('[FinanceBillingApp] Login failed:', err);
      const apiMessage = err.response?.data?.message || err.message;
      const displayMsg = apiMessage && typeof apiMessage === 'string'
        ? apiMessage
        : 'Authentication failed. Please verify your credentials and try again.';
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

  const handleFillDemoCreds = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Admin@123');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 shadow-inner">
            <Wallet className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Finance & Patient Billing</h1>
          <p className="text-xs text-slate-400 mt-1">Healthcare ERP Standalone Portal (Port 5180)</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="finance.manager@erp.local"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Sign In Securely</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Dev Helper */}
        <div className="mt-6 pt-4 border-t border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 mb-2">Quick Fill Credentials:</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleFillDemoCreds('admin@erp.com')}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-[11px] text-slate-300 rounded-md border border-slate-800 transition-colors"
            >
              admin@erp.com
            </button>
            <button
              type="button"
              onClick={() => handleFillDemoCreds('finance@erp.com')}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-[11px] text-slate-300 rounded-md border border-slate-800 transition-colors"
            >
              finance@erp.com
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
