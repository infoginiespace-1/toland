'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Send,
  Search,
  MessageSquare,
  CheckCheck,
  Clock,
  AlertCircle,
  Plus,
  User,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';

interface WaMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  phone: string;
  body: string;
  priority?: number;
  template_key?: string | null;
  status: string;
  error?: string | null;
  created_at: string;
}

interface WaTemplate {
  key: string;
  name: string;
  body: string;
}

interface LiveInboxClientProps {
  initialMessages: WaMessage[];
  templates: WaTemplate[];
  contactNames: Record<string, string>;
}

function normalizePhone10(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export function LiveInboxClient({
  initialMessages,
  templates,
  contactNames,
}: LiveInboxClientProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<WaMessage[]>(initialMessages);
  const [threadSearch, setThreadSearch] = useState('');
  const [selectedPhone10, setSelectedPhone10] = useState<string>(() => {
    const first = initialMessages[0]?.phone;
    return first ? normalizePhone10(first) : '';
  });
  const [replyText, setReplyText] = useState('');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('');
  const [sending, setSending] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Realtime subscription to public.wa_messages
  useEffect(() => {
    const channel = supabase
      .channel('wa_messages_live_inbox')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wa_messages' },
        (payload) => {
          const newMsg = payload.new as WaMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [newMsg, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'wa_messages' },
        (payload) => {
          const updated = payload.new as WaMessage;
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Build threads grouped by 10-digit phone number
  const threadMap = new Map<
    string,
    {
      phone10: string;
      displayPhone: string;
      name: string;
      latestMsg: WaMessage;
      msgs: WaMessage[];
    }
  >();

  // Sort newest first to find latestMsg, then reverse individual conversation arrays for chronological chat view
  const sortedNewestFirst = [...messages].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  sortedNewestFirst.forEach((m) => {
    const p10 = normalizePhone10(m.phone);
    if (!p10) return;
    const existing = threadMap.get(p10);
    if (!existing) {
      threadMap.set(p10, {
        phone10: p10,
        displayPhone: `+91 ${p10}`,
        name: contactNames[p10] || `+91 ${p10}`,
        latestMsg: m,
        msgs: [m],
      });
    } else {
      existing.msgs.push(m);
    }
  });

  // Include new chat phone if manually opened and no history yet
  if (selectedPhone10 && !threadMap.has(selectedPhone10)) {
    threadMap.set(selectedPhone10, {
      phone10: selectedPhone10,
      displayPhone: `+91 ${selectedPhone10}`,
      name: contactNames[selectedPhone10] || `+91 ${selectedPhone10}`,
      latestMsg: {
        id: 'draft',
        direction: 'outbound',
        phone: `91${selectedPhone10}`,
        body: 'New conversation started',
        status: 'queued',
        created_at: new Date().toISOString(),
      },
      msgs: [],
    });
  }

  const threads = Array.from(threadMap.values()).filter((t) => {
    if (!threadSearch) return true;
    const q = threadSearch.toLowerCase();
    return (
      t.phone10.includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.latestMsg.body.toLowerCase().includes(q)
    );
  });

  const activeThread = selectedPhone10 ? threadMap.get(selectedPhone10) || null : threads[0] || null;
  const activeMessages = activeThread
    ? [...activeThread.msgs].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedPhone10, activeMessages.length]);

  const handleApplyTemplate = (key: string) => {
    setSelectedTemplateKey(key);
    const tpl = templates.find((t) => t.key === key);
    if (tpl && activeThread) {
      const resolved = tpl.body.replace(
        /\{\{\s*name\s*\}\}/gi,
        activeThread.name.startsWith('+') ? 'Valued Customer' : activeThread.name
      );
      setReplyText(resolved);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !replyText.trim()) return;

    setSending(true);
    setSendError(null);
    try {
      const res = await fetch('/api/admin/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: `91${activeThread.phone10}`,
          message: replyText.trim(),
          template_key: selectedTemplateKey || undefined,
          priority: 2,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reply');

      if (data.message) {
        setMessages((prev) =>
          prev.some((m) => m.id === data.message.id) ? prev : [data.message, ...prev]
        );
      }
      setReplyText('');
      setSelectedTemplateKey('');
    } catch (err: any) {
      setSendError(err?.message || 'Error sending WhatsApp message');
    } finally {
      setSending(false);
    }
  };

  const handleStartNewChat = (e: React.FormEvent) => {
    e.preventDefault();
    const digits10 = normalizePhone10(newChatPhone);
    if (digits10.length < 10) return;
    setSelectedPhone10(digits10);
    setShowNewChat(false);
    setNewChatPhone('');
  };

  return (
    <div className="bg-white border border-[#CFE0D5] rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-[#CFE0D5] bg-[#F0F7F2]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#14532D]" />
            <span>Live Two-Way WhatsApp Inbox</span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time customer threads synced via Supabase Realtime &amp; Render Baileys Bridge.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewChat(!showNewChat)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14532D] text-white text-xs font-semibold hover:bg-[#14532D]/90 transition w-fit cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>
      </div>

      {showNewChat && (
        <form
          onSubmit={handleStartNewChat}
          className="p-3 bg-emerald-50/70 border-b border-[#CFE0D5] flex items-center gap-2"
        >
          <input
            type="tel"
            required
            value={newChatPhone}
            onChange={(e) => setNewChatPhone(e.target.value)}
            placeholder="Enter 10-digit WhatsApp number (e.g. 9876543210)"
            className="flex-1 max-w-xs px-3 py-1.5 rounded-lg border border-[#CFE0D5] bg-white text-xs font-mono"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-[#14532D] text-white text-xs font-semibold cursor-pointer"
          >
            Open Thread
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px] max-h-[600px]">
        {/* Left: Conversation Threads */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#CFE0D5] flex flex-col max-h-[300px] lg:max-h-[600px]">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={threadSearch}
                onChange={(e) => setThreadSearch(e.target.value)}
                placeholder="Search customer or phone..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-[#14532D]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {threads.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No WhatsApp conversations yet.
              </div>
            ) : (
              threads.map((t) => {
                const isSelected = activeThread?.phone10 === t.phone10;
                const isInboundLatest = t.latestMsg.direction === 'inbound';
                return (
                  <button
                    key={t.phone10}
                    type="button"
                    onClick={() => setSelectedPhone10(t.phone10)}
                    className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 cursor-pointer ${
                      isSelected ? 'bg-[#F0F7F2] border-l-4 border-[#14532D]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-[#E3EFE7] text-[#14532D] flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {t.name}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(t.latestMsg.created_at).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isInboundLatest && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Customer replied" />
                        )}
                        <p className="text-[11px] text-slate-500 truncate">
                          {t.latestMsg.direction === 'outbound' ? 'You: ' : ''}
                          {t.latestMsg.body}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Chat Thread & Reply Box */}
        <div className="lg:col-span-8 flex flex-col bg-slate-50/50 max-h-[500px] lg:max-h-[600px]">
          {activeThread ? (
            <>
              {/* Active Contact Header */}
              <div className="p-3.5 bg-white border-b border-[#CFE0D5] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#14532D] text-white flex items-center justify-center font-bold text-xs">
                    {activeThread.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{activeThread.name}</div>
                    <div className="text-[11px] font-mono text-slate-500">{activeThread.displayPhone}</div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-400">
                  {activeMessages.length} messages
                </span>
              </div>

              {/* Message Bubbles */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeMessages.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-10">
                    Type a message or select a template below to start chatting with {activeThread.displayPhone}.
                  </div>
                ) : (
                  activeMessages.map((msg) => {
                    const isOut = msg.direction === 'outbound';
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs space-y-1 shadow-2xs ${
                            isOut
                              ? 'bg-[#14532D] text-white rounded-br-sm'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                          <div
                            className={`flex items-center justify-end gap-1.5 text-[10px] ${
                              isOut ? 'text-white/75' : 'text-slate-400'
                            }`}
                          >
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isOut && (
                              <>
                                {msg.status === 'sent' || msg.status === 'delivered' ? (
                                  <CheckCheck className="w-3 h-3 text-emerald-300" />
                                ) : msg.status === 'queued' ? (
                                  <Clock className="w-3 h-3 text-amber-300" />
                                ) : (
                                  <span title={msg.error || 'Failed'} className="text-rose-300 flex items-center gap-0.5">
                                    <AlertCircle className="w-3 h-3" />
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Template Picker & Reply Form */}
              <form onSubmit={handleSendReply} className="p-3 bg-white border-t border-[#CFE0D5] space-y-2">
                {sendError && (
                  <p className="text-[11px] text-rose-600 font-semibold">{sendError}</p>
                )}

                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#14532D] shrink-0" />
                  <select
                    value={selectedTemplateKey}
                    onChange={(e) => handleApplyTemplate(e.target.value)}
                    className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:border-[#14532D]"
                  >
                    <option value="">Insert Quick Template (Optional)...</option>
                    {templates.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.name} (#{t.key})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end gap-2">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply(e);
                      }
                    }}
                    placeholder={`Reply to ${activeThread.displayPhone} (Enter to send)...`}
                    className="flex-1 px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/30 text-xs focus:outline-none focus:border-[#14532D] resize-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || !replyText.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-bold hover:bg-[#14532D]/90 disabled:opacity-40 flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-xs text-slate-400">
              <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600">Select a conversation or start a New Chat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
