
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { Label } from "@/components/ui/label";

interface CopyInputProps {
  label?: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  id?: string;
  type?: string;
  maxLength?: number;
}

export function CopyInput({
  label,
  value,
  onChange,
  placeholder,
  readOnly = false,
  className = "",
  id,
  type = "text",
  maxLength,
}: CopyInputProps) {
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
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="flex gap-2">
        <Input
          id={id}
          type={type}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`${readOnly ? 'bg-secondary/50' : ''} ${className}`}
          maxLength={maxLength}
          aria-readonly={readOnly || undefined}
          spellCheck={false}
          autoComplete="off"
        />
        <Button
          onClick={handleCopy}
          variant="outline"
          size="icon"
          className="shrink-0"
          type="button"
          aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
        >
          {copied ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>
      <div aria-live="polite" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </div>
    </div>
  );
}
