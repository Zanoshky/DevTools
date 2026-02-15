"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout";
import { CopyTextarea } from "@/components/copy-textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Braces, Info, ArrowRight } from "lucide-react";

const cases = [
  { value: "camelCase", label: "camelCase", example: "userFirstName" },
  { value: "PascalCase", label: "PascalCase", example: "UserFirstName" },
  { value: "snake_case", label: "snake_case", example: "user_first_name" },
  { value: "SCREAMING_SNAKE_CASE", label: "SCREAMING_SNAKE", example: "USER_FIRST_NAME" },
  { value: "kebab-case", label: "kebab-case", example: "user-first-name" },
  { value: "dot.case", label: "dot.case", example: "user.first.name" },
] as const;

type CaseType = typeof cases[number]["value"];

export default function CasingConverterPage() {
  const [input, setInput] = useState(`{
  "userFirstName": "John",
  "userLastName": "Doe",
  "userEmailAddress": "john.doe@example.com",
  "userDateOfBirth": "1990-01-15",
  "userPhoneNumber": "+1-555-0123",
  "addressOfResidence": {
    "streetAddressLine1": "123 Main Street",
    "streetAddressLine2": "Apartment 4B",
    "cityName": "New York",
    "stateOrProvinceName": "New York",
    "postalCodeOrZipCode": "10001",
    "countryName": "United States"
  },
  "employmentInformation": {
    "companyName": "Tech Corp Inc",
    "jobTitleOrPosition": "Senior Software Engineer",
    "departmentName": "Engineering",
    "employmentStartDate": "2020-03-15",
    "annualSalaryAmount": 120000
  },
  "accountPreferences": {
    "receiveEmailNotifications": true,
    "receiveSmsNotifications": false,
    "preferredLanguageCode": "en-US",
    "preferredTimeZoneIdentifier": "America/New_York"
  },
  "socialMediaProfiles": [
    {
      "platformName": "LinkedIn",
      "profileUrl": "https://linkedin.com/in/johndoe",
      "isPubliclyVisible": true
    },
    {
      "platformName": "GitHub",
      "profileUrl": "https://github.com/johndoe",
      "isPubliclyVisible": true
    }
  ]
}`);
  const [targetCase, setTargetCase] = useState<CaseType>("snake_case");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [detectedFormat, setDetectedFormat] = useState<string>("");

  const detectCaseFormat = (str: string): string => {
    if (!str || str.length === 0) return "unknown";
    
    // Check for different patterns
    if (/^[a-z]+([A-Z][a-z]*)*$/.test(str)) {
      return "camelCase";
    } else if (/^[A-Z][a-z]*([A-Z][a-z]*)*$/.test(str)) {
      return "PascalCase";
    } else if (/^[A-Z_]+$/.test(str) && str.includes("_")) {
      return "SCREAMING_SNAKE_CASE";
    } else if (/^[a-z]+(_[a-z]+)*$/.test(str)) {
      return "snake_case";
    } else if (/^[a-z]+(-[a-z]+)*$/.test(str)) {
      return "kebab-case";
    } else if (/^[a-z]+(.[a-z]+)*$/.test(str)) {
      return "dot.case";
    }
    
    return "mixed";
  };

  const analyzeJsonFormat = (obj: Record<string, unknown> | unknown[]): { [key: string]: number } => {
    const formatCounts: { [key: string]: number } = {};
    
    const analyzeKeys = (o: Record<string, unknown> | unknown[]) => {
      if (Array.isArray(o)) {
        o.forEach(item => analyzeKeys(item as Record<string, unknown> | unknown[]));
      } else if (o !== null && typeof o === "object") {
        for (const key in o) {
          const format = detectCaseFormat(key);
          formatCounts[format] = (formatCounts[format] || 0) + 1;
          analyzeKeys(o[key] as Record<string, unknown> | unknown[]);
        }
      }
    };
    
    analyzeKeys(obj);
    return formatCounts;
  };

  const getMostCommonFormat = (formatCounts: { [key: string]: number }): string => {
    let maxCount = 0;
    let mostCommon = "mixed";
    
    for (const [format, count] of Object.entries(formatCounts)) {
      if (count > maxCount && format !== "unknown" && format !== "mixed") {
        maxCount = count;
        mostCommon = format;
      }
    }
    
    return mostCommon;
  };

  const convertCase = (str: string, toCase: CaseType): string => {
    // Split words based on detected format
    let words: string[] = [];

    // Handle SCREAMING_SNAKE_CASE
    if (/^[A-Z_]+$/.test(str) && str.includes("_")) {
      words = str.split("_").filter(w => w.length > 0);
    }
    // Handle snake_case
    else if (str.includes("_")) {
      words = str.split("_").filter(w => w.length > 0);
    }
    // Handle kebab-case
    else if (str.includes("-")) {
      words = str.split("-").filter(w => w.length > 0);
    }
    // Handle dot.case
    else if (str.includes(".")) {
      words = str.split(".").filter(w => w.length > 0);
    }
    // Handle camelCase or PascalCase
    else if (/[A-Z]/.test(str)) {
      // Split on capital letters
      words = str.replace(/([A-Z])/g, " $1").trim().split(/\s+/).filter(w => w.length > 0);
    }
    // Handle all lowercase (no separators)
    else if (/^[a-z]+$/.test(str)) {
      words = [str];
    }
    // Fallback: treat as single word
    else {
      words = [str];
    }

    // Normalize all words to lowercase for consistent conversion
    words = words.map(w => w.toLowerCase());

    // Join words in target format
    switch (toCase) {
      case "camelCase":
        return words.map((w, i) => 
          i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)
        ).join("");
      
      case "PascalCase":
        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("");
      
      case "snake_case":
        return words.join("_");
      
      case "SCREAMING_SNAKE_CASE":
        return words.map(w => w.toUpperCase()).join("_");
      
      case "kebab-case":
        return words.join("-");
      
      case "dot.case":
        return words.join(".");
      
      default:
        return str;
    }
  };

  const convertJsonKeys = (obj: unknown, toCase: CaseType): unknown => {
    if (Array.isArray(obj)) {
      return obj.map(item => convertJsonKeys(item, toCase));
    }
    
    if (obj !== null && typeof obj === "object") {
      const newObj: Record<string, unknown> = {};
      for (const key in obj as Record<string, unknown>) {
        const newKey = convertCase(key, toCase);
        newObj[newKey] = convertJsonKeys((obj as Record<string, unknown>)[key], toCase);
      }
      return newObj;
    }
    
    return obj;
  };

  const handleConvert = () => {
    setError("");
    setDetectedFormat("");
    try {
      const parsed = JSON.parse(input);
      
      // Analyze and detect format
      const formatCounts = analyzeJsonFormat(parsed);
      const detected = getMostCommonFormat(formatCounts);
      setDetectedFormat(detected);
      
      const converted = convertJsonKeys(parsed, targetCase);
      setOutput(JSON.stringify(converted, null, 2));
    } catch (err) {
      setError("Invalid JSON: " + (err instanceof Error ? err.message : "Parse error"));
      setOutput("");
      setDetectedFormat("");
    }
  };

  return (
    <ToolLayout
      title="JSON Key Casing Converter"
      description="Convert JSON object keys between different casing formats"
    >
      <div className="space-y-3">
        {/* Compact Toolbar */}
        <div className="p-3 bg-card border rounded-lg">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Target Format</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {cases.map(({ value, label, example }) => (
                <button
                  key={value}
                  onClick={() => setTargetCase(value)}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    targetCase === value
                      ? "border-foreground bg-secondary"
                      : "border-border hover:border-foreground/50"
                  }`}
                >
                  <div className="text-xs font-medium truncate">{label}</div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate" title={example}>
                    {example}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Convert Button Row */}
        <div className="flex justify-end">
          <Button onClick={handleConvert} size="sm">
            <ArrowRight className="h-4 w-4 mr-2" />
            Convert to {cases.find(c => c.value === targetCase)?.label}
          </Button>
        </div>

        {/* Input/Output Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Input */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Input</span>
              {detectedFormat && (
                <Badge variant="secondary" className="text-xs">
                  {detectedFormat}
                </Badge>
              )}
            </div>
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
              <span className="text-sm font-medium">Output</span>
              <Badge variant="secondary" className="text-xs">
                {cases.find(c => c.value === targetCase)?.label}
              </Badge>
            </div>
            <CopyTextarea
              value={output}
              readOnly
              placeholder="Output will appear here..."
              rows={20}
              className="font-mono text-xs"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {/* Info */}
        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
          <Braces className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-xs">
            <strong>Note:</strong> Only JSON keys are converted. Values like <code className="bg-muted px-1 rounded">&quot;John Doe&quot;</code>, <code className="bg-muted px-1 rounded">120000</code>, and <code className="bg-muted px-1 rounded">true</code> remain unchanged. Nested objects and arrays are fully supported.
          </AlertDescription>
        </Alert>
      </div>
    </ToolLayout>
  );
}
