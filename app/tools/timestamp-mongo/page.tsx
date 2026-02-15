"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout";
import { CopyInput } from "@/components/copy-input";
import { HistorySidebar } from "@/components/history-sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowRight, 
  Clock, 
  Database,
  Info,
  RefreshCw
} from "lucide-react";

type ConversionMode = "objectid-to-time" | "time-to-objectid";

export default function MongoTimestampPage() {
  const [mode, setMode] = useState<ConversionMode>("objectid-to-time");
  const [objectId, setObjectId] = useState("507f1f77bcf86cd799439011");
  const [timestamp, setTimestamp] = useState("");
  const [isoDate, setIsoDate] = useState("");
  const [generatedObjectId, setGeneratedObjectId] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState("");

  // Load history
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mongo-objectid-history");
      if (stored) setHistory(JSON.parse(stored));
    }
  }, []);

  // Save history
  useEffect(() => {
    if (typeof window !== "undefined" && history.length > 0) {
      localStorage.setItem("mongo-objectid-history", JSON.stringify(history));
    }
  }, [history]);

  // Convert ObjectId to Timestamp
  const objectIdToTimestamp = (id: string) => {
    if (!/^[a-f\d]{24}$/i.test(id)) {
      setError("Invalid MongoDB ObjectId format (must be 24 hex characters)");
      setTimestamp("");
      setIsoDate("");
      return;
    }

    try {
      const timestampSeconds = parseInt(id.substring(0, 8), 16);
      const timestampMs = timestampSeconds * 1000;
      const date = new Date(timestampMs);
      
      setError("");
      setTimestamp(timestampMs.toString());
      setIsoDate(date.toISOString());
    } catch {
      setError("Error parsing ObjectId");
      setTimestamp("");
      setIsoDate("");
    }
  };

  // Convert Timestamp to ObjectId
  const timestampToObjectId = (ts: string) => {
    try {
      let date: Date;
      
      // Try parsing as ISO date first, then as timestamp
      if (isNaN(Number(ts))) {
        date = new Date(ts);
      } else {
        date = new Date(Number(ts));
      }

      if (isNaN(date.getTime())) {
        setError("Invalid timestamp or date format");
        setGeneratedObjectId("");
        return;
      }

      const timestampSeconds = Math.floor(date.getTime() / 1000);
      const hexTimestamp = timestampSeconds.toString(16).padStart(8, "0");
      
      // Generate random 5 bytes (10 hex chars)
      const randomHex = Array.from({ length: 10 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");
      
      // Generate counter 3 bytes (6 hex chars)
      const counterHex = Array.from({ length: 6 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");

      const newObjectId = hexTimestamp + randomHex + counterHex;
      setGeneratedObjectId(newObjectId);
      setError("");
      
      // Add to history
      setHistory((prev) => [newObjectId, ...prev.filter(id => id !== newObjectId).slice(0, 9)]);
    } catch {
      setError("Error generating ObjectId");
      setGeneratedObjectId("");
    }
  };

  // Handle ObjectId input change
  useEffect(() => {
    if (mode === "objectid-to-time" && objectId) {
      objectIdToTimestamp(objectId);
    }
  }, [objectId, mode]);

  const handleGenerateNow = () => {
    const now = Date.now().toString();
    if (mode === "time-to-objectid") {
      setTimestamp(now);
      timestampToObjectId(now);
    } else {
      timestampToObjectId(now);
      if (generatedObjectId) {
        setObjectId(generatedObjectId);
      }
    }
  };

  const handleConvert = () => {
    if (mode === "time-to-objectid") {
      timestampToObjectId(timestamp || isoDate);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("mongo-objectid-history");
    }
  };

  const getObjectIdParts = (oid: string) => {
    if (oid.length !== 24) return null;
    return {
      timestamp: oid.slice(0, 8),
      random: oid.slice(8, 18),
      counter: oid.slice(18, 24),
    };
  };

  const parts = mode === "objectid-to-time" && objectId.length === 24 
    ? getObjectIdParts(objectId) 
    : generatedObjectId.length === 24 
    ? getObjectIdParts(generatedObjectId) 
    : null;

  return (
    <ToolLayout
      title="MongoDB ObjectId ↔ Timestamp"
      description="Extract timestamps from MongoDB ObjectIds or generate ObjectIds from timestamps"
      sidebar={
        <HistorySidebar
          items={history}
          onSelect={(oid) => {
            setObjectId(oid);
            setMode("objectid-to-time");
          }}
          onClear={clearHistory}
          renderItem={(oid) => (
            <>
              <div className="font-mono text-xs truncate">{oid}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {new Date(parseInt(oid.substring(0, 8), 16) * 1000).toLocaleString()}
              </div>
            </>
          )}
        />
      }
    >
      <div className="space-y-3">
        {/* Mode Tabs */}
        <div className="p-3 bg-card border rounded-lg">
          <Tabs value={mode} onValueChange={(v) => setMode(v as ConversionMode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="objectid-to-time">
                <Database className="h-4 w-4 mr-2" />
                ObjectId → Time
              </TabsTrigger>
              <TabsTrigger value="time-to-objectid">
                <Clock className="h-4 w-4 mr-2" />
                Time → ObjectId
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-end">
          <Button onClick={handleGenerateNow} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate from Now
          </Button>
        </div>

        {/* ObjectId to Time Mode */}
        {mode === "objectid-to-time" && (
          <div className="p-4 bg-card border rounded-lg space-y-4">
            <CopyInput
              label="MongoDB ObjectId"
              value={objectId}
              onChange={setObjectId}
              placeholder="507f1f77bcf86cd799439011"
              className="font-mono"
              maxLength={24}
            />

            {error && (
              <Alert variant="destructive">
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            {!error && timestamp && (
              <>
                <div className="flex items-center gap-2 py-2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Extracted Timestamp</span>
                </div>

                <CopyInput
                  label="Unix Timestamp (ms)"
                  value={timestamp}
                  readOnly
                />

                <CopyInput
                  label="ISO 8601 Date"
                  value={isoDate}
                  readOnly
                />

                <CopyInput
                  label="Human Readable"
                  value={new Date(Number(timestamp)).toLocaleString()}
                  readOnly
                />
              </>
            )}
          </div>
        )}

        {/* Time to ObjectId Mode */}
        {mode === "time-to-objectid" && (
          <div className="p-4 bg-card border rounded-lg space-y-4">
            <CopyInput
              label="Unix Timestamp (ms)"
              value={timestamp}
              onChange={setTimestamp}
              placeholder="1609459200000"
              type="number"
            />

            <div className="text-center text-xs text-muted-foreground">or</div>

            <CopyInput
              label="ISO 8601 Date"
              value={isoDate}
              onChange={setIsoDate}
              placeholder="2021-01-01T00:00:00.000Z"
            />

            {error && (
              <Alert variant="destructive">
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            <Button onClick={handleConvert} className="w-full" size="lg">
              Generate ObjectId
            </Button>

            {generatedObjectId && !error && (
              <>
                <div className="flex items-center gap-2 py-2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Generated ObjectId</span>
                </div>

                <CopyInput
                  label="MongoDB ObjectId"
                  value={generatedObjectId}
                  readOnly
                  className="font-mono"
                />
              </>
            )}
          </div>
        )}

        {/* ObjectId Structure */}
        {parts && (
          <div className="p-4 bg-card border rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">ObjectId Structure</h3>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 text-center">
                <Badge variant="outline" className="mb-2 text-[10px]">
                  4 bytes
                </Badge>
                <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                  Timestamp
                </div>
                <div className="font-mono text-sm font-bold break-all">
                  {parts.timestamp}
                </div>
              </div>

              <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-3 text-center">
                <Badge variant="outline" className="mb-2 text-[10px]">
                  5 bytes
                </Badge>
                <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                  Random
                </div>
                <div className="font-mono text-sm font-bold break-all">
                  {parts.random}
                </div>
              </div>

              <div className="rounded-lg bg-purple-50 dark:bg-purple-950/20 p-3 text-center">
                <Badge variant="outline" className="mb-2 text-[10px]">
                  3 bytes
                </Badge>
                <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Counter
                </div>
                <div className="font-mono text-sm font-bold break-all">
                  {parts.counter}
                </div>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                MongoDB ObjectIds are 12-byte identifiers: 4-byte timestamp, 5-byte random value, and 3-byte counter.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
