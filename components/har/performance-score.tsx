
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Gauge,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { HarEntry } from "@/components/har-types";

interface PerformanceMetrics {
  score: number;
  grade: string;
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  tti: number | null; // Time to Interactive
  totalTime: number;
  totalSize: number;
  requestCount: number;
}

interface PerformanceScoreProps {
  entries: HarEntry[];
}

export function PerformanceScore({ entries }: PerformanceScoreProps) {
  const metrics = calculateMetrics(entries);
  const bottlenecks = detectBottlenecks(entries);
  const suggestions = generateSuggestions(entries);

  return (
    <div className="space-y-4">
      {/* Performance Score Card */}
      <Card className="border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="h-4 w-4 text-primary" />
            Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center">
              <div
                className={`text-5xl font-bold ${getScoreColor(metrics.score)}`}
              >
                {metrics.score}
              </div>
              <Badge
                className={`mt-2 ${getGradeBadgeColor(metrics.grade)}`}
              >
                Grade {metrics.grade}
              </Badge>
            </div>
            <div className="flex-1 space-y-3">
              <MetricBar
                label="Load Time"
                value={metrics.totalTime}
                max={10000}
                format={(v) => `${(v / 1000).toFixed(2)}s`}
                threshold={3000}
              />
              <MetricBar
                label="Total Size"
                value={metrics.totalSize}
                max={5 * 1024 * 1024}
                format={(v) =>
                  v < 1024 * 1024
                    ? `${(v / 1024).toFixed(0)} KB`
                    : `${(v / (1024 * 1024)).toFixed(2)} MB`
                }
                threshold={2 * 1024 * 1024}
              />
              <MetricBar
                label="Requests"
                value={metrics.requestCount}
                max={200}
                format={(v) => `${v}`}
                threshold={100}
              />
            </div>
          </div>

          {/* Core Web Vitals */}
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-semibold mb-3">Estimated Metrics</h4>
            <div className="grid grid-cols-3 gap-3">
              <MetricCard
                label="FCP"
                value={metrics.fcp}
                threshold={1800}
                goodThreshold={1000}
              />
              <MetricCard
                label="LCP"
                value={metrics.lcp}
                threshold={2500}
                goodThreshold={1500}
              />
              <MetricCard
                label="TTI"
                value={metrics.tti}
                threshold={3800}
                goodThreshold={2000}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottlenecks Card */}
      {bottlenecks.length > 0 && (
        <Card className="border border-orange-200 dark:border-orange-900">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Bottlenecks Detected ({bottlenecks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bottlenecks.slice(0, 5).map((bottleneck, idx) => (
                <Alert
                  key={idx}
                  className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-900"
                >
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold">{bottleneck.type}:</span>{" "}
                        <span className="truncate">{bottleneck.description}</span>
                      </div>
                      <Badge variant="outline" className="ml-2 flex-shrink-0">
                        {bottleneck.impact}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
              {bottlenecks.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{bottlenecks.length - 5} more bottlenecks
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimization Suggestions */}
      {suggestions.length > 0 && (
        <Card className="border border-blue-200 dark:border-blue-900">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-blue-500" />
              Optimization Suggestions ({suggestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestions.map((suggestion, idx) => (
                <Alert
                  key={idx}
                  className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900"
                >
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-semibold mb-1">{suggestion.title}</div>
                        <div className="text-muted-foreground">
                          {suggestion.description}
                        </div>
                        {suggestion.savings && (
                          <div className="mt-1 text-green-600 dark:text-green-400 font-medium">
                            Potential savings: {suggestion.savings}
                          </div>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={`flex-shrink-0 ${
                          suggestion.priority === "high"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            : suggestion.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        }`}
                      >
                        {suggestion.priority}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricBar({
  label,
  value,
  max,
  format,
  threshold,
}: {
  label: string;
  value: number;
  max: number;
  format: (v: number) => string;
  threshold: number;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  const isGood = value < threshold;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{format(value)}</span>
      </div>
      <Progress
        value={percentage}
        className={`h-2 ${
          isGood
            ? "[&>div]:bg-green-500"
            : percentage > 75
            ? "[&>div]:bg-red-500"
            : "[&>div]:bg-yellow-500"
        }`}
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  threshold,
  goodThreshold,
}: {
  label: string;
  value: number | null;
  threshold: number;
  goodThreshold: number;
}) {
  if (value === null) {
    return (
      <div className="p-3 border rounded-lg bg-muted/30">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <div className="text-sm font-semibold">N/A</div>
      </div>
    );
  }

  const isGood = value < goodThreshold;
  const isOk = value < threshold;

  return (
    <div className="p-3 border rounded-lg">
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        {isGood ? (
          <CheckCircle2 className="h-3 w-3 text-green-500" />
        ) : isOk ? (
          <AlertTriangle className="h-3 w-3 text-yellow-500" />
        ) : (
          <XCircle className="h-3 w-3 text-red-500" />
        )}
      </div>
      <div
        className={`text-lg font-bold ${
          isGood
            ? "text-green-600 dark:text-green-400"
            : isOk
            ? "text-yellow-600 dark:text-yellow-400"
            : "text-red-600 dark:text-red-400"
        }`}
      >
        {(value / 1000).toFixed(2)}s
      </div>
    </div>
  );
}

function calculateMetrics(entries: HarEntry[]): PerformanceMetrics {
  const totalTime = entries.reduce((sum, e) => sum + (e.time || 0), 0);
  const totalSize = entries.reduce(
    (sum, e) => sum + (e.response.content.size || 0),
    0
  );
  const requestCount = entries.length;

  // Estimate FCP (first HTML + first CSS/JS)
  const sortedByTime = [...entries].sort(
    (a, b) =>
      new Date(a.startedDateTime).getTime() -
      new Date(b.startedDateTime).getTime()
  );
  const htmlDoc = sortedByTime.find((e) =>
    e.response.content.mimeType?.includes("html")
  );
  const firstCSS = sortedByTime.find((e) =>
    e.response.content.mimeType?.includes("css")
  );
  const fcp = htmlDoc && firstCSS ? htmlDoc.time + firstCSS.time : null;

  // Estimate LCP (largest image or largest resource)
  const largestResource = [...entries].sort(
    (a, b) => (b.response.content.size || 0) - (a.response.content.size || 0)
  )[0];
  const lcp = largestResource
    ? new Date(largestResource.startedDateTime).getTime() -
      new Date(entries[0].startedDateTime).getTime() +
      largestResource.time
    : null;

  // Estimate TTI (when most resources are loaded)
  const tti = totalTime * 0.8; // Rough estimate

  // Calculate score (0-100)
  let score = 100;
  if (totalTime > 10000) score -= 30;
  else if (totalTime > 5000) score -= 20;
  else if (totalTime > 3000) score -= 10;

  if (totalSize > 5 * 1024 * 1024) score -= 20;
  else if (totalSize > 2 * 1024 * 1024) score -= 10;

  if (requestCount > 200) score -= 15;
  else if (requestCount > 100) score -= 10;
  else if (requestCount > 50) score -= 5;

  score = Math.max(0, Math.min(100, score));

  const grade =
    score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";

  return {
    score,
    grade,
    fcp,
    lcp,
    tti,
    totalTime,
    totalSize,
    requestCount,
  };
}

function detectBottlenecks(entries: HarEntry[]) {
  const bottlenecks: Array<{
    type: string;
    description: string;
    impact: string;
  }> = [];

  // Render-blocking resources
  const renderBlocking = entries.filter(
    (e) =>
      (e.response.content.mimeType?.includes("css") ||
        e.response.content.mimeType?.includes("javascript")) &&
      e.time > 500
  );
  if (renderBlocking.length > 0) {
    bottlenecks.push({
      type: "Render Blocking",
      description: `${renderBlocking.length} CSS/JS files blocking render`,
      impact: "High",
    });
  }

  // Long-running requests
  const slowRequests = entries.filter((e) => e.time > 3000);
  slowRequests.forEach((e) => {
    const url = new URL(e.request.url);
    bottlenecks.push({
      type: "Slow Request",
      description: `${url.pathname} took ${(e.time / 1000).toFixed(2)}s`,
      impact: "High",
    });
  });

  // Large uncompressed resources
  const largeResources = entries.filter(
    (e) =>
      (e.response.content.size || 0) > 500 * 1024 &&
      !e.response.headers.some(
        (h) =>
          h.name.toLowerCase() === "content-encoding" &&
          (h.value.includes("gzip") || h.value.includes("br"))
      )
  );
  largeResources.forEach((e) => {
    const url = new URL(e.request.url);
    bottlenecks.push({
      type: "Large Uncompressed",
      description: `${url.pathname} is ${(
        (e.response.content.size || 0) /
        1024 /
        1024
      ).toFixed(2)} MB uncompressed`,
      impact: "Medium",
    });
  });

  // Missing cache headers
  const noCacheHeaders = entries.filter(
    (e) =>
      !e.response.headers.some(
        (h) =>
          h.name.toLowerCase() === "cache-control" ||
          h.name.toLowerCase() === "expires"
      ) &&
      !e.response.content.mimeType?.includes("html")
  );
  if (noCacheHeaders.length > 10) {
    bottlenecks.push({
      type: "Missing Cache Headers",
      description: `${noCacheHeaders.length} resources without cache headers`,
      impact: "Medium",
    });
  }

  // Too many requests
  if (entries.length > 100) {
    bottlenecks.push({
      type: "Too Many Requests",
      description: `${entries.length} total requests (consider bundling)`,
      impact: entries.length > 200 ? "High" : "Medium",
    });
  }

  return bottlenecks;
}

function generateSuggestions(
  entries: HarEntry[]
) {
  const suggestions: Array<{
    title: string;
    description: string;
    savings?: string;
    priority: "high" | "medium" | "low";
  }> = [];

  // Image optimization
  const images = entries.filter((e) =>
    e.response.content.mimeType?.includes("image")
  );
  const largeImages = images.filter((e) => (e.response.content.size || 0) > 100 * 1024);
  if (largeImages.length > 0) {
    const totalImageSize = largeImages.reduce(
      (sum, e) => sum + (e.response.content.size || 0),
      0
    );
    suggestions.push({
      title: "Optimize Images",
      description: `${largeImages.length} images could be compressed or converted to modern formats (WebP, AVIF)`,
      savings: `~${((totalImageSize * 0.5) / 1024 / 1024).toFixed(2)} MB`,
      priority: "high",
    });
  }

  // Enable compression
  const uncompressed = entries.filter(
    (e) =>
      (e.response.content.size || 0) > 10 * 1024 &&
      !e.response.headers.some(
        (h) =>
          h.name.toLowerCase() === "content-encoding" &&
          (h.value.includes("gzip") || h.value.includes("br"))
      )
  );
  if (uncompressed.length > 0) {
    const totalUncompressed = uncompressed.reduce(
      (sum, e) => sum + (e.response.content.size || 0),
      0
    );
    suggestions.push({
      title: "Enable Compression",
      description: `Enable gzip or brotli compression for ${uncompressed.length} text-based resources`,
      savings: `~${((totalUncompressed * 0.7) / 1024 / 1024).toFixed(2)} MB`,
      priority: "high",
    });
  }

  // Reduce JavaScript
  const jsFiles = entries.filter((e) =>
    e.response.content.mimeType?.includes("javascript")
  );
  const totalJsSize = jsFiles.reduce(
    (sum, e) => sum + (e.response.content.size || 0),
    0
  );
  if (totalJsSize > 1024 * 1024) {
    suggestions.push({
      title: "Reduce JavaScript Bundle Size",
      description: `${(totalJsSize / 1024 / 1024).toFixed(
        2
      )} MB of JavaScript. Consider code splitting and tree shaking`,
      priority: "high",
    });
  }

  // Lazy loading
  if (images.length > 20) {
    suggestions.push({
      title: "Implement Lazy Loading",
      description: `${images.length} images detected. Lazy load below-the-fold images`,
      priority: "medium",
    });
  }

  // Cache optimization
  const noCacheHeaders = entries.filter(
    (e) =>
      !e.response.headers.some(
        (h) =>
          h.name.toLowerCase() === "cache-control" ||
          h.name.toLowerCase() === "expires"
      ) &&
      !e.response.content.mimeType?.includes("html")
  );
  if (noCacheHeaders.length > 10) {
    suggestions.push({
      title: "Add Cache Headers",
      description: `${noCacheHeaders.length} static resources missing cache headers`,
      priority: "medium",
    });
  }

  // CDN usage
  const domains = new Set(
    entries.map((e) => {
      try {
        return new URL(e.request.url).hostname;
      } catch {
        return "";
      }
    })
  );
  if (domains.size > 10) {
    suggestions.push({
      title: "Consider Using a CDN",
      description: `Resources loaded from ${domains.size} different domains. A CDN could improve load times`,
      priority: "low",
    });
  }

  // HTTP/2
  const http1Requests = entries.filter(
    (e) => e.response.httpVersion === "HTTP/1.1" || e.response.httpVersion === "HTTP/1.0"
  );
  if (http1Requests.length > entries.length * 0.5) {
    suggestions.push({
      title: "Upgrade to HTTP/2",
      description: `${http1Requests.length} requests using HTTP/1.x. HTTP/2 provides better performance`,
      priority: "medium",
    });
  }

  return suggestions;
}

function getScoreColor(score: number): string {
  if (score >= 90) return "text-green-600 dark:text-green-400";
  if (score >= 80) return "text-blue-600 dark:text-blue-400";
  if (score >= 70) return "text-yellow-600 dark:text-yellow-400";
  if (score >= 60) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

function getGradeBadgeColor(grade: string): string {
  if (grade === "A") return "bg-green-500 text-white";
  if (grade === "B") return "bg-blue-500 text-white";
  if (grade === "C") return "bg-yellow-500 text-white";
  if (grade === "D") return "bg-orange-500 text-white";
  return "bg-red-500 text-white";
}
