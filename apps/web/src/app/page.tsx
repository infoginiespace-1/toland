import Link from 'next/link';
import { COMPANY_DETAILS } from '@toland/shared';

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Top Notification Bar */}
      <div className="bg-primary text-surface py-2 px-4 text-center text-xs sm:text-sm font-medium tracking-wide">
        Official TOLAND Storefront & B2B Manufacturer Hub — Barbigha, Sheikhpura (Bihar)
      </div>

      {/* Header */}
      <header className="border-b border-border bg-surface sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tight text-primary">
            TOLAND
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6 text-sm font-medium">
            <Link href="/catalog" className="text-muted hover:text-primary transition-colors">
              Collection
            </Link>
            <Link href="/b2b" className="text-muted hover:text-primary transition-colors">
              B2B / Wholesale
            </Link>
            <Link href="/auth/login" className="bg-primary hover:bg-primary-hover text-surface px-4 py-2 rounded-md font-semibold transition-colors">
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Banner Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center text-center justify-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-alt text-primary border border-border mb-6">
          Premium Denim Jeans & Casuals
        </span>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-text max-w-3xl">
          Crafted for Comfort. Built for Durability.
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted max-w-2xl">
          Direct from the manufacturer in Bihar to your doorstep. Explore our classic washes, relaxed fits, and casual apparel with WhatsApp order updates.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/catalog"
            className="w-full sm:w-auto px-8 py-3 rounded-md bg-primary hover:bg-primary-hover text-surface font-semibold shadow-sm transition-colors text-center"
          >
            Explore Catalog
          </Link>
          <Link
            href="/admin"
            className="w-full sm:w-auto px-8 py-3 rounded-md bg-surface-alt hover:bg-surface border border-border text-primary font-semibold transition-colors text-center"
          >
            Admin / ERP Portal
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface-alt py-8 text-center text-xs text-muted">
        <p className="font-medium text-text">{COMPANY_DETAILS.legalName}</p>
        <p className="mt-1">{COMPANY_DETAILS.address.fullFormatted}</p>
        <p className="mt-2">WhatsApp OTP Verified • Secure Payments via Razorpay & Cash on Delivery</p>
      </footer>
    </div>
  );
}
