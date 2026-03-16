"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout";
import { CodeEditor } from "@/components/code-editor";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAutoConvert } from "@/hooks/use-auto-convert";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { ActionToolbar } from "@/components/action-toolbar";
import { StatsBar } from "@/components/stats-bar";
import { EmptyState } from "@/components/empty-state";
import { toast } from "@/hooks/use-toast";
import { Braces, Trash2, CaseSensitive } from "lucide-react";

const cases = [
  { value: "camelCase", label: "camelCase", example: "userFirstName" },
  { value: "PascalCase", label: "PascalCase", example: "UserFirstName" },
  { value: "snake_case", label: "snake_case", example: "user_first_name" },
  { value: "SCREAMING_SNAKE_CASE", label: "SCREAMING_SNAKE", example: "USER_FIRST_NAME" },
  { value: "kebab-case", label: "kebab-case", example: "user-first-name" },
  { value: "dot.case", label: "dot.case", example: "user.first.name" },
] as const;

type CaseType = (typeof cases)[number]["value"];

function detectCaseFormat(str: string): string {
  if (!str || str.length === 0) return "unknown";

  if (/^[a-z]+([A-Z][a-z]*)*$/.test(str)) {
    return "camelCase";
  } else if (/^[A-Z][a-z]*([A-Z][a-z]*)*$/.test(str)) {
    return "PascalCase";
  } else if (/^[A-Z_]+$/.test(str) && str.includes("_")) {
    return "SCREAMING_SNAKE_CASE";
  } else if (/^[a-z]+(_[a-z]+)*$/.test(str)) {
    return "snake_case";
  } else if (/^[a-z]+(-[a-z]+)*$/.test(str)) {
    return "kebab-case";
  } else if (/^[a-z]+(\.[a-z]+)*$/.test(str)) {
    return "dot.case";
  }

  return "mixed";
}

function analyzeJsonFormat(obj: Record<string, unknown> | unknown[]): Record<string, number> {
  const formatCounts: Record<string, number> = {};

  const analyzeKeys = (o: Record<string, unknown> | unknown[]) => {
    if (Array.isArray(o)) {
      o.forEach((item) => analyzeKeys(item as Record<string, unknown> | unknown[]));
    } else if (o !== null && typeof o === "object") {
      for (const key in o) {
        const format = detectCaseFormat(key);
        formatCounts[format] = (formatCounts[format] || 0) + 1;
        analyzeKeys(o[key] as Record<string, unknown> | unknown[]);
      }
    }
  };

  analyzeKeys(obj);
  return formatCounts;
}

function getMostCommonFormat(formatCounts: Record<string, number>): string {
  let maxCount = 0;
  let mostCommon = "mixed";

  for (const [format, count] of Object.entries(formatCounts)) {
    if (count > maxCount && format !== "unknown" && format !== "mixed") {
      maxCount = count;
      mostCommon = format;
    }
  }

  return mostCommon;
}

function convertCase(str: string, toCase: CaseType): string {
  let words: string[] = [];

  if (/^[A-Z_]+$/.test(str) && str.includes("_")) {
    words = str.split("_").filter((w) => w.length > 0);
  } else if (str.includes("_")) {
    words = str.split("_").filter((w) => w.length > 0);
  } else if (str.includes("-")) {
    words = str.split("-").filter((w) => w.length > 0);
  } else if (str.includes(".")) {
    words = str.split(".").filter((w) => w.length > 0);
  } else if (/[A-Z]/.test(str)) {
    words = str
      .replace(/([A-Z])/g, " $1")
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
  } else if (/^[a-z]+$/.test(str)) {
    words = [str];
  } else {
    words = [str];
  }

  words = words.map((w) => w.toLowerCase());

  switch (toCase) {
    case "camelCase":
      return words
        .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
        .join("");
    case "PascalCase":
      return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
    case "snake_case":
      return words.join("_");
    case "SCREAMING_SNAKE_CASE":
      return words.map((w) => w.toUpperCase()).join("_");
    case "kebab-case":
      return words.join("-");
    case "dot.case":
      return words.join(".");
    default:
      return str;
  }
}

function convertJsonKeys(obj: unknown, toCase: CaseType): unknown {
  if (Array.isArray(obj)) {
    return obj.map((item) => convertJsonKeys(item, toCase));
  }

  if (obj !== null && typeof obj === "object") {
    const newObj: Record<string, unknown> = {};
    for (const key in obj as Record<string, unknown>) {
      const newKey = convertCase(key, toCase);
      newObj[newKey] = convertJsonKeys((obj as Record<string, unknown>)[key], toCase);
    }
    return newObj;
  }

  return obj;
}

export default function CasingConverterPage() {
  const [input, setInput] = useState("");
  const [targetCase, setTargetCase] = useState<CaseType>("snake_case");
  const [detectedFormat, setDetectedFormat] = useState<string>("");

  const convertFn = useCallback(
    (value: string): string => {
      const parsed = JSON.parse(value);
      const formatCounts = analyzeJsonFormat(parsed);
      setDetectedFormat(getMostCommonFormat(formatCounts));
      const converted = convertJsonKeys(parsed, targetCase);
      return JSON.stringify(converted, null, 2);
    },
    [targetCase]
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
    setDetectedFormat("");
    clear();
  }, [clear]);

  useKeyboardShortcuts({
    shortcuts: [
      { key: "Enter", ctrl: true, action: convert, description: "Convert" },
      {
        key: "c",
        ctrl: true,
        shift: true,
        action: handleCopyOutput,
        description: "Copy output",
      },
      {
        key: "x",
        ctrl: true,
        shift: true,
        action: handleClear,
        description: "Clear all",
      },
    ],
  });

  const ratio =
    input.length > 0 && output.length > 0
      ? `${((output.length / input.length) * 100).toFixed(0)}% of original`
      : null;

  return (
    <ToolLayout
      title="JSON Key Casing Converter"
      description="Convert JSON object keys between different casing formats"
    >
      <div className="space-y-3">
        <ActionToolbar
          left={
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Target Format</span>
                {detectedFormat && (
                  <Badge variant="secondary" className="text-xs">
                    Detected: {detectedFormat}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {cases.map(({ value, label, example }) => (
                  <button
                    key={value}
                    onClick={() => setTargetCase(value)}
                    aria-label={`Convert to ${label}`}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      targetCase === value
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    <div className="text-xs font-medium truncate">{label}</div>
                    <div
                      className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate"
                      title={example}
                    >
                      {example}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          }
          right={
            <>
              <Button
                onClick={convert}
                size="sm"
                aria-label={`Convert keys to ${cases.find((c) => c.value === targetCase)?.label}`}
              >
                Convert
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                size="sm"
                disabled={isEmpty}
                aria-label="Clear all"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </>
          }
        />

        <StatsBar
          inputLength={input.length}
          outputLength={output.length}
          ratio={ratio}
          visible={!isEmpty}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Input JSON</Label>
            <CodeEditor
              language="json"
              value={input}
              onChange={setInput}
              placeholder="Enter JSON object..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Output ({cases.find((c) => c.value === targetCase)?.label})
            </Label>
            {error ? (
              <CodeEditor language="text" value={error} readOnly placeholder="" />
            ) : output ? (
              <CodeEditor language="json" value={output} readOnly label="Result" />
            ) : (
              <div className="rounded-md border bg-background min-h-[200px] flex items-center justify-center">
                <EmptyState
                  icon={CaseSensitive}
                  message="Enter JSON to convert key casing"
                />
              </div>
            )}
          </div>
        </div>

        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
          <Braces className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <AlertDescription className="text-xs">
            <strong>Note:</strong> Only JSON keys are converted. Values like{" "}
            <code className="bg-muted px-1 rounded">&quot;John Doe&quot;</code>,{" "}
            <code className="bg-muted px-1 rounded">120000</code>, and{" "}
            <code className="bg-muted px-1 rounded">true</code> remain unchanged.
            Nested objects and arrays are fully supported.
          </AlertDescription>
        </Alert>
      </div>
    </ToolLayout>
  );
}
