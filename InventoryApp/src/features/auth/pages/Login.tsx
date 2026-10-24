import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, User } from '../../../store/useAuthStore';
import { api } from '../../../lib/axios';
import { Boxes, LogIn, Lock, Mail, AlertCircle } from 'lucide-react';
import { Button, Input } from '../../../components/ui';

const getRoleName = (role: unknown): string => {
  if (!role) return 'Employee';
  if (typeof role === 'string') return role;
  if (typeof role === 'object' && role !== null && 'name' in role) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const loginData = response.data?.data;
      const rawUser = loginData?.user;
      const accessToken = loginData?.accessToken || loginData?.token;

      if (!rawUser || !accessToken) {
        throw new Error('Authentication response was incomplete.');
      }

      const sessionUser: User = {
        id: rawUser.id,
        name: rawUser.name || `${rawUser.firstName || ''} ${rawUser.lastName || ''}`.trim() || 'Inventory User',
        email: rawUser.email,
        role: getRoleName(rawUser.role),
        permissions: Array.isArray(rawUser.permissions) ? rawUser.permissions : [],
        unitAccess: Array.isArray(rawUser.unitAccess) ? rawUser.unitAccess : [rawUser.unitId].filter(Boolean),
        unitId: rawUser.unitId,
        unit: rawUser.unit,
        tenantId: rawUser.tenantId,
        staffId: rawUser.staffId || null,
        empId: rawUser.empId || null,
      };

      login(sessionUser, accessToken);
      navigate('/app/dashboard', { replace: true });
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 401) {
        setError('Invalid email or password. Please verify your credentials.');
      } else if (status === 403) {
        setError('Access denied. Your account is not authorized to access this system.');
      } else if (!err.response) {
        setError('Unable to reach the ERP backend server. Please verify network connectivity.');
      } else {
        const message = err.response?.data?.message || 'Login failed. Please try again.';
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden text-slate-100 font-sans">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 mb-4">
            <Boxes className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">InventoryApp</h1>
          <p className="text-sm text-slate-400 mt-1">Standalone Inventory & Stock Logistics Workspace</p>
          <span className="inline-block mt-2 px-3 py-1 bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 rounded-full text-xs font-semibold">
            Dedicated Port 5179
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 bg-rose-950/50 border border-rose-800/60 rounded-xl flex items-start gap-3 text-rose-300 text-xs leading-relaxed animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full py-2.5 font-semibold cursor-pointer"
              isLoading={isSubmitting}
              leftIcon={<LogIn className="w-4 h-4" />}
            >
              Sign In to InventoryApp
            </Button>
          </div>
        </form>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500">
            Connected to Shared ERP Core Backend &bull; Phase C Application Shell
          </p>
        </div>
      </div>
    </div>
  );
}
