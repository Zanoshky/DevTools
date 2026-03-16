import { useMemo } from "react";

interface UseOsDetectReturn {
  isMac: boolean;
  modKey: string;
  modSymbol: string;
}

/**
 * Detects the operating system and returns platform-appropriate modifier key labels.
 * Value is memoized since the OS never changes during a session.
 */
export function useOsDetect(): UseOsDetectReturn {
  return useMemo(() => {
    if (typeof navigator === "undefined") {
      return { isMac: false, modKey: "Ctrl", modSymbol: "Ctrl" };
    }

    const isMac = /mac/i.test(navigator.userAgent);

    return {
      isMac,
      modKey: isMac ? "Cmd" : "Ctrl",
      modSymbol: isMac ? "\u2318" : "Ctrl",
    };
  }, []);
}
