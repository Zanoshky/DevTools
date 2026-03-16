import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout";
import { CodeEditor } from "@/components/code-editor";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ArrowRightLeft, Trash2, Binary } from "lucide-react";
import { useAutoConvert } from "@/hooks/use-auto-convert";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { ActionToolbar } from "@/components/action-toolbar";
import { StatsBar } from "@/components/stats-bar";
import { EmptyState } from "@/components/empty-state";
import { toast } from "@/hooks/use-toast";

export default function Base64Page() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");

  const convertFn = useCallback(
    (value: string): string => {
      if (mode === "encode") {
        const utf8Bytes = new TextEncoder().encode(value);
        const binaryString = Array.from(utf8Bytes, (byte) =>
          String.fromCharCode(byte)
        ).join("");
        return btoa(binaryString);
      }
      const binaryString = atob(value.trim());
      const bytes = Uint8Array.from(binaryString, (char) =>
        char.charCodeAt(0)
      );
      return new TextDecoder().decode(bytes);
    },
    [mode]
  );

  const { output, error, convert, clear } = useAutoConvert({
    input,
    convertFn,
  });

  const isEmpty = input.length === 0 && output.length === 0;

  const handleCopyOutput = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      toast({ description: "Copied to clipboard" });
    } catch {
      toast({ description: "Failed to copy", variant: "destructive" });
    }
  }, [output]);

  const handleClear = useCallback(() => {
    setInput("");
    clear();
  }, [clear]);

  const switchMode = useCallback(() => {
    setMode((prev) => (prev === "encode" ? "decode" : "encode"));
    setInput(output);
    clear();
  }, [output, clear]);

  useKeyboardShortcuts({
    shortcuts: [
      { key: "Enter", ctrl: true, action: convert, description: "Convert" },
      {
        key: "c",
        ctrl: true,
        shift: true,
        action: handleCopyOutput,
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

  const ratio =
    input.length > 0 && output.length > 0
      ? mode === "encode"
        ? `${((output.length / input.length) * 100).toFixed(0)}% of original`
        : `${((output.length / input.length) * 100).toFixed(0)}% of encoded`
      : null;

  return (
    <ToolLayout
      title="Base64 Encoder/Decoder"
      description="Encode and decode Base64 strings"
    >
      <div className="space-y-3">
        <ActionToolbar
          left={
            <Tabs
              value={mode}
              onValueChange={(v) => setMode(v as "encode" | "decode")}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid w-full sm:w-[300px] grid-cols-2">
                <TabsTrigger value="encode">Encode</TabsTrigger>
                <TabsTrigger value="decode">Decode</TabsTrigger>
              </TabsList>
            </Tabs>
          }
          right={
            <>
              <Button onClick={convert} size="sm" aria-label={mode === "encode" ? "Encode input" : "Decode input"}>
                {mode === "encode" ? "Encode" : "Decode"}
              </Button>
              <Button
                onClick={switchMode}
                variant="outline"
                size="sm"
                className="gap-2"
                aria-label="Switch encode/decode mode"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                Switch
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                size="sm"
                disabled={isEmpty}
                aria-label="Clear all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          }
        />

        <StatsBar
          inputLength={input.length}
          outputLength={output.length}
          ratio={ratio}
          visible={!isEmpty}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {mode === "encode" ? "Text to Encode" : "Base64 to Decode"}
            </Label>
            <CodeEditor
              language="text"
              value={input}
              onChange={setInput}
              placeholder={
                mode === "encode" ? "Enter text..." : "Enter Base64..."
              }
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Result</Label>
            {error ? (
              <CodeEditor
                language="text"
                value={error}
                readOnly
                placeholder=""
              />
            ) : output ? (
              <CodeEditor
                language="text"
                value={output}
                readOnly
                label="Result"
              />
            ) : (
              <div className="rounded-md border bg-background min-h-[200px] flex items-center justify-center">
                <EmptyState
                  icon={Binary}
                  message={
                    mode === "encode"
                      ? "Enter text to encode"
                      : "Enter Base64 to decode"
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
