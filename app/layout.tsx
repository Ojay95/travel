import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import PWARegistration from './PWARegistration';

export const metadata: Metadata = {
  title: 'Aventur — AI Vacation Concierge',
  description: 'Set your matching travel guidelines, search cheapest pricing structures, choose lodging tiers, and customized dynamic itineraries – fully stored details preserved offline in your customized journey journal.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body>
        <PWARegistration />
        {children}
      </body>
    </html>
  );
}
