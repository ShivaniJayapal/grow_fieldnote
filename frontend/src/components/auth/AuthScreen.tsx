import React, { useState } from 'react';
import { ArrowRight, LockKeyhole, Mail, Radar } from 'lucide-react';
import { apiClient, AuthSession } from '../../api/client';

interface AuthScreenProps {
  onAuthenticated: (session: AuthSession) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const session = mode === 'login'
        ? await apiClient.login(email, password)
        : await apiClient.register(email, password);
      onAuthenticated(session);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-groww-bg flex items-center justify-center p-6">
      <section className="w-full max-w-md bg-white border border-groww-border rounded-3xl shadow-groww-dropdown p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-11 w-11 rounded-2xl bg-groww-teal text-white flex items-center justify-center">
            <Radar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-groww-heading">fieldnote</h1>
            <p className="text-xs text-groww-muted">Your market radar</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-groww-heading">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <p className="text-sm text-groww-muted mt-2 mb-6">
          {mode === 'login' ? 'Sign in to open your watchlists.' : 'Start tracking the signals that matter.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-groww-body">Email</span>
            <span className="relative block mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-groww-muted" />
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" className="w-full pl-10 pr-3 py-3 rounded-xl border border-groww-border bg-groww-subtle/70 text-sm focus:outline-none focus:border-groww-teal focus:ring-1 focus:ring-groww-teal" />
            </span>
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-groww-body">Password</span>
            <span className="relative block mt-1.5">
              <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-groww-muted" />
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="w-full pl-10 pr-3 py-3 rounded-xl border border-groww-border bg-groww-subtle/70 text-sm focus:outline-none focus:border-groww-teal focus:ring-1 focus:ring-groww-teal" />
            </span>
          </label>

          {error && <p className="text-sm text-groww-red bg-groww-redLight border border-groww-redBorder rounded-xl p-3">{error}</p>}

          <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-groww-teal hover:bg-groww-tealHover disabled:opacity-50 text-white text-sm font-bold transition-colors">
            <span>{isSubmitting ? 'Connecting...' : mode === 'login' ? 'Sign in' : 'Create account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }} className="w-full mt-5 text-sm text-groww-teal hover:underline font-semibold">
          {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
        </button>
      </section>
    </main>
  );
};