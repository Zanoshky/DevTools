import { Link, useLocation } from "react-router-dom";
import {
  Braces,
  GitCompare,
  KeyRound,
  Binary,
  Fingerprint,
  Clock4,
  Regex,
  FileJson2,
  Link2,
  ShieldCheck,
  Lock,
  CalendarClock,
  Activity,
  Pipette,
  Palette,
  Paintbrush,
  Dices,
  Scale,
  FileCheck2,
  CaseSensitive,
  Code2,
  Sparkles,
  BarChart3,
  Database,
  ArrowLeftRight,
  FileCode2,
  FileX2,
  Table2,
  Timer,
  Hash,
  Shuffle,
  Globe,
  Key,
  List,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToolTracking } from "@/hooks/use-tool-tracking";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QuickTool {
  name: string;
  href: string;
  icon: LucideIcon;
}

const allQuickTools: QuickTool[] = [
  { name: "JSON Editor", href: "/tools/json-editor", icon: Braces },
  { name: "Data Compare", href: "/tools/json-compare", icon: GitCompare },
  { name: "JWT Decode", href: "/tools/jwt", icon: KeyRound },
  { name: "Base64", href: "/tools/base64", icon: Binary },
  { name: "UUID", href: "/tools/uuid", icon: Fingerprint },
  { name: "Timestamp", href: "/tools/timestamp-converter", icon: Clock4 },
  { name: "Regex", href: "/tools/regex-validator", icon: Regex },
  { name: "Data Converter", href: "/tools/data-converter", icon: Shuffle },
  { name: "URL Encoder", href: "/tools/url-encoder", icon: Link2 },
  { name: "Hash", href: "/tools/hash", icon: Hash },
  { name: "Password", href: "/tools/password-generator", icon: Lock },
  { name: "OTP", href: "/tools/otp-generator", icon: ShieldCheck },
  { name: "Cron", href: "/tools/cron-builder", icon: CalendarClock },
  { name: "HAR", href: "/tools/har-analyzer", icon: Activity },
  { name: "Hex/RGB/HSL", href: "/tools/color-hex-converter", icon: Pipette },
  { name: "Palette", href: "/tools/color-palette-generator", icon: Palette },
  { name: "Scheme", href: "/tools/color-scheme-designer", icon: Paintbrush },
  { name: "Random Data", href: "/tools/random-data-generator", icon: Dices },
  { name: "Payload", href: "/tools/payload-calculator", icon: Scale },
  { name: "Data Validator", href: "/tools/validator-json", icon: FileCheck2 },
  { name: "Casing", href: "/tools/casing-converter", icon: CaseSensitive },
  { name: "JSON to Code", href: "/tools/json-to-code", icon: Code2 },
  { name: "JSON to OpenAPI", href: "/tools/json-to-openapi", icon: FileCode2 },
  { name: "Data Viz", href: "/tools/data-visualizer", icon: BarChart3 },
  { name: "Mongo OID", href: "/tools/timestamp-mongo", icon: Database },
  { name: "cURL / Hurl", href: "/tools/curl-hurl-converter", icon: ArrowLeftRight },

  { name: "Timer", href: "/tools/timer", icon: Timer },
  { name: "Key Generator", href: "/tools/key-generator", icon: Key },
  { name: "Text Sorter", href: "/tools/text-sorter", icon: List },
];

export function QuickAccessBar() {
  const { pathname } = useLocation();
  const { getFavorites, getRecentlyUsed } = useToolTracking();

  const favorites = getFavorites();
  const recent = getRecentlyUsed(10);

  const seen = new Set<string>();
  const ordered: QuickTool[] = [];

  // Favorites first
  for (const fav of favorites) {
    const tool = allQuickTools.find(t => t.href === fav.id);
    if (tool && !seen.has(tool.href)) {
      seen.add(tool.href);
      ordered.push(tool);
    }
  }

  // Recently used next
  for (const r of recent) {
    const tool = allQuickTools.find(t => t.href === r.id);
    if (tool && !seen.has(tool.href)) {
      seen.add(tool.href);
      ordered.push(tool);
    }
  }

  // Fill with defaults
  for (const tool of allQuickTools) {
    if (!seen.has(tool.href)) {
      seen.add(tool.href);
      ordered.push(tool);
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-0.5 px-2 py-1 overflow-x-auto scrollbar-none">
          {ordered.map((tool) => {
            const Icon = tool.icon;
            const isActive = pathname === tool.href;
            const isFav = favorites.some(f => f.id === tool.href);

            return (
              <Tooltip key={tool.href}>
                <TooltipTrigger asChild>
                  <Link
                    to={tool.href}
                    className={cn(
                      "relative flex items-center justify-center h-8 w-8 shrink-0 rounded-md transition-colors",
                      isActive
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                    aria-label={tool.name}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {isFav && (
                      <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {tool.name}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
