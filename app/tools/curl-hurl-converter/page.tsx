"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout";
import { CopyTextarea } from "@/components/copy-textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DEFAULT_CURL = `curl -X POST https://api.example.com/users \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer token123' \\
  --data '{"name":"John","age":30}'`;

const DEFAULT_HURL = `POST https://api.example.com/users
Content-Type: application/json
Authorization: Bearer token123

{"name":"John","age":30}`;

export default function CurlHurlConverterPage() {
  const [mode, setMode] = useState<"curl-to-hurl" | "hurl-to-curl">("curl-to-hurl");
  const [input, setInput] = useState(DEFAULT_CURL);
  const [output, setOutput] = useState("");

  const curlToHurl = (curl: string) => {
    try {
      // Remove line breaks and normalize spaces
      const cleanCurl = curl.replace(/\\\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
      
      // Extract method (default to GET if not specified)
      const methodMatch = cleanCurl.match(/-X\s+(\w+)/i);
      const method = methodMatch ? methodMatch[1].toUpperCase() : "GET";
      
      // Extract URL - try multiple patterns
      let url = "";
      
      // Pattern 1: After curl command with optional -X
      const urlPattern1 = cleanCurl.match(/curl\s+(?:-X\s+\w+\s+)?['"]?([^\s'"]+)/);
      if (urlPattern1 && urlPattern1[1] && urlPattern1[1].startsWith("http")) {
        url = urlPattern1[1];
      }
      
      // Pattern 2: Any http/https URL
      if (!url) {
        const urlPattern2 = cleanCurl.match(/(https?:\/\/[^\s'"]+)/);
        if (urlPattern2) {
          url = urlPattern2[1];
        }
      }
      
      // Remove trailing backslash if present
      url = url.replace(/\\$/, '');

      if (!url) {
        return "Error: Could not extract URL from cURL command";
      }

      // Extract headers
      const headersMatch = Array.from(cleanCurl.matchAll(/-H\s+['"]([^'"]+)['"]/g));
      
      // Extract data/body - improved regex to capture everything including JSON
      let bodyData = "";
      const dataMatch = cleanCurl.match(/(?:--data(?:-raw|-binary)?|-d)\s+['"](.+?)['"]\s*$/);
      if (dataMatch) {
        bodyData = dataMatch[1];
      } else {
        // Try without quotes at the end
        const dataMatch2 = cleanCurl.match(/(?:--data(?:-raw|-binary)?|-d)\s+['"](.+)['"]/);
        if (dataMatch2) {
          bodyData = dataMatch2[1];
        }
      }

      // Build Hurl format
      let hurl = `${method} ${url}`;
      
      if (headersMatch.length > 0) {
        headersMatch.forEach(match => {
          hurl += `\n${match[1]}`;
        });
      }

      if (bodyData) {
        hurl += `\n\n${bodyData}`;
      }

      return hurl;
    } catch (err) {
      return "Error: Invalid cURL command - " + (err instanceof Error ? err.message : "Unknown error");
    }
  };

  const hurlToCurl = (hurl: string) => {
    try {
      const lines = hurl.trim().split("\n");
      
      if (lines.length === 0) {
        return "Error: Empty Hurl input";
      }

      // Parse first line (METHOD URL)
      const firstLine = lines[0].trim();
      const parts = firstLine.split(/\s+/);
      
      if (parts.length < 2) {
        return "Error: Invalid Hurl format. Expected: METHOD URL";
      }
      
      const method = parts[0].toUpperCase();
      const url = parts.slice(1).join(" ");

      if (!url) {
        return "Error: Could not extract URL from Hurl format";
      }

      let curl = `curl -X ${method} '${url}'`;
      let bodyData = "";
      let inBody = false;

      // Process remaining lines
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Empty line indicates start of body
        if (!line) {
          inBody = true;
          continue;
        }

        // Check if it's a header (contains colon and not in body)
        if (!inBody && line.includes(":")) {
          curl += ` \\\n  -H '${line}'`;
        } else {
          // It's body data
          inBody = true;
          if (bodyData) {
            bodyData += "\n" + line;
          } else {
            bodyData = line;
          }
        }
      }

      // Add body data if present
      if (bodyData) {
        curl += ` \\\n  --data '${bodyData}'`;
      }

      return curl;
    } catch (err) {
      return "Error: Invalid Hurl format - " + (err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleConvert = () => {
    if (mode === "curl-to-hurl") {
      setOutput(curlToHurl(input));
    } else {
      setOutput(hurlToCurl(input));
    }
  };

  const handleModeChange = (newMode: "curl-to-hurl" | "hurl-to-curl") => {
    setMode(newMode);
    setOutput("");
    
    if (newMode === "curl-to-hurl" && !input.trim().startsWith("curl")) {
      setInput(DEFAULT_CURL);
    } else if (newMode === "hurl-to-curl" && input.trim().startsWith("curl")) {
      setInput(DEFAULT_HURL);
    }
  };

  const switchMode = () => {
    const newMode = mode === "curl-to-hurl" ? "hurl-to-curl" : "curl-to-hurl";
    setMode(newMode);
    
    if (output) {
      setInput(output);
      setOutput("");
    } else {
      setInput(newMode === "curl-to-hurl" ? DEFAULT_CURL : DEFAULT_HURL);
    }
  };

  return (
    <ToolLayout
      title="cURL ↔ Hurl Converter"
      description="Convert between cURL and Hurl formats"
    >
      <div className="space-y-3">
        {/* Compact Toolbar */}
        <div className="p-3 bg-card border rounded-lg">
          <Tabs value={mode} onValueChange={(v) => handleModeChange(v as typeof mode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="curl-to-hurl">cURL → Hurl</TabsTrigger>
              <TabsTrigger value="hurl-to-curl">Hurl → cURL</TabsTrigger>
            </TabsList>
          </Tabs>
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
            <span className="text-sm font-medium">
              {mode === "curl-to-hurl" ? "cURL Command" : "Hurl Format"}
            </span>
            <CopyTextarea
              value={input}
              onChange={setInput}
              placeholder={mode === "curl-to-hurl" ? "curl -X GET https://api.example.com..." : "GET https://api.example.com..."}
              rows={20}
              className="font-mono text-xs"
            />
          </div>

          {/* Output */}
          <div className="space-y-2">
            <span className="text-sm font-medium">
              {mode === "curl-to-hurl" ? "Hurl Format" : "cURL Command"}
            </span>
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
