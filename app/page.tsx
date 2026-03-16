import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useToolTracking } from "@/hooks/use-tool-tracking";
import { useHead } from "@/hooks/use-head";
import { useOsDetect } from "@/hooks/use-os-detect";
import {
  FileCheck,
  GitCompare,
  Key,
  Hash,
  Calculator,
  Clock,
  Search,
  DatabaseBackup,
  Shuffle,
  Timer,
  Ticket,
  CaseSensitive,
  FileText,
  Brush,
  Database,
  BarChart3,
  Code2,
  Regex,
  Palette,
  CalendarClock,
  ArrowRight,
  Star,
  TrendingUp,
  History,
  Shield,
  Zap,
  Ban,
  Keyboard,
} from "lucide-react";

const toolItems = [
  {
    name: "HAR Analyzer",
    href: "/tools/har-analyzer",
    icon: BarChart3,
    description: "Visualize and analyze HTTP Archive files",
    category: "Analyzers",
  },
  {
    name: "Timer",
    href: "/tools/timer",
    icon: Timer,
    description: "Stopwatch and countdown timer",
    category: "Misc",
  },
  {
    name: "JWT Decode",
    href: "/tools/jwt",
    icon: Key,
    description: "Encode and decode JSON Web Tokens",
    category: "Crypto",
  },
  {
    name: "Data Compare",
    href: "/tools/json-compare",
    icon: GitCompare,
    description: "Compare JSON, YAML, or text side by side with diff view",
    category: "Analyzers",
  },
  {
    name: "JSON Editor",
    href: "/tools/json-editor",
    icon: Code2,
    description: "Edit, filter, sort, and format JSON",
    category: "Editors",
  },
  {
    name: "Data Validator",
    href: "/tools/validator-json",
    icon: FileCheck,
    description: "Validate JSON, YAML, XML, CSV, and TOML",
    category: "Validators",
  },

  {
    name: "UUID Generator",
    href: "/tools/uuid",
    icon: Ticket,
    description: "Generate and validate UUIDs",
    category: "Generators",
  },
  {
    name: "Payload Calculator",
    href: "/tools/payload-calculator",
    icon: Calculator,
    description: "Calculate payload size and transfer time",
    category: "Misc",
  },
  {
    name: "Cron Builder",
    href: "/tools/cron-builder",
    icon: CalendarClock,
    description: "Build cron expressions visually",
    category: "Misc",
  },
  {
    name: "Time / Epoch",
    href: "/tools/timestamp-converter",
    icon: Clock,
    description: "Convert UNIX timestamps and dates",
    category: "Converters",
  },
  {
    name: "Time / Mongo OID",
    href: "/tools/timestamp-mongo",
    icon: DatabaseBackup,
    description: "Extract MongoDB ObjectId timestamps",
    category: "Converters",
  },
  {
    name: "Base64",
    href: "/tools/base64",
    icon: Hash,
    description: "Encode and decode Base64",
    category: "Converters",
  },
  {
    name: "Regex Validator",
    href: "/tools/regex-validator",
    icon: Regex,
    description: "Validate and test regex patterns",
    category: "Validators",
  },
  {
    name: "JSON to Code",
    href: "/tools/json-to-code",
    icon: Shuffle,
    description: "Convert JSON to code snippets",
    category: "Converters",
  },
  {
    name: "JSON to OpenAPI",
    href: "/tools/json-to-openapi",
    icon: FileText,
    description: "Generate OpenAPI from JSON",
    category: "Converters",
  },
  {
    name: "JSON Casing",
    href: "/tools/casing-converter",
    icon: CaseSensitive,
    description: "Convert JSON key casing styles",
    category: "Converters",
  },
  {
    name: "Random Data",
    href: "/tools/random-data-generator",
    icon: Database,
    description: "Generate realistic test data",
    category: "Generators",
  },
  {
    name: "Data Visualizer",
    href: "/tools/data-visualizer",
    icon: BarChart3,
    description: "Visualize CSV/JSON data with charts",
    category: "Analyzers",
  },
  {
    name: "URL Encoder",
    href: "/tools/url-encoder",
    icon: CaseSensitive,
    description: "Encode and decode URL characters",
    category: "Converters",
  },

  {
    name: "Hex / RGB / HSL",
    href: "/tools/color-hex-converter",
    icon: Hash,
    description: "Convert between color formats",
    category: "Color",
  },
  {
    name: "Color Palette",
    href: "/tools/color-palette-generator",
    icon: Palette,
    description: "Generate beautiful color palettes",
    category: "Color",
  },
  {
    name: "Scheme Designer",
    href: "/tools/color-scheme-designer",
    icon: Brush,
    description: "Design UI color schemes",
    category: "Color",
  },
  {
    name: "Password Generator",
    href: "/tools/password-generator",
    icon: Key,
    description: "Generate strong secure passwords",
    category: "Generators",
  },
  {
    name: "OTP Authenticator",
    href: "/tools/otp-generator",
    icon: Shield,
    description: "Generate 2FA codes (TOTP, HOTP, Steam) locally",
    category: "Generators",
  },
  {
    name: "Hash Generator",
    href: "/tools/hash",
    icon: Hash,
    description: "Generate MD5, SHA, CRC hashes",
    category: "Crypto",
  },

  {
    name: "cURL / Hurl",
    href: "/tools/curl-hurl-converter",
    icon: Shuffle,
    description: "Convert cURL to Hurl format",
    category: "Converters",
  },
  {
    name: "Data Converter",
    href: "/tools/data-converter",
    icon: Shuffle,
    description: "Convert between JSON, XML, CSV, YAML, and TOML",
    category: "Converters",
  },
  {
    name: "Key Generator",
    href: "/tools/key-generator",
    icon: Key,
    description: "Generate RSA, EC, Ed25519, and ML-KEM key pairs",
    category: "Crypto",
  },
  {
    name: "Text Sorter",
    href: "/tools/text-sorter",
    icon: CaseSensitive,
    description: "Sort lines, remove duplicates, trim whitespace",
    category: "Misc",
  },
];

const categories = [
  "All",
  "Converters",
  "Validators",
  "Generators",
  "Analyzers",
  "Editors",
  "Crypto",
  "Color",
  "Misc",
];

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const { getFavorites, getMostUsed, getRecentlyUsed, isFavorite, toggleFavorite } = useToolTracking();
  const { modSymbol } = useOsDetect();

  useHead({
    title: "DevToolbox - Privacy-First Developer Tools",
    description: "Free, privacy-first developer toolkit. JSON editor, JWT decoder, Base64 encoder, UUID generator, regex validator, and 30+ tools. 100% client-side, no data leaves your browser.",
    canonical: "https://devtoolbox.co",
  });

  const favorites = getFavorites();
  const mostUsed = getMostUsed(3);
  const recentlyUsed = getRecentlyUsed(3);

  const filtered = toolItems.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "All" || tool.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleFavoriteClick = (e: React.MouseEvent, toolId: string, toolName: string) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(toolId, toolName);
  };

  const getToolById = (id: string) => {
    return toolItems.find((t) => t.href === id);
  };

  const renderToolCard = (tool: typeof toolItems[0], showFavorite = true) => {
    const Icon = tool.icon;
    const toolId = tool.href;
    const isFav = isFavorite(toolId);

    return (
      <Link
        key={tool.href}
        to={tool.href}
        className="group flex items-start gap-3.5 rounded-lg border bg-card p-4 transition-all hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/5 hover:shadow-md hover:border-primary/20 relative"
      >
        {showFavorite && (
          <button
            onClick={(e) => handleFavoriteClick(e, toolId, tool.name)}
            className="absolute top-3 right-3 p-1 rounded-lg hover:bg-secondary transition-colors z-10"
            aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
          >
            <Star
              className={`h-4 w-4 transition-colors ${
                isFav ? "fill-primary text-primary" : "text-muted-foreground"
              }`}
            />
          </button>
        )}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-foreground">{tool.name}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" aria-hidden="true" />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {tool.description}
          </p>
        </div>
      </Link>
    );
  };

  return (
    <div className="px-4 py-8 lg:px-8 lg:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-balance lg:text-3xl">
          Developer Toolbox
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
          Privacy-first, client-side tools for everyday development tasks.
        </p>
        
        {/* Privacy Features */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-lg border bg-gradient-to-br from-primary/5 to-primary/5 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Shield className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold text-foreground">Privacy Guaranteed</h3>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                Your data never leaves your browser
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 rounded-lg border bg-gradient-to-br from-primary/5 to-primary/5 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Zap className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold text-foreground">100% Client-Side</h3>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                All processing happens locally
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 rounded-lg border bg-gradient-to-br from-primary/5 to-primary/5 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Ban className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold text-foreground">Ads-Free Experience</h3>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                No tracking, no analytics, no ads
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts & Usability */}
      <div className="mb-8 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Keyboard className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-foreground">Keyboard Shortcuts & Smart Features</h3>
            <p className="text-xs text-muted-foreground">Every tool supports these shortcuts and behaviors</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-2 rounded-md bg-secondary/50 px-3 py-2">
            <kbd className="inline-flex items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">
              {modSymbol}+Shift+X
            </kbd>
            <span className="text-xs text-muted-foreground">Clear all</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary/50 px-3 py-2">
            <kbd className="inline-flex items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">
              {modSymbol}+Enter
            </kbd>
            <span className="text-xs text-muted-foreground">Convert / Run</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary/50 px-3 py-2">
            <kbd className="inline-flex items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">
              {modSymbol}+Shift+C
            </kbd>
            <span className="text-xs text-muted-foreground">Copy output</span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary/50 px-3 py-2">
            <Zap className="h-3 w-3 text-primary shrink-0" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">Auto-convert as you type</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          placeholder="Search tools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 pl-9 bg-secondary/50 border-0 text-sm"
          aria-label="Search tools"
        />
      </div>

      {/* Categories */}
      <div className="mb-8 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-3 py-1.5 text-xs font-medium transition-colors ${
              activeCategory === cat
                ? "bg-foreground text-background"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
            style={{ borderRadius: "calc(var(--radius) + 0.5rem)" }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Favorites Section */}
      {favorites.length > 0 && search === "" && activeCategory === "All" && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <h2 className="text-sm font-semibold">Favorites</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {favorites.map((usage) => {
              const tool = getToolById(usage.id);
              return tool ? renderToolCard(tool) : null;
            })}
          </div>
        </div>
      )}

      {/* Most Used Section */}
      {mostUsed.length > 0 && search === "" && activeCategory === "All" && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Most Used</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {mostUsed.map((usage) => {
              const tool = getToolById(usage.id);
              return tool ? renderToolCard(tool) : null;
            })}
          </div>
        </div>
      )}

      {/* Recently Used Section */}
      {recentlyUsed.length > 0 && search === "" && activeCategory === "All" && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Recently Used</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {recentlyUsed.map((usage) => {
              const tool = getToolById(usage.id);
              return tool ? renderToolCard(tool) : null;
            })}
          </div>
        </div>
      )}

      {/* All Tools Header */}
      {(search !== "" || activeCategory !== "All" || favorites.length > 0 || mostUsed.length > 0 || recentlyUsed.length > 0) && (
        <h2 className="text-sm font-semibold mb-4">
          {search !== "" || activeCategory !== "All" ? "Search Results" : "All Tools"}
        </h2>
      )}

      {/* Tool Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 4xl:grid-cols-8">
        {filtered.map((tool) => renderToolCard(tool))}
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-sm text-muted-foreground">No tools match your search.</p>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t pt-6 pb-4" role="contentinfo">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Built by{" "}
            <a
              href="https://zanoski.com/me"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:underline"
            >
              Marko Zanoski
            </a>
          </p>
          <div className="flex gap-4">
            <a
              href="https://gitlab.com/Zanoshky/dev-toolbox"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              GitLab
            </a>
            <a
              href="https://github.com/Zanoshky/DevTools"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://www.buymeacoffee.com/zanoshky"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
