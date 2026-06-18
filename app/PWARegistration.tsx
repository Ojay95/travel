'use client';

import { useEffect } from 'react';
import { syncPlans } from '@/src/lib/syncService';

export default function PWARegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Register PWA Service Worker
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
              console.log('[PWA] ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch((err) => {
              console.error('[PWA] ServiceWorker registration failed: ', err);
            });
        });
      }

      // 2. Perform initial background sync of local changes
      syncPlans().catch(console.error);
    }
  }, []);

  return null;
}
