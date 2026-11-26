import type { Metadata } from 'next';
import './globals.css';

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
        {children}
      </body>
    </html>
  );
}
