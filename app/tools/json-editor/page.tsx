"use client";

import { useState } from "react";
import VanillaJSONEditor from "@/components/VanillaJSONEditor";
import { type Content, type JSONContent, Mode } from "vanilla-jsoneditor";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  GitCompare, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ArrowLeftRight
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

  const getJsonObject = (content: Content): unknown => {
    try {
      if ('json' in content && content.json !== undefined) {
        return content.json;
      }
      if ('text' in content && content.text !== undefined) {
        return JSON.parse(content.text);
      }
      return {};
    } catch {
      return {};
    }
  };

  const flattenObject = (obj: Record<string, unknown>, prefix = ''): Record<string, unknown> => {
    const flattened: Record<string, unknown> = {};
    
    for (const key in obj) {
      const path = prefix ? `${prefix}.${key}` : key;
      
      if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        Object.assign(flattened, flattenObject(obj[key] as Record<string, unknown>, path));
      } else {
        flattened[path] = obj[key];
      }
    }
    
    return flattened;
  };

  const performDiff = (content1: Content, content2: Content) => {
    const json1 = getJsonObject(content1);
    const json2 = getJsonObject(content2);

    const flat1 = flattenObject(json1 as Record<string, unknown>);
    const flat2 = flattenObject(json2 as Record<string, unknown>);

    const added: string[] = [];
    const removed: string[] = [];
    const modified: string[] = [];
    let unchanged = 0;

    // Check for removed and modified keys
    for (const key in flat1) {
      if (!(key in flat2)) {
        removed.push(key);
      } else if (JSON.stringify(flat1[key]) !== JSON.stringify(flat2[key])) {
        modified.push(key);
      } else {
        unchanged++;
      }
    }

    // Check for added keys
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

  return (
    <ToolLayout
      title="JSON Editor"
      description="Professional JSON editor with tree and text views"
      maxWidth="7xl"
    >
      <div className="space-y-3">
        {/* Compact Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-card border rounded-lg">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={compareMode ? "default" : "outline"}
              onClick={toggleCompareMode}
              size="sm"
              className="gap-2"
            >
              <GitCompare className="h-4 w-4" />
              {compareMode ? "Exit" : "Compare"}
            </Button>

            {compareMode && (
              <Button
                variant="outline"
                onClick={swapEditors}
                size="sm"
                className="gap-2"
              >
                <ArrowLeftRight className="h-4 w-4" />
                Swap
              </Button>
            )}
          </div>

          {diffResult && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {diffResult.added.length > 0 && (
                <Badge variant="default" className="bg-green-500 gap-1 text-xs px-2 py-0">
                  <CheckCircle2 className="h-3 w-3" />
                  +{diffResult.added.length}
                </Badge>
              )}
              {diffResult.removed.length > 0 && (
                <Badge variant="destructive" className="gap-1 text-xs px-2 py-0">
                  <XCircle className="h-3 w-3" />
                  -{diffResult.removed.length}
                </Badge>
              )}
              {diffResult.modified.length > 0 && (
                <Badge variant="secondary" className="bg-orange-500 text-white gap-1 text-xs px-2 py-0">
                  <AlertCircle className="h-3 w-3" />
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
        </div>

        {/* Compact Diff Details */}
        {diffResult && (diffResult.added.length > 0 || diffResult.removed.length > 0 || diffResult.modified.length > 0) && (
          <div className="p-3 bg-card border rounded-lg space-y-2 text-xs">
            {diffResult.added.length > 0 && (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold">Added:</span>{" "}
                  <span className="text-muted-foreground break-all">{diffResult.added.join(', ')}</span>
                </div>
              </div>
            )}

            {diffResult.removed.length > 0 && (
              <div className="flex items-start gap-2">
                <XCircle className="h-3.5 w-3.5 text-red-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold">Removed:</span>{" "}
                  <span className="text-muted-foreground break-all">{diffResult.removed.join(', ')}</span>
                </div>
              </div>
            )}

            {diffResult.modified.length > 0 && (
              <div className="flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-orange-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold">Modified:</span>{" "}
                  <span className="text-muted-foreground break-all">{diffResult.modified.join(', ')}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Editor(s) - No titles, maximized space */}
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
