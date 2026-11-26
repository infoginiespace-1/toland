import Link from 'next/link';
import { RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, PhoneCall } from 'lucide-react';

export const metadata = {
  title: 'Returns & Exchange Policy | TOLAND Denim',
  description: '7-day doorstep exchange and return policy for TOLAND denim jeans and apparel.',
};

export default function ReturnsPolicyPage() {
  return (
    <div className="bg-[#F0F7F2] min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center text-xs text-muted font-medium mb-6 space-x-2">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-primary font-semibold">Returns & Exchanges</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-2xl p-8 border border-[#CFE0D5] shadow-sm mb-8">
          <div className="flex items-center gap-3 text-primary font-semibold text-sm mb-2">
            <RefreshCw className="w-5 h-5" />
            <span>FIT GUARANTEE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-text font-serif tracking-tight mb-4">
            7-Day Hassle-Free Returns & Exchanges
          </h1>
          <p className="text-muted text-sm leading-relaxed">
            Finding your ideal denim fit should be worry-free. If your jeans don't fit just right or you wish to change size, fit, or wash, we offer doorstep replacement pickup across India.
          </p>
        </div>

        {/* 3 Step Process */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl border border-[#CFE0D5]">
            <div className="w-8 h-8 rounded-full bg-surface-alt text-primary font-bold flex items-center justify-center text-sm mb-3">
              1
            </div>
            <h3 className="font-bold text-text mb-1">Raise in 7 Days</h3>
            <p className="text-xs text-muted leading-relaxed">
              Message our WhatsApp desk at +91 94718 12345 or visit your order tracking page within 7 days of package delivery.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-[#CFE0D5]">
            <div className="w-8 h-8 rounded-full bg-surface-alt text-primary font-bold flex items-center justify-center text-sm mb-3">
              2
            </div>
            <h3 className="font-bold text-text mb-1">Doorstep Reverse Pickup</h3>
            <p className="text-xs text-muted leading-relaxed">
              Our courier executive will arrive at your address within 48 hours to collect the unworn denim in its original packing.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-[#CFE0D5]">
            <div className="w-8 h-8 rounded-full bg-surface-alt text-primary font-bold flex items-center justify-center text-sm mb-3">
              3
            </div>
            <h3 className="font-bold text-text mb-1">Instant Replacement / Refund</h3>
            <p className="text-xs text-muted leading-relaxed">
              Replacement size ships immediately upon pickup scan. Refunds for returns are processed directly to your original bank/UPI within 3–5 days.
            </p>
          </div>
        </div>

        {/* Conditions */}
        <div className="bg-white rounded-2xl p-8 border border-[#CFE0D5] shadow-sm space-y-8 text-sm text-text">
          <section>
            <h2 className="text-lg font-bold text-primary mb-3">Eligibility Conditions for Exchange & Return</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#F0F7F2] border border-[#CFE0D5]">
                <h4 className="font-semibold text-primary flex items-center gap-2 mb-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-accent" /> Accepted For Full Exchange / Refund
                </h4>
                <ul className="text-xs text-muted space-y-1.5 pl-6 list-disc">
                  <li>Size mismatch (waist too tight/loose, length adjustment)</li>
                  <li>Original brand tags, waistband patch, and washcare labels intact</li>
                  <li>Unworn, unwashed, unaltered denim free of perfume, stains, or scuffs</li>
                  <li>Any manufacturing defect (rivet fault, zipper malfunction, weave defect)</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#FFF8F8] border border-[#F2C2C2]">
                <h4 className="font-semibold text-danger flex items-center gap-2 mb-2 text-xs">
                  <AlertTriangle className="w-4 h-4 text-danger" /> Non-Returnable Items
                </h4>
                <ul className="text-xs text-muted space-y-1.5 pl-6 list-disc">
                  <li>Denim altered by local tailors (hemmed, tapered, or patched)</li>
                  <li>Garments showing signs of wash, fragrance, body odor, or wear</li>
                  <li>Custom-dyed or laser-engraved B2B promotional merchandise</li>
                  <li>Clearance items tagged "Final Factory Clearance" on sale</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-3">Refund Timelines</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted leading-relaxed">
              <li>
                <strong className="text-text">Prepaid Orders (UPI / Cards / Net Banking):</strong> Credited directly to the source account within 3–5 banking business days after the returned item passes factory quality check.
              </li>
              <li>
                <strong className="text-text">Cash on Delivery (COD) Orders:</strong> Our customer desk sends a secure payout link via WhatsApp/SMS where you can enter your verified UPI ID or bank account details for instant NEFT/IMPS transfer.
              </li>
              <li>
                <strong className="text-text">Store Credit Voucher:</strong> You may also opt for an instant TOLAND credit code with an additional 5% bonus applicable across all catalog items.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-3">B2B Wholesale Lot Exchange Terms</h2>
            <p className="text-muted leading-relaxed">
              For B2B wholesale orders (50+ pcs), standard consumer retail return rules do not apply. Any batch containing verified manufacturing defects exceeding the industry standard AQL 2.5 benchmark will be re-cut and replaced free of charge under our factory manufacturing guarantee. Claims must be raised within 15 days of bill of lading receipt.
            </p>
          </section>

          {/* WhatsApp Direct Help */}
          <div className="bg-[#E3EFE7] p-5 rounded-xl flex items-center justify-between flex-wrap gap-4 border border-[#CFE0D5]">
            <div className="flex items-center gap-3">
              <PhoneCall className="w-5 h-5 text-primary" />
              <div>
                <p className="font-bold text-primary text-sm">Need immediate help with a return or exchange?</p>
                <p className="text-xs text-muted">Message our factory support desk directly on WhatsApp.</p>
              </div>
            </div>
            <a
              href="https://wa.me/919471812345?text=Hello%20TOLAND,%20I%20would%20like%20to%20request%20an%20exchange%20for%20my%20order"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-[#0F3F22] transition-colors"
            >
              Start WhatsApp Exchange
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
