"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Copy, Check, Palette, RefreshCw, Download } from "lucide-react";
import { CopyInput } from "@/components/copy-input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ColorPaletteGeneratorPage() {
  const [baseColor, setBaseColor] = useState("#3b82f6");
  const [shades, setShades] = useState(5);
  const [palette, setPalette] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  const generatePalette = () => {
    const hex = baseColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const colors: string[] = [];
    
    // Generate darker shades
    for (let i = shades; i >= 1; i--) {
      const factor = i / (shades + 1);
      const newR = Math.round(r * (1 - factor));
      const newG = Math.round(g * (1 - factor));
      const newB = Math.round(b * (1 - factor));
      colors.push(`#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`);
    }

    // Base color
    colors.push(baseColor);

    // Generate lighter tints
    for (let i = 1; i <= shades; i++) {
      const factor = i / (shades + 1);
      const newR = Math.round(r + (255 - r) * factor);
      const newG = Math.round(g + (255 - g) * factor);
      const newB = Math.round(b + (255 - b) * factor);
      colors.push(`#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`);
    }

    setPalette(colors);
  };

  const copyToClipboard = (text: string, index: number) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopied(index);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const copyAllColors = () => {
    if (navigator?.clipboard?.writeText) {
      const allColors = palette.join('\n');
      navigator.clipboard.writeText(allColors);
      setCopied(-1);
      toast.success("All colors copied!");
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const exportAsCSS = () => {
    const css = palette.map((color, i) => {
      const name = getColorName(i).toLowerCase().replace(/\s+/g, '-');
      return `  --color-${name}: ${color};`;
    }).join('\n');
    const fullCSS = `:root {\n${css}\n}`;
    
    // Download as file
    const blob = new Blob([fullCSS], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'color-palette.css';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSS file downloaded!");
  };

  const exportAsTailwind = () => {
    const config = palette.map((color, i) => {
      const name = getColorName(i).toLowerCase().replace(/\s+/g, '-');
      return `      '${name}': '${color}',`;
    }).join('\n');
    const fullConfig = `// Add this to your tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${config}\n      }\n    }\n  }\n}`;
    
    // Download as file
    const blob = new Blob([fullConfig], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tailwind-colors.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Tailwind config downloaded!");
  };

  const getColorName = (index: number) => {
    const baseIndex = shades;
    if (index < baseIndex) {
      return `Shade ${baseIndex - index}`;
    } else if (index === baseIndex) {
      return "Base";
    } else {
      return `Tint ${index - baseIndex}`;
    }
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`
      : hex;
  };

  return (
    <ToolLayout
      title="Color Palette Generator"
      description="Generate beautiful color palettes with shades and tints from a base color"
    >
      <div className="space-y-3">
        {/* Controls */}
        <div className="flex items-center justify-end gap-3">
          <Button onClick={generatePalette} size="sm" className="gap-2">
            <RefreshCw className="h-3 w-3" />
            Generate Palette
          </Button>
        </div>

        {/* Side-by-side layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Input Section */}
          <div className="space-y-3">
            {/* Base Color Input */}
            <div className="p-3 bg-card border rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">Base Color</Label>
              </div>

              <div className="flex gap-2">
                <Input
                  type="text"
                  value={baseColor}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.startsWith('#') && value.length <= 7) {
                      setBaseColor(value);
                    }
                  }}
                  placeholder="#3b82f6"
                  maxLength={7}
                  className="font-mono text-sm h-10"
                />
                <Input
                  type="color"
                  value={baseColor}
                  onChange={(e) => setBaseColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Shades/Tints per side</Label>
                  <Badge variant="secondary" className="text-xs">{shades}</Badge>
                </div>
                <Slider
                  value={[shades]}
                  onValueChange={(value) => setShades(value[0])}
                  min={2}
                  max={7}
                  step={1}
                  className="py-2"
                />
                <div className="text-xs text-muted-foreground">
                  Total colors: {shades * 2 + 1} ({shades} darker + base + {shades} lighter)
                </div>
              </div>
            </div>

            {/* Color Swatches */}
            {palette.length > 0 && (
              <div className="p-3 bg-card border rounded-lg space-y-3">
                <Label className="text-sm font-medium">Color Swatches</Label>
                <div className="grid grid-cols-3 gap-2">
                  {palette.map((color, i) => (
                    <div
                      key={i}
                      className="group relative cursor-pointer"
                      onClick={() => copyToClipboard(color, i)}
                      title={`Click to copy ${color}`}
                    >
                      <div
                        className="aspect-square rounded-lg border-2 hover:scale-105 transition-all shadow-md hover:shadow-lg"
                        style={{ backgroundColor: color }}
                      >
                        {i === shades && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Badge className="text-xs">Base</Badge>
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-center mt-1 truncate">
                        {color}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Output Section */}
          <div className="space-y-3">
            {palette.length > 0 ? (
              <>
                <div className="p-3 bg-card border rounded-lg space-y-3 min-h-[520px]">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Color Values</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyAllColors}
                        className="h-7 text-xs gap-1.5"
                      >
                        {copied === -1 ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        Copy All
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {palette.map((color, i) => (
                      <div
                        key={i}
                        className="space-y-1"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded border-2 flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{getColorName(i)}</span>
                              {i === shades && <Badge variant="secondary" className="text-[10px] h-4">Base</Badge>}
                            </div>
                            <div className="text-xs font-mono">{color.toUpperCase()}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(color, i)}
                            className="h-7 w-7 p-0"
                          >
                            {copied === i ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t space-y-2">
                    <Label className="text-xs text-muted-foreground">Export Options</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportAsCSS}
                        className="flex-1 h-8 text-xs gap-1.5"
                      >
                        <Download className="h-3 w-3" />
                        CSS Variables
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportAsTailwind}
                        className="flex-1 h-8 text-xs gap-1.5"
                      >
                        <Download className="h-3 w-3" />
                        Tailwind
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Format Examples */}
                <div className="p-3 bg-card border rounded-lg space-y-2">
                  <Label className="text-sm font-medium">Format Examples</Label>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">HEX</Label>
                      <CopyInput
                        value={palette[shades]}
                        readOnly
                        className="font-mono text-xs h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">RGB</Label>
                      <CopyInput
                        value={hexToRgb(palette[shades])}
                        readOnly
                        className="font-mono text-xs h-8"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-3 bg-card border rounded-lg min-h-[520px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Palette className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Click &quot;Generate Palette&quot; to create colors</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
