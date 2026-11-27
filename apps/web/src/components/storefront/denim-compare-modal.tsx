'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCompare } from '@/context/compare-context';
import {
  Scale,
  X,
  Trash2,
  ArrowRight,
} from 'lucide-react';

export function DenimCompareModal() {
  const pathname = usePathname();
  const { items, removeFromCompare, clearCompare, isModalOpen, setIsModalOpen } = useCompare();

  if (pathname.startsWith('/admin') || items.length === 0) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom Compare Bar (Fixed near bottom, above bottom-nav) */}
      <div className="fixed bottom-28 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-full shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center -space-x-2">
          {items.map((it) => (
            <div
              key={it.id}
              className="w-8 h-8 rounded-full border-2 border-slate-900 overflow-hidden bg-slate-800"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.image || '/icon.svg'}
                alt={it.name}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        <div className="text-xs font-bold">
          <span>Compare ({items.length}/3)</span>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-1 rounded-full bg-accent text-primary text-xs font-black uppercase tracking-wider hover:bg-accent/90 transition-all cursor-pointer shadow-sm"
        >
          View Specs
        </button>

        <button
          type="button"
          onClick={clearCompare}
          className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Clear all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Comparison Modal Table */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-border rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-text">
                    Denim Specs Comparison
                  </h3>
                  <p className="text-xs text-muted">
                    Side-by-side comparison of authentic Sheikhpura weaves & cuts.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearCompare}
                  className="px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-muted hover:text-danger hover:border-danger transition-colors cursor-pointer"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-muted hover:text-text hover:bg-surface-alt transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Comparison Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <tbody>
                  {/* Row: Product Header */}
                  <tr className="border-b border-border">
                    <td className="py-4 px-3 w-36 font-bold uppercase tracking-wider text-muted bg-surface-alt">
                      Denim Style
                    </td>
                    {items.map((prod) => (
                      <td key={prod.id} className="py-4 px-4 min-w-[200px]">
                        <div className="space-y-3 relative">
                          <button
                            type="button"
                            onClick={() => removeFromCompare(prod.id)}
                            className="absolute top-0 right-0 p-1 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-danger transition-colors cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="w-24 h-28 rounded-2xl overflow-hidden border border-border bg-slate-50 mx-auto">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={prod.image || '/icon.svg'}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="text-center">
                            <h4 className="font-extrabold text-text text-sm line-clamp-1">
                              {prod.name}
                            </h4>
                            <div className="text-primary font-black text-sm font-mono mt-0.5">
                              ₹{prod.price}
                              {prod.mrp && (
                                <span className="text-muted text-xs line-through ml-1.5 font-normal">
                                  ₹{prod.mrp}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Row: Fit Cut */}
                  <tr className="border-b border-border">
                    <td className="py-3 px-3 font-bold uppercase tracking-wider text-muted bg-surface-alt">
                      Fit / Cut
                    </td>
                    {items.map((prod) => (
                      <td key={prod.id} className="py-3 px-4 font-bold text-text">
                        {prod.fit || 'Regular Straight'}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Wash & Tone */}
                  <tr className="border-b border-border">
                    <td className="py-3 px-3 font-bold uppercase tracking-wider text-muted bg-surface-alt">
                      Wash & Tone
                    </td>
                    {items.map((prod) => (
                      <td key={prod.id} className="py-3 px-4 text-text-secondary">
                        {prod.wash || 'Medium Indigo Stone Wash'}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Fabric Weight (GSM / oz) */}
                  <tr className="border-b border-border">
                    <td className="py-3 px-3 font-bold uppercase tracking-wider text-muted bg-surface-alt">
                      Denim Weight
                    </td>
                    {items.map((prod) => (
                      <td key={prod.id} className="py-3 px-4 text-text-secondary">
                        {prod.weight || '13.0 oz (All-Season Durable)'}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Material Composition */}
                  <tr className="border-b border-border">
                    <td className="py-3 px-3 font-bold uppercase tracking-wider text-muted bg-surface-alt">
                      Fabric Material
                    </td>
                    {items.map((prod) => (
                      <td key={prod.id} className="py-3 px-4 text-text-secondary">
                        {prod.fabric || '98% Cotton, 2% Elastane'}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Stretch Level */}
                  <tr className="border-b border-border">
                    <td className="py-3 px-3 font-bold uppercase tracking-wider text-muted bg-surface-alt">
                      Stretchability
                    </td>
                    {items.map((prod) => (
                      <td key={prod.id} className="py-3 px-4 text-text-secondary">
                        {prod.stretch || 'Comfort Stretch'}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Action Link */}
                  <tr>
                    <td className="py-4 px-3 font-bold uppercase tracking-wider text-muted bg-surface-alt">
                      Action
                    </td>
                    {items.map((prod) => (
                      <td key={prod.id} className="py-4 px-4">
                        <Link
                          href={`/products/${prod.slug}`}
                          onClick={() => setIsModalOpen(false)}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-hover transition-colors shadow-sm text-center"
                        >
                          <span>View Product</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
