/// Mock for @uiw/react-codemirror - renders a simple textarea instead of CodeMirror
import { vi } from "vitest";

vi.mock("@uiw/react-codemirror", () => ({
  __esModule: true,
  default: ({ value, onChange, placeholder, readOnly }: {
    value?: string;
    onChange?: (val: string) => void;
    placeholder?: string;
    readOnly?: boolean;
  }) => {
    const React = require("react");
    return React.createElement("textarea", {
      value: value || "",
      onChange: onChange ? (e: { target: { value: string } }) => onChange(e.target.value) : undefined,
      placeholder,
      readOnly,
      "data-testid": "codemirror",
    });
  },
}));

vi.mock("@codemirror/lang-json", () => ({ json: () => [] }));
vi.mock("@codemirror/lang-xml", () => ({ xml: () => [] }));
vi.mock("@codemirror/lang-yaml", () => ({ yaml: () => [] }));
vi.mock("@codemirror/lang-javascript", () => ({ javascript: () => [] }));
vi.mock("@codemirror/lang-css", () => ({ css: () => [] }));
vi.mock("@codemirror/view", () => ({
  EditorView: { lineWrapping: [], theme: () => [] },
}));
vi.mock("@codemirror/state", () => ({}));
