"use client";

import Link from "next/link";
import { Code2, Download } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { PrivacyBadge } from "@/components/privacy-badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function TopBar() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
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
      <Link href="/" className="flex items-center gap-2.5" aria-label="DevToolbox Home">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
          <Code2 className="h-4 w-4 text-background" aria-hidden="true" />
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
        <PrivacyBadge />
        <ThemeToggle />
      </div>
    </header>
  );
}
