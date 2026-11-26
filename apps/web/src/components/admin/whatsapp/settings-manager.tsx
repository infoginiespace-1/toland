'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sliders,
  ShieldCheck,
  Clock,
  Sparkles,
  Bot,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Moon,
  Zap,
} from 'lucide-react';

interface SettingsItem {
  id?: string;
  daily_cap: number;
  hourly_cap: number;
  min_delay_s: number;
  max_delay_s: number;
  quiet_hours_start: string;
  quiet_hours_end: string;
  warmup_enabled: boolean;
  warmup_day: number;
  autoreply_enabled: boolean;
}

interface SettingsManagerProps {
  settings: SettingsItem | null;
}

export function SettingsManager({ settings }: SettingsManagerProps) {
  const router = useRouter();

  const [dailyCap, setDailyCap] = useState(settings?.daily_cap || 500);
  const [hourlyCap, setHourlyCap] = useState(settings?.hourly_cap || 60);
  const [minDelay, setMinDelay] = useState(settings?.min_delay_s || 4);
  const [maxDelay, setMaxDelay] = useState(settings?.max_delay_s || 12);
  const [quietStart, setQuietStart] = useState(settings?.quiet_hours_start || '22:00:00');
  const [quietEnd, setQuietEnd] = useState(settings?.quiet_hours_end || '08:00:00');
  const [warmupEnabled, setWarmupEnabled] = useState(settings?.warmup_enabled ?? true);
  const [warmupDay, setWarmupDay] = useState(settings?.warmup_day || 1);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(settings?.autoreply_enabled ?? true);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (minDelay >= maxDelay) {
      setError('Minimum delay must be strictly less than maximum delay');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const res = await fetch('/api/admin/whatsapp/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: settings?.id,
          daily_cap: Number(dailyCap),
          hourly_cap: Number(hourlyCap),
          min_delay_s: Number(minDelay),
          max_delay_s: Number(maxDelay),
          quiet_hours_start: quietStart,
          quiet_hours_end: quietEnd,
          warmup_enabled: warmupEnabled,
          warmup_day: Number(warmupDay),
          autoreply_enabled: autoReplyEnabled,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update settings');

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Error updating settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14532D]">WhatsApp Anti-Ban Engine & Settings</h1>
          <p className="text-sm text-gray-600 mt-1">
            Configure automated rate limits, typing jitter delays, night quiet hours, and phone warmup schedules.
          </p>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Anti-Ban parameters saved and pushed to Baileys engine successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Anti-Ban Safeguards Card */}
        <div className="bg-white rounded-xl border border-[#CFE0D5] shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-[#CFE0D5]">
            <div className="w-8 h-8 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#14532D]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Rate Limiting & Safety Thresholds</h3>
              <p className="text-xs text-gray-500">Protect business SIM from WhatsApp algorithmic rate blocks</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Daily Message Cap (Messages per 24 hours)
              </label>
              <input
                type="number"
                min="50"
                max="5000"
                value={dailyCap}
                onChange={(e) => setDailyCap(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
              />
              <p className="text-[11px] text-gray-500 mt-1">Recommended: 500 for established SIMs.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Hourly Burst Cap (Messages per hour)
              </label>
              <input
                type="number"
                min="10"
                max="500"
                value={hourlyCap}
                onChange={(e) => setHourlyCap(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
              />
              <p className="text-[11px] text-gray-500 mt-1">Recommended: 60 messages/hour.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Minimum Typing Jitter Delay (Seconds)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={minDelay}
                onChange={(e) => setMinDelay(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
              />
              <p className="text-[11px] text-gray-500 mt-1">Pause before sending to simulate human presence.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Maximum Typing Jitter Delay (Seconds)
              </label>
              <input
                type="number"
                min="2"
                max="60"
                value={maxDelay}
                onChange={(e) => setMaxDelay(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
              />
              <p className="text-[11px] text-gray-500 mt-1">Upper bound for randomized wait intervals.</p>
            </div>
          </div>
        </div>

        {/* Quiet Hours & SIM Warmup Card */}
        <div className="bg-white rounded-xl border border-[#CFE0D5] shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-[#CFE0D5]">
            <div className="w-8 h-8 rounded-lg bg-[#F0F7F2] flex items-center justify-center text-[#14532D]">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Quiet Hours & Automated Warmup</h3>
              <p className="text-xs text-gray-500">Scheduled message hold windows and new SIM trust ramping</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Night Quiet Hours Start (IST)
              </label>
              <input
                type="time"
                value={quietStart.slice(0, 5)}
                onChange={(e) => setQuietStart(`${e.target.value}:00`)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
              />
              <p className="text-[11px] text-gray-500 mt-1">Standard: 22:00 (10:00 PM).</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Night Quiet Hours End (IST)
              </label>
              <input
                type="time"
                value={quietEnd.slice(0, 5)}
                onChange={(e) => setQuietEnd(`${e.target.value}:00`)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#CFE0D5] focus:outline-none focus:ring-1 focus:ring-[#14532D]"
              />
              <p className="text-[11px] text-gray-500 mt-1">Standard: 08:00 (8:00 AM).</p>
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900">SIM Warmup Mode</p>
                <p className="text-[11px] text-gray-500">Gradually ramps daily volume over 14 days to build number trust score.</p>
              </div>
              <input
                type="checkbox"
                checked={warmupEnabled}
                onChange={(e) => setWarmupEnabled(e.target.checked)}
                className="h-5 w-5 rounded border-[#CFE0D5] text-[#14532D] focus:ring-[#14532D]"
              />
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900">Auto-Reply Bot Master Engine</p>
                <p className="text-[11px] text-gray-500">Automatically answer customer catalog and rate requests when idle.</p>
              </div>
              <input
                type="checkbox"
                checked={autoReplyEnabled}
                onChange={(e) => setAutoReplyEnabled(e.target.checked)}
                className="h-5 w-5 rounded border-[#CFE0D5] text-[#14532D] focus:ring-[#14532D]"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#14532D] text-white rounded-lg hover:bg-[#14532D]/90 text-sm font-semibold transition disabled:opacity-50 shadow-sm"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Anti-Ban Settings
          </button>
        </div>
      </form>
    </div>
  );
}
