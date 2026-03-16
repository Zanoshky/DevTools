import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UUIDPage from "@/app/tools/uuid/page";

function renderPage() {
  return render(
    <MemoryRouter>
      <UUIDPage />
    </MemoryRouter>
  );
}

describe("UUIDPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("rendering", () => {
    it("renders the page title", () => {
      renderPage();
      expect(screen.getByText("UUID Generator")).toBeInTheDocument();
    });

    it("renders version selection buttons", () => {
      renderPage();
      expect(screen.getByLabelText("Select UUID version 1")).toBeInTheDocument();
      expect(screen.getByLabelText("Select UUID version 4")).toBeInTheDocument();
      expect(screen.getByLabelText("Select UUID version 7")).toBeInTheDocument();
    });

    it("renders generate button", () => {
      renderPage();
      expect(screen.getByLabelText(/generate uuid version/i)).toBeInTheDocument();
    });

    it("renders copy button", () => {
      renderPage();
      expect(screen.getByLabelText("Copy UUID to clipboard")).toBeInTheDocument();
    });

    it("renders clear button", () => {
      renderPage();
      expect(screen.getByLabelText("Clear generated UUID")).toBeInTheDocument();
    });
  });

  describe("UUID generation", () => {
    it("generates a UUID on mount", () => {
      renderPage();
      expect(screen.getByText("Generated UUID")).toBeInTheDocument();
      expect(screen.getByText("Format: 8-4-4-4-12")).toBeInTheDocument();
    });

    it("generates a new UUID on button click", () => {
      renderPage();
      expect(screen.getByText("Generated UUID")).toBeInTheDocument();
      fireEvent.click(screen.getByLabelText(/generate uuid version/i));
      expect(screen.getByText("Generated UUID")).toBeInTheDocument();
    });
  });

  describe("version selection", () => {
    it("defaults to v4 (Random)", () => {
      renderPage();
      expect(screen.getByText("Type: Random")).toBeInTheDocument();
    });

    it("switches to v1 (Time-based)", () => {
      renderPage();
      fireEvent.click(screen.getByLabelText("Select UUID version 1"));
      expect(screen.getByText("Type: Time-based")).toBeInTheDocument();
    });

    it("switches to v7 (Time-ordered)", () => {
      renderPage();
      fireEvent.click(screen.getByLabelText("Select UUID version 7"));
      expect(screen.getByText("Type: Time-ordered")).toBeInTheDocument();
    });

    it("shows version info cards with descriptions", () => {
      renderPage();
      expect(screen.getByText("Timestamp-based")).toBeInTheDocument();
      expect(screen.getByText("Random")).toBeInTheDocument();
      expect(screen.getByText("Time-ordered")).toBeInTheDocument();
      expect(screen.getByText("Most common, max privacy")).toBeInTheDocument();
      expect(screen.getByText("Best for databases")).toBeInTheDocument();
    });
  });

  describe("clear", () => {
    it("clears the generated UUID", () => {
      renderPage();
      expect(screen.getByText("Generated UUID")).toBeInTheDocument();
      fireEvent.click(screen.getByLabelText("Clear generated UUID"));
      expect(screen.queryByText("Generated UUID")).not.toBeInTheDocument();
    });
  });

  describe("history sidebar", () => {
    it("renders history heading", () => {
      renderPage();
      expect(screen.getByText("History")).toBeInTheDocument();
    });

    it("adds generated UUIDs to history", () => {
      renderPage();
      // On mount, one UUID is generated and added to history
      const historyItems = screen.getAllByLabelText(/select history item/i);
      expect(historyItems.length).toBeGreaterThanOrEqual(1);
    });

    it("clears history", () => {
      renderPage();
      fireEvent.click(screen.getByLabelText("Clear history"));
      expect(screen.getByText("No history yet")).toBeInTheDocument();
    });
  });

  describe("stats display", () => {
    it("shows UUID length (36 chars)", () => {
      renderPage();
      expect(screen.getByText("Length: 36 chars")).toBeInTheDocument();
    });

    it("shows UUID format", () => {
      renderPage();
      expect(screen.getByText("Format: 8-4-4-4-12")).toBeInTheDocument();
    });
  });
});
