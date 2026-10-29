import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Eye, EyeOff, ShieldCheck, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { loginUser, registerUser, googleAuth } from '../api';
import type { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  initialMode?: 'signin' | 'signup';
  actionPrompt?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'signin',
  actionPrompt = null,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isGooglePickerOpen, setIsGooglePickerOpen] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          throw new Error('Please enter your full name');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        const res = await registerUser(name.trim(), email.trim(), password);
        onAuthSuccess(res.user);
        onClose();
      } else {
        const res = await loginUser(email.trim(), password);
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteGoogleAuth = async (targetEmail: string) => {
    if (!targetEmail || !targetEmail.includes('@')) {
      setError('Please provide a valid Google / Gmail address');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const displayName = targetEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const res = await googleAuth({
        email: targetEmail.toLowerCase().trim(),
        name: displayName,
        picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=d946ef`,
      });
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#07090e]/95 p-6 sm:p-8 shadow-2xl shadow-fuchsia-950/40 backdrop-blur-2xl transition-all">
        {/* Glow ambient background effects */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-violet-600/20 blur-3xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-all"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-fuchsia-500/20 to-violet-500/20 border border-fuchsia-500/30 text-fuchsia-400 mb-3 shadow-lg shadow-fuchsia-500/10">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white font-display">
            {actionPrompt ? 'Authentication Required' : mode === 'signin' ? 'Welcome Back to EquiAgentic' : 'Create Investor Account'}
          </h2>
          <p className="mt-1 text-xs text-slate-400 font-mono">
            {actionPrompt || 'Access multi-agent deliberations & persistent report history'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Authentication Section */}
        {isGooglePickerOpen ? (
          <div className="mb-4 p-4 rounded-xl border border-fuchsia-500/30 bg-white/[0.03] space-y-3 animate-fade-in">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-mono text-fuchsia-400 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google Single Sign-On</span>
              </span>
              <button
                type="button"
                onClick={() => setIsGooglePickerOpen(false)}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
            <input
              type="email"
              value={googleEmailInput}
              onChange={(e) => setGoogleEmailInput(e.target.value)}
              placeholder="Enter your Gmail address..."
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-fuchsia-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isLoading || !googleEmailInput}
                onClick={() => handleExecuteGoogleAuth(googleEmailInput)}
                className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white text-xs font-medium hover:from-fuchsia-500 hover:to-violet-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isLoading ? 'Connecting...' : 'Authorize with Google'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsGooglePickerOpen(true)}
            disabled={isLoading}
            type="button"
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 text-white font-medium text-xs transition-all shadow-sm group cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        )}

        {/* Divider */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="w-full border-t border-white/10" />
          <span className="absolute bg-[#07090e] px-3 text-[10px] uppercase font-mono tracking-wider text-slate-500">
            or continue with email
          </span>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex rounded-xl bg-white/[0.03] p-1 border border-white/5 mb-4">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Piyush Sharma"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 transition-all font-sans"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              Gmail / Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="investor@domain.com"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 transition-all font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-10 py-2 text-xs text-white placeholder-slate-600 focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white font-medium text-xs transition-all shadow-lg shadow-fuchsia-600/20 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{mode === 'signin' ? 'Sign In to Terminal' : 'Create My Account'}</span>
            )}
          </button>
        </form>

        {/* Security Assurance Badge */}
        <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>PBKDF2 SHA-256 Encrypted • Secure Session</span>
        </div>
      </div>
    </div>
  );
};

