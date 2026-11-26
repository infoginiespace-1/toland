import React from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Building2,
  PhoneCall,
  Sparkles,
} from 'lucide-react';

export const metadata = {
  title: 'Contact Us | TOLAND Denim',
  description: 'Contact TOLAND manufacturing plant in Sheikhpura, Barbigha, Bihar. Direct WhatsApp support and factory visits.',
};

export default function ContactPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="max-w-2xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>Get in Touch</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-text tracking-tight">Contact TOLAND</h1>
        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          Whether you have an inquiry about a retail order, sizing, or want to place bulk wholesale orders, our team in
          Sheikhpura is ready to assist you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Contact Info Cards */}
        <div className="space-y-4">
          {/* WhatsApp Direct */}
          <div className="p-6 rounded-2xl bg-surface-alt border border-border space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-success">
              <Phone className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Fastest Support</span>
            </div>
            <h3 className="text-lg font-bold text-text">Live WhatsApp Desk</h3>
            <p className="text-xs text-muted leading-relaxed">
              Message us for live size recommendations, order tracking updates, and B2B rate cards.
            </p>
            <a
              href="https://wa.me/918797186001"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-success text-white text-xs font-bold hover:bg-success/90 transition-colors shadow-2xs"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Chat on WhatsApp (+91 87971 86001)</span>
            </a>
          </div>

          {/* Email & Phone */}
          <div className="p-6 rounded-2xl bg-surface-alt border border-border space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Email & General Inquiries</h3>
            <div className="space-y-2 text-xs text-text">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a href="mailto:info.giniespace@gmail.com" className="hover:text-primary transition-colors font-medium">
                  info.giniespace@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2 text-muted">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <span>Monday – Saturday: 9:00 AM – 7:00 PM IST</span>
              </div>
            </div>
          </div>

          {/* Factory Plant Address */}
          <div className="p-6 rounded-2xl bg-surface-alt border border-border space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-primary" />
              <span>Manufacturing Facility</span>
            </h3>
            <div className="text-xs text-text space-y-1">
              <div className="font-bold">TOLAND Private Limited</div>
              <div className="text-muted">Sheikhpura, Barbigha, Khetalpura 811101</div>
              <div className="text-muted">Bihar, India</div>
            </div>
          </div>
        </div>

        {/* Factory Visit Guide */}
        <div className="p-8 rounded-3xl bg-surface-alt border border-border space-y-6 shadow-xs">
          <h2 className="text-xl font-black text-text">Trade Showroom & Factory Visits</h2>
          <p className="text-xs text-muted leading-relaxed">
            Wholesale merchants and brand partners are welcome to inspect our production lines, review fabric swatches,
            and discuss bulk orders in person.
          </p>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-surface rounded-xl border border-border">
              <span className="font-bold text-text block">Nearest Railway Junctions:</span>
              <span className="text-muted">Sheikhpura Junction (SHK) · Kiul Junction (KIUL)</span>
            </div>

            <div className="p-3 bg-surface rounded-xl border border-border">
              <span className="font-bold text-text block">Nearest Airport:</span>
              <span className="text-muted">Jay Prakash Narayan International Airport, Patna (PAT)</span>
            </div>

            <div className="p-3 bg-surface rounded-xl border border-border">
              <span className="font-bold text-text block">Appointment Required:</span>
              <span className="text-muted">Please notify our team on WhatsApp at least 24 hours prior to visit.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
