"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout";
import { CodeEditor } from "@/components/code-editor";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAutoConvert } from "@/hooks/use-auto-convert";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { ActionToolbar } from "@/components/action-toolbar";
import { toast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

type SortMode = "alpha" | "alpha-desc" | "numeric" | "length" | "shuffle" | "none";

const SORT_OPTIONS: Array<{ value: SortMode; label: string }> = [
  { value: "alpha", label: "A-Z" },
  { value: "alpha-desc", label: "Z-A" },
  { value: "numeric", label: "Numeric" },
  { value: "length", label: "By Length" },
  { value: "shuffle", label: "Shuffle" },
  { value: "none", label: "No Sort" },
];

function processLines(
  input: string,
  sortMode: SortMode,
  deduplicate: boolean,
  trimLines: boolean,
  removeEmpty: boolean,
  caseSensitive: boolean,
): { output: string; stats: { total: number; unique: number; removed: number; empty: number } } {
  let lines = input.split("\n");
  const total = lines.length;

  if (trimLines) {
    lines = lines.map((l) => l.trim());
  }

  let empty = 0;
  if (removeEmpty) {
    const before = lines.length;
    lines = lines.filter((l) => l.trim() !== "");
    empty = before - lines.length;
  }

  let removed = 0;
  if (deduplicate) {
    const before = lines.length;
    if (caseSensitive) {
      lines = [...new Set(lines)];
    } else {
      const seen = new Set<string>();
      lines = lines.filter((l) => {
        const key = l.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    removed = before - lines.length;
  }

  switch (sortMode) {
    case "alpha":
      lines.sort((a, b) => caseSensitive ? a.localeCompare(b) : a.toLowerCase().localeCompare(b.toLowerCase()));
      break;
    case "alpha-desc":
      lines.sort((a, b) => caseSensitive ? b.localeCompare(a) : b.toLowerCase().localeCompare(a.toLowerCase()));
      break;
    case "numeric":
      lines.sort((a, b) => {
        const numA = parseFloat(a) || 0;
        const numB = parseFloat(b) || 0;
        return numA - numB;
      });
      break;
    case "length":
      lines.sort((a, b) => a.length - b.length);
      break;
    case "shuffle":
      for (let i = lines.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lines[i], lines[j]] = [lines[j], lines[i]];
      }
      break;
    case "none":
      break;
  }

  return {
    output: lines.join("\n"),
    stats: { total, unique: lines.length, removed, empty },
  };
}

export default function TextSorterPage() {
  const [input, setInput] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("alpha");
  const [deduplicate, setDeduplicate] = useState(true);
  const [trimLines, setTrimLines] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [lineStats, setLineStats] = useState({ total: 0, unique: 0, removed: 0, empty: 0 });

  const convertFn = useCallback(
    (value: string): string => {
      const result = processLines(value, sortMode, deduplicate, trimLines, removeEmpty, caseSensitive);
      setLineStats(result.stats);
      return result.output;
    },
    [sortMode, deduplicate, trimLines, removeEmpty, caseSensitive]
  );

  const { output, error, convert, clear } = useAutoConvert({
    input,
    convertFn,
  });

  const isEmpty = input.length === 0 && output.length === 0;

  const handleCopyOutput = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      toast({ description: "Copied to clipboard" });
    } catch {
      toast({ description: "Failed to copy", variant: "destructive" });
    }
  }, [output]);

  const handleClear = useCallback(() => {
    setInput("");
    clear();
    setLineStats({ total: 0, unique: 0, removed: 0, empty: 0 });
  }, [clear]);

  useKeyboardShortcuts({
    shortcuts: [
      { key: "Enter", ctrl: true, action: convert, description: "Process" },
      { key: "c", ctrl: true, shift: true, action: handleCopyOutput, description: "Copy output" },
      { key: "x", ctrl: true, shift: true, action: handleClear, description: "Clear all" },
    ],
  });

  return (
    <ToolLayout
      title="Text Line Sorter & Deduplicator"
      description="Sort lines, remove duplicates, trim whitespace, and filter empty lines"
    >
      <div className="space-y-3">
        <ActionToolbar
          left={
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Sort:</Label>
                <div className="flex gap-1 flex-wrap">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSortMode(opt.value)}
                      className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors ${
                        sortMode === opt.value
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-card hover:bg-secondary"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Switch id="dedup" checked={deduplicate} onCheckedChange={setDeduplicate} className="scale-75" />
                  <Label htmlFor="dedup" className="text-xs text-muted-foreground cursor-pointer">Dedupe</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <Switch id="trim" checked={trimLines} onCheckedChange={setTrimLines} className="scale-75" />
                  <Label htmlFor="trim" className="text-xs text-muted-foreground cursor-pointer">Trim</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <Switch id="empty" checked={removeEmpty} onCheckedChange={setRemoveEmpty} className="scale-75" />
                  <Label htmlFor="empty" className="text-xs text-muted-foreground cursor-pointer">No Empty</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <Switch id="case" checked={caseSensitive} onCheckedChange={setCaseSensitive} className="scale-75" />
                  <Label htmlFor="case" className="text-xs text-muted-foreground cursor-pointer">Case</Label>
                </div>
              </div>
            </div>
          }
          right={
            <>
              <Button onClick={convert} size="sm" aria-label="Process lines">
                Process
              </Button>
              <Button onClick={handleClear} variant="outline" size="sm" disabled={isEmpty} aria-label="Clear all">
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </>
          }
        />

        {/* Stats */}
        {!isEmpty && lineStats.total > 0 && (
          <div className="flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-primary/5 to-primary/5 border rounded-lg flex-wrap">
            <Badge variant="secondary" className="text-xs">{lineStats.total} lines</Badge>
            <span className="text-muted-foreground">{"->"}</span>
            <Badge variant="secondary" className="text-xs">{lineStats.unique} unique</Badge>
            {lineStats.removed > 0 && (
              <Badge variant="outline" className="text-xs text-orange-600">{lineStats.removed} dupes removed</Badge>
            )}
            {lineStats.empty > 0 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">{lineStats.empty} empty removed</Badge>
            )}
            <div className="ml-auto">
              <Button onClick={handleCopyOutput} variant="ghost" size="sm" className="h-7 text-xs gap-1.5" disabled={!output}>
                Copy
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Input Lines</Label>
            <CodeEditor
              language="text"
              value={input}
              onChange={setInput}
              placeholder="Enter text lines..."
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Result</Label>
            <CodeEditor language="text" value={error || output} readOnly placeholder="Processed output will appear here..." />
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
