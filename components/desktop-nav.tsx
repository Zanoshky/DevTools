"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Code2,
  BarChart3,
  FileCheck,
  Key,
  Hash,
  Calculator,
  GitCompare,
  CaseSensitive,
  Database,
  CalendarClock,
  Shuffle,
  FileText,
  Ticket,
  Timer,
  Regex,
  Palette,
  Brush,
  Home,
  Zap,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const navGroups = [
  {
    label: "Main",
    items: [
      { name: "All Tools", href: "/", icon: Home },
      { name: "Privacy", href: "/privacy", icon: Zap },
    ],
  },
  {
    label: "Editors",
    items: [{ name: "JSON Editor", href: "/tools/json-editor", icon: Code2 }],
  },
  {
    label: "Converters",
    items: [
      { name: "JSON / CSV", href: "/tools/json-csv-converter", icon: FileText },
      { name: "JSON / XML", href: "/tools/json-xml-converter", icon: Shuffle },
      { name: "JSON / YAML", href: "/tools/json-yaml-converter", icon: Shuffle },
      { name: "Base64", href: "/tools/base64", icon: Hash },
      { name: "URL Encoder", href: "/tools/url-encoder", icon: CaseSensitive },
      { name: "Time / Epoch", href: "/tools/timestamp-converter", icon: Timer },
      { name: "Time / Mongo OID", href: "/tools/timestamp-mongo", icon: Database },
      { name: "cURL / Hurl", href: "/tools/curl-hurl-converter", icon: Shuffle },
      { name: "JSON Casing", href: "/tools/casing-converter", icon: CaseSensitive },
      { name: "JSON to Code", href: "/tools/json-to-code", icon: Shuffle },
      { name: "JSON to OpenAPI", href: "/tools/json-to-openapi", icon: FileText },
    ],
  },
  {
    label: "Validators",
    items: [
      { name: "JSON", href: "/tools/validator-json", icon: FileCheck },
      { name: "YAML", href: "/tools/validator-yaml", icon: FileCheck },
      { name: "XML", href: "/tools/validator-xml", icon: FileCheck },
      { name: "CSV", href: "/tools/validator-csv", icon: FileCheck },
      { name: "Regex", href: "/tools/regex-validator", icon: Regex },
    ],
  },
  {
    label: "Generators",
    items: [
      { name: "UUID Generator", href: "/tools/uuid", icon: Ticket },
      { name: "Password Generator", href: "/tools/password-generator", icon: Key },
      { name: "OTP Authenticator", href: "/tools/otp-generator", icon: Shield },
      { name: "Random Data", href: "/tools/random-data-generator", icon: Shuffle },
    ],
  },
  {
    label: "Analyzers",
    items: [
      { name: "HAR Analyzer", href: "/tools/har-analyzer", icon: BarChart3 },
      { name: "JSON Compare", href: "/tools/json-compare", icon: GitCompare },
      { name: "Data Visualizer", href: "/tools/data-visualizer", icon: BarChart3 },
    ],
  },
  {
    label: "Crypto",
    items: [
      { name: "JWT Decode", href: "/tools/jwt", icon: Key },
      { name: "Hash Generator", href: "/tools/hash", icon: Hash },
    ],
  },
  {
    label: "Color",
    items: [
      { name: "Hex / RGB / HSL", href: "/tools/color-hex-converter", icon: Zap },
      { name: "Palette Generator", href: "/tools/color-palette-generator", icon: Palette },
      { name: "Scheme Designer", href: "/tools/color-scheme-designer", icon: Brush },
    ],
  },
  {
    label: "Misc",
    items: [
      { name: "Timer", href: "/tools/timer", icon: Timer },
      { name: "Cron Builder", href: "/tools/cron-builder", icon: CalendarClock },
      { name: "Payload Calc", href: "/tools/payload-calculator", icon: Calculator },
    ],
  },
];

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r bg-background">
      <ScrollArea className="flex-1 py-4">
        <nav aria-label="Desktop navigation" className="flex flex-col gap-6 px-3">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] font-medium transition-colors",
                          isActive
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                        )}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
