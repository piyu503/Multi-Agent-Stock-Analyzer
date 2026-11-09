import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
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
        picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=0052ff`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#dee1e6] dark:border-white/10 bg-white dark:bg-[#16181c] p-6 sm:p-8 shadow-2xl backdrop-blur-2xl transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 rounded-full p-1.5 text-[#7c828a] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#0a0b0d] dark:hover:text-white transition-all cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header - Coinbase Calm Editorial */}
        <div className="mb-6 text-center">
          <img
            src="/logo.png"
            alt="EquiAgentic Logo"
            className="w-14 h-14 rounded-2xl object-contain bg-white dark:bg-white/5 mx-auto mb-3 border border-[#dee1e6] dark:border-white/10 p-1.5 shadow-sm"
          />
          <h2 className="text-xl font-normal tracking-tight text-[#0a0b0d] dark:text-white font-display">
            {actionPrompt ? 'Authentication Required' : mode === 'signin' ? 'Sign in to EquiAgentic' : 'Create Investor Account'}
          </h2>
          <p className="mt-1 text-xs text-[#5b616e] dark:text-[#a8acb3] font-sans">
            {actionPrompt || 'Access multi-agent deliberations & persistent report history'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#cf202f]/30 bg-[#cf202f]/10 p-3 text-xs text-[#cf202f]">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#cf202f]" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Authentication Section */}
        {isGooglePickerOpen ? (
          <div className="mb-4 p-4 rounded-2xl border border-[#0052ff]/30 bg-[#f7f7f7] dark:bg-white/[0.03] space-y-3 animate-fade-in">
            <div className="flex items-center justify-between text-xs text-[#0a0b0d] dark:text-white">
              <span className="font-mono text-[#0052ff] font-semibold flex items-center gap-1.5">
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
                className="text-[11px] text-[#7c828a] hover:text-[#0a0b0d] dark:hover:text-white"
              >
                Cancel
              </button>
            </div>
            <input
              type="email"
              value={googleEmailInput}
              onChange={(e) => setGoogleEmailInput(e.target.value)}
              placeholder="Enter your Gmail address..."
              className="w-full rounded-xl border border-[#dee1e6] dark:border-white/10 bg-white dark:bg-[#0a0b0d] px-3.5 py-2.5 text-xs text-[#0a0b0d] dark:text-white placeholder-[#7c828a] focus:border-[#0052ff] focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isLoading || !googleEmailInput}
                onClick={() => handleExecuteGoogleAuth(googleEmailInput)}
                className="cb-pill-btn-primary flex-1 py-2 text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
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
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full border border-[#dee1e6] dark:border-white/10 bg-[#f7f7f7] dark:bg-white/5 hover:bg-[#eef0f3] dark:hover:bg-white/10 text-[#0a0b0d] dark:text-white font-semibold text-xs transition-all shadow-sm group cursor-pointer"
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
          <div className="w-full border-t border-[#dee1e6] dark:border-white/10" />
          <span className="absolute bg-white dark:bg-[#16181c] px-3 text-[10px] uppercase font-mono tracking-wider text-[#7c828a]">
            or continue with email
          </span>
        </div>

        {/* Mode Switcher Tabs - Coinbase Pill Container */}
        <div className="flex rounded-full bg-[#f7f7f7] dark:bg-white/5 p-1 border border-[#dee1e6] dark:border-white/10 mb-4">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-white dark:bg-white/15 text-[#0a0b0d] dark:text-white shadow-sm'
                : 'text-[#7c828a] hover:text-[#0a0b0d] dark:hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-white dark:bg-white/15 text-[#0a0b0d] dark:text-white shadow-sm'
                : 'text-[#7c828a] hover:text-[#0a0b0d] dark:hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-mono text-[#5b616e] dark:text-[#a8acb3] uppercase tracking-wider mb-1.5 font-semibold">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-[#7c828a]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Piyush Sharma"
                  className="w-full rounded-xl border border-[#dee1e6] dark:border-white/10 bg-[#f7f7f7] dark:bg-[#0a0b0d] pl-10 pr-3.5 py-2.5 text-xs text-[#0a0b0d] dark:text-white placeholder-[#7c828a] focus:border-[#0052ff] focus:outline-none focus:ring-1 focus:ring-[#0052ff] transition-all font-sans"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono text-[#5b616e] dark:text-[#a8acb3] uppercase tracking-wider mb-1.5 font-semibold">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#7c828a]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="investor@domain.com"
                className="w-full rounded-xl border border-[#dee1e6] dark:border-white/10 bg-[#f7f7f7] dark:bg-[#0a0b0d] pl-10 pr-3.5 py-2.5 text-xs text-[#0a0b0d] dark:text-white placeholder-[#7c828a] focus:border-[#0052ff] focus:outline-none focus:ring-1 focus:ring-[#0052ff] transition-all font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#5b616e] dark:text-[#a8acb3] uppercase tracking-wider mb-1.5 font-semibold">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#7c828a]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-[#dee1e6] dark:border-white/10 bg-[#f7f7f7] dark:bg-[#0a0b0d] pl-10 pr-10 py-2.5 text-xs text-[#0a0b0d] dark:text-white placeholder-[#7c828a] focus:border-[#0052ff] focus:outline-none focus:ring-1 focus:ring-[#0052ff] transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-[#7c828a] hover:text-[#0a0b0d] dark:hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="cb-pill-btn-primary w-full mt-5 py-3 text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </span>
            ) : (
              <span>{mode === 'signin' ? 'Sign In to EquiAgentic' : 'Create My Account'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
