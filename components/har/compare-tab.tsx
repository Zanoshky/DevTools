
import { useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRightLeft,
  FilePlus,
  FileMinus,
  FileText,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { HarRequestDetailsCard } from "./har-request-details-card";
import type { Har, HarEntry } from "@/components/har-types";

// --- Types for diff ---
type DiffStatus = "added" | "removed";
type DiffItem = { status: DiffStatus; url: string };

export function CompareTab({
  harData,
  compareHar,
  setCompareHar,
}: {
  harData: Har;
  compareHar: Har | null;
  setCompareHar: (d: Har | null) => void;
}) {
  const compareFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDiff, setSelectedDiff] = useState<DiffItem | null>(null);

  function getHarDiff(harA: Har, harB: Har): DiffItem[] {
    if (!harA?.log?.entries || !harB?.log?.entries) return [];
    const urlsA = new Set(harA.log.entries.map((e: HarEntry) => e.request.url));
    const urlsB = new Set(harB.log.entries.map((e: HarEntry) => e.request.url));
    const added = [...urlsB]
      .filter((url) => !urlsA.has(url))
      .map((url) => ({ status: "added" as DiffStatus, url }));
    const removed = [...urlsA]
      .filter((url) => !urlsB.has(url))
      .map((url) => ({ status: "removed" as DiffStatus, url }));
    return [...added, ...removed];
  }

  function findEntryByUrl(har: Har, url: string): HarEntry | undefined {
    return har?.log?.entries?.find((e: HarEntry) => e.request.url === url);
  }

  // --- UI ---
  return (
    <section
      className="space-y-6"
      aria-label="Compare HAR files"
      role="region"
      tabIndex={-1}
    >
      {/* Upload and file info section */}
      <div
        className="w-full flex flex-col gap-3"
        aria-label="Upload HAR to compare"
      >
        <div className="flex w-full max-w-xl mx-auto">
          <Button
            variant="outline"
            className="flex-1 flex items-center justify-center gap-2 rounded-r-none"
            onClick={() =>
              compareFileInputRef.current?.focus() ||
              compareFileInputRef.current?.click()
            }
            aria-label="Upload HAR to Compare"
            type="button"
          >
            <UploadCloud className="h-4 w-4" aria-hidden="true" />
            Upload HAR to Compare
          </Button>
          <input
            ref={compareFileInputRef}
            type="file"
            accept=".har,application/json"
            className="hidden"
            aria-label="Select HAR file to compare"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                try {
                  const content = JSON.parse(ev.target?.result as string);
                  setCompareHar(content);
                } catch {
                  alert("Could not parse the comparison HAR file.");
                }
              };
              reader.readAsText(file);
            }}
          />
        </div>
        <div className="flex flex-col gap-2 w-full max-w-xl mx-auto">
          <div
            className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 rounded px-3 py-1"
            aria-label="Current HAR file"
          >
            <FileText className="h-4 w-4 text-green-600" aria-hidden="true" />
            <span className="font-semibold">Initial</span>
            <span className="font-mono truncate max-w-[360px]">
              {harData.log?.pages?.[0]?.title || "HAR"}
            </span>
          </div>
          {compareHar && (
            <div
              className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 rounded px-3 py-1"
              aria-label="Compared HAR file"
            >
              <FileText
                className="h-4 w-4 text-purple-600"
                aria-hidden="true"
              />
              <span className="font-semibold">Compared</span>
              <span className="font-mono truncate max-w-[360px]">
                {compareHar.log?.pages?.[0]?.title || "HAR"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-red-600"
                onClick={() => {
                  setCompareHar(null);
                  if (compareFileInputRef.current) {
                    compareFileInputRef.current.value = ""; // <-- Reset file input
                  }
                }}
                title="Remove compared HAR"
                aria-label="Remove compared HAR"
                type="button"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Remove compared HAR</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Summary and Diff Cards */}
      {compareHar && (
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          aria-label="Comparison summary and differences"
        >
          {/* Summary Card */}
          <SummaryCard harData={harData} compareHar={compareHar} />

          {/* Differences Card */}
          <DifferencesCard
            harData={harData}
            compareHar={compareHar}
            getHarDiff={getHarDiff}
            setSelectedDiff={setSelectedDiff}
            selectedDiff={selectedDiff}
          />
        </div>
      )}

      {/* Request Details Card */}
      {selectedDiff &&
        (() => {
          const entry =
            selectedDiff.status === "added"
              ? findEntryByUrl(compareHar!, selectedDiff.url)
              : findEntryByUrl(harData, selectedDiff.url);
          if (!entry) return null;
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
              role="dialog"
              aria-modal="true"
              aria-label="Request details"
            >
              <div className="bg-background rounded shadow-lg max-w-2xl w-full mx-2 outline-none relative">
                <button
                  className="absolute top-2 right-2 p-1 rounded hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Close request details"
                  onClick={() => setSelectedDiff(null)}
                  autoFocus
                  type="button"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
                <HarRequestDetailsCard selected={entry} />
              </div>
            </div>
          );
        })()}
    </section>
  );
}

// --- Summary Card ---
function SummaryCard({
  harData,
  compareHar,
}: {
  harData: Har;
  compareHar: Har;
}) {
  const formatSize = (bytes: number) =>
    bytes < 1024
      ? `${bytes} B`
      : bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(2)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  const formatTime = (ms: number) =>
    ms < 1000 ? `${ms.toFixed(0)} ms` : `${(ms / 1000).toFixed(2)} s`;

  return (
    <Card className="shadow-sm border" aria-label="Summary of HAR comparison">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-blue-600" aria-hidden="true" />
          Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold w-1/3">Metric</TableHead>
              <TableHead className="font-semibold text-right w-1/3">
                <div className="flex items-center justify-end gap-1">
                  <FileText
                    className="h-4 w-4 text-green-600"
                    aria-hidden="true"
                  />
                  <span className="hidden sm:inline">Current</span>
                </div>
              </TableHead>
              <TableHead className="font-semibold text-right w-1/3">
                <div className="flex items-center justify-end gap-1">
                  <FileText
                    className="h-4 w-4 text-purple-600"
                    aria-hidden="true"
                  />
                  <span className="hidden sm:inline">Compared</span>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <TableRow>
              <TableCell className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <FileText
                    className="h-4 w-4 text-blue-500"
                    aria-hidden="true"
                  />
                  Total Requests
                </span>
                <span className="text-xs text-muted-foreground">
                  All network requests
                </span>
              </TableCell>
              <TableCell className="text-right align-top">
                {harData.log.entries.length}
              </TableCell>
              <TableCell className="text-right align-top">
                {compareHar.log.entries.length}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <FileText
                    className="h-4 w-4 text-emerald-500"
                    aria-hidden="true"
                  />
                  Total Size
                </span>
                <span className="text-xs text-muted-foreground">
                  Transferred over network
                </span>
              </TableCell>
              <TableCell className="text-right align-top">
                {formatSize(
                  harData.log.entries.reduce(
                    (a: number, e: HarEntry) =>
                      a + (e.response.content.size || 0),
                    0
                  )
                )}
              </TableCell>
              <TableCell className="text-right align-top">
                {formatSize(
                  compareHar.log.entries.reduce(
                    (a: number, e: HarEntry) =>
                      a + (e.response.content.size || 0),
                    0
                  )
                )}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <FileText
                    className="h-4 w-4 text-orange-500"
                    aria-hidden="true"
                  />
                  Page Load Time
                </span>
                <span className="text-xs text-muted-foreground">
                  Total loading duration
                </span>
              </TableCell>
              <TableCell className="text-right align-top">
                {formatTime(
                  harData.log.entries.reduce(
                    (a: number, e: HarEntry) => a + (e.time || 0),
                    0
                  )
                )}
              </TableCell>
              <TableCell className="text-right align-top">
                {formatTime(
                  compareHar.log.entries.reduce(
                    (a: number, e: HarEntry) => a + (e.time || 0),
                    0
                  )
                )}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <FileText
                    className="h-4 w-4 text-yellow-500"
                    aria-hidden="true"
                  />
                  Avg TTFB
                </span>
                <span className="text-xs text-muted-foreground">
                  Avg. time to first byte
                </span>
              </TableCell>
              <TableCell className="text-right align-top">
                {formatTime(
                  harData.log.entries.reduce(
                    (a: number, e: HarEntry) => a + (e.timings?.wait || 0),
                    0
                  ) / Math.max(1, harData.log.entries.length)
                )}
              </TableCell>
              <TableCell className="text-right align-top">
                {formatTime(
                  compareHar.log.entries.reduce(
                    (a: number, e: HarEntry) => a + (e.timings?.wait || 0),
                    0
                  ) / Math.max(1, compareHar.log.entries.length)
                )}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <FileText
                    className="h-4 w-4 text-cyan-500"
                    aria-hidden="true"
                  />
                  Unique Domains
                </span>
                <span className="text-xs text-muted-foreground">
                  Domains contacted
                </span>
              </TableCell>
              <TableCell className="text-right align-top">
                {
                  new Set(
                    harData.log.entries.map((e: HarEntry) => {
                      try {
                        return new URL(e.request.url).hostname;
                      } catch {
                        return "";
                      }
                    })
                  ).size
                }
              </TableCell>
              <TableCell className="text-right align-top">
                {
                  new Set(
                    compareHar.log.entries.map((e: HarEntry) => {
                      try {
                        return new URL(e.request.url).hostname;
                      } catch {
                        return "";
                      }
                    })
                  ).size
                }
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <FileText
                    className="h-4 w-4 text-red-500"
                    aria-hidden="true"
                  />
                  Failed Requests
                </span>
                <span className="text-xs text-muted-foreground">
                  Status 4xx
                </span>
              </TableCell>
              <TableCell className="text-right align-top">
                {
                  harData.log.entries.filter(
                    (e: HarEntry) =>
                      e.response.status >= 400 && e.response.status < 500
                  ).length
                }
              </TableCell>
              <TableCell className="text-right align-top">
                {
                  compareHar.log.entries.filter(
                    (e: HarEntry) =>
                      e.response.status >= 400 && e.response.status < 500
                  ).length
                }
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// --- Differences Card ---
function DifferencesCard({
  harData,
  compareHar,
  getHarDiff,
  setSelectedDiff,
  selectedDiff,
}: {
  harData: Har;
  compareHar: Har;
  getHarDiff: (a: Har, b: Har) => DiffItem[];
  setSelectedDiff: (d: DiffItem) => void;
  selectedDiff: DiffItem | null;
}) {
  const diffs = getHarDiff(harData, compareHar);

  return (
    <Card className="shadow-sm border" aria-label="Request differences">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowRightLeft
            className="h-4 w-4 text-blue-600"
            aria-hidden="true"
          />
          Request Differences
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[510px]">
          <Table aria-label="Request differences table">
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>URL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {diffs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="text-center text-muted-foreground py-8"
                  >
                    No differences found between the HAR files.
                  </TableCell>
                </TableRow>
              ) : (
                diffs.map((diff, i) => (
                  <TableRow
                    key={i}
                    className={`cursor-pointer ${
                      selectedDiff?.url === diff.url ? "bg-muted" : ""
                    }`}
                    onClick={() => setSelectedDiff(diff)}
                    tabIndex={0}
                    aria-label={`Show details for ${diff.status} request ${diff.url}`}
                    aria-selected={selectedDiff?.url === diff.url}
                    role="row"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        setSelectedDiff(diff);
                    }}
                  >
                    <TableCell>
                      <Badge
                        className={`flex items-center gap-1 ${
                          diff.status === "added"
                            ? "bg-green-500"
                            : diff.status === "removed"
                            ? "bg-red-500"
                            : "bg-gray-500"
                        }`}
                        aria-label={
                          diff.status === "added" ? "Added" : "Removed"
                        }
                      >
                        {diff.status === "added" ? (
                          <FilePlus className="h-3 w-3" aria-hidden="true" />
                        ) : diff.status === "removed" ? (
                          <FileMinus className="h-3 w-3" aria-hidden="true" />
                        ) : null}
                        {diff.status.charAt(0).toUpperCase() +
                          diff.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="break-all text-xs">
                      {String(diff.url)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
