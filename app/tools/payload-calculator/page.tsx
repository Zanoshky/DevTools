
import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout";
import { CodeEditor } from "@/components/code-editor";
import { Badge } from "@/components/ui/badge";
import { ActionToolbar } from "@/components/action-toolbar";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { FileText, Trash2, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function PayloadCalculatorPage() {
  const [input, setInput] = useState("");
  
  // Size metrics
  const [bytes, setBytes] = useState(0);
  const [kb, setKb] = useState(0);
  const [mb, setMb] = useState(0);
  
  // Text metrics
  const [chars, setChars] = useState(0);
  const [charsNoSpaces, setCharsNoSpaces] = useState(0);
  const [words, setWords] = useState(0);
  const [lines, setLines] = useState(0);
  const [sentences, setSentences] = useState(0);
  const [paragraphs, setParagraphs] = useState(0);
  
  // Compression estimate
  const [estimatedCompressed, setEstimatedCompressed] = useState(0);
  const [compressionRatio, setCompressionRatio] = useState(0);

  const isEmpty = input.length === 0;

  const handleClear = useCallback(() => {
    setInput("");
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

  const calculateSize = (text: string) => {
    if (!text) {
      setBytes(0);
      setKb(0);
      setMb(0);
      setChars(0);
      setCharsNoSpaces(0);
      setWords(0);
      setLines(0);
      setSentences(0);
      setParagraphs(0);
      setEstimatedCompressed(0);
      setCompressionRatio(0);
      return;
    }

    // Calculate size in UTF-8
    const encoder = new TextEncoder();
    const byteCount = encoder.encode(text).length;
    
    setBytes(byteCount);
    setKb(byteCount / 1024);
    setMb(byteCount / (1024 * 1024));
    
    // Text metrics
    setChars(text.length);
    setCharsNoSpaces(text.replace(/\s/g, "").length);
    setWords(text.trim().split(/\s+/).filter(w => w.length > 0).length);
    setLines(text.split("\n").length);
    setSentences(text.split(/[.!?]+/).filter(s => s.trim().length > 0).length);
    setParagraphs(text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length);
    
    // Estimate compression (rough estimate based on repetition)
    const uniqueChars = new Set(text).size;
    const compressionEstimate = Math.max(0.3, uniqueChars / text.length);
    const compressedSize = Math.floor(byteCount * compressionEstimate);
    setEstimatedCompressed(compressedSize);
    setCompressionRatio(((1 - compressionEstimate) * 100));
  };

  useEffect(() => {
    calculateSize(input);
  }, [input]);

  const getSizeCategory = () => {
    if (kb < 1) return { label: "Tiny", color: "text-green-600 dark:text-green-400" };
    if (kb < 10) return { label: "Small", color: "text-blue-600 dark:text-blue-400" };
    if (kb < 100) return { label: "Medium", color: "text-yellow-600 dark:text-yellow-400" };
    if (kb < 1000) return { label: "Large", color: "text-orange-600 dark:text-orange-400" };
    return { label: "Very Large", color: "text-red-600 dark:text-red-400" };
  };

  const getReadingTime = () => {
    const wordsPerMinute = 200;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
  };

  const category = getSizeCategory();

  return (
    <ToolLayout
      title="Payload Size Calculator"
      description="Calculate payload size with detailed metrics and text analysis"
    >
      <div className="space-y-3">
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

        {/* Side-by-side layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Left: Input */}
          <div className="space-y-3">
            <div className="p-3 bg-card border rounded-lg space-y-2">
              <Label className="text-sm font-medium">Payload Input</Label>
              <CodeEditor language="json"
                value={input}
                onChange={setInput}
                placeholder="Enter or paste your payload here..."
  
              />
            </div>

            {/* Quick Stats */}
            {input && (
              <div className="p-3 bg-card border rounded-lg space-y-2">
                <Label className="text-sm font-medium">Quick Stats</Label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 bg-gradient-to-r from-primary/5 to-transparent rounded">
                    <span className="text-muted-foreground">Characters:</span>
                    <span className="font-mono font-semibold">{chars.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gradient-to-r from-primary/5 to-transparent rounded">
                    <span className="text-muted-foreground">Words:</span>
                    <span className="font-mono font-semibold">{words.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gradient-to-r from-primary/5 to-transparent rounded">
                    <span className="text-muted-foreground">Lines:</span>
                    <span className="font-mono font-semibold">{lines.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gradient-to-r from-primary/5 to-transparent rounded">
                    <span className="text-muted-foreground">Reading:</span>
                    <span className="font-mono font-semibold">{getReadingTime()} min</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Results */}
          <div className="space-y-3">
            {bytes > 0 ? (
              <>
                {/* Size Metrics */}
                <div className="p-3 bg-card border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Size Metrics</Label>
                    <Badge variant="secondary" className={`text-xs ${category.color}`}>
                      {category.label}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded bg-blue-50 dark:bg-blue-950/20 p-3 text-center">
                      <div className="text-[10px] text-muted-foreground mb-1">Bytes</div>
                      <div className="text-lg font-bold font-mono">{bytes.toLocaleString()}</div>
                    </div>
                    <div className="rounded bg-purple-50 dark:bg-purple-950/20 p-3 text-center">
                      <div className="text-[10px] text-muted-foreground mb-1">KB</div>
                      <div className="text-lg font-bold font-mono">{kb.toFixed(2)}</div>
                    </div>
                    <div className="rounded bg-green-50 dark:bg-green-950/20 p-3 text-center">
                      <div className="text-[10px] text-muted-foreground mb-1">MB</div>
                      <div className="text-lg font-bold font-mono">{mb.toFixed(4)}</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Encoding:</span>
                      <Badge variant="outline" className="text-xs">UTF-8</Badge>
                    </div>
                  </div>
                </div>

                {/* Text Analysis */}
                <div className="p-3 bg-card border rounded-lg space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-3 w-3" />
                    Text Analysis
                  </Label>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-2 bg-gradient-to-r from-primary/5 to-transparent rounded">
                      <span className="text-muted-foreground">Total Characters:</span>
                      <span className="font-mono font-semibold">{chars.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gradient-to-r from-primary/5 to-transparent rounded">
                      <span className="text-muted-foreground">Without Spaces:</span>
                      <span className="font-mono font-semibold">{charsNoSpaces.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gradient-to-r from-primary/5 to-transparent rounded">
                      <span className="text-muted-foreground">Words:</span>
                      <span className="font-mono font-semibold">{words.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gradient-to-r from-primary/5 to-transparent rounded">
                      <span className="text-muted-foreground">Lines:</span>
                      <span className="font-mono font-semibold">{lines.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gradient-to-r from-primary/5 to-transparent rounded">
                      <span className="text-muted-foreground">Sentences:</span>
                      <span className="font-mono font-semibold">{sentences.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gradient-to-r from-primary/5 to-transparent rounded">
                      <span className="text-muted-foreground">Paragraphs:</span>
                      <span className="font-mono font-semibold">{paragraphs.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Compression Estimate */}
                <div className="p-3 bg-card border rounded-lg space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-3 w-3" />
                    Compression Estimate
                  </Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Original Size:</span>
                      <span className="font-mono font-semibold">{bytes.toLocaleString()} bytes</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Estimated Compressed:</span>
                      <span className="font-mono font-semibold">{estimatedCompressed.toLocaleString()} bytes</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Compression Ratio:</span>
                        <Badge variant="secondary" className="text-xs">
                          ~{compressionRatio.toFixed(1)}%
                        </Badge>
                      </div>
                      <Progress value={compressionRatio} className="h-2" />
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      * Estimate based on character diversity. Actual compression may vary.
                    </div>
                  </div>
                </div>

                {/* Size Comparisons */}
                <div className="p-3 bg-card border rounded-lg space-y-2">
                  <Label className="text-sm font-medium">Size Comparisons</Label>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-2 bg-gradient-to-r from-primary/5 to-transparent rounded">
                      <span className="text-muted-foreground">HTTP GET limit (8KB):</span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs font-mono ${
                          ((bytes / 8192) * 100) >= 100 
                            ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300' 
                            : ((bytes / 8192) * 100) >= 80 
                            ? 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300'
                            : ''
                        }`}
                      >
                        {((bytes / 8192) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gradient-to-r from-primary/5 to-transparent rounded">
                      <span className="text-muted-foreground">Email attachment (25MB):</span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs font-mono ${
                          ((mb / 25) * 100) >= 100 
                            ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300' 
                            : ((mb / 25) * 100) >= 80 
                            ? 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300'
                            : ''
                        }`}
                      >
                        {((mb / 25) * 100).toFixed(2)}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gradient-to-r from-primary/5 to-transparent rounded">
                      <span className="text-muted-foreground">Tweet limit (280 chars):</span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs font-mono ${
                          ((chars / 280) * 100) >= 100 
                            ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300' 
                            : ((chars / 280) * 100) >= 80 
                            ? 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300'
                            : ''
                        }`}
                      >
                        {((chars / 280) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-3 bg-card border rounded-lg min-h-[520px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Enter text to calculate payload size</p>
                  <p className="text-xs mt-2">Real-time analysis with detailed metrics</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
