import Link from 'next/link';
import { Lock, Shield, Eye, Smartphone } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | TOLAND Denim',
  description: 'How TOLAND collects, protects, and handles your personal information and WhatsApp notifications.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-[#F0F7F2] min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center text-xs text-muted font-medium mb-6 space-x-2">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-primary font-semibold">Privacy Policy</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-2xl p-8 border border-[#CFE0D5] shadow-sm mb-8">
          <div className="flex items-center gap-3 text-primary font-semibold text-sm mb-2">
            <Lock className="w-5 h-5" />
            <span>DATA PRIVACY & SECURITY</span>
          </div>
          <h1 className="text-3xl font-extrabold text-text font-serif tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted text-sm leading-relaxed">
            TOLAND Private Limited (&quot;TOLAND&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the toland.pvt.ltd web storefront and manufacturing services. This Privacy Policy details how we handle, store, and safeguard your data under the Information Technology Act, 2000 and Digital Personal Data Protection Act (DPDP), 2023 of India.
          </p>
          <p className="text-xs text-muted mt-3 font-mono">Last updated: November 2026</p>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-2xl p-8 border border-[#CFE0D5] shadow-sm space-y-8 text-sm text-text">
          <section>
            <h2 className="text-lg font-bold text-primary mb-3">1. Information We Collect</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#F0F7F2] border border-[#CFE0D5]">
                <h4 className="font-semibold text-primary flex items-center gap-2 mb-2 text-xs">
                  <Smartphone className="w-4 h-4 text-accent" /> Directly Provided by You
                </h4>
                <ul className="text-xs text-muted space-y-1.5 pl-6 list-disc">
                  <li>Mobile Phone Number (used for WhatsApp OTP authentication and order tracking)</li>
                  <li>Name and Delivery Address (House no, street, city, state, postal code)</li>
                  <li>Email Address (for tax invoices and transaction records)</li>
                  <li>GSTIN and business name for B2B wholesale orders</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#F0F7F2] border border-[#CFE0D5]">
                <h4 className="font-semibold text-primary flex items-center gap-2 mb-2 text-xs">
                  <Eye className="w-4 h-4 text-accent" /> Automatically Collected
                </h4>
                <ul className="text-xs text-muted space-y-1.5 pl-6 list-disc">
                  <li>Device information, browser type, and operating system</li>
                  <li>Order histories, product preferences, and cart sessions</li>
                  <li>IP address and approximate geolocation (used for regional courier estimates)</li>
                  <li>Log records and anonymous analytics via Sentry</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-3">2. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-muted leading-relaxed">
              <li><strong className="text-text">Order Fulfillment:</strong> To process, manufacture, pack, and ship denim garments to your doorstep.</li>
              <li><strong className="text-text">WhatsApp Order Updates:</strong> Sending real-time notifications for OTP logins, order confirmation, factory dispatch, tracking AWB details, and delivery alerts.</li>
              <li><strong className="text-text">Payment Processing:</strong> Seamlessly facilitating transactions via Razorpay UPI and cash-on-delivery validation without storing your raw credit card or UPI PIN details.</li>
              <li><strong className="text-text">B2B Manufacturing Quotes:</strong> Generating wholesale invoices, production estimates, and sample dispatch logistics.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-3">3. WhatsApp Communication & Anti-Spam Guarantee</h2>
            <p className="text-muted leading-relaxed mb-3">
              We strictly believe in ethical communication. In accordance with WhatsApp policies and Telecom Regulatory Authority of India (TRAI) norms:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted">
              <li>We never share, rent, or sell your phone number to third-party telemarketers.</li>
              <li>You will only receive order-related transactional updates and consented promotional notifications.</li>
              <li>
                <strong className="text-text">Instant Opt-Out:</strong> You can permanently halt all promotional messages anytime by simply replying <span className="font-mono bg-[#E3EFE7] text-primary px-1.5 py-0.5 rounded text-xs">STOP</span> or <span className="font-mono bg-[#E3EFE7] text-primary px-1.5 py-0.5 rounded text-xs">बंद</span> on WhatsApp. Your number will be immediately blacklisted in our database.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-3">4. Data Storage & Security Standards</h2>
            <p className="text-muted leading-relaxed mb-3">
              All database records are hosted on encrypted Supabase PostgreSQL clusters with Row-Level Security (RLS) strictly enforced. Each customer can access only their own profile and order data.
            </p>
            <div className="flex items-center gap-3 p-4 bg-[#E3EFE7] rounded-xl border border-[#CFE0D5]">
              <Shield className="w-6 h-6 text-primary flex-shrink-0" />
              <p className="text-xs text-muted">
                Zero plaintext financial credentials. Payment processing adheres to PCI-DSS Level 1 compliant gateways provided by Razorpay.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-3">5. Contact Our Data Grievance Officer</h2>
            <p className="text-muted leading-relaxed">
              For any inquiries regarding data correction, deletion, or privacy queries, write to:
            </p>
            <div className="mt-2 text-xs font-mono text-muted space-y-1 bg-[#F0F7F2] p-4 rounded-xl border border-[#CFE0D5]">
              <p className="text-text font-bold">Grievance Officer: TOLAND Legal & Compliance Desk</p>
              <p>Email: privacy@toland.pvt.ltd / info.giniespace@gmail.com</p>
              <p>Address: TOLAND Pvt. Ltd., Khetalpura, Barbigha, Sheikhpura 811101, Bihar, India</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
