"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ToolLayout } from "@/components/tool-layout";
import { CopyInput } from "@/components/copy-input";
import { HistorySidebar } from "@/components/history-sidebar";
type HistoryItem = {
  uuid: string;
  version: string;
  timestamp: string;
};

export default function UUIDPage() {
  const [version, setVersion] = useState("4");
  const [generatedUUID, setGeneratedUUID] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("uuid-history");
      if (saved) {
        try {
          setHistory(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to load history:", e);
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
    const clockSeq = ((Math.random() * 0x3fff) | 0x8000).toString(16).padStart(4, "0");
    const node = Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    return `${timeLow}-${timeMid}-${timeHi}-${clockSeq}-${node}`;
  }

  function generateUUIDv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function generateUUIDv7() {
    const timestamp = Date.now();
    const timestampHex = timestamp.toString(16).padStart(12, "0");
    const random = crypto.getRandomValues(new Uint8Array(10));
    const randomHex = Array.from(random).map((b) => b.toString(16).padStart(2, "0")).join("");
    const group4a = ((parseInt(randomHex.substring(3, 5), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0");
    return `${timestampHex.substring(0, 8)}-${timestampHex.substring(8, 12)}-7${randomHex.substring(0, 3)}-${group4a}${randomHex.substring(5, 7)}-${randomHex.substring(7, 19)}`;
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
      <div className="space-y-3">
        {/* Configuration Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-card border rounded-lg">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Label htmlFor="version" className="text-sm whitespace-nowrap">UUID Version:</Label>
            <Select value={version} onValueChange={setVersion}>
              <SelectTrigger id="version" className="h-8 text-xs w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1" className="text-xs">v1 - Timestamp-based</SelectItem>
                <SelectItem value="4" className="text-xs">v4 - Random (most common)</SelectItem>
                <SelectItem value="7" className="text-xs">v7 - Time-ordered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={generateUUID} size="sm">
            Generate UUID
          </Button>
        </div>

        {/* Generated UUID Display */}
        {generatedUUID && (
          <div className="p-4 bg-card border rounded-lg">
            <Label className="text-sm font-medium mb-2 block">Generated UUID</Label>
            <CopyInput
              id="generated"
              value={generatedUUID}
              readOnly
              className="font-mono text-sm"
            />
            
            {/* UUID Info */}
            <div className="mt-3 pt-3 border-t">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <div className="text-muted-foreground mb-1">Version</div>
                  <Badge variant="secondary" className="text-xs">v{version}</Badge>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Format</div>
                  <div className="font-medium">8-4-4-4-12</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Length</div>
                  <div className="font-medium">{generatedUUID.length} chars</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Type</div>
                  <div className="font-medium">
                    {version === "1" ? "Time-based" : version === "7" ? "Time-ordered" : "Random"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UUID Version Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-card border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">v1</Badge>
              <span className="text-sm font-medium">Timestamp-based</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Generated from timestamp and MAC address. Sortable by creation time but may expose system info.
            </p>
          </div>

          <div className="p-3 bg-card border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">v4</Badge>
              <span className="text-sm font-medium">Random</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Most common. Generated using random numbers. No sortability but maximum privacy and uniqueness.
            </p>
          </div>

          <div className="p-3 bg-card border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">v7</Badge>
              <span className="text-sm font-medium">Time-ordered</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Modern approach. Sortable by creation time with random component. Best for databases and distributed systems.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
