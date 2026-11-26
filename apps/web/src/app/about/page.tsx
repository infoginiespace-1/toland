import React from 'react';
import Link from 'next/link';
import {
  Scissors,
  Layers,
  MapPin,
  CheckCircle2,
  Building2,
  Users,
  Award,
  Sparkles,
} from 'lucide-react';

export const metadata = {
  title: 'About TOLAND | Sheikhpura Denim Manufacturing',
  description: 'Learn about TOLAND Private Limited, authentic denim jeans manufacturer based in Sheikhpura, Bihar.',
};

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>Our Story & Facility</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-text tracking-tight">
          Crafting Heavyweight Denim in Sheikhpura, Bihar
        </h1>
        <p className="text-sm sm:text-base text-muted leading-relaxed">
          TOLAND Private Limited was founded on a simple conviction: premium quality denim jeans should not cost a
          fortune. By operating our own integrated production floor, we bring genuine ring-spun cotton denim directly
          from our factory to consumers and retailers with honest pricing.
        </p>
      </div>

      {/* Factory Story */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="p-8 rounded-3xl bg-surface-alt border border-border space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-primary">
            <Building2 className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Manufacturing Unit</span>
          </div>
          <h2 className="text-2xl font-black text-text">Direct In-House Production</h2>
          <p className="text-xs text-muted leading-relaxed">
            Located in Khetalpura, Barbigha (Sheikhpura 811101), our facility houses computer-guided fabric cutting tables,
            heavy-duty industrial chainstitch sewing lines, dedicated enzyme stone-washing tumblers, and precision finishing
            stations.
          </p>
          <div className="pt-2 text-xs font-semibold text-text space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span>100% Indian ring-spun cotton yarn</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span>Heavyweight 12.5oz to 14.5oz fabric weights</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span>Eco-conscious enzyme stone washes</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-surface-alt border border-border space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-accent">Our Philosophy</div>
            <h3 className="text-lg font-bold text-text">Zero Middleman Markups</h3>
            <p className="text-xs text-muted leading-relaxed">
              Traditional retail brands add 3x to 5x markups through distributors, licensing agents, and retail mall rents.
              We cut out every intermediary layer, passing direct factory savings to you.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface-alt border border-border space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-accent">Local Employment</div>
            <h3 className="text-lg font-bold text-text">Empowering Bihar&apos;s Textile Artisans</h3>
            <p className="text-xs text-muted leading-relaxed">
              We take deep pride in training and employing skilled cutters, tailors, and quality technicians locally in
              Sheikhpura, contributing to the economic growth of the region.
            </p>
          </div>
        </div>
      </div>

      {/* Address & Visiting Card */}
      <div className="p-8 rounded-3xl bg-surface-alt border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h3 className="text-base font-black text-text">Corporate & Factory Address</h3>
          <p className="text-xs text-muted flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <span>TOLAND Private Limited — Sheikhpura, Barbigha, Khetalpura 811101 (Bihar, India)</span>
          </p>
        </div>

        <Link
          href="/products"
          className="px-6 py-3 rounded-xl bg-primary text-white text-xs font-extrabold uppercase tracking-wide hover:bg-primary-hover shadow-xs transition-colors shrink-0"
        >
          Explore Catalog
        </Link>
      </div>
    </div>
  );
}
