
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout";
import { CopyInput } from "@/components/copy-input";
import { HistorySidebar } from "@/components/history-sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ActionToolbar } from "@/components/action-toolbar";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import {
  ArrowRight,
  Clock,
  Database,
  Info,
  RefreshCw,
  Trash2,
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

  const isEmpty = objectId === "" && timestamp === "" && isoDate === "" && generatedObjectId === "" && error === "";

  const handleClear = useCallback(() => {
    setObjectId("");
    setTimestamp("");
    setIsoDate("");
    setGeneratedObjectId("");
    setError("");
  }, []);

  useKeyboardShortcuts({
    shortcuts: [
      { key: "x", ctrl: true, shift: true, action: handleClear, description: "Clear all" },
    ],
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mongo-objectid-history");
      if (stored) setHistory(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && history.length > 0) {
      localStorage.setItem("mongo-objectid-history", JSON.stringify(history));
    }
  }, [history]);

  const objectIdToTimestamp = (id: string) => {
    if (!/^[a-f\d]{24}$/i.test(id)) {
      setError("Invalid ObjectId (must be 24 hex characters)");
      setTimestamp("");
      setIsoDate("");
      return;
    }
    try {
      const ts = parseInt(id.substring(0, 8), 16) * 1000;
      setError("");
      setTimestamp(ts.toString());
      setIsoDate(new Date(ts).toISOString());
    } catch {
      setError("Error parsing ObjectId");
      setTimestamp("");
      setIsoDate("");
    }
  };

  const timestampToObjectId = (ts: string) => {
    try {
      const date = isNaN(Number(ts)) ? new Date(ts) : new Date(Number(ts));
      if (isNaN(date.getTime())) {
        setError("Invalid timestamp or date format");
        setGeneratedObjectId("");
        return;
      }
      const hex = Math.floor(date.getTime() / 1000).toString(16).padStart(8, "0");
      const rand = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      const oid = hex + rand;
      setGeneratedObjectId(oid);
      setError("");
      setHistory((prev) => [oid, ...prev.filter((id) => id !== oid).slice(0, 9)]);
    } catch {
      setError("Error generating ObjectId");
      setGeneratedObjectId("");
    }
  };

  useEffect(() => {
    if (mode === "objectid-to-time" && objectId) objectIdToTimestamp(objectId);
  }, [objectId, mode]);

  const handleGenerateNow = () => {
    const now = Date.now();
    const nowStr = now.toString();
    if (mode === "time-to-objectid") {
      setTimestamp(nowStr);
      timestampToObjectId(nowStr);
    } else {
      const hex = Math.floor(now / 1000).toString(16).padStart(8, "0");
      const oid = hex + "0000000000000000";
      setObjectId(oid);
    }
  };

  const handleConvert = () => {
    if (mode === "time-to-objectid") timestampToObjectId(timestamp || isoDate);
  };

  const clearHistory = () => {
    setHistory([]);
    if (typeof window !== "undefined") localStorage.removeItem("mongo-objectid-history");
  };

  const getObjectIdParts = (oid: string) => {
    if (oid.length !== 24) return null;
    return { timestamp: oid.slice(0, 8), random: oid.slice(8, 18), counter: oid.slice(18, 24) };
  };

  const parts = mode === "objectid-to-time" && objectId.length === 24
    ? getObjectIdParts(objectId)
    : generatedObjectId.length === 24
    ? getObjectIdParts(generatedObjectId)
    : null;

  return (
    <ToolLayout
      title="MongoDB ObjectId / Timestamp"
      description="Extract timestamps from ObjectIds or generate ObjectIds from timestamps"
      sidebar={
        <HistorySidebar
          items={history}
          onSelect={(oid) => { setObjectId(oid); setMode("objectid-to-time"); }}
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
        <ActionToolbar
          left={
            <Tabs value={mode} onValueChange={(v) => setMode(v as ConversionMode)}>
              <TabsList className="h-8">
                <TabsTrigger value="objectid-to-time" className="text-xs gap-1.5">
                  <Database className="h-3.5 w-3.5" aria-hidden="true" />
                  OID to Time
                </TabsTrigger>
                <TabsTrigger value="time-to-objectid" className="text-xs gap-1.5">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  Time to OID
                </TabsTrigger>
              </TabsList>
            </Tabs>
          }
          right={
            <>
              <Button onClick={handleGenerateNow} variant="outline" size="sm" className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Now
              </Button>
              {mode === "time-to-objectid" && (
                <Button onClick={handleConvert} size="sm">Generate</Button>
              )}
              <Button onClick={handleClear} variant="outline" size="sm" disabled={isEmpty} aria-label="Clear all">
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </>
          }
        />

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {mode === "objectid-to-time" ? (
          <div className="space-y-3">
            <CopyInput
              label="MongoDB ObjectId"
              value={objectId}
              onChange={setObjectId}
              placeholder="507f1f77bcf86cd799439011"
              className="font-mono"
              maxLength={24}
            />
            {!error && timestamp && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <CopyInput label="Unix Timestamp (ms)" value={timestamp} readOnly />
                <CopyInput label="ISO 8601" value={isoDate} readOnly />
                <CopyInput label="Local Time" value={new Date(Number(timestamp)).toLocaleString()} readOnly />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CopyInput label="Unix Timestamp (ms)" value={timestamp} onChange={setTimestamp} placeholder="1609459200000" type="number" />
              <CopyInput label="ISO 8601 Date" value={isoDate} onChange={setIsoDate} placeholder="2021-01-01T00:00:00.000Z" />
            </div>
            {generatedObjectId && !error && (
              <CopyInput label="Generated ObjectId" value={generatedObjectId} readOnly className="font-mono" />
            )}
          </div>
        )}

        {/* ObjectId Structure */}
        {parts && (
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-2.5 text-center">
              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Timestamp (4B)</div>
              <div className="font-mono text-sm font-bold mt-0.5">{parts.timestamp}</div>
            </div>
            <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-2.5 text-center">
              <div className="text-[10px] text-green-600 dark:text-green-400 font-medium">Random (5B)</div>
              <div className="font-mono text-sm font-bold mt-0.5">{parts.random}</div>
            </div>
            <div className="rounded-lg bg-purple-50 dark:bg-purple-950/20 p-2.5 text-center">
              <div className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Counter (3B)</div>
              <div className="font-mono text-sm font-bold mt-0.5">{parts.counter}</div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
