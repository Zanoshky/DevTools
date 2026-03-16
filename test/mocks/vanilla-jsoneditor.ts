/// Mock for vanilla-jsoneditor used by JSON Editor page
import { vi } from "vitest";

vi.mock("vanilla-jsoneditor", () => ({
  Mode: { text: "text", tree: "tree" },
  JSONEditor: vi.fn(),
}));

vi.mock("@/components/VanillaJSONEditor", () => ({
  __esModule: true,
  default: () => {
    const React = require("react");
    return React.createElement("div", { "data-testid": "vanilla-json-editor" }, "JSON Editor");
  },
}));
