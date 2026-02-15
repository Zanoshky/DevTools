"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout";
import { CopyTextarea } from "@/components/copy-textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import xmlFormatter from "xml-formatter";

const DEFAULT_JSON = `{
  "person": {
    "name": "John Doe",
    "age": 30,
    "email": "john@example.com",
    "address": {
      "street": "123 Main St",
      "city": "New York"
    },
    "hobbies": ["reading", "coding", "traveling"]
  }
}`;

const DEFAULT_XML = `<?xml version="1.0" encoding="UTF-8"?>
<person>
  <name>John Doe</name>
  <age>30</age>
  <email>john@example.com</email>
  <address>
    <street>123 Main St</street>
    <city>New York</city>
  </address>
  <hobbies>reading</hobbies>
  <hobbies>coding</hobbies>
  <hobbies>traveling</hobbies>
</person>`;

export default function JsonXmlConverterPage() {
  const [mode, setMode] = useState<"json-to-xml" | "xml-to-json">("json-to-xml");
  const [input, setInput] = useState(DEFAULT_JSON);
  const [output, setOutput] = useState("");
  const [prettyJSON, setPrettyJSON] = useState(true);
  const [prettyXML, setPrettyXML] = useState(true);
  const [rootElement, setRootElement] = useState("root");

  const handleConvert = () => {
    try {
      if (mode === "json-to-xml") {
        const json = JSON.parse(input);
        const xml = jsonToXml(json, rootElement);
        setOutput(prettyXML ? xmlFormatter(xml) : xml);
      } else {
        const json = xmlToJson(input);
        setOutput(JSON.stringify(json, null, prettyJSON ? 2 : 0));
      }
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : "Invalid input"}`);
    }
  };

  const jsonToXml = (obj: unknown, root = "root"): string => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${root}>`;

    if (Array.isArray(obj)) {
      obj.forEach((item) => {
        xml += `<item>${typeof item === "object" ? jsonToXml(item, "item").replace(/<\?xml[^>]*\?>/, "").replace(/<\/?item>/g, "") : escapeXml(item)}</item>`;
      });
    } else {
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            xml += `<${key}>${typeof item === "object" ? jsonToXml(item, key).replace(/<\?xml[^>]*\?>/, "").replace(new RegExp(`</?${key}>`, "g"), "") : escapeXml(item)}</${key}>`;
          });
        } else if (typeof value === "object" && value !== null) {
          xml += `<${key}>${jsonToXml(value, key).replace(/<\?xml[^>]*\?>/, "").replace(new RegExp(`</?${key}>`, "g"), "")}</${key}>`;
        } else {
          xml += `<${key}>${escapeXml(value)}</${key}>`;
        }
      }
    }

    xml += `</${root}>`;
    return xml;
  };

  const escapeXml = (value: unknown): string => {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  const xmlToJson = (xml: string): unknown => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");

    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      throw new Error("Invalid XML");
    }

    const parseNode = (node: Node): unknown => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent?.trim() || "";
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const obj: Record<string, unknown> = {};
        const children = Array.from(node.childNodes);

        if (children.length === 1 && children[0].nodeType === Node.TEXT_NODE) {
          const text = children[0].textContent?.trim() || "";
          // Try to parse as number or boolean
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
              if (!Array.isArray(obj[key])) {
                obj[key] = [obj[key]];
              }
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
  };

  const handleModeChange = (newMode: "json-to-xml" | "xml-to-json") => {
    setMode(newMode);
    setOutput("");
    
    // Set appropriate default input if current input doesn't match the mode
    if (newMode === "json-to-xml" && !input.trim().startsWith("{") && !input.trim().startsWith("[")) {
      setInput(DEFAULT_JSON);
    } else if (newMode === "xml-to-json" && !input.trim().startsWith("<")) {
      setInput(DEFAULT_XML);
    }
  };

  const switchMode = () => {
    const newMode = mode === "json-to-xml" ? "xml-to-json" : "json-to-xml";
    setMode(newMode);
    
    if (output) {
      setInput(output);
      setOutput("");
    } else {
      setInput(newMode === "json-to-xml" ? DEFAULT_JSON : DEFAULT_XML);
    }
  };

  return (
    <ToolLayout
      title="JSON ↔ XML Converter"
      description="Convert between JSON and XML formats with formatting options"
    >
      <div className="space-y-3">
        {/* Compact Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-card border rounded-lg">
          <Tabs value={mode} onValueChange={(v) => handleModeChange(v as typeof mode)} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="json-to-xml">JSON → XML</TabsTrigger>
              <TabsTrigger value="xml-to-json">XML → JSON</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
            {/* Root Element (JSON to XML only) */}
            {mode === "json-to-xml" && (
              <div className="flex items-center gap-2">
                <Label htmlFor="root" className="text-xs text-muted-foreground whitespace-nowrap">
                  Root:
                </Label>
                <Input
                  id="root"
                  value={rootElement}
                  onChange={(e) => setRootElement(e.target.value)}
                  className="h-8 w-24 text-xs"
                  placeholder="root"
                />
              </div>
            )}

            {/* Pretty XML */}
            {mode === "json-to-xml" && (
              <div className="flex items-center gap-2">
                <Switch
                  id="prettyXML"
                  checked={prettyXML}
                  onCheckedChange={setPrettyXML}
                  className="scale-75"
                />
                <Label htmlFor="prettyXML" className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
                  Format XML
                </Label>
              </div>
            )}

            {/* Pretty JSON */}
            {mode === "xml-to-json" && (
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
              {mode === "json-to-xml" ? "JSON Input" : "XML Input"}
            </Label>
            <CopyTextarea
              value={input}
              onChange={setInput}
              placeholder={mode === "json-to-xml" ? "Enter JSON..." : "Enter XML..."}
              rows={20}
              className="font-mono text-xs"
            />
          </div>

          {/* Output */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {mode === "json-to-xml" ? "XML Output" : "JSON Output"}
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
