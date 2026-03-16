
import { useState, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout";
import { CodeEditor } from "@/components/code-editor";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ActionToolbar } from "@/components/action-toolbar";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Plus,
  Minus,
  Edit3,
  Trash2,
  ChevronUp,
  ChevronDown,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import yaml from "js-yaml";

type CompareMode = "json" | "text" | "yaml" | "csv" | "toml" | "xml" | "code";
type DiffType = "added" | "removed" | "modified" | "unchanged";
type FilterType = "all" | "added" | "removed" | "modified";

type DiffLine = {
  type: "unchanged" | "added" | "removed" | "modified";
  lineA?: number;
  lineB?: number;
  contentA?: string;
  contentB?: string;
};

type Difference = {
  path: string;
  type: DiffType;
  oldValue?: unknown;
  newValue?: unknown;
  lineA?: number;
  lineB?: number;
};

// --- Text diff (line-by-line) ---

const COMPARE_SAMPLES: Record<CompareMode, { a: string; b: string }> = {
  json: {
    a: `{
  "name": "John Doe",
  "age": 30,
  "city": "New York"
}`,
    b: `{
  "name": "John Doe",
  "age": 31,
  "city": "Boston",
  "country": "USA"
}`,
  },
  yaml: {
    a: `name: John Doe
age: 30
city: New York`,
    b: `name: John Doe
age: 31
city: Boston
country: USA`,
  },
  toml: {
    a: `name = "John Doe"
age = 30
city = "New York"`,
    b: `name = "John Doe"
age = 31
city = "Boston"
country = "USA"`,
  },
  xml: {
    a: `<person>
  <name>John Doe</name>
  <age>30</age>
  <city>New York</city>
</person>`,
    b: `<person>
  <name>John Doe</name>
  <age>31</age>
  <city>Boston</city>
  <country>USA</country>
</person>`,
  },
  csv: {
    a: `name,age,city
John Doe,30,New York
Jane Smith,28,Chicago`,
    b: `name,age,city
John Doe,31,Boston
Jane Smith,28,Chicago
Bob Lee,35,Denver`,
  },
  text: {
    a: `The quick brown fox
jumps over the lazy dog.
Hello world.`,
    b: `The quick brown fox
leaps over the lazy dog.
Hello world.
Goodbye world.`,
  },
  code: {
    a: `public class UserService {
    private final UserRepository repo;

    public UserService(UserRepository repo) {
        this.repo = repo;
    }

    public User findById(Long id) {
        return repo.findById(id).orElse(null);
    }

    public void deleteUser(Long id) {
        repo.deleteById(id);
    }
}`,
    b: `public class UserService {
    private final UserRepository repo;
    private final Logger log = LoggerFactory.getLogger(UserService.class);

    public UserService(UserRepository repo) {
        this.repo = repo;
    }

    public Optional<User> findById(Long id) {
        log.info("Finding user {}", id);
        return repo.findById(id);
    }

    public void deleteUser(Long id) {
        log.warn("Deleting user {}", id);
        repo.deleteById(id);
    }
}`,
  },
};

// --- LCS-based visual diff for side-by-side view ---

function computeVisualDiff(textA: string, textB: string): DiffLine[] {
  const linesA = textA.split("\n");
  const linesB = textB.split("\n");
  const m = linesA.length;
  const n = linesB.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = linesA[i - 1] === linesB[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // Backtrack to build diff
  const result: DiffLine[] = [];
  let i = m;
  let j = n;
  const stack: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      stack.push({ type: "unchanged", lineA: i, lineB: j, contentA: linesA[i - 1], contentB: linesB[j - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: "added", lineB: j, contentB: linesB[j - 1] });
      j--;
    } else {
      stack.push({ type: "removed", lineA: i, contentA: linesA[i - 1] });
      i--;
    }
  }

  // Reverse since we built it backwards
  for (let k = stack.length - 1; k >= 0; k--) {
    result.push(stack[k]);
  }

  return result;
}

function computeInlineChanges(oldStr: string, newStr: string): { removed: string; added: string } {
  // Find common prefix
  let prefixLen = 0;
  while (prefixLen < oldStr.length && prefixLen < newStr.length && oldStr[prefixLen] === newStr[prefixLen]) {
    prefixLen++;
  }
  // Find common suffix
  let suffixLen = 0;
  while (
    suffixLen < oldStr.length - prefixLen &&
    suffixLen < newStr.length - prefixLen &&
    oldStr[oldStr.length - 1 - suffixLen] === newStr[newStr.length - 1 - suffixLen]
  ) {
    suffixLen++;
  }
  const removed = oldStr.slice(prefixLen, oldStr.length - suffixLen);
  const added = newStr.slice(prefixLen, newStr.length - suffixLen);
  return { removed, added };
}

function compareText(textA: string, textB: string): Difference[] {
  const linesA = textA.split("\n");
  const linesB = textB.split("\n");
  const diffs: Difference[] = [];
  const maxLen = Math.max(linesA.length, linesB.length);

  for (let i = 0; i < maxLen; i++) {
    const a = i < linesA.length ? linesA[i] : undefined;
    const b = i < linesB.length ? linesB[i] : undefined;
    const lineNum = i + 1;

    if (a === undefined) {
      diffs.push({ path: `Line ${lineNum}`, type: "added", newValue: b, lineB: lineNum });
    } else if (b === undefined) {
      diffs.push({ path: `Line ${lineNum}`, type: "removed", oldValue: a, lineA: lineNum });
    } else if (a !== b) {
      const { removed, added } = computeInlineChanges(a, b);
      diffs.push({
        path: `Line ${lineNum}`,
        type: "modified",
        oldValue: removed || a,
        newValue: added || b,
        lineA: lineNum,
        lineB: lineNum,
      });
    }
  }

  return diffs;
}

// --- CSV diff (cell-by-cell) ---

function parseCSVForCompare(csv: string): string[][] {
  // RFC 4180 compliant: handles multiline quoted fields, CRLF, no value trimming
  const result: string[][] = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const nextChar = csv[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
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

function compareCSV(csvA: string, csvB: string): Difference[] {
  const rowsA = parseCSVForCompare(csvA);
  const rowsB = parseCSVForCompare(csvB);
  const diffs: Difference[] = [];
  const maxRows = Math.max(rowsA.length, rowsB.length);

  for (let r = 0; r < maxRows; r++) {
    const a = r < rowsA.length ? rowsA[r] : undefined;
    const b = r < rowsB.length ? rowsB[r] : undefined;
    const rowNum = r + 1;

    if (!a) {
      diffs.push({ path: `Row ${rowNum}`, type: "added", newValue: b?.join(", "), lineB: rowNum });
    } else if (!b) {
      diffs.push({ path: `Row ${rowNum}`, type: "removed", oldValue: a.join(", "), lineA: rowNum });
    } else {
      const maxCols = Math.max(a.length, b.length);
      for (let c = 0; c < maxCols; c++) {
        const cellA = c < a.length ? a[c] : undefined;
        const cellB = c < b.length ? b[c] : undefined;
        const colLabel = rowsA[0] && c < rowsA[0].length ? rowsA[0][c] : `Col ${c + 1}`;
        const cellPath = `Row ${rowNum}, ${colLabel}`;

        if (cellA === undefined) {
          diffs.push({ path: cellPath, type: "added", newValue: cellB, lineB: rowNum });
        } else if (cellB === undefined) {
          diffs.push({ path: cellPath, type: "removed", oldValue: cellA, lineA: rowNum });
        } else if (cellA !== cellB) {
          diffs.push({ path: cellPath, type: "modified", oldValue: cellA, newValue: cellB, lineA: rowNum, lineB: rowNum });
        }
      }
    }
  }

  return diffs;
}

// --- JSON path-line map ---

function buildPathLineMap(jsonStr: string): Map<string, number> {
  const map = new Map<string, number>();
  try {
    const obj = JSON.parse(jsonStr);
    const formatted = JSON.stringify(obj, null, 2);
    const lines = formatted.split("\n");
    const stack: Array<{ path: string; isArray: boolean; arrayIndex: number }> = [];

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed === "}" || trimmed === "}," || trimmed === "]" || trimmed === "],") {
        stack.pop();
        continue;
      }

      const keyMatch = trimmed.match(/^"([^"\\]*(?:\\.[^"\\]*)*)"\s*:\s*(.*)/);
      if (keyMatch) {
        const key = keyMatch[1];
        const rest = keyMatch[2];
        const parentPath = stack.length > 0 ? stack[stack.length - 1].path : "";
        const fullPath = parentPath ? `${parentPath}.${key}` : key;
        map.set(fullPath, i + 1);
        const cleanRest = rest.replace(/,$/, "");
        if (cleanRest === "{") stack.push({ path: fullPath, isArray: false, arrayIndex: 0 });
        else if (cleanRest === "[") stack.push({ path: fullPath, isArray: true, arrayIndex: 0 });
        continue;
      }

      if (stack.length > 0 && stack[stack.length - 1].isArray) {
        const parent = stack[stack.length - 1];
        const fullPath = `${parent.path}[${parent.arrayIndex}]`;
        map.set(fullPath, i + 1);
        parent.arrayIndex++;
        const cleaned = trimmed.replace(/,$/, "");
        if (cleaned === "{") stack.push({ path: fullPath, isArray: false, arrayIndex: 0 });
        else if (cleaned === "[") stack.push({ path: fullPath, isArray: true, arrayIndex: 0 });
      }
    }
  } catch {
    // empty
  }
  return map;
}

// --- Deep object compare ---

function deepCompare(
  obj1: unknown,
  obj2: unknown,
  path: string = "",
  diffs: Difference[] = []
): Difference[] {
  if (obj1 === null || obj1 === undefined) {
    if (obj2 === null || obj2 === undefined) return diffs;
    diffs.push({ path: path || "root", type: "added", newValue: obj2 });
    return diffs;
  }
  if (obj2 === null || obj2 === undefined) {
    diffs.push({ path: path || "root", type: "removed", oldValue: obj1 });
    return diffs;
  }
  if (typeof obj1 !== "object" || typeof obj2 !== "object") {
    if (obj1 !== obj2) diffs.push({ path, type: "modified", oldValue: obj1, newValue: obj2 });
    return diffs;
  }
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    const maxLen = Math.max(obj1.length, obj2.length);
    for (let i = 0; i < maxLen; i++) {
      const itemPath = `${path}[${i}]`;
      if (i >= obj1.length) diffs.push({ path: itemPath, type: "added", newValue: obj2[i] });
      else if (i >= obj2.length) diffs.push({ path: itemPath, type: "removed", oldValue: obj1[i] });
      else deepCompare(obj1[i], obj2[i], itemPath, diffs);
    }
    return diffs;
  }
  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
  allKeys.forEach((key) => {
    const newPath = path ? `${path}.${key}` : key;
    const o1 = obj1 as Record<string, unknown>;
    const o2 = obj2 as Record<string, unknown>;
    if (!(key in o1)) diffs.push({ path: newPath, type: "added", newValue: o2[key] });
    else if (!(key in o2)) diffs.push({ path: newPath, type: "removed", oldValue: o1[key] });
    else deepCompare(o1[key], o2[key], newPath, diffs);
  });
  return diffs;
}

function formatValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value.length > 200 ? value.slice(0, 200) + "..." : value;
  if (typeof value === "object") {
    const str = JSON.stringify(value, null, 2);
    return str.length > 200 ? str.slice(0, 200) + "..." : str;
  }
  return String(value);
}

// --- TOML parser (basic subset) ---

function parseTOML(input: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let currentTable = result;
  const lines = input.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;
    const tableMatch = line.match(/^\[([^\]]+)\]$/);
    if (tableMatch) {
      const path = tableMatch[1].split(".");
      currentTable = result;
      for (const key of path) {
        if (!(key in currentTable)) (currentTable as Record<string, unknown>)[key] = {};
        currentTable = (currentTable as Record<string, unknown>)[key] as Record<string, unknown>;
      }
      continue;
    }
    const kvMatch = line.match(/^([^=]+?)\s*=\s*(.*)/);
    if (kvMatch) {
      const key = kvMatch[1].trim().replace(/^"|"$/g, "");
      const rawValue = kvMatch[2].trim();
      (currentTable as Record<string, unknown>)[key] = parseTOMLValue(rawValue);
    }
  }
  return result;
}

function parseTOMLValue(raw: string): unknown {
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (raw.startsWith('"') && raw.endsWith('"')) return raw.slice(1, -1).replace(/\\n/g, "\n").replace(/\\"/g, '"');
  if (raw.startsWith("'") && raw.endsWith("'")) return raw.slice(1, -1);
  if (raw.startsWith("[") && raw.endsWith("]")) {
    const inner = raw.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((v) => parseTOMLValue(v.trim()));
  }
  if (/^-?\d+\.\d+$/.test(raw)) return parseFloat(raw);
  if (/^-?\d+$/.test(raw)) return parseInt(raw, 10);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw;
  return raw;
}

// --- XML parser ---

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

export default function JSONComparePage() {
  const [mode, setMode] = useState<CompareMode>("json");
  const [inputA, setInputA] = useState(COMPARE_SAMPLES.json.a);
  const [inputB, setInputB] = useState(COMPARE_SAMPLES.json.b);

  const [differences, setDifferences] = useState<Difference[]>([]);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ added: 0, removed: 0, modified: 0, unchanged: 0 });
  const [hasCompared, setHasCompared] = useState(false);
  const [visualDiff, setVisualDiff] = useState<DiffLine[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [activeDiffIndex, setActiveDiffIndex] = useState<number>(-1);
  const [copiedPath, setCopiedPath] = useState<number | null>(null);
  const diffListRef = useRef<HTMLDivElement>(null);

  const editorLanguage = mode === "yaml" ? "yaml" : mode === "json" ? "json" : mode === "csv" ? "csv" : mode === "toml" ? "toml" : mode === "xml" ? "xml" : mode === "code" ? "javascript" : "text";

  const isVisualDiffMode = mode === "text" || mode === "code";

  const runCompare = useCallback(() => {
    setError("");
    setDifferences([]);
    setVisualDiff([]);
    setHasCompared(true);
    setFilter("all");
    setActiveDiffIndex(-1);

    try {
      let diffs: Difference[] = [];

      if (mode === "text" || mode === "code") {
        diffs = compareText(inputA, inputB);
        setVisualDiff(computeVisualDiff(inputA, inputB));
      } else if (mode === "csv") {
        diffs = compareCSV(inputA, inputB);
      } else {
        // JSON, YAML, TOML, or XML - parse to objects then deep compare
        let objA: unknown;
        let objB: unknown;

        if (mode === "yaml") {
          objA = yaml.load(inputA);
          objB = yaml.load(inputB);
        } else if (mode === "toml") {
          objA = parseTOML(inputA);
          objB = parseTOML(inputB);
        } else if (mode === "xml") {
          objA = xmlToJson(inputA);
          objB = xmlToJson(inputB);
        } else {
          objA = JSON.parse(inputA);
          objB = JSON.parse(inputB);

          // Auto-format JSON inputs
          const formattedA = JSON.stringify(objA, null, 2);
          const formattedB = JSON.stringify(objB, null, 2);
          setInputA(formattedA);
          setInputB(formattedB);

          const lineMapA = buildPathLineMap(formattedA);
          const lineMapB = buildPathLineMap(formattedB);
          const rawDiffs = deepCompare(objA, objB);
          diffs = rawDiffs.map((d) => ({
            ...d,
            lineA: lineMapA.get(d.path),
            lineB: lineMapB.get(d.path),
          }));

          const added = diffs.filter((d) => d.type === "added").length;
          const removed = diffs.filter((d) => d.type === "removed").length;
          const modified = diffs.filter((d) => d.type === "modified").length;
          setStats({ added, removed, modified, unchanged: 0 });
          setDifferences(diffs);
          return;
        }

        diffs = deepCompare(objA, objB);
      }

      const added = diffs.filter((d) => d.type === "added").length;
      const removed = diffs.filter((d) => d.type === "removed").length;
      const modified = diffs.filter((d) => d.type === "modified").length;
      setStats({ added, removed, modified, unchanged: 0 });
      setDifferences(diffs);
    } catch (err) {
      setError(`Invalid ${mode.toUpperCase()}: ` + (err instanceof Error ? err.message : "Parse error"));
    }
  }, [mode, inputA, inputB]);

  const filteredDiffs = useMemo(() => {
    if (filter === "all") return differences;
    return differences.filter((d) => d.type === filter);
  }, [differences, filter]);

  const isEmpty = inputA.trim() === "" && inputB.trim() === "";

  const handleClear = useCallback(() => {
    setInputA("");
    setInputB("");
    setDifferences([]);
    setVisualDiff([]);
    setError("");
    setStats({ added: 0, removed: 0, modified: 0, unchanged: 0 });
    setHasCompared(false);
    setFilter("all");
    setActiveDiffIndex(-1);
  }, []);

  const handleCopyPath = useCallback(async (path: string, index: number) => {
    try {
      await navigator.clipboard.writeText(path);
      setCopiedPath(index);
      toast.success("Path copied");
      setTimeout(() => setCopiedPath(null), 2000);
    } catch {
      toast.error("Failed to copy path");
    }
  }, []);

  const navigateDiff = useCallback(
    (direction: "prev" | "next") => {
      if (filteredDiffs.length === 0) return;
      setActiveDiffIndex((prev) => {
        const next = direction === "next"
          ? (prev < filteredDiffs.length - 1 ? prev + 1 : 0)
          : (prev > 0 ? prev - 1 : filteredDiffs.length - 1);
        requestAnimationFrame(() => {
          const el = diffListRef.current?.querySelector(`[data-diff-index="${next}"]`);
          el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
        return next;
      });
    },
    [filteredDiffs.length]
  );

  useKeyboardShortcuts({
    shortcuts: [
      { key: "Enter", ctrl: true, action: runCompare, description: "Compare" },
      { key: "x", ctrl: true, shift: true, action: handleClear, description: "Clear all" },
    ],
  });

  const getDiffIcon = (type: DiffType) => {
    switch (type) {
      case "added": return <Plus className="h-3.5 w-3.5" />;
      case "removed": return <Minus className="h-3.5 w-3.5" />;
      case "modified": return <Edit3 className="h-3.5 w-3.5" />;
      default: return <CheckCircle2 className="h-3.5 w-3.5" />;
    }
  };

  const getDiffBorderColor = (type: DiffType) => {
    switch (type) {
      case "added": return "border-l-green-500";
      case "removed": return "border-l-red-500";
      case "modified": return "border-l-orange-500";
      default: return "border-l-blue-500";
    }
  };

  const getDiffBgColor = (type: DiffType) => {
    switch (type) {
      case "added": return "bg-green-50/50 dark:bg-green-950/10";
      case "removed": return "bg-red-50/50 dark:bg-red-950/10";
      case "modified": return "bg-orange-50/50 dark:bg-orange-950/10";
      default: return "bg-blue-50/50 dark:bg-blue-950/10";
    }
  };

  const getDiffTextColor = (type: DiffType) => {
    switch (type) {
      case "added": return "text-green-700 dark:text-green-400";
      case "removed": return "text-red-700 dark:text-red-400";
      case "modified": return "text-orange-700 dark:text-orange-400";
      default: return "text-blue-700 dark:text-blue-400";
    }
  };

  const getLineLabel = (diff: Difference) => {
    const parts: string[] = [];
    if (diff.type === "removed" || diff.type === "modified") {
      if (diff.lineA) parts.push(`A:${diff.lineA}`);
    }
    if (diff.type === "added" || diff.type === "modified") {
      if (diff.lineB) parts.push(`B:${diff.lineB}`);
    }
    if (parts.length === 0) {
      if (diff.lineA) parts.push(`A:${diff.lineA}`);
      if (diff.lineB) parts.push(`B:${diff.lineB}`);
    }
    return parts.join(" / ");
  };

  const modeLabel = mode === "json" ? "JSON" : mode === "yaml" ? "YAML" : mode === "toml" ? "TOML" : mode === "xml" ? "XML" : mode === "csv" ? "CSV" : mode === "code" ? "Code" : "Text";

  return (
    <ToolLayout
      title="Data Compare"
      description="Compare JSON, YAML, TOML, XML, CSV, or plain text side by side with detailed diff view"
    >
      <div className="space-y-3">
        <ActionToolbar
          left={
            <Tabs value={mode} onValueChange={(v) => {
              const newMode = v as CompareMode;
              setMode(newMode);
              setHasCompared(false);
              setDifferences([]);
              setError("");
              const allSamples = Object.values(COMPARE_SAMPLES);
              const isASample = allSamples.some((s) => s.a.trim() === inputA.trim());
              const isBSample = allSamples.some((s) => s.b.trim() === inputB.trim());
              if ((!inputA || isASample) && (!inputB || isBSample)) {
                setInputA(COMPARE_SAMPLES[newMode].a);
                setInputB(COMPARE_SAMPLES[newMode].b);
              }
            }}>
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="json" className="text-xs">JSON</TabsTrigger>
                <TabsTrigger value="yaml" className="text-xs">YAML</TabsTrigger>
                <TabsTrigger value="toml" className="text-xs">TOML</TabsTrigger>
                <TabsTrigger value="xml" className="text-xs">XML</TabsTrigger>
                <TabsTrigger value="csv" className="text-xs">CSV</TabsTrigger>
                <TabsTrigger value="text" className="text-xs">Text</TabsTrigger>
                <TabsTrigger value="code" className="text-xs">Code</TabsTrigger>
              </TabsList>
            </Tabs>
          }
          right={
            <>
              <Button onClick={runCompare} size="sm" aria-label={`Compare ${modeLabel}`}>
                Compare
              </Button>
              <Button onClick={handleClear} variant="outline" size="sm" disabled={isEmpty} aria-label="Clear all">
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <span className="text-sm font-medium">{modeLabel} A (Original)</span>
            <CodeEditor language={editorLanguage} value={inputA} onChange={setInputA} placeholder={`Enter first ${modeLabel}...`} />
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">{modeLabel} B (Modified)</span>
            <CodeEditor language={editorLanguage} value={inputB} onChange={setInputB} placeholder={`Enter second ${modeLabel}...`} />
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {hasCompared && differences.length === 0 && !error && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>Contents are identical - no differences found.</AlertDescription>
          </Alert>
        )}

        {/* Visual side-by-side diff for text/code modes */}
        {isVisualDiffMode && visualDiff.length > 0 && visualDiff.some((l) => l.type !== "unchanged") && (
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-2 text-[10px] font-medium text-muted-foreground bg-muted/50 border-b">
              <div className="px-3 py-1.5 border-r">Original</div>
              <div className="px-3 py-1.5">Modified</div>
            </div>
            <div className="max-h-[500px] overflow-y-auto font-mono text-xs">
              {visualDiff.map((line, i) => (
                <div key={i} className="grid grid-cols-2 min-h-[24px]">
                  {/* Left side */}
                  <div className={`flex border-r ${
                    line.type === "removed" ? "bg-red-100 dark:bg-red-950/30" :
                    line.type === "modified" ? "bg-orange-100/60 dark:bg-orange-950/20" :
                    line.type === "added" ? "bg-muted/30" : ""
                  }`}>
                    <span className="w-10 shrink-0 text-right pr-2 py-0.5 text-[10px] text-muted-foreground/60 select-none border-r bg-muted/30">
                      {line.lineA || ""}
                    </span>
                    <span className={`px-2 py-0.5 whitespace-pre overflow-x-auto flex-1 ${
                      line.type === "removed" ? "text-red-800 dark:text-red-300" :
                      line.type === "modified" ? "text-orange-800 dark:text-orange-300" : ""
                    }`}>
                      {line.type === "added" ? "" : (line.contentA ?? "")}
                    </span>
                  </div>
                  {/* Right side */}
                  <div className={`flex ${
                    line.type === "added" ? "bg-green-100 dark:bg-green-950/30" :
                    line.type === "modified" ? "bg-green-100/60 dark:bg-green-950/20" :
                    line.type === "removed" ? "bg-muted/30" : ""
                  }`}>
                    <span className="w-10 shrink-0 text-right pr-2 py-0.5 text-[10px] text-muted-foreground/60 select-none border-r bg-muted/30">
                      {line.lineB || ""}
                    </span>
                    <span className={`px-2 py-0.5 whitespace-pre overflow-x-auto flex-1 ${
                      line.type === "added" ? "text-green-800 dark:text-green-300" :
                      line.type === "modified" ? "text-green-800 dark:text-green-300" : ""
                    }`}>
                      {line.type === "removed" ? "" : (line.contentB ?? "")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {differences.length > 0 && (
          <div className="p-3 bg-card border rounded-lg space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors cursor-pointer border ${
                    filter === "all" ? "bg-foreground text-background border-foreground" : "bg-muted text-muted-foreground border-transparent hover:bg-accent"
                  }`}
                  aria-label="Show all differences"
                  aria-pressed={filter === "all"}
                >
                  All {differences.length}
                </button>
                {stats.added > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilter(filter === "added" ? "all" : "added")}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors cursor-pointer border ${
                      filter === "added" ? "bg-green-600 text-white border-green-600" : "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-transparent hover:bg-green-200 dark:hover:bg-green-950/50"
                    }`}
                    aria-label={`Filter to ${stats.added} added`}
                    aria-pressed={filter === "added"}
                  >
                    <Plus className="h-3 w-3" aria-hidden="true" />
                    {stats.added}
                  </button>
                )}
                {stats.removed > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilter(filter === "removed" ? "all" : "removed")}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors cursor-pointer border ${
                      filter === "removed" ? "bg-red-600 text-white border-red-600" : "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-transparent hover:bg-red-200 dark:hover:bg-red-950/50"
                    }`}
                    aria-label={`Filter to ${stats.removed} removed`}
                    aria-pressed={filter === "removed"}
                  >
                    <Minus className="h-3 w-3" aria-hidden="true" />
                    {stats.removed}
                  </button>
                )}
                {stats.modified > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilter(filter === "modified" ? "all" : "modified")}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors cursor-pointer border ${
                      filter === "modified" ? "bg-orange-600 text-white border-orange-600" : "bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-transparent hover:bg-orange-200 dark:hover:bg-orange-950/50"
                    }`}
                    aria-label={`Filter to ${stats.modified} modified`}
                    aria-pressed={filter === "modified"}
                  >
                    <Edit3 className="h-3 w-3" aria-hidden="true" />
                    {stats.modified}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">
                  {activeDiffIndex >= 0 ? `${activeDiffIndex + 1} / ${filteredDiffs.length}` : `${filteredDiffs.length} diffs`}
                </span>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => navigateDiff("prev")} disabled={filteredDiffs.length === 0} aria-label="Previous difference">
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => navigateDiff("next")} disabled={filteredDiffs.length === 0} aria-label="Next difference">
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>

            <div ref={diffListRef} className="space-y-1.5 max-h-[500px] overflow-y-auto" role="list" aria-label="Differences list">
              {filteredDiffs.map((diff, i) => {
                const lineLabel = getLineLabel(diff);
                const isActive = i === activeDiffIndex;
                return (
                  <div
                    key={i}
                    data-diff-index={i}
                    role="listitem"
                    onClick={() => setActiveDiffIndex(i)}
                    className={`border-l-4 rounded-r-lg border px-3 py-2 cursor-pointer transition-all ${getDiffBorderColor(diff.type)} ${getDiffBgColor(diff.type)} ${
                      isActive ? "ring-2 ring-primary/40 shadow-sm" : "hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`flex items-center gap-1.5 mt-0.5 shrink-0 ${getDiffTextColor(diff.type)}`}>
                        <span className="text-[10px] font-mono opacity-60 w-5 text-right">#{i + 1}</span>
                        {getDiffIcon(diff.type)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleCopyPath(diff.path, i); }}
                            className="font-mono text-xs font-semibold truncate max-w-[300px] hover:underline text-left"
                            title={`Click to copy: ${diff.path}`}
                            aria-label={`Copy path ${diff.path}`}
                          >
                            {copiedPath === i ? (
                              <span className="flex items-center gap-1">
                                <Check className="h-3 w-3 text-green-600" aria-hidden="true" />
                                Copied
                              </span>
                            ) : diff.path}
                          </button>
                          {lineLabel && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono shrink-0">L{lineLabel}</Badge>
                          )}
                        </div>
                        {diff.type === "added" && (
                          <div className="text-xs">
                            <span className="opacity-50">Added: </span>
                            <code className="font-mono bg-green-100 dark:bg-green-900/30 px-1 rounded text-green-800 dark:text-green-300">{formatValue(diff.newValue)}</code>
                          </div>
                        )}
                        {diff.type === "removed" && (
                          <div className="text-xs">
                            <span className="opacity-50">Removed: </span>
                            <code className="font-mono bg-red-100 dark:bg-red-900/30 px-1 rounded line-through text-red-800 dark:text-red-300">{formatValue(diff.oldValue)}</code>
                          </div>
                        )}
                        {diff.type === "modified" && (
                          <div className="text-xs flex items-center gap-1.5 flex-wrap">
                            <code className="font-mono bg-red-100 dark:bg-red-900/30 px-1 rounded line-through text-red-800 dark:text-red-300">{formatValue(diff.oldValue)}</code>
                            <ArrowRight className="h-3 w-3 opacity-40 shrink-0" aria-hidden="true" />
                            <code className="font-mono bg-green-100 dark:bg-green-900/30 px-1 rounded text-green-800 dark:text-green-300">{formatValue(diff.newValue)}</code>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
