"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { Label } from "@/components/ui/label";

interface CopyTextareaProps {
  label?: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  id?: string;
  rows?: number;
}

export function CopyTextarea({
  label,
  value,
  onChange,
  placeholder,
  readOnly = false,
  className = "",
  id,
  rows = 4,
}: CopyTextareaProps) {
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <Label htmlFor={id}>{label}</Label>
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
      <Textarea
        id={id}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        readOnly={readOnly}
        rows={rows}
        className={`${readOnly ? 'bg-secondary/50' : ''} font-mono text-sm ${className}`}
        aria-readonly={readOnly || undefined}
      />
      <div aria-live="polite" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </div>
    </div>
  );
}
