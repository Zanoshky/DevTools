import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout";
import { CodeEditor } from "@/components/code-editor";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ActionToolbar } from "@/components/action-toolbar";
import { useAutoConvert } from "@/hooks/use-auto-convert";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { toast } from "@/hooks/use-toast";
import { ArrowRightLeft, Trash2 } from "lucide-react";

const DEFAULT_CURL = `curl -X POST https://api.example.com/users \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer token123' \\
  --data '{"name":"John","age":30}'`;

const DEFAULT_HURL = `POST https://api.example.com/users
Content-Type: application/json
Authorization: Bearer token123

{"name":"John","age":30}`;

function curlToHurl(curl: string): string {
  const cleanCurl = curl.replace(/\\\s*\n\s*/g, " ").replace(/\s+/g, " ").trim();

  const methodMatch = cleanCurl.match(/-X\s+(\w+)/i);
  const method = methodMatch ? methodMatch[1].toUpperCase() : "GET";

  let url = "";

  const urlPattern1 = cleanCurl.match(/curl\s+(?:-X\s+\w+\s+)?['"]?([^\s'"]+)/);
  if (urlPattern1 && urlPattern1[1] && urlPattern1[1].startsWith("http")) {
    url = urlPattern1[1];
  }

  if (!url) {
    const urlPattern2 = cleanCurl.match(/(https?:\/\/[^\s'"]+)/);
    if (urlPattern2) {
      url = urlPattern2[1];
    }
  }

  url = url.replace(/\\$/, "");

  if (!url) {
    throw new Error("Could not extract URL from cURL command");
  }

  const headersMatch = Array.from(cleanCurl.matchAll(/-H\s+['"]([^'"]+)['"]/g));

  let bodyData = "";
  const dataMatch = cleanCurl.match(/(?:--data(?:-raw|-binary)?|-d)\s+['"](.+?)['"]\s*$/);
  if (dataMatch) {
    bodyData = dataMatch[1];
  } else {
    const dataMatch2 = cleanCurl.match(/(?:--data(?:-raw|-binary)?|-d)\s+['"](.+)['"]/);
    if (dataMatch2) {
      bodyData = dataMatch2[1];
    }
  }

  let hurl = `${method} ${url}`;

  if (headersMatch.length > 0) {
    headersMatch.forEach((match) => {
      hurl += `\n${match[1]}`;
    });
  }

  if (bodyData) {
    hurl += `\n\n${bodyData}`;
  }

  return hurl;
}

function hurlToCurl(hurl: string): string {
  const lines = hurl.trim().split("\n");

  if (lines.length === 0) {
    throw new Error("Empty Hurl input");
  }

  const firstLine = lines[0].trim();
  const parts = firstLine.split(/\s+/);

  if (parts.length < 2) {
    throw new Error("Invalid Hurl format. Expected: METHOD URL");
  }

  const method = parts[0].toUpperCase();
  const url = parts.slice(1).join(" ");

  if (!url) {
    throw new Error("Could not extract URL from Hurl format");
  }

  let curl = `curl -X ${method} '${url}'`;
  let bodyData = "";
  let inBody = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      inBody = true;
      continue;
    }

    if (!inBody && line.includes(":")) {
      curl += ` \\\n  -H '${line}'`;
    } else {
      inBody = true;
      if (bodyData) {
        bodyData += "\n" + line;
      } else {
        bodyData = line;
      }
    }
  }

  if (bodyData) {
    curl += ` \\\n  --data '${bodyData}'`;
  }

  return curl;
}

export default function CurlHurlConverterPage() {
  const [mode, setMode] = useState<"curl-to-hurl" | "hurl-to-curl">("curl-to-hurl");
  const [input, setInput] = useState(DEFAULT_CURL);

  const convertFn = useCallback(
    (value: string): string => {
      if (mode === "curl-to-hurl") {
        return curlToHurl(value);
      }
      return hurlToCurl(value);
    },
    [mode]
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
  }, [clear]);

  const handleModeChange = useCallback(
    (newMode: "curl-to-hurl" | "hurl-to-curl") => {
      setMode(newMode);
      clear();

      if (newMode === "curl-to-hurl" && !input.trim().startsWith("curl")) {
        setInput(DEFAULT_CURL);
      } else if (newMode === "hurl-to-curl" && input.trim().startsWith("curl")) {
        setInput(DEFAULT_HURL);
      }
    },
    [input, clear]
  );

  const switchMode = useCallback(() => {
    const newMode = mode === "curl-to-hurl" ? "hurl-to-curl" : "curl-to-hurl";
    setMode(newMode);

    if (output) {
      setInput(output);
      clear();
    } else {
      setInput(newMode === "curl-to-hurl" ? DEFAULT_CURL : DEFAULT_HURL);
    }
  }, [mode, output, clear]);

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

  return (
    <ToolLayout
      title="cURL <-> Hurl Converter"
      description="Convert between cURL and Hurl formats"
    >
      <div className="space-y-3">
        <ActionToolbar
          left={
            <Tabs
              value={mode}
              onValueChange={(v) => handleModeChange(v as "curl-to-hurl" | "hurl-to-curl")}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid w-full sm:w-[300px] grid-cols-2">
                <TabsTrigger value="curl-to-hurl">cURL to Hurl</TabsTrigger>
                <TabsTrigger value="hurl-to-curl">Hurl to cURL</TabsTrigger>
              </TabsList>
            </Tabs>
          }
          right={
            <>
              <Button onClick={convert} size="sm" aria-label="Convert input">
                Convert
              </Button>
              <Button
                onClick={switchMode}
                variant="outline"
                size="sm"
                className="gap-2"
                aria-label="Switch conversion direction"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Switch
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {mode === "curl-to-hurl" ? "cURL Command" : "Hurl Format"}
            </Label>
            <CodeEditor
              language="text"
              value={input}
              onChange={setInput}
              placeholder={
                mode === "curl-to-hurl"
                  ? "curl -X GET https://api.example.com..."
                  : "GET https://api.example.com..."
              }
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {mode === "curl-to-hurl" ? "Hurl Format" : "cURL Command"}
            </Label>
            <CodeEditor
              language="text"
              value={error || output}
              readOnly
              placeholder={
                mode === "curl-to-hurl"
                  ? "Hurl output will appear here..."
                  : "cURL output will appear here..."
              }
            />
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
