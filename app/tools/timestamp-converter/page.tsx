import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ToolLayout } from "@/components/tool-layout";
import { CopyInput } from "@/components/copy-input";
import { HistorySidebar } from "@/components/history-sidebar";
import { ActionToolbar } from "@/components/action-toolbar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/empty-state";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { Clock, Calendar, RefreshCw, Trash2 } from "lucide-react";

type Mode = "epoch-to-date" | "date-to-epoch";
type Unit = "seconds" | "milliseconds";

export default function TimestampConverterPage() {
  const [mode, setMode] = useState<Mode>("epoch-to-date");
  const [unit, setUnit] = useState<Unit>("seconds");
  const [epoch, setEpoch] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const [tz, setTz] = useState<"local" | "utc">("local");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  const isEmpty = epoch === "" && dateInput === "" && timeInput === "";

  // Load/save history
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("epoch-converter-history");
      if (stored) setHistory(JSON.parse(stored));
    } catch (e) { console.error("Failed to load:", e); }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || history.length === 0) return;
    localStorage.setItem("epoch-converter-history", JSON.stringify(history));
  }, [history]);

  const addHistory = useCallback((val: string) => {
    setHistory((prev) => [val, ...prev.filter((v) => v !== val).slice(0, 19)]);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (typeof window !== "undefined") localStorage.removeItem("epoch-converter-history");
  }, []);

  const handleClear = useCallback(() => {
    setEpoch("");
    setDateInput("");
    setTimeInput("");
    setError("");
  }, []);

  const handleNow = useCallback(() => {
    const now = Date.now();
    if (mode === "epoch-to-date") {
      const val = unit === "seconds" ? Math.floor(now / 1000).toString() : now.toString();
      setEpoch(val);
      addHistory(val);
    } else {
      const d = new Date(now);
      setDateInput(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`);
      setTimeInput(`${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`);
    }
    setError("");
  }, [mode, unit, addHistory]);

  useKeyboardShortcuts({
    shortcuts: [
      { key: "x", ctrl: true, shift: true, action: handleClear, description: "Clear all" },
    ],
  });

  // --- Epoch to Date ---
  const epochResult = (() => {
    if (!epoch || isNaN(Number(epoch))) return null;
    try {
      const ms = unit === "seconds" ? Number(epoch) * 1000 : Number(epoch);
      const d = new Date(ms);
      if (isNaN(d.getTime())) return null;
      return {
        iso: d.toISOString(),
        local: d.toLocaleString(),
        utc: d.toUTCString(),
        day: d.toLocaleDateString("en-US", { weekday: "long" }),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        s: Math.floor(d.getTime() / 1000),
        ms: d.getTime(),
        parts: {
          year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(),
          hours: d.getHours(), min: d.getMinutes(), sec: d.getSeconds(),
        },
      };
    } catch { return null; }
  })();

  // --- Date to Epoch ---
  const dateResult = (() => {
    if (!dateInput) return null;
    try {
      const str = timeInput ? `${dateInput}T${timeInput}` : `${dateInput}T00:00:00`;
      const d = tz === "utc" ? new Date(str + "Z") : new Date(str);
      if (isNaN(d.getTime())) return null;
      return {
        s: Math.floor(d.getTime() / 1000),
        ms: d.getTime(),
        iso: d.toISOString(),
        local: d.toLocaleString(),
        utc: d.toUTCString(),
      };
    } catch { return null; }
  })();

  // Auto-add to history on epoch change
  useEffect(() => {
    if (!epoch || isNaN(Number(epoch))) return;
    const timer = setTimeout(() => addHistory(epoch), 800);
    return () => clearTimeout(timer);
  }, [epoch, addHistory]);

  return (
    <ToolLayout
      title="Epoch Converter"
      description="Bidirectional conversion between UNIX epoch timestamps and human-readable dates"
      sidebar={
        <HistorySidebar
          items={history}
          onSelect={(val) => { setEpoch(val); setMode("epoch-to-date"); }}
          onClear={clearHistory}
          renderItem={(val) => {
            const n = Number(val);
            const ms = n > 1e12 ? n : n * 1000;
            return (
              <>
                <div className="font-mono text-xs truncate">{val}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {isNaN(ms) ? "" : new Date(ms).toLocaleString()}
                </div>
              </>
            );
          }}
        />
      }
    >
      <div className="space-y-3">
        <ActionToolbar
          left={
            <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <TabsList className="h-8">
                <TabsTrigger value="epoch-to-date" className="text-xs gap-1.5">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  Epoch to Date
                </TabsTrigger>
                <TabsTrigger value="date-to-epoch" className="text-xs gap-1.5">
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  Date to Epoch
                </TabsTrigger>
              </TabsList>
            </Tabs>
          }
          right={
            <>
              <Button onClick={handleNow} variant="outline" size="sm" className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Now
              </Button>
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

        {mode === "epoch-to-date" ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <button
                  onClick={() => setUnit("seconds")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                    unit === "seconds" ? "bg-primary/10 border-primary text-primary" : "bg-card hover:bg-secondary"
                  }`}
                >
                  Seconds
                </button>
                <button
                  onClick={() => setUnit("milliseconds")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                    unit === "milliseconds" ? "bg-primary/10 border-primary text-primary" : "bg-card hover:bg-secondary"
                  }`}
                >
                  Milliseconds
                </button>
              </div>
            </div>

            <CopyInput
              label="Epoch Timestamp"
              value={epoch}
              onChange={setEpoch}
              placeholder={unit === "seconds" ? "1609459200" : "1609459200000"}
              className="font-mono"
            />

            {epochResult ? (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">{epochResult.day}</Badge>
                  <Badge variant="outline" className="text-[10px]">{epochResult.timezone}</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <CopyInput label="ISO 8601" value={epochResult.iso} readOnly />
                  <CopyInput label="Local" value={epochResult.local} readOnly />
                  <CopyInput label="UTC" value={epochResult.utc} readOnly />
                </div>

                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {(["year", "month", "day", "hours", "min", "sec"] as const).map((k) => (
                    <div key={k} className="rounded-lg bg-primary/5 border p-2 text-center">
                      <div className="text-[10px] text-muted-foreground capitalize">{k}</div>
                      <div className="text-sm font-bold font-mono">{epochResult.parts[k]}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <CopyInput label="Unix (s)" value={epochResult.s.toString()} readOnly className="font-mono" />
                  <CopyInput label="Unix (ms)" value={epochResult.ms.toString()} readOnly className="font-mono" />
                </div>
              </>
            ) : (
              !epoch && (
                <EmptyState icon={Clock} message="Enter an epoch timestamp to convert" />
              )
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ec-date" className="text-xs">Date</Label>
                <Input id="ec-date" type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ec-time" className="text-xs">Time</Label>
                <Input id="ec-time" type="time" step="1" value={timeInput} onChange={(e) => setTimeInput(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">TZ:</Label>
              <div className="flex gap-1">
                <button
                  onClick={() => setTz("local")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                    tz === "local" ? "bg-primary/10 border-primary text-primary" : "bg-card hover:bg-secondary"
                  }`}
                >
                  Local
                </button>
                <button
                  onClick={() => setTz("utc")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                    tz === "utc" ? "bg-primary/10 border-primary text-primary" : "bg-card hover:bg-secondary"
                  }`}
                >
                  UTC
                </button>
              </div>
            </div>

            {dateResult ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-2.5 text-center">
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Seconds</div>
                    <div className="font-mono text-sm font-bold mt-0.5">{dateResult.s}</div>
                  </div>
                  <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-2.5 text-center">
                    <div className="text-[10px] text-green-600 dark:text-green-400 font-medium">Milliseconds</div>
                    <div className="font-mono text-sm font-bold mt-0.5">{dateResult.ms}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <CopyInput label="ISO 8601" value={dateResult.iso} readOnly />
                  <CopyInput label="Local" value={dateResult.local} readOnly />
                  <CopyInput label="UTC" value={dateResult.utc} readOnly />
                </div>
              </>
            ) : (
              !dateInput && (
                <EmptyState icon={Calendar} message="Select a date and time to convert" />
              )
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

function p(n: number): string {
  return String(n).padStart(2, "0");
}
