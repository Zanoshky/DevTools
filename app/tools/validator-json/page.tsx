import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToolLayout } from "@/components/tool-layout";
import { CodeEditor } from "@/components/code-editor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAutoConvert } from "@/hooks/use-auto-convert";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { ActionToolbar } from "@/components/action-toolbar";
import { StatsBar } from "@/components/stats-bar";
import { EmptyState } from "@/components/empty-state";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck,
  Info,
  BarChart3,
  Loader2,
  Trash2,
} from "lucide-react";
import yaml from "js-yaml";

type ValidatorMode = "json" | "yaml" | "xml" | "csv" | "toml";

interface ValidationError {
  line: number;
  column: number;
  message: string;
  type: "syntax" | "structure" | "format";
  suggestion?: string;
  linePreview?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  type?: string;
  stats?: Record<string, number | string>;
  formatted?: string;
  preview?: string[][];
}

import { parseTOML, serializeTOML } from "@/lib/toml";

// --- Shared helpers ---
function calculateDepth(obj: unknown, currentDepth = 0): number {
  if (typeof obj !== "object" || obj === null) return currentDepth;
  let maxDepth = currentDepth;
  const items = Array.isArray(obj) ? obj : Object.values(obj as Record<string, unknown>);
  for (const item of items) {
    maxDepth = Math.max(maxDepth, calculateDepth(item, currentDepth + 1));
  }
  return maxDepth;
}

function collectObjectStats(obj: unknown) {
  let keys = 0, arrayItems = 0, objects = 0, arrays = 0;
  let booleans = 0, numbers = 0, strings = 0, nulls = 0;
  let maxArrayLength = 0, emptyStrings = 0, emptyArrays = 0, emptyObjects = 0;
  const uniqueKeysSet = new Set<string>();

  function walk(val: unknown) {
    if (Array.isArray(val)) {
      arrays++;
      if (val.length === 0) emptyArrays++;
      arrayItems += val.length;
      maxArrayLength = Math.max(maxArrayLength, val.length);
      val.forEach(walk);
    } else if (val && typeof val === "object") {
      objects++;
      const objKeys = Object.keys(val);
      if (objKeys.length === 0) emptyObjects++;
      keys += objKeys.length;
      objKeys.forEach((k) => uniqueKeysSet.add(k));
      Object.values(val).forEach(walk);
    } else if (typeof val === "boolean") booleans++;
    else if (typeof val === "number") numbers++;
    else if (typeof val === "string") { strings++; if (val === "") emptyStrings++; }
    else if (val === null) nulls++;
  }
  walk(obj);
  return { keys, arrayItems, objects, arrays, booleans, numbers, strings, nulls, maxArrayLength, uniqueKeys: uniqueKeysSet.size, emptyStrings, emptyArrays, emptyObjects };
}

// --- JSON validator ---
function validateJSON(input: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const lines = input.split("\n");
  let parsed: unknown = null;
  let isValid = true;

  try {
    parsed = JSON.parse(input);
  } catch (err: unknown) {
    isValid = false;
    const msg = err instanceof Error ? err.message : "Unknown error";
    let line = 1, column = 1;
    const posMatch = msg.match(/position (\d+)/);
    if (posMatch) {
      const pos = parseInt(posMatch[1]);
      const before = input.substring(0, pos);
      line = before.split("\n").length;
      column = (before.split("\n").pop()?.length || 0) + 1;
    }
    let suggestion = "";
    if (msg.includes("Unexpected end")) suggestion = "Check for unclosed objects {} or arrays []";
    else if (msg.includes("Unexpected token")) suggestion = "Check for trailing commas, missing quotes, or invalid syntax";
    errors.push({ line, column, message: msg, type: "syntax", suggestion, linePreview: lines[line - 1]?.substring(0, 100) });
  }

  if (isValid) {
    lines.forEach((l, i) => {
      const t = l.trim();
      if (t.endsWith(",}") || t.endsWith(",]")) {
        warnings.push({ line: i + 1, column: l.indexOf(",") + 1, message: "Trailing comma detected", type: "format", suggestion: "Remove the comma before the closing bracket/brace" });
      }
    });
  }

  const objStats = isValid ? collectObjectStats(parsed) : undefined;
  const stats = isValid && objStats ? {
    Lines: lines.length, Characters: input.length, Bytes: new Blob([input]).size,
    Depth: calculateDepth(parsed), Objects: objStats.objects, Arrays: objStats.arrays,
    Keys: objStats.keys, "Unique Keys": objStats.uniqueKeys, Strings: objStats.strings,
    Numbers: objStats.numbers, Booleans: objStats.booleans, Nulls: objStats.nulls,
  } : undefined;

  const type = Array.isArray(parsed) ? "array" : (typeof parsed === "object" && parsed !== null) ? "object" : "primitive";
  const formatted = isValid ? JSON.stringify(parsed, null, 2) : undefined;
  return { isValid, errors, warnings, type, stats, formatted };
}

// --- YAML validator ---
function validateYAML(input: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const lines = input.split("\n");
  let parsed: unknown = null;
  let isValid = true;

  try {
    parsed = yaml.load(input);
  } catch (err: unknown) {
    isValid = false;
    const msg = err instanceof Error ? err.message : "Unknown error";
    let line = 1, column = 1, suggestion = "";
    const lineMatch = msg.match(/\((\d+):(\d+)\)/);
    if (lineMatch) { line = parseInt(lineMatch[1]); column = parseInt(lineMatch[2]); }
    if (msg.includes("duplicated mapping key")) suggestion = "Remove or rename the duplicate key";
    else if (msg.includes("bad indentation")) suggestion = "Check your indentation - YAML requires consistent spacing";
    errors.push({ line, column, message: msg, type: "syntax", suggestion, linePreview: lines[line - 1]?.substring(0, 100) });
  }

  if (isValid && input.includes("\t")) {
    const tabLine = lines.findIndex((l) => l.includes("\t"));
    if (tabLine >= 0) {
      warnings.push({ line: tabLine + 1, column: 0, message: "Tabs detected in YAML", type: "format", suggestion: "YAML recommends using spaces instead of tabs for indentation" });
    }
  }

  const objStats = isValid ? collectObjectStats(parsed) : undefined;
  const stats = isValid && objStats ? {
    Lines: lines.length, Characters: input.length, Bytes: new Blob([input]).size,
    Depth: calculateDepth(parsed), Objects: objStats.objects, Arrays: objStats.arrays,
    Keys: objStats.keys, "Unique Keys": objStats.uniqueKeys, Strings: objStats.strings,
    Numbers: objStats.numbers, Booleans: objStats.booleans, Nulls: objStats.nulls,
  } : undefined;

  const type = Array.isArray(parsed) ? "array" : (typeof parsed === "object" && parsed !== null) ? "object" : "primitive";
  const formatted = isValid ? yaml.dump(parsed, { indent: 2, lineWidth: 120 }) : undefined;
  return { isValid, errors, warnings, type, stats, formatted };
}

// --- XML validator ---
function validateXML(input: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const lines = input.split("\n");
  let isValid = true;
  let doc: Document | null = null;

  try {
    const parser = new DOMParser();
    doc = parser.parseFromString(input, "text/xml");
    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      isValid = false;
      const errorText = parseError.textContent || "XML parsing error";
      let line = 1, column = 1, suggestion = "";
      const lineMatch = errorText.match(/line (\d+)/i);
      const colMatch = errorText.match(/column (\d+)/i);
      if (lineMatch) line = parseInt(lineMatch[1]);
      if (colMatch) column = parseInt(colMatch[1]);
      if (errorText.includes("mismatched tag")) suggestion = "Check that all opening tags have matching closing tags";
      else if (errorText.includes("not well-formed")) suggestion = "Check for unclosed tags, invalid characters, or syntax errors";
      errors.push({ line, column, message: errorText, type: "syntax", suggestion, linePreview: lines[line - 1]?.substring(0, 100) });
    }
  } catch (err: unknown) {
    isValid = false;
    errors.push({ line: 1, column: 1, message: err instanceof Error ? err.message : "Unknown error", type: "syntax" });
  }

  if (isValid && doc) {
    if (!input.trim().startsWith("<?xml")) {
      warnings.push({ line: 1, column: 1, message: "Missing XML declaration", type: "format", suggestion: 'Add <?xml version="1.0" encoding="UTF-8"?> at the beginning' });
    }
  }

  let stats: Record<string, number | string> | undefined;
  if (isValid && doc?.documentElement) {
    let elements = 0, attributes = 0, textNodes = 0, comments = 0, emptyElements = 0;
    const ns = new Set<string>();
    function walkXml(node: Node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        elements++;
        const el = node as Element;
        attributes += el.attributes.length;
        if (el.namespaceURI) ns.add(el.namespaceURI);
        if (!el.textContent?.trim() && el.childNodes.length === 0) emptyElements++;
        Array.from(el.childNodes).forEach(walkXml);
      } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) textNodes++;
      else if (node.nodeType === Node.COMMENT_NODE) comments++;
    }
    walkXml(doc.documentElement);
    const xmlDepth = (function calcDepth(n: Node, d = 0): number {
      let max = d;
      n.childNodes.forEach((c) => { if (c.nodeType === Node.ELEMENT_NODE) max = Math.max(max, calcDepth(c, d + 1)); });
      return max;
    })(doc.documentElement);
    stats = {
      Lines: lines.length, Characters: input.length, Bytes: new Blob([input]).size,
      Depth: xmlDepth, Elements: elements, Attributes: attributes,
      "Text Nodes": textNodes, Comments: comments, Namespaces: ns.size, "Empty Elements": emptyElements,
      "Root Element": doc.documentElement.tagName,
    };
  }

  let formatted: string | undefined;
  if (isValid) {
    try {
      const serializer = new XMLSerializer();
      let f = serializer.serializeToString(doc!);
      f = f.replace(/></g, ">\n<");
      const fLines = f.split("\n");
      let indent = 0;
      formatted = fLines.map((l) => {
        const t = l.trim();
        if (t.startsWith("</")) indent = Math.max(0, indent - 1);
        const indented = "  ".repeat(indent) + t;
        if (t.startsWith("<") && !t.startsWith("</") && !t.endsWith("/>") && !t.includes("</")) indent++;
        return indented;
      }).join("\n");
    } catch { formatted = undefined; }
  }

  return { isValid, errors, warnings, type: stats?.["Root Element"] as string, stats, formatted };
}

// --- CSV validator ---
function parseCSVRows(csvString: string, delim: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  for (let i = 0; i < csvString.length; i++) {
    const char = csvString[i];
    const next = csvString[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') { currentField += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === delim && !inQuotes) {
      currentRow.push(currentField); currentField = "";
    } else if (char === "\n" && !inQuotes) {
      currentRow.push(currentField);
      if (currentRow.some((f) => f.trim() !== "")) rows.push(currentRow);
      currentRow = []; currentField = "";
    } else if (char === "\r" && next === "\n" && !inQuotes) {
      currentRow.push(currentField);
      if (currentRow.some((f) => f.trim() !== "")) rows.push(currentRow);
      currentRow = []; currentField = ""; i++;
    } else currentField += char;
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((f) => f.trim() !== "")) rows.push(currentRow);
  }
  return rows;
}

function validateCSV(input: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const lines = input.split("\n");
  let isValid = true;

  try {
    const rows = parseCSVRows(input, ",");
    if (rows.length === 0) return { isValid: false, errors: [{ line: 1, column: 1, message: "No valid rows found", type: "structure" }], warnings: [] };

    const expectedCols = rows[0].length;
    let emptyCells = 0;
    rows.forEach((row, idx) => {
      if (row.length !== expectedCols) {
        errors.push({ line: idx + 1, column: 1, message: `Expected ${expectedCols} columns, got ${row.length}`, type: "structure", suggestion: "Ensure all rows have the same number of columns", linePreview: lines[idx]?.substring(0, 100) });
        isValid = false;
      }
      row.forEach((cell) => { if (cell.trim() === "") emptyCells++; });
    });

    // Detect header
    let hasHeader = false;
    if (rows.length > 1) {
      const first = rows[0];
      const second = rows[1];
      let score = 0;
      if (!first.some(c => !isNaN(Number(c)) && c.trim() !== "") && second.some(c => !isNaN(Number(c)) && c.trim() !== "")) score += 2;
      if (new Set(first.filter(c => c.trim())).size === first.filter(c => c.trim()).length) score += 2;
      const hdrKw = /^(id|name|email|date|time|age|price|amount|total|count|status|type|category|description|address|phone|city|country|code|number|value|title)/i;
      if (first.some(c => hdrKw.test(c.trim()))) score += 2;
      hasHeader = score >= 4;
    }

    const stats: Record<string, number | string> = {
      "Total Rows": rows.length, "Data Rows": hasHeader ? rows.length - 1 : rows.length,
      Columns: expectedCols, "Total Cells": rows.reduce((s, r) => s + r.length, 0),
      "Empty Cells": emptyCells, Characters: input.length, Bytes: new Blob([input]).size,
    };

    const preview = rows.slice(0, 10);
    return { isValid: isValid && errors.length === 0, errors, warnings, type: `${rows.length} rows x ${expectedCols} cols`, stats, preview };
  } catch (err: unknown) {
    return { isValid: false, errors: [{ line: 1, column: 1, message: err instanceof Error ? err.message : "Unknown error", type: "syntax" }], warnings: [] };
  }
}

// --- TOML validator ---
function validateTOML(input: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const lines = input.split("\n");
  let parsed: unknown = null;
  let isValid = true;

  try {
    parsed = parseTOML(input);
    // Basic sanity: if input has content but parsed is empty, might be malformed
    if (input.trim() && Object.keys(parsed as Record<string, unknown>).length === 0) {
      const hasKV = lines.some(l => l.trim() && !l.trim().startsWith("#") && l.includes("="));
      if (!hasKV && lines.some(l => l.trim() && !l.trim().startsWith("#"))) {
        isValid = false;
        errors.push({ line: 1, column: 1, message: "No valid TOML key-value pairs found", type: "syntax", suggestion: "TOML requires key = value format" });
      }
    }
  } catch (err: unknown) {
    isValid = false;
    errors.push({ line: 1, column: 1, message: err instanceof Error ? err.message : "Unknown error", type: "syntax" });
  }

  const objStats = isValid && parsed ? collectObjectStats(parsed) : undefined;
  const stats = isValid && objStats ? {
    Lines: lines.length, Characters: input.length, Bytes: new Blob([input]).size,
    Depth: calculateDepth(parsed), Tables: objStats.objects, Keys: objStats.keys,
    Strings: objStats.strings, Numbers: objStats.numbers, Booleans: objStats.booleans, Arrays: objStats.arrays,
  } : undefined;

  // Format as TOML-like output (show as JSON for now since we have a basic parser)
  const formatted = isValid && parsed ? JSON.stringify(parsed, null, 2) : undefined;
  return { isValid, errors, warnings, type: "document", stats, formatted };
}

const MODE_CONFIG: Record<ValidatorMode, { label: string; language: "json" | "yaml" | "xml" | "csv" | "toml"; placeholder: string }> = {
  json: { label: "JSON", language: "json", placeholder: '{"key": "value"}' },
  yaml: { label: "YAML", language: "yaml", placeholder: "key: value\nlist:\n  - item1" },
  xml: { label: "XML", language: "xml", placeholder: '<root>\n  <item>value</item>\n</root>' },
  csv: { label: "CSV", language: "csv", placeholder: "name,email,age\nJohn,[email],30" },
  toml: { label: "TOML", language: "toml", placeholder: '[server]\nhost = "localhost"\nport = 8080' },
};

export default function DataValidatorPage() {
  const [mode, setMode] = useState<ValidatorMode>("json");
  const [input, setInput] = useState("");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [hasHeaderToggle, setHasHeaderToggle] = useState(true);

  const config = MODE_CONFIG[mode];

  const validate = useCallback((value: string, m: ValidatorMode): ValidationResult => {
    switch (m) {
      case "json": return validateJSON(value);
      case "yaml": return validateYAML(value);
      case "xml": return validateXML(value);
      case "csv": return validateCSV(value);
      case "toml": return validateTOML(value);
    }
  }, []);

  const validateFn = useCallback(
    (value: string): string => {
      const result = validate(value, mode);
      setValidationResult(result);
      if (!result.isValid) throw new Error(result.errors[0]?.message ?? `Invalid ${mode.toUpperCase()}`);
      return `Valid ${mode.toUpperCase()}`;
    },
    [validate, mode]
  );

  const { error, isProcessing, convert, clear: clearConversion } = useAutoConvert({ input, convertFn: validateFn });

  const handleClear = useCallback(() => {
    setInput("");
    setValidationResult(null);
    clearConversion();
  }, [clearConversion]);

  const handleFormat = useCallback(() => {
    try {
      switch (mode) {
        case "json": { const p = JSON.parse(input); setInput(JSON.stringify(p, null, 2)); break; }
        case "yaml": { const p = yaml.load(input); setInput(yaml.dump(p, { indent: 2, lineWidth: 120 })); break; }
        case "xml": {
          const parser = new DOMParser();
          const doc = parser.parseFromString(input, "text/xml");
          if (!doc.querySelector("parsererror")) {
            const s = new XMLSerializer();
            let f = s.serializeToString(doc).replace(/></g, ">\n<");
            const fLines = f.split("\n");
            let indent = 0;
            f = fLines.map((l) => {
              const t = l.trim();
              if (t.startsWith("</")) indent = Math.max(0, indent - 1);
              const indented = "  ".repeat(indent) + t;
              if (t.startsWith("<") && !t.startsWith("</") && !t.endsWith("/>") && !t.includes("</")) indent++;
              return indented;
            }).join("\n");
            setInput(f);
          }
          break;
        }
        case "csv": {
          const rows = parseCSVRows(input, ",");
          setInput(rows.map((r) => r.join(",")).join("\n"));
          break;
        }
        case "toml": {
          const p = parseTOML(input);
          setInput(serializeTOML(p));
          break;
        }
      }
    } catch { /* validation will show error */ }
  }, [input, mode]);

  const handleMinify = useCallback(() => {
    if (mode === "json") {
      try { setInput(JSON.stringify(JSON.parse(input))); } catch { /* noop */ }
    }
  }, [input, mode]);

  const handleModeChange = useCallback((newMode: string) => {
    setMode(newMode as ValidatorMode);
    setValidationResult(null);
    clearConversion();
  }, [clearConversion]);

  const isEmpty = input.length === 0;

  useKeyboardShortcuts({
    shortcuts: [
      { key: "x", ctrl: true, shift: true, action: handleClear, description: "Clear all" },
    ],
  });

  return (
    <ToolLayout
      title="Data Validator"
      description="Validate JSON, YAML, XML, CSV, and TOML with error reporting, statistics, and formatting"
    >
      <div className="space-y-3">
        <ActionToolbar
          left={
            <Tabs value={mode} onValueChange={handleModeChange}>
              <TabsList className="h-8">
                {(Object.keys(MODE_CONFIG) as ValidatorMode[]).map((m) => (
                  <TabsTrigger key={m} value={m} className="text-xs px-3">{MODE_CONFIG[m].label}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          }
          right={
            <>
              <Button onClick={convert} size="sm" aria-label={`Validate ${config.label}`}>
                <FileCheck className="h-4 w-4 mr-2" aria-hidden="true" />
                Validate
              </Button>
              <Button onClick={handleFormat} variant="outline" size="sm" aria-label={`Format ${config.label}`}>
                Format
              </Button>
              {mode === "json" && (
                <Button onClick={handleMinify} variant="outline" size="sm" aria-label="Minify JSON">
                  Minify
                </Button>
              )}
              <Button onClick={handleClear} variant="outline" size="sm" disabled={isEmpty} aria-label="Clear input">
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </>
          }
        />

        <StatsBar inputLength={input.length} visible={!isEmpty} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{config.label} Input</Label>
            <CodeEditor
              language={config.language}
              value={input}
              onChange={setInput}
              placeholder={`Enter ${config.label} to validate...`}
            />
          </div>

          {/* Results */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Validation Results</Label>
            <div className="border rounded-lg p-3 bg-card min-h-[520px] overflow-y-auto">
              {isEmpty ? (
                <div className="flex items-center justify-center h-full">
                  <EmptyState icon={FileCheck} message={`Enter ${config.label} to validate`} />
                </div>
              ) : isProcessing ? (
                <div className="flex items-center gap-2 p-4" role="status">
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  <span>Validating...</span>
                </div>
              ) : error ? (
                <ErrorDisplay error={error} result={validationResult} mode={mode} />
              ) : validationResult ? (
                <SuccessDisplay result={validationResult} mode={mode} />
              ) : null}
            </div>
          </div>
        </div>

        {/* CSV Preview */}
        {mode === "csv" && validationResult?.preview && validationResult.preview.length > 0 && (
          <CSVPreview preview={validationResult.preview} hasHeaderToggle={hasHeaderToggle} setHasHeaderToggle={setHasHeaderToggle} totalRows={Number(validationResult.stats?.["Total Rows"] || 0)} />
        )}
      </div>
    </ToolLayout>
  );
}

function ErrorDisplay({ error, result, mode }: { error: string; result: ValidationResult | null; mode: ValidatorMode }) {
  const label = mode.toUpperCase();
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 p-3 rounded-lg border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800" role="alert">
        <XCircle className="h-5 w-5 text-red-500 mt-0.5" aria-hidden="true" />
        <div>
          <p className="font-semibold text-red-600 dark:text-red-400">Invalid {label}</p>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          {result?.errors[0]?.line && (
            <p className="text-xs text-muted-foreground mt-1">Line {result.errors[0].line}, Column {result.errors[0].column}</p>
          )}
        </div>
      </div>
      {result && result.errors.length > 0 && (
        <div className="space-y-2">
          {result.errors.map((err, i) => (
            <Alert key={i} variant="destructive" className="text-xs">
              <XCircle className="h-3 w-3" aria-hidden="true" />
              <AlertDescription className="space-y-1">
                <div className="font-medium text-xs">Line {err.line}, Column {err.column}</div>
                <div className="text-xs">{err.message}</div>
                {err.linePreview && (
                  <div className="text-xs bg-red-100 dark:bg-red-950/40 p-2 rounded border border-red-300 dark:border-red-700 mt-1 font-mono overflow-x-auto">
                    <div className="text-red-700 dark:text-red-300 whitespace-nowrap">{err.linePreview}{err.linePreview.length >= 100 && "..."}</div>
                  </div>
                )}
                {err.suggestion && (
                  <div className="text-xs bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-200 dark:border-red-800 mt-1">
                    <strong>Suggestion:</strong> {err.suggestion}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
}

function SuccessDisplay({ result, mode }: { result: ValidationResult; mode: ValidatorMode }) {
  const label = mode.toUpperCase();
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-3 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
        <CheckCircle2 className="h-5 w-5 text-green-500" aria-hidden="true" />
        <span className="font-semibold text-green-600 dark:text-green-400">Valid {label}</span>
        {result.type && <Badge variant="outline" className="ml-auto">{result.type}</Badge>}
      </div>

      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="warnings" className="text-xs">Warnings ({result.warnings.length})</TabsTrigger>
          <TabsTrigger value="stats" className="text-xs">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="warnings" className="space-y-2 mt-3">
          {result.warnings.length > 0 ? (
            result.warnings.map((w, i) => (
              <Alert key={i} className="text-xs">
                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                <AlertDescription className="space-y-1">
                  {w.line > 0 && <div className="font-medium text-xs">Line {w.line}, Column {w.column}</div>}
                  <div className="text-xs">{w.message}</div>
                  {w.suggestion && (
                    <div className="text-xs bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded border border-yellow-200 dark:border-yellow-800 mt-1">
                      <strong>Suggestion:</strong> {w.suggestion}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground text-xs">
              <Info className="h-8 w-8 mx-auto mb-2 text-blue-500" aria-hidden="true" />
              <p>No warnings</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="stats" className="mt-3">
          {result.stats ? (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(result.stats).filter(([, v]) => typeof v === "number").map(([k, v]) => (
                <StatCard key={k} label={k} value={v as number} />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-xs">
              <BarChart3 className="h-8 w-8 mx-auto mb-2" aria-hidden="true" />
              <p>No statistics available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CSVPreview({ preview, hasHeaderToggle, setHasHeaderToggle, totalRows }: {
  preview: string[][]; hasHeaderToggle: boolean; setHasHeaderToggle: (v: boolean) => void; totalRows: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Data Preview</Label>
        <div className="flex items-center gap-2">
          <Label htmlFor="has-header" className="text-xs text-muted-foreground cursor-pointer">First row is header</Label>
          <Switch id="has-header" checked={hasHeaderToggle} onCheckedChange={setHasHeaderToggle} />
        </div>
      </div>
      <div className="border rounded-lg p-3 bg-card overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-muted">
              <th className="border p-2 text-left font-medium">#</th>
              {preview[0].map((_, ci) => (
                <th key={ci} className="border p-2 text-left font-medium text-xs">
                  {hasHeaderToggle && preview[0]?.[ci] ? preview[0][ci] : `Col ${ci + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.slice(hasHeaderToggle ? 1 : 0).map((row, ri) => (
              <tr key={ri}>
                <td className="border p-2 font-medium text-muted-foreground text-xs">{hasHeaderToggle ? ri + 2 : ri + 1}</td>
                {row.map((cell, ci) => (
                  <td key={ci} className="border p-2 text-xs">{cell || <span className="text-muted-foreground italic">empty</span>}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {totalRows > 10 && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Showing first {hasHeaderToggle ? 9 : 10} rows of {totalRows} total
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gradient-to-br from-primary/5 to-primary/5 rounded-lg p-2 border">
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className="text-lg font-bold">{value.toLocaleString()}</div>
    </div>
  );
}
