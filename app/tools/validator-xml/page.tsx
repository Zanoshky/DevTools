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
  stats?: {
    lines: number;
    characters: number;
    bytes: number;
    elements: number;
    attributes: number;
    textNodes: number;
    comments: number;
    depth: number;
    rootElement?: string;
    namespaces: number;
    emptyElements: number;
    selfClosingTags: number;
  };
  formatted?: string;
}

export default function XMLValidatorPage() {
  const [input, setInput] = useState<string>(`<?xml version="1.0" encoding="UTF-8"?>
<person>
  <name>John Doe</name>
  <age>30</age>
  <email>john@example.com</email>
  <address>
    <street>123 Main St</street>
    <city>New York</city>
    <zipCode>10001</zipCode>
  </address>
  <hobbies>
    <hobby>reading</hobby>
    <hobby>swimming</hobby>
    <hobby>coding</hobby>
  </hobbies>
</person>`);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const calculateDepth = useCallback((node: Node, currentDepth = 0): number => {
    let maxDepth = currentDepth;

    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const depth = calculateDepth(child, currentDepth + 1);
        maxDepth = Math.max(maxDepth, depth);
      }
    });

    return maxDepth;
  }, []);

  const collectStats = useCallback((doc: Document) => {
    let elements = 0;
    let attributes = 0;
    let textNodes = 0;
    let comments = 0;
    let emptyElements = 0;
    const namespaces = new Set<string>();

    function walk(node: Node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        elements++;
        const element = node as Element;
        
        // Count attributes
        attributes += element.attributes.length;
        
        // Check for namespaces
        if (element.namespaceURI) {
          namespaces.add(element.namespaceURI);
        }
        
        // Check if empty
        if (!element.textContent?.trim() && element.childNodes.length === 0) {
          emptyElements++;
        }
        
        // Process children
        Array.from(element.childNodes).forEach(walk);
      } else if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent?.trim()) {
          textNodes++;
        }
      } else if (node.nodeType === Node.COMMENT_NODE) {
        comments++;
      }
    }

    if (doc.documentElement) {
      walk(doc.documentElement);
    }

    return {
      elements,
      attributes,
      textNodes,
      comments,
      emptyElements,
      namespaces: namespaces.size,
      rootElement: doc.documentElement?.tagName,
    };
  }, []);

  const formatXML = useCallback((xmlString: string): string => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlString, "text/xml");
      
      if (doc.querySelector("parsererror")) {
        return xmlString;
      }

      const serializer = new XMLSerializer();
      let formatted = serializer.serializeToString(doc);
      
      // Simple formatting
      formatted = formatted.replace(/></g, ">\n<");
      
      // Add indentation
      const lines = formatted.split("\n");
      let indent = 0;
      const indentedLines = lines.map((line) => {
        const trimmed = line.trim();
        
        if (trimmed.startsWith("</")) {
          indent = Math.max(0, indent - 1);
        }
        
        const indentedLine = "  ".repeat(indent) + trimmed;
        
        if (trimmed.startsWith("<") && !trimmed.startsWith("</") && !trimmed.endsWith("/>") && !trimmed.includes("</")) {
          indent++;
        }
        
        return indentedLine;
      });
      
      return indentedLines.join("\n");
    } catch {
      return xmlString;
    }
  }, []);

  const validateXML = useCallback(
    (xmlString: string): ValidationResult => {
      if (!xmlString.trim()) {
        return {
          isValid: false,
          errors: [{ line: 1, column: 1, message: "Empty input", type: "format" }],
          warnings: [],
        };
      }

      const errors: ValidationError[] = [];
      const warnings: ValidationError[] = [];
      let isValid = true;
      let doc: Document | null = null;
      const lines = xmlString.split("\n");

      try {
        const parser = new DOMParser();
        doc = parser.parseFromString(xmlString, "text/xml");
        const parseError = doc.querySelector("parsererror");

        if (parseError) {
          isValid = false;
          const errorText = parseError.textContent || "XML parsing error";
          
          let line = 1;
          let column = 1;
          const message = errorText;
          let suggestion = "";

          // Try to extract line and column
          const lineMatch = errorText.match(/line (\d+)/i);
          const columnMatch = errorText.match(/column (\d+)/i);
          
          if (lineMatch) line = parseInt(lineMatch[1]);
          if (columnMatch) column = parseInt(columnMatch[1]);

          // Provide helpful suggestions
          if (errorText.includes("mismatched tag")) {
            suggestion = "Check that all opening tags have matching closing tags";
          } else if (errorText.includes("not well-formed")) {
            suggestion = "Check for unclosed tags, invalid characters, or syntax errors";
          } else if (errorText.includes("attribute")) {
            suggestion = "Check attribute syntax - attributes must be in quotes";
          } else if (errorText.includes("Unexpected")) {
            suggestion = "Check for invalid characters or malformed syntax";
          }

          errors.push({
            line,
            column,
            message,
            type: "syntax",
            suggestion,
            linePreview: lines[line - 1]?.substring(0, 100),
          });
        }
      } catch (err: unknown) {
        isValid = false;
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        
        errors.push({
          line: 1,
          column: 1,
          message: errorMessage,
          type: "syntax",
        });
      }

      // Check for warnings
      if (isValid && doc) {
        // Check for XML declaration
        if (!xmlString.trim().startsWith("<?xml")) {
          warnings.push({
            line: 1,
            column: 1,
            message: "Missing XML declaration",
            type: "format",
            suggestion: 'Add <?xml version="1.0" encoding="UTF-8"?> at the beginning',
            linePreview: lines[0]?.substring(0, 100),
          });
        }

        // Check for multiple root elements
        const rootChildren = Array.from(doc.childNodes).filter(
          (node) => node.nodeType === Node.ELEMENT_NODE
        );
        if (rootChildren.length > 1) {
          warnings.push({
            line: 0,
            column: 0,
            message: "Multiple root elements detected",
            type: "structure",
            suggestion: "XML documents should have a single root element",
          });
        }
      }

      const stats = isValid && doc
        ? {
            lines: xmlString.split("\n").length,
            characters: xmlString.length,
            bytes: new Blob([xmlString]).size,
            ...collectStats(doc),
            depth: doc.documentElement ? calculateDepth(doc.documentElement) : 0,
            selfClosingTags: (xmlString.match(/\/>/g) || []).length,
          }
        : undefined;

      const formatted = isValid ? formatXML(xmlString) : undefined;

      return {
        isValid,
        errors,
        warnings,
        stats,
        formatted,
      };
    },
    [calculateDepth, collectStats, formatXML]
  );

  const handleValidate = () => {
    const result = validateXML(input);
    setValidationResult(result);
  };

  const handleFormat = () => {
    const formatted = formatXML(input);
    setInput(formatted);
  };

  const handleMinify = () => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(input, "text/xml");
      
      if (!doc.querySelector("parsererror")) {
        const serializer = new XMLSerializer();
        const minified = serializer.serializeToString(doc);
        setInput(minified);
      }
    } catch {
      // If XML is invalid, validation will show the error
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
      title="XML Validator"
      description="Validate XML with detailed error reporting, statistics, and formatting"
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
          <Button onClick={handleMinify} variant="outline" size="sm">
            Minify
          </Button>
        </div>

        {/* Input/Output Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">XML Input</Label>
            <CopyTextarea
              value={input}
              onChange={setInput}
              placeholder="Enter XML to validate..."
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
                          Valid XML
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          Invalid XML
                        </span>
                      </>
                    )}
                    {validationResult.stats?.rootElement && (
                      <Badge variant="outline" className="ml-2">
                        {validationResult.stats.rootElement}
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
                          <StatCard label="Elements" value={validationResult.stats.elements} />
                          <StatCard label="Attributes" value={validationResult.stats.attributes} />
                          <StatCard label="Text Nodes" value={validationResult.stats.textNodes} />
                          <StatCard label="Comments" value={validationResult.stats.comments} />
                          <StatCard label="Namespaces" value={validationResult.stats.namespaces} />
                          <StatCard label="Empty Elements" value={validationResult.stats.emptyElements} />
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
