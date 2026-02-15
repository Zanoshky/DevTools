'use client';

import { Shield, Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function PrivacyBadge() {
  const [networkCalls, setNetworkCalls] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const MAX_CALLS = 50; // Limit stored calls to prevent memory leak

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    const originalXHR = window.XMLHttpRequest.prototype.open;

    // Monitor fetch
    window.fetch = function (...args) {
      const url = args[0]?.toString() || '';
      if (!url.startsWith(window.location.origin) && !url.startsWith('/')) {
        setNetworkCalls((prev) => {
          const updated = [url, ...prev];
          return updated.slice(0, MAX_CALLS); // Keep only last 50 calls
        });
      }
      return originalFetch.apply(this, args);
    };

    // Monitor XHR
    const xhrOpen = function (
      this: XMLHttpRequest,
      method: string,
      url: string | URL,
      async: boolean = true,
      username?: string | null,
      password?: string | null
    ) {
      const urlStr = url.toString();
      if (!urlStr.startsWith(window.location.origin) && !urlStr.startsWith('/')) {
        setNetworkCalls((prev) => {
          const updated = [urlStr, ...prev];
          return updated.slice(0, MAX_CALLS); // Keep only last 50 calls
        });
      }
      return originalXHR.call(this, method, url, async, username, password);
    };
    window.XMLHttpRequest.prototype.open = xhrOpen as typeof originalXHR;

    setIsMonitoring(true);

    return () => {
      window.fetch = originalFetch;
      window.XMLHttpRequest.prototype.open = originalXHR;
    };
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-xs"
          aria-label="View privacy information"
        >
          <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="hidden sm:inline">100% Client-Side</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
            <h3 className="font-semibold" id="privacy-popover-title">Privacy Guarantee</h3>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5" />
              <span>All processing happens in your browser</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5" />
              <span>No data sent to external servers</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5" />
              <span>No analytics or tracking</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5" />
              <span>Works offline after first load</span>
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="text-xs font-medium mb-2">
              Network Monitor {isMonitoring && '(Active)'}
            </div>
            {networkCalls.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                <Check className="h-3 w-3" />
                No external requests detected
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                  <X className="h-3 w-3" />
                  External requests detected:
                </div>
                <div className="max-h-32 overflow-y-auto text-xs text-muted-foreground">
                  {networkCalls.map((call, i) => (
                    <div key={i} className="truncate">{call}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground border-t pt-2">
            Open DevTools → Network tab to verify yourself
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
