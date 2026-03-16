
import { Settings2, Sun, Moon, Monitor, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useAppearance,
  type ThemeMode,
  type AccentColor,
  type FontFamily,
  type RadiusSize,
} from "@/hooks/use-appearance";
import { cn } from "@/lib/utils";

const ACCENT_COLORS: { value: AccentColor; label: string; color: string }[] = [
  { value: "blue", label: "Blue", color: "bg-blue-500" },
  { value: "green", label: "Green", color: "bg-green-500" },
  { value: "purple", label: "Purple", color: "bg-purple-500" },
  { value: "red", label: "Red", color: "bg-red-500" },
  { value: "orange", label: "Orange", color: "bg-orange-500" },
  { value: "pink", label: "Pink", color: "bg-pink-500" },
  { value: "yellow", label: "Yellow", color: "bg-yellow-500" },
  { value: "teal", label: "Teal", color: "bg-teal-500" },
];

const MODE_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const FONT_OPTIONS: { value: FontFamily; label: string; sample: string }[] = [
  { value: "jetbrains-mono", label: "JetBrains Mono", sample: "font-mono" },
  { value: "fira-code", label: "Fira Code", sample: "font-mono" },
  { value: "source-code-pro", label: "Source Code Pro", sample: "font-mono" },
  { value: "ibm-plex-mono", label: "IBM Plex Mono", sample: "font-mono" },
  { value: "space-mono", label: "Space Mono", sample: "font-mono" },
  { value: "dyslexic", label: "OpenDyslexic", sample: "font-sans" },
];

const RADIUS_OPTIONS: { value: RadiusSize; label: string }[] = [
  { value: "0", label: "None" },
  { value: "0.25", label: "S" },
  { value: "0.5", label: "M" },
  { value: "0.75", label: "L" },
  { value: "1", label: "XL" },
];

export function AppearancePanel() {
  const { settings, update, reset, mounted } = useAppearance();

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled aria-label="Appearance settings">
        <Settings2 className="h-[1.2rem] w-[1.2rem]" aria-hidden="true" />
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Appearance settings"
        >
          <Settings2 className="h-[1.2rem] w-[1.2rem]" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Appearance</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="h-7 text-xs gap-1.5 text-muted-foreground"
              aria-label="Reset appearance to defaults"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              Reset
            </Button>
          </div>

          {/* Mode */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Mode</label>
            <div className="grid grid-cols-3 gap-1.5">
              {MODE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update({ mode: opt.value })}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                      settings.mode === opt.value
                        ? "bg-foreground text-background"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                    aria-pressed={settings.mode === opt.value}
                    aria-label={`${opt.label} mode`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent Color */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Accent Color</label>
            <div className="flex flex-wrap gap-2">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => update({ accent: c.value })}
                  className={cn(
                    "h-7 w-7 rounded-full transition-all",
                    c.color,
                    settings.accent === c.value
                      ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                      : "hover:scale-110"
                  )}
                  aria-label={`${c.label} accent color`}
                  aria-pressed={settings.accent === c.value}
                />
              ))}
            </div>
          </div>

          {/* Font */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Font</label>
            <div className="grid grid-cols-3 gap-1.5">
              {FONT_OPTIONS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => update({ font: f.value })}
                  className={cn(
                    "rounded-lg px-2 py-2 text-[10px] font-medium transition-colors leading-tight",
                    f.sample,
                    settings.font === f.value
                      ? "bg-foreground text-background"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                  aria-pressed={settings.font === f.value}
                  aria-label={`${f.label} font${f.value === "dyslexic" ? " (dyslexia-friendly)" : ""}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Border Radius */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Roundness</label>
            <div className="flex gap-1.5">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => update({ radius: r.value })}
                  className={cn(
                    "flex-1 py-2 text-xs font-medium transition-colors",
                    settings.radius === r.value
                      ? "bg-foreground text-background"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                  style={{ borderRadius: `${r.value}rem` }}
                  aria-pressed={settings.radius === r.value}
                  aria-label={`${r.label} border radius`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Preview</label>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">Primary</Button>
              <Button size="sm" variant="secondary" className="flex-1">Secondary</Button>
              <Button size="sm" variant="outline" className="flex-1">Outline</Button>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            Saved locally in your browser
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
