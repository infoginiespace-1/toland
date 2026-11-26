import Link from 'next/link';
import { FileText, Shield, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Terms & Conditions | TOLAND Denim',
  description: 'Terms of service, sales terms, manufacturing warranty, and legal conditions for TOLAND.',
};

export default function TermsPage() {
  return (
    <div className="bg-[#F0F7F2] min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center text-xs text-muted font-medium mb-6 space-x-2">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-primary font-semibold">Terms & Conditions</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-2xl p-8 border border-[#CFE0D5] shadow-sm mb-8">
          <div className="flex items-center gap-3 text-primary font-semibold text-sm mb-2">
            <FileText className="w-5 h-5" />
            <span>LEGAL AGREEMENT</span>
          </div>
          <h1 className="text-3xl font-extrabold text-text font-serif tracking-tight mb-4">
            Terms & Conditions of Sale
          </h1>
          <p className="text-muted text-sm leading-relaxed">
            Welcome to TOLAND (toland.pvt.ltd). By accessing our website, browsing denim collections, placing retail orders, or requesting B2B wholesale lots, you agree to be bound by the terms and conditions outlined below.
          </p>
          <p className="text-xs text-muted mt-3 font-mono">Effective Date: November 2026</p>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-2xl p-8 border border-[#CFE0D5] shadow-sm space-y-8 text-sm text-text">
          <section>
            <h2 className="text-lg font-bold text-primary mb-3">1. Business Identity</h2>
            <p className="text-muted leading-relaxed">
              This platform is owned and managed by <strong className="text-text">TOLAND Private Limited</strong>, an apparel manufacturing enterprise registered under the Companies Act of India, with registered manufacturing plant and corporate office at:
            </p>
            <div className="mt-3 p-4 bg-[#F0F7F2] rounded-xl border border-[#CFE0D5] text-xs font-mono space-y-1">
              <p className="font-bold text-text">TOLAND Manufacturing Facility</p>
              <p>Village: Khetalpura, Post & PS: Barbigha</p>
              <p>District: Sheikhpura, Bihar - 811101, India</p>
              <p>Email: info.giniespace@gmail.com | WhatsApp: +91 94718 12345</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-3">2. Pricing, Invoicing & Taxes</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted leading-relaxed">
              <li>All consumer retail prices listed on the storefront are inclusive of Goods & Services Tax (GST) at statutory rates (5% / 12% apparel GST).</li>
              <li>Official GST Tax Invoices are generated electronically for each completed purchase and available for PDF download on your order tracking page.</li>
              <li>B2B bulk wholesale prices are quoted ex-factory Sheikhpura and may exclude freight and loading charges as mutually agreed in the purchase order.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-3">3. Denim Specifications & Natural Wash Characteristics</h2>
            <p className="text-muted leading-relaxed mb-3">
              Due to the artisanal washing methods used in denim processing (stone enzyme wash, acid wash, whisker brushing, and authentic indigo dyeing):
            </p>
            <div className="p-4 rounded-xl bg-[#F0F7F2] border border-[#CFE0D5] space-y-2 text-xs text-muted">
              <p>• Minor indigo bleed may occur during the initial 1–2 washes of raw and dark rinse denim. This is a natural characteristic of genuine indigo cotton yarn, not a manufacturing defect.</p>
              <li>• Hand-scraped whiskers and localized fading patterns may vary subtly between individual garments, adding distinct uniqueness to every pair.</li>
              <li>• Colors displayed on your smartphone or desktop monitor may slightly differ from physical fabric tones due to screen calibration variations.</li>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-3">4. Orders, Cancellations & RTO Terms</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted leading-relaxed">
              <li>Retail orders can be cancelled free of charge prior to handover to courier partners (status &quot;Placed&quot; or &quot;Confirmed&quot;). Once &quot;Dispatched&quot;, cancellation is not permitted; customers must utilize our 7-Day Exchange process.</li>
              <li>For repeated Cash on Delivery (COD) refusals or deliberate delivery failures at doorstep (RTO), TOLAND reserves the right to disable COD payment facilities for that user profile and phone number.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-3">5. B2B Wholesale Production Contracts</h2>
            <p className="text-muted leading-relaxed">
              B2B bulk orders (50+ units) confirmed via advance deposit (typically 30% advance, balance upon dispatch) enter custom production schedules. Cancellation of B2B production runs after fabric cutting has commenced results in forfeiture of raw material reservation deposits.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-3">6. Governing Law & Jurisdiction</h2>
            <div className="flex items-start gap-3 p-4 bg-[#E3EFE7] rounded-xl border border-[#CFE0D5]">
              <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted leading-relaxed">
                These terms are governed by and construed in accordance with the laws of the Republic of India. Any legal dispute, arbitration, or claim arising out of retail transactions or B2B contracts shall be subject to the exclusive jurisdiction of the competent courts in Sheikhpura / Patna, Bihar.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
