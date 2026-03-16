import { renderHook, act } from "@testing-library/react";
import { useAutoConvert } from "./use-auto-convert";

describe("useAutoConvert", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns empty output and no error initially", () => {
    const { result } = renderHook(() =>
      useAutoConvert({ input: "", convertFn: (v) => v.toUpperCase() })
    );
    expect(result.current.output).toBe("");
    expect(result.current.error).toBeNull();
    expect(result.current.isProcessing).toBe(false);
  });

  it("auto-converts after debounce delay", async () => {
    const { result } = renderHook(() =>
      useAutoConvert({ input: "hello", convertFn: (v) => v.toUpperCase() })
    );

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.output).toBe("HELLO");
    expect(result.current.error).toBeNull();
  });

  it("does not convert before debounce expires", () => {
    const { result } = renderHook(() =>
      useAutoConvert({ input: "hello", convertFn: (v) => v.toUpperCase() })
    );

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.output).toBe("");
  });

  it("uses custom delay", async () => {
    const { result } = renderHook(() =>
      useAutoConvert({
        input: "test",
        convertFn: (v) => v.toUpperCase(),
        delay: 500,
      })
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.output).toBe("");

    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.output).toBe("TEST");
  });

  it("skips conversion for empty input", async () => {
    const convertFn = vi.fn((v: string) => v.toUpperCase());
    renderHook(() => useAutoConvert({ input: "", convertFn }));

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(convertFn).not.toHaveBeenCalled();
  });

  it("skips conversion for whitespace-only input", async () => {
    const convertFn = vi.fn((v: string) => v.toUpperCase());
    const { result } = renderHook(() =>
      useAutoConvert({ input: "   ", convertFn })
    );

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(convertFn).not.toHaveBeenCalled();
    expect(result.current.output).toBe("");
    expect(result.current.error).toBeNull();
  });

  it("preserves input and sets error on convertFn failure", async () => {
    const { result } = renderHook(() =>
      useAutoConvert({
        input: "bad input",
        convertFn: () => {
          throw new Error("Parse error");
        },
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.output).toBe("");
    expect(result.current.error).toBe("Parse error");
  });

  it("handles non-Error throws gracefully", async () => {
    const { result } = renderHook(() =>
      useAutoConvert({
        input: "test",
        convertFn: () => {
          throw "string error";
        },
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.error).toBe("An error occurred");
  });

  it("convert() bypasses debounce", async () => {
    const { result } = renderHook(() =>
      useAutoConvert({ input: "hello", convertFn: (v) => v.toUpperCase() })
    );

    expect(result.current.output).toBe("");

    await act(async () => {
      result.current.convert();
    });

    expect(result.current.output).toBe("HELLO");
  });

  it("clear() resets output and error", async () => {
    const { result } = renderHook(() =>
      useAutoConvert({
        input: "bad",
        convertFn: () => {
          throw new Error("fail");
        },
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.error).toBe("fail");

    act(() => {
      result.current.clear();
    });

    expect(result.current.output).toBe("");
    expect(result.current.error).toBeNull();
  });

  it("does not convert when enabled is false", async () => {
    const convertFn = vi.fn((v: string) => v.toUpperCase());
    renderHook(() =>
      useAutoConvert({ input: "hello", convertFn, enabled: false })
    );

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(convertFn).not.toHaveBeenCalled();
  });

  it("supports async convertFn", async () => {
    const { result } = renderHook(() =>
      useAutoConvert({
        input: "async",
        convertFn: async (v) => {
          return v.toUpperCase();
        },
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.output).toBe("ASYNC");
    expect(result.current.isProcessing).toBe(false);
  });

  it("clears output when input changes to empty", async () => {
    const { result, rerender } = renderHook(
      ({ input }: { input: string }) =>
        useAutoConvert({ input, convertFn: (v) => v.toUpperCase() }),
      { initialProps: { input: "hello" } }
    );

    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.output).toBe("HELLO");

    rerender({ input: "" });

    expect(result.current.output).toBe("");
    expect(result.current.error).toBeNull();
  });
});
