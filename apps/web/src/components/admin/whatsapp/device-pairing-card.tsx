'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Smartphone,
  QrCode,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface DevicePairingCardProps {
  initialSession: any;
}

export function DevicePairingCard({ initialSession }: DevicePairingCardProps) {
  const [session, setSession] = useState(initialSession);
  const [activeTab, setActiveTab] = useState<'qr' | 'code'>('qr');
  const [phone, setPhone] = useState('8797186001');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [loadingCode, setLoadingCode] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [testPhone, setTestPhone] = useState('8797186001');
  const [testSending, setTestSending] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createClient();

  // 1. Subscribe to Supabase Realtime updates on wa_sessions + Active Live Polling
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/admin/whatsapp/status');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.status) {
            setSession((prev: any) => ({
              ...(prev || {}),
              status: data.status,
              connected_phone: data.connected_phone || prev?.connected_phone,
              qr: data.qr || prev?.qr,
              last_seen: data.last_seen || prev?.last_seen,
            }));
          }
        }
      } catch {
        // Silently retry on next interval
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 4000);

    const channel = supabase
      .channel('wa_sessions_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wa_sessions' },
        (payload) => {
          if (payload.new) {
            setSession(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Calculate QR expiry status
  const isConnected = session?.status === 'connected';
  const isQrReady = session?.status === 'qr_ready';
  const isQrExpired =
    isQrReady &&
    session?.updated_at &&
    Date.now() - new Date(session.updated_at).getTime() > 60000;

  // 2. Manual Reconnect / Fresh QR trigger
  const handleReconnect = async () => {
    setReconnecting(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch('/api/admin/whatsapp/reconnect', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reconnect bridge');
      }
      setFeedbackMsg({
        type: 'success',
        text: 'Bridge reconnected! A fresh QR code is being generated...',
      });
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Error reconnecting bridge',
      });
    } finally {
      setReconnecting(false);
    }
  };

  // 3. Request 8-Digit Pairing Code
  const handleRequestPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingCode(true);
    setFeedbackMsg(null);
    setPairingCode(null);

    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

      const res = await fetch('/api/admin/whatsapp/pair-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to request pairing code');
      }

      setPairingCode(data.code);
      setFeedbackMsg({
        type: 'success',
        text: 'Pairing code generated! Open WhatsApp on your phone to link.',
      });
    } catch (err: any) {
      const msg = err.message === 'fetch failed'
        ? 'WhatsApp Bridge is offline or starting up on Render. Please click Reconnect Bridge.'
        : (err.message || 'Error generating pairing code.');
      setFeedbackMsg({
        type: 'error',
        text: msg,
      });
    } finally {
      setLoadingCode(false);
    }
  };

  // 4. Send Test WhatsApp Message
  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestSending(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch('/api/admin/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhone,
          message: `Hello! This is a test message from TOLAND Denim Sheikhpura bridge. Connected successfully at ${new Date().toLocaleTimeString()}.`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send test message');
      }

      setFeedbackMsg({
        type: 'success',
        text: `Test message queued successfully for +91${testPhone.replace(/^91/, '')}!`,
      });
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Error sending test message.',
      });
    } finally {
      setTestSending(false);
    }
  };

  return (
    <div className="bg-surface-alt border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
              Baileys Device Pairing
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReconnect}
              disabled={reconnecting}
              title="Force reconnect & generate fresh QR code"
              className="p-1.5 rounded-lg border border-border hover:bg-surface text-muted hover:text-text transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reconnecting ? 'animate-spin text-primary' : ''}`} />
            </button>
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-extrabold bg-success/15 text-success border border-success/30">
                <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                Connected
              </span>
            ) : isQrReady && !isQrExpired ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-extrabold bg-warning/15 text-warning border border-warning/30">
                <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>
                Live Socket
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-semibold bg-muted/15 text-muted">
                Waiting for Bridge
              </span>
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`mb-4 p-3 rounded-lg text-xs flex items-start gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-success/10 border border-success/30 text-success'
                : 'bg-danger/10 border border-danger/30 text-danger'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* CONNECTED STATE */}
        {isConnected ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-success/10 border border-success/20 flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-success shrink-0" />
              <div>
                <div className="text-sm font-bold text-text">WhatsApp Device Connected</div>
                <div className="text-xs text-muted">
                  Phone: <strong className="text-text font-mono font-bold">+{session.connected_phone}</strong>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
              <div className="text-xs font-bold text-text">Send Quick Test Message</div>
              <form onSubmit={handleSendTestMessage} className="flex gap-2">
                <input
                  type="tel"
                  placeholder="Recipient Mobile"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-surface-alt text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={testSending}
                  className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-hover flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {testSending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pairing Mode Switcher: QR Code vs Phone Code */}
            <div className="flex rounded-lg bg-surface p-1 border border-border">
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  activeTab === 'qr'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted hover:text-text'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Code Scan</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  activeTab === 'code'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted hover:text-text'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>8-Digit Code</span>
              </button>
            </div>

            {/* TAB 1: QR Code Scan */}
            {activeTab === 'qr' ? (
              isQrReady && session?.qr ? (
                <div className="text-center py-2 space-y-3">
                  <div className="inline-block p-3 bg-white rounded-xl border border-border shadow-sm relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={session.qr}
                      alt="WhatsApp Web QR Code"
                      className={`w-48 h-48 mx-auto transition-opacity ${
                        isQrExpired ? 'opacity-20 blur-[1px]' : 'opacity-100'
                      }`}
                    />
                    {isQrExpired && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-surface/90 rounded-xl space-y-2">
                        <AlertTriangle className="w-6 h-6 text-warning" />
                        <span className="text-xs font-bold text-text">QR Expired</span>
                        <button
                          onClick={handleReconnect}
                          disabled={reconnecting}
                          className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-hover flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${reconnecting ? 'animate-spin' : ''}`} />
                          <span>Generate Fresh QR</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-text">
                      WhatsApp on Phone &gt; Linked Devices &gt; Link a Device
                    </p>
                    <p className="text-3xs text-muted">
                      Status: {isQrExpired ? 'Stale · Click above to refresh' : 'Socket Active · Ready to scan'}
                    </p>
                  </div>
                  <div className="pt-1">
                    <button
                      onClick={handleReconnect}
                      disabled={reconnecting}
                      className="inline-flex items-center gap-1 text-2xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${reconnecting ? 'animate-spin' : ''}`} />
                      <span>Regenerate QR Code</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-muted text-xs space-y-3">
                  <RefreshCw className={`w-6 h-6 mx-auto ${reconnecting ? 'animate-spin text-primary' : 'text-muted opacity-40'}`} />
                  <div>Bridge is waiting for connection...</div>
                  <button
                    onClick={handleReconnect}
                    disabled={reconnecting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-hover cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{reconnecting ? 'Connecting...' : 'Reconnect & Generate QR'}</span>
                  </button>
                </div>
              )
            ) : (
              /* TAB 2: 8-Digit Pairing Code (No Camera Scan Required) */
              <div className="space-y-4 py-2">
                <form onSubmit={handleRequestPairingCode} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-text mb-1">
                      Business Phone Number
                    </label>
                    <div className="relative rounded-lg shadow-2xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted font-mono text-xs">
                        +91
                      </div>
                      <input
                        type="tel"
                        value={phone.replace(/^\+?91/, '')}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="8797186001"
                        required
                        className="w-full pl-12 pr-3 py-2 rounded-lg border border-border bg-surface text-xs font-mono font-semibold text-text focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loadingCode}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {loadingCode ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Requesting Pairing Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Get 8-Digit Code</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>

                {pairingCode && (
                  <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 text-center space-y-2">
                    <div className="text-2xs font-bold uppercase tracking-wider text-accent">
                      Enter this code on your WhatsApp:
                    </div>
                    <div className="text-2xl font-black font-mono tracking-widest text-primary">
                      {pairingCode.slice(0, 4)}-{pairingCode.slice(4)}
                    </div>
                    <div className="text-3xs text-muted">
                      Open WhatsApp on phone &gt; Linked Devices &gt; Link with phone number instead.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-2xs text-muted">
        <span>Persistent Postgres Auth Store</span>
        <button
          onClick={handleReconnect}
          disabled={reconnecting}
          className="text-primary hover:underline font-medium cursor-pointer"
        >
          {reconnecting ? 'Reconnecting...' : 'Force Refresh Socket'}
        </button>
      </div>
    </div>
  );
}
