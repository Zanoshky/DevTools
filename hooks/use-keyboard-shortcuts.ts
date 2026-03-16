import { useEffect, useRef } from "react";

import { toast } from "@/hooks/use-toast";

export interface ShortcutAction {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: ShortcutAction[];
  enabled?: boolean;
}

/**
 * Registers global keydown shortcuts on `document`.
 * Uses a ref for the shortcuts array to avoid stale closures.
 * Checks `metaKey || ctrlKey` for cross-platform Cmd/Ctrl support.
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions): void {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      for (const shortcut of shortcutsRef.current) {
        const ctrlMatch = shortcut.ctrl
          ? e.metaKey || e.ctrlKey
          : !(e.metaKey || e.ctrlKey);
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && keyMatch) {
          e.preventDefault();
          shortcut.action();
          toast({ description: shortcut.description });
          return;
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}
