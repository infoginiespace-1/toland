import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DevicePairingCard } from '@/components/admin/whatsapp/device-pairing-card';
import { LiveInboxClient } from '@/components/admin/whatsapp/live-inbox-client';
import {
  MessageSquare,
  QrCode,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  FileSpreadsheet,
  Radio,
  Bot,
  Sliders,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminWhatsAppPage() {
  let supabase: any;
  try {
    supabase = createAdminClient();
  } catch {
    supabase = createClient();
  }

  const bridgeUrl = process.env.WHATSAPP_BRIDGE_URL || 'https://toland-whatsapp-bridge.onrender.com';
  const secret = process.env.WHATSAPP_BRIDGE_SECRET || 'toland_bridge_secret_dev';

  // Compute IST midnight ISO string for accurate Sent Today counter
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(Date.now() + istOffsetMs);
  const istMidnightUtc = new Date(
    Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()) - istOffsetMs
  ).toISOString();

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
    { data: crmCustomers },
    { data: crmLeads },
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
      .limit(200),
    supabase
      .from('wa_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
    supabase.from('customers_crm').select('phone, name'),
    supabase.from('leads').select('phone, name'),
    supabase
      .from('wa_messages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'queued'),
    supabase
      .from('wa_messages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('sent_at', istMidnightUtc),
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

  // Build phone -> contact name lookup map
  const contactNames: Record<string, string> = {};
  (crmLeads || []).forEach((l: any) => {
    const p10 = String(l.phone || '').replace(/\D/g, '').slice(-10);
    if (p10 && l.name) contactNames[p10] = l.name;
  });
  (crmCustomers || []).forEach((c: any) => {
    const p10 = String(c.phone || '').replace(/\D/g, '').slice(-10);
    if (p10 && c.name) contactNames[p10] = c.name;
  });

  const isConnected = session?.status === 'connected';
  const isQrReady = session?.status === 'qr_ready';
  const isQueuePaused = settings?.queue_paused ?? false;
  const displaySentToday =
    typeof bridgeData?.queue?.sent_today === 'number'
      ? bridgeData.queue.sent_today
      : sentTodayCount || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Clean Header Inside AdminSidebar Layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CFE0D5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#14532D] uppercase tracking-wider">
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp &amp; Customer Engagement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Live Inbox &amp; Baileys Bridge
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time two-way customer messaging, QR/Code device pairing, and anti-ban queue telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isConnected ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Connected: +{session.connected_phone}
            </span>
          ) : isQrReady ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <QrCode className="w-3.5 h-3.5" />
              QR Ready for Scan
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 capitalize">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              {session?.status || 'Disconnected'}
            </span>
          )}
        </div>
      </div>

      {/* Sub-Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <Link
          href="/admin/whatsapp"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#14532D] text-white font-semibold whitespace-nowrap"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Live Inbox &amp; Bridge</span>
        </Link>
        <Link
          href="/admin/whatsapp/auto-replies"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#CFE0D5] text-slate-700 hover:border-[#14532D] font-semibold whitespace-nowrap transition-colors"
        >
          <Bot className="w-3.5 h-3.5 text-[#14532D]" />
          <span>Auto-Reply Bot</span>
        </Link>
        <Link
          href="/admin/whatsapp/campaigns"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#CFE0D5] text-slate-700 hover:border-[#14532D] font-semibold whitespace-nowrap transition-colors"
        >
          <Radio className="w-3.5 h-3.5 text-[#14532D]" />
          <span>Broadcast Campaigns</span>
        </Link>
        <Link
          href="/admin/whatsapp/templates"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#CFE0D5] text-slate-700 hover:border-[#14532D] font-semibold whitespace-nowrap transition-colors"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-[#14532D]" />
          <span>Templates ({templates.length})</span>
        </Link>
        <Link
          href="/admin/whatsapp/settings"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#CFE0D5] text-slate-700 hover:border-[#14532D] font-semibold whitespace-nowrap transition-colors"
        >
          <Sliders className="w-3.5 h-3.5 text-[#14532D]" />
          <span>Anti-Ban Engine</span>
        </Link>
      </div>

      {/* Real-Time Two-Way Inbox */}
      <LiveInboxClient
        initialMessages={recentMessages}
        templates={templates}
        contactNames={contactNames}
      />

      {/* Device Pairing, Anti-Ban Safeguards & Queue Limits Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DevicePairingCard initialSession={session} />

        {/* Anti-Ban Safeguards Card */}
        <div className="bg-white border border-[#CFE0D5] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Anti-Ban Safeguards</h2>
              <ShieldCheck className="w-5 h-5 text-[#14532D]" />
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Warmup Mode:</span>
                <span className="font-bold text-slate-900">
                  {settings?.warmup_enabled ? `Active (Day ${settings.warmup_day})` : 'Disabled'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Human Typing Jitter:</span>
                <span className="font-bold text-slate-900">
                  {settings?.min_delay_s || 4}s – {settings?.max_delay_s || 12}s
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Quiet Hours (IST):</span>
                <span className="font-bold text-slate-900">
                  {(settings?.quiet_hours_start || '22:00').slice(0, 5)} – {(settings?.quiet_hours_end || '08:00').slice(0, 5)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Opt-Out Auto-Handler:</span>
                <span className="font-bold text-emerald-700">Active (&quot;STOP&quot; / &quot;बंद&quot;)</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Failure Streak:</span>
            <span className="font-bold text-slate-900">
              {settings?.failure_streak || 0} / {settings?.failure_threshold || 5}
            </span>
          </div>
        </div>

        {/* Realtime Queue & Volume Limits */}
        <div className="bg-white border border-[#CFE0D5] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Queue &amp; Rate Limits</h2>
              {isQueuePaused ? (
                <PauseCircle className="w-5 h-5 text-rose-600" />
              ) : (
                <PlayCircle className="w-5 h-5 text-emerald-600" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-[#F0F7F2] rounded-xl border border-[#CFE0D5] text-center">
                <div className="text-2xl font-extrabold text-[#14532D]">{queuedCount || 0}</div>
                <div className="text-xs text-slate-600 font-medium mt-0.5">In Queue</div>
              </div>
              <div className="p-3 bg-[#F0F7F2] rounded-xl border border-[#CFE0D5] text-center">
                <div className="text-2xl font-extrabold text-[#14532D]">{displaySentToday}</div>
                <div className="text-xs text-slate-600 font-medium mt-0.5">Sent Today (IST)</div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Daily Cap:</span>
                <span className="font-bold text-slate-900">{settings?.daily_cap || 500} msgs/day</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Hourly Cap:</span>
                <span className="font-bold text-slate-900">{settings?.hourly_cap || 60} msgs/hr</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Queue Status:</span>
                <span className={`font-bold ${isQueuePaused ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {isQueuePaused ? 'PAUSED' : 'ACTIVE & PROCESSING'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">P1 OTP &gt; P2 Orders &gt; P3 Bulk</span>
            <Link href="/admin/whatsapp/settings" className="font-bold text-[#14532D] hover:underline">
              Configure &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
