
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToolLayout } from "@/components/tool-layout";
import { HistorySidebar } from "@/components/history-sidebar";
import { ActionToolbar } from "@/components/action-toolbar";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { toast } from "@/hooks/use-toast";
import { Copy, RefreshCw, Clock, Dice5, BarChart3, Trash2 } from "lucide-react";

type HistoryItem = {
  uuid: string;
  version: string;
  timestamp: string;
};

export default function UUIDPage() {
  const [version, setVersion] = useState("4");
  const [generatedUUID, setGeneratedUUID] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("uuid-history");
      if (saved) {
        try {
          setHistory(JSON.parse(saved));
        } catch {
          // Ignore corrupted history data
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("uuid-history", JSON.stringify(history));
    }
  }, [history]);

  useEffect(() => {
    if (!generatedUUID) generateUUID();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function generateUUIDv1() {
    const now = Date.now();
    const timestamp = BigInt(now - Date.UTC(1582, 9, 15)) * 10000n;
    const timeLow = (timestamp & 0xffffffffn).toString(16).padStart(8, "0");
    const timeMid = ((timestamp >> 32n) & 0xffffn).toString(16).padStart(4, "0");
    const timeHi = (((timestamp >> 48n) & 0xfffn) | 0x1000n).toString(16).padStart(4, "0");
    const randomBytes = crypto.getRandomValues(new Uint8Array(8));
    const clockSeq = (((randomBytes[0] << 8 | randomBytes[1]) & 0x3fff) | 0x8000).toString(16).padStart(4, "0");
    const node = Array.from(randomBytes.slice(2), (b) => b.toString(16).padStart(2, "0")).join("");
    return `${timeLow}-${timeMid}-${timeHi}-${clockSeq}-${node}`;
  }

  function generateUUIDv4() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function generateUUIDv7() {
    // RFC 9562 UUIDv7: 48-bit timestamp | 4-bit ver | 12-bit rand_a | 2-bit var | 62-bit rand_b
    const value = crypto.getRandomValues(new Uint8Array(16));
    const timestamp = BigInt(Date.now());
    value[0] = Number((timestamp >> 40n) & 0xffn);
    value[1] = Number((timestamp >> 32n) & 0xffn);
    value[2] = Number((timestamp >> 24n) & 0xffn);
    value[3] = Number((timestamp >> 16n) & 0xffn);
    value[4] = Number((timestamp >> 8n) & 0xffn);
    value[5] = Number(timestamp & 0xffn);
    value[6] = (value[6] & 0x0f) | 0x70; // version 7
    value[8] = (value[8] & 0x3f) | 0x80; // variant 10
    const hex = Array.from(value, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function generateUUID() {
    let uuid = "";
    if (version === "1") uuid = generateUUIDv1();
    else if (version === "7") uuid = generateUUIDv7();
    else uuid = generateUUIDv4();
    
    setGeneratedUUID(uuid);
    setHistory((prev) => [
      { uuid, version: `v${version}`, timestamp: new Date().toISOString() },
      ...prev.slice(0, 49)
    ]);
  }

  const clearHistory = () => {
    setHistory([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("uuid-history");
    }
  };

  const handleClear = useCallback(() => {
    setGeneratedUUID("");
  }, []);

  const copyToClipboard = useCallback(async () => {
    if (!generatedUUID) return;
    try {
      await navigator.clipboard.writeText(generatedUUID);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ description: "Failed to copy", variant: "destructive" });
    }
  }, [generatedUUID]);

  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "c",
        ctrl: true,
        shift: true,
        action: () => { void copyToClipboard(); },
        description: "Copy output",
      },
      {
        key: "x",
        ctrl: true,
        shift: true,
        action: handleClear,
        description: "Clear all",
      },
    ],
  });

  const renderUUIDStyled = (uuid: string) => {
    if (!uuid) return null;
    return (
      <span className="text-primary font-bold">{uuid}</span>
    );
  };

  const getVersionInfo = () => {
    switch (version) {
      case "1": return { label: "Time-based", desc: "Generated from timestamp and MAC address", icon: <Clock className="h-5 w-5 text-primary" /> };
      case "4": return { label: "Random", desc: "Maximum privacy and uniqueness", icon: <Dice5 className="h-5 w-5 text-primary" /> };
      case "7": return { label: "Time-ordered", desc: "Sortable with random component", icon: <BarChart3 className="h-5 w-5 text-primary" /> };
      default: return { label: "Random", desc: "", icon: <Dice5 className="h-5 w-5 text-primary" /> };
    }
  };

  const versionInfo = getVersionInfo();
  const isEmpty = generatedUUID.length === 0;

  return (
    <ToolLayout
      title="UUID Generator"
      description="Generate universally unique identifiers (v1, v4, v7)"
      sidebar={
        <HistorySidebar
          items={history.map((h) => h.uuid)}
          onSelect={setGeneratedUUID}
          onClear={clearHistory}
          renderItem={(_, index) => {
            const item = history[index];
            return (
              <>
                <div className="font-mono text-xs truncate">{item.uuid}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {item.version}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
              </>
            );
          }}
        />
      }
    >
      <div className="space-y-4">
        {/* Version Selection as clickable cards */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => { setVersion("1"); }}
            aria-label="Select UUID version 1"
            className={`p-3 border rounded-lg transition-colors text-left ${version === "1" ? "bg-primary/10 border-primary" : "bg-card hover:bg-secondary"}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-primary" />
              <Badge variant={version === "1" ? "default" : "outline"} className="text-xs">v1</Badge>
            </div>
            <div className="text-sm font-medium">Timestamp-based</div>
            <p className="text-xs text-muted-foreground mt-0.5">Sortable by creation time</p>
          </button>

          <button
            onClick={() => { setVersion("4"); }}
            aria-label="Select UUID version 4"
            className={`p-3 border rounded-lg transition-colors text-left ${version === "4" ? "bg-primary/10 border-primary" : "bg-card hover:bg-secondary"}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Dice5 className="h-4 w-4 text-primary" />
              <Badge variant={version === "4" ? "default" : "outline"} className="text-xs">v4</Badge>
            </div>
            <div className="text-sm font-medium">Random</div>
            <p className="text-xs text-muted-foreground mt-0.5">Most common, max privacy</p>
          </button>

          <button
            onClick={() => { setVersion("7"); }}
            aria-label="Select UUID version 7"
            className={`p-3 border rounded-lg transition-colors text-left ${version === "7" ? "bg-primary/10 border-primary" : "bg-card hover:bg-secondary"}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-primary" />
              <Badge variant={version === "7" ? "default" : "outline"} className="text-xs">v7</Badge>
            </div>
            <div className="text-sm font-medium">Time-ordered</div>
            <p className="text-xs text-muted-foreground mt-0.5">Best for databases</p>
          </button>
        </div>

        {/* Action Toolbar with Regenerate and Clear */}
        <ActionToolbar
          right={
            <>
              <Button onClick={generateUUID} size="sm" className="gap-2" aria-label={`Generate UUID version ${version}`}>
                <RefreshCw className="h-3.5 w-3.5" />
                Generate UUID v{version}
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                size="sm"
                disabled={isEmpty}
                aria-label="Clear generated UUID"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          }
        />

        {/* Main UUID Display - Hero Style */}
        {generatedUUID && (
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg" />
            
            <div className="relative p-6 bg-card/80 backdrop-blur-sm border rounded-lg space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{versionInfo.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold">Generated UUID</h3>
                    <p className="text-xs text-muted-foreground">{versionInfo.desc}</p>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className="text-xs font-semibold text-primary border-primary/30"
                >
                  v{version} · {versionInfo.label}
                </Badge>
              </div>

              {/* UUID Display with Colors */}
              <div className="relative">
                <div className="p-4 bg-gray-100 dark:bg-black/40 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-white/10">
                  <div className="text-2xl font-mono tracking-wide break-all text-center">
                    {renderUUIDStyled(generatedUUID)}
                  </div>
                </div>
              </div>

              {/* Copy Button */}
              <div className="flex justify-center">
                <Button
                  onClick={() => { void copyToClipboard(); }}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  aria-label="Copy UUID to clipboard"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied!" : "Copy UUID"}
                </Button>
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                <span>Format: 8-4-4-4-12</span>
                <span>Length: {generatedUUID.length} chars</span>
                <span>Type: {versionInfo.label}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </ToolLayout>
  );
}
