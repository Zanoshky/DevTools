'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, X } from 'lucide-react';

export function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Register service worker
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        setRegistration(reg);

        // Check for updates on load
        reg.update();

        // Check for updates every 60 seconds
        const interval = setInterval(() => {
          reg.update();
        }, 60000);

        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setShowPrompt(true);
            }
          });
        });

        return () => clearInterval(interval);
      })
      .catch((error) => {
        console.error('[PWA] Service worker registration failed:', error);
      });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        // Service worker updated successfully
      }
    });

    // Listen for controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }, []);

  const handleUpdate = () => {
    if (!registration || !registration.waiting) return;

    setIsUpdating(true);

    // Tell the waiting service worker to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <Card
      className="fixed bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-96 p-4 shadow-lg z-50 border-2 border-primary/20 bg-blue-50 dark:bg-blue-950/20"
      role="alertdialog"
      aria-label="Application update available"
      aria-describedby="pwa-update-description"
    >
      <div className="flex items-start gap-3">
        <RefreshCw className="h-5 w-5 text-primary mt-0.5" aria-hidden="true" />
        <div className="flex-1 space-y-2">
          <div className="font-semibold text-sm">Update Available</div>
          <div className="text-xs text-muted-foreground" id="pwa-update-description">
            A new version of DevToolbox is available. Update now to get the latest features and improvements.
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update Now'}
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleDismiss}
              disabled={isUpdating}
            >
              Later
            </Button>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={handleDismiss}
          disabled={isUpdating}
          aria-label="Dismiss update notification"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </Card>
  );
}
