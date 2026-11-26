import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/cart-context';
import { StorefrontNavbar } from '@/components/storefront/navbar';
import { StorefrontFooter } from '@/components/storefront/footer';

export const metadata: Metadata = {
  title: 'TOLAND | Premium Denim Jeans & Casual Outfits',
  description: 'TOLAND — Manufacturer and wholesale retailer of premium denim jeans and casual outfits. Sheikhpura, Bihar.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-text flex flex-col">
        <CartProvider>
          <StorefrontNavbar />
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <StorefrontFooter />
        </CartProvider>
      </body>
    </html>
  );
}
