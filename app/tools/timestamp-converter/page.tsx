"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ToolLayout } from "@/components/tool-layout";
import { ToolCard } from "@/components/tool-card";
import { CopyInput } from "@/components/copy-input";
import { HistorySidebar } from "@/components/history-sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  Calendar,
  ArrowRightLeft,
  Copy,
  RefreshCw,
} from "lucide-react";

export default function TimestampConverterPage() {
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  
  // Timestamp to Date
  const [timestamp, setTimestamp] = useState("");
  const [timestampFormat, setTimestampFormat] = useState<"seconds" | "milliseconds">("seconds");
  
  // Date to Timestamp
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const [timezoneOffset, setTimezoneOffset] = useState("local");
  
  // History
  const [history, setHistory] = useState<Array<{ timestamp: string; format: "seconds" | "milliseconds"; date: string }>>([]);

  useEffect(() => {
    // Initialize current time on client only
    setCurrentTime(Date.now());
    
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load history
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("timestamp-converter-history");
      if (stored) setHistory(JSON.parse(stored));
    }
  }, []);

  // Save history
  useEffect(() => {
    if (typeof window !== "undefined" && history.length > 0) {
      localStorage.setItem("timestamp-converter-history", JSON.stringify(history));
    }
  }, [history]);

  useEffect(() => {
    // Initialize with current date/time on client only
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    setDateInput(`${year}-${month}-${day}`);
    setTimeInput(`${hours}:${minutes}:${seconds}`);
    setTimestamp(Math.floor(Date.now() / 1000).toString());
  }, []);

  const addToHistory = (ts: string, format: "seconds" | "milliseconds") => {
    const numTs = parseInt(ts);
    if (isNaN(numTs)) return;
    
    const date = new Date(format === "seconds" ? numTs * 1000 : numTs);
    if (isNaN(date.getTime())) return;
    
    const historyItem = {
      timestamp: ts,
      format,
      date: date.toISOString(),
    };
    
    setHistory((prev) => [
      historyItem,
      ...prev.filter(item => item.timestamp !== ts || item.format !== format).slice(0, 9)
    ]);
  };

  const clearHistory = () => {
    setHistory([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("timestamp-converter-history");
    }
  };

  const getCurrentTimestamp = () => {
    const now = Date.now();
    const ts = timestampFormat === "seconds" ? Math.floor(now / 1000).toString() : now.toString();
    setTimestamp(ts);
    addToHistory(ts, timestampFormat);
  };

  // Add to history only after user stops typing (debounced)
  useEffect(() => {
    if (!timestamp || isNaN(parseInt(timestamp))) return;
    
    const timer = setTimeout(() => {
      addToHistory(timestamp, timestampFormat);
    }, 1000); // 1 second debounce
    
    return () => clearTimeout(timer);
  }, [timestamp, timestampFormat]);

  const formatTimestamp = (ts: string) => {
    try {
      const numTs = parseInt(ts);
      if (isNaN(numTs)) return null;
      
      const date = new Date(timestampFormat === "seconds" ? numTs * 1000 : numTs);
      
      if (isNaN(date.getTime())) return null;

      return {
        iso: date.toISOString(),
        local: date.toLocaleString(),
        utc: date.toUTCString(),
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString(),
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: date.getSeconds(),
        milliseconds: date.getMilliseconds(),
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        unixSeconds: Math.floor(date.getTime() / 1000),
        unixMilliseconds: date.getTime(),
      };
    } catch {
      return null;
    }
  };

  const dateToTimestamp = () => {
    try {
      if (!dateInput) return null;
      
      const dateTimeString = timeInput 
        ? `${dateInput}T${timeInput}`
        : `${dateInput}T00:00:00`;
      
      let date: Date;
      
      if (timezoneOffset === "utc") {
        date = new Date(dateTimeString + "Z");
      } else {
        date = new Date(dateTimeString);
      }
      
      if (isNaN(date.getTime())) return null;

      return {
        seconds: Math.floor(date.getTime() / 1000),
        milliseconds: date.getTime(),
        iso: date.toISOString(),
        local: date.toLocaleString(),
        utc: date.toUTCString(),
      };
    } catch {
      return null;
    }
  };

  const timestampFormats = formatTimestamp(timestamp);
  const dateTimestamp = dateToTimestamp();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const swapToTimestamp = () => {
    if (dateTimestamp) {
      setTimestamp(dateTimestamp.seconds.toString());
      setTimestampFormat("seconds");
    }
  };

  const swapToDate = () => {
    if (timestampFormats) {
      const date = new Date(timestampFormat === "seconds" ? parseInt(timestamp) * 1000 : parseInt(timestamp));
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      setDateInput(`${year}-${month}-${day}`);
      setTimeInput(`${hours}:${minutes}:${seconds}`);
    }
  };

  return (
    <ToolLayout
      title="Epoch Converter"
      description="Bidirectional conversion between UNIX epoch timestamps and human-readable dates"
      sidebar={
        <HistorySidebar
          items={history}
          onSelect={(item) => {
            setTimestamp(item.timestamp);
            setTimestampFormat(item.format);
          }}
          onClear={clearHistory}
          renderItem={(item) => (
            <>
              <div className="font-mono text-xs truncate">{item.timestamp}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {new Date(item.date).toLocaleString()}
              </div>
              <Badge variant="outline" className="text-[9px] mt-1">
                {item.format}
              </Badge>
            </>
          )}
        />
      }
    >
      <ToolCard>
        <div className="space-y-6">
          {/* Current Time Display */}
          <div className="rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 p-4 border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold">Current Time</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentTime(Date.now())}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background/50 rounded p-2">
                <div className="text-xs text-muted-foreground mb-1">Seconds</div>
                <div className="text-lg font-bold font-mono">
                  {currentTime ? Math.floor(currentTime / 1000) : "---"}
                </div>
              </div>
              <div className="bg-background/50 rounded p-2">
                <div className="text-xs text-muted-foreground mb-1">Milliseconds</div>
                <div className="text-lg font-bold font-mono">
                  {currentTime || "---"}
                </div>
              </div>
            </div>
            <div className="text-sm text-center mt-2 text-muted-foreground">
              {currentTime ? new Date(currentTime).toLocaleString() : "Loading..."}
            </div>
          </div>

          <Tabs defaultValue="timestamp-to-date" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="timestamp-to-date">
                <Clock className="h-4 w-4 mr-2" />
                Epoch → Date
              </TabsTrigger>
              <TabsTrigger value="date-to-timestamp">
                <Calendar className="h-4 w-4 mr-2" />
                Date → Epoch
              </TabsTrigger>
            </TabsList>

            {/* Timestamp to Date */}
            <TabsContent value="timestamp-to-date" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={timestampFormat} onValueChange={(v) => setTimestampFormat(v as "seconds" | "milliseconds")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">Seconds (Unix Epoch)</SelectItem>
                    <SelectItem value="milliseconds">Milliseconds (Unix Epoch)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <CopyInput
                label="Epoch Timestamp"
                value={timestamp}
                onChange={setTimestamp}
                placeholder="Enter epoch timestamp..."
                className="font-mono"
                id="timestamp-input"
              />

              <div className="flex gap-2">
                <Button onClick={getCurrentTimestamp} className="flex-1" size="lg">
                  Use Current Time
                </Button>
                <Button onClick={swapToDate} variant="outline" size="lg">
                  <ArrowRightLeft className="h-4 w-4" />
                </Button>
              </div>

              {timestampFormats && (
                <div className="pt-4 border-t space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{timestampFormats.dayOfWeek}</Badge>
                    <Badge variant="outline">{timestampFormats.timezone}</Badge>
                  </div>

                  <CopyInput label="ISO 8601" value={timestampFormats.iso} readOnly />
                  <CopyInput label="Local" value={timestampFormats.local} readOnly />
                  <CopyInput label="UTC" value={timestampFormats.utc} readOnly />

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <StatBox label="Year" value={timestampFormats.year} />
                    <StatBox label="Month" value={timestampFormats.month} />
                    <StatBox label="Day" value={timestampFormats.day} />
                    <StatBox label="Hours" value={timestampFormats.hours} />
                    <StatBox label="Minutes" value={timestampFormats.minutes} />
                    <StatBox label="Seconds" value={timestampFormats.seconds} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-lg p-3 border">
                      <div className="text-xs text-muted-foreground mb-1">Unix (seconds)</div>
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-sm">{timestampFormats.unixSeconds}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(timestampFormats.unixSeconds.toString())}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 border">
                      <div className="text-xs text-muted-foreground mb-1">Unix (milliseconds)</div>
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-sm">{timestampFormats.unixMilliseconds}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(timestampFormats.unixMilliseconds.toString())}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Date to Timestamp */}
            <TabsContent value="date-to-timestamp" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Time (Optional)</Label>
                <Input
                  type="time"
                  step="1"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={timezoneOffset} onValueChange={setTimezoneOffset}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local Time</SelectItem>
                    <SelectItem value="utc">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={swapToTimestamp} variant="outline" size="lg" className="w-full">
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Convert to Epoch
              </Button>

              {dateTimestamp && (
                <div className="pt-4 border-t space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <div className="text-xs text-muted-foreground mb-1">Seconds</div>
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-lg font-bold">{dateTimestamp.seconds}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(dateTimestamp.seconds.toString())}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                      <div className="text-xs text-muted-foreground mb-1">Milliseconds</div>
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-lg font-bold">{dateTimestamp.milliseconds}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(dateTimestamp.milliseconds.toString())}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <CopyInput label="ISO 8601" value={dateTimestamp.iso} readOnly />
                  <CopyInput label="Local" value={dateTimestamp.local} readOnly />
                  <CopyInput label="UTC" value={dateTimestamp.utc} readOnly />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </ToolCard>
    </ToolLayout>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 border">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
