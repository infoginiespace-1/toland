import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DevicePairingCard } from '@/components/admin/whatsapp/device-pairing-card';
import {
  MessageSquare,
  ArrowLeft,
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminWhatsAppPage() {
  let supabase: any;
  try {
    supabase = createAdminClient();
  } catch {
    supabase = createClient();
  }

  // Parallel fetch: DB queries and bridge status in one simultaneous roundtrip
  const bridgeUrl = process.env.WHATSAPP_BRIDGE_URL || 'https://toland-whatsapp-bridge.onrender.com';
  const secret = process.env.WHATSAPP_BRIDGE_SECRET || 'toland_bridge_secret_dev';
  const todayStr = new Date().toISOString().split('T')[0];

  const fetchBridgeStatus = async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 900);
      const res = await fetch(`${bridgeUrl}/status`, {
        headers: { 'x-bridge-secret': secret },
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) return await res.json();
    } catch {
      return null;
    }
    return null;
  };

  const [
    { data: sessionData },
    bridgeData,
    { data: settingsData },
    { data: recentMessagesData },
    { data: templatesData },
    { count: queuedCount },
    { count: sentTodayCount },
  ] = await Promise.all([
    supabase
      .from('wa_sessions')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single(),
    fetchBridgeStatus(),
    supabase.from('wa_settings').select('*').limit(1).single(),
    supabase
      .from('wa_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15),
    supabase
      .from('wa_templates')
      .select('*')
      .order('created_at', { ascending: true }),
    supabase
      .from('wa_messages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'queued'),
    supabase
      .from('wa_messages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('created_at', todayStr),
  ]);

  let session = sessionData as any;
  if (bridgeData?.status) {
    session = {
      ...(session || {}),
      status: bridgeData.status,
      connected_phone: bridgeData.connected_phone || session?.connected_phone,
      last_seen: bridgeData.last_seen || session?.last_seen,
    };
  }

  const settings = settingsData as any;
  const recentMessages = (recentMessagesData || []) as any[];
  const templates = (templatesData || []) as any[];

  const isConnected = session?.status === 'connected';
  const isQrReady = session?.status === 'qr_ready';
  const isQrExpired =
    isQrReady &&
    session?.updated_at &&
    Date.now() - new Date(session.updated_at).getTime() > 90000;
  const isQueuePaused = settings?.queue_paused ?? false;

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-surface-alt border-b border-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-text transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <div className="h-4 w-px bg-border"></div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-text">WhatsApp Automation & Bridge</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-success/15 text-success border border-success/30">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                Connected: +{session.connected_phone}
              </span>
            ) : isQrReady ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-warning/15 text-warning border border-warning/30">
                <QrCode className="w-3.5 h-3.5" />
                QR Ready for Scan
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-muted/15 text-muted border border-border">
                <span className="w-2 h-2 rounded-full bg-muted"></span>
                {session?.status || 'Disconnected'}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Status & Anti-Ban Controls Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. Realtime Reactive Device Pairing & Status Card */}
          <DevicePairingCard initialSession={session} />

          {/* 2. Anti-Ban Safeguards Card */}
          <div className="bg-surface-alt border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Anti-Ban Safeguards</h2>
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-border">
                  <span className="text-muted">Warmup Mode:</span>
                  <span className="font-bold text-text">
                    {settings?.warmup_enabled ? `Active (Day ${settings.warmup_day})` : 'Disabled'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-border">
                  <span className="text-muted">Human Typing Delay:</span>
                  <span className="font-bold text-text">
                    {settings?.min_delay_s || 4}s – {settings?.max_delay_s || 12}s jitter
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-border">
                  <span className="text-muted">Quiet Hours:</span>
                  <span className="font-bold text-text">
                    {settings?.quiet_hours_start || '22:00'} – {settings?.quiet_hours_end || '08:00'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-border">
                  <span className="text-muted">Opt-Out Auto-Handler:</span>
                  <span className="font-bold text-success">Active (&quot;STOP&quot; / &quot;बंद&quot;)</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted">Failure Streak:</span>
              <span className="font-bold text-text">{settings?.failure_streak || 0} / {settings?.failure_threshold || 5}</span>
            </div>
          </div>

          {/* 3. Realtime Queue & Volume Limits */}
          <div className="bg-surface-alt border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Queue & Rate Limits</h2>
                {isQueuePaused ? (
                  <PauseCircle className="w-5 h-5 text-danger" />
                ) : (
                  <PlayCircle className="w-5 h-5 text-success" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-surface rounded-lg border border-border text-center">
                  <div className="text-2xl font-black text-text">{queuedCount || 0}</div>
                  <div className="text-xs text-muted font-medium mt-0.5">In Queue</div>
                </div>
                <div className="p-3 bg-surface rounded-lg border border-border text-center">
                  <div className="text-2xl font-black text-text">{sentTodayCount || 0}</div>
                  <div className="text-xs text-muted font-medium mt-0.5">Sent Today</div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-muted">
                  <span>Daily Cap:</span>
                  <span className="font-bold text-text">{settings?.daily_cap || 500} msgs/day</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Hourly Cap:</span>
                  <span className="font-bold text-text">{settings?.hourly_cap || 60} msgs/hr</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Queue Status:</span>
                  <span className={`font-bold ${isQueuePaused ? 'text-danger' : 'text-success'}`}>
                    {isQueuePaused ? 'PAUSED' : 'ACTIVE & PROCESSING'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="text-xs text-muted">
                Priority: OTP (1) &gt; Order Updates (2) &gt; Marketing (3)
              </div>
            </div>
          </div>
        </div>

        {/* Templates Seeded */}
        <div className="bg-surface-alt border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-text">WhatsApp Templates</h2>
              <p className="text-xs text-muted">Pre-configured message formats with dynamic variables & spintax support.</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-surface border border-border text-text">
              {templates?.length || 0} Templates
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates?.map((t) => (
              <div key={t.id} className="p-4 rounded-lg bg-surface border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-text">{t.name}</span>
                  <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-surface-alt border border-border text-muted">
                    {t.category}
                  </span>
                </div>
                <div className="text-xs font-mono text-muted bg-surface-alt p-2 rounded border border-border/50 whitespace-pre-wrap">
                  {t.body}
                </div>
                <div className="text-xs text-muted">
                  Variables: <span className="font-mono text-text">{t.variables?.join(', ') || 'None'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Message Log Table */}
        <div className="bg-surface-alt border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-text">Live Message Traffic</h2>
              <p className="text-xs text-muted">Recent inbound and outbound WhatsApp communication logs.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface border-b border-border text-muted uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Direction</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Message Snippet</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentMessages && recentMessages.length > 0 ? (
                  recentMessages.map((msg) => (
                    <tr key={msg.id} className="hover:bg-surface/50 transition-colors">
                      <td className="py-3 px-4 font-semibold">
                        {msg.direction === 'outbound' ? (
                          <span className="inline-flex items-center gap-1 text-primary">
                            <Send className="w-3 h-3" /> Outbound
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-accent">
                            <MessageSquare className="w-3 h-3" /> Inbound
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-text">+{msg.phone}</td>
                      <td className="py-3 px-4 text-muted max-w-xs truncate">{msg.body}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-2xs font-bold uppercase bg-surface border border-border text-text">
                          P{msg.priority || 2}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-2xs font-bold uppercase ${
                            msg.status === 'sent' || msg.status === 'delivered'
                              ? 'bg-success/15 text-success border border-success/30'
                              : msg.status === 'queued'
                              ? 'bg-warning/15 text-warning border border-warning/30'
                              : 'bg-danger/15 text-danger border border-danger/30'
                          }`}
                        >
                          {msg.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted">
                      No WhatsApp messages recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
