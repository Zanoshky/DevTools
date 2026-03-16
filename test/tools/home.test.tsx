import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HomePage from "@/app/page";

function renderPage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );
}

describe("HomePage", () => {
  describe("rendering", () => {
    it("renders the main heading", () => {
      renderPage();
      expect(screen.getByRole("heading", { name: /developer toolbox/i })).toBeInTheDocument();
    });

    it("renders the privacy tagline", () => {
      renderPage();
      expect(screen.getByText(/privacy-first, client-side tools/i)).toBeInTheDocument();
    });

    it("renders the search input with accessible label", () => {
      renderPage();
      expect(screen.getByRole("searchbox", { name: /search tools/i })).toBeInTheDocument();
    });

    it("renders the footer with contentinfo role", () => {
      renderPage();
      expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    });

    it("renders all category filter buttons", () => {
      renderPage();
      const categories = ["All", "Converters", "Validators", "Generators", "Analyzers", "Editors", "Crypto", "Color", "Misc"];
      categories.forEach((cat) => {
        expect(screen.getByRole("button", { name: cat })).toBeInTheDocument();
      });
    });
  });

  describe("privacy feature cards on home page", () => {
    it("displays Privacy Guaranteed card", () => {
      renderPage();
      expect(screen.getByText("Privacy Guaranteed")).toBeInTheDocument();
      expect(screen.getByText("Your data never leaves your browser")).toBeInTheDocument();
    });

    it("displays 100% Client-Side card", () => {
      renderPage();
      expect(screen.getByText("100% Client-Side")).toBeInTheDocument();
      expect(screen.getByText("All processing happens locally")).toBeInTheDocument();
    });

    it("displays Ads-Free Experience card", () => {
      renderPage();
      expect(screen.getByText("Ads-Free Experience")).toBeInTheDocument();
      expect(screen.getByText("No tracking, no analytics, no ads")).toBeInTheDocument();
    });
  });

  describe("tool listing", () => {
    it("renders tool cards as links", () => {
      renderPage();
      const links = screen.getAllByRole("link");
      // Should have tool links plus footer links
      expect(links.length).toBeGreaterThan(10);
    });

    it("renders known tools by name", () => {
      renderPage();
      expect(screen.getByText("JWT Decode")).toBeInTheDocument();
      expect(screen.getByText("Base64")).toBeInTheDocument();
      expect(screen.getByText("UUID Generator")).toBeInTheDocument();
      expect(screen.getByText("Data Converter")).toBeInTheDocument();
      expect(screen.getByText("Password Generator")).toBeInTheDocument();
    });

    it("renders tool descriptions", () => {
      renderPage();
      expect(screen.getByText("Encode and decode JSON Web Tokens")).toBeInTheDocument();
      expect(screen.getByText("Encode and decode Base64")).toBeInTheDocument();
    });
  });

  describe("search filtering", () => {
    it("filters tools by name", () => {
      renderPage();
      const searchInput = screen.getByRole("searchbox", { name: /search tools/i });
      fireEvent.change(searchInput, { target: { value: "jwt" } });
      expect(screen.getByText("JWT Decode")).toBeInTheDocument();
      expect(screen.queryByText("UUID Generator")).not.toBeInTheDocument();
    });

    it("filters tools by description", () => {
      renderPage();
      const searchInput = screen.getByRole("searchbox", { name: /search tools/i });
      fireEvent.change(searchInput, { target: { value: "Base64" } });
      expect(screen.getByText("Base64")).toBeInTheDocument();
    });

    it("shows empty state when no tools match", () => {
      renderPage();
      const searchInput = screen.getByRole("searchbox", { name: /search tools/i });
      fireEvent.change(searchInput, { target: { value: "xyznonexistent" } });
      expect(screen.getByText("No tools match your search.")).toBeInTheDocument();
    });

    it("search is case-insensitive", () => {
      renderPage();
      const searchInput = screen.getByRole("searchbox", { name: /search tools/i });
      fireEvent.change(searchInput, { target: { value: "JWT" } });
      expect(screen.getByText("JWT Decode")).toBeInTheDocument();
      fireEvent.change(searchInput, { target: { value: "jwt" } });
      expect(screen.getByText("JWT Decode")).toBeInTheDocument();
    });
  });

  describe("category filtering", () => {
    it("filters by Crypto category", () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: "Crypto" }));
      expect(screen.getByText("JWT Decode")).toBeInTheDocument();
      expect(screen.getByText("Hash Generator")).toBeInTheDocument();
      expect(screen.queryByText("Timer")).not.toBeInTheDocument();
    });

    it("filters by Converters category", () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: "Converters" }));
      expect(screen.getByText("Base64")).toBeInTheDocument();
      expect(screen.getByText("Data Converter")).toBeInTheDocument();
      expect(screen.queryByText("JWT Decode")).not.toBeInTheDocument();
    });

    it("shows all tools when All is selected", () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: "Crypto" }));
      fireEvent.click(screen.getByRole("button", { name: "All" }));
      expect(screen.getByText("JWT Decode")).toBeInTheDocument();
      expect(screen.getByText("Timer")).toBeInTheDocument();
      expect(screen.getByText("Base64")).toBeInTheDocument();
    });

    it("filters by Misc category", () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: "Misc" }));
      expect(screen.getByText("Timer")).toBeInTheDocument();
      expect(screen.getByText("Text Sorter")).toBeInTheDocument();
      expect(screen.queryByText("JWT Decode")).not.toBeInTheDocument();
    });
  });

  describe("keyboard shortcuts section", () => {
    it("displays keyboard shortcut info", () => {
      renderPage();
      expect(screen.getByText("Keyboard Shortcuts & Smart Features")).toBeInTheDocument();
      expect(screen.getByText("Clear all")).toBeInTheDocument();
      expect(screen.getByText("Convert / Run")).toBeInTheDocument();
      expect(screen.getByText("Copy output")).toBeInTheDocument();
      expect(screen.getByText("Auto-convert as you type")).toBeInTheDocument();
    });
  });

  describe("footer links", () => {
    it("renders external links with noopener noreferrer", () => {
      renderPage();
      const gitlabLink = screen.getByRole("link", { name: "GitLab" });
      expect(gitlabLink).toHaveAttribute("rel", "noopener noreferrer");
      expect(gitlabLink).toHaveAttribute("target", "_blank");

      const githubLink = screen.getByRole("link", { name: "GitHub" });
      expect(githubLink).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("favorite toggle", () => {
    it("renders favorite buttons with accessible labels", () => {
      renderPage();
      const favButtons = screen.getAllByLabelText(/add to favorites/i);
      expect(favButtons.length).toBeGreaterThan(0);
    });

    it("toggles favorite on click", () => {
      renderPage();
      const favButtons = screen.getAllByLabelText(/add to favorites/i);
      fireEvent.click(favButtons[0]);
      // After toggling, the button label should change to "Remove from favorites"
      expect(screen.getAllByLabelText(/remove from favorites/i).length).toBeGreaterThanOrEqual(1);
    });
  });
});
