"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Link2,
  Timer,
  BarChart2,
  Database,
  Layers,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "../ui/button";
import {
  getTypeColor,
  getTypeFromMime,
  MIME_TYPES,
  MimeTypeIcon,
} from "./mime-util";
import { HarRequestDetailsCard } from "./har-request-details-card";
import { Har, HarEntry } from "../har-types";

export function RequestsTab({
  harData,
  selectedRequest,
  setSelectedRequest,
}: {
  harData: Har;
  selectedRequest: HarEntry | null;
  setSelectedRequest: (r: HarEntry | null) => void;
}) {
  const [search, setSearch] = useState<string>("");
  const [sort, setSort] = useState<
    "type" | "url" | "timestamp" | "method" | "status" | "size" | "duration"
  >("url");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDomain, setFilterDomain] = useState<string>("all");
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [filterDuration, setFilterDuration] = useState<string>("all");

  if (!harData?.log?.entries) return null;
  const allEntries: HarEntry[] = harData.log.entries;

  // Collect all methods and domains for dropdowns
  const allMethods: string[] = Array.from(
    new Set(allEntries.map((e: HarEntry) => e.request.method))
  );
  const allDomains: string[] = Array.from(
    new Set(
      allEntries
        .map((e: HarEntry) => {
          try {
            return new URL(e.request.url).hostname;
          } catch {
            return "";
          }
        })
        .filter(Boolean)
    )
  );

  function resetFiltersAndSort() {
    setSearch("");
    setSort("url");
    setDir("asc");
    setFilterStatus("all");
    setFilterType("all");
    setFilterDomain("all");
    setFilterMethod("all");
    setFilterDuration("all");
  }

  const entries: HarEntry[] = allEntries
    .filter((e: HarEntry) => {
      // Search
      if (search && !e.request.url.toLowerCase().includes(search.toLowerCase()))
        return false;
      // Status
      if (
        filterStatus !== "all" &&
        !e.response.status.toString().startsWith(filterStatus[0])
      )
        return false;
      // Type
      if (filterType !== "all") {
        const type = getTypeFromMime(e.response.content.mimeType || "");
        if (type !== filterType) return false;
      }
      // Domain
      if (filterDomain !== "all") {
        let domain = "";
        try {
          domain = new URL(e.request.url).hostname;
        } catch { }
        if (domain !== filterDomain) return false;
      }
      // Method
      if (filterMethod !== "all" && e.request.method !== filterMethod)
        return false;
      // Duration
      if (filterDuration !== "all") {
        if (filterDuration === ">500" && e.time <= 500) return false;
        if (filterDuration === ">1000" && e.time <= 1000) return false;
      }
      return true;
    })
    .sort((a: HarEntry, b: HarEntry) => {
      let cmp = 0;
      if (sort === "type") {
        const getType = (entry: HarEntry) =>
          getTypeFromMime(entry.response.content.mimeType || "");
        cmp = getType(a).localeCompare(getType(b));
      }
      if (sort === "url") cmp = a.request.url.localeCompare(b.request.url);
      if (sort === "timestamp")
        cmp =
          new Date(a.startedDateTime).getTime() -
          new Date(b.startedDateTime).getTime();
      if (sort === "method")
        cmp = a.request.method.localeCompare(b.request.method);
      if (sort === "status") cmp = a.response.status - b.response.status;
      if (sort === "size")
        cmp = (a.response.content.size || 0) - (b.response.content.size || 0);
      if (sort === "duration") cmp = (a.time || 0) - (b.time || 0);
      return dir === "asc" ? cmp : -cmp;
    });

  const formatSize = (bytes: number) =>
    bytes < 1024
      ? `${bytes} B`
      : bytes < 1024 * 1024
        ? `${(bytes / 1024).toFixed(2)} KB`
        : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  const formatTime = (ms: number) =>
    ms < 1000 ? `${ms.toFixed(0)} ms` : `${(ms / 1000).toFixed(2)} s`;

  // Keyboard navigation for table rows
  function handleRowKeyDown(e: React.KeyboardEvent, entry: HarEntry) {
    if (e.key === "Enter" || e.key === " ") {
      setSelectedRequest(entry);
    }
  }

  // Helper for sortable header
  function SortableHeader({
    label,
    sortKey,
    icon,
    className = "",
    "aria-label": ariaLabel,
    align = "left",
  }: {
    label: string;
    sortKey: typeof sort;
    icon?: React.ReactNode;
    className?: string;
    "aria-label"?: string;
    align?: "left" | "right";
  }) {
    return (
      <TableHead
        className={`cursor-pointer select-none p-1 ${className} ${align === "right" ? "text-right" : ""
          }`}
        onClick={() => {
          setSort(sortKey);
          setDir(sort === sortKey && dir === "asc" ? "desc" : "asc");
        }}
        scope="col"
        tabIndex={0}
        aria-sort={
          sort === sortKey
            ? dir === "asc"
              ? "ascending"
              : "descending"
            : "none"
        }
        aria-label={ariaLabel || `Sort by ${label}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setSort(sortKey);
            setDir(sort === sortKey && dir === "asc" ? "desc" : "asc");
          }
        }}
      >
        <span className="inline-flex items-center gap-1">
          {icon}
          {label}
          {sort === sortKey &&
            (dir === "asc" ? (
              <ChevronDown className="inline h-3 w-3" aria-hidden="true" />
            ) : (
              <ChevronUp className="inline h-3 w-3" aria-hidden="true" />
            ))}
        </span>
      </TableHead>
    );
  }

  return (
    <section
      className="space-y-4"
      aria-label="HTTP Requests Table"
      role="region"
      tabIndex={-1}
    >
      <Card className="border">
        <CardContent className="pt-6">
          <form
            className="flex flex-wrap gap-2 items-center mb-4"
            aria-label="Request filters"
            role="search"
            onSubmit={(e) => e.preventDefault()}
          >
            <label htmlFor="har-search" className="sr-only">
              Search URLs
            </label>
            <Input
              id="har-search"
              placeholder="Search URLs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
              aria-label="Search URLs"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[120px]" aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="2xx">2xx</SelectItem>
                <SelectItem value="3xx">3xx</SelectItem>
                <SelectItem value="4xx">4xx</SelectItem>
                <SelectItem value="5xx">5xx</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[130px]" aria-label="Filter by type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {MIME_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    <span className="flex items-center gap-2">
                      <MimeTypeIcon type={type} />
                      {type}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterDomain} onValueChange={setFilterDomain}>
              <SelectTrigger className="w-[180px]" aria-label="Filter by domain">
                <SelectValue placeholder="Domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                {allDomains.map((domain) => (
                  <SelectItem key={domain} value={domain}>
                    {domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterMethod} onValueChange={setFilterMethod}>
              <SelectTrigger className="w-[120px]" aria-label="Filter by method">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                {allMethods.map((m) => (
                  <SelectItem key={m as string} value={m as string}>
                    {m as string}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterDuration} onValueChange={setFilterDuration}>
              <SelectTrigger className="w-[120px]" aria-label="Filter by duration">
                <SelectValue placeholder="Duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value=">500">&gt; 500ms</SelectItem>
                <SelectItem value=">1000">&gt; 1s</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={resetFiltersAndSort}
              size="sm"
              aria-label="Reset filters and sorting"
              type="button"
            >
              Reset
            </Button>
          </form>
          <ScrollArea>
            <Table aria-label="Requests table">
              <TableHeader>
                <TableRow>
                  <SortableHeader
                    label=""
                    sortKey="type"
                    icon={
                      <FileText className="inline h-4 w-4" aria-hidden="true" />
                    }
                    className="w-[32px]"
                    aria-label="Sort by type"
                  />
                  <SortableHeader
                    label="URL"
                    sortKey="url"
                    icon={
                      <Link2 className="inline h-4 w-4" aria-hidden="true" />
                    }
                  />
                  <SortableHeader
                    label="Time"
                    sortKey="timestamp"
                    icon={
                      <Timer className="inline h-4 w-4" aria-hidden="true" />
                    }
                    className="w-[110px] text-right"
                    align="right"
                  />
                  <SortableHeader
                    label="Type"
                    sortKey="type"
                    icon={
                      <Layers className="inline h-4 w-4" aria-hidden="true" />
                    }
                    className="w-[80px]"
                  />
                  <SortableHeader
                    label="Method"
                    sortKey="method"
                    icon={
                      <BarChart2
                        className="inline h-4 w-4"
                        aria-hidden="true"
                      />
                    }
                    className="w-[60px]"
                  />
                  <SortableHeader
                    label="Status"
                    sortKey="status"
                    icon={
                      <Database className="inline h-4 w-4" aria-hidden="true" />
                    }
                    className="w-[60px]"
                  />
                  <SortableHeader
                    label="Size"
                    sortKey="size"
                    icon={
                      <Database className="inline h-4 w-4" aria-hidden="true" />
                    }
                    className="w-[80px] text-right"
                    align="right"
                  />
                  <SortableHeader
                    label="Duration"
                    sortKey="duration"
                    icon={
                      <Timer className="inline h-4 w-4" aria-hidden="true" />
                    }
                    className="w-[80px] text-right"
                    align="right"
                  />
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No requests match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry: HarEntry, i: number) => {
                    const mime = entry.response.content.mimeType || "";
                    const type = getTypeFromMime(mime);
                    const typeColor = getTypeColor(type);
                    const methodColor =
                      entry.request.method === "GET"
                        ? "bg-blue-500"
                        : entry.request.method === "POST"
                          ? "bg-green-500"
                          : entry.request.method === "PUT"
                            ? "bg-yellow-500"
                            : entry.request.method === "DELETE"
                              ? "bg-red-500"
                              : entry.request.method === "OPTIONS"
                                ? "bg-purple-500"
                                : entry.request.method === "HEAD"
                                  ? "bg-gray-500"
                                  : "bg-gray-300";

                    // Format timestamp as HH:mm:ss.SSS
                    const ts = new Date(entry.startedDateTime);
                    const pad = (n: number, l = 2) =>
                      n.toString().padStart(l, "0");
                    const timestamp = `${pad(ts.getHours())}:${pad(
                      ts.getMinutes()
                    )}:${pad(ts.getSeconds())}.${pad(ts.getMilliseconds(), 3)}`;

                    return (
                      <TableRow
                        key={i}
                        className={`cursor-pointer hover:bg-muted/50 text-xs ${selectedRequest === entry ? "ring-2 ring-primary" : ""
                          }`}
                        onClick={() => setSelectedRequest(entry)}
                        onKeyDown={(e) => handleRowKeyDown(e, entry)}
                        style={{ height: 28 }}
                        tabIndex={0}
                        aria-label={`Request to ${entry.request.url} with status ${entry.response.status}`}
                        aria-selected={selectedRequest === entry}
                        role="row"
                      >
                        <TableCell className="p-1 w-[32px]">
                          <MimeTypeIcon type={type} />
                        </TableCell>
                        <TableCell
                          className="p-1 truncate max-w-[320px]"
                          title={entry.request.url}
                        >
                          <span className="text-xs">{entry.request.url}</span>
                        </TableCell>
                        <TableCell className="p-1 w-[110px] text-right font-mono">
                          {timestamp}
                        </TableCell>
                        <TableCell className="p-1 w-[80px]">
                          <span className="inline-flex items-center gap-1">
                            <Badge className={typeColor + " text-white text-xs"}>
                              {type}
                            </Badge>
                          </span>
                        </TableCell>
                        <TableCell className="p-1 w-[60px]">
                          <Badge
                            className={methodColor + " text-white px-1 py-0 text-xs"}
                            aria-label={entry.request.method}
                          >
                            {entry.request.method}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-1 w-[60px]">
                          <Badge
                            className={
                              (entry.response.status >= 500
                                ? "bg-red-500"
                                : entry.response.status >= 400
                                  ? "bg-yellow-500"
                                  : entry.response.status >= 300
                                    ? "bg-blue-500"
                                    : "bg-green-500") + " text-xs"
                            }
                            aria-label={`Status ${entry.response.status}`}
                          >
                            {entry.response.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-1 w-[80px] text-right">
                          {formatSize(entry.response.content.size || 0)}
                        </TableCell>
                        <TableCell className="p-1 w-[80px] text-right">
                          {formatTime(entry.time)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      {selectedRequest && <HarRequestDetailsCard selected={selectedRequest} />}
    </section>
  );
}
