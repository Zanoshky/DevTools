"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout";
import { CopyTextarea } from "@/components/copy-textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sparkles } from "lucide-react";

type Separator = "," | ";" | "\t" | "|" | "auto";

const SEPARATOR_OPTIONS = [
  { value: "auto" as const, label: "Auto-detect", icon: "🔍" },
  { value: "," as const, label: "Comma (,)", icon: "," },
  { value: ";" as const, label: "Semicolon (;)", icon: ";" },
  { value: "\t" as const, label: "Tab (\\t)", icon: "⇥" },
  { value: "|" as const, label: "Pipe (|)", icon: "|" },
];

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

function parseCSV(csvText: string, separator: string): string[][] {
  const lines = csvText.trim().split("\n");
  const result: string[][] = [];
  
  for (const line of lines) {
    const row: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === separator && !inQuotes) {
        row.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    
    row.push(current.trim());
    result.push(row);
  }
  
  return result;
}

function escapeCSVValue(value: unknown, separator: string): string {
  const str = String(value ?? "");
  
  if (str.includes(separator) || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

const DEFAULT_JSON = `[
  {"name":"John","age":30,"city":"New York"},
  {"name":"Jane","age":25,"city":"Los Angeles"}
]`;

const DEFAULT_CSV = `name,age,city
John,30,New York
Jane,25,Los Angeles`;

export default function JsonCsvConverterPage() {
  const [mode, setMode] = useState<"json-to-csv" | "csv-to-json">("json-to-csv");
  const [input, setInput] = useState(DEFAULT_JSON);
  const [output, setOutput] = useState("");
  const [separator, setSeparator] = useState<Separator>("auto");
  const [detectedSeparator, setDetectedSeparator] = useState<"," | ";" | "\t" | "|">(",");
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [prettyJSON, setPrettyJSON] = useState(true);

  // Auto-detect separator when input changes in CSV mode
  useEffect(() => {
    if (mode === "csv-to-json" && input && separator === "auto") {
      const detected = detectSeparator(input);
      setDetectedSeparator(detected);
    }
  }, [input, mode, separator]);

  const handleConvert = () => {
    try {
      if (mode === "json-to-csv") {
        const json = JSON.parse(input);
        const array = Array.isArray(json) ? json : [json];
        
        if (array.length === 0) {
          setOutput("Error: Empty array");
          return;
        }

        const actualSeparator = separator === "auto" ? "," : separator;
        const headers = Object.keys(array[0]);
        const rows: string[] = [];
        
        if (includeHeaders) {
          rows.push(headers.map(h => escapeCSVValue(h, actualSeparator)).join(actualSeparator));
        }
        
        array.forEach((row) => {
          const values = headers.map((h) => escapeCSVValue(row[h], actualSeparator));
          rows.push(values.join(actualSeparator));
        });

        setOutput(rows.join("\n"));
      } else {
        const actualSeparator = separator === "auto" ? detectedSeparator : separator;
        const parsed = parseCSV(input, actualSeparator);
        
        if (parsed.length === 0) {
          setOutput("Error: Empty CSV");
          return;
        }

        const headers = includeHeaders ? parsed[0] : parsed[0].map((_, i) => `column${i + 1}`);
        const dataRows = includeHeaders ? parsed.slice(1) : parsed;
        
        const json = dataRows.map((row) => {
          const obj: Record<string, unknown> = {};
          headers.forEach((h, i) => {
            const value = row[i] || "";
            // Try to parse as number or boolean
            if (value === "true") obj[h] = true;
            else if (value === "false") obj[h] = false;
            else if (value === "null") obj[h] = null;
            else if (value !== "" && !isNaN(Number(value))) obj[h] = Number(value);
            else obj[h] = value;
          });
          return obj;
        });

        setOutput(JSON.stringify(json, null, prettyJSON ? 2 : 0));
      }
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : "Invalid input"}`);
    }
  };

  const switchMode = () => {
    const newMode = mode === "json-to-csv" ? "csv-to-json" : "json-to-csv";
    setMode(newMode);
    
    // If switching and output exists, use it as input
    if (output) {
      setInput(output);
      setOutput("");
    } else {
      // Otherwise set appropriate default
      setInput(newMode === "json-to-csv" ? DEFAULT_JSON : DEFAULT_CSV);
    }
  };

  const handleModeChange = (newMode: "json-to-csv" | "csv-to-json") => {
    setMode(newMode);
    // Clear output when changing modes
    setOutput("");
    // Set appropriate default input if current input doesn't match the mode
    if (newMode === "json-to-csv" && !input.trim().startsWith("[") && !input.trim().startsWith("{")) {
      setInput(DEFAULT_JSON);
    } else if (newMode === "csv-to-json" && (input.trim().startsWith("[") || input.trim().startsWith("{"))) {
      setInput(DEFAULT_CSV);
    }
  };

  return (
    <ToolLayout
      title="JSON ↔ CSV Converter"
      description="Convert between JSON and CSV with auto-detect and custom separators"
    >
      <div className="space-y-3">
        {/* Compact Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-card border rounded-lg">
          <Tabs value={mode} onValueChange={(v) => handleModeChange(v as typeof mode)} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="json-to-csv">JSON → CSV</TabsTrigger>
              <TabsTrigger value="csv-to-json">CSV → JSON</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            {/* Separator */}
            <div className="flex items-center gap-2">
              <Label htmlFor="separator" className="text-xs text-muted-foreground whitespace-nowrap">
                Separator:
              </Label>
              <Select value={separator} onValueChange={(v) => setSeparator(v as Separator)}>
                <SelectTrigger id="separator" className="h-8 w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEPARATOR_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2 text-xs">
                        <span>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mode === "csv-to-json" && separator === "auto" && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {SEPARATOR_OPTIONS.find(opt => opt.value === detectedSeparator)?.icon}
                </Badge>
              )}
            </div>

            {/* Headers */}
            <div className="flex items-center gap-2">
              <Switch
                id="headers"
                checked={includeHeaders}
                onCheckedChange={setIncludeHeaders}
                className="scale-75"
              />
              <Label htmlFor="headers" className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
                Headers
              </Label>
            </div>

            {/* Pretty JSON */}
            {mode === "csv-to-json" && (
              <div className="flex items-center gap-2">
                <Switch
                  id="pretty"
                  checked={prettyJSON}
                  onCheckedChange={setPrettyJSON}
                  className="scale-75"
                />
                <Label htmlFor="pretty" className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
                  Pretty
                </Label>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex justify-end gap-2">
          <Button onClick={handleConvert} size="sm">
            Convert
          </Button>
          <Button onClick={switchMode} variant="outline" size="sm">
            Switch
          </Button>
        </div>

        {/* Input/Output Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {mode === "json-to-csv" ? "JSON Input" : "CSV Input"}
            </Label>
            <CopyTextarea
              value={input}
              onChange={setInput}
              placeholder={mode === "json-to-csv" ? "Enter JSON array..." : "Enter CSV..."}
              rows={20}
              className="font-mono text-xs"
            />
          </div>

          {/* Output */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {mode === "json-to-csv" ? "CSV Output" : "JSON Output"}
            </Label>
            <CopyTextarea
              value={output}
              readOnly
              placeholder="Output will appear here..."
              rows={20}
              className="font-mono text-xs"
            />
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
