"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronRight,
  ChevronDown,
  Info,
  AlertCircle,
  Link as LinkIcon,
  Layers,
  List,
  Table as TableIcon,
  BarChart2,
  ExternalLink,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getTypeFromMime,
  getTypeColor,
  MimeTypeIcon,
  getBarColorFromType,
  MIME_TYPES,
} from "./mime-util";
// Removed unused Card, CardHeader, CardTitle, CardContent imports
import { HarRequestDetailsCard } from "./har-request-details-card";
import type { HarEntry } from "@/components/har-types";

interface DependencyTreeProps {
  entries: HarEntry[];
  selectedRequest?: HarEntry | null;
  setSelectedRequest?: (r: HarEntry | null) => void;
}

interface Initiator {
  type: string;
  url?: string;
  lineNumber?: number;
  columnNumber?: number;
  stack?: {
    callFrames: Array<{
      functionName: string;
      scriptId: string;
      url: string;
      lineNumber: number;
      columnNumber: number;
    }>;
  };
}

interface EnhancedEntry extends HarEntry {
  _initiator?: Initiator;
  _resourceType?: string;
  children?: EnhancedEntry[];
  processed?: boolean;
  depth?: number;
  parent?: EnhancedEntry | null;
}

export function DependencyTree({ entries, selectedRequest: externalSelectedRequest, setSelectedRequest: externalSetSelectedRequest }: DependencyTreeProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [internalSelectedRequest, setInternalSelectedRequest] = useState<EnhancedEntry | null>(
    null
  );
  
  // Use external state if provided, otherwise use internal state
  const selectedRequest = externalSelectedRequest !== undefined ? externalSelectedRequest : internalSelectedRequest;
  const setSelectedRequest = externalSetSelectedRequest || setInternalSelectedRequest;
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<
    "tree" | "list" | "table" | "waterfall"
  >("waterfall");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [initiatorType, setInitiatorType] = useState<string>("all");
  const [hasInitiatorData, setHasInitiatorData] = useState(false);
  const [treeRoot, setTreeRoot] = useState<EnhancedEntry | null>(null);
  const [orphanedEntries, setOrphanedEntries] = useState<EnhancedEntry[]>([]);
  const [showOrphans] = useState(true);

  const [enhancedEntries, setEnhancedEntries] = useState<EnhancedEntry[]>([]);

  // Collect all types from entries using getTypeFromMime
  const allTypes: string[] = useMemo(
    () =>
      Array.from(
        new Set(
          entries
            .map((e: HarEntry) =>
              getTypeFromMime(e.response?.content?.mimeType || "")
            )
            .concat(typeof MIME_TYPES !== "undefined" ? MIME_TYPES : [])
        )
      ).filter(Boolean),
    [entries]
  );

  useEffect(() => {
    if (!entries || entries.length === 0) return;
    const hasInitiator = entries.some(
      (entry) =>
        (entry as EnhancedEntry)._initiator ||
        (entry as EnhancedEntry)._resourceType
    );
    setHasInitiatorData(hasInitiator);
    buildDependencyTreeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  const toggleRow = (idx: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const buildDependencyTreeData = () => {
    if (!entries || entries.length === 0) return;
    const entriesByUrl = new Map<string, EnhancedEntry>();
    const enhancedEntriesLocal = entries.map((entry) => {
      const enhancedEntry: EnhancedEntry = {
        ...entry,
        children: [],
        processed: false,
        depth: 0,
        parent: null,
      };
      entriesByUrl.set(entry.request.url, enhancedEntry);
      return enhancedEntry;
    });
    enhancedEntriesLocal.forEach((entry) => {
      if (entry._initiator) {
        if (entry._initiator.type === "parser" && entry._initiator.url) {
          const parentEntry = entriesByUrl.get(entry._initiator.url);
          if (parentEntry) {
            parentEntry.children?.push(entry);
            entry.parent = parentEntry;
            entry.depth = (parentEntry.depth || 0) + 1;
            entry.processed = true;
          }
        } else if (
          entry._initiator.type === "script" &&
          entry._initiator.stack &&
          Array.isArray(entry._initiator.stack.callFrames) &&
          entry._initiator.stack.callFrames.length > 0
        ) {
          const parentUrl = entry._initiator.stack.callFrames[0].url;
          const parentEntry = entriesByUrl.get(parentUrl);
          if (parentEntry) {
            parentEntry.children?.push(entry);
            entry.parent = parentEntry;
            entry.depth = (parentEntry.depth || 0) + 1;
            entry.processed = true;
          }
        }
      }
    });
    let root: EnhancedEntry | null = null;
    const orphans: EnhancedEntry[] = [];
    enhancedEntriesLocal.forEach((entry) => {
      if (
        (entry as EnhancedEntry)._resourceType === "document" ||
        (entry.response.content.mimeType &&
          entry.response.content.mimeType.includes("html"))
      ) {
        if (!root) {
          root = entry;
          root.processed = true;
        }
      } else if (!entry.parent && !entry.processed) {
        orphans.push(entry);
      }
    });
    if (!root && enhancedEntriesLocal.length > 0) {
      root = enhancedEntriesLocal[0];
      root.processed = true;
    }
    if (!hasInitiatorData && root) {
      const sortedEntries = [...enhancedEntriesLocal].sort(
        (a, b) =>
          new Date(a.startedDateTime).getTime() -
          new Date(b.startedDateTime).getTime()
      );
      sortedEntries.forEach((entry) => {
        if (entry === root) return;
        const entryTime = new Date(entry.startedDateTime).getTime();
        let foundParent = false;
        for (const potentialParent of sortedEntries) {
          if (potentialParent === entry) continue;
          const parentTime = new Date(
            potentialParent.startedDateTime
          ).getTime();
          const timeDiff = entryTime - parentTime;
          if (timeDiff > 0 && timeDiff < 2000) {
            const parentType = potentialParent.response.content.mimeType || "";
            const childType = entry.response.content.mimeType || "";
            const inferredRelationship =
              (parentType.includes("html") &&
                (childType.includes("css") ||
                  childType.includes("javascript") ||
                  childType.includes("image"))) ||
              (parentType.includes("css") &&
                (childType.includes("font") || childType.includes("image"))) ||
              (parentType.includes("javascript") && childType.includes("json"));
            if (inferredRelationship) {
              potentialParent.children?.push(entry);
              entry.parent = potentialParent;
              entry.depth = (potentialParent.depth || 0) + 1;
              entry.processed = true;
              foundParent = true;
              break;
            }
          }
        }
        if (!foundParent && !entry.processed) {
          root?.children?.push(entry);
          entry.parent = root;
          entry.depth = 1;
          entry.processed = true;
        }
      });
    }
    setTreeRoot(root);
    setOrphanedEntries(orphans);
    setEnhancedEntries(enhancedEntriesLocal);
  };

  const filteredEntries = useMemo(() => {
    if (!enhancedEntries) return [];
    return enhancedEntries.filter((entry) => {
      const url = entry.request.url.toLowerCase();
      const searchMatch =
        searchTerm === "" || url.includes(searchTerm.toLowerCase());
      let typeMatch = true;
      if (filterType !== "all") {
        const type = getTypeFromMime(entry.response.content.mimeType || "");
        if (type !== filterType) typeMatch = false;
      }
      let initiatorMatch = true;
      if (initiatorType !== "all" && entry._initiator) {
        initiatorMatch = entry._initiator.type === initiatorType;
      } else if (initiatorType !== "all" && !entry._initiator) {
        initiatorMatch = false;
      }
      return searchMatch && typeMatch && initiatorMatch;
    });
  }, [enhancedEntries, searchTerm, filterType, initiatorType]);

  // --- Utility functions ---
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  };
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  const getResourceType = (entry: EnhancedEntry) => {
    return getTypeFromMime(entry.response?.content?.mimeType || "");
  };

  const getInitiatorType = (entry: EnhancedEntry) => {
    if (!entry._initiator) return "Unknown";
    return (
      entry._initiator.type.charAt(0).toUpperCase() +
      entry._initiator.type.slice(1)
    );
  };
  const getInitiatorDetails = (entry: EnhancedEntry) => {
    if (!entry._initiator) return null;
    const initiator = entry._initiator;
    if (initiator.type === "parser" && initiator.url) {
      return `Initiated by HTML parser from ${new URL(initiator.url).pathname}`;
    }
    if (
      initiator.type === "script" &&
      initiator.stack &&
      Array.isArray(initiator.stack.callFrames) &&
      initiator.stack.callFrames.length > 0
    ) {
      const frame = initiator.stack.callFrames[0];
      return `Initiated by script ${
        frame.url ? new URL(frame.url).pathname : ""
      } at line ${frame.lineNumber}`;
    }
    return `Initiated by ${initiator.type}`;
  };

  function filterTree(
    entry: EnhancedEntry,
    visited = new Set<string>()
  ): EnhancedEntry | null {
    // Use a unique key for each node (e.g., URL + startedDateTime)
    const nodeKey = entry.request.url + "|" + (entry.startedDateTime || "");
    if (visited.has(nodeKey)) {
      // Already visited this node, prevent infinite recursion
      return null;
    }
    visited.add(nodeKey);

    const url = entry.request.url.toLowerCase();
    const searchMatch =
      searchTerm === "" || url.includes(searchTerm.toLowerCase());
    let typeMatch = true;
    if (filterType !== "all") {
      const type = getTypeFromMime(entry.response.content.mimeType || "");
      if (type !== filterType) typeMatch = false;
    }
    let initiatorMatch = true;
    if (initiatorType !== "all" && entry._initiator) {
      initiatorMatch = entry._initiator.type === initiatorType;
    } else if (initiatorType !== "all" && !entry._initiator) {
      initiatorMatch = false;
    }

    let filteredChildren: EnhancedEntry[] = [];
    if (entry.children && entry.children.length > 0) {
      filteredChildren = entry.children
        .map((child) => filterTree(child, new Set(visited)))
        .filter(Boolean) as EnhancedEntry[];
    }

    if (
      (searchMatch && typeMatch && initiatorMatch) ||
      filteredChildren.length > 0
    ) {
      return { ...entry, children: filteredChildren };
    }
    return null;
  }

  const renderProfessionalTree = (
    entry: EnhancedEntry,
    depth = 0,
    nodePrefix = "1"
  ) => {
    if (!entry) return null;

    const nodeId =
      entry.request.url +
      "|" +
      (entry.startedDateTime || "") +
      "|" +
      nodePrefix;
    const isExpanded = expanded[nodeId] === true;
    const hasChildren = entry.children && entry.children.length > 0;

    // Show only path+query for display, but full URL in tooltip and link
    let displayName: string;
    try {
      const url = new URL(entry.request.url);
      displayName = url.pathname + (url.search || "");
    } catch {
      displayName = entry.request.url;
    }

    // Remove unused variable warning by using displayName in the returned JSX
    return (
      <div key={nodeId} style={{ marginLeft: depth * 24 }}>
        <div
          className={`flex items-center py-1 px-2 rounded hover:bg-muted/50 transition group`}
          style={{ minHeight: 36 }}
        >
          {hasChildren ? (
            <button
              className="mr-1 focus:outline-none"
              aria-label={isExpanded ? "Collapse" : "Expand"}
              onClick={() =>
                setExpanded((prev) => ({ ...prev, [nodeId]: !isExpanded }))
              }
              type="button"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <span className="w-5" />
          )}
          <ResourceCell entry={entry} displayName={displayName} />
          <Badge
            variant="outline"
            className={`ml-2 ${
              entry.response.status >= 200 && entry.response.status < 300
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                : entry.response.status >= 400
                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                : ""
            }`}
          >
            {entry.response.status}
          </Badge>
          <span className="ml-2 text-xs text-muted-foreground">
            {formatTime(entry.time)}
          </span>
          <span className="ml-2 text-xs text-muted-foreground">
            {formatSize(entry.response.content.size || 0)}
          </span>
          {entry._initiator && (
            <Badge variant="outline" className="ml-2 text-xs">
              {entry._initiator.type}
            </Badge>
          )}
        </div>
        {/* Details row */}
        <div className="ml-8 mb-1">
          <span className="text-xs text-muted-foreground">
            {getInitiatorDetails(entry)}
          </span>
        </div>
        {/* Children */}
        {isExpanded &&
          hasChildren &&
          entry.children!.map((child, idx) =>
            renderProfessionalTree(child, depth + 1, `${nodePrefix}.${idx + 1}`)
          )}
      </div>
    );
  };

  // Accept displayName as prop to use it and avoid unused variable warning
  function ResourceCell({
    entry,
    displayName,
  }: {
    entry: EnhancedEntry;
    displayName?: string;
  }) {
    let localDisplayName = displayName;
    if (!localDisplayName) {
      try {
        const url = new URL(entry.request.url);
        localDisplayName = url.pathname + (url.search || "");
      } catch {
        localDisplayName = entry.request.url;
      }
    }
    return (
      <div className="flex items-center gap-2">
        <span>
          <MimeTypeIcon type={getResourceType(entry)} />
        </span>
        <span
          className="truncate cursor-pointer hover:underline text-xs"
          title={entry.request.url}
          onClick={() => setSelectedRequest(entry)}
        >
          {localDisplayName}
        </span>
        <a
          href={entry.request.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 text-blue-500 hover:text-blue-700"
          title="Open in new tab"
          onClick={(evt) => evt.stopPropagation()}
        >
          <ExternalLink className="inline h-4 w-4" />
        </a>
      </div>
    );
  }

  const renderListView = () => {
    if (!filteredEntries || filteredEntries.length === 0) return null;

    // Group entries by initiator URL (the resource that triggered them)
    const entriesByInitiatorUrl: Record<string, EnhancedEntry[]> = {};

    filteredEntries.forEach((entry) => {
      // Find the initiator URL (parent resource)
      let initiatorUrl = "No Initiator";
      if (entry.parent && entry.parent.request && entry.parent.request.url) {
        initiatorUrl = entry.parent.request.url;
      } else if (entry._initiator?.url) {
        initiatorUrl = entry._initiator.url;
      }
      if (!entriesByInitiatorUrl[initiatorUrl]) {
        entriesByInitiatorUrl[initiatorUrl] = [];
      }
      entriesByInitiatorUrl[initiatorUrl].push(entry);
    });

    return (
      <div className="space-y-6">
        {Object.entries(entriesByInitiatorUrl).map(
          ([initiatorUrl, entries]) => {
            let initiatorDisplay;
            if (initiatorUrl === "No Initiator") {
              initiatorDisplay = (
                <span className="italic text-muted-foreground">
                  No Initiator
                </span>
              );
            } else {
              try {
                const urlObj = new URL(initiatorUrl);
                initiatorDisplay = (
                  <span>
                    <span className="font-mono">{urlObj.hostname}</span>
                    <span className="text-muted-foreground">
                      {urlObj.pathname}
                    </span>
                  </span>
                );
              } catch {
                initiatorDisplay = initiatorUrl;
              }
            }
            return (
              <div key={initiatorUrl}>
                <h2 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-blue-500" />
                  {initiatorDisplay}
                  <span className="text-xs text-muted-foreground ml-2">
                    ({entries.length} resource{entries.length > 1 ? "s" : ""})
                  </span>
                </h2>
                <div className="space-y-2">
                  {entries.map((entry, i) => {
                    let displayName;
                    try {
                      const url = new URL(entry.request.url);
                      displayName =
                        url.pathname === "/"
                          ? url.hostname
                          : url.pathname.split("/").pop();
                    } catch {
                      displayName =
                        entry.request.url.split("/").pop() || "Unknown";
                    }
                    const type = getResourceType(entry);
                    return (
                      <Tooltip
                        key={`${entry.request.url}-${
                          entry.startedDateTime || ""
                        }-${i}`}
                      >
                        <TooltipTrigger asChild>
                          <div className="flex items-center p-2 bg-card border rounded-md gap-3">
                            <div className="flex items-center gap-2">
                              <MimeTypeIcon type={getResourceType(entry)} />
                              <span
                                className="truncate cursor-pointer hover:underline text-xs"
                                title={entry.request.url}
                                onClick={() => setSelectedRequest(entry)}
                              >
                                {displayName}
                              </span>
                              <a
                                href={entry.request.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1 text-blue-500 hover:text-blue-700"
                                title="Open in new tab"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="inline h-4 w-4" />
                              </a>
                            </div>
                            <Badge
                              variant="outline"
                              className={`mr-2 ${getTypeColor(
                                type
                              )} text-white flex items-center gap-1 ${
                                entry.response.status >= 200 &&
                                entry.response.status < 300
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : entry.response.status >= 400
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                  : ""
                              }`}
                            >
                              {entry.response.status}
                            </Badge>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {formatTime(entry.time)}
                            </span>
                            {entry._initiator && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {entry._initiator.type}
                              </Badge>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <div className="space-y-1">
                            <p className="font-medium break-all text-xs">
                              {entry.request.url}
                            </p>
                            <div className="grid grid-cols-2 gap-x-4 text-xs">
                              <span className="text-muted-foreground">
                                Size:
                              </span>
                              <span>
                                {formatSize(entry.response.content.size || 0)}
                              </span>
                              <span className="text-muted-foreground">
                                Time:
                              </span>
                              <span>{formatTime(entry.time)}</span>
                              <span className="text-muted-foreground">
                                Status:
                              </span>
                              <span>
                                {entry.response.status}{" "}
                                {entry.response.statusText}
                              </span>
                              {entry._initiator && (
                                <>
                                  <span className="text-muted-foreground">
                                    Initiator:
                                  </span>
                                  <span>{getInitiatorType(entry)}</span>
                                </>
                              )}
                            </div>
                            {getInitiatorDetails(entry) && (
                              <p className="text-xs mt-1">
                                {getInitiatorDetails(entry)}
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            );
          }
        )}
      </div>
    );
  };

  const renderWaterfallView = () => {
    if (!filteredEntries || filteredEntries.length === 0) return null;

    // Calculate the earliest start and latest end
    const getStart = (entry: EnhancedEntry) =>
      new Date(entry.startedDateTime).getTime();
    const getEnd = (entry: EnhancedEntry) =>
      getStart(entry) + (entry.time || 0);

    const minStart = Math.min(...filteredEntries.map(getStart));
    const maxEnd = Math.max(...filteredEntries.map(getEnd));
    const totalDuration = maxEnd - minStart;

    const sorted = [...filteredEntries].sort(
      (a, b) => getStart(a) - getStart(b)
    );

    const getBarColor = (entry: EnhancedEntry) => {
      const type = getResourceType(entry);
      return getBarColorFromType(type);
    };

    const timelineTicks = [0, 0.25, 0.5, 0.75, 1];

    return (
      <div className="border rounded h-full flex flex-col">
        {/* Timeline Header */}
        <div className="flex bg-muted text-xs font-semibold border-b sticky top-0 z-10">
          <div className="p-2 w-[320px]">Resource</div>
          <div className="p-2 w-[90px] text-right">Size</div>
          <div className="p-2 w-[90px] text-right">Time</div>
          <div className="flex-1 relative p-2">
            <div className="relative h-4">
              {timelineTicks.map((p, idx) => (
                <div
                  key={p}
                  className="absolute border-l border-dashed border-gray-300 h-full"
                  style={{
                    left:
                      idx === timelineTicks.length - 1
                        ? undefined
                        : `${p * 100}%`,
                    right: idx === timelineTicks.length - 1 ? 0 : undefined,
                    top: 0,
                    bottom: 0,
                    width: 0,
                  }}
                >
                  <span
                    className="absolute top-0 text-[10px] text-gray-400 whitespace-nowrap"
                    style={
                      idx === 0
                        ? {
                            left: 0,
                            minWidth: 40,
                            textAlign: "left",
                          }
                        : idx === timelineTicks.length - 1
                        ? {
                            right: 0,
                            minWidth: 40,
                            textAlign: "right",
                          }
                        : {
                            left: "50%",
                            transform: "translateX(-50%)",
                            minWidth: 40,
                            textAlign: "center",
                          }
                    }
                  >
                    {new Date(minStart + totalDuration * p)
                      .toISOString()
                      .slice(11, 23)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Rows */}
        <div ref={timelineRef} className="overflow-y-auto flex-1">
          {sorted.map((entry, i) => {
            let displayName;
            try {
              const url = new URL(entry.request.url);
              displayName = url.pathname + (url.search || "");
            } catch {
              displayName = entry.request.url;
            }
            const start = getStart(entry);
            const end = getEnd(entry);
            const offset = ((start - minStart) / totalDuration) * 100;
            const width = ((end - start) / totalDuration) * 100;

            return (
              <div
                key={`${entry.request.url || ""}-${
                  entry.startedDateTime || ""
                }-${i}`}
                className={
                  "flex items-center border-b last:border-b-0 hover:bg-muted/40"
                }
                style={{ minHeight: 24, height: 24 }}
              >
                <div className="p-2 w-[320px] truncate flex items-center gap-2">
                  <MimeTypeIcon type={getResourceType(entry)} />
                  <span
                    className="text-xs font-medium truncate ml-1"
                    title={entry.request.url}
                    onClick={() => setSelectedRequest(entry)}
                    style={{ cursor: "pointer" }}
                  >
                    {displayName}
                  </span>
                  <a
                    href={entry.request.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-blue-500 hover:text-blue-700"
                    title="Open in new tab"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="inline h-4 w-4" />
                  </a>
                </div>
                <div className="p-2 w-[90px] text-right truncate">
                  <span className="text-xs">
                    {formatSize(entry.response.content.size || 0)}
                  </span>
                </div>
                <div className="p-2 w-[90px] text-right truncate">
                  <span className="text-xs">{formatTime(entry.time)}</span>
                </div>
                <div className="flex-1 relative h-6">
                  <div
                    className="absolute top-1 h-4 rounded"
                    style={{
                      left: `${offset}%`,
                      width: `${width}%`,
                      background: getBarColor(entry),
                      minWidth: 1,
                      opacity: 0.9,
                    }}
                    title={`Start: ${new Date(start)
                      .toISOString()
                      .slice(11, 23)}, Duration: ${entry.time} ms`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTableView = () => {
    if (!filteredEntries || filteredEntries.length === 0) return null;

    // Helper to recursively flatten tree for hierarchical table
    const flattenEntries = (
      entry: EnhancedEntry,
      depth = 0,
      parentIndex = "",
      parentExpanded = true
    ): Array<{
      entry: EnhancedEntry;
      depth: number;
      index: string;
      parentExpanded: boolean;
    }> => {
      const idx = parentIndex === "" ? "0" : parentIndex;
      let rows = [{ entry, depth, index: idx, parentExpanded }];
      if (entry.children && entry.children.length > 0 && expandedRows[idx]) {
        entry.children.forEach((child, i) => {
          rows = rows.concat(
            flattenEntries(
              child,
              depth + 1,
              `${idx}.${i + 1}`,
              parentExpanded && expandedRows[idx]
            )
          );
        });
      }
      return rows;
    };

    // Start from filtered root(s)
    let rows: Array<{
      entry: EnhancedEntry;
      depth: number;
      index: string;
      parentExpanded: boolean;
    }> = [];

    // Use filtered tree and filtered orphans
    const filteredRoot = treeRoot ? filterTree(treeRoot, new Set()) : null;
    if (filteredRoot) {
      rows = flattenEntries(filteredRoot, 0, "0", true);
    }
    if (showOrphans && orphanedEntries.length > 0) {
      orphanedEntries.forEach((orphan, i) => {
        const filteredOrphan = filterTree(orphan, new Set());
        if (filteredOrphan) {
          rows = rows.concat(
            flattenEntries(filteredOrphan, 0, `orphan-${i}`, true)
          );
        }
      });
    }

    // fallback: flat list if nothing matches
    if (rows.length === 0) {
      rows = filteredEntries.map((entry, i) => ({
        entry,
        depth: 0,
        index: `${i}`,
        parentExpanded: true,
      }));
    }

    return (
      <div className="border rounded-md overflow-hidden h-full flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted">
              <tr>
                <th className="text-left p-2 w-8"></th>
                <th className="text-left p-2 max-w-[400px] w-[400px]">
                  Resource
                </th>
                <th className="text-left p-2 max-w-[100px] w-[100px]">Type</th>
                <th className="text-left p-2 max-w-[50px] w-[50px]">Status</th>
                <th className="text-right p-2 max-w-[75px] w-[75px]">Size</th>
                <th className="text-right p-2 max-w-[75px] w-[75px]">Time</th>
                <th className="text-left p-2 max-w-[75px] w-[75px]">
                  Initiator Type
                </th>
                <th className="text-left p-2 max-w-[75px] w-[75px]">
                  Initiated By
                </th>
                <th className="text-left p-2">Depends On</th>
                <th className="text-left p-2">Children</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ entry, depth, index: rowIndex }) => {
                let displayName;
                try {
                  const url = new URL(entry.request.url);
                  displayName = url.pathname + (url.search || "");
                } catch {
                  displayName = entry.request.url;
                }

                const mime = entry.response.content.mimeType || "";
                const type = getTypeFromMime(mime);
                const typeColor = getTypeColor(type);

                const initiatorType = entry._initiator
                  ? entry._initiator.type.charAt(0).toUpperCase() +
                    entry._initiator.type.slice(1)
                  : "-";

                let initiatedBy = "-";
                if (entry._initiator) {
                  if (
                    entry._initiator.type === "parser" &&
                    entry._initiator.url
                  ) {
                    try {
                      initiatedBy = new URL(entry._initiator.url).pathname;
                    } catch {
                      initiatedBy = entry._initiator.url;
                    }
                  } else if (
                    entry._initiator.type === "script" &&
                    entry._initiator.stack?.callFrames?.length &&
                    entry._initiator.stack.callFrames.length > 0
                  ) {
                    const frame = entry._initiator.stack?.callFrames?.[0];
                    try {
                      const scriptUrl = new URL(frame.url);
                      const functionName =
                        frame.functionName && frame.functionName !== ""
                          ? ` (${frame.functionName})`
                          : "";
                      initiatedBy = `${scriptUrl.pathname}:${
                        frame.lineNumber + 1
                      }${functionName}`;
                    } catch {
                      const functionName =
                        frame.functionName && frame.functionName !== ""
                          ? ` (${frame.functionName})`
                          : "";
                      initiatedBy = `${frame.url}:${
                        frame.lineNumber + 1
                      }${functionName}`;
                    }
                  } else if (
                    entry._initiator.type === "other" &&
                    entry._initiator.url
                  ) {
                    try {
                      const otherUrl = new URL(entry._initiator.url);
                      initiatedBy = `${otherUrl.pathname}`;
                    } catch {
                      initiatedBy = entry._initiator.url;
                    }
                  } else {
                    initiatedBy =
                      entry._initiator.type.charAt(0).toUpperCase() +
                      entry._initiator.type.slice(1);
                  }
                }

                // Dependency (parent) and children
                let dependsOn = "-";
                if (
                  entry.parent &&
                  entry.parent.request &&
                  entry.parent.request.url
                ) {
                  try {
                    const parentUrl = new URL(entry.parent.request.url);
                    dependsOn = parentUrl.pathname + (parentUrl.search || "");
                  } catch {
                    dependsOn =
                      (entry.parent.request.url.split("/").pop() as string) ||
                      "Unknown";
                  }
                }

                const hasChildren = entry.children && entry.children.length > 0;

                return (
                  <React.Fragment key={rowIndex}>
                    <tr
                      className={
                        depth % 2 === 0 ? "bg-background" : "bg-muted/30"
                      }
                    >
                      <td
                        className="p-2 align-top"
                        style={{ paddingLeft: `${depth * 20}px` }}
                      >
                        {hasChildren ? (
                          <button
                            className="focus:outline-none"
                            onClick={() => toggleRow(rowIndex)}
                            aria-label={
                              expandedRows[rowIndex] ? "Collapse" : "Expand"
                            }
                            type="button"
                          >
                            {expandedRows[rowIndex] ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        ) : null}
                      </td>
                      <td
                        className="p-2 max-w-[320px] w-[320px] truncate align-top"
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center min-w-0">
                              <span>
                                <MimeTypeIcon type={getResourceType(entry)} />
                              </span>
                              <span
                                className="truncate cursor-pointer hover:underline text-xs ml-2"
                                title={entry.request.url}
                                onClick={() => setSelectedRequest(entry)}
                              >
                                {displayName}
                              </span>
                              <a
                                href={entry.request.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1 text-blue-500 hover:text-blue-700"
                                title="Open in new tab"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="inline h-4 w-4" />
                              </a>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <span className="text-xs">{entry.request.url}</span>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="p-2 text-right max-w-[100px] w-[100px]">
                        <Badge className={typeColor + " text-white"}>
                          {type}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge
                          variant="outline"
                          className={`${
                            entry.response.status >= 200 &&
                            entry.response.status < 300
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : entry.response.status >= 400
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                              : ""
                          }`}
                        >
                          {entry.response.status}
                        </Badge>
                      </td>
                      <td className="p-2 text-right max-w-[75px] w-[75px] truncate">
                        {formatSize(entry.response.content.size || 0)}
                      </td>
                      <td className="p-2 text-right max-w-[75px] w-[75px] truncate">
                        {formatTime(entry.time)}
                      </td>
                      <td className="p-2">{initiatorType}</td>
                      <td className="p-2 truncate max-w-[75px] w-[75px]">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{initiatedBy}</span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[400px]">
                            {entry._initiator && getInitiatorDetails(entry)}
                          </TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="p-2 truncate max-w-[180px]">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{dependsOn}</span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[400px]">
                            {entry.parent &&
                              entry.parent.request &&
                              entry.parent.request.url}
                          </TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="p-2 truncate max-w-[180px]">
                        {hasChildren ? (
                          <span
                            className="text-blue-600 cursor-pointer underline"
                            onClick={() => toggleRow(rowIndex)}
                          >
                            {entry.children ? entry.children.length : 0} child
                            {entry.children && entry.children.length > 1
                              ? "ren"
                              : ""}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {!hasInitiatorData && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Limited initiator data</AlertTitle>
            <AlertDescription>
              This HAR file doesn&apos;t contain detailed initiator information.
              The dependency tree is built using timing and content type
              heuristics, which may not perfectly represent the actual
              dependencies.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <input
              type="text"
              placeholder="Search resources..."
              className="px-3 py-1 border rounded-md text-sm w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {allTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      <span className="flex items-center gap-2">
                        <MimeTypeIcon type={type} />
                        {type}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasInitiatorData && (
                <Select value={initiatorType} onValueChange={setInitiatorType}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Filter by initiator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Initiators</SelectItem>
                    <SelectItem value="parser">Parser</SelectItem>
                    <SelectItem value="script">Script</SelectItem>
                    <SelectItem value="preload">Preload</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tabs
              value={viewMode}
              onValueChange={(v) =>
                setViewMode(v as "tree" | "list" | "table" | "waterfall")
              }
            >
              <TabsList className="grid w-[500px] grid-cols-4">
                <TabsTrigger value="waterfall">
                  <BarChart2 className="h-4 w-4 mr-1" />
                  Waterfall
                </TabsTrigger>
                <TabsTrigger value="tree">
                  <Layers className="h-4 w-4 mr-1" />
                  Tree
                </TabsTrigger>
                <TabsTrigger value="list">
                  <List className="h-4 w-4 mr-1" />
                  List
                </TabsTrigger>
                <TabsTrigger value="table">
                  <TableIcon className="h-4 w-4 mr-1" />
                  Table
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {viewMode === "waterfall" && (
          <ScrollArea className="rounded-lg bg-background">
            <div>{renderWaterfallView()}</div>
          </ScrollArea>
        )}

        {viewMode === "tree" && (
          <ScrollArea className="border rounded-lg bg-background">
            <div className="p-4">
              {treeRoot ? (
                <>
                  <div className="mb-2">
                    <Badge
                      variant="outline"
                      className="bg-primary text-primary-foreground"
                    >
                      Root Document
                    </Badge>
                  </div>
                  {/* Filter the tree before rendering */}
                  {filterTree(treeRoot) ? (
                    renderProfessionalTree(filterTree(treeRoot)!)
                  ) : (
                    <div className="text-muted-foreground italic">
                      No matching resources
                    </div>
                  )}
                  {showOrphans && orphanedEntries.length > 0 && (
                    <div className="mt-6">
                      <Badge
                        variant="outline"
                        className="bg-muted text-muted-foreground"
                      >
                        Orphaned Resources ({orphanedEntries.length})
                      </Badge>
                      <div className="mt-2">
                        {orphanedEntries
                          .map((entry) => filterTree(entry, new Set()))
                          .filter(Boolean)
                          .map((entry, idx) =>
                            renderProfessionalTree(entry!, 0, `orphan-${idx}`)
                          )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">
                      No dependency data available
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Unable to build dependency tree from the provided HAR data
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {viewMode === "list" && (
          <ScrollArea className="border rounded-lg bg-background">
            <div className="p-4">{renderListView()}</div>
          </ScrollArea>
        )}

        {viewMode === "table" && (
          <ScrollArea className="rounded-lg bg-background">
            <div>{renderTableView()}</div>
          </ScrollArea>
        )}
      </div>
      {selectedRequest && <HarRequestDetailsCard selected={selectedRequest} />}
    </TooltipProvider>
  );
}
