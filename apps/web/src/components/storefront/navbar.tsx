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
  User,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Search,
  Truck,
  Heart,
  RotateCcw,
  ArrowRight,
  LogIn,
} from 'lucide-react';
import { SearchModal } from '@/components/storefront/search-modal';
import { WishlistDrawer } from '@/components/storefront/wishlist-drawer';
import { MobileBottomNav } from '@/components/storefront/mobile-bottom-nav';
import { isTeamRole, resolveUserPermissions, resolveUserRole } from '@/lib/rbac';

const CATEGORY_LINKS = [
  {
    name: 'All Denim Collection',
    desc: 'Complete Sheikhpura factory catalog',
    href: '/products',
  },
  {
    name: 'Slim Fit Denim',
    desc: 'Tailored modern tapered silhouette',
    href: '/products?category=slim-fit-denim',
  },
  {
    name: 'Regular Straight Fit',
    desc: 'Classic comfort everyday wear',
    href: '/products?category=regular-straight',
  },
  {
    name: 'Jackets & Tops',
    desc: 'Heavyweight selvedge outerwear',
    href: '/products?category=casual-jackets-shirts',
  },
];

export function StorefrontNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount } = useCart();
  const { itemCount: wishlistCount, isDrawerOpen: wishlistOpen, openDrawer: openWishlist, closeDrawer: closeWishlist } = useWishlist();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);

  // Auth state
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (currentUser) {
          setUser(currentUser);
          setIsAdmin(
            isTeamRole(resolveUserRole(currentUser)) &&
              resolveUserPermissions(currentUser).length > 0
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        setIsAdmin(
          isTeamRole(resolveUserRole(currentUser)) &&
            resolveUserPermissions(currentUser).length > 0
        );
      } else {
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });

    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
      if (
        categoriesRef.current &&
        !categoriesRef.current.contains(event.target as Node)
      ) {
        setCategoriesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [supabase]);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setCategoriesOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    router.push('/');
    router.refresh();
  };

  if (pathname.startsWith('/admin')) {
    return null;
  }

  const displayName =
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    user?.phone ||
    'Account';

  return (
    <>
      <header className="sticky top-0 z-50 w-full max-w-full bg-white/95 backdrop-blur-md border-b border-border shadow-subtle overflow-x-clip">
      {/* Top Announcement Ribbon - Continuous Smooth Ticker */}
      <div className="w-full max-w-full bg-primary text-white text-[11px] font-medium py-1.5 overflow-hidden group-marquee border-b border-primary-hover relative cursor-default">
        <div className="animate-marquee-infinite flex items-center gap-10 whitespace-nowrap">
          <div className="flex items-center gap-8 shrink-0">
            <span className="flex items-center gap-1.5">
              <span>🏭</span> FACTORY DIRECT DENIM · SHEIKHPURA (BIHAR)
            </span>
            <span className="text-white/40">✦</span>
            <span className="flex items-center gap-1.5">
              <span>⚡</span> 24-HOUR DISPATCH ACROSS INDIA
            </span>
            <span className="text-white/40">✦</span>
            <span className="flex items-center gap-1.5">
              <span>📦</span> FREE EXPRESS SHIPPING OVER ₹999
            </span>
            <span className="text-white/40">✦</span>
            <span className="flex items-center gap-1.5">
              <span>🏷️</span> USE CODE <strong className="bg-white/20 px-1.5 py-0.5 rounded text-white font-semibold">TOLAND10</strong> FOR 10% OFF
            </span>
            <span className="text-white/40">✦</span>
            <span className="flex items-center gap-1.5">
              <span>🛡️</span> 7-DAY DOORSTEP SIZE EXCHANGE
            </span>
          </div>
          <div className="flex items-center gap-8 shrink-0" aria-hidden="true">
            <span className="flex items-center gap-1.5">
              <span>🏭</span> FACTORY DIRECT DENIM · SHEIKHPURA (BIHAR)
            </span>
            <span className="text-white/40">✦</span>
            <span className="flex items-center gap-1.5">
              <span>⚡</span> 24-HOUR DISPATCH ACROSS INDIA
            </span>
            <span className="text-white/40">✦</span>
            <span className="flex items-center gap-1.5">
              <span>📦</span> FREE EXPRESS SHIPPING OVER ₹999
            </span>
            <span className="text-white/40">✦</span>
            <span className="flex items-center gap-1.5">
              <span>🏷️</span> USE CODE <strong className="bg-white/20 px-1.5 py-0.5 rounded text-white font-semibold">TOLAND10</strong> FOR 10% OFF
            </span>
            <span className="text-white/40">✦</span>
            <span className="flex items-center gap-1.5">
              <span>🛡️</span> 7-DAY DOORSTEP SIZE EXCHANGE
            </span>
          </div>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Mobile Menu Button + Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 -ml-2 rounded-lg text-text hover:bg-surface-alt transition-colors cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="flex flex-col shrink-0">
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 leading-none">
                TOLAND
              </span>
              <span className="text-[9px] tracking-[0.2em] font-semibold text-muted uppercase mt-0.5">
                Denim &amp; Apparel
              </span>
            </Link>
          </div>

          {/* Center: Clean 4-Item Desktop Navigation (Zero Duplicates, Organized Categories) */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/products"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === '/products' ? 'text-primary font-semibold' : 'text-slate-600'
              }`}
            >
              Shop Denim
            </Link>

            {/* Interactive Categories Dropdown */}
            <div
              className="relative"
              ref={categoriesRef}
              onMouseEnter={() => setCategoriesOpen(true)}
              onMouseLeave={() => setCategoriesOpen(false)}
            >
              <button
                type="button"
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-primary transition-colors py-2 cursor-pointer"
              >
                <span>Categories</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    categoriesOpen ? 'rotate-180 text-primary' : ''
                  }`}
                />
              </button>

              {categoriesOpen && (
                <div className="absolute left-0 top-full pt-1 w-72 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="rounded-2xl bg-white border border-border shadow-xl p-2 space-y-1">
                    {CATEGORY_LINKS.map((cat) => (
                      <Link
                        key={cat.href}
                        href={cat.href}
                        onClick={() => setCategoriesOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-alt transition-colors group"
                      >
                        <div>
                          <div className="text-xs font-semibold text-slate-900 group-hover:text-primary">
                            {cat.name}
                          </div>
                          <div className="text-[11px] text-muted">{cat.desc}</div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/b2b"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === '/b2b' ? 'text-primary font-semibold' : 'text-slate-600'
              }`}
            >
              B2B Wholesale
            </Link>

            <Link
              href="/about"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === '/about' ? 'text-primary font-semibold' : 'text-slate-600'
              }`}
            >
              Our Factory
            </Link>
          </nav>

          {/* Right: Minimal Action Icons (Search, Wishlist, Bag, User Profile) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Search Button */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="p-2 rounded-full text-slate-700 hover:bg-surface-alt hover:text-primary transition-colors cursor-pointer"
              title="Search Catalog"
              aria-label="Search Catalog"
            >
              <Search className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </button>

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={openWishlist}
              className="relative p-2 rounded-full text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
              aria-label="Saved Wishlist"
              title="Saved Wishlist"
            >
              <Heart
                className={`w-4 h-4 sm:w-[18px] sm:h-[18px] text-rose-500 transition-transform ${
                  wishlistCount > 0 ? 'fill-rose-500' : ''
                }`}
              />
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Shopping Cart Bag Button */}
            <Link
              href="/cart"
              className="relative p-2 sm:px-3 sm:py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-all flex items-center gap-1.5"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-semibold">Bag</span>
              {itemCount > 0 && (
                <span className="bg-accent text-primary text-[10px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User Profile & Order Tracking Menu (Works for Logged-in & Guest users) */}
            <div className="relative" ref={dropdownRef}>
              {authLoading ? (
                <div className="w-8 h-8 rounded-full bg-surface-alt animate-pulse" />
              ) : (
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`p-2 sm:px-3 sm:py-1.5 rounded-full border transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                    isAdmin
                      ? 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/15'
                      : 'bg-surface-alt border-border text-slate-700 hover:border-slate-300'
                  }`}
                  aria-label="User Profile Menu"
                >
                  {isAdmin ? (
                    <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <User className="w-4 h-4 text-slate-700 shrink-0" />
                  )}
                  <span className="hidden lg:inline max-w-[90px] truncate">
                    {user ? (isAdmin ? 'Admin' : displayName) : 'Profile'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0 hidden sm:block" />
                </button>
              )}

              {/* Profile Dropdown Menu (Contains Track Order & Account Tools) */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-border shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  {user ? (
                    <div className="px-4 py-2.5 border-b border-border">
                      <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                      <p className="text-[11px] text-muted truncate">{user.email || user.phone}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-primary/10 text-primary border border-primary/20">
                          Administrator
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-2.5 border-b border-border space-y-2">
                      <p className="text-[11px] text-muted">Manage orders, track parcels &amp; returns</p>
                      <Link
                        href="/auth/login"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Sign In / Register</span>
                      </Link>
                    </div>
                  )}

                  <div className="py-1.5">
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-primary hover:bg-surface-alt transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <Link
                      href="/account"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-surface-alt hover:text-primary transition-colors"
                    >
                      <User className="w-4 h-4 text-muted" />
                      <span>My Account &amp; Orders</span>
                    </Link>

                    <Link
                      href="/track-order"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-surface-alt hover:text-primary transition-colors"
                    >
                      <Truck className="w-4 h-4 text-primary" />
                      <span>Track Live Order</span>
                    </Link>

                    <Link
                      href="/returns"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-surface-alt hover:text-primary transition-colors"
                    >
                      <RotateCcw className="w-4 h-4 text-muted" />
                      <span>7-Day Exchange &amp; Returns</span>
                    </Link>

                    {user && (
                      <div className="pt-1 mt-1 border-t border-border">
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-danger hover:bg-danger/10 transition-colors text-left cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Categorized Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-border px-4 pt-3 pb-6 space-y-5 animate-in slide-in-from-top-2 duration-200 max-h-[82vh] overflow-y-auto">
          {/* Categories Group */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted px-1">
              Shop Denim Categories
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {CATEGORY_LINKS.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-alt border border-border text-slate-900 hover:border-primary transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold">{cat.name}</div>
                    <div className="text-[11px] text-muted">{cat.desc}</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted" />
                </Link>
              ))}
            </div>
          </div>

          {/* Wholesale & Mill Group */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted px-1">
              Wholesale &amp; Factory
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <Link
                href="/b2b"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-xl bg-surface-alt border border-border text-slate-800 hover:border-primary text-center"
              >
                B2B Wholesale
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-xl bg-surface-alt border border-border text-slate-800 hover:border-primary text-center"
              >
                Our Factory
              </Link>
            </div>
          </div>

          {/* Customer Profile & Order Utilities */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted px-1">
              Account &amp; Orders
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <Link
                href="/track-order"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-primary flex items-center justify-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Track Order</span>
              </Link>
              <Link
                href="/returns"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-xl bg-surface-alt border border-border text-slate-800 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-muted" />
                <span>Returns</span>
              </Link>
            </div>
          </div>

          {/* Footer Contact Row */}
          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted">
            <a
              href="https://wa.me/918797186001"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary font-semibold"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>WhatsApp: +91 8797186001</span>
            </a>
            <span className="text-[11px] font-medium">Sheikhpura, Bihar</span>
          </div>
        </div>
      )}
      </header>

      {/* Global Live Search Modal */}
      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />

      {/* Global Saved Wishlist Slide-Over (Portaled to document.body) */}
      <WishlistDrawer isOpen={wishlistOpen} onClose={closeWishlist} />

      {/* Mobile Sticky Bottom App Bar */}
      <MobileBottomNav
        onOpenSearch={() => setSearchModalOpen(true)}
        onOpenWishlist={openWishlist}
      />
    </>
  );
}
