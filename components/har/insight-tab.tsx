
import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Clock, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { Har, HarEntry } from "../har-types";
import { PerformanceScore } from "./performance-score";

// Insight type
type Insight = {
  type: "error" | "warning" | "info";
  score: number;
  title: string;
  description: string;
  details: string;
  affectedUrls: string[];
};

export function InsightsTab({ harData }: { harData: Har }) {
  const [performanceInsights, setPerformanceInsights] = useState<Insight[]>([]);

  // --- Improved performance insights function ---
  const generatePerformanceInsights = (data: Har) => {
    const entries: HarEntry[] = data.log.entries;
    const insights: Insight[] = [];

    // Thresholds
    const SLOW_REQUEST_THRESHOLD = 500; // ms
    const LARGE_RESOURCE_THRESHOLD = 1_000_000; // bytes
    const RENDER_BLOCKING_LIMIT = 5;
    const REDIRECT_CHAIN_LIMIT = 2;
    const UNCOMPRESSED_TYPES = [
      "text/html",
      "text/css",
      "application/javascript",
      "application/json",
    ];
    const DUPLICATE_REQUEST_LIMIT = 2;
    const LONG_CACHE_THRESHOLD = 60 * 60 * 24 * 30; // 30 days in seconds

    // Helper to extract response headers
    const getHeaderValue = (
      headers: { name: string; value: string }[],
      name: string
    ) => {
      const header = headers.find(
        (h) => h.name.toLowerCase() === name.toLowerCase()
      );
      return header ? header.value : null;
    };

    // 1. Slow Requests
    const slowRequests = entries.filter((e) => e.time > SLOW_REQUEST_THRESHOLD);
    if (slowRequests.length > 0) {
      insights.push({
        type: "warning",
        score: 2,
        title: "Slow Requests Detected",
        description: `${slowRequests.length} request(s) took more than ${SLOW_REQUEST_THRESHOLD}ms.`,
        details: `Long request durations can slow down initial load and user interactions. Investigate back-end performance, network latency, and payload size.`,
        affectedUrls: slowRequests.map((e) => e.request.url),
      });
    }

    // 2. Large Resources
    const largeResources = entries.filter(
      (e) =>
        e.response.content.size &&
        e.response.content.size > LARGE_RESOURCE_THRESHOLD
    );
    if (largeResources.length > 0) {
      insights.push({
        type: "error",
        score: 3,
        title: "Large Resource Files",
        description: `${largeResources.length} resource(s) exceed 1MB in size.`,
        details: `Optimize large files (e.g., images, fonts, videos) via compression, lazy-loading, or using modern formats like WebP or AVIF.`,
        affectedUrls: largeResources.map((e) => e.request.url),
      });
    }

    // 3. Missing Cache Headers
    const noCacheHeaders = entries.filter((e) => {
      const headers = e.response.headers as { name: string; value: string }[];
      return !headers.some((h) =>
        ["cache-control", "expires"].includes(h.name.toLowerCase())
      );
    });
    if (noCacheHeaders.length > 0) {
      insights.push({
        type: "info",
        score: 1,
        title: "Missing Cache Headers",
        description: `${noCacheHeaders.length} resource(s) lack cache-related headers.`,
        details: `Use 'Cache-Control' and 'Expires' headers to improve repeat load times and reduce bandwidth.`,
        affectedUrls: noCacheHeaders.map((e) => e.request.url),
      });
    }

    // 4. Render-Blocking Resources
    const renderBlocking = entries.filter((e) => {
      const url = e.request.url;
      const type = e.response.content.mimeType || "";
      return url.match(/\.(css|js)$/i) || /css|javascript/.test(type);
    });
    if (renderBlocking.length > RENDER_BLOCKING_LIMIT) {
      insights.push({
        type: "warning",
        score: 2,
        title: "Excessive Render-Blocking Resources",
        description: `${renderBlocking.length} resources may block rendering.`,
        details: `Consider inlining critical CSS and deferring non-critical JS using 'async' or 'defer'.`,
        affectedUrls: renderBlocking.map((e) => e.request.url),
      });
    }

    // 5. Too Many Requests
    if (entries.length > 100) {
      insights.push({
        type: "warning",
        score: 2,
        title: "High Number of Requests",
        description: `The page made ${entries.length} total HTTP requests.`,
        details: `Excessive requests increase page load time. Consider bundling assets, using HTTP/2 multiplexing, or lazy loading.`,
        affectedUrls: entries.slice(0, 5).map((e) => e.request.url),
      });
    }

    // 6. Redirect Chains
    const redirectChains = entries.filter(
      (e) =>
        // Specify type for response as { redirectURL?: string }
        (e.response as { redirectURL?: string }).redirectURL
    );
    if (redirectChains.length > REDIRECT_CHAIN_LIMIT) {
      insights.push({
        type: "info",
        score: 1,
        title: "Redirect Chains Detected",
        description: `${redirectChains.length} request(s) involve redirects.`,
        details: `Chained redirects delay page rendering. Consider reducing redirect depth and using direct links.`,
        affectedUrls: redirectChains.map((e) => e.request.url),
      });
    }

    // 7. HTTP/1.1 Usage
    const http1Requests = entries.filter(
      (e) =>
        // Specify type for entry as { _version?: string }
        (e as { _version?: string })._version &&
        (e as { _version?: string })._version!.includes("HTTP/1.1")
    );
    if (http1Requests.length > 0) {
      insights.push({
        type: "info",
        score: 1,
        title: "Legacy HTTP/1.1 Detected",
        description: `${http1Requests.length} request(s) used HTTP/1.1.`,
        details: `Consider upgrading to HTTP/2 or HTTP/3 to leverage multiplexing and improved performance.`,
        affectedUrls: http1Requests.map((e) => e.request.url),
      });
    }

    // 8. Uncompressed Text Resources
    const uncompressed = entries.filter((e) => {
      const type = (e.response.content.mimeType || "").split(";")[0];
      const encoding = getHeaderValue(
        e.response.headers as { name: string; value: string }[],
        "content-encoding"
      );
      return UNCOMPRESSED_TYPES.includes(type) && !encoding;
    });
    if (uncompressed.length > 0) {
      insights.push({
        type: "warning",
        score: 2,
        title: "Uncompressed Text Resources",
        description: `${uncompressed.length} text-based resources are not compressed.`,
        details: `Enable gzip, Brotli, or deflate compression for text-based assets to reduce transfer size.`,
        affectedUrls: uncompressed.map((e) => e.request.url),
      });
    }

    // 9. Duplicate Requests
    const urlCounts: Record<string, number> = {};
    entries.forEach((e) => {
      urlCounts[e.request.url] = (urlCounts[e.request.url] || 0) + 1;
    });
    const duplicateUrls = Object.entries(urlCounts)
      .filter(([, count]) => count > DUPLICATE_REQUEST_LIMIT)
      .map(([url]) => url);
    if (duplicateUrls.length > 0) {
      insights.push({
        type: "warning",
        score: 2,
        title: "Duplicate Requests Detected",
        description: `${duplicateUrls.length} resource(s) were requested multiple times.`,
        details: `Avoid requesting the same resource repeatedly. Use proper caching and deduplication strategies.`,
        affectedUrls: duplicateUrls,
      });
    }

    // 10. Short Cache Lifetimes
    const shortCache = entries.filter((e) => {
      const cacheControl = getHeaderValue(
        e.response.headers as { name: string; value: string }[],
        "cache-control"
      );
      if (!cacheControl) return false;
      const match = cacheControl.match(/max-age=(\d+)/);
      return match && parseInt(match[1]) < LONG_CACHE_THRESHOLD;
    });
    if (shortCache.length > 0) {
      insights.push({
        type: "info",
        score: 1,
        title: "Short Cache Lifetimes",
        description: `${shortCache.length} resource(s) have cache lifetimes shorter than 30 days.`,
        details: `Consider increasing cache duration for static assets to improve repeat load performance.`,
        affectedUrls: shortCache.map((e) => e.request.url),
      });
    }

    // 11. Large Images Not Optimized
    const largeImages = entries.filter((e) => {
      const type = e.response.content.mimeType || "";
      return (
        type.startsWith("image/") &&
        e.response.content.size &&
        e.response.content.size > 200 * 1024 // >200KB
      );
    });
    if (largeImages.length > 0) {
      insights.push({
        type: "info",
        score: 1,
        title: "Large Images Detected",
        description: `${largeImages.length} image(s) exceed 200KB.`,
        details: `Optimize images using modern formats (WebP, AVIF), compression, and responsive sizing.`,
        affectedUrls: largeImages.map((e) => e.request.url),
      });
    }

    // 12. Third-Party Requests
    const mainHost = (() => {
      try {
        return new URL(entries[0]?.request?.url).hostname;
      } catch {
        return null;
      }
    })();
    const thirdParty = entries.filter((e) => {
      try {
        return mainHost && new URL(e.request.url).hostname !== mainHost;
      } catch {
        return false;
      }
    });
    if (thirdParty.length > 0) {
      insights.push({
        type: "info",
        score: 1,
        title: "Third-Party Requests",
        description: `${thirdParty.length} request(s) are to third-party domains.`,
        details: `Third-party scripts and resources can impact performance and privacy. Audit and minimize where possible.`,
        affectedUrls: thirdParty.map((e) => e.request.url),
      });
    }

    // 13. Blocking Time (Wait > 200ms)
    const blocking = entries.filter(
      (e) =>
        typeof e.timings === "object" &&
        e.timings !== null &&
        "wait" in e.timings &&
        typeof (e.timings as { wait?: number }).wait === "number" &&
        (e.timings as { wait: number }).wait > 200
    );
    if (blocking.length > 0) {
      insights.push({
        type: "warning",
        score: 2,
        title: "High Server Wait Times",
        description: `${blocking.length} request(s) spent more than 200ms waiting for server response.`,
        details: `High server wait times (TTFB) can indicate backend or network bottlenecks. Investigate server performance.`,
        affectedUrls: blocking.map((e) => e.request.url),
      });
    }

    // 14. Non-HTTPS Requests
    const nonHttps = entries.filter(
      (e) => !e.request.url.startsWith("https://")
    );
    if (nonHttps.length > 0) {
      insights.push({
        type: "warning",
        score: 2,
        title: "Non-HTTPS Requests",
        description: `${nonHttps.length} request(s) are not using HTTPS.`,
        details: `All resources should be loaded over HTTPS to ensure security and privacy.`,
        affectedUrls: nonHttps.map((e) => e.request.url),
      });
    }

    // 15. Inefficient Font Delivery
    const fontRequests = entries.filter((e) =>
      (e.response.content.mimeType || "").includes("font")
    );
    const largeFonts = fontRequests.filter(
      (e) => e.response.content.size && e.response.content.size > 100 * 1024
    );
    if (largeFonts.length > 0) {
      insights.push({
        type: "info",
        score: 1,
        title: "Large Font Files",
        description: `${largeFonts.length} font file(s) exceed 100KB.`,
        details: `Optimize font files by subsetting and using modern formats like WOFF2.`,
        affectedUrls: largeFonts.map((e) => e.request.url),
      });
    }

    // 16. Many XHR/Fetch Requests
    const xhrRequests = entries.filter(
      (e) =>
        // Specify type for entry as { _resourceType?: string }
        (e as { _resourceType?: string })._resourceType &&
        ["xhr", "fetch"].includes(
          (e as { _resourceType?: string })._resourceType!
        )
    );
    if (xhrRequests.length > 20) {
      insights.push({
        type: "info",
        score: 1,
        title: "High Number of XHR/Fetch Requests",
        description: `${xhrRequests.length} XHR/fetch requests detected.`,
        details: `Batch API calls where possible and avoid excessive polling.`,
        affectedUrls: xhrRequests.map((e) => e.request.url),
      });
    }

    // 17. Inline Scripts Detected
    const inlineScripts = entries.filter(
      (e) =>
        (e as { _resourceType?: string })._resourceType === "script" &&
        !e.request.url.match(/\.(js|mjs)$/)
    );
    if (inlineScripts.length > 0) {
      insights.push({
        type: "info",
        score: 1,
        title: "Inline Scripts Detected",
        description: `${inlineScripts.length} script(s) are inline or data URLs.`,
        details: `Move inline scripts to external files for better caching and maintainability.`,
        affectedUrls: inlineScripts.map((e) => e.request.url),
      });
    }

    // Sort by score descending, then by type (error > warning > info)
    const typeOrder = { error: 3, warning: 2, info: 1 } as const;
    type InsightType = keyof typeof typeOrder;
    setPerformanceInsights(
      insights.sort((a, b) =>
        b.score !== a.score
          ? b.score - a.score
          : (typeOrder[b.type as InsightType] || 0) -
            (typeOrder[a.type as InsightType] || 0)
      )
    );
  };

  useEffect(() => {
    if (harData?.log?.entries) {
      generatePerformanceInsights(harData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [harData]);

  if (!harData?.log?.entries) return null;

  return (
    <section
      className="space-y-4"
      aria-label="Performance Insights"
      role="region"
      tabIndex={-1}
    >
      {/* Performance Score Component */}
      <PerformanceScore entries={harData.log.entries} />

      {/* Detailed Insights */}
      <Card aria-labelledby="insights-title" role="region" tabIndex={-1}>
        <CardHeader>
          <CardTitle id="insights-title" tabIndex={0}>
            Detailed Analysis
          </CardTitle>
          <CardDescription>
            In-depth analysis of potential performance issues and improvement
            opportunities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {performanceInsights.length > 0 ? (
            <ul className="space-y-6" aria-label="List of performance insights">
              {performanceInsights.map((insight, index) => (
                <li key={index}>
                  <Alert
                    variant="default"
                    className={
                      "pl-4 py-4 focus-within:ring-2 focus-within:ring-ring " +
                      (insight.type === "error"
                        ? "border-l-4 border-red-500"
                        : insight.type === "warning"
                        ? "border-l-4 border-yellow-500"
                        : "border-l-4 border-blue-500")
                    }
                    tabIndex={0}
                    aria-labelledby={`insight-title-${index}`}
                    aria-describedby={`insight-desc-${index}`}
                    role={insight.type === "error" ? "alert" : "status"}
                  >
                    <div className="flex items-start gap-4">
                      <div className="pt-1" aria-hidden="true">
                        <AlertCircle
                          className={
                            insight.type === "error"
                              ? "text-red-500"
                              : insight.type === "warning"
                              ? "text-yellow-500"
                              : "text-blue-500"
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <AlertTitle
                          id={`insight-title-${index}`}
                          className="flex items-center gap-2 text-base font-semibold"
                        >
                          {insight.title}
                          <span
                            className={
                              insight.type === "error"
                                ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                                : insight.type === "warning"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            }
                            style={{
                              fontSize: "0.75rem",
                              borderRadius: "0.25rem",
                              padding: "0.1rem 0.5rem",
                              fontWeight: 500,
                            }}
                            aria-label={insight.type}
                          >
                            {insight.type.toUpperCase()}
                          </span>
                        </AlertTitle>
                        <AlertDescription id={`insight-desc-${index}`}>
                          <div className="mb-2 text-sm">
                            {insight.description}
                          </div>
                          <div className="mb-2 text-xs text-muted-foreground">
                            {insight.details}
                          </div>
                          {insight.affectedUrls &&
                            insight.affectedUrls.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium mb-1 text-muted-foreground">
                                  Affected resources:
                                </p>
                                <div className="max-h-40 overflow-auto rounded border bg-muted p-2">
                                  <ul
                                    className="list-disc pl-5 text-xs space-y-1 min-w-0"
                                    aria-label="Affected URLs"
                                  >
                                    {insight.affectedUrls.map(
                                      (url: string, i: number) => (
                                        <li key={i} className="break-all">
                                          <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:underline text-blue-600 dark:text-blue-400"
                                            style={{ wordBreak: "break-all" }}
                                            tabIndex={0}
                                            aria-label={`Open resource ${url} in new tab`}
                                          >
                                            {url}
                                          </a>
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              </div>
                            )}
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                </li>
              ))}
            </ul>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-8 text-center"
              role="status"
              aria-live="polite"
            >
              <Clock
                className="h-12 w-12 text-muted-foreground mb-4"
                aria-hidden="true"
              />
              <h3 className="text-lg font-medium" tabIndex={0}>
                No insights available
              </h3>
              <p className="text-muted-foreground mt-2">
                We couldn&apos;t generate any performance insights from this HAR
                file.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => generatePerformanceInsights(harData)}
                aria-label="Regenerate Insights"
              >
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                Regenerate Insights
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
