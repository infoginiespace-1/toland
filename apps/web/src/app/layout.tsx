import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CartProvider } from '@/context/cart-context';
import { WishlistProvider } from '@/context/wishlist-context';
import { CompareProvider } from '@/context/compare-context';
import { StorefrontNavbar } from '@/components/storefront/navbar';
import { StorefrontFooter } from '@/components/storefront/footer';
import { RecentPurchaseToast } from '@/components/storefront/recent-purchase-toast';
import { FloatingWhatsAppConcierge } from '@/components/storefront/floating-whatsapp-concierge';
import { DenimCompareModal } from '@/components/storefront/denim-compare-modal';

export const viewport: Viewport = {
  themeColor: '#14532D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'TOLAND | Premium Denim Jeans & Casual Outfits',
  description: 'TOLAND — Manufacturer and wholesale retailer of premium denim jeans and casual outfits. Sheikhpura, Bihar.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TOLAND',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-text flex flex-col w-full max-w-full overflow-x-clip">
        <CartProvider>
          <WishlistProvider>
            <CompareProvider>
              <StorefrontNavbar />
              <div className="flex-1 flex flex-col pb-24 md:pb-0 w-full max-w-full min-w-0">
                {children}
              </div>
              <StorefrontFooter />
              <RecentPurchaseToast />
              <FloatingWhatsAppConcierge />
              <DenimCompareModal />
            </CompareProvider>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
