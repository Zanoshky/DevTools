import { Link } from "react-router-dom";
import { Download, Coffee, Shield } from "lucide-react";
import { AppearancePanel } from "@/components/appearance-panel";

import { NetworkIndicator } from "@/components/network-indicator";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function TopBar() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Check if already installed as standalone/PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstallable(false);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const onInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', onInstalled);

    // Also listen for display-mode changes (e.g. user installs then returns to browser tab)
    const mql = window.matchMedia('(display-mode: standalone)');
    const onDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    };
    mql.addEventListener('change', onDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onInstalled);
      mql.removeEventListener('change', onDisplayModeChange);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    
    setDeferredPrompt(null);
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background/80 backdrop-blur-md px-4 lg:px-6">
      <Link to="/" className="flex items-center gap-2.5" aria-label="DevToolbox Home">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <span className="font-mono text-xs font-bold text-primary-foreground" aria-hidden="true">&lt;/&gt;</span>
        </div>
        <span className="font-semibold text-sm tracking-tight">DevToolbox</span>
      </Link>
      <div className="flex items-center gap-2">
        {isInstallable && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleInstall}
            className="gap-2 text-xs"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Install App</span>
          </Button>
        )}
        <Link to="/privacy">
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Privacy policy">
            <Shield className="h-4 w-4" />
          </Button>
        </Link>
        <a href="https://www.buymeacoffee.com/zanoshky" target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Buy me a coffee">
            <Coffee className="h-4 w-4" />
          </Button>
        </a>

        <AppearancePanel />
        <NetworkIndicator />
      </div>
    </header>
  );
}
