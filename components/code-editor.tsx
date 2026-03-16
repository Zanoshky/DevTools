import { useState, useMemo, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { xml } from "@codemirror/lang-xml";
import { yaml } from "@codemirror/lang-yaml";
import { javascript } from "@codemirror/lang-javascript";
import { css } from "@codemirror/lang-css";
import { EditorView } from "@codemirror/view";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { Label } from "@/components/ui/label";

type Language = "json" | "xml" | "yaml" | "javascript" | "css" | "text" | "csv" | "sql" | "markdown" | "toml" | "hurl" | "base64" | "jwt" | "regex" | "url" | "hash";

interface CodeEditorProps {
  label?: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  id?: string;
  language?: Language;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
}

const langExtensions: Record<string, () => ReturnType<typeof json>> = {
  json,
  xml,
  yaml,
  javascript,
  css,
};

export function CodeEditor({
  label,
  value,
  onChange,
  placeholder,
  readOnly = false,
  className = "",
  language = "text",
  height,
  minHeight = "200px",
  maxHeight,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const [dynamicHeight, setDynamicHeight] = useState<string>(height || "50vh");

  // Dynamically calculate height to fill available space (skip if fixed height provided)
  useEffect(() => {
    if (height) {
      setDynamicHeight(height);
      return;
    }
    // Default to 50vh - works consistently for both side-by-side and single column
    setDynamicHeight("50vh");
  }, [height]);

  const handleCopy = async () => {
    if (typeof window === "undefined") return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = value;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.setAttribute("aria-hidden", "true");
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const extensions = useMemo(() => {
    const exts = [
      EditorView.lineWrapping,
      EditorView.theme({
        "&": { fontSize: "13px" },
        ".cm-gutters": {
          backgroundColor: "transparent",
          borderRight: "1px solid hsl(var(--border))",
          color: "hsl(var(--muted-foreground))",
        },
        ".cm-activeLineGutter": { backgroundColor: "transparent" },
        ".cm-activeLine": { backgroundColor: "hsl(var(--accent) / 0.5)" },
        ".cm-cursor": { borderLeftColor: "hsl(var(--foreground))" },
        ".cm-selectionBackground": { backgroundColor: "hsl(var(--accent)) !important" },
        "&.cm-focused .cm-selectionBackground": { backgroundColor: "hsl(var(--accent)) !important" },
        ".cm-content": { caretColor: "hsl(var(--foreground))" },
        ".cm-placeholder": { color: "hsl(var(--muted-foreground))" },
      }),
    ];
    const langFn = langExtensions[language];
    if (langFn) exts.push(langFn());
    return exts;
  }, [language]);

  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <Label>{label}</Label>
          <Button
            onClick={handleCopy}
            variant="ghost"
            size="sm"
            className="h-8"
            type="button"
            aria-label={copied ? "Copied to clipboard" : `Copy ${label || "content"} to clipboard`}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 mr-1" aria-hidden="true" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" aria-hidden="true" />
                <span>Copy</span>
              </>
            )}
          </Button>
        </div>
      )}
      <div
        className={`rounded-md border bg-background overflow-hidden ${readOnly ? "opacity-80" : ""} ${className}`}
      >
        <CodeMirror
          value={value}
          onChange={readOnly ? undefined : onChange}
          readOnly={readOnly}
          placeholder={placeholder}
          height={dynamicHeight}
          theme={isDark ? "dark" : "light"}
          extensions={extensions}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            bracketMatching: true,
            autocompletion: false,
          }}
        />
      </div>
      <div aria-live="polite" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </div>
    </div>
  );
}
