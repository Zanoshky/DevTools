"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout";
import { CopyTextarea } from "@/components/copy-textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Plus,
  Minus,
  Edit3
} from "lucide-react";

type DiffType = "added" | "removed" | "modified" | "unchanged";

type Difference = {
  path: string;
  type: DiffType;
  oldValue?: unknown;
  newValue?: unknown;
};

export default function JSONComparePage() {
  const [jsonA, setJsonA] = useState(`{
  "name": "John Doe",
  "age": 30,
  "city": "New York"
}`);
  
  const [jsonB, setJsonB] = useState(`{
  "name": "John Doe",
  "age": 31,
  "city": "Boston",
  "country": "USA"
}`);
  
  const [differences, setDifferences] = useState<Difference[]>([]);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ added: 0, removed: 0, modified: 0, unchanged: 0 });
  const [hasCompared, setHasCompared] = useState(false);

  const deepCompare = (
    obj1: unknown,
    obj2: unknown,
    path: string = "",
    diffs: Difference[] = []
  ): Difference[] => {
    // Handle null/undefined
    if (obj1 === null || obj1 === undefined) {
      if (obj2 === null || obj2 === undefined) {
        return diffs;
      }
      diffs.push({ path: path || "root", type: "added", newValue: obj2 });
      return diffs;
    }
    
    if (obj2 === null || obj2 === undefined) {
      diffs.push({ path: path || "root", type: "removed", oldValue: obj1 });
      return diffs;
    }

    // Handle primitives
    if (typeof obj1 !== "object" || typeof obj2 !== "object") {
      if (obj1 !== obj2) {
        diffs.push({ path, type: "modified", oldValue: obj1, newValue: obj2 });
      }
      return diffs;
    }

    // Handle arrays
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      const maxLen = Math.max(obj1.length, obj2.length);
      
      for (let i = 0; i < maxLen; i++) {
        const itemPath = `${path}[${i}]`;
        
        if (i >= obj1.length) {
          diffs.push({ path: itemPath, type: "added", newValue: obj2[i] });
        } else if (i >= obj2.length) {
          diffs.push({ path: itemPath, type: "removed", oldValue: obj1[i] });
        } else {
          deepCompare(obj1[i], obj2[i], itemPath, diffs);
        }
      }
      
      return diffs;
    }

    // Handle objects
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
    
    allKeys.forEach((key) => {
      const newPath = path ? `${path}.${key}` : key;
      const o1 = obj1 as Record<string, unknown>;
      const o2 = obj2 as Record<string, unknown>;
      
      if (!(key in o1)) {
        diffs.push({ path: newPath, type: "added", newValue: o2[key] });
      } else if (!(key in o2)) {
        diffs.push({ path: newPath, type: "removed", oldValue: o1[key] });
      } else {
        deepCompare(o1[key], o2[key], newPath, diffs);
      }
    });

    return diffs;
  };

  const formatValue = (value: unknown): string => {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "string") return `"${value}"`;
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  };

  const compareJSON = () => {
    setError("");
    setDifferences([]);
    setHasCompared(true);

    try {
      const objA = JSON.parse(jsonA);
      const objB = JSON.parse(jsonB);

      const diffs = deepCompare(objA, objB);
      
      // Calculate stats
      const added = diffs.filter(d => d.type === "added").length;
      const removed = diffs.filter(d => d.type === "removed").length;
      const modified = diffs.filter(d => d.type === "modified").length;
      
      setStats({ added, removed, modified, unchanged: 0 });
      setDifferences(diffs);
    } catch (err) {
      setError("Invalid JSON: " + (err instanceof Error ? err.message : "Parse error"));
    }
  };

  const getDiffIcon = (type: DiffType) => {
    switch (type) {
      case "added":
        return <Plus className="h-4 w-4" />;
      case "removed":
        return <Minus className="h-4 w-4" />;
      case "modified":
        return <Edit3 className="h-4 w-4" />;
      default:
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const getDiffColor = (type: DiffType) => {
    switch (type) {
      case "added":
        return "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
      case "removed":
        return "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
      case "modified":
        return "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800";
      default:
        return "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    }
  };

  return (
    <ToolLayout
      title="JSON Compare"
      description="Deep comparison of JSON objects with array and nested object support"
    >
      <div className="space-y-3">
        {/* Stats Bar */}
        {differences.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-card border rounded-lg flex-wrap">
            {stats.added > 0 && (
              <Badge className="bg-green-500 hover:bg-green-600 gap-1 text-xs px-2 py-0">
                <Plus className="h-3 w-3" />
                +{stats.added}
              </Badge>
            )}
            {stats.removed > 0 && (
              <Badge variant="destructive" className="gap-1 text-xs px-2 py-0">
                <Minus className="h-3 w-3" />
                -{stats.removed}
              </Badge>
            )}
            {stats.modified > 0 && (
              <Badge className="bg-orange-500 hover:bg-orange-600 gap-1 text-xs px-2 py-0">
                <Edit3 className="h-3 w-3" />
                ~{stats.modified}
              </Badge>
            )}
          </div>
        )}

        {/* Input Section - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">JSON A (Original)</span>
            </div>
            <CopyTextarea
              value={jsonA}
              onChange={setJsonA}
              placeholder="Enter first JSON..."
              rows={15}
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">JSON B (Modified)</span>
              <Button onClick={compareJSON} size="sm">
                Compare
              </Button>
            </div>
            <CopyTextarea
              value={jsonB}
              onChange={setJsonB}
              placeholder="Enter second JSON..."
              rows={15}
              className="font-mono text-xs"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* No Differences */}
        {hasCompared && differences.length === 0 && !error && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <strong>Objects are identical!</strong> No differences found.
            </AlertDescription>
          </Alert>
        )}

        {/* Differences */}
        {differences.length > 0 && (
          <div className="p-3 bg-card border rounded-lg">
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {differences.map((diff, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${getDiffColor(diff.type)}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">{getDiffIcon(diff.type)}</div>
                    <div className="flex-1 space-y-1">
                      <div className="font-semibold text-xs">
                        {diff.path}
                      </div>
                      
                      {diff.type === "added" && (
                        <div className="font-mono text-xs">
                          <span className="opacity-60">Added: </span>
                          <span className="font-semibold">{formatValue(diff.newValue)}</span>
                        </div>
                      )}
                      
                      {diff.type === "removed" && (
                        <div className="font-mono text-xs">
                          <span className="opacity-60">Removed: </span>
                          <span className="font-semibold line-through">{formatValue(diff.oldValue)}</span>
                        </div>
                      )}
                      
                      {diff.type === "modified" && (
                        <div className="font-mono text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="line-through opacity-60">{formatValue(diff.oldValue)}</span>
                            <ArrowRight className="h-3 w-3 opacity-60" />
                            <span className="font-semibold">{formatValue(diff.newValue)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
