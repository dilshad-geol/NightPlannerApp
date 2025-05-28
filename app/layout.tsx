import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppHeader } from '@/components/layout/AppHeader'; // Import AppHeader
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Night Planner',
  description: 'Plan your day, the night before. Achieve more with focused planning.',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Apply dark class to html for theme consistency
    <html lang="en" className="dark">
      <body 
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          GeistSans.variable,
          GeistMono.variable
        )}
      >
        <AppHeader /> {/* Add AppHeader here to be on all pages */}
        <main className="container mx-auto px-4 py-8 md:px-6">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
