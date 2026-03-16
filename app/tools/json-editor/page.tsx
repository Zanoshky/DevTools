
import { useState, useCallback } from "react";
import VanillaJSONEditor from "@/components/VanillaJSONEditor";
import { type Content, type JSONContent, Mode } from "vanilla-jsoneditor";
import { ToolLayout } from "@/components/tool-layout";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { ActionToolbar } from "@/components/action-toolbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GitCompare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeftRight,
  Trash2,
} from "lucide-react";

type DiffResult = {
  added: string[];
  removed: string[];
  modified: string[];
  unchanged: number;
};

export default function JSONEditorPage() {
  const [content, setContent] = useState<Content>({
    json: {
      name: "John Doe",
      age: 30,
      email: "john@example.com",
      address: {
        street: "123 Main St",
        city: "New York",
        country: "USA",
      },
      hobbies: ["reading", "coding", "traveling"],
      active: true,
    },
  } as JSONContent);

  const [content2, setContent2] = useState<Content>({
    json: {
      name: "John Doe",
      age: 31,
      email: "john.doe@example.com",
      address: {
        street: "123 Main St",
        city: "Los Angeles",
        country: "USA",
      },
      hobbies: ["reading", "coding"],
      active: true,
    },
  } as JSONContent);

  const [mode] = useState<Mode>(Mode.text);
  const [compareMode, setCompareMode] = useState(false);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);

  const isContentEmpty = useCallback((c: Content): boolean => {
    if ("text" in c && c.text !== undefined) {
      return c.text.trim() === "";
    }
    if ("json" in c && c.json !== undefined) {
      if (c.json === null || c.json === undefined) return true;
      if (typeof c.json === "object" && Object.keys(c.json as Record<string, unknown>).length === 0) return true;
      return false;
    }
    return true;
  }, []);

  const isEmpty = isContentEmpty(content) && (!compareMode || isContentEmpty(content2));

  const handleChange = (newContent: Content) => {
    setContent(newContent);
    if (compareMode) {
      performDiff(newContent, content2);
    }
  };

  const handleChange2 = (newContent: Content) => {
    setContent2(newContent);
    if (compareMode) {
      performDiff(content, newContent);
    }
  };

  const getJsonObject = (c: Content): unknown => {
    try {
      if ("json" in c && c.json !== undefined) {
        return c.json;
      }
      if ("text" in c && c.text !== undefined) {
        return JSON.parse(c.text);
      }
      return {};
    } catch {
      return {};
    }
  };

  const flattenObject = (obj: Record<string, unknown>, prefix = ""): Record<string, unknown> => {
    const flattened: Record<string, unknown> = {};

    for (const key in obj) {
      const path = prefix ? `${prefix}.${key}` : key;

      if (obj[key] !== null && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
        Object.assign(flattened, flattenObject(obj[key] as Record<string, unknown>, path));
      } else {
        flattened[path] = obj[key];
      }
    }

    return flattened;
  };

  const performDiff = (content1: Content, cont2: Content) => {
    const json1 = getJsonObject(content1);
    const json2 = getJsonObject(cont2);

    const flat1 = flattenObject(json1 as Record<string, unknown>);
    const flat2 = flattenObject(json2 as Record<string, unknown>);

    const added: string[] = [];
    const removed: string[] = [];
    const modified: string[] = [];
    let unchanged = 0;

    for (const key in flat1) {
      if (!(key in flat2)) {
        removed.push(key);
      } else if (JSON.stringify(flat1[key]) !== JSON.stringify(flat2[key])) {
        modified.push(key);
      } else {
        unchanged++;
      }
    }

    for (const key in flat2) {
      if (!(key in flat1)) {
        added.push(key);
      }
    }

    setDiffResult({ added, removed, modified, unchanged });
  };

  const toggleCompareMode = () => {
    const newMode = !compareMode;
    setCompareMode(newMode);

    if (newMode) {
      performDiff(content, content2);
    } else {
      setDiffResult(null);
    }
  };

  const swapEditors = () => {
    const temp = content;
    setContent(content2);
    setContent2(temp);
    if (compareMode) {
      performDiff(content2, temp);
    }
  };

  const handleClear = useCallback(() => {
    setContent({ text: "" });
    setContent2({ text: "" });
    setDiffResult(null);
    setCompareMode(false);
  }, []);

  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "x",
        ctrl: true,
        shift: true,
        action: handleClear,
        description: "Clear all",
      },
    ],
  });

  return (
    <ToolLayout
      title="JSON Editor"
      description="Professional JSON editor with tree and text views"
    >
      <div className="space-y-3">
        <ActionToolbar
          left={
            <>
              <Button
                variant={compareMode ? "default" : "outline"}
                onClick={toggleCompareMode}
                size="sm"
                className="gap-2"
                aria-label={compareMode ? "Exit compare mode" : "Compare JSON"}
              >
                <GitCompare className="h-4 w-4" aria-hidden="true" />
                {compareMode ? "Exit" : "Compare"}
              </Button>

              {compareMode && (
                <Button
                  variant="outline"
                  onClick={swapEditors}
                  size="sm"
                  className="gap-2"
                  aria-label="Swap editors"
                >
                  <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
                  Swap
                </Button>
              )}
            </>
          }
          right={
            <>
              {diffResult && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {diffResult.added.length > 0 && (
                    <Badge variant="default" className="bg-green-500 gap-1 text-xs px-2 py-0">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      +{diffResult.added.length}
                    </Badge>
                  )}
                  {diffResult.removed.length > 0 && (
                    <Badge variant="destructive" className="gap-1 text-xs px-2 py-0">
                      <XCircle className="h-3 w-3" aria-hidden="true" />
                      -{diffResult.removed.length}
                    </Badge>
                  )}
                  {diffResult.modified.length > 0 && (
                    <Badge variant="secondary" className="bg-orange-500 text-white gap-1 text-xs px-2 py-0">
                      <AlertCircle className="h-3 w-3" aria-hidden="true" />
                      ~{diffResult.modified.length}
                    </Badge>
                  )}
                  {diffResult.unchanged > 0 && (
                    <Badge variant="outline" className="text-xs px-2 py-0">
                      ={diffResult.unchanged}
                    </Badge>
                  )}
                </div>
              )}
              <Button
                onClick={handleClear}
                variant="outline"
                size="sm"
                disabled={isEmpty}
                aria-label="Clear editor"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </>
          }
        />

        {/* Compact Diff Details */}
        {diffResult && (diffResult.added.length > 0 || diffResult.removed.length > 0 || diffResult.modified.length > 0) && (
          <div className="p-3 bg-card border rounded-lg space-y-2 text-xs">
            {diffResult.added.length > 0 && (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <span className="font-semibold">Added:</span>{" "}
                  <span className="text-muted-foreground break-all">{diffResult.added.join(", ")}</span>
                </div>
              </div>
            )}

            {diffResult.removed.length > 0 && (
              <div className="flex items-start gap-2">
                <XCircle className="h-3.5 w-3.5 text-red-600 mt-0.5 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <span className="font-semibold">Removed:</span>{" "}
                  <span className="text-muted-foreground break-all">{diffResult.removed.join(", ")}</span>
                </div>
              </div>
            )}

            {diffResult.modified.length > 0 && (
              <div className="flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-orange-600 mt-0.5 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <span className="font-semibold">Modified:</span>{" "}
                  <span className="text-muted-foreground break-all">{diffResult.modified.join(", ")}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Editor(s) */}
        <div className={compareMode ? "grid grid-cols-1 xl:grid-cols-2 gap-3" : ""}>
          <div className="border rounded-lg overflow-hidden bg-card">
            <div className="h-[calc(100vh-240px)] min-h-[600px]">
              <VanillaJSONEditor
                content={content}
                onChange={handleChange}
                mode={mode}
                mainMenuBar={true}
                navigationBar={true}
                statusBar={true}
                readOnly={false}
                indentation={2}
                tabSize={2}
                escapeUnicodeCharacters={false}
                flattenColumns={true}
              />
            </div>
          </div>

          {compareMode && (
            <div className="border rounded-lg overflow-hidden bg-card">
              <div className="h-[calc(100vh-240px)] min-h-[600px]">
                <VanillaJSONEditor
                  content={content2}
                  onChange={handleChange2}
                  mode={mode}
                  mainMenuBar={true}
                  navigationBar={true}
                  statusBar={true}
                  readOnly={false}
                  indentation={2}
                  tabSize={2}
                  escapeUnicodeCharacters={false}
                  flattenColumns={true}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}

