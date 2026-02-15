"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout";
import { CopyTextarea } from "@/components/copy-textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import yaml from "js-yaml";

const DEFAULT_JSON = `{
  "server": {
    "host": "localhost",
    "port": 8080,
    "ssl": true
  },
  "database": {
    "host": "db.example.com",
    "port": 5432,
    "name": "myapp",
    "credentials": {
      "username": "admin",
      "password": "secret"
    }
  },
  "features": ["auth", "api", "websocket"]
}`;

const DEFAULT_YAML = `server:
  host: localhost
  port: 8080
  ssl: true
database:
  host: db.example.com
  port: 5432
  name: myapp
  credentials:
    username: admin
    password: secret
features:
  - auth
  - api
  - websocket`;

export default function JsonYamlConverterPage() {
  const [mode, setMode] = useState<"json-to-yaml" | "yaml-to-json">("json-to-yaml");
  const [input, setInput] = useState(DEFAULT_JSON);
  const [output, setOutput] = useState("");
  const [prettyJSON, setPrettyJSON] = useState(true);
  const [indentSize, setIndentSize] = useState(2);
  const [lineWidth, setLineWidth] = useState(120);
  const [flowLevel, setFlowLevel] = useState(-1);

  const handleConvert = () => {
    try {
      if (mode === "json-to-yaml") {
        const parsed = JSON.parse(input);
        setOutput(yaml.dump(parsed, { 
          indent: indentSize,
          lineWidth: lineWidth,
          flowLevel: flowLevel,
          noRefs: true
        }));
      } else {
        const parsed = yaml.load(input);
        setOutput(JSON.stringify(parsed, null, prettyJSON ? indentSize : 0));
      }
    } catch (err) {
      setOutput("Error: " + (err instanceof Error ? err.message : "Invalid input"));
    }
  };

  const handleModeChange = (newMode: "json-to-yaml" | "yaml-to-json") => {
    setMode(newMode);
    setOutput("");
    
    // Set appropriate default input if current input doesn't match the mode
    if (newMode === "json-to-yaml" && !input.trim().startsWith("{") && !input.trim().startsWith("[")) {
      setInput(DEFAULT_JSON);
    } else if (newMode === "yaml-to-json" && (input.trim().startsWith("{") || input.trim().startsWith("["))) {
      setInput(DEFAULT_YAML);
    }
  };

  const switchMode = () => {
    const newMode = mode === "json-to-yaml" ? "yaml-to-json" : "json-to-yaml";
    setMode(newMode);
    
    if (output) {
      setInput(output);
      setOutput("");
    } else {
      setInput(newMode === "json-to-yaml" ? DEFAULT_JSON : DEFAULT_YAML);
    }
  };

  return (
    <ToolLayout
      title="JSON ↔ YAML Converter"
      description="Convert between JSON and YAML formats with formatting options"
    >
      <div className="space-y-3">
        {/* Compact Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-card border rounded-lg">
          <Tabs value={mode} onValueChange={(v) => handleModeChange(v as typeof mode)} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="json-to-yaml">JSON → YAML</TabsTrigger>
              <TabsTrigger value="yaml-to-json">YAML → JSON</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
            {/* Indent Size */}
            <div className="flex items-center gap-2">
              <Label htmlFor="indent" className="text-xs text-muted-foreground whitespace-nowrap">
                Indent:
              </Label>
              <Input
                id="indent"
                type="number"
                value={indentSize}
                onChange={(e) => setIndentSize(Math.max(1, Math.min(8, parseInt(e.target.value) || 2)))}
                className="h-8 w-16 text-xs"
                min="1"
                max="8"
              />
            </div>

            {/* Line Width (YAML only) */}
            {mode === "json-to-yaml" && (
              <div className="flex items-center gap-2">
                <Label htmlFor="linewidth" className="text-xs text-muted-foreground whitespace-nowrap">
                  Width:
                </Label>
                <Input
                  id="linewidth"
                  type="number"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(Math.max(40, Math.min(200, parseInt(e.target.value) || 120)))}
                  className="h-8 w-16 text-xs"
                  min="40"
                  max="200"
                />
              </div>
            )}

            {/* Flow Level (YAML only) */}
            {mode === "json-to-yaml" && (
              <div className="flex items-center gap-2">
                <Label htmlFor="flow" className="text-xs text-muted-foreground whitespace-nowrap">
                  Flow:
                </Label>
                <Input
                  id="flow"
                  type="number"
                  value={flowLevel}
                  onChange={(e) => setFlowLevel(parseInt(e.target.value) || -1)}
                  className="h-8 w-16 text-xs"
                  min="-1"
                  max="10"
                  title="-1 for block style, 0+ for flow style at that level"
                />
              </div>
            )}

            {/* Pretty JSON */}
            {mode === "yaml-to-json" && (
              <div className="flex items-center gap-2">
                <Switch
                  id="prettyJSON"
                  checked={prettyJSON}
                  onCheckedChange={setPrettyJSON}
                  className="scale-75"
                />
                <Label htmlFor="prettyJSON" className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
                  Format JSON
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
              {mode === "json-to-yaml" ? "JSON Input" : "YAML Input"}
            </Label>
            <CopyTextarea
              value={input}
              onChange={setInput}
              placeholder={mode === "json-to-yaml" ? "Enter JSON..." : "Enter YAML..."}
              rows={20}
              className="font-mono text-xs"
            />
          </div>

          {/* Output */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {mode === "json-to-yaml" ? "YAML Output" : "JSON Output"}
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
