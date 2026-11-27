'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export function StorefrontFooter() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-surface-alt border-t border-border mt-auto">
      {/* 3 Core Value Badges */}
      <div className="border-b border-border py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-text">Direct Factory Shipping</div>
              <div className="text-xs text-muted">Free delivery all across India on orders above ₹999.</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-text">100% Genuine Denim</div>
              <div className="text-xs text-muted">Ring-spun cotton with authentic in-house washes.</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-text">Easy 7-Day Exchanges</div>
              <div className="text-xs text-muted">Hassle-free size replacement and fit exchanges.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-extrabold tracking-tight text-text flex items-center">
                TOLAND
              </span>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-muted block mt-0.5">
                Toland Private Limited
              </span>
            </Link>

            <p className="text-xs text-muted max-w-sm leading-relaxed">
              Leading denim jeans and casual outfits manufacturer. Crafted with pride at our direct-to-consumer
              and B2B facility in Bihar, India.
            </p>

            <div className="space-y-2 text-xs text-muted">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Sheikhpura, Barbigha, Khetalpura 811101, Bihar, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a href="mailto:info.giniespace@gmail.com" className="hover:text-primary transition-colors">
                  info.giniespace@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-success shrink-0" />
                <a
                  href="https://wa.me/918797186001"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-success hover:underline"
                >
                  WhatsApp: +91 87971 86001
                </a>
              </div>
            </div>
          </div>

          {/* Catalog */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text mb-3">Denim Catalog</h3>
            <ul className="space-y-2 text-xs text-muted">
              <li>
                <Link href="/products" className="hover:text-primary transition-colors">
                  All Collections
                </Link>
              </li>
              <li>
                <Link href="/products?category=slim-fit-denim" className="hover:text-primary transition-colors">
                  Slim Fit Denim
                </Link>
              </li>
              <li>
                <Link href="/products?category=regular-straight" className="hover:text-primary transition-colors">
                  Regular Straight Leg
                </Link>
              </li>
              <li>
                <Link href="/products?category=casual-jackets-shirts" className="hover:text-primary transition-colors">
                  Trucker Jackets & Shirts
                </Link>
              </li>
            </ul>
          </div>

          {/* Wholesale & Factory */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text mb-3">Wholesale & Factory</h3>
            <ul className="space-y-2 text-xs text-muted">
              <li>
                <Link href="/b2b" className="hover:text-primary transition-colors font-semibold text-text flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-accent" /> B2B Price Tiers
                </Link>
              </li>
              <li>
                <Link href="/b2b" className="hover:text-primary transition-colors">
                  Bulk Inquiry Form
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  Sheikhpura Facility Tour
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Visit Factory Showroom
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care & Policies */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text mb-3">Customer Support</h3>
            <ul className="space-y-2 text-xs text-muted">
              <li>
                <Link href="/track-order" className="text-primary font-bold hover:underline flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-primary" />
                  <span>Track Your Order</span>
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-primary transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-primary transition-colors">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & GST */}
        <div className="pt-8 mt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between text-2xs text-muted gap-4">
          <div>
            © {new Date().getFullYear()} TOLAND Private Limited. All rights reserved. GST Registered Denim Manufacturer.
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-text">Sheikhpura · Barbigha · Bihar 811101</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
