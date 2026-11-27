'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  MessageSquare,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface ReviewItem {
  id: string;
  product_id?: string | null;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  rating: number;
  title?: string | null;
  comment: string;
  is_verified_buyer: boolean;
  is_featured: boolean;
  status: 'approved' | 'pending' | 'rejected';
  created_at: string;
  product?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface ReviewsManagerProps {
  initialReviews: ReviewItem[];
}

export function ReviewsManager({ initialReviews }: ReviewsManagerProps) {
  const router = useRouter();
  const supabase = createClient();
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Setup Realtime Subscription on reviews table
  useEffect(() => {
    const channel = supabase
      .channel('admin-reviews-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  // Keep state synced when initialReviews change
  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  // Handle Status Update (Approve / Reject)
  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      setLoadingId(id);
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch (err: any) {
      alert(`Error updating review: ${err.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  // Toggle Feature on Landing Page
  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    try {
      setLoadingId(id);
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_featured: !currentFeatured }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle featured');

      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_featured: !currentFeatured } : r))
      );
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this review?')) return;

    try {
      setLoadingId(id);
      const res = await fetch(`/api/admin/reviews?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete review');

      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  // Metrics
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((acc, curr) => acc + (curr.rating || 5), 0) / totalReviews).toFixed(1)
      : '5.0';
  const approvedCount = reviews.filter((r) => r.status === 'approved').length;
  const featuredCount = reviews.filter((r) => r.is_featured).length;

  // Filtered List
  const filteredReviews = reviews.filter((r) => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.customer_name?.toLowerCase().includes(q);
      const matchComment = r.comment?.toLowerCase().includes(q);
      const matchProduct = r.product?.name?.toLowerCase().includes(q);
      return matchName || matchComment || matchProduct;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h1 className="text-xl font-black text-text">Customer Ratings & Reviews Moderation</h1>
          </div>
          <p className="text-xs text-muted mt-1">
            Realtime customer feedback synced across product pages, landing page showcase, and database.
          </p>
        </div>

        <button
          onClick={() => router.refresh()}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-alt border border-border text-xs font-bold text-text hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Realtime</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-border shadow-subtle space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Total Reviews</span>
          <div className="text-2xl font-black text-text">{totalReviews}</div>
          <p className="text-[11px] text-muted">Submitted across store</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-border shadow-subtle space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Average Rating</span>
          <div className="text-2xl font-black text-amber-500 flex items-center gap-1">
            <span>{avgRating}</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
          <p className="text-[11px] text-muted">Out of 5.0 stars</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-border shadow-subtle space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Approved Status</span>
          <div className="text-2xl font-black text-emerald-600">{approvedCount}</div>
          <p className="text-[11px] text-muted">Live on product catalog</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-border shadow-subtle space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Featured on Home</span>
          <div className="text-2xl font-black text-primary flex items-center gap-1">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <span>{featuredCount}</span>
          </div>
          <p className="text-[11px] text-muted">Highlighted testimonials</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-border shadow-subtle">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name or product..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-surface-alt text-xs focus:outline-none focus:border-primary text-text"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'approved', 'pending', 'rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer ${
                filterStatus === st
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-alt text-muted hover:text-text hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Table / List */}
      <div className="rounded-2xl border border-border bg-white shadow-card overflow-hidden">
        {filteredReviews.length === 0 ? (
          <div className="p-12 text-center text-muted text-xs space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-bold text-text">No reviews found matching your filter</p>
            <p>Customer reviews submitted on storefront will appear here instantly in realtime.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredReviews.map((r) => {
              const isLoading = loadingId === r.id;

              return (
                <div key={r.id} className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:bg-surface-alt transition-colors">
                  <div className="space-y-2 max-w-2xl">
                    {/* Stars & Meta */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>

                      <span className="text-xs font-bold text-text">{r.customer_name}</span>

                      {r.is_verified_buyer && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Verified Purchase</span>
                        </span>
                      )}

                      {/* Status Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${
                          r.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {r.status}
                      </span>

                      {r.is_featured && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <Sparkles className="w-3 h-3 text-purple-600" />
                          <span>Featured on Home</span>
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    {r.title && (
                      <h4 className="text-sm font-bold text-text">{r.title}</h4>
                    )}

                    {/* Comment */}
                    <p className="text-xs text-text-secondary leading-relaxed">
                      &ldquo;{r.comment}&rdquo;
                    </p>

                    {/* Product Associated */}
                    <div className="flex flex-wrap items-center gap-3 text-3xs text-muted pt-1">
                      {r.product ? (
                        <Link
                          href={`/products/${r.product.slug}`}
                          target="_blank"
                          className="font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          <span>Product: {r.product.name}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      ) : (
                        <span>Storefront Experience Review</span>
                      )}

                      <span>·</span>
                      <span>{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>

                      {r.customer_phone && (
                        <>
                          <span>·</span>
                          <span className="font-mono">{r.customer_phone}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                    {/* Toggle Feature on Homepage */}
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(r.id, r.is_featured)}
                      disabled={isLoading}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        r.is_featured
                          ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100'
                          : 'border-border text-muted hover:text-text hover:bg-surface-alt'
                      }`}
                      title={r.is_featured ? 'Remove from Homepage' : 'Feature on Homepage'}
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>

                    {/* Approve / Reject */}
                    {r.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(r.id, 'approved')}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}

                    {r.status !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(r.id, 'rejected')}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-muted hover:text-danger hover:border-danger transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      disabled={isLoading}
                      className="p-2 rounded-xl text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                      title="Delete Review"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
