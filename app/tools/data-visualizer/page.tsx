
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToolLayout } from "@/components/tool-layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, BarChart3, LineChart, PieChart, ScatterChart, Activity, ArrowUpDown, ArrowUp, ArrowDown, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { ActionToolbar } from "@/components/action-toolbar";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

type ChartType = "line" | "bar" | "pie" | "table" | "area" | "scatter";

export default function DataVisualizerPage() {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [chartType, setChartType] = useState<ChartType>("table");
  const [xAxis, setXAxis] = useState<string>("");
  const [yAxis, setYAxis] = useState<string>("");
  const [groupData, setGroupData] = useState(true);
  const [visibleRange, setVisibleRange] = useState<[number, number]>([0, 100]);
  const [sortColumns, setSortColumns] = useState<Array<{ column: string; direction: "asc" | "desc" }>>([]);
  const [showAreaFill, setShowAreaFill] = useState(false);
  const [globalSearch, setGlobalSearch] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; value: number } | null>(null);

  const isEmpty = data.length === 0;

  const handleClear = useCallback(() => {
    setData([]);
    setHeaders([]);
    setChartType("table");
    setXAxis("");
    setYAxis("");
    setGroupData(true);
    setVisibleRange([0, 100]);
    setSortColumns([]);
    setShowAreaFill(false);
    setGlobalSearch("");
    setSelectedRows(new Set());
    setHoveredPoint(null);
  }, []);

  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "x",
        ctrl: true,
        shift: true,
        action: handleClear,
        description: "Clear all",
      },
    ],
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE) {
      toast.error("File too large. Maximum size is 50MB");
      return;
    }

    try {
      const text = await file.text();
      
      if (file.name.endsWith('.csv')) {
        parseCSV(text);
      } else if (file.name.endsWith('.json')) {
        parseJSON(text);
      } else {
        toast.error("Unsupported file type. Please upload CSV or JSON");
      }
    } catch (error) {
      toast.error("Failed to parse file");
      console.error(error);
    }
  };

  const parseCSV = (text: string) => {
    // RFC 4180 compliant character-by-character CSV parser
    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let inQuotes = false;
    let i = 0;

    while (i < text.length) {
      const ch = text[i];

      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < text.length && text[i + 1] === '"') {
            field += '"';
            i += 2;
          } else {
            inQuotes = false;
            i++;
          }
        } else {
          field += ch;
          i++;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
          i++;
        } else if (ch === ',') {
          row.push(field);
          field = "";
          i++;
        } else if (ch === '\r' && i + 1 < text.length && text[i + 1] === '\n') {
          row.push(field);
          field = "";
          rows.push(row);
          row = [];
          i += 2;
        } else if (ch === '\n') {
          row.push(field);
          field = "";
          rows.push(row);
          row = [];
          i++;
        } else {
          field += ch;
          i++;
        }
      }
    }

    // Push last field/row
    if (field || row.length > 0) {
      row.push(field);
      rows.push(row);
    }

    if (rows.length < 2) {
      toast.error("CSV file must have at least a header and one data row");
      return;
    }

    const headers = rows[0];
    const dataRows = rows.slice(1)
      .filter(r => r.some(cell => cell !== ""))
      .map(values => {
        const obj: Record<string, string> = {};
        headers.forEach((header, idx) => {
          obj[header] = values[idx] || '';
        });
        return obj;
      });

    setHeaders(headers);
    setData(dataRows);
    setXAxis(headers[0] || '');
    setYAxis(headers[1] || '');
    toast.success(`Loaded ${dataRows.length} rows`);
  };

  const parseJSON = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      const array = Array.isArray(parsed) ? parsed : [parsed];
      
      if (array.length === 0) {
        toast.error("JSON file is empty");
        return;
      }

      const headers = Object.keys(array[0]);
      setHeaders(headers);
      setData(array);
      setXAxis(headers[0] || '');
      setYAxis(headers[1] || '');
      toast.success(`Loaded ${array.length} rows`);
    } catch (error) {
      toast.error("Invalid JSON format");
    }
  };

  const loadSampleData = () => {
    const sampleData = [
      { Date: "2024-01-01", Product: "Widget A", Sales: 1250, Revenue: 3750, Customers: 45 },
      { Date: "2024-01-02", Product: "Widget A", Sales: 1180, Revenue: 3540, Customers: 42 },
      { Date: "2024-01-03", Product: "Widget A", Sales: 1420, Revenue: 4260, Customers: 51 },
      { Date: "2024-01-04", Product: "Widget A", Sales: 980, Revenue: 2940, Customers: 35 },
      { Date: "2024-01-05", Product: "Widget A", Sales: 1650, Revenue: 4950, Customers: 59 },
      { Date: "2024-01-06", Product: "Widget B", Sales: 2100, Revenue: 8400, Customers: 68 },
      { Date: "2024-01-07", Product: "Widget B", Sales: 1890, Revenue: 7560, Customers: 61 },
      { Date: "2024-01-08", Product: "Widget B", Sales: 2250, Revenue: 9000, Customers: 73 },
      { Date: "2024-01-09", Product: "Widget B", Sales: 1950, Revenue: 7800, Customers: 63 },
      { Date: "2024-01-10", Product: "Widget B", Sales: 2400, Revenue: 9600, Customers: 78 },
      { Date: "2024-01-11", Product: "Widget C", Sales: 850, Revenue: 2125, Customers: 28 },
      { Date: "2024-01-12", Product: "Widget C", Sales: 920, Revenue: 2300, Customers: 31 },
      { Date: "2024-01-13", Product: "Widget C", Sales: 780, Revenue: 1950, Customers: 26 },
      { Date: "2024-01-14", Product: "Widget C", Sales: 1050, Revenue: 2625, Customers: 35 },
      { Date: "2024-01-15", Product: "Widget C", Sales: 890, Revenue: 2225, Customers: 30 },
      { Date: "2024-01-16", Product: "Widget A", Sales: 1320, Revenue: 3960, Customers: 47 },
      { Date: "2024-01-17", Product: "Widget A", Sales: 1480, Revenue: 4440, Customers: 53 },
      { Date: "2024-01-18", Product: "Widget A", Sales: 1150, Revenue: 3450, Customers: 41 },
      { Date: "2024-01-19", Product: "Widget B", Sales: 2180, Revenue: 8720, Customers: 71 },
      { Date: "2024-01-20", Product: "Widget B", Sales: 2050, Revenue: 8200, Customers: 66 },
    ];

    const headers = Object.keys(sampleData[0]);
    setHeaders(headers);
    setData(sampleData);
    setXAxis(headers[0] || '');
    setYAxis(headers[2] || ''); // Set to Sales column
    toast.success(`Loaded ${sampleData.length} sample rows`);
  };

  const getNumericValue = (value: unknown): number => {
    if (typeof value === 'number') return value;
    const str = String(value).replace(/[^0-9.-]/g, '');
    return parseFloat(str) || 0;
  };

  const renderChart = () => {
    if (data.length === 0) return null;

    switch (chartType) {
      case "table":
        return renderTable();
      case "line":
      case "area":
        return renderLineChart();
      case "bar":
        return renderBarChart();
      case "pie":
        return renderPieChart();
      case "scatter":
        return renderScatterChart();
      default:
        return null;
    }
  };

  const renderTable = () => {
    let filteredData = [...data];

    // Apply global search with advanced operators
    if (globalSearch.trim()) {
      const searchTerm = globalSearch.trim();
      
      // Check for advanced operators: column > value, column < value, column = value
      // Support column names with spaces and special characters
      const operatorMatch = searchTerm.match(/^(.+?)\s*([><=]+)\s*(.+)$/);
      
      if (operatorMatch) {
        const [, columnInput, operator, value] = operatorMatch;
        const columnName = columnInput.trim();
        
        // Find matching column (case-insensitive)
        const matchingColumn = headers.find(h => 
          h.toLowerCase() === columnName.toLowerCase()
        );
        
        if (matchingColumn) {
          const numValue = Number(value.trim());
          
          filteredData = filteredData.filter(row => {
            const cellValue = row[matchingColumn];
            
            // Remove currency symbols and commas for numeric comparison
            const cleanedCellValue = String(cellValue).replace(/[€$£,]/g, '').trim();
            const numCellValue = Number(cleanedCellValue);
            
            if (!isNaN(numValue) && !isNaN(numCellValue)) {
              switch (operator) {
                case '>': return numCellValue > numValue;
                case '<': return numCellValue < numValue;
                case '>=': return numCellValue >= numValue;
                case '<=': return numCellValue <= numValue;
                case '=':
                case '==': return numCellValue === numValue;
                default: return true;
              }
            } else if (operator === '=' || operator === '==') {
              return String(cellValue).toLowerCase() === value.trim().toLowerCase();
            }
            return false;
          });
        } else {
          // Column not found, show no results or all results
          filteredData = [];
        }
      } else {
        // Regular search across all columns
        filteredData = filteredData.filter(row =>
          headers.some(header =>
            String(row[header]).toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      }
    }

    // Apply multiple column sorting
    if (sortColumns.length > 0) {
      filteredData.sort((a, b) => {
        for (const { column, direction } of sortColumns) {
          const aVal = a[column];
          const bVal = b[column];
          
          // Try numeric comparison first
          const aNum = Number(aVal);
          const bNum = Number(bVal);
          
          let comparison = 0;
          
          if (!isNaN(aNum) && !isNaN(bNum)) {
            comparison = aNum - bNum;
          } else {
            // String comparison
            const aStr = String(aVal).toLowerCase();
            const bStr = String(bVal).toLowerCase();
            comparison = aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
          }
          
          if (comparison !== 0) {
            return direction === "asc" ? comparison : -comparison;
          }
        }
        return 0;
      });
    }

    const handleSort = (column: string) => {
      setSortColumns(prev => {
        const existingIndex = prev.findIndex(s => s.column === column);
        
        if (existingIndex >= 0) {
          // Column already in sort list
          const existing = prev[existingIndex];
          if (existing.direction === "asc") {
            // Change to desc
            const newSort = [...prev];
            newSort[existingIndex] = { column, direction: "desc" };
            return newSort;
          } else {
            // Remove from sort list
            return prev.filter((_, idx) => idx !== existingIndex);
          }
        } else {
          // Add new sort column
          return [...prev, { column, direction: "asc" }];
        }
      });
    };

    const getSortIndicator = (column: string) => {
      const sortIndex = sortColumns.findIndex(s => s.column === column);
      if (sortIndex === -1) return null;
      
      const sort = sortColumns[sortIndex];
      return {
        direction: sort.direction,
        order: sortColumns.length > 1 ? sortIndex + 1 : null
      };
    };

    const toggleRowSelection = (rowIndex: number) => {
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        if (newSet.has(rowIndex)) {
          newSet.delete(rowIndex);
        } else {
          newSet.add(rowIndex);
        }
        return newSet;
      });
    };

    return (
      <div className="space-y-3">
        {/* Global Search Bar */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search all columns or use: column > 100, amount < 50, status = active"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border rounded-md bg-background"
              aria-label="Search all columns"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing {filteredData.length} of {data.length} rows {selectedRows.size > 0 && `• ${selectedRows.size} selected`}</span>
            <div className="flex gap-2">
              {selectedRows.size > 0 && (
                <button
                  onClick={() => setSelectedRows(new Set())}
                  className="text-primary hover:underline"
                >
                  Clear selection
                </button>
              )}
              {globalSearch && (
                <button
                  onClick={() => setGlobalSearch("")}
                  className="text-primary hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto max-h-[600px] border rounded-lg">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-card border-b z-10">
              <tr>
                {headers.map((header, idx) => {
                  const sortInfo = getSortIndicator(header);
                  return (
                    <th key={idx} className="text-center p-3">
                      <button
                        onClick={() => handleSort(header)}
                        className="flex items-center justify-center gap-1 w-full font-medium hover:text-primary transition-colors"
                      >
                        {header}
                        {sortInfo ? (
                          <span className="flex items-center gap-0.5">
                            {sortInfo.direction === "asc" ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )}
                            {sortInfo.order && (
                              <span className="text-[10px] font-bold">{sortInfo.order}</span>
                            )}
                          </span>
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-30" />
                        )}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, idx) => {
                const isSelected = selectedRows.has(idx);
                return (
                  <tr 
                    key={idx} 
                    className={`border-b cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-primary/10 ring-2 ring-primary ring-inset' 
                        : 'hover:bg-accent/50'
                    }`}
                    onClick={() => toggleRowSelection(idx)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRowSelection(idx); } }}
                    tabIndex={0}
                    role="row"
                    aria-selected={isSelected}
                  >
                    {headers.map((header, colIdx) => (
                      <td key={colIdx} className="p-2 text-center">
                        {String(row[header])}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderLineChart = () => {
      let chartData: Array<{ label: string; value: number }>;

      if (groupData) {
        const grouped: Record<string, number> = {};
        for (const d of data) {
          const category = String(d[xAxis]).trim();
          const value = getNumericValue(d[yAxis]);
          if (!isNaN(value)) {
            grouped[category] = (grouped[category] ?? 0) + value;
          }
        }

        chartData = Object.entries(grouped).map(([label, value]) => ({ label, value }));
      } else {
        chartData = data.map(d => ({
          label: String(d[xAxis]).trim(),
          value: getNumericValue(d[yAxis])
        }));
      }

      const totalPoints = chartData.length;
      const startIdx = Math.floor((visibleRange[0] / 100) * totalPoints);
      const endIdx = Math.ceil((visibleRange[1] / 100) * totalPoints);
      const visibleData = chartData.slice(startIdx, endIdx);

      if (visibleData.length === 0) {
        return (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-sm">No data to display</p>
          </div>
        );
      }

      const renderSingleChart = (chartData: typeof visibleData) => {
        const values = chartData.map(d => d.value);
        const maxY = Math.max(...values);
        const minY = Math.min(...values);
        
        // Always include 0 in the range and center it
        const absMax = Math.max(Math.abs(maxY), Math.abs(minY), 1); // Ensure at least 1 to avoid division by zero
        const paddedMax = absMax * 1.1; // Add 10% padding
        const paddedMin = -paddedMax; // Symmetric range
        const paddedRange = paddedMax - paddedMin;

        const chartWidth = 1200; // Increased from 800
        const chartHeight = 500; // Increased from 400

        const getYPosition = (value: number): number => {
          if (!isFinite(value)) return chartHeight / 2 + 20;
          return 20 + chartHeight - ((value - paddedMin) / paddedRange) * chartHeight;
        };

        // Calculate Y position for zero line
        const zeroY = getYPosition(0);

        return (
          <div className="space-y-2">
            <div className="relative border rounded-lg p-4 bg-card overflow-x-auto">
              <svg 
                width="100%" 
                height={chartHeight + 80} 
                viewBox={`0 0 ${chartWidth + 100} ${chartHeight + 80}`} 
                preserveAspectRatio="xMidYMid meet" 
                className="min-w-full"
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <line x1="60" y1="20" x2="60" y2={chartHeight + 20} stroke="currentColor" strokeWidth="2" />
                <line x1="60" y1={chartHeight + 20} x2={chartWidth + 60} y2={chartHeight + 20} stroke="currentColor" strokeWidth="2" />

                <text x="10" y="25" fontSize="12" fill="currentColor">{paddedMax.toFixed(0)}</text>
                <text x="10" y={isFinite(zeroY) ? zeroY + 5 : chartHeight / 2 + 25} fontSize="12" fill="currentColor" fontWeight="bold">0</text>
                <text x="10" y={chartHeight + 25} fontSize="12" fill="currentColor">{paddedMin.toFixed(0)}</text>

                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
                  <line
                    key={idx}
                    x1="60"
                    y1={20 + chartHeight * ratio}
                    x2={chartWidth + 60}
                    y2={20 + chartHeight * ratio}
                    stroke="currentColor"
                    strokeWidth="1"
                    opacity="0.1"
                  />
                ))}

                {/* Zero line - highlighted */}
                {isFinite(zeroY) && (
                  <line
                    x1="60"
                    y1={zeroY}
                    x2={chartWidth + 60}
                    y2={zeroY}
                    stroke="currentColor"
                    strokeWidth="2"
                    opacity="0.3"
                    strokeDasharray="4 4"
                  />
                )}

                {/* Area fill (optional) */}
                {showAreaFill && chartData.length > 1 && isFinite(zeroY) && (
                  <polygon
                    points={`60,${zeroY} ${chartData.map((d, idx) => {
                      const x = 60 + (idx / (chartData.length - 1)) * chartWidth;
                      const y = getYPosition(d.value);
                      return `${x},${y}`;
                    }).join(' ')} ${60 + chartWidth},${zeroY}`}
                    fill="hsl(var(--primary))"
                    opacity="0.2"
                  />
                )}

                {/* Line */}
                {chartData.length > 1 && (
                  <polyline
                    points={chartData.map((d, idx) => {
                      const x = 60 + (idx / (chartData.length - 1)) * chartWidth;
                      const y = getYPosition(d.value);
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                  />
                )}

                {chartData.map((d, idx) => {
                  const x = 60 + (chartData.length > 1 ? (idx / (chartData.length - 1)) * chartWidth : chartWidth / 2);
                  const y = getYPosition(d.value);
                  const isNegative = d.value < 0;
                  const isHovered = hoveredPoint?.label === d.label && hoveredPoint?.value === d.value;

                  return (
                    <g key={idx}>
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered ? "6" : "4"}
                        fill={isNegative ? '#ef4444' : 'hsl(var(--primary))'}
                        className="cursor-pointer transition-all"
                        onMouseEnter={() => setHoveredPoint({ x, y, label: d.label, value: d.value })}
                        style={{ pointerEvents: 'all' }}
                      />
                      {(chartData.length <= 30 || idx % Math.ceil(chartData.length / 30) === 0) && (
                        <text
                          x={x}
                          y={chartHeight + 55}
                          fontSize="11"
                          fill="currentColor"
                          textAnchor="start"
                          transform={`rotate(-45, ${x}, ${chartHeight + 55})`}
                        >
                          {d.label.length > 20 ? d.label.substring(0, 17) + '...' : d.label}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Tooltip */}
                {hoveredPoint && (
                  <g>
                    <rect
                      x={hoveredPoint.x + 10}
                      y={hoveredPoint.y - 40}
                      width="140"
                      height="35"
                      fill="hsl(var(--popover))"
                      stroke="hsl(var(--border))"
                      strokeWidth="1"
                      rx="4"
                    />
                    <text
                      x={hoveredPoint.x + 15}
                      y={hoveredPoint.y - 25}
                      fontSize="11"
                      fill="currentColor"
                      fontWeight="bold"
                    >
                      {hoveredPoint.label.length > 18 ? hoveredPoint.label.substring(0, 15) + '...' : hoveredPoint.label}
                    </text>
                    <text
                      x={hoveredPoint.x + 15}
                      y={hoveredPoint.y - 12}
                      fontSize="12"
                      fill="currentColor"
                    >
                      Value: {hoveredPoint.value.toFixed(2)}
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>
        );
      };

      return (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-xs">X-Axis {groupData && "(Group By)"}</Label>
              <select
                value={xAxis}
                onChange={(e) => setXAxis(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md bg-background text-sm"
              >
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <Label className="text-xs">Y-Axis {groupData && "(Sum)"}</Label>
              <select
                value={yAxis}
                onChange={(e) => setYAxis(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md bg-background text-sm"
              >
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          {totalPoints > 50 && (
            <div className="space-y-2 p-3 bg-accent/50 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <span>Timeline Range</span>
                <span className="text-muted-foreground">
                  Showing {startIdx + 1} - {endIdx} of {totalPoints} points
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, 100 - ((visibleRange[1] - visibleRange[0])))}
                  value={visibleRange[0]}
                  onChange={(e) => {
                    const start = Number(e.target.value);
                    const width = visibleRange[1] - visibleRange[0];
                    setVisibleRange([start, start + width]);
                  }}
                  className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                  aria-label="Chart visible range"
                />
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setVisibleRange([0, 10])}
                  >
                    10%
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setVisibleRange([0, 25])}
                  >
                    25%
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setVisibleRange([0, 50])}
                  >
                    50%
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setVisibleRange([0, 100])}
                  >
                    All
                  </Button>
                </div>
              </div>
            </div>
          )}

          {renderSingleChart(visibleData)}
        </div>
      );
    }

  const renderBarChart = () => {
    let entries: [string, number][];
    let maxValue: number;

    if (groupData) {
      // Group by category and sum values
      const grouped: Record<string, number> = {};
      for (const d of data) {
        const category = String(d[xAxis]).trim();
        const value = getNumericValue(d[yAxis]);
        if (!isNaN(value)) {
          grouped[category] = (grouped[category] ?? 0) + value;
        }
      }

      // Convert to array and sort by absolute value descending
      entries = Object.entries(grouped)
        .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a));
      
      maxValue = Math.max(...entries.map(([, val]) => Math.abs(val)));
    } else {
      // Show all individual rows
      entries = data.map(d => [
        String(d[xAxis]).trim(),
        getNumericValue(d[yAxis])
      ]);
      maxValue = Math.max(...entries.map(([, val]) => Math.abs(val)));
    }

    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Label className="text-xs">Category {groupData && "(Group By)"}</Label>
            <select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md bg-background text-sm"
            >
              {headers.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <Label className="text-xs">Value {groupData && "(Sum)"}</Label>
            <select
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md bg-background text-sm"
            >
              {headers.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2 max-h-[600px] overflow-auto">
          {entries.map(([category, value], idx) => {
            const absValue = Math.abs(value);
            const percentage = (absValue / maxValue) * 100;
            const isNegative = value < 0;
            
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="truncate max-w-[200px]">{category}</span>
                  <span className={`font-medium ${isNegative ? 'text-red-600 dark:text-red-500' : ''}`}>
                    {isNegative && '-'}{absValue.toFixed(2)}
                  </span>
                </div>
                <div className="h-6 bg-accent rounded-md overflow-hidden">
                  <div
                    className={`h-full transition-all ${isNegative ? 'bg-red-600 dark:bg-red-500' : 'bg-primary'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Showing all {entries.length} {groupData ? 'categories' : 'rows'}
        </p>
      </div>
    );
  };

  const renderPieChart = () => {
    if (!groupData) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          <p className="text-sm">Pie charts require grouped data.</p>
          <p className="text-xs mt-1">Please enable "Group & Sum Data" toggle above.</p>
        </div>
      );
    }

    // Group by category and sum absolute values (treat negatives as positive)
    const grouped: Record<string, { value: number; isNegative: boolean }> = {};
    for (const d of data) {
      const category = String(d[xAxis]).trim();
      const value = getNumericValue(d[yAxis]);
      if (!isNaN(value) && value !== 0) {
        const absValue = Math.abs(value);
        const existing = grouped[category];
        if (!existing) {
          grouped[category] = { value: absValue, isNegative: value < 0 };
        } else {
          existing.value += absValue;
        }
      }
    }

    // Sort by value descending - show all categories
    const entries = Object.entries(grouped)
      .sort(([, a], [, b]) => b.value - a.value);
    const total = entries.reduce((sum, [, { value }]) => sum + value, 0);

    if (total === 0 || entries.length === 0) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          <p className="text-sm">No data to display</p>
        </div>
      );
    }

    let currentAngle = -90;
    const colors = [
      'hsl(var(--primary))',
      '#3b82f6',
      '#10b981',
      '#f59e0b',
      '#ef4444',
      '#8b5cf6',
      '#ec4899',
      '#06b6d4',
      '#84cc16',
      '#f97316'
    ];

    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Label className="text-xs">Category (Group By)</Label>
            <select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md bg-background text-sm"
            >
              {headers.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <Label className="text-xs">Value (Sum)</Label>
            <select
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md bg-background text-sm"
            >
              {headers.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          {/* Pie Chart */}
          <svg width="400" height="400" viewBox="0 0 400 400">
            {entries.map(([category, { value, isNegative }], idx) => {
              const percentage = (value / total) * 100;
              const angle = (percentage / 100) * 360;
              
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              currentAngle = endAngle;

              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;

              const x1 = 200 + 160 * Math.cos(startRad);
              const y1 = 200 + 160 * Math.sin(startRad);
              const x2 = 200 + 160 * Math.cos(endRad);
              const y2 = 200 + 160 * Math.sin(endRad);

              const largeArc = angle > 180 ? 1 : 0;

              return (
                <path
                  key={idx}
                  d={`M 200 200 L ${x1} ${y1} A 160 160 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={isNegative ? '#ef4444' : colors[idx % colors.length]}
                  stroke="white"
                  strokeWidth="2"
                />
              );
            })}
          </svg>

          {/* Legend as Table */}
          <div className="w-full max-w-2xl overflow-auto max-h-[400px] border rounded-lg">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card border-b">
                <tr>
                  <th className="text-left p-2 font-medium">Color</th>
                  <th className="text-left p-2 font-medium">Category</th>
                  <th className="text-right p-2 font-medium">Value</th>
                  <th className="text-right p-2 font-medium">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(([category, { value, isNegative }], idx) => {
                  const percentage = ((value / total) * 100).toFixed(1);
                  return (
                    <tr key={idx} className="border-b hover:bg-accent/50">
                      <td className="p-2">
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: isNegative ? '#ef4444' : colors[idx % colors.length] }}
                        />
                      </td>
                      <td className="p-2">{category}</td>
                      <td className={`p-2 text-right font-medium ${isNegative ? 'text-red-600 dark:text-red-500' : ''}`}>
                        {isNegative && '-'}{value.toFixed(2)}
                      </td>
                      <td className="p-2 text-right">
                        {percentage}%
                      </td>
                    </tr>
                  );
                })}
                <tr className="font-semibold bg-accent/30">
                  <td className="p-2"></td>
                  <td className="p-2">Total</td>
                  <td className="p-2 text-right">{total.toFixed(2)}</td>
                  <td className="p-2 text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Showing all {entries.length} categories
          </p>
        </div>
      </div>
    );
  };

  const renderScatterChart = () => {
    const chartWidth = 1200; // Increased from 800
    const chartHeight = 500; // Increased from 400

    const xValues = data.map(d => getNumericValue(d[xAxis]));
    const yValues = data.map(d => getNumericValue(d[yAxis]));

    const maxX = Math.max(...xValues);
    const minX = Math.min(...xValues);
    const maxY = Math.max(...yValues);
    const minY = Math.min(...yValues);

    // Always start from 0 for better visibility
    const actualMinX = Math.min(0, minX);
    const actualMaxX = Math.max(0, maxX);
    const actualMinY = Math.min(0, minY);
    const actualMaxY = Math.max(0, maxY);
    
    const rangeX = actualMaxX - actualMinX || 1;
    const rangeY = actualMaxY - actualMinY || 1;
    const paddedMaxX = actualMaxX + rangeX * 0.1;
    const paddedMinX = actualMinX - rangeX * 0.1;
    const paddedMaxY = actualMaxY + rangeY * 0.1;
    const paddedMinY = actualMinY - rangeY * 0.1;
    const paddedRangeX = paddedMaxX - paddedMinX;
    const paddedRangeY = paddedMaxY - paddedMinY;

    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Label className="text-xs">X-Axis (Numeric)</Label>
            <select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md bg-background text-sm"
            >
              {headers.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <Label className="text-xs">Y-Axis (Numeric)</Label>
            <select
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md bg-background text-sm"
            >
              {headers.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative border rounded-lg p-4 bg-card overflow-x-auto">
          <svg 
            width="100%" 
            height={chartHeight + 60} 
            viewBox={`0 0 ${chartWidth + 100} ${chartHeight + 60}`} 
            preserveAspectRatio="xMidYMid meet" 
            className="min-w-full"
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <line x1="60" y1="20" x2="60" y2={chartHeight + 20} stroke="currentColor" strokeWidth="2" />
            <line x1="60" y1={chartHeight + 20} x2={chartWidth + 60} y2={chartHeight + 20} stroke="currentColor" strokeWidth="2" />
            
            <text x="10" y="25" fontSize="12" fill="currentColor">{paddedMaxY.toFixed(0)}</text>
            <text x="10" y={chartHeight / 2 + 25} fontSize="12" fill="currentColor">{((paddedMaxY + paddedMinY) / 2).toFixed(0)}</text>
            <text x="10" y={chartHeight + 25} fontSize="12" fill="currentColor">{paddedMinY.toFixed(0)}</text>

            <text x="60" y={chartHeight + 55} fontSize="12" fill="currentColor">{paddedMinX.toFixed(0)}</text>
            <text x={chartWidth / 2 + 60} y={chartHeight + 55} fontSize="12" fill="currentColor" textAnchor="middle">{((paddedMaxX + paddedMinX) / 2).toFixed(0)}</text>
            <text x={chartWidth + 60} y={chartHeight + 55} fontSize="12" fill="currentColor" textAnchor="end">{paddedMaxX.toFixed(0)}</text>

            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
              <g key={idx}>
                <line
                  x1="60"
                  y1={20 + chartHeight * ratio}
                  x2={chartWidth + 60}
                  y2={20 + chartHeight * ratio}
                  stroke="currentColor"
                  strokeWidth="1"
                  opacity="0.1"
                />
                <line
                  x1={60 + chartWidth * ratio}
                  y1="20"
                  x2={60 + chartWidth * ratio}
                  y2={chartHeight + 20}
                  stroke="currentColor"
                  strokeWidth="1"
                  opacity="0.1"
                />
              </g>
            ))}

            {data.map((d, idx) => {
              const xVal = getNumericValue(d[xAxis]);
              const yVal = getNumericValue(d[yAxis]);
              const x = 60 + ((xVal - paddedMinX) / paddedRangeX) * chartWidth;
              const y = 20 + chartHeight - ((yVal - paddedMinY) / paddedRangeY) * chartHeight;
              const isNegative = yVal < 0;
              const isHovered = hoveredPoint?.x === x && hoveredPoint?.y === y;
              
              return (
                <circle
                  key={idx}
                  cx={x}
                  cy={y}
                  r={isHovered ? "6" : "4"}
                  fill={isNegative ? '#ef4444' : 'hsl(var(--primary))'}
                  opacity={isHovered ? "1" : "0.6"}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredPoint({ x, y, label: `${xAxis}: ${xVal.toFixed(2)}`, value: yVal })}
                  style={{ pointerEvents: 'all' }}
                />
              );
            })}

            {/* Tooltip */}
            {hoveredPoint && (
              <g>
                <rect
                  x={hoveredPoint.x + 10}
                  y={hoveredPoint.y - 45}
                  width="150"
                  height="40"
                  fill="hsl(var(--popover))"
                  stroke="hsl(var(--border))"
                  strokeWidth="1"
                  rx="4"
                />
                <text
                  x={hoveredPoint.x + 15}
                  y={hoveredPoint.y - 28}
                  fontSize="11"
                  fill="currentColor"
                >
                  {hoveredPoint.label}
                </text>
                <text
                  x={hoveredPoint.x + 15}
                  y={hoveredPoint.y - 15}
                  fontSize="11"
                  fill="currentColor"
                >
                  {yAxis}: {hoveredPoint.value.toFixed(2)}
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>
    );
  };

  const renderStats = () => {
    if (data.length === 0) return null;

    return null; // Stats now shown inline with upload section
  };

  return (
    <ToolLayout
      title="Data Visualizer"
      description="Upload CSV or JSON files and visualize your data with charts"
    >
      <div className="space-y-4">
        {/* Action Toolbar */}
        <ActionToolbar
          right={
            <Button
              onClick={handleClear}
              variant="outline"
              size="sm"
              disabled={isEmpty}
              aria-label="Clear all"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          }
        />

        {/* Upload Section with Stats */}
        <div className="flex flex-col lg:flex-row gap-4">
          <Card className="p-4 flex-1">
            <div className="flex flex-col items-center justify-center gap-3">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <Label htmlFor="file-upload" className="text-sm font-medium cursor-pointer">
                  Upload CSV or JSON file
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum file size: 50MB
                </p>
              </div>
              <input
                id="file-upload"
                type="file"
                accept=".csv,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex gap-2">
                <Button asChild size="sm">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Choose File
                  </label>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadSampleData}
                >
                  Load Sample Data
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {data.length > 0 && (
          <>
            {/* Chart Type Selector */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Label className="text-sm">Visualization:</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={chartType === "table" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartType("table")}
                  >
                    Table
                  </Button>
                  <Button
                    variant={chartType === "line" || chartType === "area" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartType("line")}
                  >
                    <LineChart className="h-4 w-4 mr-1" />
                    Line
                  </Button>
                  <Button
                    variant={chartType === "bar" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartType("bar")}
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Bar
                  </Button>
                  <Button
                    variant={chartType === "scatter" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartType("scatter")}
                  >
                    <ScatterChart className="h-4 w-4 mr-1" />
                    Scatter
                  </Button>
                  <Button
                    variant={chartType === "pie" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartType("pie")}
                  >
                    <PieChart className="h-4 w-4 mr-1" />
                    Pie
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-4 flex-wrap">
                {(chartType === "bar" || chartType === "pie" || chartType === "line" || chartType === "area") && (
                  <div className="flex items-center gap-2">
                    <Switch
                      id="group-data"
                      checked={groupData}
                      onCheckedChange={setGroupData}
                    />
                    <Label htmlFor="group-data" className="text-sm cursor-pointer">
                      Group & Sum Data
                    </Label>
                  </div>
                )}
                {(chartType === "line" || chartType === "area") && (
                  <div className="flex items-center gap-2">
                    <Switch
                      id="show-area-fill"
                      checked={showAreaFill}
                      onCheckedChange={setShowAreaFill}
                    />
                    <Label htmlFor="show-area-fill" className="text-sm cursor-pointer">
                      Fill Area
                    </Label>
                  </div>
                )}
              </div>
            </div>

            {/* Chart Display */}
            <Card className="p-4">
              {renderChart()}
            </Card>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
