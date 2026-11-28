'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { COMPANY_DETAILS } from '@toland/shared';
import { isTeamRole, normalizeRoleValue, resolveUserRole } from '@/lib/rbac';
import {
  MessageSquare,
  Mail,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Phone,
  KeyRound,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
} from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';

  // Auth Mode: WhatsApp vs Email
  const [authMode, setAuthMode] = useState<'whatsapp' | 'email'>('whatsapp');

  // WhatsApp OTP states
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [waStep, setWaStep] = useState<'phone' | 'otp'>('phone');
  const [countdown, setCountdown] = useState(0);
  const [sentOtpHint, setSentOtpHint] = useState<string | null>(null);

  // Email Auth states (Sign In vs Sign Up)
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  const [emailSignupStep, setEmailSignupStep] = useState<'form' | 'otp'>('form');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Admin Direct PIN states
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPin, setAdminPin] = useState('');

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(searchParams.get('error'));
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const supabase = createClient();

  // Resend countdown timer for WhatsApp & Email OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (emailCountdown > 0) {
      const timer = setTimeout(() => setEmailCountdown(emailCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [emailCountdown]);

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

  // -----------------------------------------------------------------------------
  // 1. WhatsApp OTP Handlers
  // -----------------------------------------------------------------------------
  const handleSendWhatsAppOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
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
      setWaStep('otp');
      setCountdown(60);
      setOtp(''); // Require manual entry from WhatsApp message
      setSuccessMsg(`6-digit verification code sent to your WhatsApp on ${formattedPhone}!`);
    } catch (err: any) {
      console.error('Send OTP Error:', err);
      setError(err.message || 'Failed to send OTP. Please check your number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyWhatsAppOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

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

      if (isTeamRole(normalizeRoleValue(data.role))) {
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

  // -----------------------------------------------------------------------------
  // 2. Email & Password Handlers (Sign In & Sign Up)
  // -----------------------------------------------------------------------------
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        throw signInError;
      }

      const user = data.user;
      if (isTeamRole(resolveUserRole(user))) {
        router.push('/admin');
      } else {
        router.push(redirectTo);
      }
      router.refresh();
    } catch (err: any) {
      console.error('Email Sign In Error:', err);
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const completePostAuthRedirect = (user: any, targetEmail: string) => {
    const resolved = resolveUserRole({
      email: targetEmail || user?.email,
      app_metadata: user?.app_metadata,
      user_metadata: user?.user_metadata,
    });
    if (isTeamRole(resolved)) {
      router.push('/admin');
    } else {
      router.push(redirectTo);
    }
    router.refresh();
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim().toLowerCase();
    const formattedPhone = formatPhoneNumber(signupPhone);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Please enter your full name (minimum 2 characters).');
      return;
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!/^\+91[6-9]\d{9}$/.test(formattedPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      // 1. Pre-check email & mobile uniqueness globally across all registered users
      const preRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
          name: fullName.trim(),
          phone: formattedPhone,
        }),
      });

      const preData = await preRes.json();
      if (!preRes.ok) {
        throw new Error(preData.error || 'Registration validation failed');
      }

      // 2. Initiate Supabase Auth Signup so OTP/Verification email is sent by Supabase
      const origin =
        typeof window !== 'undefined' ? window.location.origin : 'https://toland-web.vercel.app';
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: preData.email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          data: {
            name: preData.name,
            phone: preData.phone,
            role: 'customer',
          },
        },
      });

      if (signUpErr) {
        throw signUpErr;
      }

      if (signUpData?.user?.identities && signUpData.user.identities.length === 0) {
        throw new Error('An account with this email already exists. Please Sign In instead.');
      }

      if (signUpData?.session) {
        setSuccessMsg('Account verified and created! Redirecting...');
        completePostAuthRedirect(signUpData.session.user, preData.email);
        return;
      }

      // 3. Require Supabase Auth Email OTP verification before account activation
      setEmail(preData.email);
      setSignupPhone(preData.phone);
      setEmailSignupStep('otp');
      setEmailCountdown(60);
      setEmailOtp('');
      setSuccessMsg(
        `Verification code sent to ${preData.email} via Supabase Auth. Verify your email below to activate your account.`
      );
    } catch (err: any) {
      console.error('Email Sign Up Error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const token = emailOtp.trim();
    if (!/^\d{6,8}$/.test(token)) {
      setError('Please enter the 6 to 8-digit verification code sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const { data, error: verifyErr } = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token,
        type: 'signup',
      });

      if (verifyErr) {
        throw verifyErr;
      }

      const { data: refreshed } = await supabase.auth.refreshSession();
      const verifiedUser = refreshed?.user || data.user;

      setSuccessMsg('Email verified & account activated! Redirecting...');
      completePostAuthRedirect(verifiedUser, trimmedEmail);
    } catch (err: any) {
      console.error('Email OTP Verify Error:', err);
      setError(err.message || 'Invalid or expired email verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmailOtp = async () => {
    if (emailCountdown > 0) return;
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const origin =
        typeof window !== 'undefined' ? window.location.origin : 'https://toland-web.vercel.app';
      const { error: resendErr } = await supabase.auth.resend({
        type: 'signup',
        email: trimmedEmail,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (resendErr) throw resendErr;
      setEmailCountdown(60);
      setSuccessMsg(`A fresh verification code has been sent to ${trimmedEmail}.`);
    } catch (err: any) {
      console.error('Resend Email OTP Error:', err);
      setError(err.message || 'Failed to resend verification email. Please wait a minute and retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckEmailConfirmedViaLink = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (signInErr) {
        if (signInErr.message?.toLowerCase().includes('not confirmed')) {
          throw new Error('Your email is still not verified yet. Please enter the OTP code or click the link in your email.');
        }
        throw signInErr;
      }
      setSuccessMsg('Email verified! Signing you in...');
      completePostAuthRedirect(data.user, trimmedEmail);
    } catch (err: any) {
      setError(err.message || 'Could not confirm email status yet.');
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------------------------
  // 3. Admin Direct Master PIN Handler
  // -----------------------------------------------------------------------------
  const handleAdminMasterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

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
      {/* Top Level Navigation Tabs: WhatsApp Phone vs Email */}
      <div className="flex rounded-lg bg-surface p-1 border border-border mb-6">
        <button
          type="button"
          onClick={() => {
            setAuthMode('whatsapp');
            setError(null);
            setSuccessMsg(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            authMode === 'whatsapp'
              ? 'bg-primary text-surface shadow-xs'
              : 'text-muted hover:text-text'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-accent" />
          <span>WhatsApp Phone</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMode('email');
            setError(null);
            setSuccessMsg(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            authMode === 'email'
              ? 'bg-primary text-surface shadow-xs'
              : 'text-muted hover:text-text'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Email & Password</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 rounded-lg bg-accent/10 border border-accent/30 text-accent text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* MODE 1: WhatsApp Authentication                                         */}
      {/* ----------------------------------------------------------------------- */}
      {authMode === 'whatsapp' ? (
        !showAdminPin ? (
          waStep === 'phone' ? (
            <form onSubmit={handleSendWhatsAppOtp} className="space-y-6">
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
                    className="block w-full pl-16 pr-4 py-3 rounded-lg border border-border bg-surface text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-medium"
                  />
                </div>
              </div>

              <div className="p-3 bg-surface rounded-lg border border-border flex items-center gap-3 text-xs text-muted">
                <MessageSquare className="w-4 h-4 text-accent flex-shrink-0" />
                <span>You will receive a 6-digit login code directly on WhatsApp.</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary hover:bg-primary-hover text-surface font-semibold shadow-sm transition-colors disabled:opacity-50 text-sm cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating OTP...</span>
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
            <form onSubmit={handleVerifyWhatsAppOtp} className="space-y-6">
              <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg flex items-center gap-2.5 text-xs text-text">
                <MessageSquare className="w-4 h-4 text-accent shrink-0" />
                <span>
                  6-digit verification code has been sent to your WhatsApp on <strong className="font-mono text-primary font-bold">{phone}</strong>.
                </span>
              </div>

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
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setWaStep('phone')}
                  className="text-muted hover:text-primary transition-colors cursor-pointer"
                >
                  Change phone number
                </button>
                {countdown > 0 ? (
                  <span className="text-muted">Resend in {countdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendWhatsAppOtp}
                    disabled={loading}
                    className="font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </form>
          )
        ) : (
          /* Admin Direct PIN Bypass */
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
                  placeholder="Enter 123456"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-surface text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-mono font-medium"
                />
              </div>
              <p className="mt-1.5 text-xs text-muted">
                Default Owner PIN: <code className="bg-surface px-1.5 py-0.5 rounded border border-border font-mono text-primary font-bold">123456</code>
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
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Instant Dashboard Entry</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowAdminPin(false)}
                className="text-xs text-muted hover:text-primary transition-colors cursor-pointer"
              >
                Back to WhatsApp OTP
              </button>
            </div>
          </form>
        )
      ) : (
        /* --------------------------------------------------------------------- */
        /* MODE 2: Email & Password (Sign In vs Sign Up)                         */
        /* --------------------------------------------------------------------- */
        <div>
          {/* Sub-toggle: Sign In vs Create Account */}
          <div className="flex border-b border-border mb-6">
            <button
              type="button"
              onClick={() => {
                setEmailMode('signin');
                setEmailSignupStep('form');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`pb-3 text-sm font-semibold flex-1 text-center border-b-2 transition-colors cursor-pointer ${
                emailMode === 'signin'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-text'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmailMode('signup');
                setEmailSignupStep('form');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`pb-3 text-sm font-semibold flex-1 text-center border-b-2 transition-colors cursor-pointer ${
                emailMode === 'signup'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-text'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </span>
            </button>
          </div>

          {emailMode === 'signin' ? (
            /* Email Sign In Form */
            <form onSubmit={handleEmailSignIn} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-text mb-2">
                  Email Address
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-text">
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="block w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-surface text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-text cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary bg-surface cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-muted cursor-pointer">
                  Remember this device for 30 days
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary hover:bg-primary-hover text-surface font-semibold shadow-sm transition-colors disabled:opacity-50 text-sm cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In with Email</span>
                  </>
                )}
              </button>
            </form>
          ) : emailSignupStep === 'form' ? (
            /* Email Sign Up Form (Step 1: Uniqueness Check + Supabase Email OTP) */
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-text mb-1.5">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="e.g. Rahul Sharma / City Store"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  minLength={2}
                  className="block w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label htmlFor="signupEmail" className="block text-sm font-semibold text-text mb-1.5">
                  Email Address <span className="text-xs font-normal text-muted">(OTP required)</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="signupEmail"
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signupPhone" className="block text-sm font-semibold text-text mb-1.5">
                  Mobile Number <span className="text-xs font-normal text-muted">(unique 10-digit Indian mobile)</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                    <Phone className="h-4 w-4" />
                    <span className="ml-1.5 text-sm font-semibold">+91</span>
                  </div>
                  <input
                    id="signupPhone"
                    type="tel"
                    placeholder="98765 43210"
                    value={signupPhone.replace(/^\+91/, '')}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    required
                    className="block w-full pl-16 pr-4 py-2.5 rounded-lg border border-border bg-surface text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signupPassword" className="block text-sm font-semibold text-text mb-1.5">
                  Password <span className="text-xs font-normal text-muted">(minimum 6 characters)</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="signupPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="block w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-surface text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-text cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-surface rounded-lg border border-border flex items-center gap-2.5 text-xs text-muted">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span>Your account will only activate after verifying your email via Supabase Auth OTP.</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary hover:bg-primary-hover text-surface font-semibold shadow-sm transition-colors disabled:opacity-50 text-sm cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Verification OTP...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Verify Email &amp; Create Account</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Email Sign Up Form (Step 2: Supabase Auth Email OTP Verification) */
            <form onSubmit={handleVerifyEmailOtp} className="space-y-5">
              <div className="p-3.5 bg-accent/10 border border-accent/25 rounded-lg space-y-1 text-xs text-text">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>Supabase Auth Verification Required</span>
                </div>
                <p className="text-muted leading-relaxed">
                  We sent an email verification code to <strong className="text-text">{email}</strong>. Enter the OTP code below (or click the confirmation link in your email) to activate your account.
                </p>
              </div>

              <div>
                <label htmlFor="emailOtp" className="block text-sm font-semibold text-text mb-2">
                  Enter Email Verification OTP
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    id="emailOtp"
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="Enter OTP code"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
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
                    <span>Verifying Email OTP...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify OTP &amp; Activate Account</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCheckEmailConfirmedViaLink}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg border border-border bg-surface hover:bg-surface-alt text-xs font-semibold text-text transition-colors cursor-pointer"
              >
                Already clicked the confirmation link in email? Continue &rarr;
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setEmailSignupStep('form');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-muted hover:text-primary transition-colors cursor-pointer"
                >
                  Change email / mobile
                </button>
                {emailCountdown > 0 ? (
                  <span className="text-muted">Resend in {emailCountdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendEmailOtp}
                    disabled={loading}
                    className="font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
                  >
                    Resend Email OTP
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      {/* Footer Details */}
      <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted">
        <p>Admin accounts with authorized email or phone get automatic dashboard access.</p>
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
          Access your storefront or factory management dashboard
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
