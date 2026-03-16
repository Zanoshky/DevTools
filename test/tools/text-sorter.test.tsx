import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TextSorterPage from "@/app/tools/text-sorter/page";

function renderPage() {
  return render(
    <MemoryRouter>
      <TextSorterPage />
    </MemoryRouter>
  );
}

function getInput(): HTMLTextAreaElement {
  return screen.getAllByTestId("codemirror")[0] as HTMLTextAreaElement;
}

function getOutput(): HTMLTextAreaElement {
  const editors = screen.getAllByTestId("codemirror");
  return editors[1] as HTMLTextAreaElement;
}

async function typeAndWait(value: string) {
  fireEvent.change(getInput(), { target: { value } });
  await act(async () => {
    vi.advanceTimersByTime(300);
  });
}

describe("TextSorterPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("rendering", () => {
    it("renders the page title", () => {
      renderPage();
      expect(screen.getByText("Text Line Sorter & Deduplicator")).toBeInTheDocument();
    });

    it("renders sort mode buttons", () => {
      renderPage();
      expect(screen.getByRole("button", { name: "A-Z" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Z-A" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Numeric" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "By Length" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Shuffle" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "No Sort" })).toBeInTheDocument();
    });

    it("renders toggle switches for options", () => {
      renderPage();
      expect(screen.getByLabelText("Dedupe")).toBeInTheDocument();
      expect(screen.getByLabelText("Trim")).toBeInTheDocument();
      expect(screen.getByLabelText("No Empty")).toBeInTheDocument();
      expect(screen.getByLabelText("Case")).toBeInTheDocument();
    });

    it("renders process and clear buttons", () => {
      renderPage();
      expect(screen.getByLabelText("Process lines")).toBeInTheDocument();
      expect(screen.getByLabelText("Clear all")).toBeInTheDocument();
    });
  });

  describe("alphabetical sorting (A-Z)", () => {
    it("sorts lines alphabetically", async () => {
      renderPage();
      await typeAndWait("cherry\napple\nbanana");
      expect(getOutput().value).toBe("apple\nbanana\ncherry");
    });

    it("sorts case-insensitively by default", async () => {
      renderPage();
      await typeAndWait("Banana\napple\nCherry");
      expect(getOutput().value).toBe("apple\nBanana\nCherry");
    });
  });

  describe("reverse alphabetical sorting (Z-A)", () => {
    it("sorts lines in reverse", async () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: "Z-A" }));
      await typeAndWait("apple\ncherry\nbanana");
      expect(getOutput().value).toBe("cherry\nbanana\napple");
    });
  });

  describe("numeric sorting", () => {
    it("sorts lines numerically", async () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: "Numeric" }));
      await typeAndWait("10\n2\n30\n1");
      expect(getOutput().value).toBe("1\n2\n10\n30");
    });
  });

  describe("sort by length", () => {
    it("sorts lines by character length", async () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: "By Length" }));
      await typeAndWait("medium\nhi\nlongest word");
      expect(getOutput().value).toBe("hi\nmedium\nlongest word");
    });
  });

  describe("deduplication", () => {
    it("removes duplicate lines (default: on)", async () => {
      renderPage();
      await typeAndWait("apple\nbanana\napple\ncherry\nbanana");
      expect(getOutput().value).toBe("apple\nbanana\ncherry");
    });

    it("removes case-insensitive duplicates by default", async () => {
      renderPage();
      await typeAndWait("Apple\napple\nAPPLE");
      // Case-insensitive dedup keeps first occurrence, then sorts
      expect(getOutput().value).toBe("Apple");
    });

    it("keeps duplicates when dedup is off", async () => {
      renderPage();
      fireEvent.click(screen.getByLabelText("Dedupe"));
      await typeAndWait("apple\nbanana\napple");
      expect(getOutput().value).toBe("apple\napple\nbanana");
    });
  });

  describe("trim whitespace", () => {
    it("trims leading/trailing whitespace from lines (default: on)", async () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: "No Sort" }));
      await typeAndWait("  hello  \n  world  ");
      expect(getOutput().value).toBe("hello\nworld");
    });
  });

  describe("remove empty lines", () => {
    it("removes empty lines (default: on)", async () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: "No Sort" }));
      await typeAndWait("hello\n\nworld\n\n");
      expect(getOutput().value).toBe("hello\nworld");
    });

    it("keeps empty lines when toggle is off", async () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: "No Sort" }));
      fireEvent.click(screen.getByLabelText("No Empty"));
      await typeAndWait("hello\n\nworld");
      expect(getOutput().value).toBe("hello\n\nworld");
    });
  });

  describe("stats display", () => {
    it("shows line count stats after processing", async () => {
      renderPage();
      await typeAndWait("apple\nbanana\napple\ncherry");
      expect(screen.getByText("4 lines")).toBeInTheDocument();
      expect(screen.getByText("3 unique")).toBeInTheDocument();
      expect(screen.getByText("1 dupes removed")).toBeInTheDocument();
    });
  });

  describe("clear", () => {
    it("clears input and output", async () => {
      renderPage();
      await typeAndWait("hello\nworld");
      fireEvent.click(screen.getByLabelText("Clear all"));
      expect(getInput().value).toBe("");
    });
  });
});
