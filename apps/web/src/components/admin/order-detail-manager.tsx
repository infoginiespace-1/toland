'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Send,
  Loader2,
  FileText,
  Printer,
  Shield,
  Layers,
} from 'lucide-react';

interface OrderDetailManagerProps {
  order: any;
}

export function OrderDetailManager({ order }: OrderDetailManagerProps) {
  const router = useRouter();
  const address = order.address_snapshot || {};
  const items = order.order_items || [];
  const history = order.history || [];
  const shipment = order.shipments?.[0] || null;

  // Status Form State
  const [currentStatus, setCurrentStatus] = useState(order.status || 'confirmed');
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status || 'pending');
  const [note, setNote] = useState('');
  const [courier, setCourier] = useState(shipment?.courier || 'Delhivery Express');
  const [awb, setAwb] = useState(shipment?.awb || '');
  const [trackingUrl, setTrackingUrl] = useState(shipment?.tracking_url || '');
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setUpdating(true);

    try {
      const payload = {
        status: currentStatus,
        payment_status: paymentStatus,
        note,
        notify_whatsapp: notifyWhatsApp,
        courier: currentStatus === 'shipped' ? courier : undefined,
        awb: currentStatus === 'shipped' ? awb : undefined,
        tracking_url: currentStatus === 'shipped' ? trackingUrl : undefined,
      };

      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update order status');
      }

      setFeedback({
        type: 'success',
        msg: `Order status updated to ${currentStatus.toUpperCase()}! ${notifyWhatsApp ? 'WhatsApp alert dispatched.' : ''}`,
      });
      setNote('');
      router.refresh();
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Server error' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CFE0D5]">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 rounded-xl bg-white border border-[#CFE0D5] text-muted hover:text-text hover:border-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-text tracking-tight font-mono">
                {order.order_no}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-3xs font-bold uppercase bg-primary text-white">
                {order.status}
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Placed on {new Date(order.created_at).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInvoiceOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#CFE0D5] text-text text-xs font-bold hover:border-primary hover:text-primary transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>GST Tax Invoice</span>
          </button>
          <Link
            href={`/orders/${order.order_no}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E3EFE7] text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Storefront View</span>
          </Link>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-success/15 border border-success/30 text-success'
              : 'bg-danger/10 border border-danger/30 text-danger'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2 Cols): Line Items & Customer Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Table Card */}
          <div className="bg-white rounded-2xl border border-[#CFE0D5] p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-[#CFE0D5] pb-2">
              Purchased Garments ({items.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#CFE0D5] bg-[#F0F7F2] text-primary font-bold text-3xs uppercase">
                    <th className="py-2.5 px-3">Item Details</th>
                    <th className="py-2.5 px-3">Size & Fit</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CFE0D5]">
                  {items.map((item: any, idx: number) => {
                    const variant = item.variant || {};
                    const product = variant.product || {};

                    return (
                      <tr key={idx} className="hover:bg-[#F0F7F2]/40">
                        <td className="py-3 px-3">
                          <span className="font-bold text-text block">
                            {product.name || 'Denim Apparel'}
                          </span>
                          <span className="text-3xs font-mono text-muted">
                            SKU: {variant.sku || 'N/A'}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-[#F0F7F2] border border-[#CFE0D5] font-mono font-bold text-3xs">
                            Waist: {variant.size || '32'}
                          </span>
                          <span className="text-3xs text-muted block mt-0.5">
                            {variant.fit} • {variant.wash}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-bold">
                          x{item.qty || 1}
                        </td>

                        <td className="py-3 px-3 font-mono text-muted">
                          ₹{item.price}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-black text-text">
                          ₹{(item.price || 0) * (item.qty || 1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Breakdown */}
            <div className="pt-4 border-t border-[#CFE0D5] flex flex-col items-end space-y-1.5 text-xs">
              <div className="flex justify-between w-64 text-muted">
                <span>Subtotal:</span>
                <span className="font-mono text-text font-bold">₹{order.subtotal}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between w-64 text-accent font-bold">
                  <span>Coupon Discount:</span>
                  <span className="font-mono">- ₹{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between w-64 text-muted">
                <span>GST Tax (Included):</span>
                <span className="font-mono text-text">₹{order.tax || 0}</span>
              </div>
              <div className="flex justify-between w-64 text-muted">
                <span>Shipping Delivery:</span>
                <span className="font-mono text-text">
                  {order.shipping > 0 ? `₹${order.shipping}` : 'FREE'}
                </span>
              </div>
              <div className="flex justify-between w-64 pt-2 border-t border-[#CFE0D5] text-sm font-black text-primary">
                <span>Total Amount:</span>
                <span className="font-mono">₹{order.total}</span>
              </div>
            </div>
          </div>

          {/* Customer & Shipping Card */}
          <div className="bg-white rounded-2xl border border-[#CFE0D5] p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-[#CFE0D5] pb-2">
              Customer & Delivery Destination
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-2">
                <span className="text-3xs font-mono font-bold uppercase tracking-wider text-muted block">
                  Delivery Address
                </span>
                <p className="font-bold text-text text-sm">{address.name}</p>
                <div className="text-muted leading-relaxed">
                  <p>{address.line1}</p>
                  {address.line2 && <p>{address.line2}</p>}
                  <p>
                    {address.city}, {address.state} - <span className="font-mono font-bold text-text">{address.pincode}</span>
                  </p>
                  <p>{address.country || 'India'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-3xs font-mono font-bold uppercase tracking-wider text-muted block">
                    Contact Channels
                  </span>
                  <div className="flex items-center gap-2 text-text font-mono font-bold mt-1">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    <span>{address.phone}</span>
                  </div>
                  {address.email && (
                    <div className="flex items-center gap-2 text-muted font-mono mt-1">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{address.email}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#CFE0D5]">
                  <span className="text-3xs font-mono font-bold uppercase tracking-wider text-muted block">
                    Payment Gateway Details
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded font-mono font-bold uppercase text-3xs bg-[#E3EFE7] text-primary">
                      {order.payment_method?.toUpperCase()}
                    </span>
                    <span className="font-semibold text-text capitalize">
                      Status: {order.payment_status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Status Updater & Order Journey */}
        <div className="space-y-6">
          {/* Status & WhatsApp Trigger Form Card */}
          <div className="bg-white rounded-2xl border border-[#CFE0D5] p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-[#CFE0D5] pb-2">
              Update Fulfillment Status
            </h2>

            <form onSubmit={handleStatusUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                  Fulfillment Stage *
                </label>
                <select
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-text font-bold focus:outline-none focus:border-primary"
                >
                  <option value="placed">Placed (Received)</option>
                  <option value="confirmed">Confirmed (Factory Queued)</option>
                  <option value="packed">Packed (Factory Poly-wrap)</option>
                  <option value="shipped">Dispatched (Handed to Courier)</option>
                  <option value="delivered">Delivered (Completed)</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-text font-medium focus:outline-none focus:border-primary"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid (Collected)</option>
                  <option value="refunded">Refunded</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {currentStatus === 'shipped' && (
                <div className="p-3 rounded-xl bg-[#F0F7F2] border border-[#CFE0D5] space-y-3">
                  <span className="text-3xs font-bold uppercase text-primary block">
                    Courier Logistics Details
                  </span>
                  <div>
                    <label className="block text-3xs font-bold text-text mb-1">
                      Courier Partner
                    </label>
                    <input
                      type="text"
                      value={courier}
                      onChange={(e) => setCourier(e.target.value)}
                      placeholder="Delhivery / Bluedart / DTDC"
                      className="w-full px-3 py-1.5 rounded-lg border border-[#CFE0D5] bg-white text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-bold text-text mb-1">
                      Air Waybill (AWB) #
                    </label>
                    <input
                      type="text"
                      value={awb}
                      onChange={(e) => setAwb(e.target.value)}
                      placeholder="e.g. 129481920491"
                      className="w-full px-3 py-1.5 rounded-lg border border-[#CFE0D5] bg-white text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-text mb-1 uppercase tracking-wider">
                  Internal Factory Note
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Inspected by Masterji Ramesh in Sheikhpura..."
                  className="w-full px-3 py-2 rounded-xl border border-[#CFE0D5] bg-[#F0F7F2]/50 text-text text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <label className="flex items-center gap-2 p-3 rounded-xl bg-[#E3EFE7] border border-[#CFE0D5] cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyWhatsApp}
                  onChange={(e) => setNotifyWhatsApp(e.target.checked)}
                  className="w-4 h-4 text-primary rounded accent-primary"
                />
                <div>
                  <span className="font-bold text-primary block text-xs">
                    Dispatch WhatsApp Notification
                  </span>
                  <span className="text-3xs text-muted block">
                    Sends automated template alert to customer
                  </span>
                </div>
              </label>

              <button
                type="submit"
                disabled={updating}
                className="w-full py-2.5 rounded-xl bg-primary text-white font-black uppercase tracking-wider text-xs hover:bg-primary-hover shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {updating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Update Status</span>
              </button>
            </form>
          </div>

          {/* Fulfillment Journey Timeline Card */}
          <div className="bg-white rounded-2xl border border-[#CFE0D5] p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-[#CFE0D5] pb-2">
              Status History Logs
            </h2>

            <div className="space-y-4 text-xs">
              {history.length > 0 ? (
                history.map((h: any, idx: number) => (
                  <div key={idx} className="flex gap-3 relative pb-3 last:pb-0">
                    <div className="w-6 h-6 rounded-full bg-[#E3EFE7] text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text uppercase">{h.status}</span>
                        <span className="text-3xs text-muted font-mono">
                          {new Date(h.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-3xs text-muted mt-0.5">{h.note || 'Status updated'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted text-xs">No status history logged yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Printable GST Tax Invoice Modal */}
      {invoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setInvoiceOpen(false)}
          />
          <div className="relative bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-[#CFE0D5] space-y-6 z-10 max-h-[90vh] overflow-y-auto">
            {/* Invoice Printable View */}
            <div className="flex items-center justify-between pb-4 border-b border-[#CFE0D5]">
              <div>
                <h2 className="text-xl font-black text-text font-serif">TAX INVOICE</h2>
                <p className="text-3xs font-mono text-muted">Original for Recipient</p>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-primary font-mono block">
                  {order.order_no}
                </span>
                <span className="text-3xs text-muted">
                  Date: {new Date(order.created_at).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>

            {/* Manufacturer & Buyer Details */}
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div className="p-3 rounded-xl bg-[#F0F7F2] border border-[#CFE0D5] space-y-1">
                <span className="text-3xs font-mono font-bold uppercase text-primary block">
                  Sold By (Manufacturer)
                </span>
                <p className="font-bold text-text">TOLAND Private Limited</p>
                <p className="text-muted">Khetalpura, Barbigha</p>
                <p className="text-muted">Sheikhpura, Bihar - 811101</p>
                <p className="text-3xs font-mono text-text">GSTIN: 10AABCT1234F1Z8</p>
              </div>

              <div className="p-3 rounded-xl bg-[#F0F7F2] border border-[#CFE0D5] space-y-1">
                <span className="text-3xs font-mono font-bold uppercase text-primary block">
                  Billing & Delivery To
                </span>
                <p className="font-bold text-text">{address.name}</p>
                <p className="text-muted">{address.line1}</p>
                <p className="text-muted">
                  {address.city}, {address.state} - {address.pincode}
                </p>
                <p className="text-3xs font-mono text-text">Phone: {address.phone}</p>
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#CFE0D5] bg-[#F0F7F2] text-primary font-bold text-3xs uppercase">
                  <th className="py-2 px-3">Item Description</th>
                  <th className="py-2 px-3">HSN</th>
                  <th className="py-2 px-3 text-center">Qty</th>
                  <th className="py-2 px-3">Rate</th>
                  <th className="py-2 px-3 text-right">Taxable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CFE0D5]">
                {items.map((i: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3">
                      <span className="font-bold">{i.variant?.product?.name || 'Denim Jeans'}</span>
                      <span className="text-3xs text-muted block">Size: {i.variant?.size}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-muted">620342</td>
                    <td className="py-2.5 px-3 text-center font-mono">x{i.qty}</td>
                    <td className="py-2.5 px-3 font-mono">₹{i.price}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      ₹{i.price * i.qty}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total */}
            <div className="pt-3 border-t border-[#CFE0D5] flex justify-between items-center text-sm font-black text-primary">
              <span>Grand Total (INR):</span>
              <span className="font-mono text-lg">₹{order.total}</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#CFE0D5]">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
              <button
                type="button"
                onClick={() => setInvoiceOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#CFE0D5] text-xs font-bold text-muted hover:text-text"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
