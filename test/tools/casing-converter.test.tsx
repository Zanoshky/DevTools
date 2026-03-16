import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CasingConverterPage from "@/app/tools/casing-converter/page";

function renderPage() {
  return render(
    <MemoryRouter>
      <CasingConverterPage />
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
  fireEvent.change(getInput(), { target: { value } });
  await act(async () => {
    vi.advanceTimersByTime(300);
  });
}

function selectCase(label: string) {
  fireEvent.click(screen.getByLabelText(`Convert to ${label}`));
}

describe("CasingConverterPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("rendering", () => {
    it("renders the page title", () => {
      renderPage();
      expect(screen.getByText("JSON Key Casing Converter")).toBeInTheDocument();
    });

    it("renders all case format buttons", () => {
      renderPage();
      expect(screen.getByLabelText("Convert to camelCase")).toBeInTheDocument();
      expect(screen.getByLabelText("Convert to PascalCase")).toBeInTheDocument();
      expect(screen.getByLabelText("Convert to snake_case")).toBeInTheDocument();
      expect(screen.getByLabelText("Convert to SCREAMING_SNAKE")).toBeInTheDocument();
      expect(screen.getByLabelText("Convert to kebab-case")).toBeInTheDocument();
      expect(screen.getByLabelText("Convert to dot.case")).toBeInTheDocument();
    });

    it("shows empty state initially", () => {
      renderPage();
      expect(screen.getByText("Enter JSON to convert key casing")).toBeInTheDocument();
    });

    it("shows info alert about values being preserved", () => {
      renderPage();
      expect(screen.getByText(/only json keys are converted/i)).toBeInTheDocument();
    });
  });

  describe("camelCase to snake_case (default)", () => {
    it("converts camelCase keys to snake_case", async () => {
      renderPage();
      await typeAndWait('{"firstName": "Alice", "lastName": "Smith"}');
      const output = getOutput();
      const parsed = JSON.parse(output!.value);
      expect(parsed).toEqual({ first_name: "Alice", last_name: "Smith" });
    });
  });

  describe("camelCase to PascalCase", () => {
    it("converts camelCase keys to PascalCase", async () => {
      renderPage();
      selectCase("PascalCase");
      await typeAndWait('{"firstName": "Alice", "age": 30}');
      const parsed = JSON.parse(getOutput()!.value);
      expect(parsed).toEqual({ FirstName: "Alice", Age: 30 });
    });
  });

  describe("camelCase to kebab-case", () => {
    it("converts camelCase keys to kebab-case", async () => {
      renderPage();
      selectCase("kebab-case");
      await typeAndWait('{"firstName": "Alice"}');
      const parsed = JSON.parse(getOutput()!.value);
      expect(parsed).toEqual({ "first-name": "Alice" });
    });
  });

  describe("camelCase to SCREAMING_SNAKE_CASE", () => {
    it("converts camelCase keys to SCREAMING_SNAKE_CASE", async () => {
      renderPage();
      selectCase("SCREAMING_SNAKE");
      await typeAndWait('{"firstName": "Alice"}');
      const parsed = JSON.parse(getOutput()!.value);
      expect(parsed).toEqual({ FIRST_NAME: "Alice" });
    });
  });

  describe("camelCase to dot.case", () => {
    it("converts camelCase keys to dot.case", async () => {
      renderPage();
      selectCase("dot.case");
      await typeAndWait('{"firstName": "Alice"}');
      const parsed = JSON.parse(getOutput()!.value);
      expect(parsed).toEqual({ "first.name": "Alice" });
    });
  });

  describe("nested objects", () => {
    it("converts keys in nested objects", async () => {
      renderPage();
      await typeAndWait('{"userData": {"firstName": "Alice", "contactInfo": {"emailAddress": "a@b.com"}}}');
      const parsed = JSON.parse(getOutput()!.value);
      expect(parsed).toEqual({
        user_data: {
          first_name: "Alice",
          contact_info: { email_address: "a@b.com" },
        },
      });
    });
  });

  describe("arrays", () => {
    it("converts keys inside arrays of objects", async () => {
      renderPage();
      await typeAndWait('[{"firstName": "Alice"}, {"firstName": "Bob"}]');
      const parsed = JSON.parse(getOutput()!.value);
      expect(parsed).toEqual([{ first_name: "Alice" }, { first_name: "Bob" }]);
    });
  });

  describe("values are preserved", () => {
    it("does not modify string, number, boolean, or null values", async () => {
      renderPage();
      await typeAndWait('{"userName": "JohnDoe", "isActive": true, "score": 42, "data": null}');
      const parsed = JSON.parse(getOutput()!.value);
      expect(parsed.user_name).toBe("JohnDoe");
      expect(parsed.is_active).toBe(true);
      expect(parsed.score).toBe(42);
      expect(parsed.data).toBeNull();
    });
  });

  describe("error handling", () => {
    it("shows error for invalid JSON", async () => {
      renderPage();
      await typeAndWait("{not valid json}");
      const editors = screen.getAllByTestId("codemirror");
      const readOnlyEditor = editors.find((el) => el.hasAttribute("readonly")) as HTMLTextAreaElement;
      expect(readOnlyEditor?.value).toBeTruthy();
    });
  });

  describe("clear", () => {
    it("clears input and output", async () => {
      renderPage();
      await typeAndWait('{"test": 1}');
      fireEvent.click(screen.getByLabelText("Clear all"));
      expect(getInput().value).toBe("");
      expect(screen.getByText("Enter JSON to convert key casing")).toBeInTheDocument();
    });
  });
});
