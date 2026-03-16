import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Base64Page from "@/app/tools/base64/page";

function renderPage() {
  return render(
    <MemoryRouter>
      <Base64Page />
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
  });
}

describe("Base64Page", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("rendering", () => {
    it("renders the page title", () => {
      renderPage();
      expect(screen.getByText("Base64 Encoder/Decoder")).toBeInTheDocument();
    });

    it("renders encode/decode tabs", () => {
      renderPage();
      expect(screen.getByRole("tab", { name: "Encode" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Decode" })).toBeInTheDocument();
    });

    it("renders action buttons with accessible labels", () => {
      renderPage();
      expect(screen.getByLabelText("Encode input")).toBeInTheDocument();
      expect(screen.getByLabelText("Switch encode/decode mode")).toBeInTheDocument();
      expect(screen.getByLabelText("Clear all")).toBeInTheDocument();
    });

    it("shows empty state message initially", () => {
      renderPage();
      expect(screen.getByText("Enter text to encode")).toBeInTheDocument();
    });
  });

  describe("encoding", () => {
    it("encodes plain text to Base64", async () => {
      renderPage();
      await typeAndWait("Hello, World!");
      const output = getOutput();
      expect(output?.value).toBe("SGVsbG8sIFdvcmxkIQ==");
    });

    it("encodes empty string to empty output", async () => {
      renderPage();
      await typeAndWait("");
      expect(screen.getByText("Enter text to encode")).toBeInTheDocument();
    });

    it("encodes UTF-8 characters correctly", async () => {
      renderPage();
      await typeAndWait("cafe\u0301");
      const output = getOutput();
      expect(output).not.toBeNull();
      const decoded = new TextDecoder().decode(
        Uint8Array.from(atob(output!.value), (c) => c.charCodeAt(0))
      );
      expect(decoded).toBe("cafe\u0301");
    });
  });

  describe("decoding", () => {
    it("decodes Base64 to plain text", async () => {
      renderPage();
      await switchToDecodeAndWait();
      await typeAndWait("SGVsbG8sIFdvcmxkIQ==");
      const output = getOutput();
      expect(output?.value).toBe("Hello, World!");
    });

    it("shows error for invalid Base64 input", async () => {
      renderPage();
      await switchToDecodeAndWait();
      await typeAndWait("!!!not-valid-base64!!!");
      const editors = screen.getAllByTestId("codemirror");
      const readOnlyEditor = editors.find((el) => el.hasAttribute("readonly")) as HTMLTextAreaElement;
      expect(readOnlyEditor?.value).toBeTruthy();
    });

    it("updates empty state message for decode mode", async () => {
      renderPage();
      await switchToDecodeAndWait();
      expect(screen.getByText("Enter Base64 to decode")).toBeInTheDocument();
    });
  });

  describe("switch mode", () => {
    it("switches from encode to decode and feeds output as input", async () => {
      renderPage();
      await typeAndWait("test");
      const encoded = getOutput()?.value;
      expect(encoded).toBe("dGVzdA==");

      await act(async () => {
        fireEvent.click(screen.getByLabelText("Switch encode/decode mode"));
      });
      const newInput = getInput();
      expect(newInput.value).toBe("dGVzdA==");
    });
  });

  describe("clear", () => {
    it("clears input and output", async () => {
      renderPage();
      await typeAndWait("test");
      expect(getOutput()?.value).toBe("dGVzdA==");

      await act(async () => {
        fireEvent.click(screen.getByLabelText("Clear all"));
      });
      expect(getInput().value).toBe("");
      expect(screen.getByText("Enter text to encode")).toBeInTheDocument();
    });
  });

  describe("stats bar", () => {
    it("shows input/output character counts when content exists", async () => {
      renderPage();
      await typeAndWait("Hello");
      expect(screen.getByText("Input: 5 chars")).toBeInTheDocument();
      expect(screen.getByText("Output: 8 chars")).toBeInTheDocument();
    });
  });
});
