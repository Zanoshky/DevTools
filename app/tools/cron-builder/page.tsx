
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check, Clock, Calendar, Sparkles, Info, Zap, Timer, Sun, Sunset, Briefcase, Umbrella, CalendarDays, CalendarRange, PartyPopper, Trash2 } from "lucide-react";
import { CronExpressionParser } from "cron-parser";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ActionToolbar } from "@/components/action-toolbar";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

const PRESETS = [
  { name: "Every minute", cron: "* * * * *", icon: <Zap className="h-4 w-4" /> },
  { name: "Every 5 min", cron: "*/5 * * * *", icon: <Timer className="h-4 w-4" /> },
  { name: "Every 15 min", cron: "*/15 * * * *", icon: <Timer className="h-4 w-4" /> },
  { name: "Every hour", cron: "0 * * * *", icon: <Clock className="h-4 w-4" /> },
  { name: "Every 2 hours", cron: "0 */2 * * *", icon: <Clock className="h-4 w-4" /> },
  { name: "Every 6 hours", cron: "0 */6 * * *", icon: <Clock className="h-4 w-4" /> },
  { name: "Daily 9 AM", cron: "0 9 * * *", icon: <Sun className="h-4 w-4" /> },
  { name: "Daily noon", cron: "0 12 * * *", icon: <Sun className="h-4 w-4" /> },
  { name: "Daily 6 PM", cron: "0 18 * * *", icon: <Sunset className="h-4 w-4" /> },
  { name: "Weekdays 9 AM", cron: "0 9 * * 1-5", icon: <Briefcase className="h-4 w-4" /> },
  { name: "Weekends 10 AM", cron: "0 10 * * 0,6", icon: <Umbrella className="h-4 w-4" /> },
  { name: "Weekly Mon", cron: "0 9 * * 1", icon: <CalendarDays className="h-4 w-4" /> },
  { name: "Monthly 1st", cron: "0 0 1 * *", icon: <CalendarRange className="h-4 w-4" /> },
  { name: "Yearly Jan 1", cron: "0 0 1 1 *", icon: <PartyPopper className="h-4 w-4" /> },
];

const MINUTE_OPTIONS = [
  { value: "*", label: "Every minute" },
  { value: "0", label: "At :00" },
  { value: "*/5", label: "Every 5 minutes" },
  { value: "*/10", label: "Every 10 minutes" },
  { value: "*/15", label: "Every 15 minutes" },
  { value: "*/30", label: "Every 30 minutes" },
  { value: "custom", label: "Custom..." },
];

const HOUR_OPTIONS = [
  { value: "*", label: "Every hour" },
  { value: "0", label: "Midnight (00:00)" },
  { value: "6", label: "6 AM" },
  { value: "9", label: "9 AM" },
  { value: "12", label: "Noon (12:00)" },
  { value: "18", label: "6 PM" },
  { value: "*/2", label: "Every 2 hours" },
  { value: "*/6", label: "Every 6 hours" },
  { value: "custom", label: "Custom..." },
];

const DAY_OPTIONS = [
  { value: "*", label: "Every day" },
  { value: "1", label: "1st of month" },
  { value: "15", label: "15th of month" },
  { value: "*/7", label: "Every 7 days" },
  { value: "custom", label: "Custom..." },
];

const MONTH_OPTIONS = [
  { value: "*", label: "Every month" },
  { value: "1", label: "January" },
  { value: "4", label: "April" },
  { value: "7", label: "July" },
  { value: "10", label: "October" },
  { value: "1,4,7,10", label: "Quarterly" },
  { value: "custom", label: "Custom..." },
];

const DOW_OPTIONS = [
  { value: "*", label: "Every day" },
  { value: "1-5", label: "Weekdays (Mon-Fri)" },
  { value: "0,6", label: "Weekends (Sat-Sun)" },
  { value: "1", label: "Monday" },
  { value: "5", label: "Friday" },
  { value: "0", label: "Sunday" },
  { value: "custom", label: "Custom..." },
];

function getNextExecutions(cron: string, count = 5): string[] {
  try {
    const interval = CronExpressionParser.parse(cron);
    const executions: string[] = [];
    interval.take(count).forEach((date) => {
      const iso = date?.toJSON();
      if (iso) {
        const d = new Date(iso);
        executions.push(d.toLocaleString());
      }
    });
    return executions;
  } catch {
    return [];
  }
}

function generateHumanReadable(cron: string): string {
  const parts = cron.split(" ");
  if (parts.length !== 5) return "Invalid cron expression";

  const [min, hr, dom, mon, dow] = parts;
  let desc = "Runs ";

  // Minute
  if (min === "*") desc += "every minute";
  else if (min.includes("/")) desc += `every ${min.split("/")[1]} minutes`;
  else if (min.includes(",")) desc += `at minutes ${min}`;
  else desc += `at minute ${min}`;

  // Hour
  if (hr !== "*") {
    if (hr.includes("/")) desc += ` of every ${hr.split("/")[1]} hours`;
    else if (hr.includes(",")) desc += ` at hours ${hr}`;
    else desc += ` at ${hr}:00`;
  }

  // Day of month
  if (dom !== "*") {
    if (dom.includes("/")) desc += ` every ${dom.split("/")[1]} days`;
    else if (dom.includes(",")) desc += ` on days ${dom}`;
    else desc += ` on day ${dom}`;
  }

  // Month
  if (mon !== "*") {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (mon.includes(",")) {
      const monthNames = mon.split(",").map((m) => months[parseInt(m) - 1]).join(", ");
      desc += ` in ${monthNames}`;
    } else desc += ` in ${months[parseInt(mon) - 1]}`;
  }

  // Day of week
  if (dow !== "*") {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    if (dow === "1-5") desc += " on weekdays";
    else if (dow === "0,6") desc += " on weekends";
    else if (dow.includes(",")) {
      const dayNames = dow.split(",").map((d) => days[parseInt(d)]).join(", ");
      desc += ` on ${dayNames}`;
    } else if (dow.includes("-")) {
      const [start, end] = dow.split("-");
      desc += ` from ${days[parseInt(start)]} to ${days[parseInt(end)]}`;
    } else desc += ` on ${days[parseInt(dow)]}`;
  }

  return desc;
}

export default function CronBuilderPage() {
  const [mode, setMode] = useState<"builder" | "custom">("builder");
  const [minute, setMinute] = useState("0");
  const [hour, setHour] = useState("9");
  const [dayOfMonth, setDayOfMonth] = useState("*");
  const [month, setMonth] = useState("*");
  const [dayOfWeek, setDayOfWeek] = useState("1-5");
  
  const [customMinute, setCustomMinute] = useState("");
  const [customHour, setCustomHour] = useState("");
  const [customDay, setCustomDay] = useState("");
  const [customMonth, setCustomMonth] = useState("");
  const [customDow, setCustomDow] = useState("");
  
  const [cronExpression, setCronExpression] = useState("");
  const [customCron, setCustomCron] = useState("");
  const [copied, setCopied] = useState(false);
  const [nextExecutions, setNextExecutions] = useState<string[]>([]);

  const buildCronExpression = () => {
    const m = minute === "custom" ? customMinute : minute;
    const h = hour === "custom" ? customHour : hour;
    const d = dayOfMonth === "custom" ? customDay : dayOfMonth;
    const mo = month === "custom" ? customMonth : month;
    const dw = dayOfWeek === "custom" ? customDow : dayOfWeek;
    return `${m} ${h} ${d} ${mo} ${dw}`;
  };

  useEffect(() => {
    const cron = mode === "builder" ? buildCronExpression() : customCron;
    setCronExpression(cron);
    setNextExecutions(getNextExecutions(cron, 5));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minute, hour, dayOfMonth, month, dayOfWeek, customMinute, customHour, customDay, customMonth, customDow, mode, customCron]);

  const loadPreset = (preset: string) => {
    const parts = preset.split(" ");
    if (parts.length === 5) {
      setMinute(parts[0]);
      setHour(parts[1]);
      setDayOfMonth(parts[2]);
      setMonth(parts[3]);
      setDayOfWeek(parts[4]);
      setMode("builder");
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(cronExpression);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard write failed
    }
  };

  const DEFAULT_MINUTE = "0";
  const DEFAULT_HOUR = "9";
  const DEFAULT_DAY_OF_MONTH = "*";
  const DEFAULT_MONTH = "*";
  const DEFAULT_DAY_OF_WEEK = "1-5";

  const isEmpty =
    minute === DEFAULT_MINUTE &&
    hour === DEFAULT_HOUR &&
    dayOfMonth === DEFAULT_DAY_OF_MONTH &&
    month === DEFAULT_MONTH &&
    dayOfWeek === DEFAULT_DAY_OF_WEEK &&
    customCron === "" &&
    customMinute === "" &&
    customHour === "" &&
    customDay === "" &&
    customMonth === "" &&
    customDow === "";

  const handleClear = useCallback(() => {
    setMode("builder");
    setMinute(DEFAULT_MINUTE);
    setHour(DEFAULT_HOUR);
    setDayOfMonth(DEFAULT_DAY_OF_MONTH);
    setMonth(DEFAULT_MONTH);
    setDayOfWeek(DEFAULT_DAY_OF_WEEK);
    setCustomMinute("");
    setCustomHour("");
    setCustomDay("");
    setCustomMonth("");
    setCustomDow("");
    setCustomCron("");
  }, []);

  useKeyboardShortcuts({
    shortcuts: [
      { key: "x", ctrl: true, shift: true, action: handleClear, description: "Clear all" },
    ],
  });

  const humanReadable = generateHumanReadable(cronExpression);
  const isValid = nextExecutions.length > 0;

  return (
    <ToolLayout
      title="Cron Expression Builder"
      description="Build and test cron expressions with visual builder, presets, and live preview"
    >
      <div className="space-y-3">
        <ActionToolbar
          right={
            <Button
              onClick={handleClear}
              variant="outline"
              size="sm"
              disabled={isEmpty}
              aria-label="Clear all"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          }
        />

        {/* Mode Selector */}
        <div className="p-3 bg-card border rounded-lg">
          <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="builder" className="text-xs">
                <Sparkles className="h-3 w-3 mr-2" />
                Visual Builder
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-xs">
                <Clock className="h-3 w-3 mr-2" />
                Custom Expression
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Quick Presets */}
        <div className="p-3 bg-card border rounded-lg space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            Quick Presets
          </Label>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {PRESETS.map((preset, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => loadPreset(preset.cron)}
                className="flex flex-col h-auto py-2 px-2"
              >
                <span className="mb-0.5">{preset.icon}</span>
                <span className="text-[10px] leading-tight">{preset.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Side-by-side layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Left: Builder/Input */}
          <div className="space-y-3">
            {/* Builder Mode */}
            {mode === "builder" && (
              <div className="p-3 bg-card border rounded-lg space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Configure Schedule
                </Label>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Minute (0-59)</Label>
                    <Select value={minute} onValueChange={setMinute}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MINUTE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {minute === "custom" && (
                      <Input
                        value={customMinute}
                        onChange={(e) => setCustomMinute(e.target.value)}
                        placeholder="e.g., 0, */5, 0,15,30"
                        className="font-mono text-xs h-8"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Hour (0-23)</Label>
                    <Select value={hour} onValueChange={setHour}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOUR_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {hour === "custom" && (
                      <Input
                        value={customHour}
                        onChange={(e) => setCustomHour(e.target.value)}
                        placeholder="e.g., 9, */2, 9,17"
                        className="font-mono text-xs h-8"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Day of Month (1-31)</Label>
                    <Select value={dayOfMonth} onValueChange={setDayOfMonth}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {dayOfMonth === "custom" && (
                      <Input
                        value={customDay}
                        onChange={(e) => setCustomDay(e.target.value)}
                        placeholder="e.g., 1, 15, 1-7"
                        className="font-mono text-xs h-8"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Month (1-12)</Label>
                    <Select value={month} onValueChange={setMonth}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTH_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {month === "custom" && (
                      <Input
                        value={customMonth}
                        onChange={(e) => setCustomMonth(e.target.value)}
                        placeholder="e.g., 1, 1,4,7,10"
                        className="font-mono text-xs h-8"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Day of Week (0-6, 0=Sun)</Label>
                    <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOW_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {dayOfWeek === "custom" && (
                      <Input
                        value={customDow}
                        onChange={(e) => setCustomDow(e.target.value)}
                        placeholder="e.g., 1, 1-5, 0,6"
                        className="font-mono text-xs h-8"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Custom Mode */}
            {mode === "custom" && (
              <div className="p-3 bg-card border rounded-lg space-y-3">
                <Label className="text-sm font-medium">Enter Cron Expression</Label>
                <Input
                  value={customCron}
                  onChange={(e) => setCustomCron(e.target.value)}
                  placeholder="0 9 * * 1-5"
                  className="font-mono text-sm h-10"
                />
                <Alert>
                  <Info className="h-3 w-3" />
                  <AlertDescription className="text-xs">
                    Format: minute hour day month day-of-week
                    <br />
                    Use * for any, */n for intervals, ranges (1-5), or lists (1,3,5)
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Syntax Reference */}
            <div className="p-3 bg-card border rounded-lg space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Info className="h-3 w-3" />
                Cron Syntax Reference
              </Label>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1.5">
                  <div className="font-medium text-xs">Special Characters</div>
                  <div className="space-y-1 text-muted-foreground">
                    <div><code className="bg-muted px-1 rounded text-[10px]">*</code> Any value</div>
                    <div><code className="bg-muted px-1 rounded text-[10px]">,</code> List (1,3,5)</div>
                    <div><code className="bg-muted px-1 rounded text-[10px]">-</code> Range (1-5)</div>
                    <div><code className="bg-muted px-1 rounded text-[10px]">/</code> Step (*/15)</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="font-medium text-xs">Examples</div>
                  <div className="space-y-1 text-muted-foreground">
                    <div><code className="bg-muted px-1 rounded text-[10px]">*/15</code> Every 15</div>
                    <div><code className="bg-muted px-1 rounded text-[10px]">1-5</code> Range 1-5</div>
                    <div><code className="bg-muted px-1 rounded text-[10px]">1,3,5</code> On 1,3,5</div>
                    <div><code className="bg-muted px-1 rounded text-[10px]">0</code> Only on 0</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Output & Preview */}
          <div className="space-y-3">
            {/* Generated Expression */}
            <div className="p-3 bg-card border rounded-lg space-y-3">
              <Label className="text-sm font-medium">Generated Expression</Label>
              <div className="flex gap-2">
                <Input
                  value={cronExpression}
                  readOnly
                  className="font-mono text-sm font-bold h-10"
                />
                <Button onClick={copyToClipboard} variant="outline" size="sm" className="h-10 w-10 p-0">
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              
              {isValid && (
                <div className="p-2 bg-muted/50 rounded text-xs">
                  {humanReadable}
                </div>
              )}
              
              {!isValid && cronExpression && (
                <Alert variant="destructive">
                  <AlertDescription className="text-xs">Invalid cron expression</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Field Breakdown */}
            {isValid && (
              <div className="p-3 bg-card border rounded-lg space-y-2">
                <Label className="text-sm font-medium">Expression Breakdown</Label>
                <div className="grid grid-cols-5 gap-2">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-center">
                    <div className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 mb-1">
                      Minute
                    </div>
                  </div>
                  <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded text-center">
                    <div className="text-[10px] font-semibold text-green-700 dark:text-green-300 mb-1">
                      Hour
                    </div>
                  </div>
                  <div className="p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded text-center">
                    <div className="text-[10px] font-semibold text-yellow-700 dark:text-yellow-300 mb-1">
                      Day
                    </div>
                  </div>
                  <div className="p-2 bg-purple-50 dark:bg-purple-950/20 rounded text-center">
                    <div className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 mb-1">
                      Month
                    </div>
                  </div>
                  <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded text-center">
                    <div className="text-[10px] font-semibold text-red-700 dark:text-red-300 mb-1">
                      DOW
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Next Executions */}
            {isValid && nextExecutions.length > 0 && (
              <div className="p-3 bg-card border rounded-lg space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Next 5 Executions
                </Label>
                <div className="space-y-1.5">
                  {nextExecutions.map((execution, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-muted/30 rounded text-xs"
                    >
                      <Badge variant="outline" className="shrink-0 text-[10px] h-5">
                        {index + 1}
                      </Badge>
                      <span>{execution}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
