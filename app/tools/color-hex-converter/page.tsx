"use client";

import { useState, useEffect } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { CopyInput } from "@/components/copy-input";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ColorHexConverterPage() {
  const [hex, setHex] = useState("#3b82f6");
  const [rgb, setRgb] = useState({ r: 59, g: 130, b: 246 });
  const [hsl, setHsl] = useState({ h: 217, s: 91, l: 60 });
  const [inputMode, setInputMode] = useState<"hex" | "rgb" | "hsl">("hex");

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return `#${[r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('')}`;
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
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

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  const hslToRgb = (h: number, s: number, l: number) => {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return {
      r: Math.round(255 * f(0)),
      g: Math.round(255 * f(8)),
      b: Math.round(255 * f(4))
    };
  };

  const updateFromHex = (newHex: string) => {
    // Allow partial input but only update colors when valid
    setHex(newHex);
    
    if (/^#[0-9A-F]{6}$/i.test(newHex)) {
      const rgbResult = hexToRgb(newHex);
      if (rgbResult) {
        setRgb(rgbResult);
        setHsl(rgbToHsl(rgbResult.r, rgbResult.g, rgbResult.b));
      }
    } else if (/^#[0-9A-F]{3}$/i.test(newHex)) {
      // Handle 3-char hex (#f00 -> #ff0000)
      const expanded = `#${newHex[1]}${newHex[1]}${newHex[2]}${newHex[2]}${newHex[3]}${newHex[3]}`;
      const rgbResult = hexToRgb(expanded);
      if (rgbResult) {
        setRgb(rgbResult);
        setHsl(rgbToHsl(rgbResult.r, rgbResult.g, rgbResult.b));
      }
    }
  };

  const updateFromRgb = (r: number, g: number, b: number) => {
    setRgb({ r, g, b });
    setHex(rgbToHex(r, g, b));
    setHsl(rgbToHsl(r, g, b));
  };

  const updateFromHsl = (h: number, s: number, l: number) => {
    setHsl({ h, s, l });
    const rgbResult = hslToRgb(h, s, l);
    setRgb(rgbResult);
    setHex(rgbToHex(rgbResult.r, rgbResult.g, rgbResult.b));
  };

  const getColorName = () => {
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    if (luminance > 0.9) return "Very Light";
    if (luminance > 0.7) return "Light";
    if (luminance > 0.4) return "Medium";
    if (luminance > 0.2) return "Dark";
    return "Very Dark";
  };

  useEffect(() => {
    updateFromHex(hex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ToolLayout
      title="Color Converter"
      description="Convert between HEX, RGB, and HSL color formats with live preview"
    >
      <div className="space-y-3">
        {/* Input Mode Selector */}
        <div className="p-3 bg-card border rounded-lg">
          <Label className="text-sm mb-2 block">Input Mode</Label>
          <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as typeof inputMode)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="hex" className="text-xs">HEX</TabsTrigger>
              <TabsTrigger value="rgb" className="text-xs">RGB</TabsTrigger>
              <TabsTrigger value="hsl" className="text-xs">HSL</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Side-by-side layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Input Section */}
          <div className="space-y-3">
            {/* Color Input */}
            <div className="p-3 bg-card border rounded-lg space-y-3">
              <Label className="text-sm font-medium">Color Input</Label>

              {/* HEX Input */}
              {inputMode === "hex" && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">HEX Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={hex}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.startsWith('#') && value.length <= 7) {
                          updateFromHex(value);
                        }
                      }}
                      placeholder="#3b82f6"
                      maxLength={7}
                      className="font-mono text-sm h-10"
                    />
                    <Input
                      type="color"
                      value={hex}
                      onChange={(e) => updateFromHex(e.target.value)}
                      className="w-20 h-10 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* RGB Input */}
              {inputMode === "rgb" && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">RGB Values</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">R</Label>
                      <Input
                        type="number"
                        min="0"
                        max="255"
                        value={rgb.r}
                        onChange={(e) => updateFromRgb(parseInt(e.target.value) || 0, rgb.g, rgb.b)}
                        className="font-mono text-sm h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">G</Label>
                      <Input
                        type="number"
                        min="0"
                        max="255"
                        value={rgb.g}
                        onChange={(e) => updateFromRgb(rgb.r, parseInt(e.target.value) || 0, rgb.b)}
                        className="font-mono text-sm h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">B</Label>
                      <Input
                        type="number"
                        min="0"
                        max="255"
                        value={rgb.b}
                        onChange={(e) => updateFromRgb(rgb.r, rgb.g, parseInt(e.target.value) || 0)}
                        className="font-mono text-sm h-9"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* HSL Input */}
              {inputMode === "hsl" && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">HSL Values</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">H (0-360)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="360"
                        value={hsl.h}
                        onChange={(e) => updateFromHsl(parseInt(e.target.value) || 0, hsl.s, hsl.l)}
                        className="font-mono text-sm h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">S (0-100)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={hsl.s}
                        onChange={(e) => updateFromHsl(hsl.h, parseInt(e.target.value) || 0, hsl.l)}
                        className="font-mono text-sm h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">L (0-100)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={hsl.l}
                        onChange={(e) => updateFromHsl(hsl.h, hsl.s, parseInt(e.target.value) || 0)}
                        className="font-mono text-sm h-9"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Color Preview */}
            <div className="p-3 bg-card border rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">Color Preview</Label>
              </div>
              <div
                className="w-full h-48 rounded-lg border-2 shadow-lg transition-colors duration-200"
                style={{ backgroundColor: hex }}
              />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Brightness:</span>
                  <Badge variant="secondary" className="text-xs">{getColorName()}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Hex:</span>
                  <span className="font-mono font-semibold">{hex.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="space-y-3">
            <div className="p-3 bg-card border rounded-lg space-y-3 min-h-[520px]">
              <Label className="text-sm font-medium">All Formats</Label>
              
              <div className="space-y-3">
                {/* HEX Formats */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">HEX</Label>
                  <CopyInput
                    value={hex.toUpperCase()}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <CopyInput
                    value={hex.toLowerCase()}
                    readOnly
                    className="font-mono text-sm"
                  />
                </div>

                {/* RGB Formats */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">RGB</Label>
                  <CopyInput
                    value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <CopyInput
                    value={`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <CopyInput
                    value={`${rgb.r}, ${rgb.g}, ${rgb.b}`}
                    readOnly
                    className="font-mono text-sm"
                  />
                </div>

                {/* HSL Formats */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">HSL</Label>
                  <CopyInput
                    value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <CopyInput
                    value={`hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 1)`}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <CopyInput
                    value={`${hsl.h}°, ${hsl.s}%, ${hsl.l}%`}
                    readOnly
                    className="font-mono text-sm"
                  />
                </div>

                {/* CSS Variables */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">CSS Variable</Label>
                  <CopyInput
                    value={`--color-primary: ${hex};`}
                    readOnly
                    className="font-mono text-sm"
                  />
                </div>

                {/* Tailwind */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Tailwind Config</Label>
                  <CopyInput
                    value={`'primary': '${hex}',`}
                    readOnly
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
