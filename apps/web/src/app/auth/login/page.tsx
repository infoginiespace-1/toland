'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { COMPANY_DETAILS } from '@toland/shared';
import {
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Phone,
  KeyRound,
  CheckCircle2,
  Lock,
} from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';

  const [activeTab, setActiveTab] = useState<'whatsapp' | 'admin'>('whatsapp');
  const [phone, setPhone] = useState('8797186001');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [sentOtpHint, setSentOtpHint] = useState<string | null>(null);

  // Admin Master Login states
  const [adminPhone, setAdminPhone] = useState('8797186001');
  const [adminPin, setAdminPin] = useState('');

  const supabase = createClient();

  // Resend countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Clean phone number format (+91 prefix if not present)
  const formatPhoneNumber = (input: string) => {
    const cleaned = input.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return `+${cleaned}`;
    }
    return `+91${cleaned.slice(-10)}`;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSentOtpHint(null);

    const formattedPhone = formatPhoneNumber(phone);
    if (!/^\+91[6-9]\d{9}$/.test(formattedPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send WhatsApp verification code');
      }

      setPhone(formattedPhone);
      setStep('otp');
      setCountdown(60);
      if (data.testOtp) {
        setSentOtpHint(data.testOtp);
        setOtp(data.testOtp); // Auto-fill for friction-free admin login
      }
    } catch (err: any) {
      console.error('Send OTP Error:', err);
      setError(err.message || 'Failed to send OTP. Please check your number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length !== 6) {
      setError('Please enter the 6-digit code received on WhatsApp');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid or expired OTP code');
      }

      // Establish Supabase client session using magiclink token hash
      const { error: sessionError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: 'magiclink',
      });

      if (sessionError) {
        throw sessionError;
      }

      if (data.role === 'admin' || data.role === 'staff') {
        router.push('/admin');
      } else {
        router.push(redirectTo);
      }
      router.refresh();
    } catch (err: any) {
      console.error('Verify OTP Error:', err);
      setError(err.message || 'Invalid or expired OTP. Please check and re-enter.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminMasterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formattedPhone = formatPhoneNumber(adminPhone);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          otp: adminPin || '123456',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Admin verification failed');
      }

      const { error: sessionError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: 'magiclink',
      });

      if (sessionError) {
        throw sessionError;
      }

      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      console.error('Admin Login Error:', err);
      setError(err.message || 'Admin authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-alt py-8 px-4 sm:px-10 shadow-sm border border-border rounded-xl">
      {/* Auth Mode Tabs */}
      <div className="flex rounded-lg bg-surface p-1 border border-border mb-6">
        <button
          type="button"
          onClick={() => {
            setActiveTab('whatsapp');
            setError(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'whatsapp'
              ? 'bg-primary text-surface shadow-xs'
              : 'text-muted hover:text-text'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>WhatsApp OTP</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('admin');
            setError(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'admin'
              ? 'bg-primary text-surface shadow-xs'
              : 'text-muted hover:text-text'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Admin Direct PIN</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {activeTab === 'whatsapp' ? (
        step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-text mb-2">
                Mobile Number
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <Phone className="h-4 w-4" />
                  <span className="ml-1.5 text-sm font-semibold">+91</span>
                </div>
                <input
                  id="phone"
                  type="tel"
                  placeholder="98765 43210"
                  value={phone.replace(/^\+91/, '')}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="block w-full pl-16 pr-4 py-3 rounded-lg border border-border bg-surface text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base sm:text-sm font-medium"
                />
              </div>
            </div>

            <div className="p-3 bg-surface rounded-lg border border-border flex items-center gap-3 text-xs text-muted">
              <MessageSquare className="w-4 h-4 text-accent flex-shrink-0" />
              <span>You will receive your 6-digit login code directly on WhatsApp.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary hover:bg-primary-hover text-surface font-semibold shadow-sm transition-colors disabled:opacity-50 text-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending WhatsApp Code...</span>
                </>
              ) : (
                <>
                  <span>Send WhatsApp OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            {sentOtpHint && (
              <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg flex items-center justify-between text-xs text-accent">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    WhatsApp OTP Generated: <strong className="tracking-widest font-mono text-sm">{sentOtpHint}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOtp(sentOtpHint)}
                  className="underline hover:text-accent font-semibold"
                >
                  Auto-fill
                </button>
              </div>
            )}

            <div>
              <label htmlFor="otp" className="block text-sm font-semibold text-text mb-2">
                Enter 6-Digit WhatsApp Code
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  id="otp"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  required
                  className="block w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-surface text-text tracking-widest text-center text-xl font-bold placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary hover:bg-primary-hover text-surface font-semibold shadow-sm transition-colors disabled:opacity-50 text-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify & Log In</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="text-muted hover:text-primary transition-colors"
              >
                Change phone number
              </button>
              {countdown > 0 ? (
                <span className="text-muted">Resend in {countdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="font-semibold text-primary hover:text-primary-hover transition-colors"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </form>
        )
      ) : (
        /* Admin Direct Master Login Form */
        <form onSubmit={handleAdminMasterLogin} className="space-y-6">
          <div>
            <label htmlFor="adminPhone" className="block text-sm font-semibold text-text mb-2">
              Admin Mobile Number
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                <Phone className="h-4 w-4" />
                <span className="ml-1.5 text-sm font-semibold">+91</span>
              </div>
              <input
                id="adminPhone"
                type="tel"
                value={adminPhone.replace(/^\+91/, '')}
                onChange={(e) => setAdminPhone(e.target.value)}
                required
                className="block w-full pl-16 pr-4 py-3 rounded-lg border border-border bg-surface text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label htmlFor="adminPin" className="block text-sm font-semibold text-text mb-2">
              Admin Master PIN
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="adminPin"
                type="password"
                placeholder="Enter 123456 or Admin PIN"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-surface text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-medium font-mono"
              />
            </div>
            <p className="mt-1.5 text-xs text-muted">
              Master PIN: <code className="bg-surface px-1.5 py-0.5 rounded border border-border font-mono text-primary font-bold">123456</code>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary hover:bg-primary-hover text-surface font-semibold shadow-sm transition-colors disabled:opacity-50 text-sm cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Authenticating Admin...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Instant Admin Access</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted">
        <p>Admin / Staff numbers in allowlist get automatic dashboard access.</p>
        <p className="mt-1 font-medium">{COMPANY_DETAILS.address.fullFormatted}</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block text-3xl font-black tracking-tight text-primary">
          TOLAND
        </Link>
        <p className="mt-1 text-xs text-muted font-medium uppercase tracking-wider">
          Denim Jeans & Casuals Manufacturer
        </p>
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-text">
          Portal Authentication
        </h2>
        <p className="mt-2 text-sm text-muted">
          Login using WhatsApp One-Time Password or Admin Direct PIN
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense
          fallback={
            <div className="bg-surface-alt p-8 rounded-xl border border-border text-center text-muted text-sm">
              Loading authentication...
            </div>
          }
        >
          <LoginFormContent />
        </Suspense>
      </div>
    </div>
  );
}
