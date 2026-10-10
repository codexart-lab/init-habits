import React, { useState } from 'react';
import { Terminal, KeyRound, Mail, ArrowRight, ShieldCheck, HelpCircle, Play } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';

export const AuthView: React.FC = () => {
  const { signIn, signUp, resetPassword, enableDemoMode } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      setErrorMessage('Please provide an email address.');
      return;
    }

    if (mode !== 'forgot' && (!password || password.length < 6)) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);

    if (mode === 'signin') {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        setErrorMessage(error.message);
      }
    } else if (mode === 'signup') {
      const { error, needsConfirmation } = await signUp(email.trim(), password);
      if (error) {
        setErrorMessage(error.message);
      } else if (needsConfirmation) {
        setSuccessMessage('Account created! Please check your email inbox to verify your account.');
      }
    } else if (mode === 'forgot') {
      const { error } = await resetPassword(email.trim());
      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage('Password reset link sent! Check your email inbox.');
      }
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#f4f4f5] font-mono flex flex-col justify-center items-center px-4 py-8">
      {/* Terminal Container */}
      <div className="w-full max-w-md rounded border border-[#1f2421] bg-[#0a0a0a] shadow-2xl overflow-hidden">
        {/* Terminal Title Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#111111] border-b border-[#1f2421]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
            <span className="text-xs text-zinc-400 font-semibold ml-2">
              auth@init.Habits:~
            </span>
          </div>
          <Terminal className="w-3.5 h-3.5 text-[#4ADE65]" />
        </div>

        {/* Header ASCII / Terminal Banner */}
        <div className="p-5 border-b border-[#181d19] bg-[#070e09]/50">
          <div className="text-sm font-bold text-[#4ADE65] flex items-center gap-2">
            <span>&gt; init.Habits</span>
            <span className="text-xs font-normal text-zinc-500">// v1.0.0</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Terminal habit tracking environment for developers.
          </p>
        </div>

        {/* Tab Switcher: Login / Register / Reset */}
        <div className="grid grid-cols-3 border-b border-[#181d19] text-xs text-center bg-[#0d0d0d]">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`py-2.5 transition-colors ${
              mode === 'signin'
                ? 'text-[#4ADE65] font-semibold border-b-2 border-[#4ADE65] bg-[#061408]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            $ login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`py-2.5 transition-colors ${
              mode === 'signup'
                ? 'text-[#4ADE65] font-semibold border-b-2 border-[#4ADE65] bg-[#061408]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            $ signup
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('forgot');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`py-2.5 transition-colors ${
              mode === 'forgot'
                ? 'text-[#4ADE65] font-semibold border-b-2 border-[#4ADE65] bg-[#061408]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            $ reset
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded bg-red-950/60 border border-red-800 text-red-400 text-xs leading-relaxed">
              ! {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded bg-[#071a0b] border border-[#166534] text-[#4ADE65] text-xs leading-relaxed">
              ✓ {successMessage}
            </div>
          )}

          {/* Email input */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              Email Identifier
            </label>
            <div className="flex items-center bg-[#141414] border border-[#27272a] rounded px-3 py-2 text-xs focus-within:border-[#4ADE65]">
              <Mail className="w-4 h-4 text-zinc-500 mr-2 shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@domain.com"
                className="bg-transparent text-zinc-100 outline-none w-full"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password input */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <label>Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-[#4ADE65] hover:underline"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="flex items-center bg-[#141414] border border-[#27272a] rounded px-3 py-2 text-xs focus-within:border-[#4ADE65]">
                <KeyRound className="w-4 h-4 text-zinc-500 mr-2 shrink-0" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-transparent text-zinc-100 outline-none w-full"
                  required
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 text-xs font-semibold rounded bg-[#4ADE65] text-[#050505] hover:bg-[#43c75b] transition-all flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(74,222,101,0.25)] disabled:opacity-50"
          >
            <span>
              {submitting
                ? 'Executing auth protocol...'
                : mode === 'signin'
                ? 'Authenticate Session'
                : mode === 'signup'
                ? 'Initialize Account'
                : 'Send Password Reset Link'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Demo Mode / Offline Option */}
        <div className="p-4 border-t border-[#181d19] bg-[#080808] flex flex-col gap-2">
          <div className="text-[11px] text-zinc-500 text-center">
            {isSupabaseConfigured
              ? '// Want to test without creating an account?'
              : '// Supabase env vars not configured yet. Run in local sandbox:'}
          </div>
          <button
            type="button"
            onClick={enableDemoMode}
            className="w-full py-2 px-3 text-xs rounded border border-[#166534] bg-[#071609] text-[#4ADE65] hover:bg-[#0c2413] transition-colors flex items-center justify-center gap-1.5"
          >
            <Play className="w-3 h-3 fill-[#4ADE65]" />
            <span>Launch Local Demo Terminal</span>
          </button>
        </div>
      </div>

      {/* Security note */}
      <div className="mt-6 text-center text-[11px] text-zinc-500 max-w-sm flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-[#4ADE65]" />
        <span>Encrypted with Supabase Auth &amp; PostgreSQL RLS isolation</span>
      </div>
    </div>
  );
};
