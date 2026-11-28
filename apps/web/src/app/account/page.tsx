'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  ShoppingBag,
  Truck,
  RotateCcw,
  MapPin,
  Phone,
  Mail,
  LogOut,
  Package,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ExternalLink,
  FileText,
  Heart,
  Trash2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useWishlist } from '@/context/wishlist-context';

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'address' | 'support'>('orders');
  const { items: wishlistItems, removeFromWishlist, openDrawer: openWishlistDrawer } = useWishlist();

  useEffect(() => {
    async function loadAccount() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!currentUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        setUser(currentUser);

        // Fetch user orders via account API
        const res = await fetch('/api/account/orders');
        const data = await res.json();
        if (data.success && data.orders) {
          setOrders(data.orders);
        }
      } catch (e) {
        console.error('Account load error:', e);
      } finally {
        setLoading(false);
      }
    }

    loadAccount();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'packed':
      case 'processing':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'confirmed':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <div className="p-8 rounded-3xl bg-white border border-border shadow-card text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
            <User className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-text">Customer Profile &amp; Orders</h1>
            <p className="text-xs text-muted leading-relaxed">
              Sign in with your registered mobile number or email to manage your orders, download GST invoices, or track live parcels.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <Link
              href="/auth/login"
              className="w-full py-3 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              <span>Sign In to My Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/track-order"
              className="w-full py-3 rounded-xl bg-surface-alt border border-border text-text text-xs font-semibold hover:border-primary hover:text-primary flex items-center justify-center gap-2 transition-colors"
            >
              <Truck className="w-4 h-4 text-primary" />
              <span>Track Order via Phone / Order ID</span>
            </Link>

            <Link
              href="/returns"
              className="w-full py-2.5 rounded-xl text-xs font-medium text-muted hover:text-text flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Request 7-Day Doorstep Exchange / Return</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayName =
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    user.phone ||
    'Customer';

  const defaultAddress = orders[0]?.address_snapshot || null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 w-full max-w-full overflow-x-clip min-w-0">
      {/* Account Profile Header Card */}
      <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 shadow-xl">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-400 text-base sm:text-lg font-bold shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate">{displayName}</h1>
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                Verified Customer
              </span>
            </div>
            <p className="text-2xs sm:text-xs text-white/70 mt-0.5 flex flex-wrap items-center gap-2 truncate">
              {user.email && <span className="truncate">{user.email}</span>}
              {user.phone && <span>· {user.phone}</span>}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2.5 w-full sm:w-auto shrink-0">
          <Link
            href="/track-order"
            className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Track Live Order</span>
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-rose-600/25 hover:bg-rose-600/40 text-rose-200 border border-rose-500/30 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation (Zero Horizontal Overflow, Compact on Mobile) */}
      <div className="flex items-center gap-1.5 sm:gap-4 border-b border-border pb-1 overflow-x-auto whitespace-nowrap scrollbar-none w-full max-w-full min-w-0">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-3 py-2 sm:pb-3 text-xs font-bold transition-colors flex items-center gap-1.5 rounded-xl sm:rounded-none sm:border-b-2 sm:-mb-[5px] shrink-0 ${
            activeTab === 'orders'
              ? 'bg-primary text-white sm:bg-transparent sm:border-primary sm:text-primary shadow-xs sm:shadow-none'
              : 'bg-surface-alt sm:bg-transparent border border-border sm:border-transparent text-muted hover:text-text'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`px-3 py-2 sm:pb-3 text-xs font-bold transition-colors flex items-center gap-1.5 rounded-xl sm:rounded-none sm:border-b-2 sm:-mb-[5px] shrink-0 cursor-pointer ${
            activeTab === 'wishlist'
              ? 'bg-primary text-white sm:bg-transparent sm:border-primary sm:text-primary shadow-xs sm:shadow-none'
              : 'bg-surface-alt sm:bg-transparent border border-border sm:border-transparent text-muted hover:text-text'
          }`}
        >
          <Heart className="w-3.5 h-3.5 text-rose-500" />
          <span>Wishlist ({wishlistItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('address')}
          className={`px-3 py-2 sm:pb-3 text-xs font-bold transition-colors flex items-center gap-1.5 rounded-xl sm:rounded-none sm:border-b-2 sm:-mb-[5px] shrink-0 ${
            activeTab === 'address'
              ? 'bg-primary text-white sm:bg-transparent sm:border-primary sm:text-primary shadow-xs sm:shadow-none'
              : 'bg-surface-alt sm:bg-transparent border border-border sm:border-transparent text-muted hover:text-text'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span className="sm:inline hidden">Default Shipping Address</span>
          <span className="sm:hidden inline">Address</span>
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`px-3 py-2 sm:pb-3 text-xs font-bold transition-colors flex items-center gap-1.5 rounded-xl sm:rounded-none sm:border-b-2 sm:-mb-[5px] shrink-0 ${
            activeTab === 'support'
              ? 'bg-primary text-white sm:bg-transparent sm:border-primary sm:text-primary shadow-xs sm:shadow-none'
              : 'bg-surface-alt sm:bg-transparent border border-border sm:border-transparent text-muted hover:text-text'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span className="sm:inline hidden">Factory Support & Warranty</span>
          <span className="sm:hidden inline">Support</span>
        </button>
      </div>

      {/* Tab 1: Orders History */}
      {activeTab === 'orders' && (
        <div className="space-y-6 w-full max-w-full">
          {orders.length === 0 ? (
            <div className="py-12 sm:py-16 px-4 text-center bg-surface-alt rounded-2xl sm:rounded-3xl border border-border w-full">
              <div className="max-w-xs sm:max-w-sm mx-auto space-y-3 flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-1">
                  <Package className="w-7 h-7" />
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-text">No Orders Found Yet</h3>
                <p className="text-xs text-muted leading-relaxed">
                  You haven&apos;t placed any orders yet. Explore our genuine factory-direct denim collection.
                </p>
                <div className="pt-2">
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-hover shadow-xs active:scale-95 transition-transform"
                  >
                    <span>Start Shopping</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => {
                const address = ord.address_snapshot || {};
                const items = ord.order_items || [];

                return (
                  <div
                    key={ord.id}
                    className="p-6 rounded-3xl bg-white border border-border shadow-card space-y-4"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-extrabold text-text">
                            {ord.order_no}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusBadge(
                              ord.status
                            )}`}
                          >
                            {ord.status}
                          </span>
                        </div>
                        <p className="text-2xs text-muted">
                          Placed on{' '}
                          {new Date(ord.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          · {ord.payment_method?.toUpperCase()} ({ord.payment_status})
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-2xs text-muted block uppercase tracking-wider">
                            Total Amount
                          </span>
                          <span className="text-lg font-black font-mono text-primary">
                            ₹{ord.total}
                          </span>
                        </div>
                        <Link
                          href={`/track-order?q=${ord.order_no}`}
                          className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-1.5 hover:bg-primary-hover shadow-xs"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Track</span>
                        </Link>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2">
                      {items.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-1.5"
                        >
                          <div>
                            <span className="font-bold text-text">
                              {item.variant?.product?.name || 'TOLAND Premium Denim'}
                            </span>
                            <span className="text-muted text-2xs block">
                              Size: {item.variant?.size || 'Standard'} · {item.variant?.fit || 'Regular'} Fit · Qty: {item.qty}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-text">
                            ₹{item.price * item.qty}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order Actions */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <span className="text-muted text-2xs">
                        Delivering to: <strong className="text-text">{address.name}</strong>, {address.city}, {address.state} - {address.pincode}
                      </span>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/orders/${ord.order_no}/invoice`}
                          className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text hover:bg-surface-alt flex items-center gap-1"
                          title="Print GST Tax Invoice"
                        >
                          <FileText className="w-3.5 h-3.5 text-primary" />
                          <span>Invoice (PDF)</span>
                        </Link>
                        <Link
                          href={`/returns?order_no=${ord.order_no}`}
                          className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text hover:bg-surface-alt flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-primary" />
                          <span>Exchange / Return</span>
                        </Link>
                        <Link
                          href={`/orders/${ord.order_no}`}
                          className="px-3 py-1.5 rounded-lg text-primary font-bold hover:underline"
                        >
                          View Details &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Saved Wishlist */}
      {activeTab === 'wishlist' && (
        <div className="space-y-4 w-full max-w-full">
          {wishlistItems.length === 0 ? (
            <div className="py-12 sm:py-16 px-4 text-center bg-surface-alt rounded-2xl sm:rounded-3xl border border-border w-full">
              <div className="max-w-xs sm:max-w-sm mx-auto space-y-3 flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 mb-1">
                  <Heart className="w-7 h-7 fill-rose-500" />
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-text">Your Wishlist is Empty</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Save your favorite TOLAND jeans and jackets while browsing to pick sizes and order later.
                </p>
                <div className="pt-2">
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-hover shadow-xs active:scale-95 transition-transform"
                  >
                    <span>Browse Denim Catalog</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-surface-alt border border-border">
                <p className="text-xs text-muted">
                  You have <strong className="text-text">{wishlistItems.length}</strong> saved{' '}
                  {wishlistItems.length === 1 ? 'item' : 'items'} in your shortlist.
                </p>
                <button
                  type="button"
                  onClick={openWishlistDrawer}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Quick-Pick Size &amp; Move to Bag</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {wishlistItems.map((item) => (
                  <div
                    key={item.productId}
                    className="p-4 rounded-2xl bg-white border border-border shadow-card flex items-center gap-3.5"
                  >
                    <Link
                      href={`/products/${item.slug || item.productId}`}
                      className="w-16 h-20 rounded-xl bg-surface-alt border border-border overflow-hidden shrink-0 block"
                    >
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted">
                          TOLAND
                        </div>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0 space-y-1">
                      {item.category && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary block truncate">
                          {item.category}
                        </span>
                      )}
                      <Link
                        href={`/products/${item.slug || item.productId}`}
                        className="text-xs font-bold text-text hover:text-primary line-clamp-1 block"
                      >
                        {item.name}
                      </Link>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-mono font-bold text-slate-900">
                          ₹{Number(item.price).toLocaleString('en-IN')}
                        </span>
                        {item.mrp && item.mrp > item.price && (
                          <span className="text-[10px] text-muted line-through font-mono">
                            ₹{Number(item.mrp).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <div className="pt-1 flex items-center gap-2">
                        <Link
                          href={`/products/${item.slug || item.productId}`}
                          className="text-[11px] font-bold text-primary hover:underline"
                        >
                          Select Size &rarr;
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeFromWishlist(item.productId)}
                          className="ml-auto p-1 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 3: Default Address */}
      {activeTab === 'address' && (
        <div className="p-6 rounded-3xl bg-white border border-border shadow-card space-y-4 max-w-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <MapPin className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-text">Primary Delivery Address</h2>
          </div>

          {defaultAddress ? (
            <div className="space-y-2 text-xs text-text leading-relaxed">
              <div className="font-bold text-sm">{defaultAddress.name}</div>
              <p className="text-muted">{defaultAddress.line1 || defaultAddress.addressLine1}</p>
              {(defaultAddress.line2 || defaultAddress.addressLine2) && (
                <p className="text-muted">{defaultAddress.line2 || defaultAddress.addressLine2}</p>
              )}
              <p className="text-muted">
                {defaultAddress.city}, {defaultAddress.state} -{' '}
                <strong className="text-text font-mono">{defaultAddress.pincode}</strong>
              </p>
              <p className="text-muted flex items-center gap-1 pt-1">
                <Phone className="w-3 h-3 text-emerald-600" />
                <span>{defaultAddress.phone}</span>
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted">
              No delivery address saved yet. Your address will be saved automatically when you place your first order.
            </p>
          )}
        </div>
      )}

      {/* Tab 3: Support */}
      {activeTab === 'support' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-border shadow-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-text">WhatsApp Factory Desk</h3>
            <p className="text-xs text-muted leading-relaxed">
              Speak directly with our dispatch supervisors at Sheikhpura, Bihar for order updates, customized sizing, or exchange queries.
            </p>
            <a
              href="https://wa.me/918797186001?text=Hello%20TOLAND,%20I%20need%20assistance%20with%20my%20account"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
            >
              <span>Chat on WhatsApp (+91 87971 86001)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-border shadow-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-text">7-Day Doorstep Replacement Guarantee</h3>
            <p className="text-xs text-muted leading-relaxed">
              All TOLAND denims come with hassle-free 7-day doorstep size replacement across all Indian PIN codes.
            </p>
            <Link
              href="/returns"
              className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"
            >
              <span>Submit Doorstep Exchange Request &rarr;</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
