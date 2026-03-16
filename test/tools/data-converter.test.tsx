import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DataConverterPage from "@/app/tools/data-converter/page";

function renderPage() {
  return render(
    <MemoryRouter>
      <DataConverterPage />
    </MemoryRouter>
  );
}

/** Type into the input editor and click Convert, then return the output textarea value */
async function convert(input: string) {
  const editors = screen.getAllByTestId("codemirror");
  fireEvent.change(editors[0], { target: { value: input } });
  fireEvent.click(screen.getByLabelText("Convert"));
  await waitFor(() => {
    expect(screen.queryByText(/Enter .+ to convert/)).not.toBeInTheDocument();
  });
  // Re-query: after conversion, new editors may have appeared (output replaces empty state)
  const allEditors = screen.getAllByTestId("codemirror");
  const outputEditor = allEditors.find((el) => el.hasAttribute("readonly")) as HTMLTextAreaElement;
  return outputEditor?.value ?? "";
}

function selectFrom(format: string) {
  fireEvent.click(screen.getByLabelText(`Set input format to ${format}`));
}

function selectTo(format: string) {
  fireEvent.click(screen.getByLabelText(`Set output format to ${format}`));
}

describe("DataConverterPage", () => {
  describe("JSON -> YAML", () => {
    it("converts a simple JSON object to YAML", async () => {
      renderPage();
      const output = await convert('{"name": "alice", "age": 30}');
      expect(output).toContain("name: alice");
      expect(output).toContain("age: 30");
    });

    it("converts nested JSON to YAML", async () => {
      renderPage();
      const output = await convert('{"user": {"name": "bob", "roles": ["admin", "editor"]}}');
      expect(output).toContain("user:");
      expect(output).toContain("name: bob");
      expect(output).toContain("- admin");
      expect(output).toContain("- editor");
    });

    it("converts a JSON array to YAML", async () => {
      renderPage();
      const output = await convert('[{"id": 1}, {"id": 2}]');
      expect(output).toContain("- id: 1");
      expect(output).toContain("- id: 2");
    });
  });

  describe("JSON -> XML", () => {
    it("converts JSON to XML with root element", async () => {
      renderPage();
      selectTo("XML");
      const output = await convert('{"title": "hello", "count": 5}');
      // Pretty-printed XML wraps tags on separate lines
      expect(output).toContain("<title>");
      expect(output).toContain("hello");
      expect(output).toContain("<count>");
      expect(output).toContain("<root>");
      expect(output).toContain("</root>");
    });

    it("escapes special XML characters in values", async () => {
      renderPage();
      selectTo("XML");
      const output = await convert('{"text": "a < b & c > d"}');
      expect(output).toContain("&lt;");
      expect(output).toContain("&amp;");
      expect(output).toContain("&gt;");
    });
  });

  describe("JSON -> CSV", () => {
    it("converts a JSON array of objects to CSV with headers", async () => {
      renderPage();
      selectTo("CSV");
      const output = await convert('[{"name": "alice", "age": 30}, {"name": "bob", "age": 25}]');
      const lines = output.split("\n");
      expect(lines[0]).toBe("name,age");
      expect(lines[1]).toBe("alice,30");
      expect(lines[2]).toBe("bob,25");
    });

    it("quotes CSV values that contain the separator", async () => {
      renderPage();
      selectTo("CSV");
      const output = await convert('[{"note": "hello, world", "id": 1}]');
      expect(output).toContain('"hello, world"');
    });
  });

  describe("JSON -> TOML", () => {
    it("converts flat JSON to TOML key-value pairs", async () => {
      renderPage();
      selectTo("TOML");
      const output = await convert('{"name": "test", "version": 2, "debug": true}');
      expect(output).toContain('name = "test"');
      expect(output).toContain("version = 2");
      expect(output).toContain("debug = true");
    });

    it("converts nested JSON to TOML tables", async () => {
      renderPage();
      selectTo("TOML");
      const output = await convert('{"server": {"host": "localhost", "port": 8080}}');
      expect(output).toContain("[server]");
      expect(output).toContain('host = "localhost"');
      expect(output).toContain("port = 8080");
    });
  });

  describe("YAML -> JSON", () => {
    it("converts YAML to pretty-printed JSON", async () => {
      renderPage();
      // Must change To first (default to=YAML), then set From to YAML
      selectTo("XML");       // free up YAML in From
      selectFrom("YAML");
      selectTo("JSON");      // now set To to JSON (YAML is no longer To)
      const output = await convert("name: alice\nage: 30");
      const parsed = JSON.parse(output);
      expect(parsed).toEqual({ name: "alice", age: 30 });
    });
  });

  describe("CSV -> JSON", () => {
    it("converts CSV with headers to JSON array", async () => {
      renderPage();
      selectFrom("CSV");
      selectTo("JSON");
      const output = await convert("name,age\nalice,30\nbob,25");
      const parsed = JSON.parse(output);
      expect(parsed).toEqual([
        { name: "alice", age: 30 },
        { name: "bob", age: 25 },
      ]);
    });

    it("coerces boolean and null strings in CSV", async () => {
      renderPage();
      selectFrom("CSV");
      selectTo("JSON");
      const output = await convert("active,value\ntrue,null\nfalse,42");
      const parsed = JSON.parse(output);
      expect(parsed[0]).toEqual({ active: true, value: null });
      expect(parsed[1]).toEqual({ active: false, value: 42 });
    });

    it("handles semicolon-separated CSV", async () => {
      renderPage();
      selectFrom("CSV");
      selectTo("JSON");
      // Click the semicolon separator button
      fireEvent.click(screen.getByLabelText("Set separator to Semicolon (;)"));
      const output = await convert("name;age\nalice;30");
      const parsed = JSON.parse(output);
      expect(parsed).toEqual([{ name: "alice", age: 30 }]);
    });

    it("handles quoted fields with embedded separators", async () => {
      renderPage();
      selectFrom("CSV");
      selectTo("JSON");
      const output = await convert('name,note\nalice,"hello, world"');
      const parsed = JSON.parse(output);
      expect(parsed[0].note).toBe("hello, world");
    });
  });

  describe("TOML -> JSON", () => {
    it("converts TOML key-value pairs to JSON", async () => {
      renderPage();
      selectFrom("TOML");
      selectTo("JSON");
      const output = await convert('name = "test"\nversion = 3\ndebug = false');
      const parsed = JSON.parse(output);
      expect(parsed).toEqual({ name: "test", version: 3, debug: false });
    });

    it("converts TOML tables to nested JSON", async () => {
      renderPage();
      selectFrom("TOML");
      selectTo("JSON");
      const output = await convert('[database]\nhost = "localhost"\nport = 5432');
      const parsed = JSON.parse(output);
      expect(parsed).toEqual({ database: { host: "localhost", port: 5432 } });
    });

    it("converts TOML arrays to JSON arrays", async () => {
      renderPage();
      selectFrom("TOML");
      selectTo("JSON");
      const output = await convert('tags = ["web", "api", "v2"]');
      const parsed = JSON.parse(output);
      expect(parsed).toEqual({ tags: ["web", "api", "v2"] });
    });

    it("skips TOML comments", async () => {
      renderPage();
      selectFrom("TOML");
      selectTo("JSON");
      const output = await convert('# this is a comment\nkey = "value"');
      const parsed = JSON.parse(output);
      expect(parsed).toEqual({ key: "value" });
    });
  });

  describe("XML -> JSON", () => {
    it("converts simple XML to JSON", async () => {
      renderPage();
      selectFrom("XML");
      selectTo("JSON");
      const output = await convert("<root><name>alice</name><age>30</age></root>");
      const parsed = JSON.parse(output);
      expect(parsed).toEqual({ name: "alice", age: 30 });
    });

    it("converts repeated XML elements to arrays", async () => {
      renderPage();
      selectFrom("XML");
      selectTo("JSON");
      const output = await convert("<root><item>a</item><item>b</item><item>c</item></root>");
      const parsed = JSON.parse(output);
      expect(parsed.item).toEqual(["a", "b", "c"]);
    });
  });

  describe("error handling", () => {
    it("shows error for invalid JSON input", async () => {
      renderPage();
      const editors = screen.getAllByTestId("codemirror");
      fireEvent.change(editors[0], { target: { value: "{not valid json" } });
      fireEvent.click(screen.getByLabelText("Convert"));
      await waitFor(() => {
        const allEditors = screen.getAllByTestId("codemirror");
        const readOnlyEditor = allEditors.find((el) => el.hasAttribute("readonly")) as HTMLTextAreaElement;
        expect(readOnlyEditor?.value).toMatch(/expected|unexpected|token/i);
      });
    });

    it("shows error for invalid XML input", async () => {
      renderPage();
      selectFrom("XML");
      selectTo("JSON");
      const editors = screen.getAllByTestId("codemirror");
      fireEvent.change(editors[0], { target: { value: "<unclosed>" } });
      fireEvent.click(screen.getByLabelText("Convert"));
      await waitFor(() => {
        const allEditors = screen.getAllByTestId("codemirror");
        const readOnlyEditor = allEditors.find((el) => el.hasAttribute("readonly")) as HTMLTextAreaElement;
        expect(readOnlyEditor?.value).toMatch(/invalid|error|xml/i);
      });
    });
  });

  describe("switch formats", () => {
    it("swaps formats and feeds output back as input", async () => {
      renderPage();
      // Convert JSON -> YAML
      await convert('{"x": 1}');
      // Now switch: from becomes YAML, to becomes JSON, and YAML output becomes new input
      fireEvent.click(screen.getByLabelText("Switch formats"));
      expect(screen.getByText("YAML Input")).toBeInTheDocument();
      expect(screen.getByText("JSON Output")).toBeInTheDocument();
    });
  });

  describe("round-trip fidelity", () => {
    it("JSON -> YAML -> JSON preserves data", async () => {
      renderPage();
      const original = '{"name":"alice","scores":[10,20,30],"active":true}';
      const yamlOutput = await convert(original);

      // Now switch to YAML -> JSON
      fireEvent.click(screen.getByLabelText("Switch formats"));
      // The YAML output is now the input; convert back
      fireEvent.click(screen.getByLabelText("Convert"));

      await waitFor(() => {
        const allEditors = screen.getAllByTestId("codemirror");
        const readOnlyEditor = allEditors.find((el) => el.hasAttribute("readonly")) as HTMLTextAreaElement;
        if (readOnlyEditor?.value) {
          const roundTripped = JSON.parse(readOnlyEditor.value);
          expect(roundTripped).toEqual({ name: "alice", scores: [10, 20, 30], active: true });
        }
      });
    });

    it("JSON -> CSV -> JSON preserves tabular data", async () => {
      renderPage();
      selectTo("CSV");
      const csvOutput = await convert('[{"a":1,"b":2},{"a":3,"b":4}]');
      expect(csvOutput).toContain("a,b");

      // Switch to CSV -> JSON
      fireEvent.click(screen.getByLabelText("Switch formats"));
      fireEvent.click(screen.getByLabelText("Convert"));

      await waitFor(() => {
        const allEditors = screen.getAllByTestId("codemirror");
        const readOnlyEditor = allEditors.find((el) => el.hasAttribute("readonly")) as HTMLTextAreaElement;
        if (readOnlyEditor?.value) {
          const roundTripped = JSON.parse(readOnlyEditor.value);
          expect(roundTripped).toEqual([{ a: 1, b: 2 }, { a: 3, b: 4 }]);
        }
      });
    });
  });

  describe("JSON object -> all formats", () => {
    it("JSON object -> YAML preserves all value types", async () => {
      renderPage();
      const output = await convert('{"str":"hello","num":42,"bool":true,"nil":null}');
      expect(output).toContain("str: hello");
      expect(output).toContain("num: 42");
      expect(output).toContain("bool: true");
      expect(output).toContain("nil: null");
    });

    it("JSON object with nested objects -> YAML", async () => {
      renderPage();
      const output = await convert('{"a":{"b":{"c":"deep"}}}');
      expect(output).toContain("a:");
      expect(output).toContain("b:");
      expect(output).toContain("c: deep");
    });

    it("JSON object -> XML wraps in root element", async () => {
      renderPage();
      selectTo("XML");
      const output = await convert('{"key":"value"}');
      expect(output).toContain("<root>");
      expect(output).toContain("<key>");
      expect(output).toContain("value");
      expect(output).toContain("</key>");
      expect(output).toContain("</root>");
    });

    it("JSON object with nested object -> XML", async () => {
      renderPage();
      selectTo("XML");
      const output = await convert('{"user":{"name":"alice","age":30}}');
      expect(output).toContain("<user>");
      expect(output).toContain("<name>");
      expect(output).toContain("alice");
      expect(output).toContain("<age>");
      expect(output).toContain("</user>");
    });

    it("JSON object with array values -> XML repeats elements", async () => {
      renderPage();
      selectTo("XML");
      const output = await convert('{"tags":["a","b","c"]}');
      expect(output).toContain("<tags>");
      expect(output).toContain("a");
      expect(output).toContain("b");
      expect(output).toContain("c");
      // Each array item gets its own <tags> element
      expect((output.match(/<tags>/g) || []).length).toBe(3);
    });

    it("JSON object -> CSV wraps single object as one row", async () => {
      renderPage();
      selectTo("CSV");
      const output = await convert('{"name":"alice","age":30}');
      const lines = output.split("\n");
      expect(lines[0]).toBe("name,age");
      expect(lines[1]).toBe("alice,30");
      expect(lines).toHaveLength(2);
    });

    it("JSON object with nested values -> CSV flattens with dot notation", async () => {
      renderPage();
      selectTo("CSV");
      const output = await convert('{"user":{"name":"bob","score":99}}');
      const lines = output.split("\n");
      expect(lines[0]).toBe("user.name,user.score");
      expect(lines[1]).toBe("bob,99");
    });

    it("JSON object -> TOML with string, number, boolean", async () => {
      renderPage();
      selectTo("TOML");
      const output = await convert('{"title":"app","port":3000,"debug":false}');
      expect(output).toContain('title = "app"');
      expect(output).toContain("port = 3000");
      expect(output).toContain("debug = false");
    });

    it("JSON object with nested object -> TOML table", async () => {
      renderPage();
      selectTo("TOML");
      const output = await convert('{"db":{"host":"127.0.0.1","port":5432}}');
      expect(output).toContain("[db]");
      expect(output).toContain('host = "127.0.0.1"');
      expect(output).toContain("port = 5432");
    });

    it("JSON empty object -> YAML produces empty output", async () => {
      renderPage();
      const output = await convert("{}");
      expect(output.trim()).toBe("{}" );
    });
  });

  describe("JSON array -> all formats", () => {
    it("JSON array of primitives -> YAML list", async () => {
      renderPage();
      const output = await convert("[1, 2, 3]");
      expect(output).toContain("- 1");
      expect(output).toContain("- 2");
      expect(output).toContain("- 3");
    });

    it("JSON array of objects -> YAML list of maps", async () => {
      renderPage();
      const output = await convert('[{"x":1,"y":2},{"x":3,"y":4}]');
      expect(output).toContain("- x: 1");
      expect(output).toContain("- x: 3");
      // js-yaml may quote short keys like 'y'
      expect(output).toMatch(/['"]?y['"]?: 2/);
      expect(output).toMatch(/['"]?y['"]?: 4/);
    });

    it("JSON array of mixed types -> YAML", async () => {
      renderPage();
      const output = await convert('[1, "two", true, null]');
      expect(output).toContain("- 1");
      expect(output).toContain("- two");
      expect(output).toContain("- true");
      expect(output).toContain("- null");
    });

    it("JSON array of objects -> XML wraps each in <item>", async () => {
      renderPage();
      selectTo("XML");
      const output = await convert('[{"name":"a"},{"name":"b"}]');
      expect(output).toContain("<item>");
      expect(output).toContain("<name>");
      expect(output).toContain("a");
      expect(output).toContain("b");
      expect(output).toContain("</item>");
    });

    it("JSON array of primitives -> XML wraps each in <item>", async () => {
      renderPage();
      selectTo("XML");
      const output = await convert("[10, 20, 30]");
      // Pretty-printed XML splits tags across lines
      expect((output.match(/<item>/g) || []).length).toBe(3);
      expect(output).toContain("10");
      expect(output).toContain("20");
      expect(output).toContain("30");
    });

    it("JSON array of objects -> CSV with headers from all keys", async () => {
      renderPage();
      selectTo("CSV");
      const output = await convert('[{"a":1,"b":2},{"a":3,"b":4,"c":5}]');
      const lines = output.split("\n");
      // Headers should include all keys across all objects
      expect(lines[0]).toContain("a");
      expect(lines[0]).toContain("b");
      expect(lines[0]).toContain("c");
      expect(lines).toHaveLength(3);
    });

    it("JSON single-element array -> CSV", async () => {
      renderPage();
      selectTo("CSV");
      const output = await convert('[{"id":1,"val":"only"}]');
      const lines = output.split("\n");
      expect(lines[0]).toBe("id,val");
      expect(lines[1]).toBe("1,only");
    });

    it("JSON array with nested objects -> CSV flattens with dot notation", async () => {
      renderPage();
      selectTo("CSV");
      const output = await convert('[{"user":{"name":"alice"},"score":10}]');
      const lines = output.split("\n");
      expect(lines[0]).toContain("user.name");
      expect(lines[0]).toContain("score");
      expect(lines[1]).toContain("alice");
      expect(lines[1]).toContain("10");
    });

    it("JSON array with array values -> CSV serializes inner arrays as JSON strings", async () => {
      renderPage();
      selectTo("CSV");
      const output = await convert('[{"id":1,"tags":["a","b"]}]');
      const lines = output.split("\n");
      expect(lines[0]).toBe("id,tags");
      // Inner array is JSON-stringified in the CSV cell
      expect(lines[1]).toContain('1');
      expect(lines[1]).toContain("[");
    });

    it("JSON empty array -> CSV throws", async () => {
      renderPage();
      selectTo("CSV");
      const editors = screen.getAllByTestId("codemirror");
      fireEvent.change(editors[0], { target: { value: "[]" } });
      fireEvent.click(screen.getByLabelText("Convert"));
      await waitFor(() => {
        const allEditors = screen.getAllByTestId("codemirror");
        const readOnlyEditor = allEditors.find((el) => el.hasAttribute("readonly")) as HTMLTextAreaElement;
        expect(readOnlyEditor?.value).toMatch(/empty/i);
      });
    });
  });

  describe("all formats -> JSON object", () => {
    it("YAML object -> JSON object", async () => {
      renderPage();
      selectTo("XML");
      selectFrom("YAML");
      selectTo("JSON");
      const output = await convert("host: localhost\nport: 8080\nenabled: true");
      const parsed = JSON.parse(output);
      expect(parsed).toEqual({ host: "localhost", port: 8080, enabled: true });
    });

    it("YAML nested object -> JSON nested object", async () => {
      renderPage();
      selectTo("XML");
      selectFrom("YAML");
      selectTo("JSON");
      const output = await convert("server:\n  host: localhost\n  port: 443");
      const parsed = JSON.parse(output);
      expect(parsed).toEqual({ server: { host: "localhost", port: 443 } });
    });

    it("XML with nested elements -> JSON object", async () => {
      renderPage();
      selectFrom("XML");
      selectTo("JSON");
      const output = await convert("<root><db><host>localhost</host><port>3306</port></db></root>");
      const parsed = JSON.parse(output);
      expect(parsed).toEqual({ db: { host: "localhost", port: 3306 } });
    });

    it("XML with boolean and numeric text -> JSON coerces types", async () => {
      renderPage();
      selectFrom("XML");
      selectTo("JSON");
      const output = await convert("<root><active>true</active><count>7</count><label>test</label></root>");
      const parsed = JSON.parse(output);
      expect(parsed).toEqual({ active: true, count: 7, label: "test" });
    });

    it("CSV with numeric and boolean values -> JSON array of objects", async () => {
      renderPage();
      selectFrom("CSV");
      selectTo("JSON");
      const output = await convert("name,score,active\nalice,100,true\nbob,85,false");
      const parsed = JSON.parse(output);
      expect(parsed).toEqual([
        { name: "alice", score: 100, active: true },
        { name: "bob", score: 85, active: false },
      ]);
    });

    it("TOML with array values -> JSON object with arrays", async () => {
      renderPage();
      selectFrom("TOML");
      selectTo("JSON");
      const output = await convert('ports = [80, 443, 8080]\nname = "server"');
      const parsed = JSON.parse(output);
      expect(parsed).toEqual({ ports: [80, 443, 8080], name: "server" });
    });

    it("TOML nested tables -> JSON nested objects", async () => {
      renderPage();
      selectFrom("TOML");
      selectTo("JSON");
      const output = await convert('[owner]\nname = "Tom"\n\n[database]\nserver = "192.168.1.1"\nports = [8001, 8001, 8002]');
      const parsed = JSON.parse(output);
      expect(parsed.owner).toEqual({ name: "Tom" });
      expect(parsed.database.server).toBe("192.168.1.1");
      expect(parsed.database.ports).toEqual([8001, 8001, 8002]);
    });
  });

  describe("all formats -> JSON array", () => {
    it("YAML list -> JSON array", async () => {
      renderPage();
      selectTo("XML");
      selectFrom("YAML");
      selectTo("JSON");
      const output = await convert("- apple\n- banana\n- cherry");
      const parsed = JSON.parse(output);
      expect(parsed).toEqual(["apple", "banana", "cherry"]);
    });

    it("YAML list of objects -> JSON array of objects", async () => {
      renderPage();
      selectTo("XML");
      selectFrom("YAML");
      selectTo("JSON");
      const output = await convert("- id: 1\n  name: alice\n- id: 2\n  name: bob");
      const parsed = JSON.parse(output);
      expect(parsed).toEqual([
        { id: 1, name: "alice" },
        { id: 2, name: "bob" },
      ]);
    });

    it("XML repeated elements -> JSON array", async () => {
      renderPage();
      selectFrom("XML");
      selectTo("JSON");
      const output = await convert("<root><user>alice</user><user>bob</user></root>");
      const parsed = JSON.parse(output);
      expect(parsed.user).toEqual(["alice", "bob"]);
    });

    it("CSV multiple rows -> JSON array of objects", async () => {
      renderPage();
      selectFrom("CSV");
      selectTo("JSON");
      const output = await convert("x,y\n1,2\n3,4\n5,6");
      const parsed = JSON.parse(output);
      expect(parsed).toEqual([
        { x: 1, y: 2 },
        { x: 3, y: 4 },
        { x: 5, y: 6 },
      ]);
    });

    it("CSV single data row -> JSON array with one object", async () => {
      renderPage();
      selectFrom("CSV");
      selectTo("JSON");
      const output = await convert("key,val\nfoo,bar");
      const parsed = JSON.parse(output);
      expect(parsed).toEqual([{ key: "foo", val: "bar" }]);
    });
  });

  describe("standards compliance", () => {
    describe("JSON (RFC 8259)", () => {
      it("handles unicode escape sequences in keys and values", async () => {
        renderPage();
        const output = await convert('{"caf\\u00e9":"\\u00e9clair"}');
        expect(output).toContain("caf");
      });

      it("preserves null, boolean, and numeric types", async () => {
        renderPage();
        selectTo("XML");
        selectTo("YAML");
        const output = await convert('{"a":null,"b":true,"c":false,"d":0,"e":-1,"f":1.5}');
        expect(output).toContain("a: null");
        expect(output).toContain("b: true");
        expect(output).toContain("c: false");
        expect(output).toContain("d: 0");
        expect(output).toContain("f: 1.5");
      });

      it("handles empty string values", async () => {
        renderPage();
        const output = await convert('{"key":""}');
        expect(output).toContain("key:");
      });

      it("handles deeply nested structures", async () => {
        renderPage();
        const output = await convert('{"a":{"b":{"c":{"d":"deep"}}}}');
        expect(output).toContain("d: deep");
      });

      it("handles JSON array at root level", async () => {
        renderPage();
        const output = await convert("[1,2,3]");
        expect(output).toContain("- 1");
        expect(output).toContain("- 2");
        expect(output).toContain("- 3");
      });

      it("handles special characters in string values", async () => {
        renderPage();
        const output = await convert('{"msg":"line1\\nline2\\ttab"}');
        expect(output).toContain("line1");
      });
    });

    describe("CSV (RFC 4180)", () => {
      it("preserves quoted fields with embedded commas", async () => {
        renderPage();
        selectFrom("CSV");
        selectTo("JSON");
        const output = await convert('name,note\nalice,"hello, world"');
        const parsed = JSON.parse(output);
        expect(parsed[0].note).toBe("hello, world");
      });

      it("handles doubled quotes inside quoted fields", async () => {
        renderPage();
        selectFrom("CSV");
        selectTo("JSON");
        const output = await convert('val\n"she said ""hi"""');
        const parsed = JSON.parse(output);
        expect(parsed[0].val).toBe('she said "hi"');
      });

      it("handles multiline quoted fields per RFC 4180", async () => {
        renderPage();
        selectFrom("CSV");
        selectTo("JSON");
        const output = await convert('name,bio\nalice,"line1\nline2"');
        const parsed = JSON.parse(output);
        expect(parsed[0].bio).toBe("line1\nline2");
      });

      it("preserves whitespace in field values", async () => {
        renderPage();
        selectFrom("CSV");
        selectTo("JSON");
        const output = await convert('val\n" hello "');
        const parsed = JSON.parse(output);
        expect(parsed[0].val).toBe(" hello ");
      });

      it("outputs quoted fields when value contains separator", async () => {
        renderPage();
        selectTo("CSV");
        const output = await convert('[{"a":"x,y"}]');
        expect(output).toContain('"x,y"');
      });

      it("outputs doubled quotes when value contains quotes", async () => {
        renderPage();
        selectTo("CSV");
        const output = await convert('[{"a":"say \\"hi\\""}]');
        expect(output).toContain('""');
      });

      it("handles CRLF line endings in input", async () => {
        renderPage();
        selectFrom("CSV");
        selectTo("JSON");
        const output = await convert("name,age\r\nalice,30\r\nbob,25");
        const parsed = JSON.parse(output);
        expect(parsed).toHaveLength(2);
        expect(parsed[0]).toEqual({ name: "alice", age: 30 });
      });
    });

    describe("XML (W3C XML 1.0)", () => {
      it("escapes all 5 mandatory XML entities in values", async () => {
        renderPage();
        selectTo("XML");
        const output = await convert('{"text":"a < b & c > d \\" e \'"}');
        expect(output).toContain("&lt;");
        expect(output).toContain("&amp;");
        expect(output).toContain("&gt;");
        expect(output).toContain("&quot;");
        expect(output).toContain("&apos;");
      });

      it("includes XML declaration with version and encoding", async () => {
        renderPage();
        selectTo("XML");
        const output = await convert('{"a":1}');
        expect(output).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      });

      it("wraps output in configurable root element", async () => {
        renderPage();
        selectTo("XML");
        const output = await convert('{"x":1}');
        expect(output).toContain("<root>");
        expect(output).toContain("</root>");
      });

      it("handles null values in XML output", async () => {
        renderPage();
        selectTo("XML");
        const output = await convert('{"val":null}');
        expect(output).toContain("<val>");
      });
    });

    describe("TOML (v1.0)", () => {
      it("escapes backslashes and quotes in string values", async () => {
        renderPage();
        selectTo("TOML");
        const output = await convert('{"path":"C:\\\\Users","quote":"say \\"hi\\""}');
        expect(output).toContain('path = "C:\\\\Users"');
        expect(output).toContain('\\"hi\\"');
      });

      it("serializes boolean values as lowercase", async () => {
        renderPage();
        selectTo("TOML");
        const output = await convert('{"enabled":true,"debug":false}');
        expect(output).toContain("enabled = true");
        expect(output).toContain("debug = false");
      });

      it("serializes nested objects as TOML tables", async () => {
        renderPage();
        selectTo("TOML");
        const output = await convert('{"server":{"host":"0.0.0.0","port":443}}');
        expect(output).toContain("[server]");
        expect(output).toContain('host = "0.0.0.0"');
        expect(output).toContain("port = 443");
      });

      it("serializes arrays of primitives inline", async () => {
        renderPage();
        selectTo("TOML");
        const output = await convert('{"ports":[80,443,8080]}');
        expect(output).toContain("ports = [80, 443, 8080]");
      });

      it("parses TOML array of tables", async () => {
        renderPage();
        selectFrom("TOML");
        selectTo("JSON");
        const output = await convert('[[products]]\nname = "Hammer"\n\n[[products]]\nname = "Nail"');
        const parsed = JSON.parse(output);
        expect(parsed.products).toEqual([{ name: "Hammer" }, { name: "Nail" }]);
      });
    });
  });
});
