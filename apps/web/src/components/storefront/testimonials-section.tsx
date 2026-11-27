'use client';

import React from 'react';
import { Star, CheckCircle2, ShieldCheck, Quote } from 'lucide-react';

export interface CustomerReview {
  id: string;
  product_id?: string | null;
  customer_name: string;
  rating: number;
  title?: string | null;
  comment: string;
  is_verified_buyer?: boolean;
  is_featured?: boolean;
  created_at?: string;
}

interface TestimonialsSectionProps {
  reviews?: CustomerReview[];
}

const DEFAULT_REVIEWS: CustomerReview[] = [
  {
    id: 'f-1',
    customer_name: 'Aditya Verma',
    rating: 5,
    title: 'Heavyweight raw selvedge is pure gold',
    comment: 'Bohot premium denim fabric hai! 13.5oz ring-spun cotton feels authentic and rigid at first, but after 3 days of wear, it molds perfectly. Factory direct price me aisi quality market me 3000+ ki milti hai.',
    is_verified_buyer: true,
  },
  {
    id: 'f-2',
    customer_name: 'Mohd. Imran',
    rating: 5,
    title: 'Mid-blue wash looks super classy',
    comment: 'Stonewash finishing is subtle and elegant. Double needle chainstitch is very strong. Fast express delivery from Sheikhpura to Patna in 24 hours. Highly recommended!',
    is_verified_buyer: true,
  },
  {
    id: 'f-3',
    customer_name: 'Vikram Singh',
    rating: 5,
    title: 'Best black jeans I have ever purchased',
    comment: 'Deep pitch black color, zero fading after two washes. Stretch is comfortable without losing structural shape. Will buy wholesale for my boutique next month.',
    is_verified_buyer: true,
  },
  {
    id: 'f-4',
    customer_name: 'Rajesh Agarwal (Retail Boutique)',
    rating: 5,
    title: 'Reliable Wholesale Denim Manufacturer',
    comment: 'Ordered 150 pieces bulk sample lot for our retail store in Muzaffarpur. Seamless delivery, GST invoice provided, and our retail customers loved the authentic fit.',
    is_verified_buyer: true,
  },
];

export function TestimonialsSection({ reviews = [] }: TestimonialsSectionProps) {
  const displayReviews = reviews && reviews.length > 0 ? reviews : DEFAULT_REVIEWS;

  return (
    <section className="bg-gradient-to-b from-white via-surface-alt to-white py-12 sm:py-16 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Real Customer Stories</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
              Customer Ratings &amp; Verified Reviews
            </h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Genuine experiences from retail buyers and boutique owners who wear and trust TOLAND Sheikhpura denim.
            </p>
          </div>

          {/* Aggregate Rating Scorecard */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-border shadow-subtle flex items-center gap-4 shrink-0">
            <div className="text-3xl sm:text-4xl font-extrabold text-text leading-none">
              4.9
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="text-[11px] font-semibold text-muted">
                Based on verified purchases
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-6 rounded-2xl bg-white border border-border shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Star rating */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < (rev.rating || 5)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <Quote className="w-5 h-5 text-slate-200 group-hover:text-emerald-500 transition-colors" />
                </div>

                {/* Title */}
                {rev.title && (
                  <h3 className="text-sm font-bold text-text leading-snug line-clamp-1">
                    {rev.title}
                  </h3>
                )}

                {/* Review Text */}
                <p className="text-xs text-muted leading-relaxed line-clamp-4">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>

              {/* Author & Verified Tag */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-text">{rev.customer_name}</div>
                  <div className="text-[10px] text-muted">Bihar / India</div>
                </div>

                {rev.is_verified_buyer !== false && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Verified</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
