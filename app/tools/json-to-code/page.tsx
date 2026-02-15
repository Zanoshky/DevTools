"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout";
import { CopyTextarea } from "@/components/copy-textarea";
import { Badge } from "@/components/ui/badge";
import { Code2 } from "lucide-react";

const languages = [
  { value: "TypeScript", label: "TypeScript", icon: "TS" },
  { value: "JavaScript", label: "JavaScript", icon: "JS" },
  { value: "Python", label: "Python", icon: "PY" },
  { value: "Go", label: "Go", icon: "GO" },
  { value: "Rust", label: "Rust", icon: "RS" },
  { value: "Java", label: "Java", icon: "JV" },
  { value: "C#", label: "C#", icon: "C#" },
] as const;

type Language = typeof languages[number]["value"];

export default function JsonToCodePage() {
  const [input, setInput] = useState(`{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "country": "USA"
  },
  "hobbies": ["reading", "coding", "traveling"],
  "active": true
}`);
  const [language, setLanguage] = useState<Language>("TypeScript");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const generateTypeScript = (obj: Record<string, unknown>, interfaceName = "Root", indent = 0): string => {
    const spaces = "  ".repeat(indent);
    const lines: string[] = [];
    
    if (indent === 0) {
      lines.push(`export interface ${interfaceName} {`);
    }

    for (const [key, value] of Object.entries(obj)) {
      if (value === null) {
        lines.push(`${spaces}  ${key}: null;`);
      } else if (Array.isArray(value)) {
        if (value.length > 0 && typeof value[0] === "object" && !Array.isArray(value[0])) {
          const itemInterfaceName = key.charAt(0).toUpperCase() + key.slice(1, -1);
          lines.push(`${spaces}  ${key}: ${itemInterfaceName}[];`);
        } else {
          const itemType = value.length > 0 ? typeof value[0] : "any";
          lines.push(`${spaces}  ${key}: ${itemType}[];`);
        }
      } else if (typeof value === "object") {
        const nestedName = key.charAt(0).toUpperCase() + key.slice(1);
        lines.push(`${spaces}  ${key}: ${nestedName};`);
      } else {
        lines.push(`${spaces}  ${key}: ${typeof value};`);
      }
    }

    if (indent === 0) {
      lines.push("}");
      
      // Generate nested interfaces
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "object" && !Array.isArray(value) && value !== null) {
          const nestedName = key.charAt(0).toUpperCase() + key.slice(1);
          lines.push("");
          lines.push(`export interface ${nestedName} {`);
          for (const [nestedKey, nestedValue] of Object.entries(value)) {
            lines.push(`  ${nestedKey}: ${typeof nestedValue};`);
          }
          lines.push("}");
        } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
          const itemName = key.charAt(0).toUpperCase() + key.slice(1, -1);
          lines.push("");
          lines.push(`export interface ${itemName} {`);
          for (const [itemKey, itemValue] of Object.entries(value[0])) {
            lines.push(`  ${itemKey}: ${typeof itemValue};`);
          }
          lines.push("}");
        }
      }
    }

    return lines.join("\n");
  };

  const generateJavaScript = (obj: Record<string, unknown>) => {
    return `// JavaScript Object\nconst data = ${JSON.stringify(obj, null, 2)};\n\n// ES6 Class\nclass Root {\n  constructor(data) {\n${Object.keys(obj).map(key => `    this.${key} = data.${key};`).join("\n")}\n  }\n}`;
  };

  const generatePython = (obj: Record<string, unknown>) => {
    const lines = ["from dataclasses import dataclass", "from typing import List, Optional", "", "@dataclass", "class Root:"];
    
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        const itemType = value.length > 0 ? (typeof value[0] === "string" ? "str" : "int") : "any";
        lines.push(`    ${key}: List[${itemType}]`);
      } else if (typeof value === "object" && value !== null) {
        const nestedName = key.charAt(0).toUpperCase() + key.slice(1);
        lines.push(`    ${key}: ${nestedName}`);
      } else {
        const pyType = typeof value === "number" ? "int" : typeof value === "boolean" ? "bool" : "str";
        lines.push(`    ${key}: ${pyType}`);
      }
    }

    // Generate nested classes
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "object" && !Array.isArray(value) && value !== null) {
        const nestedName = key.charAt(0).toUpperCase() + key.slice(1);
        lines.push("", "@dataclass", `class ${nestedName}:`);
        for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
          const pyType = typeof nestedValue === "number" ? "int" : typeof nestedValue === "boolean" ? "bool" : "str";
          lines.push(`    ${nestedKey}: ${pyType}`);
        }
      }
    }

    return lines.join("\n");
  };

  const generateGo = (obj: Record<string, unknown>) => {
    const lines = ["type Root struct {"];
    
    for (const [key, value] of Object.entries(obj)) {
      const goKey = key.charAt(0).toUpperCase() + key.slice(1);
      
      if (Array.isArray(value)) {
        const itemType = value.length > 0 ? (typeof value[0] === "string" ? "string" : "int") : "interface{}";
        lines.push(`    ${goKey} []${itemType} \`json:"${key}"\``);
      } else if (typeof value === "object" && value !== null) {
        const nestedName = key.charAt(0).toUpperCase() + key.slice(1);
        lines.push(`    ${goKey} ${nestedName} \`json:"${key}"\``);
      } else {
        const goType = typeof value === "number" ? "int" : typeof value === "boolean" ? "bool" : "string";
        lines.push(`    ${goKey} ${goType} \`json:"${key}"\``);
      }
    }
    
    lines.push("}");

    // Generate nested structs
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "object" && !Array.isArray(value) && value !== null) {
        const nestedName = key.charAt(0).toUpperCase() + key.slice(1);
        lines.push("", `type ${nestedName} struct {`);
        for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
          const goKey = nestedKey.charAt(0).toUpperCase() + nestedKey.slice(1);
          const goType = typeof nestedValue === "number" ? "int" : typeof nestedValue === "boolean" ? "bool" : "string";
          lines.push(`    ${goKey} ${goType} \`json:"${nestedKey}"\``);
        }
        lines.push("}");
      }
    }

    return lines.join("\n");
  };

  const generateRust = (obj: Record<string, unknown>) => {
    const lines = ["use serde::{Deserialize, Serialize};", "", "#[derive(Debug, Serialize, Deserialize)]", "pub struct Root {"];
    
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        const itemType = value.length > 0 ? (typeof value[0] === "string" ? "String" : "i32") : "serde_json::Value";
        lines.push(`    pub ${key}: Vec<${itemType}>,`);
      } else if (typeof value === "object" && value !== null) {
        const nestedName = key.charAt(0).toUpperCase() + key.slice(1);
        lines.push(`    pub ${key}: ${nestedName},`);
      } else {
        const rustType = typeof value === "number" ? "i32" : typeof value === "boolean" ? "bool" : "String";
        lines.push(`    pub ${key}: ${rustType},`);
      }
    }
    
    lines.push("}");

    // Generate nested structs
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "object" && !Array.isArray(value) && value !== null) {
        const nestedName = key.charAt(0).toUpperCase() + key.slice(1);
        lines.push("", "#[derive(Debug, Serialize, Deserialize)]", `pub struct ${nestedName} {`);
        for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
          const rustType = typeof nestedValue === "number" ? "i32" : typeof nestedValue === "boolean" ? "bool" : "String";
          lines.push(`    pub ${nestedKey}: ${rustType},`);
        }
        lines.push("}");
      }
    }

    return lines.join("\n");
  };

  const generateJava = (obj: Record<string, unknown>) => {
    const lines = ["public class Root {"];
    
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        const itemType = value.length > 0 ? (typeof value[0] === "string" ? "String" : "Integer") : "Object";
        lines.push(`    private List<${itemType}> ${key};`);
      } else if (typeof value === "object" && value !== null) {
        const nestedName = key.charAt(0).toUpperCase() + key.slice(1);
        lines.push(`    private ${nestedName} ${key};`);
      } else {
        const javaType = typeof value === "number" ? "Integer" : typeof value === "boolean" ? "Boolean" : "String";
        lines.push(`    private ${javaType} ${key};`);
      }
    }
    
    lines.push("}");

    // Generate nested classes
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "object" && !Array.isArray(value) && value !== null) {
        const nestedName = key.charAt(0).toUpperCase() + key.slice(1);
        lines.push("", `public class ${nestedName} {`);
        for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
          const javaType = typeof nestedValue === "number" ? "Integer" : typeof nestedValue === "boolean" ? "Boolean" : "String";
          lines.push(`    private ${javaType} ${nestedKey};`);
        }
        lines.push("}");
      }
    }

    return lines.join("\n");
  };

  const generateCSharp = (obj: Record<string, unknown>) => {
    const lines = ["public class Root {"];
    
    for (const [key, value] of Object.entries(obj)) {
      const csKey = key.charAt(0).toUpperCase() + key.slice(1);
      
      if (Array.isArray(value)) {
        const itemType = value.length > 0 ? (typeof value[0] === "string" ? "string" : "int") : "object";
        lines.push(`    public List<${itemType}> ${csKey} { get; set; }`);
      } else if (typeof value === "object" && value !== null) {
        const nestedName = key.charAt(0).toUpperCase() + key.slice(1);
        lines.push(`    public ${nestedName} ${csKey} { get; set; }`);
      } else {
        const csType = typeof value === "number" ? "int" : typeof value === "boolean" ? "bool" : "string";
        lines.push(`    public ${csType} ${csKey} { get; set; }`);
      }
    }
    
    lines.push("}");

    // Generate nested classes
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "object" && !Array.isArray(value) && value !== null) {
        const nestedName = key.charAt(0).toUpperCase() + key.slice(1);
        lines.push("", `public class ${nestedName} {`);
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          const csKey = nestedKey.charAt(0).toUpperCase() + nestedKey.slice(1);
          const csType = typeof nestedValue === "number" ? "int" : typeof nestedValue === "boolean" ? "bool" : "string";
          lines.push(`    public ${csType} ${csKey} { get; set; }`);
        }
        lines.push("}");
      }
    }

    return lines.join("\n");
  };

  const generateCode = () => {
    setError("");
    try {
      const json = JSON.parse(input);
      let code = "";

      switch (language) {
        case "TypeScript":
          code = generateTypeScript(json);
          break;
        case "JavaScript":
          code = generateJavaScript(json);
          break;
        case "Python":
          code = generatePython(json);
          break;
        case "Go":
          code = generateGo(json);
          break;
        case "Rust":
          code = generateRust(json);
          break;
        case "Java":
          code = generateJava(json);
          break;
        case "C#":
          code = generateCSharp(json);
          break;
      }

      setOutput(code);
    } catch (err) {
      setError("Invalid JSON: " + (err instanceof Error ? err.message : "Parse error"));
      setOutput("");
    }
  };

  return (
    <ToolLayout
      title="JSON to Code"
      description="Generate type-safe code structures from JSON"
    >
      <div className="space-y-3">
        {/* Compact Toolbar */}
        <div className="p-3 bg-card border rounded-lg">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Target Language</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {languages.map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => setLanguage(value)}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    language === value
                      ? "border-foreground bg-secondary"
                      : "border-border hover:border-foreground/50"
                  }`}
                >
                  <div className="text-lg font-bold mb-1">{icon}</div>
                  <div className="text-xs font-medium">{label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Button Row */}
        <div className="flex justify-end">
          <Button onClick={generateCode} size="sm">
            <Code2 className="h-4 w-4 mr-2" />
            Generate {language} Code
          </Button>
        </div>

        {/* Input/Output Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Input */}
          <div className="space-y-2">
            <span className="text-sm font-medium">JSON Input</span>
            <CopyTextarea
              value={input}
              onChange={setInput}
              placeholder="Enter JSON object..."
              rows={20}
              className="font-mono text-xs"
            />
          </div>

          {/* Output */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Code Output</span>
              <Badge variant="secondary" className="text-xs">
                {language}
              </Badge>
            </div>
            <CopyTextarea
              value={output}
              readOnly
              placeholder="Generated code will appear here..."
              rows={20}
              className="font-mono text-xs"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
