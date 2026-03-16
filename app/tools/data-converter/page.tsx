"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout";
import { CodeEditor } from "@/components/code-editor";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAutoConvert } from "@/hooks/use-auto-convert";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { ActionToolbar } from "@/components/action-toolbar";
import { StatsBar } from "@/components/stats-bar";
import { EmptyState } from "@/components/empty-state";
import { toast } from "@/hooks/use-toast";
import { ArrowRightLeft, Trash2, Shuffle, Sparkles } from "lucide-react";
import yaml from "js-yaml";
import xmlFormatter from "xml-formatter";

type Format = "json" | "yaml" | "xml" | "csv" | "toml";
type Separator = "," | ";" | "\t" | "|" | "auto";

const FORMAT_OPTIONS: Array<{ value: Format; label: string }> = [
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "xml", label: "XML" },
  { value: "csv", label: "CSV" },
  { value: "toml", label: "TOML" },
];

const SEPARATOR_OPTIONS = [
  { value: "auto" as Separator, label: "Auto-detect", icon: "Auto" },
  { value: "," as Separator, label: "Comma (,)", icon: "," },
  { value: ";" as Separator, label: "Semicolon (;)", icon: ";" },
  { value: "\t" as Separator, label: "Tab (\\t)", icon: "\u21E5" },
  { value: "|" as Separator, label: "Pipe (|)", icon: "|" },
];

const EDITOR_LANG: Record<Format, "json" | "yaml" | "xml" | "csv" | "toml"> = {
  json: "json",
  yaml: "yaml",
  xml: "xml",
  csv: "csv",
  toml: "toml",
};

const SAMPLE_DATA: Record<Format, string> = {
  json: `{
  "users": [
    { "name": "Alice", "age": 30, "role": "admin" },
    { "name": "Bob", "age": 25, "role": "editor" }
  ]
}`,
  yaml: `users:
  - name: Alice
    age: 30
    role: admin
  - name: Bob
    age: 25
    role: editor`,
  xml: `<users>
  <user>
    <name>Alice</name>
    <age>30</age>
    <role>admin</role>
  </user>
  <user>
    <name>Bob</name>
    <age>25</age>
    <role>editor</role>
  </user>
</users>`,
  csv: `name,age,role
Alice,30,admin
Bob,25,editor`,
  toml: `[[users]]
name = "Alice"
age = 30
role = "admin"

[[users]]
name = "Bob"
age = 25
role = "editor"`,
};

// --- Separator detection ---

function detectSeparator(csvText: string): "," | ";" | "\t" | "|" {
  const firstLine = csvText.split("\n")[0] || "";
  const counts = {
    ",": (firstLine.match(/,/g) || []).length,
    ";": (firstLine.match(/;/g) || []).length,
    "\t": (firstLine.match(/\t/g) || []).length,
    "|": (firstLine.match(/\|/g) || []).length,
  };
  const max = Math.max(...Object.values(counts));
  if (max === 0) return ",";
  return (Object.entries(counts).find(([, count]) => count === max)?.[0] as "," | ";" | "\t" | "|") || ",";
}

// --- CSV helpers (full parser with separator + quote support) ---

function parseCSV(csvText: string, separator: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === separator && !inQuotes) {
      row.push(current);
      current = "";
    } else if (char === "\r" && nextChar === "\n" && !inQuotes) {
      row.push(current);
      result.push(row);
      row = []; current = ""; i++;
    } else if (char === "\n" && !inQuotes) {
      row.push(current);
      result.push(row);
      row = []; current = "";
    } else {
      current += char;
    }
  }
  row.push(current);
  if (row.some((f) => f !== "")) result.push(row);
  return result;
}
function flattenObject(obj: unknown, prefix = ""): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (typeof obj !== "object" || obj === null) {
    result[prefix] = obj;
    return result;
  }
  if (Array.isArray(obj)) {
    result[prefix] = JSON.stringify(obj);
    return result;
  }
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, fullKey));
    } else if (Array.isArray(value)) {
      result[fullKey] = JSON.stringify(value);
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

function escapeCSVValue(value: unknown, separator: string): string {
  const str = typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "");
  if (str.includes(separator) || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function csvToJson(csv: string, separator: string, includeHeaders: boolean): unknown {
  const parsed = parseCSV(csv, separator);
  if (parsed.length === 0) throw new Error("Empty CSV");
  const headers = includeHeaders ? parsed[0] : parsed[0].map((_, i) => `column${i + 1}`);
  const dataRows = includeHeaders ? parsed.slice(1) : parsed;
  return dataRows.map((row) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      const val = row[i] || "";
      if (val === "true") obj[h] = true;
      else if (val === "false") obj[h] = false;
      else if (val === "null") obj[h] = null;
      else if (val !== "" && !isNaN(Number(val))) obj[h] = Number(val);
      else obj[h] = val;
    });
    return obj;
  });
}

function jsonToCsv(data: unknown, separator: string, includeHeaders: boolean): string {
  const rawArray = Array.isArray(data) ? data : [data];
  if (rawArray.length === 0) throw new Error("Empty data");
  const array = rawArray.map((item) => flattenObject(item));
  const headerSet = new Set<string>();
  for (const row of array) {
    for (const key of Object.keys(row)) headerSet.add(key);
  }
  const headers = Array.from(headerSet);
  const rows: string[] = [];
  if (includeHeaders) {
    rows.push(headers.map((h) => escapeCSVValue(h, separator)).join(separator));
  }
  for (const row of array) {
    rows.push(headers.map((h) => escapeCSVValue(row[h], separator)).join(separator));
  }
  return rows.join("\n");
}

import { parseTOML, serializeTOML as toTOML } from "@/lib/toml";

// --- XML helpers ---

function escapeXml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function jsonToXml(obj: unknown, root = "root"): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${root}>`;
  if (Array.isArray(obj)) {
    obj.forEach((item) => {
      xml += `<item>${typeof item === "object" ? jsonToXml(item, "item").replace(/<\?xml[^>]*\?>/, "").replace(/<\/?item>/g, "") : escapeXml(item)}</item>`;
    });
  } else if (typeof obj === "object" && obj !== null) {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const escapedKey = escapeRegExp(key);
      if (Array.isArray(value)) {
        value.forEach((item) => {
          xml += `<${key}>${typeof item === "object" ? jsonToXml(item, key).replace(/<\?xml[^>]*\?>/, "").replace(new RegExp(`</?\${escapedKey}>`, "g"), "") : escapeXml(item)}</${key}>`;
        });
      } else if (typeof value === "object" && value !== null) {
        xml += `<${key}>${jsonToXml(value, key).replace(/<\?xml[^>]*\?>/, "").replace(new RegExp(`</?\${escapedKey}>`, "g"), "")}</${key}>`;
      } else {
        xml += `<${key}>${escapeXml(value)}</${key}>`;
      }
    }
  } else {
    xml += escapeXml(obj);
  }
  xml += `</${root}>`;
  return xml;
}

function xmlToJson(xml: string): unknown {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) throw new Error("Invalid XML");
  const parseNode = (node: Node): unknown => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent?.trim() || "";
    if (node.nodeType === Node.ELEMENT_NODE) {
      const obj: Record<string, unknown> = {};
      const children = Array.from(node.childNodes);
      if (children.length === 1 && children[0].nodeType === Node.TEXT_NODE) {
        const text = children[0].textContent?.trim() || "";
        if (text === "true") return true;
        if (text === "false") return false;
        if (text !== "" && !isNaN(Number(text))) return Number(text);
        return text;
      }
      children.forEach((child: Node) => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const key = (child as Element).tagName;
          const value = parseNode(child);
          if (obj[key]) {
            if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
            (obj[key] as unknown[]).push(value);
          } else {
            obj[key] = value;
          }
        }
      });
      return obj;
    }
    return null;
  };
  return parseNode(doc.documentElement);
}

// --- Parse / Serialize ---

interface ConvertOptions {
  fromFormat: Format;
  toFormat: Format;
  indentSize: number;
  prettyXml: boolean;
  prettyJson: boolean;
  rootElement: string;
  lineWidth: number;
  flowLevel: number;
  csvSeparator: Separator;
  detectedSeparator: "," | ";" | "\t" | "|";
  includeHeaders: boolean;
}

function parseInput(input: string, opts: ConvertOptions): unknown {
  switch (opts.fromFormat) {
    case "json": return JSON.parse(input);
    case "yaml": return yaml.load(input);
    case "xml": return xmlToJson(input);
    case "csv": {
      const sep = opts.csvSeparator === "auto" ? opts.detectedSeparator : opts.csvSeparator;
      return csvToJson(input, sep, opts.includeHeaders);
    }
    case "toml": return parseTOML(input);
  }
}

function serializeOutput(data: unknown, opts: ConvertOptions): string {
  switch (opts.toFormat) {
    case "json":
      return JSON.stringify(data, null, opts.prettyJson ? opts.indentSize : 0);
    case "yaml":
      return yaml.dump(data, {
        indent: opts.indentSize,
        lineWidth: opts.lineWidth,
        flowLevel: opts.flowLevel,
        noRefs: true,
      });
    case "xml": {
      const raw = jsonToXml(data, opts.rootElement);
      return opts.prettyXml ? xmlFormatter(raw) : raw;
    }
    case "csv": {
      const sep = opts.csvSeparator === "auto" ? "," : opts.csvSeparator;
      return jsonToCsv(data, sep, opts.includeHeaders);
    }
    case "toml":
      return toTOML(data as Record<string, unknown>).trim();
  }
}

export default function DataConverterPage() {
  const [fromFormat, setFromFormat] = useState<Format>("json");
  const [toFormat, setToFormat] = useState<Format>("yaml");
  const [input, setInput] = useState(SAMPLE_DATA.json);
  const [indentSize, setIndentSize] = useState(2);
  const [prettyXml, setPrettyXml] = useState(true);
  const [prettyJson, setPrettyJson] = useState(true);
  const [rootElement, setRootElement] = useState("root");
  const [lineWidth, setLineWidth] = useState(120);
  const [flowLevel, setFlowLevel] = useState(-1);
  const [csvSeparator, setCsvSeparator] = useState<Separator>("auto");
  const [detectedSeparator, setDetectedSeparator] = useState<"," | ";" | "\t" | "|">(",");
  const [includeHeaders, setIncludeHeaders] = useState(true);

  // Load sample data when input format changes and input is empty or is a sample
  useEffect(() => {
    if (!input || Object.values(SAMPLE_DATA).some((s) => s.trim() === input.trim())) {
      setInput(SAMPLE_DATA[fromFormat]);
    }
  }, [fromFormat]);

  // Auto-detect CSV separator when input changes
  useEffect(() => {
    if (fromFormat === "csv" && input && csvSeparator === "auto") {
      setDetectedSeparator(detectSeparator(input));
    }
  }, [input, fromFormat, csvSeparator]);

  const convertFn = useCallback(
    (value: string): string => {
      const opts: ConvertOptions = {
        fromFormat, toFormat, indentSize, prettyXml, prettyJson,
        rootElement, lineWidth, flowLevel, csvSeparator, detectedSeparator, includeHeaders,
      };
      const parsed = parseInput(value, opts);
      return serializeOutput(parsed, opts);
    },
    [fromFormat, toFormat, indentSize, prettyXml, prettyJson, rootElement, lineWidth, flowLevel, csvSeparator, detectedSeparator, includeHeaders]
  );

  const { output, error, convert, clear } = useAutoConvert({ input, convertFn });

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
  }, [clear]);

  const switchFormats = useCallback(() => {
    const newFrom = toFormat;
    const newTo = fromFormat;
    setFromFormat(newFrom);
    setToFormat(newTo);
    if (output) {
      setInput(output);
      clear();
    }
  }, [fromFormat, toFormat, output, clear]);

  useKeyboardShortcuts({
    shortcuts: [
      { key: "Enter", ctrl: true, action: convert, description: "Convert" },
      { key: "c", ctrl: true, shift: true, action: handleCopyOutput, description: "Copy output" },
      { key: "x", ctrl: true, shift: true, action: handleClear, description: "Clear all" },
    ],
  });

  const ratio = input.length > 0 && output.length > 0
    ? `${((output.length / input.length) * 100).toFixed(0)}% of original`
    : null;

  const showCsvOptions = fromFormat === "csv" || toFormat === "csv";
  const showYamlOptions = toFormat === "yaml";
  const showXmlOptions = toFormat === "xml";
  const showJsonPretty = toFormat === "json";

  return (
    <ToolLayout
      title="Data Converter"
      description="Convert between JSON, YAML, XML, CSV, and TOML in one place"
    >
      <div className="space-y-3">
        <ActionToolbar
          left={
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">From:</Label>
                <div className="flex gap-1">
                  {FORMAT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { if (opt.value !== toFormat) setFromFormat(opt.value); }}
                      disabled={opt.value === toFormat}
                      aria-label={`Set input format to ${opt.label}`}
                      className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors ${
                        fromFormat === opt.value
                          ? "bg-primary/10 border-primary text-primary"
                          : opt.value === toFormat
                            ? "bg-muted text-muted-foreground/40 border-transparent cursor-not-allowed"
                            : "bg-card hover:bg-secondary"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">To:</Label>
                <div className="flex gap-1">
                  {FORMAT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { if (opt.value !== fromFormat) setToFormat(opt.value); }}
                      disabled={opt.value === fromFormat}
                      aria-label={`Set output format to ${opt.label}`}
                      className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors ${
                        toFormat === opt.value
                          ? "bg-primary/10 border-primary text-primary"
                          : opt.value === fromFormat
                            ? "bg-muted text-muted-foreground/40 border-transparent cursor-not-allowed"
                            : "bg-card hover:bg-secondary"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label htmlFor="dc-indent" className="text-xs text-muted-foreground whitespace-nowrap">Indent:</Label>
                  <Input
                    id="dc-indent"
                    type="number"
                    value={indentSize}
                    onChange={(e) => setIndentSize(Math.max(1, Math.min(8, parseInt(e.target.value) || 2)))}
                    className="h-8 w-16 text-xs"
                    min="1"
                    max="8"
                  />
                </div>

                {showJsonPretty && (
                  <div className="flex items-center gap-1.5">
                    <Switch id="dc-pretty-json" checked={prettyJson} onCheckedChange={setPrettyJson} className="scale-75" />
                    <Label htmlFor="dc-pretty-json" className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">Pretty</Label>
                  </div>
                )}

                {showYamlOptions && (
                  <>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="dc-linewidth" className="text-xs text-muted-foreground whitespace-nowrap">Width:</Label>
                      <Input
                        id="dc-linewidth"
                        type="number"
                        value={lineWidth}
                        onChange={(e) => setLineWidth(Math.max(40, Math.min(200, parseInt(e.target.value) || 120)))}
                        className="h-8 w-16 text-xs"
                        min="40"
                        max="200"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="dc-flow" className="text-xs text-muted-foreground whitespace-nowrap">Flow:</Label>
                      <Input
                        id="dc-flow"
                        type="number"
                        value={flowLevel}
                        onChange={(e) => setFlowLevel(parseInt(e.target.value) || -1)}
                        className="h-8 w-16 text-xs"
                        min="-1"
                        max="10"
                        title="-1 for block style, 0+ for flow style at that level"
                      />
                    </div>
                  </>
                )}

                {showXmlOptions && (
                  <>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="dc-root" className="text-xs text-muted-foreground whitespace-nowrap">Root:</Label>
                      <Input id="dc-root" value={rootElement} onChange={(e) => setRootElement(e.target.value)} className="h-8 w-20 text-xs" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Switch id="dc-pretty-xml" checked={prettyXml} onCheckedChange={setPrettyXml} className="scale-75" />
                      <Label htmlFor="dc-pretty-xml" className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">Format</Label>
                    </div>
                  </>
                )}

                {showCsvOptions && (
                  <>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">Sep:</Label>
                      <div className="flex gap-1">
                        {SEPARATOR_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setCsvSeparator(opt.value)}
                            aria-label={`Set separator to ${opt.label}`}
                            className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors ${
                              csvSeparator === opt.value
                                ? "bg-primary/10 border-primary text-primary"
                                : "bg-card hover:bg-secondary"
                            }`}
                          >
                            {opt.icon}
                          </button>
                        ))}
                      </div>
                      {fromFormat === "csv" && csvSeparator === "auto" && input && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          <Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />
                          {SEPARATOR_OPTIONS.find((o) => o.value === detectedSeparator)?.icon}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Switch id="dc-headers" checked={includeHeaders} onCheckedChange={setIncludeHeaders} className="scale-75" />
                      <Label htmlFor="dc-headers" className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">Headers</Label>
                    </div>
                  </>
                )}
              </div>
            </div>
          }
          right={
            <>
              <Button onClick={convert} size="sm" aria-label="Convert">Convert</Button>
              <Button onClick={switchFormats} variant="outline" size="sm" className="gap-2" aria-label="Switch formats">
                <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Switch
              </Button>
              <Button onClick={handleClear} variant="outline" size="sm" disabled={isEmpty} aria-label="Clear all">
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </>
          }
        />

        <StatsBar inputLength={input.length} outputLength={output.length} ratio={ratio} visible={!isEmpty} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{FORMAT_OPTIONS.find((f) => f.value === fromFormat)?.label} Input</Label>
            <CodeEditor
              language={EDITOR_LANG[fromFormat]}
              value={input}
              onChange={setInput}
              placeholder={`Enter ${fromFormat.toUpperCase()}...`}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">{FORMAT_OPTIONS.find((f) => f.value === toFormat)?.label} Output</Label>
            {error ? (
              <CodeEditor language="text" value={error} readOnly placeholder="" />
            ) : output ? (
              <CodeEditor language={EDITOR_LANG[toFormat]} value={output} readOnly label="Result" />
            ) : (
              <div className="rounded-md border bg-background min-h-[200px] flex items-center justify-center">
                <EmptyState icon={Shuffle} message={`Enter ${fromFormat.toUpperCase()} to convert to ${toFormat.toUpperCase()}`} />
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
