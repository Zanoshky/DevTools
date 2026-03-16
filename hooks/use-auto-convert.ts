import { useState, useEffect, useCallback, useRef } from "react";

interface UseAutoConvertOptions {
  input: string;
  convertFn: (input: string) => string | Promise<string>;
  delay?: number;
  enabled?: boolean;
}

interface UseAutoConvertReturn {
  output: string;
  error: string | null;
  isProcessing: boolean;
  convert: () => void;
  clear: () => void;
}

/**
 * Debounced auto-conversion hook. Extracts the pattern from the hash page
 * (useEffect + setTimeout/clearTimeout with 300ms default delay).
 *
 * - Skips convertFn when input is empty or whitespace-only
 * - convert() bypasses debounce for manual trigger (e.g. Ctrl+Enter)
 * - On error: preserves input, clears output, sets error message
 */
export function useAutoConvert({
  input,
  convertFn,
  delay = 300,
  enabled = true,
}: UseAutoConvertOptions): UseAutoConvertReturn {
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const convertFnRef = useRef(convertFn);
  convertFnRef.current = convertFn;

  const runConversion = useCallback(async (value: string) => {
    if (!value.trim()) {
      setOutput("");
      setError(null);
      return;
    }

    setIsProcessing(true);
    try {
      const result = await Promise.resolve(convertFnRef.current(value));
      setOutput(result);
      setError(null);
    } catch (err) {
      setOutput("");
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Debounced auto-conversion on input change
  useEffect(() => {
    if (!enabled) return;

    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }

    timerRef.current = setTimeout(() => {
      runConversion(input);
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [input, delay, enabled, runConversion]);

  const convert = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    runConversion(input);
  }, [input, runConversion]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setOutput("");
    setError(null);
  }, []);

  return { output, error, isProcessing, convert, clear };
}
