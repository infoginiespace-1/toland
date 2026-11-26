'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { COMPANY_DETAILS } from '@toland/shared';
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
  const [phone, setPhone] = useState('8797186001');
  const [otp, setOtp] = useState('');
  const [waStep, setWaStep] = useState<'phone' | 'otp'>('phone');
  const [countdown, setCountdown] = useState(0);
  const [sentOtpHint, setSentOtpHint] = useState<string | null>(null);

  // Email Auth states (Sign In vs Sign Up)
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Admin Direct PIN states
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [adminPhone, setAdminPhone] = useState('8797186001');
  const [adminPin, setAdminPin] = useState('');

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const supabase = createClient();

  // Resend countdown timer for WhatsApp OTP
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
      const role = (user?.app_metadata?.role as string) || (user?.user_metadata?.role as string) || 'customer';

      if (role === 'admin' || role === 'staff' || email.toLowerCase() === 'info.giniespace@gmail.com') {
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

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: fullName.trim() || undefined,
            phone: signupPhone ? formatPhoneNumber(signupPhone) : undefined,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.session) {
        // Instant login session established
        setSuccessMsg('Account created successfully! Redirecting...');
        const role = (data.user?.app_metadata?.role as string) || 'customer';
        if (role === 'admin' || email.toLowerCase() === 'info.giniespace@gmail.com') {
          router.push('/admin');
        } else {
          router.push(redirectTo);
        }
        router.refresh();
      } else {
        setSuccessMsg('Registration successful! Please check your email inbox to confirm your account.');
        setEmailMode('signin');
      }
    } catch (err: any) {
      console.error('Email Sign Up Error:', err);
      setError(err.message || 'Registration failed. Please try again.');
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
          ) : (
            /* Email Sign Up Form */
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
                  className="block w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label htmlFor="signupEmail" className="block text-sm font-semibold text-text mb-1.5">
                  Email Address
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
                  Mobile Number <span className="text-xs font-normal text-muted">(for order WhatsApp alerts)</span>
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
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
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

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary hover:bg-primary-hover text-surface font-semibold shadow-sm transition-colors disabled:opacity-50 text-sm cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Free Account</span>
                  </>
                )}
              </button>
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
