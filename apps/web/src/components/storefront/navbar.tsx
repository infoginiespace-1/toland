'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { createClient } from '@/lib/supabase/client';
import {
  ShoppingBag,
  Menu,
  X,
  Phone,
  Sparkles,
  User,
  ShieldCheck,
  LogOut,
  Package,
  ChevronDown,
  Search,
  Truck,
  Heart,
} from 'lucide-react';
import { SearchModal } from '@/components/storefront/search-modal';
import { WishlistDrawer } from '@/components/storefront/wishlist-drawer';

export function StorefrontNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auth state
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    // 1. Check initial auth state
    async function loadUser() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (currentUser) {
          setUser(currentUser);
          const role =
            currentUser.app_metadata?.role ||
            currentUser.user_metadata?.role ||
            'customer';
          const email = currentUser.email?.toLowerCase();
          setIsAdmin(
            role === 'admin' ||
              role === 'staff' ||
              email === 'info.giniespace@gmail.com'
          );
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (e) {
        console.error('Navbar auth error:', e);
      } finally {
        setAuthLoading(false);
      }
    }

    loadUser();

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        const role =
          currentUser.app_metadata?.role ||
          currentUser.user_metadata?.role ||
          'customer';
        const email = currentUser.email?.toLowerCase();
        setIsAdmin(
          role === 'admin' ||
            role === 'staff' ||
            email === 'info.giniespace@gmail.com'
        );
      } else {
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });

    // Close dropdown on outside click
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [supabase]);

  // Handle Sign Out
  const handleSignOut = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    router.push('/');
    router.refresh();
  };

  // If in admin panel, navbar is handled by admin layout
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const navLinks = [
    { name: 'All Denim', href: '/products' },
    { name: 'Track Order', href: '/track-order' },
    { name: 'Slim Fit', href: '/products?category=slim-fit-denim' },
    { name: 'Straight Fit', href: '/products?category=regular-straight' },
    { name: 'Jackets & Tops', href: '/products?category=casual-jackets-shirts' },
    { name: 'B2B Wholesale', href: '/b2b' },
    { name: 'Our Factory', href: '/about' },
  ];

  const displayName =
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    user?.phone ||
    'My Account';

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-border shadow-subtle">
      {/* Top Announcement Ribbon - Sensex Style Right-to-Left Continuous Ticker */}
      <div className="bg-primary text-white text-[11px] sm:text-xs font-semibold py-1.5 overflow-hidden group-marquee border-b border-primary-hover relative cursor-default">
        <div className="animate-marquee-infinite flex items-center gap-10 whitespace-nowrap">
          {/* Track 1 */}
          <div className="flex items-center gap-8 shrink-0">
            <span className="flex items-center gap-1.5">
              <span>🏭</span> FACTORY DIRECT PREMIUM DENIM · SHEIKHPURA (BIHAR)
            </span>
            <span className="text-white/40">✦</span>
            <span className="flex items-center gap-1.5">
              <span>⚡</span> DISPATCH WITHIN 24 HOURS ACROSS INDIA
            </span>
            <span className="text-white/40">✦</span>
            <span className="flex items-center gap-1.5">
              <span>📦</span> FREE EXPRESS SHIPPING ON PREPAID ORDERS OVER ₹999
            </span>
            <span className="text-white/40">✦</span>
            <span className="flex items-center gap-1.5">
              <span>💎</span> 100% COMBED RING-SPUN COTTON · IN-HOUSE STONEWASH
            </span>
            <span className="text-white/40">✦</span>
            <span className="flex items-center gap-1.5">
              <span>🏷️</span> USE CODE <strong className="bg-white/20 px-1.5 py-0.5 rounded text-white tracking-wider font-bold">TOLAND10</strong> FOR 10% OFF
            </span>
            <span className="text-white/40">✦</span>
            <span className="flex items-center gap-1.5">
              <span>🛡️</span> 7-DAY DOORSTEP EXCHANGE & AUTHENTIC WARRANTY
            </span>
            <span className="text-white/40">✦</span>
            <span className="flex items-center gap-1.5">
              <span>📞</span> WHATSAPP FACTORY DESK: +91 87971 86001
            </span>
          </div>

          {/* Track 2 (Seamless Infinite Duplicate) */}
          <div className="flex items-center gap-8 shrink-0" aria-hidden="true">
            <span className="flex items-center gap-1.5">
              <span>🏭</span> FACTORY DIRECT PREMIUM DENIM · SHEIKHPURA (BIHAR)
            </span>
            <span className="text-white/40">✦</span>
            <span className="flex items-center gap-1.5">
              <span>⚡</span> DISPATCH WITHIN 24 HOURS ACROSS INDIA
            </span>
            <span className="text-white/40">✦</span>
            <span className="flex items-center gap-1.5">
              <span>📦</span> FREE EXPRESS SHIPPING ON PREPAID ORDERS OVER ₹999
            </span>
            <span className="text-white/40">✦</span>
            <span className="flex items-center gap-1.5">
              <span>💎</span> 100% COMBED RING-SPUN COTTON · IN-HOUSE STONEWASH
            </span>
            <span className="text-white/40">✦</span>
            <span className="flex items-center gap-1.5">
              <span>🏷️</span> USE CODE <strong className="bg-white/20 px-1.5 py-0.5 rounded text-white tracking-wider font-bold">TOLAND10</strong> FOR 10% OFF
            </span>
            <span className="text-white/40">✦</span>
            <span className="flex items-center gap-1.5">
              <span>🛡️</span> 7-DAY DOORSTEP EXCHANGE & AUTHENTIC WARRANTY
            </span>
            <span className="text-white/40">✦</span>
            <span className="flex items-center gap-1.5">
              <span>📞</span> WHATSAPP FACTORY DESK: +91 87971 86001
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Manufacturer Tag */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 -ml-2 rounded-lg text-text hover:bg-surface-alt transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="flex flex-col group">
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-text leading-none flex items-center">
                TOLAND
              </span>
              <span className="text-[10px] tracking-widest font-semibold text-muted uppercase mt-0.5">
                Denim & Casuals
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-text ${
                    isActive ? 'text-primary font-semibold border-b-2 border-primary pb-0.5' : 'text-muted'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Trigger Button */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-full text-text hover:bg-surface-alt border border-transparent hover:border-border transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Search Denim"
              aria-label="Search Catalog"
            >
              <Search className="w-4 h-4 text-primary" />
              <span className="hidden xl:inline text-text-secondary font-medium">Search</span>
            </button>

            {/* Quick Track Order Link */}
            <Link
              href="/track-order"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold text-text hover:bg-surface-alt border border-transparent hover:border-border transition-colors"
              title="Track Order"
            >
              <Truck className="w-3.5 h-3.5 text-primary" />
              <span className="hidden xl:inline">Track Order</span>
            </Link>

            <Link
              href="/b2b"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-alt border border-border text-text hover:bg-slate-100 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Bulk / B2B</span>
            </Link>

            {/* User Auth State & Dropdown */}
            {authLoading ? (
              <div className="w-8 h-8 rounded-full bg-surface-alt animate-pulse" />
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`p-1.5 sm:px-3 sm:py-1.5 rounded-full border transition-all flex items-center gap-1.5 text-xs font-semibold ${
                    isAdmin
                      ? 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/15'
                      : 'bg-surface-alt border-border text-text hover:bg-slate-100'
                  }`}
                  aria-label="User Account Menu"
                >
                  {isAdmin ? (
                    <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <User className="w-4 h-4 text-primary shrink-0" />
                  )}
                  <span className="hidden sm:inline max-w-[100px] truncate">
                    {isAdmin ? 'Admin' : displayName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-border shadow-card-hover py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-xs font-bold text-text truncate">{displayName}</p>
                      <p className="text-[11px] text-muted truncate">{user.email || user.phone}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-primary/10 text-primary border border-primary/20">
                          Administrator
                        </span>
                      )}
                    </div>

                    <div className="py-1">
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-primary hover:bg-slate-50 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-primary" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}

                      <Link
                        href="/account"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-text hover:bg-slate-50 transition-colors"
                      >
                        <User className="w-4 h-4 text-primary" />
                        <span>My Account & Orders</span>
                      </Link>

                      <Link
                        href="/products"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-text hover:bg-slate-50 transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4 text-muted" />
                        <span>Browse Catalog</span>
                      </Link>

                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-danger hover:bg-danger/10 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="p-2 sm:px-3 sm:py-1.5 rounded-full text-text hover:bg-surface-alt border border-transparent hover:border-border transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="Customer Login / Admin"
              >
                <User className="w-4 h-4 text-primary" />
                <span className="hidden lg:inline text-text-secondary font-medium">Login</span>
              </Link>
            )}

            {/* Wishlist Button */}
            <button
              onClick={() => setWishlistOpen(true)}
              className="relative p-2.5 rounded-full text-text hover:bg-surface-alt border border-transparent hover:border-border transition-colors cursor-pointer"
              aria-label="Saved Items"
              title="Saved Items"
            >
              <Heart className="w-4 h-4 text-rose-500" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Shopping Cart Button */}
            <Link
              href="/cart"
              className="relative p-2.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition-all"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-border px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Mobile Search Bar Trigger */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setSearchModalOpen(true);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-surface-alt border border-border text-muted text-xs font-medium hover:border-primary transition-colors text-left"
          >
            <Search className="w-4 h-4 text-primary" />
            <span>Search jeans, styles, fits...</span>
          </button>

          {/* User Status Bar in Mobile */}
          <div className="p-3 rounded-xl bg-surface-alt border border-border flex items-center justify-between">
            {user ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                    {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-text truncate max-w-[160px]">{displayName}</div>
                    <div className="text-[11px] text-muted">{isAdmin ? 'Administrator' : 'Customer'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-2.5 py-1 rounded-lg bg-primary text-white text-xs font-semibold"
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-white text-xs font-semibold"
              >
                <User className="w-4 h-4" />
                <span>Sign In / Register</span>
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-lg bg-surface-alt border border-border text-text hover:border-primary transition-colors text-center"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted">
            <a
              href="https://wa.me/918797186001"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-accent font-semibold"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>WhatsApp: +91 8797186001</span>
            </a>
            <span className="text-[11px] font-medium text-muted">
              Sheikhpura, Bihar
            </span>
          </div>
        </div>
      )}

      {/* Global Live Search Modal */}
      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />

      {/* Global Saved Wishlist Slide-Over */}
      <WishlistDrawer isOpen={wishlistOpen} onClose={() => setWishlistOpen(false)} />
    </header>
  );
}
