# Contributing to DevToolbox

Thanks for your interest in contributing. Here's what you need to know.

## Setup

```bash
pnpm install
pnpm dev
```

Requires Node.js 18+ and pnpm.

## Adding a New Tool

See the full guide: `.kiro/steering/new-tool-guide.md`

Quick version:
1. Create `app/tools/my-tool/page.tsx` (use `"use client"`, wrap in `<ToolLayout>`)
2. Create `app/tools/my-tool/layout.tsx` (use `generateToolMetadata()`)
3. Register in 4 places: `app/page.tsx`, `desktop-nav.tsx`, `tool-tracker.tsx`, `sitemap.ts`

## Rules

- All processing must be client-side. No API routes, no server actions, no external API calls.
- No analytics, tracking, or telemetry of any kind.
- Every interactive element needs proper accessibility (aria-labels, keyboard support).
- Use existing components: `ToolLayout`, `CopyInput`, `CopyTextarea`, `HistorySidebar`, `ToolCard`.
- Use Tailwind CSS with semantic color tokens. No hardcoded colors.
- Pin dependency versions. Never use `"latest"`.

## Code Style

- TypeScript strict mode
- Functional components with hooks
- `const` over `let`, never `var`
- Arrow functions for handlers
- `cn()` for conditional Tailwind classes
- Import order: React → UI components → Custom components → Hooks → Utils → Icons

## Pre-commit

Husky auto-bumps the patch version on every commit. No manual version management needed.

## Testing

Before submitting:
- Test on mobile and desktop
- Test dark mode
- Test keyboard navigation (Tab, Enter, Escape)
- Verify no network requests for data processing (check DevTools Network tab)
- Run `pnpm lint` and `pnpm build`

## Pull Requests

- One tool per PR
- Include screenshots for UI changes
- Describe what the tool does and why it's useful
- Confirm all 4 registration points are updated
