"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Globe,
  BarChart2,
  Timer,
  Link2,
  XCircle,
  Layers,
  Cloud,
  Database,
  Scaling,
  Snail,
  ClockArrowDown,
} from "lucide-react";

import { getTypeFromMime, MimeTypeIcon } from "./mime-util";
import { Har, HarEntry } from "../har-types";

export function OverviewTab({ harData }: { harData: Har }) {
  if (!harData?.log?.entries) return null;
  const entries: HarEntry[] = harData.log.entries;

  const contentTypes: Record<string, number> = {};
  entries.forEach((entry: HarEntry) => {
    const type = getTypeFromMime(entry.response.content.mimeType || "");
    contentTypes[type] = (contentTypes[type] || 0) + 1;
  });

  // Status code breakdown
  const statusGroups = ["2xx", "3xx", "4xx", "5xx"];
  const statusCounts = statusGroups.map(
    (group) =>
      entries.filter((e: HarEntry) =>
        e.response.status.toString().startsWith(group[0])
      ).length
  );

  // Domain breakdown
  const domains = Array.from(
    new Set(
      entries.map((e: HarEntry) => {
        try {
          return new URL(e.request.url).hostname;
        } catch {
          return "";
        }
      })
    )
  ).filter(Boolean);

  // Largest resources
  const largest: HarEntry[] = [...entries]
    .sort(
      (a: HarEntry, b: HarEntry) =>
        (b.response.content.size || 0) - (a.response.content.size || 0)
    )
    .slice(0, 5);

  // Slowest resources
  const slowest: HarEntry[] = [...entries]
    .sort((a: HarEntry, b: HarEntry) => (b.time || 0) - (a.time || 0))
    .slice(0, 5);

  // Summary values
  const totalRequests = entries.length;
  const totalSize = entries.reduce(
    (sum: number, e: HarEntry) => sum + (e.response.content.size || 0),
    0
  );
  const totalTime = entries.reduce(
    (sum: number, e: HarEntry) => sum + (e.time || 0),
    0
  );
  const uniqueDomains = domains.length;
  const failedRequests = entries.filter(
    (e: HarEntry) => e.response.status >= 400
  ).length;

  // Calculate average Time To First Byte (TTFB)
  const totalTTFB = entries.reduce(
    (sum: number, e: HarEntry) => sum + (e.timings?.wait ?? 0),
    0
  );
  const avgTTFB = entries.length ? totalTTFB / entries.length : 0;

  // Helpers
  const formatSize = (bytes: number) =>
    bytes < 1024
      ? `${bytes} B`
      : bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(2)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  const formatTime = (ms: number) =>
    ms < 1000 ? `${ms.toFixed(0)} ms` : `${(ms / 1000).toFixed(2)} s`;

  return (
    <section
      aria-label="HAR Overview"
      role="region"
      tabIndex={-1}
      className="space-y-4"
    >
      {/* Summary Cards */}
      <div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
        aria-label="Summary metrics"
      >
        {[
          {
            icon: (
              <BarChart2 className="h-4 w-4 text-primary" aria-hidden="true" />
            ),
            label: "Requests",
            value: totalRequests,
            desc: "Total requests",
          },
          {
            icon: (
              <Database className="h-4 w-4 text-primary" aria-hidden="true" />
            ),
            label: "Size",
            value: formatSize(totalSize),
            desc: "Transferred",
          },
          {
            icon: <Timer className="h-4 w-4 text-primary" aria-hidden="true" />,
            label: "Load Time",
            value: formatTime(totalTime),
            desc: "Total duration",
          },
          {
            icon: (
              <ClockArrowDown
                className="h-4 w-4 text-primary"
                aria-hidden="true"
              />
            ),
            label: "Avg TTFB",
            value: formatTime(avgTTFB),
            desc: "Time to first byte",
          },
          {
            icon: <Globe className="h-4 w-4 text-primary" aria-hidden="true" />,
            label: "Domains",
            value: uniqueDomains,
            desc: "Unique domains",
          },
          {
            icon: <XCircle className="h-4 w-4 text-primary" aria-hidden="true" />,
            label: "Failed",
            value: failedRequests,
            desc: "4xx/5xx errors",
          },
        ].map((card) => (
          <Card
            key={card.label}
            className="border"
            aria-label={card.label}
            tabIndex={0}
            role="region"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {card.icon}
                <span className="text-xs font-medium text-muted-foreground">
                  {card.label}
                </span>
              </div>
              <div
                className="text-2xl font-bold"
                aria-live="polite"
              >
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Breakdown Cards */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        aria-label="Breakdown metrics"
      >
        {/* Content Types */}
        <Card
          className="border"
          aria-labelledby="content-types-title"
          tabIndex={0}
          role="region"
        >
          <CardHeader className="pb-3">
            <CardTitle
              id="content-types-title"
              className="flex items-center gap-2 text-base"
            >
              <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
              Content Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {Object.entries(contentTypes).map(([type, count]) => (
                <div key={type} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-1">
                      <MimeTypeIcon type={type} />
                      {type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {count}
                    </span>
                  </div>
                  <Progress
                    value={(count / entries.length) * 100}
                    className="h-1.5"
                    aria-label={`${type} requests progress`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Status Codes */}
        <Card
          className="border"
          aria-labelledby="status-codes-title"
          tabIndex={0}
          role="region"
        >
          <CardHeader className="pb-3">
            <CardTitle
              id="status-codes-title"
              className="flex items-center gap-2 text-base"
            >
              <BarChart2 className="h-4 w-4 text-primary" aria-hidden="true" />
              Status Codes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusGroups.map((group, i) => (
                <div key={group} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          group === "2xx"
                            ? "bg-green-500"
                            : group === "3xx"
                            ? "bg-blue-500"
                            : group === "4xx"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium">
                        {group}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {statusCounts[i]} ({((statusCounts[i] / entries.length) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <Progress
                    value={(statusCounts[i] / entries.length) * 100}
                    className="h-1.5"
                    aria-label={`${group} responses progress`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Domains */}
        <Card
          className="border"
          aria-labelledby="domains-title"
          tabIndex={0}
          role="region"
        >
          <CardHeader className="pb-3">
            <CardTitle id="domains-title" className="flex items-center gap-2 text-base">
              <Cloud className="h-4 w-4 text-primary" aria-hidden="true" />
              Domains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto overflow-x-auto pr-2">
              {domains.map((domain) => {
                const count = entries.filter((e: HarEntry) => {
                  try {
                    return new URL(e.request.url).hostname === domain;
                  } catch {
                    return false;
                  }
                }).length;
                return (
                  <div
                    key={domain}
                    className="flex items-center gap-2 text-sm"
                    title={domain}
                  >
                    <Link2
                      className="h-3 w-3 text-primary flex-shrink-0"
                      aria-hidden="true"
                    />
                    <a
                      href={`//${domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-blue-600 dark:text-blue-400 truncate flex-1 min-w-0"
                      aria-label={`Open domain ${domain} in new tab`}
                      tabIndex={0}
                    >
                      {domain}
                    </a>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Largest & Slowest */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        aria-label="Largest and slowest resources"
      >
        <Card
          className="border"
          aria-labelledby="largest-title"
          tabIndex={0}
          role="region"
        >
          <CardHeader className="pb-3">
            <CardTitle id="largest-title" className="flex items-center gap-2 text-base">
              <Scaling className="h-4 w-4 text-primary" aria-hidden="true" />
              Largest Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table aria-label="Largest resources table">
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead className="text-right w-24">Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {largest.map((entry: HarEntry, i: number) => (
                  <TableRow key={i}>
                    <TableCell
                      className="flex items-center gap-2 max-w-[500px]"
                      title={entry.request.url}
                    >
                      <MimeTypeIcon
                        type={getTypeFromMime(
                          entry.response.content.mimeType || ""
                        )}
                      />
                      <span className="truncate text-xs flex-1 min-w-0">
                        {entry.request.url}
                      </span>
                      <a
                        href={entry.request.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open resource ${entry.request.url} in new tab`}
                        tabIndex={0}
                      >
                        <Link2
                          className="h-3 w-3 text-blue-600 dark:text-blue-400 flex-shrink-0"
                          aria-hidden="true"
                        />
                      </a>
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {formatSize(entry.response.content.size || 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card
          className="border"
          aria-labelledby="slowest-title"
          tabIndex={0}
          role="region"
        >
          <CardHeader className="pb-3">
            <CardTitle id="slowest-title" className="flex items-center gap-2 text-base">
              <Snail className="h-4 w-4 text-primary" aria-hidden="true" />
              Slowest Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table aria-label="Slowest resources table">
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead className="text-right w-24">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slowest.map((entry: HarEntry, i: number) => (
                  <TableRow key={i}>
                    <TableCell
                      className="flex items-center gap-2 max-w-[500px]"
                      title={entry.request.url}
                    >
                      <MimeTypeIcon
                        type={getTypeFromMime(
                          entry.response.content.mimeType || ""
                        )}
                      />
                      <span className="truncate text-xs flex-1 min-w-0">
                        {entry.request.url}
                      </span>
                      <a
                        href={entry.request.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open resource ${entry.request.url} in new tab`}
                        tabIndex={0}
                      >
                        <Link2
                          className="h-3 w-3 text-blue-600 dark:text-blue-400 flex-shrink-0"
                          aria-hidden="true"
                        />
                      </a>
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {formatTime(entry.time)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
