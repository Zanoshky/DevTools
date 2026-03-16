import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import URLEncoderPage from "@/app/tools/url-encoder/page";

function renderPage() {
  return render(
    <MemoryRouter>
      <URLEncoderPage />
    </MemoryRouter>
  );
}

function getInput(): HTMLTextAreaElement {
  return screen.getAllByTestId("codemirror")[0] as HTMLTextAreaElement;
}

function getOutput(): HTMLTextAreaElement | null {
  const editors = screen.getAllByTestId("codemirror");
  return (editors.find((el) => el.hasAttribute("readonly")) as HTMLTextAreaElement) ?? null;
}

async function typeAndWait(value: string) {
  const input = getInput();
  await act(async () => {
    fireEvent.change(input, { target: { value } });
  });
  await act(async () => {
    vi.advanceTimersByTime(300);
  });
}

async function switchToDecodeAndWait() {
  const tab = screen.getByRole("tab", { name: "Decode" });
  await act(async () => {
    fireEvent.mouseDown(tab, { button: 0 });
    fireEvent.click(tab);
  });
}

describe("URLEncoderPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("rendering", () => {
    it("renders the page title", () => {
      renderPage();
      expect(screen.getByText("URL Encoder/Decoder")).toBeInTheDocument();
    });

    it("renders encode/decode tabs", () => {
      renderPage();
      expect(screen.getByRole("tab", { name: "Encode" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Decode" })).toBeInTheDocument();
    });

    it("shows empty state for encode mode", () => {
      renderPage();
      expect(screen.getByText("Enter text to encode")).toBeInTheDocument();
    });
  });

  describe("encoding", () => {
    it("encodes spaces as %20", async () => {
      renderPage();
      await typeAndWait("hello world");
      expect(getOutput()?.value).toBe("hello%20world");
    });

    it("encodes special URL characters", async () => {
      renderPage();
      await typeAndWait("key=value&foo=bar");
      expect(getOutput()?.value).toBe("key%3Dvalue%26foo%3Dbar");
    });

    it("encodes unicode characters", async () => {
      renderPage();
      await typeAndWait("caf\u00e9");
      expect(getOutput()?.value).toBe("caf%C3%A9");
    });

    it("leaves unreserved characters unchanged", async () => {
      renderPage();
      await typeAndWait("abc123");
      expect(getOutput()?.value).toBe("abc123");
    });

    it("encodes query string with hash", async () => {
      renderPage();
      await typeAndWait("page#section");
      expect(getOutput()?.value).toBe("page%23section");
    });
  });

  describe("decoding", () => {
    it("decodes %20 back to space", async () => {
      renderPage();
      await switchToDecodeAndWait();
      await typeAndWait("hello%20world");
      expect(getOutput()?.value).toBe("hello world");
    });

    it("decodes encoded special characters", async () => {
      renderPage();
      await switchToDecodeAndWait();
      await typeAndWait("key%3Dvalue%26foo%3Dbar");
      expect(getOutput()?.value).toBe("key=value&foo=bar");
    });

    it("shows error for malformed percent encoding", async () => {
      renderPage();
      await switchToDecodeAndWait();
      await typeAndWait("%ZZ");
      const editors = screen.getAllByTestId("codemirror");
      const readOnlyEditor = editors.find((el) => el.hasAttribute("readonly")) as HTMLTextAreaElement;
      // Should show an error message (decodeURIComponent throws on %ZZ)
      expect(readOnlyEditor?.value).toBeTruthy();
    });

    it("shows decode empty state", async () => {
      renderPage();
      await switchToDecodeAndWait();
      expect(screen.getByText("Enter URL to decode")).toBeInTheDocument();
    });
  });

  describe("switch mode", () => {
    it("switches mode and feeds output as new input", async () => {
      renderPage();
      await typeAndWait("hello world");
      expect(getOutput()?.value).toBe("hello%20world");

      await act(async () => {
        fireEvent.click(screen.getByLabelText("Switch encode/decode mode"));
      });
      expect(getInput().value).toBe("hello%20world");
    });
  });

  describe("clear", () => {
    it("clears all content", async () => {
      renderPage();
      await typeAndWait("test");
      await act(async () => {
        fireEvent.click(screen.getByLabelText("Clear all"));
      });
      expect(getInput().value).toBe("");
      expect(screen.getByText("Enter text to encode")).toBeInTheDocument();
    });
  });

  describe("round-trip fidelity", () => {
    it("encode then decode preserves original text", async () => {
      renderPage();
      const original = "hello world & foo=bar";
      await typeAndWait(original);
      const encoded = getOutput()?.value;
      expect(encoded).toBe("hello%20world%20%26%20foo%3Dbar");

      // Switch to decode mode using the switch button (feeds output as input)
      await act(async () => {
        fireEvent.click(screen.getByLabelText("Switch encode/decode mode"));
      });
      await act(async () => {
        vi.advanceTimersByTime(300);
      });
      expect(getOutput()?.value).toBe(original);
    });
  });
});
