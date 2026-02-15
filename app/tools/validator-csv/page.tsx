"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToolLayout } from "@/components/tool-layout";
import { CopyTextarea } from "@/components/copy-textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Table,
  Info,
  BarChart3,
} from "lucide-react";

interface ValidationError {
  line: number;
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
    rows: number;
    dataRows: number;
    columns: number;
    totalCells: number;
    emptyCells: number;
    headers: string[];
    delimiter: string;
    hasHeader: boolean;
    bytes: number;
    characters: number;
    quotedFields: number;
    maxColumnWidth: number;
    minColumnWidth: number;
  };
  preview?: string[][];
}

export default function CSVValidatorPage() {
  const [input, setInput] = useState<string>(`name,age,email,city,country
John Doe,30,john@example.com,New York,USA
Jane Smith,25,jane@example.com,London,UK
Bob Johnson,35,bob@example.com,Toronto,Canada
Alice Williams,28,alice@example.com,Sydney,Australia
Charlie Brown,32,charlie@example.com,Berlin,Germany`);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [delimiter] = useState(",");
  const [hasHeaderToggle, setHasHeaderToggle] = useState(true);

  const parseCSV = useCallback((csvString: string, delim: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = "";
    let inQuotes = false;

    for (let i = 0; i < csvString.length; i++) {
      const char = csvString[i];
      const nextChar = csvString[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delim && !inQuotes) {
        currentRow.push(currentField);
        currentField = "";
      } else if (char === "\n" && !inQuotes) {
        currentRow.push(currentField);
        if (currentRow.some((field) => field.trim() !== "")) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
      } else if (char === "\r" && nextChar === "\n" && !inQuotes) {
        currentRow.push(currentField);
        if (currentRow.some((field) => field.trim() !== "")) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
        i++;
      } else {
        currentField += char;
      }
    }

    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField);
      if (currentRow.some((field) => field.trim() !== "")) {
        rows.push(currentRow);
      }
    }

    return rows;
  }, []);

  const validateCSV = useCallback(
    (csvString: string): ValidationResult => {
      if (!csvString.trim()) {
        return {
          isValid: false,
          errors: [{ line: 1, message: "Empty input", type: "format" }],
          warnings: [],
        };
      }

      const errors: ValidationError[] = [];
      const warnings: ValidationError[] = [];
      let isValid = true;

      try {
        const rows = parseCSV(csvString, delimiter);
        const lines = csvString.split("\n");

        if (rows.length === 0) {
          return {
            isValid: false,
            errors: [{ line: 1, message: "No valid rows found", type: "structure" }],
            warnings: [],
          };
        }

        const expectedColumns = rows[0].length;
        let emptyCells = 0;
        let quotedFields = 0;
        let maxColumnWidth = 0;
        let minColumnWidth = Infinity;

        // Check for inconsistent column counts
        rows.forEach((row, index) => {
          if (row.length !== expectedColumns) {
            errors.push({
              line: index + 1,
              message: `Expected ${expectedColumns} columns, got ${row.length}`,
              type: "structure",
              suggestion: "Ensure all rows have the same number of columns",
              linePreview: lines[index]?.substring(0, 100) || row.join(delimiter).substring(0, 100),
            });
            isValid = false;
          }

          // Count empty cells and quoted fields
          row.forEach((cell) => {
            if (cell.trim() === "") emptyCells++;
            if (csvString.includes(`"${cell}"`)) quotedFields++;
            maxColumnWidth = Math.max(maxColumnWidth, cell.length);
            if (cell.length > 0) {
              minColumnWidth = Math.min(minColumnWidth, cell.length);
            }
          });
        });

        // Check for potential issues
        if (rows.length === 1) {
          warnings.push({
            line: 0,
            message: "Only one row detected",
            type: "structure",
            suggestion: "CSV files typically have a header row and data rows",
          });
        }

        // Check if first row looks like a header using multiple heuristics
        const firstRow = rows[0];
        let hasHeader = false;
        
        if (rows.length > 1) {
          let headerScore = 0;
          const secondRow = rows[1];
          
          // Heuristic 1: First row has no numbers, but second row does
          const firstRowHasNumbers = firstRow.some(cell => !isNaN(Number(cell)) && cell.trim() !== "");
          const secondRowHasNumbers = secondRow.some(cell => !isNaN(Number(cell)) && cell.trim() !== "");
          if (!firstRowHasNumbers && secondRowHasNumbers) headerScore += 2;
          
          // Heuristic 2: First row cells are shorter on average (typical for headers)
          const firstRowAvgLength = firstRow.reduce((sum, cell) => sum + cell.length, 0) / firstRow.length;
          const secondRowAvgLength = secondRow.reduce((sum, cell) => sum + cell.length, 0) / secondRow.length;
          if (firstRowAvgLength < secondRowAvgLength * 0.8) headerScore += 1;
          
          // Heuristic 3: First row has unique values (headers are typically unique)
          const firstRowUnique = new Set(firstRow.filter(c => c.trim())).size === firstRow.filter(c => c.trim()).length;
          if (firstRowUnique) headerScore += 2;
          
          // Heuristic 4: First row contains common header keywords
          const headerKeywords = /^(id|name|email|date|time|age|price|amount|total|count|status|type|category|description|address|phone|city|country|code|number|value|title)/i;
          const hasHeaderKeywords = firstRow.some(cell => headerKeywords.test(cell.trim()));
          if (hasHeaderKeywords) headerScore += 2;
          
          // Heuristic 5: First row has no empty cells (headers are usually complete)
          const firstRowComplete = firstRow.every(cell => cell.trim() !== "");
          if (firstRowComplete) headerScore += 1;
          
          // Heuristic 6: Data rows have consistent types, different from first row
          if (rows.length > 2) {
            const dataRowsHaveSameTypes = rows.slice(1, Math.min(5, rows.length)).every(row => 
              row.every((cell, idx) => {
                const isNum = !isNaN(Number(cell)) && cell.trim() !== "";
                const firstIsNum = !isNaN(Number(secondRow[idx])) && secondRow[idx].trim() !== "";
                return isNum === firstIsNum;
              })
            );
            if (dataRowsHaveSameTypes) headerScore += 1;
          }
          
          // Decision: if score >= 4, likely has header
          hasHeader = headerScore >= 4;
        } else {
          // Single row - assume it's a header if it has no numbers
          hasHeader = firstRow.every((cell) => isNaN(Number(cell)) || cell.trim() === "");
        }

        // Check for trailing delimiters
        lines.forEach((line, index) => {
          if (line.trim().endsWith(delimiter)) {
            warnings.push({
              line: index + 1,
              message: "Trailing delimiter detected",
              type: "format",
              suggestion: "Remove trailing delimiters at the end of rows",
              linePreview: line.substring(0, 100),
            });
          }
        });

        const stats = {
          rows: rows.length,
          dataRows: hasHeader ? rows.length - 1 : rows.length,
          columns: expectedColumns,
          totalCells: rows.reduce((sum, row) => sum + row.length, 0),
          emptyCells,
          headers: hasHeader ? rows[0] : [],
          delimiter,
          hasHeader,
          bytes: new Blob([csvString]).size,
          characters: csvString.length,
          quotedFields,
          maxColumnWidth,
          minColumnWidth: minColumnWidth === Infinity ? 0 : minColumnWidth,
        };

        const preview = rows.slice(0, 10);

        return {
          isValid: isValid && errors.length === 0,
          errors,
          warnings,
          stats,
          preview,
        };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        return {
          isValid: false,
          errors: [
            {
              line: 1,
              message: errorMessage,
              type: "syntax",
            },
          ],
          warnings: [],
        };
      }
    },
    [delimiter, parseCSV]
  );

  const handleValidate = () => {
    const result = validateCSV(input);
    setValidationResult(result);
  };

  const handleFormat = () => {
    try {
      const rows = parseCSV(input, delimiter);
      const formatted = rows.map((row) => row.join(delimiter)).join("\n");
      setInput(formatted);
    } catch {
      // If CSV is invalid, validation will show the error
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
  }, [input, delimiter]);

  // Auto-detect header when validation result changes
  useEffect(() => {
    if (validationResult?.stats?.hasHeader !== undefined) {
      setHasHeaderToggle(validationResult.stats.hasHeader);
    }
  }, [validationResult]);

  return (
    <ToolLayout
      title="CSV Validator"
      description="Validate CSV with detailed error reporting, statistics, and formatting"
    >
      <div className="space-y-3">
        {/* Action Buttons Row */}
        <div className="flex justify-end gap-2">
          <Button onClick={handleValidate} size="sm">
            <Table className="h-4 w-4 mr-2" />
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
            <Label className="text-sm font-medium">CSV Input</Label>
            <CopyTextarea
              value={input}
              onChange={setInput}
              placeholder="Enter CSV to validate..."
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
                          Valid CSV
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          Invalid CSV
                        </span>
                      </>
                    )}
                    {validationResult.stats && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {validationResult.stats.rows} rows × {validationResult.stats.columns} columns
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
                      <TabsTrigger value="stats" className="text-xs">Stats</TabsTrigger>
                    </TabsList>

                    <TabsContent value="errors" className="space-y-2 mt-3">
                      {validationResult.errors.length > 0 ? (
                        validationResult.errors.map((error, index) => (
                          <Alert key={index} variant="destructive" className="text-xs">
                            <XCircle className="h-3 w-3" />
                            <AlertDescription className="space-y-1">
                              <div className="font-medium text-xs">Line {error.line}</div>
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
                                <div className="font-medium text-xs">Line {warning.line}</div>
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
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <StatCard label="Total Rows" value={validationResult.stats.rows} />
                            <StatCard label="Data Rows" value={validationResult.stats.dataRows} />
                            <StatCard label="Columns" value={validationResult.stats.columns} />
                            <StatCard label="Total Cells" value={validationResult.stats.totalCells} />
                            <StatCard label="Empty Cells" value={validationResult.stats.emptyCells} />
                            <StatCard label="Characters" value={validationResult.stats.characters} />
                          </div>
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

        {/* Preview Section - Standalone Row */}
        {validationResult && validationResult.preview && validationResult.preview.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Data Preview</Label>
              <div className="flex items-center gap-2">
                <Label htmlFor="has-header" className="text-xs text-muted-foreground cursor-pointer">
                  First row is header
                </Label>
                <Switch
                  id="has-header"
                  checked={hasHeaderToggle}
                  onCheckedChange={setHasHeaderToggle}
                />
              </div>
            </div>
            <div className="border rounded-lg p-3 bg-card overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2 text-left font-medium">#</th>
                    {validationResult.preview[0].map((_, colIndex) => (
                      <th key={colIndex} className="border p-2 text-left font-medium text-xs">
                        {hasHeaderToggle && validationResult.preview?.[0]?.[colIndex]
                          ? validationResult.preview[0][colIndex]
                          : `Col ${colIndex + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {validationResult.preview
                    .slice(hasHeaderToggle ? 1 : 0)
                    .map((row, rowIndex) => {
                      const actualRowNumber = hasHeaderToggle ? rowIndex + 2 : rowIndex + 1;
                      return (
                        <tr key={rowIndex}>
                          <td className="border p-2 font-medium text-muted-foreground text-xs">
                            {actualRowNumber}
                          </td>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="border p-2 text-xs">
                              {cell || <span className="text-muted-foreground italic">empty</span>}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              {validationResult.stats && validationResult.stats.rows > 10 && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Showing first {hasHeaderToggle ? 9 : 10} {hasHeaderToggle ? 'data ' : ''}rows of {validationResult.stats.rows} total
                </p>
              )}
            </div>
          </div>
        )}
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
