import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TimestampConverterPage from "@/app/tools/timestamp-converter/page";

function renderPage() {
  return render(
    <MemoryRouter>
      <TimestampConverterPage />
    </MemoryRouter>
  );
}

async function switchToDateMode() {
  const tab = screen.getByRole("tab", { name: /date to epoch/i });
  await act(async () => {
    fireEvent.mouseDown(tab, { button: 0 });
  });
}

describe("TimestampConverterPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("rendering", () => {
    it("renders the page title", () => {
      renderPage();
      expect(screen.getByText("Epoch Converter")).toBeInTheDocument();
    });

    it("renders mode tabs", () => {
      renderPage();
      expect(screen.getByRole("tab", { name: /epoch to date/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /date to epoch/i })).toBeInTheDocument();
    });

    it("renders Now and Clear buttons", () => {
      renderPage();
      expect(screen.getByRole("button", { name: /now/i })).toBeInTheDocument();
      expect(screen.getByLabelText("Clear all")).toBeInTheDocument();
    });

    it("renders unit toggle buttons", () => {
      renderPage();
      expect(screen.getByRole("button", { name: "Seconds" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Milliseconds" })).toBeInTheDocument();
    });

    it("shows empty state initially", () => {
      renderPage();
      expect(screen.getByText("Enter an epoch timestamp to convert")).toBeInTheDocument();
    });
  });

  describe("epoch to date conversion", () => {
    it("converts a known epoch (seconds) to ISO date", () => {
      renderPage();
      const input = screen.getByPlaceholderText("1609459200");
      fireEvent.change(input, { target: { value: "1609459200" } });

      // 1609459200 = 2021-01-01T00:00:00Z — value lives inside a CopyInput
      expect(screen.getByDisplayValue("2021-01-01T00:00:00.000Z")).toBeInTheDocument();
    });

    it("shows date breakdown parts", () => {
      renderPage();
      const input = screen.getByPlaceholderText("1609459200");
      fireEvent.change(input, { target: { value: "1609459200" } });

      expect(screen.getByText("2021")).toBeInTheDocument();
      expect(screen.getByText("year")).toBeInTheDocument();
      expect(screen.getByText("month")).toBeInTheDocument();
      expect(screen.getByText("day")).toBeInTheDocument();
    });

    it("converts milliseconds when unit is set to milliseconds", () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: "Milliseconds" }));
      const input = screen.getByPlaceholderText("1609459200000");
      fireEvent.change(input, { target: { value: "1609459200000" } });

      expect(screen.getByDisplayValue("2021-01-01T00:00:00.000Z")).toBeInTheDocument();
    });

    it("shows both seconds and milliseconds in output", () => {
      renderPage();
      const input = screen.getByPlaceholderText("1609459200");
      fireEvent.change(input, { target: { value: "1609459200" } });

      expect(screen.getAllByDisplayValue("1609459200").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByDisplayValue("1609459200000")).toBeInTheDocument();
    });

    it("does not render results for non-numeric input", () => {
      renderPage();
      const input = screen.getByPlaceholderText("1609459200");
      fireEvent.change(input, { target: { value: "not-a-number" } });

      expect(screen.queryByText("ISO 8601")).not.toBeInTheDocument();
    });
  });

  describe("date to epoch conversion", () => {
    it("switches to date-to-epoch mode", async () => {
      renderPage();
      await switchToDateMode();
      expect(screen.getByText("Select a date and time to convert")).toBeInTheDocument();
    });

    it("converts a date input to epoch", async () => {
      renderPage();
      await switchToDateMode();

      const dateInput = screen.getByLabelText("Date");
      fireEvent.change(dateInput, { target: { value: "2021-01-01" } });

      // Should show epoch values and ISO 8601 label
      expect(screen.getByText("ISO 8601")).toBeInTheDocument();
    });

    it("renders timezone toggle (Local/UTC)", async () => {
      renderPage();
      await switchToDateMode();
      expect(screen.getByRole("button", { name: "Local" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "UTC" })).toBeInTheDocument();
    });

    it("renders date and time inputs", async () => {
      renderPage();
      await switchToDateMode();
      expect(screen.getByLabelText("Date")).toBeInTheDocument();
      expect(screen.getByLabelText("Time")).toBeInTheDocument();
    });
  });

  describe("Now button", () => {
    it("populates epoch field with current timestamp", () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: /now/i }));

      // After clicking Now, the ISO 8601 output should appear
      expect(screen.getByText("ISO 8601")).toBeInTheDocument();
    });
  });

  describe("clear", () => {
    it("clears all fields", () => {
      renderPage();
      const input = screen.getByPlaceholderText("1609459200");
      fireEvent.change(input, { target: { value: "1609459200" } });
      expect(screen.getByDisplayValue("2021-01-01T00:00:00.000Z")).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText("Clear all"));
      expect(screen.getByText("Enter an epoch timestamp to convert")).toBeInTheDocument();
    });
  });

  describe("history sidebar", () => {
    it("renders history heading", () => {
      renderPage();
      expect(screen.getByText("History")).toBeInTheDocument();
    });
  });
});
