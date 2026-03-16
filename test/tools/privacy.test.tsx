import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PrivacyPage from "@/app/privacy/page";

function renderPage() {
  return render(
    <MemoryRouter>
      <PrivacyPage />
    </MemoryRouter>
  );
}

describe("PrivacyPage", () => {
  describe("rendering", () => {
    it("renders the page title and subtitle", () => {
      renderPage();
      expect(screen.getByRole("heading", { name: /privacy & security/i })).toBeInTheDocument();
      expect(screen.getByText(/your data never leaves your browser/i)).toBeInTheDocument();
    });

    it("renders the article landmark", () => {
      renderPage();
      expect(screen.getByRole("article")).toBeInTheDocument();
    });
  });

  describe("privacy guarantees content", () => {
    it("states no server processing", () => {
      renderPage();
      expect(screen.getByText("No Server Processing")).toBeInTheDocument();
      expect(screen.getByText(/never touches our servers/i)).toBeInTheDocument();
    });

    it("states no analytics or tracking", () => {
      renderPage();
      expect(screen.getByText("No Analytics")).toBeInTheDocument();
      expect(screen.getByText(/zero tracking scripts/i)).toBeInTheDocument();
    });

    it("states no database exists", () => {
      renderPage();
      expect(screen.getByText("No Database")).toBeInTheDocument();
      expect(screen.getByText(/no backend database exists/i)).toBeInTheDocument();
    });

    it("states offline capability", () => {
      renderPage();
      expect(screen.getByText("Works Offline")).toBeInTheDocument();
      expect(screen.getByText(/service worker caches the entire app/i)).toBeInTheDocument();
    });
  });

  describe("verification instructions", () => {
    it("provides network activity check instructions", () => {
      renderPage();
      expect(screen.getByText("1. Check Network Activity")).toBeInTheDocument();
      expect(screen.getByText(/no requests to external servers/i)).toBeInTheDocument();
    });

    it("provides offline verification instructions", () => {
      renderPage();
      expect(screen.getByText("2. Disconnect Your Internet")).toBeInTheDocument();
    });

    it("provides source code inspection instructions", () => {
      renderPage();
      expect(screen.getByText("3. Inspect the Source Code")).toBeInTheDocument();
      expect(screen.getByText(/no API endpoints/i)).toBeInTheDocument();
    });

    it("mentions the privacy badge", () => {
      renderPage();
      expect(screen.getByText("4. Use the Privacy Badge")).toBeInTheDocument();
    });
  });

  describe("technical details", () => {
    it("describes the architecture as static SPA", () => {
      renderPage();
      expect(screen.getByText("Architecture")).toBeInTheDocument();
      expect(screen.getByText(/static vite spa/i)).toBeInTheDocument();
    });

    it("describes localStorage-only data storage", () => {
      renderPage();
      expect(screen.getByText("Data Storage")).toBeInTheDocument();
    });

    it("mentions Web Crypto API for cryptography", () => {
      renderPage();
      expect(screen.getByText("Cryptography")).toBeInTheDocument();
      expect(screen.getByText("Web Crypto API")).toBeInTheDocument();
    });

    it("mentions security headers (CSP, HSTS, etc.)", () => {
      renderPage();
      expect(screen.getByText("Security Headers")).toBeInTheDocument();
    });

    it("mentions spell check is disabled to prevent data leaks", () => {
      renderPage();
      expect(screen.getByText("Spell Check Disabled")).toBeInTheDocument();
      expect(screen.getByText(/cloud-based spell-check services/i)).toBeInTheDocument();
    });

    it("mentions network monitor intercepts fetch/XHR/WebSocket", () => {
      renderPage();
      expect(screen.getByText("Network Monitor")).toBeInTheDocument();
    });

    it("mentions WebAuthn device authentication for OTP", () => {
      renderPage();
      expect(screen.getByText("Device Authentication (OTP)")).toBeInTheDocument();
    });

    it("mentions AES-256-GCM encrypted backups for OTP", () => {
      renderPage();
      expect(screen.getByText("Encrypted Backups (OTP)")).toBeInTheDocument();
    });

    it("states external dependencies are bundled at build time", () => {
      renderPage();
      expect(screen.getByText("External Dependencies")).toBeInTheDocument();
      expect(screen.getByText(/bundled at build time/i)).toBeInTheDocument();
    });
  });

  describe("no external data collection claims", () => {
    it("does not mention any analytics provider names positively", () => {
      renderPage();
      // The page mentions these providers only to say they are NOT used
      const noAnalyticsText = screen.getByText(/zero tracking scripts, no google analytics, no mixpanel, no telemetry/i);
      expect(noAnalyticsText).toBeInTheDocument();
    });

    it("emphasizes all processing is client-side", () => {
      renderPage();
      expect(screen.getByText("100% Client-Side Processing")).toBeInTheDocument();
    });
  });
});
