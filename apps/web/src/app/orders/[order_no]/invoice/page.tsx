'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { Printer, ArrowLeft, ShieldCheck, Truck, Phone, FileText, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function OrderInvoicePage() {
  const params = useParams();
  const orderNo = params.order_no as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadOrder() {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              variant:product_variants (
                size,
                fit,
                wash,
                sku,
                product:products (name, slug, hsn_code)
              )
            ),
            shipments (*)
          `)
          .eq('order_no', orderNo)
          .single();

        if (error || !data) {
          setOrder(null);
        } else {
          setOrder(data);
        }
      } catch (e) {
        console.error('Invoice load error:', e);
      } finally {
        setLoading(false);
      }
    }

    if (orderNo) loadOrder();
  }, [orderNo, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!order) {
    return notFound();
  }

  const address = order.address_snapshot || {};
  const items = order.order_items || [];
  const shipment = order.shipments?.[0] || null;

  const isInterState = address.state && address.state.toLowerCase() !== 'bihar';
  const totalTax = order.tax || Math.round((order.total * 12) / 112);
  const cgst = isInterState ? 0 : Math.round(totalTax / 2);
  const sgst = isInterState ? 0 : Math.round(totalTax / 2);
  const igst = isInterState ? totalTax : 0;
  const taxableSubtotal = order.total - totalTax;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 sm:px-6 print:p-0 print:bg-white text-slate-900">
      {/* Top Controls Bar (Hidden in Print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/orders/${order.order_no}`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-border text-xs font-bold text-text hover:bg-slate-50 shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Order Tracking</span>
        </Link>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Print Tax Invoice & Shipping Slip (PDF)</span>
        </button>
      </div>

      {/* Main A4 Printable Sheet */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl print:shadow-none print:border-none print:rounded-none print:p-6 space-y-8 font-sans">
        {/* Header: Brand & GSTIN */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-900">
          <div>
            <div className="text-3xl font-black tracking-tight text-slate-900 leading-none">
              TOLAND
            </div>
            <div className="text-2xs uppercase tracking-widest font-extrabold text-slate-500 mt-1">
              Toland Private Limited · Denim Manufacturers
            </div>
            <p className="text-xs text-slate-600 max-w-sm mt-2 leading-relaxed">
              Industrial Area, Barbigha Road, Sheikhpura 811101, Bihar (India)<br />
              <strong>GSTIN:</strong> 10AAACT0000A1Z5 · <strong>State Code:</strong> 10 (Bihar)<br />
              <strong>CIN:</strong> U17299BR2026PTC049210 · <strong>HSN:</strong> 620342 (Men&apos;s Denim)
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="inline-block px-3 py-1 rounded-md bg-slate-900 text-white text-2xs font-extrabold uppercase tracking-wider">
              Tax Invoice / Retail Cash Memo
            </span>
            <div className="text-lg font-mono font-black text-slate-900 pt-1">
              INV-{order.order_no}
            </div>
            <div className="text-xs text-slate-600">
              <strong>Order Date:</strong> {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <div className="text-xs text-slate-600">
              <strong>Place of Supply:</strong> {address.state || 'Bihar'} (India)
            </div>
          </div>
        </div>

        {/* Bill To & Ship To Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-3xs uppercase tracking-wider font-extrabold text-slate-500 block">
              Billed & Delivered To:
            </span>
            <div className="font-bold text-sm text-slate-900 mt-1">{address.name}</div>
            <p className="text-slate-600 mt-0.5 leading-relaxed">
              {address.line1 || address.addressLine1}
              {(address.line2 || address.addressLine2) && <>, {address.line2 || address.addressLine2}</>}<br />
              {address.city}, {address.state} - <strong>{address.pincode}</strong>
            </p>
            <p className="text-slate-600 mt-1">
              <strong>Phone:</strong> {address.phone} {address.email && <>· <strong>Email:</strong> {address.email}</>}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-3xs uppercase tracking-wider font-extrabold text-slate-500 block">
              Payment & Logistics Details:
            </span>
            <div><strong>Payment Mode:</strong> {order.payment_method?.toUpperCase()} ({order.payment_status?.toUpperCase()})</div>
            <div><strong>Fulfillment Hub:</strong> Sheikhpura Mill Facility 01</div>
            <div><strong>Courier Partner:</strong> {shipment?.courier || 'Delhivery Express Direct'}</div>
            {shipment?.awb && <div><strong>AWB / Waybill No:</strong> {shipment.awb}</div>}
          </div>
        </div>

        {/* Itemized Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 text-3xs font-extrabold uppercase tracking-wider text-slate-600">
                <th className="py-2 px-2">#</th>
                <th className="py-2 px-2">Description of Goods</th>
                <th className="py-2 px-2">HSN Code</th>
                <th className="py-2 px-2">Size & Fit</th>
                <th className="py-2 px-2 text-center">Qty</th>
                <th className="py-2 px-2 text-right">Unit Rate</th>
                <th className="py-2 px-2 text-right">Taxable Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item: any, idx: number) => {
                const itemTotal = item.price * item.qty;
                const itemTax = Math.round((itemTotal * 12) / 112);
                const itemTaxable = itemTotal - itemTax;

                return (
                  <tr key={idx}>
                    <td className="py-3 px-2 font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-2 font-bold text-slate-900">
                      {item.variant?.product?.name || 'TOLAND Premium Denim'}
                      <span className="block text-3xs font-normal text-slate-500">
                        100% Cotton Ring-Spun Denim · {item.variant?.wash || 'Raw'} Wash
                      </span>
                    </td>
                    <td className="py-3 px-2 font-mono text-slate-600">
                      {item.variant?.product?.hsn_code || '620342'}
                    </td>
                    <td className="py-3 px-2 font-medium">
                      Waist {item.variant?.size || 'Standard'} ({item.variant?.fit || 'Regular'})
                    </td>
                    <td className="py-3 px-2 text-center font-bold font-mono">{item.qty}</td>
                    <td className="py-3 px-2 text-right font-mono">₹{Math.round(itemTaxable / item.qty)}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold">₹{itemTaxable}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Summary Calculation */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 pt-4 border-t border-slate-200 text-xs">
          <div className="max-w-sm space-y-2">
            <span className="font-bold text-slate-800 block">Declarations & Warranty:</span>
            <p className="text-3xs text-slate-500 leading-relaxed">
              We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
              Eligible for 7-day doorstep replacement across India.
            </p>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-3xs text-slate-600 space-y-0.5">
              <div><strong>Dispatched directly from Sheikhpura Factory</strong></div>
              <div>Factory Helpdesk: +91 87971 86001 · info.giniespace@gmail.com</div>
            </div>
          </div>

          <div className="w-full sm:w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Taxable Value:</span>
              <span className="font-mono font-bold">₹{taxableSubtotal}</span>
            </div>

            {isInterState ? (
              <div className="flex justify-between text-slate-600">
                <span>IGST (12%):</span>
                <span className="font-mono">₹{igst}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>CGST (6%):</span>
                  <span className="font-mono">₹{cgst}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>SGST (6%):</span>
                  <span className="font-mono">₹{sgst}</span>
                </div>
              </>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Shipping & Packaging:</span>
              <span className="font-mono font-bold text-emerald-700">
                {order.shipping === 0 ? 'FREE' : `₹${order.shipping}`}
              </span>
            </div>

            {order.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Promotional Discount:</span>
                <span className="font-mono">-₹{order.discount}</span>
              </div>
            )}

            <div className="flex justify-between pt-2 border-t-2 border-slate-900 text-base font-black text-slate-900">
              <span>Total Invoice Amount:</span>
              <span className="font-mono">₹{order.total}</span>
            </div>
          </div>
        </div>

        {/* Courier Package Slip (Bottom Tearable Slip) */}
        <div className="pt-6 border-t-2 border-dashed border-slate-300 space-y-3">
          <div className="flex items-center justify-between text-2xs uppercase tracking-wider font-extrabold text-slate-500">
            <span>✂ Courier Tamper-Proof Package Shipping Slip</span>
            <span>Sheikhpura Mill Hub</span>
          </div>

          <div className="p-4 rounded-2xl border-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-xs">
              <div className="font-extrabold text-slate-900 text-sm">DELIVERY TO: {address.name}</div>
              <div className="text-slate-600">{address.line1 || address.addressLine1}, {address.city}, {address.state} - {address.pincode}</div>
              <div className="font-bold text-slate-800">Phone: {address.phone}</div>
            </div>

            <div className="text-center sm:text-right font-mono space-y-1">
              <div className="text-xs uppercase font-extrabold tracking-widest text-slate-500">ORDER BARCODE</div>
              <div className="text-xl tracking-widest font-black text-slate-900 border px-3 py-1 bg-slate-50 rounded">
                *{order.order_no}*
              </div>
              <div className="text-3xs text-slate-500">{order.payment_method?.toUpperCase()} · ₹{order.total}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
