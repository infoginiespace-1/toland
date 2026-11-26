import Link from 'next/link';
import { Truck, Clock, ShieldCheck, MapPin, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Shipping & Delivery Policy | TOLAND Denim',
  description: 'Pan-India shipping details, delivery timelines, and courier partners from TOLAND manufacturing unit.',
};

export default function ShippingPolicyPage() {
  return (
    <div className="bg-[#F0F7F2] min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center text-xs text-muted font-medium mb-6 space-x-2">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-primary font-semibold">Shipping Policy</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-2xl p-8 border border-[#CFE0D5] shadow-sm mb-8">
          <div className="flex items-center gap-3 text-primary font-semibold text-sm mb-2">
            <Truck className="w-5 h-5" />
            <span>DIRECT FACTORY DISPATCH</span>
          </div>
          <h1 className="text-3xl font-extrabold text-text font-serif tracking-tight mb-4">
            Shipping & Delivery Policy
          </h1>
          <p className="text-muted text-sm leading-relaxed">
            Every piece of TOLAND denim is cut, stitched, finished, and inspected directly at our manufacturing facility in Khetalpura, Barbigha (Sheikhpura, Bihar - 811101) before dispatch. We ship PAN-India with zero middlemen.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl border border-[#CFE0D5]">
            <Clock className="w-6 h-6 text-accent mb-3" />
            <h3 className="font-bold text-text mb-1">24–48 Hours Dispatch</h3>
            <p className="text-xs text-muted leading-relaxed">
              In-stock denim orders are packaged in factory poly-covers and handed to express couriers within 1–2 business days.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-[#CFE0D5]">
            <ShieldCheck className="w-6 h-6 text-accent mb-3" />
            <h3 className="font-bold text-text mb-1">Free Shipping Above ₹999</h3>
            <p className="text-xs text-muted leading-relaxed">
              Standard flat delivery of ₹80 applies to orders below ₹999. All prepaid & COD orders above ₹999 ship 100% free.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-[#CFE0D5]">
            <MapPin className="w-6 h-6 text-accent mb-3" />
            <h3 className="font-bold text-text mb-1">26,000+ Pincodes</h3>
            <p className="text-xs text-muted leading-relaxed">
              Serviced by tier-1 logistics partners including Bluedart, Delhivery, DTDC, and Xpressbees across all Indian states.
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-2xl p-8 border border-[#CFE0D5] shadow-sm space-y-8 text-sm text-text">
          <section>
            <h2 className="text-lg font-bold text-primary mb-3">1. Estimated Delivery Timelines</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#CFE0D5] bg-[#F0F7F2] text-primary">
                    <th className="py-2.5 px-3 font-semibold">Region / State</th>
                    <th className="py-2.5 px-3 font-semibold">Estimated Days</th>
                    <th className="py-2.5 px-3 font-semibold">Logistics Partner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CFE0D5]">
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Bihar, Jharkhand & West Bengal</td>
                    <td className="py-2.5 px-3 text-muted">2 – 3 Business Days</td>
                    <td className="py-2.5 px-3 text-muted">Delhivery / Bluedart Surface</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Metro Cities (Delhi NCR, Mumbai, Bengaluru, Kolkata)</td>
                    <td className="py-2.5 px-3 text-muted">3 – 5 Business Days</td>
                    <td className="py-2.5 px-3 text-muted">Bluedart Air / Delhivery Express</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Rest of India (Tier 2 & 3 Cities)</td>
                    <td className="py-2.5 px-3 text-muted">4 – 6 Business Days</td>
                    <td className="py-2.5 px-3 text-muted">Delhivery / DTDC Express</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">North-East, Jammu & Kashmir, Remote Pincodes</td>
                    <td className="py-2.5 px-3 text-muted">6 – 8 Business Days</td>
                    <td className="py-2.5 px-3 text-muted">India Post Speed Post / DTDC</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-3">2. Order Tracking via WhatsApp & SMS</h2>
            <p className="text-muted leading-relaxed mb-3">
              As soon as your package is scanned at our Sheikhpura factory dispatch hub, an automated WhatsApp notification is pushed to your registered mobile number containing:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted">
              <li>Assigned courier partner name and live Air Waybill (AWB) number</li>
              <li>Real-time trackable tracking URL link</li>
              <li>Estimated doorstep delivery date</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-3">3. Cash on Delivery (COD) Verification</h2>
            <p className="text-muted leading-relaxed">
              To prevent fraudulent bookings, high-value COD orders (above ₹2,500) or orders to high-RTO pincodes may receive an instant 1-tap WhatsApp confirmation prompt before dispatch. Unconfirmed COD orders are kept on hold for 48 hours before auto-cancellation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-primary mb-3">4. B2B Wholesale / Bulk Freight Shipments</h2>
            <p className="text-muted leading-relaxed">
              Wholesale and bulk production orders (50+ units) are packed in heavy-duty woven corrugated bales or wooden pallets and routed through dedicated surface transport (V-Trans, TCI Freight, Safexpress, or client-specified transport from Patna / Barbigha transport yards). Freight charges and e-way bill details are shared directly on WhatsApp.
            </p>
          </section>

          {/* Help Banner */}
          <div className="bg-[#E3EFE7] p-5 rounded-xl flex items-center justify-between flex-wrap gap-4 border border-[#CFE0D5]">
            <div>
              <p className="font-bold text-primary text-sm">Need urgent delivery assistance?</p>
              <p className="text-xs text-muted">Our dispatch team is available Monday to Saturday, 9:00 AM – 7:00 PM IST.</p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-[#0F3F22] transition-colors"
            >
              Contact Dispatch Desk
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
