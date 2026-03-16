
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout";
import { CodeEditor } from "@/components/code-editor";
import { ActionToolbar } from "@/components/action-toolbar";
import { EmptyState } from "@/components/empty-state";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { toast } from "@/hooks/use-toast";
import { Code2, Trash2 } from "lucide-react";

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

function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}

function toPascalCase(str: string): string {
  return str
    .replace(/(^|[_\s-])([a-z])/g, (_m, _sep, char) => char.toUpperCase())
    .replace(/[_\s-]/g, "");
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function convertKey(key: string, lang: Language): string {
  switch (lang) {
    case "Python":
    case "Rust":
      return toSnakeCase(key);
    case "Go":
    case "C#":
      return toPascalCase(key);
    case "Java":
    case "TypeScript":
    case "JavaScript":
    default:
      return toCamelCase(key);
  }
}

function convertClassName(key: string): string {
  return toPascalCase(key);
}

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

  const isEmpty = input.length === 0 && output.length === 0;

  const generateTypeScript = (obj: Record<string, unknown>, interfaceName = "Root", indent = 0): string => {
    const spaces = "  ".repeat(indent);
    const lines: string[] = [];
    
    if (indent === 0) {
      lines.push(`export interface ${interfaceName} {`);
    }

    for (const [key, value] of Object.entries(obj)) {
      const fieldName = convertKey(key, "TypeScript");
      if (value === null) {
        lines.push(`${spaces}  ${fieldName}: null;`);
      } else if (Array.isArray(value)) {
        if (value.length > 0 && typeof value[0] === "object" && !Array.isArray(value[0])) {
          const itemInterfaceName = convertClassName(key.endsWith("s") ? key.slice(0, -1) : key);
          lines.push(`${spaces}  ${fieldName}: ${itemInterfaceName}[];`);
        } else {
          const itemType = value.length > 0 ? typeof value[0] : "any";
          lines.push(`${spaces}  ${fieldName}: ${itemType}[];`);
        }
      } else if (typeof value === "object") {
        const nestedName = convertClassName(key);
        lines.push(`${spaces}  ${fieldName}: ${nestedName};`);
      } else {
        lines.push(`${spaces}  ${fieldName}: ${typeof value};`);
      }
    }

    if (indent === 0) {
      lines.push("}");
      
      // Generate nested interfaces
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "object" && !Array.isArray(value) && value !== null) {
          const nestedName = convertClassName(key);
          lines.push("");
          lines.push(`export interface ${nestedName} {`);
          for (const [nestedKey, nestedValue] of Object.entries(value)) {
            const nestedFieldName = convertKey(nestedKey, "TypeScript");
            lines.push(`  ${nestedFieldName}: ${typeof nestedValue};`);
          }
          lines.push("}");
        } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
          const itemName = convertClassName(key.endsWith("s") ? key.slice(0, -1) : key);
          lines.push("");
          lines.push(`export interface ${itemName} {`);
          for (const [itemKey, itemValue] of Object.entries(value[0])) {
            const itemFieldName = convertKey(itemKey, "TypeScript");
            lines.push(`  ${itemFieldName}: ${typeof itemValue};`);
          }
          lines.push("}");
        }
      }
    }

    return lines.join("\n");
  };

  const generateJavaScript = (obj: Record<string, unknown>) => {
    return `// JavaScript Object\nconst data = ${JSON.stringify(obj, null, 2)};\n\n// ES6 Class\nclass Root {\n  constructor(data) {\n${Object.keys(obj).map(key => {
      const fieldName = convertKey(key, "JavaScript");
      return `    this.${fieldName} = data.${key};`;
    }).join("\n")}\n  }\n}`;
  };

  const generatePython = (obj: Record<string, unknown>) => {
    const lines = ["from dataclasses import dataclass", "from typing import List, Optional", "", "@dataclass", "class Root:"];
    
    for (const [key, value] of Object.entries(obj)) {
      const fieldName = convertKey(key, "Python");
      if (Array.isArray(value)) {
        const itemType = value.length > 0 ? (typeof value[0] === "string" ? "str" : "int") : "any";
        lines.push(`    ${fieldName}: List[${itemType}]`);
      } else if (typeof value === "object" && value !== null) {
        const nestedName = convertClassName(key);
        lines.push(`    ${fieldName}: ${nestedName}`);
      } else {
        const pyType = typeof value === "number" ? "int" : typeof value === "boolean" ? "bool" : "str";
        lines.push(`    ${fieldName}: ${pyType}`);
      }
    }

    // Generate nested classes
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "object" && !Array.isArray(value) && value !== null) {
        const nestedName = convertClassName(key);
        lines.push("", "@dataclass", `class ${nestedName}:`);
        for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
          const nestedFieldName = convertKey(nestedKey, "Python");
          const pyType = typeof nestedValue === "number" ? "int" : typeof nestedValue === "boolean" ? "bool" : "str";
          lines.push(`    ${nestedFieldName}: ${pyType}`);
        }
      }
    }

    return lines.join("\n");
  };

  const generateGo = (obj: Record<string, unknown>) => {
    const lines = ["type Root struct {"];
    
    for (const [key, value] of Object.entries(obj)) {
      const goKey = convertKey(key, "Go");
      
      if (Array.isArray(value)) {
        const itemType = value.length > 0 ? (typeof value[0] === "string" ? "string" : "int") : "interface{}";
        lines.push(`    ${goKey} []${itemType} \`json:"${key}"\``);
      } else if (typeof value === "object" && value !== null) {
        const nestedName = convertClassName(key);
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
        const nestedName = convertClassName(key);
        lines.push("", `type ${nestedName} struct {`);
        for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
          const goKey = convertKey(nestedKey, "Go");
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
      const rustKey = convertKey(key, "Rust");
      const needsRename = rustKey !== key;
      if (needsRename) {
        lines.push(`    #[serde(rename = "${key}")]`);
      }
      if (Array.isArray(value)) {
        const itemType = value.length > 0 ? (typeof value[0] === "string" ? "String" : "i32") : "serde_json::Value";
        lines.push(`    pub ${rustKey}: Vec<${itemType}>,`);
      } else if (typeof value === "object" && value !== null) {
        const nestedName = convertClassName(key);
        lines.push(`    pub ${rustKey}: ${nestedName},`);
      } else {
        const rustType = typeof value === "number" ? "i32" : typeof value === "boolean" ? "bool" : "String";
        lines.push(`    pub ${rustKey}: ${rustType},`);
      }
    }
    
    lines.push("}");

    // Generate nested structs
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "object" && !Array.isArray(value) && value !== null) {
        const nestedName = convertClassName(key);
        lines.push("", "#[derive(Debug, Serialize, Deserialize)]", `pub struct ${nestedName} {`);
        for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
          const rustKey = convertKey(nestedKey, "Rust");
          const needsRename = rustKey !== nestedKey;
          if (needsRename) {
            lines.push(`    #[serde(rename = "${nestedKey}")]`);
          }
          const rustType = typeof nestedValue === "number" ? "i32" : typeof nestedValue === "boolean" ? "bool" : "String";
          lines.push(`    pub ${rustKey}: ${rustType},`);
        }
        lines.push("}");
      }
    }

    return lines.join("\n");
  };

  const generateJava = (obj: Record<string, unknown>) => {
    const lines = ["public class Root {"];
    
    for (const [key, value] of Object.entries(obj)) {
      const javaKey = convertKey(key, "Java");
      if (Array.isArray(value)) {
        const itemType = value.length > 0 ? (typeof value[0] === "string" ? "String" : "Integer") : "Object";
        lines.push(`    private List<${itemType}> ${javaKey};`);
      } else if (typeof value === "object" && value !== null) {
        const nestedName = convertClassName(key);
        lines.push(`    private ${nestedName} ${javaKey};`);
      } else {
        const javaType = typeof value === "number" ? "Integer" : typeof value === "boolean" ? "Boolean" : "String";
        lines.push(`    private ${javaType} ${javaKey};`);
      }
    }
    
    lines.push("}");

    // Generate nested classes
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "object" && !Array.isArray(value) && value !== null) {
        const nestedName = convertClassName(key);
        lines.push("", `public class ${nestedName} {`);
        for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
          const javaKey = convertKey(nestedKey, "Java");
          const javaType = typeof nestedValue === "number" ? "Integer" : typeof nestedValue === "boolean" ? "Boolean" : "String";
          lines.push(`    private ${javaType} ${javaKey};`);
        }
        lines.push("}");
      }
    }

    return lines.join("\n");
  };

  const generateCSharp = (obj: Record<string, unknown>) => {
    const lines = ["public class Root {"];
    
    for (const [key, value] of Object.entries(obj)) {
      const csKey = convertKey(key, "C#");
      
      if (Array.isArray(value)) {
        const itemType = value.length > 0 ? (typeof value[0] === "string" ? "string" : "int") : "object";
        lines.push(`    public List<${itemType}> ${csKey} { get; set; }`);
      } else if (typeof value === "object" && value !== null) {
        const nestedName = convertClassName(key);
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
        const nestedName = convertClassName(key);
        lines.push("", `public class ${nestedName} {`);
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          const csKey = convertKey(nestedKey, "C#");
          const csType = typeof nestedValue === "number" ? "int" : typeof nestedValue === "boolean" ? "bool" : "string";
          lines.push(`    public ${csType} ${csKey} { get; set; }`);
        }
        lines.push("}");
      }
    }

    return lines.join("\n");
  };

  const generateCode = useCallback(() => {
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
  }, [input, language]);

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
    setOutput("");
    setError("");
  }, []);

  useKeyboardShortcuts({
    shortcuts: [
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
      title="JSON to Code"
      description="Generate type-safe code structures from JSON"
    >
      <div className="space-y-3">
        {/* Language Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground">Language:</span>
          {languages.map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => setLanguage(value)}
              aria-label={`Select ${label}`}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                language === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground"
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Action Toolbar */}
        <ActionToolbar
          right={
            <>
              <Button onClick={generateCode} size="sm" aria-label="Generate code">
                <Code2 className="h-4 w-4 mr-2" aria-hidden="true" />
                Generate {language} Code
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

        {/* Input/Output Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Input */}
          <div className="space-y-2">
            <span className="text-sm font-medium">JSON Input</span>
            <CodeEditor
              language="json"
              value={input}
              onChange={setInput}
              placeholder="Enter JSON object..."
            />
          </div>

          {/* Output */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Code Output ({language})</span>
            {error ? (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                {error}
              </div>
            ) : output ? (
              <CodeEditor
                language="json"
                value={output}
                readOnly
                label="Result"
              />
            ) : (
              <div className="rounded-md border bg-background min-h-[200px] flex items-center justify-center">
                <EmptyState
                  icon={Code2}
                  message="Enter JSON and click Generate to create code"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
