'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  X,
  Send,
  Phone,
  Ruler,
  Truck,
  RotateCcw,
  Layers,
} from 'lucide-react';

export function FloatingWhatsAppConcierge() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState('');

  if (pathname.startsWith('/admin')) {
    return null;
  }

  const quickOptions = [
    {
      icon: Ruler,
      title: 'Waist & Fit Sizing Help',
      desc: 'Get exact sizing guidance for your body type',
      text: 'Namaste TOLAND Team! I need help selecting the right waist size and fit for denim.',
    },
    {
      icon: Truck,
      title: 'Track My Order Dispatch',
      desc: 'Check courier dispatch status from Sheikhpura',
      text: 'Namaste! Could you please update me on the courier dispatch status for my TOLAND order?',
    },
    {
      icon: Layers,
      title: 'Wholesale B2B Inquiry (50+ pcs)',
      desc: 'Direct factory rates for retailers & distributors',
      text: 'Hello TOLAND Sales Team! I am interested in wholesale/bulk order (50+ pieces) directly from your mill.',
    },
    {
      icon: RotateCcw,
      title: '7-Day Return / Size Exchange',
      desc: 'Doorstep pickup assistance across India',
      text: 'Hello, I would like to request an exchange/return for my denim order.',
    },
  ];

  const handleSend = (text: string) => {
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/918797186001?text=${encoded}`, '_blank');
    setIsOpen(false);
  };

  const isProductDetail = pathname.startsWith('/products/') && pathname !== '/products';

  return (
    <div
      className={`fixed right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end ${
        isProductDetail ? 'bottom-32' : 'bottom-20'
      }`}
    >
      {/* Concierge Modal Card */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 rounded-3xl bg-white border border-border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-primary p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center font-bold text-accent">
                <Phone className="w-5 h-5 text-accent" />
              </div>
              <div>
                <div className="text-xs font-black tracking-wide flex items-center gap-1.5">
                  <span>TOLAND Factory Desk</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <p className="text-[11px] text-white/80">
                  Direct Mill Support · Sheikhpura, Bihar
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Options */}
          <div className="p-4 space-y-2 bg-slate-50/70 max-h-80 overflow-y-auto">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
              Quick Assistance Options:
            </p>

            {quickOptions.map((opt, i) => {
              const Icon = opt.icon;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(opt.text)}
                  className="w-full text-left p-3 rounded-2xl bg-white border border-border hover:border-primary/50 hover:bg-surface-alt transition-all shadow-2xs flex items-center gap-3 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-text group-hover:text-primary transition-colors">
                      {opt.title}
                    </div>
                    <div className="text-[10px] text-muted truncate">
                      {opt.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Message Input */}
          <div className="p-3 bg-white border-t border-border flex items-center gap-2">
            <input
              type="text"
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customMsg.trim()) {
                  handleSend(customMsg);
                }
              }}
              placeholder="Type your question..."
              className="flex-1 px-3 py-2 rounded-xl border border-border bg-surface-alt text-xs focus:outline-none focus:border-primary text-text"
            />
            <button
              type="button"
              disabled={!customMsg.trim()}
              onClick={() => handleSend(customMsg)}
              className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover disabled:opacity-40 transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-emerald-700 text-white shadow-xl hover:bg-emerald-800 transition-all hover:scale-105 active:scale-95 cursor-pointer border-2 border-white"
        aria-label="WhatsApp Concierge Support"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
        <MessageSquare className="w-5 h-5 fill-white text-emerald-700" />
        <span className="text-xs font-black tracking-wide hidden sm:inline">
          Factory Help
        </span>
      </button>
    </div>
  );
}
