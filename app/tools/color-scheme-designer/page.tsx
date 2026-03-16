
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToolLayout } from "@/components/tool-layout";
import { Copy, Check, Palette, RefreshCw, Download, Trash2 } from "lucide-react";
import { CopyInput } from "@/components/copy-input";
import { Badge } from "@/components/ui/badge";
import { ActionToolbar } from "@/components/action-toolbar";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { toast } from "sonner";

type SchemeType = "complementary" | "triadic" | "tetradic" | "analogous" | "split-complementary" | "monochromatic";

export default function ColorSchemeDesignerPage() {
  const [baseColor, setBaseColor] = useState("#3b82f6");
  const [scheme, setScheme] = useState<SchemeType>("complementary");
  const [colors, setColors] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const hexToHsl = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 0, l: 0 };
    
    const r = parseInt(result[1], 16) / 255;
    const g = parseInt(result[2], 16) / 255;
    const b = parseInt(result[3], 16) / 255;
    
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  const generateScheme = () => {
    const { h, s, l } = hexToHsl(baseColor);
    const newColors: string[] = [baseColor];

    switch (scheme) {
      case "complementary":
        newColors.push(hslToHex((h + 180) % 360, s, l));
        break;
      case "triadic":
        newColors.push(hslToHex((h + 120) % 360, s, l));
        newColors.push(hslToHex((h + 240) % 360, s, l));
        break;
      case "tetradic":
        newColors.push(hslToHex((h + 90) % 360, s, l));
        newColors.push(hslToHex((h + 180) % 360, s, l));
        newColors.push(hslToHex((h + 270) % 360, s, l));
        break;
      case "analogous":
        newColors.push(hslToHex((h + 30) % 360, s, l));
        newColors.push(hslToHex((h - 30 + 360) % 360, s, l));
        break;
      case "split-complementary":
        newColors.push(hslToHex((h + 150) % 360, s, l));
        newColors.push(hslToHex((h + 210) % 360, s, l));
        break;
      case "monochromatic":
        newColors.push(hslToHex(h, s, Math.max(0, l - 20)));
        newColors.push(hslToHex(h, s, Math.max(0, l - 40)));
        newColors.push(hslToHex(h, s, Math.min(100, l + 20)));
        newColors.push(hslToHex(h, s, Math.min(100, l + 40)));
        break;
    }

    setColors(newColors);
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(index);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const copyAllColors = async () => {
    try {
      const allColors = colors.join('\n');
      await navigator.clipboard.writeText(allColors);
      setCopied(-1);
      toast.success("All colors copied!");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const exportAsCSS = () => {
    const css = colors.map((color, i) => {
      const name = i === 0 ? 'base' : `color-${i}`;
      return `  --${name}: ${color};`;
    }).join('\n');
    const fullCSS = `:root {\n${css}\n}`;
    
    const blob = new Blob([fullCSS], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scheme}-scheme.css`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSS file downloaded!");
  };

  const exportAsTailwind = () => {
    const config = colors.map((color, i) => {
      const name = i === 0 ? 'base' : `color-${i}`;
      return `        '${name}': '${color}',`;
    }).join('\n');
    const fullConfig = `// Add this to your tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${config}\n      }\n    }\n  }\n}`;
    
    const blob = new Blob([fullConfig], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scheme}-tailwind.js`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Tailwind config downloaded!");
  };

  const getSchemeDescription = (type: SchemeType) => {
    const descriptions = {
      complementary: "Colors opposite on the color wheel - creates high contrast",
      triadic: "Three colors evenly spaced on the color wheel - vibrant and balanced",
      tetradic: "Four colors forming a rectangle on the color wheel - rich and varied",
      analogous: "Colors next to each other on the color wheel - harmonious and serene",
      "split-complementary": "Base color plus two adjacent to its complement - balanced contrast",
      monochromatic: "Variations of a single hue - cohesive and elegant"
    };
    return descriptions[type];
  };

  const getSchemeColorCount = (type: SchemeType) => {
    const counts = {
      complementary: 2,
      triadic: 3,
      tetradic: 4,
      analogous: 3,
      "split-complementary": 3,
      monochromatic: 5
    };
    return counts[type];
  };

  const isEmpty = baseColor === "#3b82f6" && scheme === "complementary" && colors.length === 0;

  const handleClear = useCallback(() => {
    setBaseColor("#3b82f6");
    setScheme("complementary");
    setColors([]);
    setCopied(null);
  }, []);

  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "x",
        ctrl: true,
        shift: true,
        action: handleClear,
        description: "Clear all",
      },
    ],
  });

  return (
    <ToolLayout
      title="Color Scheme Designer"
      description="Generate harmonious color schemes based on color theory principles"
    >
      <div className="space-y-3">
        {/* Action Toolbar */}
        <ActionToolbar
          right={
            <>
              <Button onClick={generateScheme} size="sm" className="gap-2">
                <RefreshCw className="h-3 w-3" aria-hidden="true" />
                Generate Scheme
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                size="sm"
                disabled={isEmpty}
                aria-label="Clear all"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </>
          }
        />

        {/* Side-by-side layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  aria-label="Color picker"
                />
              </div>
            </div>

            {/* Scheme Type Selection */}
            <div className="p-3 bg-card border rounded-lg space-y-3">
              <Label className="text-sm font-medium">Color Scheme Type</Label>
              <Tabs value={scheme} onValueChange={(v) => setScheme(v as SchemeType)}>
                <TabsList className="grid w-full grid-cols-3 h-auto">
                  <TabsTrigger value="complementary" className="text-xs py-2">Complementary</TabsTrigger>
                  <TabsTrigger value="analogous" className="text-xs py-2">Analogous</TabsTrigger>
                  <TabsTrigger value="triadic" className="text-xs py-2">Triadic</TabsTrigger>
                </TabsList>
              </Tabs>
              <Tabs value={scheme} onValueChange={(v) => setScheme(v as SchemeType)}>
                <TabsList className="grid w-full grid-cols-3 h-auto">
                  <TabsTrigger value="tetradic" className="text-xs py-2">Tetradic</TabsTrigger>
                  <TabsTrigger value="split-complementary" className="text-xs py-2">Split-Comp</TabsTrigger>
                  <TabsTrigger value="monochromatic" className="text-xs py-2">Monochrome</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Colors:</span>
                <Badge variant="secondary" className="text-xs">{getSchemeColorCount(scheme)}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {getSchemeDescription(scheme)}
              </p>
            </div>

            {/* Color Preview */}
            {colors.length > 0 && (
              <div className="p-3 bg-card border rounded-lg space-y-3">
                <Label className="text-sm font-medium">Color Swatches</Label>
                <div className="grid grid-cols-3 gap-2">
                  {colors.map((color, i) => (
                    <button
                      key={i}
                      type="button"
                      className="group relative cursor-pointer text-left"
                      onClick={() => copyToClipboard(color, i)}
                      aria-label={`Copy color ${color}`}
                    >
                      <div
                        className="aspect-square rounded-lg border-2 hover:scale-105 transition-all shadow-md hover:shadow-lg"
                        style={{ backgroundColor: color }}
                      >
                        {i === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Badge className="text-xs">Base</Badge>
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-center mt-1 truncate">
                        {color}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Combined Preview Bar */}
                <div className="h-16 rounded-lg overflow-hidden border-2 flex" role="group" aria-label="Color scheme preview">
                  {colors.map((color, i) => (
                    <button
                      key={i}
                      type="button"
                      className="flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: color }}
                      onClick={() => copyToClipboard(color, i)}
                      aria-label={`Copy color ${color}`}
                    >
                      <span className="sr-only">{color}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Output Section */}
          <div className="space-y-3">
            {colors.length > 0 ? (
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

                  <div className="space-y-2">
                    {colors.map((color, i) => (
                      <div
                        key={i}
                        className="space-y-1"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-10 h-10 rounded border-2 flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {i === 0 ? "Base Color" : `Color ${i + 1}`}
                              </span>
                              {i === 0 && <Badge variant="secondary" className="text-[10px] h-4">Base</Badge>}
                            </div>
                            <div className="text-xs font-mono">{color.toUpperCase()}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(color, i)}
                            className="h-7 w-7 p-0"
                            aria-label={`Copy ${color}`}
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
                  <Label className="text-sm font-medium">Format Examples (Base Color)</Label>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">HEX</Label>
                      <CopyInput
                        value={colors[0]}
                        readOnly
                        className="font-mono text-xs h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">CSS Variable</Label>
                      <CopyInput
                        value={`var(--base)`}
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
                  <p className="text-sm">Click &quot;Generate Scheme&quot; to create colors</p>
                  <p className="text-xs mt-2">Choose a scheme type and base color</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
