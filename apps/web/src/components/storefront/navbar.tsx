'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import {
  ShoppingBag,
  Menu,
  X,
  Phone,
  Sparkles,
  Search,
  User,
  ShieldCheck,
} from 'lucide-react';

export function StorefrontNavbar() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If in admin panel, navbar is handled by admin layout
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const navLinks = [
    { name: 'All Denim', href: '/products' },
    { name: 'Slim Fit', href: '/products?category=slim-fit-denim' },
    { name: 'Straight Fit', href: '/products?category=regular-straight' },
    { name: 'Jackets & Tops', href: '/products?category=casual-jackets-shirts' },
    { name: 'B2B Wholesale', href: '/b2b' },
    { name: 'Our Factory', href: '/about' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-surface-alt/95 backdrop-blur-md border-b border-border shadow-xs">
      {/* Top Announcement Ribbon */}
      <div className="bg-primary text-white text-2xs sm:text-xs font-semibold py-1.5 px-4 text-center tracking-wide flex items-center justify-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-ping"></span>
        <span>Factory Direct Premium Denim · Sheikhpura (Bihar) · Free Express Shipping on Orders Above ₹999</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Manufacturer Tag */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 -ml-2 rounded-lg text-text hover:bg-surface transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link href="/" className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-text leading-none flex items-center gap-1">
                TOLAND
                <span className="w-2 h-2 rounded-full bg-accent inline-block"></span>
              </span>
              <span className="text-3xs uppercase tracking-widest font-bold text-muted mt-0.5">
                Denim & Casuals
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-xs font-bold tracking-wide uppercase transition-colors hover:text-primary ${
                    isActive ? 'text-primary border-b-2 border-primary pb-0.5' : 'text-muted'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            <Link
              href="/b2b"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-surface border border-border text-text hover:bg-surface-alt hover:border-primary/50 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Bulk / B2B</span>
            </Link>

            <Link
              href="/auth/login"
              className="p-2 rounded-full text-text hover:bg-surface border border-transparent hover:border-border transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Customer Login / Admin"
            >
              <User className="w-4 h-4 text-primary" />
              <span className="hidden lg:inline text-muted">Login</span>
            </Link>

            <Link
              href="/cart"
              className="relative p-2.5 rounded-full bg-primary text-white hover:bg-primary-hover shadow-sm transition-all"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-danger text-white text-3xs font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow-xs">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface-alt border-b border-border px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-lg bg-surface border border-border text-text hover:border-primary transition-colors text-center"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted">
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-success font-semibold"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>WhatsApp Support</span>
            </a>
            <span className="text-3xs uppercase tracking-wider font-semibold text-muted">
              Sheikhpura, Bihar
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
