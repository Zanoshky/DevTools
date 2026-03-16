import { Routes, Route, Link, useLocation } from "react-router-dom";
import { TopBar } from "@/components/top-bar";

import { QuickAccessBar } from "@/components/quick-access-bar";
import { ToolTracker } from "@/components/tool-tracker";
import { LastPageTracker } from "@/components/last-page-tracker";
import { PWAUpdatePrompt } from "@/components/pwa-update-prompt";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/toaster";
import { ToolPageWrapper } from "@/components/tool-page-wrapper";
import { toolMetadataMap } from "@/lib/tool-metadata";
import { lazy, Suspense, useEffect, useRef } from "react";

// Lazy load pages
const HomePage = lazy(() => import("@/app/page"));
const PrivacyPage = lazy(() => import("@/app/privacy/page"));
const BlogPage = lazy(() => import("@/app/blog/page"));

// Tool pages
const toolPages: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  "base64": lazy(() => import("@/app/tools/base64/page")),
  "casing-converter": lazy(() => import("@/app/tools/casing-converter/page")),
  "color-hex-converter": lazy(() => import("@/app/tools/color-hex-converter/page")),
  "color-palette-generator": lazy(() => import("@/app/tools/color-palette-generator/page")),
  "color-scheme-designer": lazy(() => import("@/app/tools/color-scheme-designer/page")),
  "cron-builder": lazy(() => import("@/app/tools/cron-builder/page")),
  "curl-hurl-converter": lazy(() => import("@/app/tools/curl-hurl-converter/page")),
  "data-converter": lazy(() => import("@/app/tools/data-converter/page")),
  "data-visualizer": lazy(() => import("@/app/tools/data-visualizer/page")),
  "har-analyzer": lazy(() => import("@/app/tools/har-analyzer/page")),
  "hash": lazy(() => import("@/app/tools/hash/page")),
  "json-compare": lazy(() => import("@/app/tools/json-compare/page")),
  "json-editor": lazy(() => import("@/app/tools/json-editor/page")),
  "json-to-code": lazy(() => import("@/app/tools/json-to-code/page")),
  "key-generator": lazy(() => import("@/app/tools/key-generator/page")),
  "json-to-openapi": lazy(() => import("@/app/tools/json-to-openapi/page")),
  "jwt": lazy(() => import("@/app/tools/jwt/page")),
  "otp-generator": lazy(() => import("@/app/tools/otp-generator/page")),
  "password-generator": lazy(() => import("@/app/tools/password-generator/page")),
  "payload-calculator": lazy(() => import("@/app/tools/payload-calculator/page")),
  "random-data-generator": lazy(() => import("@/app/tools/random-data-generator/page")),
  "regex-validator": lazy(() => import("@/app/tools/regex-validator/page")),
  "text-sorter": lazy(() => import("@/app/tools/text-sorter/page")),
  "timer": lazy(() => import("@/app/tools/timer/page")),
  "timestamp-converter": lazy(() => import("@/app/tools/timestamp-converter/page")),
  "timestamp-mongo": lazy(() => import("@/app/tools/timestamp-mongo/page")),
  "url-encoder": lazy(() => import("@/app/tools/url-encoder/page")),
  "uuid": lazy(() => import("@/app/tools/uuid/page")),
  "validator-json": lazy(() => import("@/app/tools/validator-json/page")),
};

function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center" role="status" aria-label="Loading page">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" aria-hidden="true" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

function ToolRoute({ slug }: { slug: string }) {
  const PageComponent = toolPages[slug];
  const metadata = toolMetadataMap[slug];
  if (!PageComponent) return null;
  return metadata ? (
    <ToolPageWrapper metadata={metadata}>
      <PageComponent />
    </ToolPageWrapper>
  ) : (
    <PageComponent />
  );
}

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
      <p className="text-lg text-muted-foreground mb-6">Page not found</p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Back to Tools
      </Link>
    </div>
  );
}

export default function App() {
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
    // Fallback for lazy-loaded components that render after initial scroll
    const t = setTimeout(() => {
      mainRef.current?.scrollTo(0, 0);
      window.scrollTo(0, 0);
    }, 50);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <>
      <ToolTracker />
      <LastPageTracker />
      <PWAUpdatePrompt />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Skip to main content
      </a>
      <div className="flex min-h-dvh flex-col">
        <TopBar />
        <QuickAccessBar />
        <div className="flex flex-1 overflow-hidden">
          <main ref={mainRef} id="main-content" className="flex-1 overflow-y-auto overflow-x-hidden" tabIndex={-1}>
            <ErrorBoundary>
              <Suspense fallback={<Loading />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  {Object.keys(toolPages).map((slug) => (
                    <Route key={slug} path={`/tools/${slug}`} element={<ToolRoute slug={slug} />} />
                  ))}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>

      </div>
      <Toaster />
    </>
  );
}
