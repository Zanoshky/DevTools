"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout";
import { CopyTextarea } from "@/components/copy-textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

export default function Base64Page() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleConvert = () => {
    try {
      if (mode === "encode") {
        // Encode UTF-8 string to base64
        const utf8Bytes = new TextEncoder().encode(input);
        const binaryString = Array.from(utf8Bytes, byte => String.fromCharCode(byte)).join('');
        setOutput(btoa(binaryString));
      } else {
        // Decode base64 to UTF-8 string
        const binaryString = atob(input.trim());
        const bytes = Uint8Array.from(binaryString, char => char.charCodeAt(0));
        setOutput(new TextDecoder().decode(bytes));
      }
    } catch {
      setOutput("Error: Invalid base64 input");
    }
  };

  const switchMode = () => {
    setMode(mode === "encode" ? "decode" : "encode");
    setInput(output);
    setOutput("");
  };

  return (
    <ToolLayout
      title="Base64 Encoder/Decoder"
      description="Encode and decode Base64 strings"
    >
      <div className="space-y-3">
        {/* Compact Toolbar */}
        <div className="p-3 bg-card border rounded-lg">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "encode" | "decode")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="encode">Encode</TabsTrigger>
              <TabsTrigger value="decode">Decode</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Action Buttons Row */}
        <div className="flex justify-end gap-2">
          <Button onClick={handleConvert} size="sm">
            {mode === "encode" ? "Encode" : "Decode"}
          </Button>
          <Button onClick={switchMode} variant="outline" size="sm">
            Switch
          </Button>
        </div>

        {/* Input/Output Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {mode === "encode" ? "Text to Encode" : "Base64 to Decode"}
            </Label>
            <CopyTextarea
              value={input}
              onChange={setInput}
              placeholder={mode === "encode" ? "Enter text..." : "Enter Base64..."}
              rows={20}
              className="font-mono text-xs"
            />
          </div>

          {/* Output */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Result</Label>
            <CopyTextarea
              value={output}
              readOnly
              placeholder="Output will appear here..."
              rows={20}
              className="font-mono text-xs"
            />
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
