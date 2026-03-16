<p align="center">
  <img src="public/icon-512.png" alt="DevToolbox" width="120" />
</p>

<h1 align="center">DevToolbox</h1>

<p align="center">
  <strong>The developer toolkit that respects your privacy.</strong><br/>
  29 tools. Zero servers. Your data never leaves your browser.
</p>

<p align="center">
  <a href="https://devtoolbox.co">Live App</a> &middot;
  <a href="https://gitlab.com/Zanoshky/dev-toolbox">GitLab</a> &middot;
  <a href="https://github.com/Zanoshky/DevTools">GitHub</a> &middot;
  <a href="https://www.buymeacoffee.com/zanoshky">Support</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.9.42-blue" alt="Version" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome" />
  <img src="https://img.shields.io/badge/data%20sent%20to%20server-0%20bytes-black" alt="Zero data sent" />
</p>

---

## The Problem

You paste a JWT into some random website to decode it. You drop production JSON into an online formatter. You feed API keys into a Base64 decoder you found on Google.

Every one of those tools could be logging your data. Most of them are.

## The Fix

DevToolbox runs entirely in your browser. There is no backend. No database. No API routes. No analytics. No tracking. No ads. Every tool is a client-side React component that processes your data in JavaScript on your machine and nowhere else.

Don't take our word for it - open DevTools, watch the Network tab, and see for yourself. Or just disconnect your WiFi. Everything still works.

---

## Tools

### Converters

| Tool                  | What it does                                                               |
| --------------------- | -------------------------------------------------------------------------- |
| Data Converter        | JSON, XML, CSV, YAML, TOML - convert between all of them                   |
| Base64                | Encode and decode with full UTF-8 support                                  |
| URL Encoder           | Encode and decode URL components                                           |
| Timestamp / Epoch     | Convert between UNIX timestamps and human-readable dates                   |
| Timestamp / Mongo OID | Extract timestamps from MongoDB ObjectIds or generate OIDs from timestamps |
| JSON Casing           | Convert JSON keys between camelCase, snake_case, PascalCase, and more      |
| JSON to Code          | Generate TypeScript, Python, Go, and other type definitions from JSON      |
| JSON to OpenAPI       | Generate OpenAPI specs from JSON examples                                  |
| cURL to Hurl          | Convert cURL commands to Hurl format and back                              |

### Validators

| Tool            | What it does                                                          |
| --------------- | --------------------------------------------------------------------- |
| Data Validator  | Validate JSON, YAML, XML, CSV, and TOML with detailed error reporting |
| Regex Validator | Test regex patterns with real-time matching and group highlighting    |

### Generators

| Tool               | What it does                                                                        |
| ------------------ | ----------------------------------------------------------------------------------- |
| UUID Generator     | Generate and validate v1, v4, and v7 UUIDs                                          |
| Password Generator | Customizable strong passwords with entropy calculation                              |
| OTP Authenticator  | Generate TOTP, HOTP, and Steam Guard codes locally - protected by WebAuthn          |
| Random Data        | Generate realistic names, emails, addresses, and other test data                    |
| Key Generator      | Generate RSA, EC, Ed25519, and ML-KEM (post-quantum) key pairs with encrypt/decrypt |

### Analyzers

| Tool            | What it does                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------- |
| HAR Analyzer    | Visualize HTTP Archive files with performance insights, dependency trees, and request details |
| Data Compare    | Side-by-side diff for JSON, YAML, or plain text                                               |
| Data Visualizer | Turn CSV and JSON into interactive charts                                                     |

### Crypto

| Tool           | What it does                                                                   |
| -------------- | ------------------------------------------------------------------------------ |
| JWT Decoder    | Decode and encode JWTs - inspect headers, payloads, expiration, sign with HMAC |
| Hash Generator | MD5, SHA-1, SHA-256, SHA-512, and CRC32                                        |

### Color

| Tool            | What it does                                    |
| --------------- | ----------------------------------------------- |
| Hex / RGB / HSL | Convert between color formats with live preview |
| Color Palette   | Generate harmonious palettes from a base color  |
| Scheme Designer | Design full UI color schemes                    |

### Editors & Misc

| Tool               | What it does                                                             |
| ------------------ | ------------------------------------------------------------------------ |
| JSON Editor        | Edit, format, filter, sort, and transform JSON with a tree and code view |
| Timer              | Stopwatch and countdown timer                                            |
| Cron Builder       | Build and validate cron expressions with a visual interface              |
| Payload Calculator | Calculate payload sizes and estimate transfer times                      |
| Text Sorter        | Sort lines, remove duplicates, trim whitespace, filter empties           |

---

## Privacy and Security

This is not a marketing bullet point. It is the core architecture.

- **No backend** - Static Vite SPA. The server delivers HTML, JS, and CSS. That's it.
- **No database** - Preferences, favorites, and history live in `localStorage` on your machine.
- **No analytics** - Zero tracking scripts. No Google Analytics, no Mixpanel, no telemetry.
- **No cookies** - None.
- **No external API calls** - All npm packages are bundled at build time. No runtime CDN calls.
- **Works offline** - Service Worker caches everything after first load. It's a full PWA.
- **Built-in network monitor** - Intercepts `fetch`, `XMLHttpRequest`, `sendBeacon`, and `WebSocket` to prove no data leaves.
- **Spell check disabled** - All inputs disable browser spell check to prevent cloud-based spell-check services from reading your data.
- **Security headers** - HSTS, X-Frame-Options: DENY, CSP, COOP, COEP.
- **WebAuthn protection** - The OTP Authenticator requires biometric or PIN authentication via your device's secure enclave.
- **Encrypted exports** - OTP backups use AES-256-GCM with PBKDF2-derived keys (100k iterations).
- **Open source** - Read every line. Audit it yourself.

### How to verify

1. Open DevTools (F12) -> Network tab -> use any tool -> watch for zero external requests
2. Disconnect your WiFi -> refresh -> everything still works
3. Click the shield icon in the top bar -> real-time network monitor shows all requests
4. Read the source code

---

## Keyboard Shortcuts

Every tool supports these shortcuts:

| Shortcut               | Action           |
| ---------------------- | ---------------- |
| `Cmd/Ctrl + Shift + X` | Clear all fields |
| `Cmd/Ctrl + Enter`     | Convert / Run    |
| `Cmd/Ctrl + Shift + C` | Copy output      |

All tools also auto-convert as you type - no need to click buttons.

---

## Smart Features

- **Favorites** - Star any tool to pin it to the top of the home page
- **Most Used** - Your most-used tools surface automatically
- **Recently Used** - Quick access to tools you just used
- **Search** - Filter tools by name or description
- **Category filters** - Browse by Converters, Validators, Generators, Analyzers, Editors, Crypto, Color, Misc
- **History** - Most tools remember your recent inputs in a sidebar
- **Auto-restore** - Reopen DevToolbox and it takes you back to the last tool you were using
- **Dark mode** - System-aware theme with manual toggle
- **Responsive** - Desktop sidebar nav + mobile bottom tab bar

---

## Getting Started

```bash
# Clone
git clone https://gitlab.com/Zanoshky/dev-toolbox.git
cd dev-toolbox

# Install (requires Node.js 18+)
pnpm install    # or: yarn install

# Dev server with Vite
pnpm dev        # or: yarn dev

# Production build
pnpm build      # or: yarn build

# Preview production build
pnpm preview    # or: yarn preview

# Lint
pnpm lint       # or: yarn lint

# Run tests
pnpm test       # or: yarn test
```

Open [http://localhost:5173](http://localhost:5173).

---

## Run with Docker

Don't want to install Node or pnpm? Run it in Docker:

```bash
# Build the image
docker build -t devtoolbox .

# Run it
docker run -d -p 8080:8080 devtoolbox
```

Open [http://localhost:8080](http://localhost:8080).

That's it. The image uses a multi-stage build (Node for building, nginx-alpine for serving) so the final image is small and contains only the static files. See [DOCKER.md](DOCKER.md) for the full guide - custom ports, docker compose, troubleshooting, and more.

---

## Tech Stack

| Layer           | Technology                             |
| --------------- | -------------------------------------- |
| Framework       | Vite + React 19 (SPA)                  |
| Language        | TypeScript 5.8 (strict mode)           |
| Styling         | Tailwind CSS 3.4 + tailwindcss-animate |
| Components      | Radix UI + shadcn/ui                   |
| Code Editor     | CodeMirror 6                           |
| JSON Editor     | vanilla-jsoneditor                     |
| Icons           | Lucide React                           |
| Fonts           | Inter (sans) + JetBrains Mono (mono)   |
| PWA             | Custom Service Worker                  |
| Testing         | Vitest + Testing Library + fast-check  |
| Package Manager | pnpm                                   |
| Git Hooks       | Husky (auto version bump on commit)    |

---

## Project Structure

```
app/
  tools/                    # 29 tool pages, each self-contained
    [tool-name]/
      page.tsx              # Tool implementation ("use client")
      layout.tsx            # SEO metadata
  page.tsx                  # Home page (search, categories, favorites)
  globals.css               # Design tokens, themes, a11y styles

components/
  ui/                       # 19 shadcn/ui primitives (Radix wrappers)
  har/                      # HAR analyzer domain components
  tool-layout.tsx           # Shared wrapper for all tool pages
  copy-input.tsx            # Input with copy-to-clipboard
  history-sidebar.tsx       # Reusable history panel
  top-bar.tsx               # Header with PWA install, theme, privacy badge

hooks/
  use-tool-tracking.ts      # Favorites, most used, recently used (localStorage)
  use-keyboard-shortcuts.ts # Global keyboard shortcut system
  use-auto-convert.ts       # Auto-convert on input change
  use-device-auth.ts        # WebAuthn for OTP protection

lib/
  tool-metadata.ts          # SEO metadata generator for all tools
  utils.ts                  # cn() - clsx + tailwind-merge
```

---

## Architecture

Every tool follows the same pattern:

```tsx
"use client";
import { ToolLayout } from "@/components/tool-layout";

export default function MyToolPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  return (
    <ToolLayout title="My Tool" description="Does something useful">
      {/* All processing happens here, in the browser */}
    </ToolLayout>
  );
}
```

Key decisions:

- Every tool is a client component - no server actions, no API routes
- State is local (`useState`) - no global state management
- Persistence via `localStorage` - history, favorites, preferences, theme
- Each tool is self-contained and independently loadable
- Navigation adapts: sidebar on desktop, bottom tabs on mobile

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

The short version:

1. Create `app/tools/my-tool/page.tsx` - wrap in `<ToolLayout>`
2. Create `app/tools/my-tool/layout.tsx` - use `generateToolMetadata()`
3. Register in: `app/page.tsx`, `desktop-nav.tsx`, `tool-tracker.tsx`, `sitemap.ts`
4. All processing must be client-side. No exceptions.
5. Every interactive element needs accessibility (aria-labels, keyboard support)
6. Test on mobile, desktop, dark mode, and with keyboard navigation

---

## Accessibility

- Skip-to-content link
- Semantic HTML (nav, main, header, footer, article)
- ARIA labels on all interactive elements
- Keyboard navigation with visible focus indicators
- Screen reader live regions for status updates
- `prefers-reduced-motion` and `prefers-contrast: high` support
- Dark mode with proper contrast ratios

---

## License

MIT

---

<p align="center">
  Built by <a href="https://zanoski.com/me">Marko Zanoski</a>
</p>
