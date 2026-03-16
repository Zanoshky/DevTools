import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const LAST_PAGE_KEY = "dev-toolbox-last-page";
const HOME_PAGE = "/";

export function LastPageTracker() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hasCheckedRestore, setHasCheckedRestore] = useState(false);
  const isUserNavigationRef = useRef(false);

  // Save current page to localStorage whenever it changes (but never save home page)
  useEffect(() => {
    if (pathname && pathname !== HOME_PAGE && typeof window !== "undefined" && !isRedirecting) {
      localStorage.setItem(LAST_PAGE_KEY, pathname);
    }
    
    // Clear the last page when user intentionally navigates to home page
    if (pathname === HOME_PAGE && typeof window !== "undefined" && isUserNavigationRef.current) {
      localStorage.removeItem(LAST_PAGE_KEY);
    }
    
    // Mark that user has navigated after initial mount
    if (hasCheckedRestore) {
      isUserNavigationRef.current = true;
    }
  }, [pathname, isRedirecting, hasCheckedRestore]);

  // On mount, check and redirect to last page
  useEffect(() => {
    if (typeof window === "undefined" || hasCheckedRestore) return;

    // Only redirect if currently on home page and there's a saved last page
    if (pathname === HOME_PAGE) {
      const lastPage = localStorage.getItem(LAST_PAGE_KEY);
      
      if (lastPage && lastPage !== HOME_PAGE && lastPage.startsWith("/tools/")) {
        setIsRedirecting(true);
        setHasCheckedRestore(true);
        
        // Small delay to ensure smooth transition
        setTimeout(() => {
          navigate(lastPage, { replace: true });
          setTimeout(() => setIsRedirecting(false), 500);
        }, 100);
      } else {
        setHasCheckedRestore(true);
      }
    } else {
      setHasCheckedRestore(true);
    }
  }, [pathname, navigate, hasCheckedRestore]);

  // Show loading indicator while redirecting
  if (isRedirecting) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        role="status"
        aria-label="Restoring last visited page"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Restoring last page...</p>
        </div>
      </div>
    );
  }

  return null;
}
