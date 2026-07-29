'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { loginSchema } from '@/lib/validations';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    // Zod Schema Validation
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const formattedErrors: { email?: string; password?: string } = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0] === 'email') formattedErrors.email = issue.message;
        if (issue.path[0] === 'password') formattedErrors.password = issue.message;
      });
      setFieldErrors(formattedErrors);
      toast.error('Please fix validation errors');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Authentication failed');
      } else {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success(`Welcome back, ${data.user.fullName}!`);
        router.push('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700/60 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Top glowing gradient line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Personnel Directory</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Sign in to access your administrative workspace</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                placeholder="operator@company.com"
                className={`w-full bg-slate-50 dark:bg-slate-900/90 border ${
                  fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
                } rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {fieldErrors.email && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                className={`w-full bg-slate-50 dark:bg-slate-900/90 border ${
                  fieldErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
                } rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {fieldErrors.password && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs py-3 rounded-xl shadow-lg hover:shadow-blue-500/20 transition duration-150 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="pt-2 text-center border-t border-slate-200 dark:border-slate-700/50">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Contact Management & RBAC System</p>
        </div>
      </div>
    </div>
  );
}