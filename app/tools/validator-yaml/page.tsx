"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToolLayout } from "@/components/tool-layout";
import { CopyTextarea } from "@/components/copy-textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileCode,
  Info,
  BarChart3,
} from "lucide-react";
import yaml from "js-yaml";

interface ValidationError {
  line: number;
  column: number;
  message: string;
  type: "syntax" | "structure" | "format";
  suggestion?: string;
  linePreview?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  type?: "object" | "array" | "primitive";
  stats?: {
    lines: number;
    characters: number;
    bytes: number;
    keys: number;
    arrayItems: number;
    depth: number;
    objects: number;
    arrays: number;
    booleans: number;
    numbers: number;
    strings: number;
    nulls: number;
    maxArrayLength: number;
    uniqueKeys: number;
    emptyStrings: number;
    emptyArrays: number;
    emptyObjects: number;
  };
  formatted?: string;
}

export default function YAMLValidatorPage() {
  const [input, setInput] = useState<string>(`name: John Doe
age: 30
email: john@example.com
city: New York
hobbies:
  - reading
  - swimming
  - coding
address:
  street: 123 Main St
  zipCode: "10001"`);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const calculateDepth = useCallback((obj: unknown, currentDepth = 0): number => {
    if (typeof obj !== "object" || obj === null) {
      return currentDepth;
    }

    let maxDepth = currentDepth;

    if (Array.isArray(obj)) {
      obj.forEach((item) => {
        const depth = calculateDepth(item, currentDepth + 1);
        maxDepth = Math.max(maxDepth, depth);
      });
    } else {
      Object.values(obj as Record<string, unknown>).forEach((value) => {
        const depth = calculateDepth(value, currentDepth + 1);
        maxDepth = Math.max(maxDepth, depth);
      });
    }

    return maxDepth;
  }, []);

  const collectStats = useCallback((obj: unknown) => {
    let keys = 0;
    let arrayItems = 0;
    let objects = 0;
    let arrays = 0;
    let booleans = 0;
    let numbers = 0;
    let strings = 0;
    let nulls = 0;
    let maxArrayLength = 0;
    let emptyStrings = 0;
    let emptyArrays = 0;
    let emptyObjects = 0;
    const uniqueKeysSet = new Set<string>();

    function walk(val: unknown) {
      if (Array.isArray(val)) {
        arrays++;
        if (val.length === 0) emptyArrays++;
        arrayItems += val.length;
        maxArrayLength = Math.max(maxArrayLength, val.length);
        val.forEach(walk);
      } else if (val && typeof val === "object") {
        objects++;
        const objKeys = Object.keys(val);
        if (objKeys.length === 0) emptyObjects++;
        keys += objKeys.length;
        objKeys.forEach((k) => uniqueKeysSet.add(k));
        Object.values(val).forEach(walk);
      } else if (typeof val === "boolean") {
        booleans++;
      } else if (typeof val === "number") {
        numbers++;
      } else if (typeof val === "string") {
        strings++;
        if (val === "") emptyStrings++;
      } else if (val === null) {
        nulls++;
      }
    }
    walk(obj);

    return {
      keys,
      arrayItems,
      objects,
      arrays,
      booleans,
      numbers,
      strings,
      nulls,
      maxArrayLength,
      uniqueKeys: uniqueKeysSet.size,
      emptyStrings,
      emptyArrays,
      emptyObjects,
    };
  }, []);

  const validateYAML = useCallback(
    (yamlString: string): ValidationResult => {
      if (!yamlString.trim()) {
        return {
          isValid: false,
          errors: [{ line: 1, column: 1, message: "Empty input", type: "format" }],
          warnings: [],
        };
      }

      const errors: ValidationError[] = [];
      const warnings: ValidationError[] = [];
      let parsedData: unknown = null;
      let isValid = true;
      const lines = yamlString.split("\n");

      try {
        parsedData = yaml.load(yamlString);
      } catch (err: unknown) {
        isValid = false;
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        
        let line = 1;
        let column = 1;
        const detailedMessage = errorMessage;
        let suggestion = "";

        // Extract line and column from error message - YAML errors often have format like "(11:3)"
        const lineMatch = errorMessage.match(/\((\d+):(\d+)\)/);
        if (lineMatch) {
          line = parseInt(lineMatch[1]);
          column = parseInt(lineMatch[2]);
        } else {
          // Fallback to "at line X" format
          const altLineMatch = errorMessage.match(/at line (\d+)/);
          const altColumnMatch = errorMessage.match(/column (\d+)/);
          if (altLineMatch) line = parseInt(altLineMatch[1]);
          if (altColumnMatch) column = parseInt(altColumnMatch[1]);
        }

        if (errorMessage.includes("duplicated mapping key")) {
          suggestion = "Remove or rename the duplicate key";
        } else if (errorMessage.includes("bad indentation")) {
          suggestion = "Check your indentation - YAML requires consistent spacing";
        } else if (errorMessage.includes("unexpected end")) {
          suggestion = "Check for incomplete structures or missing values";
        } else if (errorMessage.includes("can not read")) {
          suggestion = "Check for invalid characters or malformed syntax";
        } else if (errorMessage.includes("missed comma")) {
          suggestion = "Add a comma between flow collection items";
        }

        errors.push({
          line,
          column,
          message: detailedMessage,
          type: "syntax",
          suggestion,
          linePreview: lines[line - 1]?.substring(0, 100),
        });
      }

      if (isValid && yamlString.includes("\t")) {
        const tabLines = lines
          .map((line, idx) => (line.includes("\t") ? idx + 1 : -1))
          .filter((idx) => idx !== -1);
        
        if (tabLines.length > 0) {
          warnings.push({
            line: tabLines[0],
            column: 0,
            message: "Tabs detected in YAML",
            type: "format",
            suggestion: "YAML recommends using spaces instead of tabs for indentation",
            linePreview: lines[tabLines[0] - 1]?.substring(0, 100),
          });
        }
      }

      const stats = isValid
        ? {
            lines: yamlString.split("\n").length,
            characters: yamlString.length,
            bytes: new Blob([yamlString]).size,
            ...collectStats(parsedData),
            depth: calculateDepth(parsedData),
          }
        : undefined;

      const type = Array.isArray(parsedData)
        ? "array"
        : typeof parsedData === "object" && parsedData !== null
        ? "object"
        : "primitive";

      const formatted = isValid ? yaml.dump(parsedData, { indent: 2, lineWidth: 120 }) : undefined;

      return {
        isValid,
        errors,
        warnings,
        type,
        stats,
        formatted,
      };
    },
    [calculateDepth, collectStats]
  );

  const handleValidate = () => {
    const result = validateYAML(input);
    setValidationResult(result);
  };

  const handleFormat = () => {
    try {
      const parsed = yaml.load(input);
      const formatted = yaml.dump(parsed, { indent: 2, lineWidth: 120 });
      setInput(formatted);
    } catch {
      // If YAML is invalid, validation will show the error
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (input.trim()) {
        handleValidate();
      } else {
        setValidationResult(null);
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  return (
    <ToolLayout
      title="YAML Validator"
      description="Validate YAML with detailed error reporting, statistics, and formatting"
    >
      <div className="space-y-3">
        {/* Action Buttons Row */}
        <div className="flex justify-end gap-2">
          <Button onClick={handleValidate} size="sm">
            <FileCode className="h-4 w-4 mr-2" />
            Validate
          </Button>
          <Button onClick={handleFormat} variant="outline" size="sm">
            Format
          </Button>
        </div>

        {/* Input/Output Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">YAML Input</Label>
            <CopyTextarea
              value={input}
              onChange={setInput}
              placeholder="Enter YAML to validate..."
              rows={20}
              className="font-mono text-xs"
            />
          </div>

          {/* Results */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Validation Results</Label>
            <div className="border rounded-lg p-3 bg-card min-h-[520px] overflow-y-auto">
              {!validationResult ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                  <Info className="h-12 w-12 mb-4" />
                  <p>Results will appear here...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    {validationResult.isValid ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          Valid YAML
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          Invalid YAML
                        </span>
                      </>
                    )}
                    {validationResult.type && (
                      <Badge variant="outline" className="ml-2">
                        {validationResult.type}
                      </Badge>
                    )}
                  </div>

                  <Tabs defaultValue="errors" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="errors" className="text-xs">
                        Errors ({validationResult.errors.length})
                      </TabsTrigger>
                      <TabsTrigger value="warnings" className="text-xs">
                        Warnings ({validationResult.warnings.length})
                      </TabsTrigger>
                      <TabsTrigger value="stats" className="text-xs">Statistics</TabsTrigger>
                    </TabsList>

                    <TabsContent value="errors" className="space-y-2 mt-3">
                      {validationResult.errors.length > 0 ? (
                        validationResult.errors.map((error, index) => (
                          <Alert key={index} variant="destructive" className="text-xs">
                            <XCircle className="h-3 w-3" />
                            <AlertDescription className="space-y-1">
                              <div className="font-medium text-xs">
                                Line {error.line}, Column {error.column}
                              </div>
                              <div className="text-xs">{error.message}</div>
                              {error.linePreview && (
                                <div className="text-xs bg-red-100 dark:bg-red-950/40 p-2 rounded border border-red-300 dark:border-red-700 mt-1 font-mono overflow-x-auto">
                                  <div className="text-red-700 dark:text-red-300 whitespace-nowrap">
                                    {error.linePreview}
                                    {error.linePreview.length >= 100 && "..."}
                                  </div>
                                </div>
                              )}
                              {error.suggestion && (
                                <div className="text-xs bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-200 dark:border-red-800 mt-1">
                                  <strong>Suggestion:</strong> {error.suggestion}
                                </div>
                              )}
                            </AlertDescription>
                          </Alert>
                        ))
                      ) : (
                        <div className="text-center py-6 text-muted-foreground text-xs">
                          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                          <p>No errors found</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="warnings" className="space-y-2 mt-3">
                      {validationResult.warnings.length > 0 ? (
                        validationResult.warnings.map((warning, index) => (
                          <Alert key={index} className="text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            <AlertDescription className="space-y-1">
                              {warning.line > 0 && (
                                <div className="font-medium text-xs">
                                  Line {warning.line}, Column {warning.column}
                                </div>
                              )}
                              <div className="text-xs">{warning.message}</div>
                              {warning.linePreview && (
                                <div className="text-xs bg-yellow-100 dark:bg-yellow-950/40 p-2 rounded border border-yellow-300 dark:border-yellow-700 mt-1 font-mono overflow-x-auto">
                                  <div className="text-yellow-800 dark:text-yellow-300 whitespace-nowrap">
                                    {warning.linePreview}
                                    {warning.linePreview.length >= 100 && "..."}
                                  </div>
                                </div>
                              )}
                              {warning.suggestion && (
                                <div className="text-xs bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded border border-yellow-200 dark:border-yellow-800 mt-1">
                                  <strong>Suggestion:</strong> {warning.suggestion}
                                </div>
                              )}
                            </AlertDescription>
                          </Alert>
                        ))
                      ) : (
                        <div className="text-center py-6 text-muted-foreground text-xs">
                          <Info className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                          <p>No warnings</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="stats" className="mt-3">
                      {validationResult.stats ? (
                        <div className="grid grid-cols-2 gap-2">
                          <StatCard label="Lines" value={validationResult.stats.lines} />
                          <StatCard label="Characters" value={validationResult.stats.characters} />
                          <StatCard label="Bytes" value={validationResult.stats.bytes} />
                          <StatCard label="Depth" value={validationResult.stats.depth} />
                          <StatCard label="Objects" value={validationResult.stats.objects} />
                          <StatCard label="Arrays" value={validationResult.stats.arrays} />
                          <StatCard label="Keys" value={validationResult.stats.keys} />
                          <StatCard label="Unique Keys" value={validationResult.stats.uniqueKeys} />
                          <StatCard label="Strings" value={validationResult.stats.strings} />
                          <StatCard label="Numbers" value={validationResult.stats.numbers} />
                          <StatCard label="Booleans" value={validationResult.stats.booleans} />
                          <StatCard label="Nulls" value={validationResult.stats.nulls} />
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground text-xs">
                          <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                          <p>No statistics available</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-muted/50 rounded-lg p-2 border">
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className="text-lg font-bold">{value.toLocaleString()}</div>
    </div>
  );
}
