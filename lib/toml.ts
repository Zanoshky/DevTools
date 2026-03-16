// Robust TOML parser supporting:
// - Comments (# inline and full-line)
// - Basic strings ("..."), literal strings ('...')
// - Multi-line basic strings ("""..."""), multi-line literal strings ('''...''')
// - Integers (decimal, hex 0x, octal 0o, binary 0b, underscores)
// - Floats (decimal, exponent, inf, nan)
// - Booleans
// - Datetimes (offset, local, date-only, time-only)
// - Arrays
// - Inline tables
// - Standard tables [a.b.c] with dotted keys
// - Array of tables [[a.b]]
// - Dotted keys in key/value pairs

type TOMLValue = string | number | boolean | TOMLValue[] | TOMLTable;
interface TOMLTable {
  [key: string]: TOMLValue;
}

class TOMLParser {
  private input: string;
  private pos: number;
  private root: TOMLTable;
  private currentTable: TOMLTable;
  private implicitTables: Set<TOMLTable>;
  private arrayTables: Map<string, TOMLTable[]>;

  constructor(input: string) {
    this.input = input;
    this.pos = 0;
    this.root = {};
    this.currentTable = this.root;
    this.implicitTables = new Set();
    this.arrayTables = new Map();
  }

  parse(): TOMLTable {
    while (this.pos < this.input.length) {
      this.skipWhitespaceAndNewlines();
      if (this.pos >= this.input.length) break;

      const ch = this.input[this.pos];
      if (ch === "#") {
        this.skipComment();
      } else if (ch === "[") {
        this.parseTableHeader();
      } else if (ch === "\n" || ch === "\r") {
        this.pos++;
      } else {
        this.parseKeyValue(this.currentTable);
        this.skipWhitespace();
        if (this.pos < this.input.length && this.input[this.pos] === "#") {
          this.skipComment();
        }
      }
    }
    return this.root;
  }

  private peek(): string {
    return this.input[this.pos] ?? "";
  }

  private advance(): string {
    return this.input[this.pos++] ?? "";
  }

  private skipWhitespace(): void {
    while (this.pos < this.input.length && (this.input[this.pos] === " " || this.input[this.pos] === "\t")) {
      this.pos++;
    }
  }

  private skipWhitespaceAndNewlines(): void {
    while (this.pos < this.input.length) {
      const ch = this.input[this.pos];
      if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
        this.pos++;
      } else if (ch === "#") {
        this.skipComment();
      } else {
        break;
      }
    }
  }

  private skipComment(): void {
    while (this.pos < this.input.length && this.input[this.pos] !== "\n") {
      this.pos++;
    }
  }

  private expectNewlineOrEOF(): void {
    this.skipWhitespace();
    if (this.pos < this.input.length && this.input[this.pos] === "#") {
      this.skipComment();
    }
    if (this.pos < this.input.length && this.input[this.pos] !== "\n" && this.input[this.pos] !== "\r") {
      throw new Error(`Expected newline or EOF at position ${this.pos}`);
    }
    if (this.pos < this.input.length) this.pos++;
  }

  // --- Key parsing ---

  private parseKey(): string[] {
    const keys: string[] = [];
    keys.push(this.parseSimpleKey());
    while (this.pos < this.input.length && this.input[this.pos] === ".") {
      this.pos++; // skip dot
      this.skipWhitespace();
      keys.push(this.parseSimpleKey());
      this.skipWhitespace();
    }
    return keys;
  }

  private parseSimpleKey(): string {
    this.skipWhitespace();
    const ch = this.peek();
    if (ch === '"') return this.parseBasicString();
    if (ch === "'") return this.parseLiteralString();
    return this.parseBareKey();
  }

  private parseBareKey(): string {
    const start = this.pos;
    while (this.pos < this.input.length && /[A-Za-z0-9_-]/.test(this.input[this.pos])) {
      this.pos++;
    }
    if (this.pos === start) throw new Error(`Expected key at position ${this.pos}`);
    return this.input.slice(start, this.pos);
  }

  // --- String parsing ---

  private parseBasicString(): string {
    this.pos++; // skip opening "
    if (this.input[this.pos] === '"' && this.input[this.pos + 1] === '"') {
      this.pos += 2; // skip remaining ""
      return this.parseMultiLineBasicString();
    }
    let result = "";
    while (this.pos < this.input.length) {
      const ch = this.advance();
      if (ch === '"') return result;
      if (ch === "\\") {
        result += this.parseEscapeSequence();
      } else {
        result += ch;
      }
    }
    throw new Error("Unterminated basic string");
  }

  private parseMultiLineBasicString(): string {
    // Skip first newline if immediately after opening
    if (this.input[this.pos] === "\n") this.pos++;
    else if (this.input[this.pos] === "\r" && this.input[this.pos + 1] === "\n") this.pos += 2;

    let result = "";
    while (this.pos < this.input.length) {
      if (this.input[this.pos] === '"' && this.input[this.pos + 1] === '"' && this.input[this.pos + 2] === '"') {
        this.pos += 3;
        return result;
      }
      if (this.input[this.pos] === "\\") {
        this.pos++;
        // Line-ending backslash: trim whitespace and newlines
        if (this.input[this.pos] === "\n" || this.input[this.pos] === "\r") {
          while (this.pos < this.input.length && /[\s]/.test(this.input[this.pos])) this.pos++;
        } else {
          result += this.parseEscapeSequence();
        }
      } else {
        result += this.advance();
      }
    }
    throw new Error("Unterminated multi-line basic string");
  }

  private parseLiteralString(): string {
    this.pos++; // skip opening '
    if (this.input[this.pos] === "'" && this.input[this.pos + 1] === "'") {
      this.pos += 2;
      return this.parseMultiLineLiteralString();
    }
    let result = "";
    while (this.pos < this.input.length) {
      const ch = this.advance();
      if (ch === "'") return result;
      result += ch;
    }
    throw new Error("Unterminated literal string");
  }

  private parseMultiLineLiteralString(): string {
    if (this.input[this.pos] === "\n") this.pos++;
    else if (this.input[this.pos] === "\r" && this.input[this.pos + 1] === "\n") this.pos += 2;

    let result = "";
    while (this.pos < this.input.length) {
      if (this.input[this.pos] === "'" && this.input[this.pos + 1] === "'" && this.input[this.pos + 2] === "'") {
        this.pos += 3;
        return result;
      }
      result += this.advance();
    }
    throw new Error("Unterminated multi-line literal string");
  }

  private parseEscapeSequence(): string {
    const ch = this.advance();
    switch (ch) {
      case "b": return "\b";
      case "t": return "\t";
      case "n": return "\n";
      case "f": return "\f";
      case "r": return "\r";
      case '"': return '"';
      case "\\": return "\\";
      case "u": {
        const hex = this.input.slice(this.pos, this.pos + 4);
        this.pos += 4;
        return String.fromCodePoint(parseInt(hex, 16));
      }
      case "U": {
        const hex = this.input.slice(this.pos, this.pos + 8);
        this.pos += 8;
        return String.fromCodePoint(parseInt(hex, 16));
      }
      default: return "\\" + ch;
    }
  }

  // --- Value parsing ---

  private parseValue(): TOMLValue {
    this.skipWhitespace();
    const ch = this.peek();

    if (ch === '"') return this.parseBasicString();
    if (ch === "'") return this.parseLiteralString();
    if (ch === "t" || ch === "f") return this.parseBoolean();
    if (ch === "[") return this.parseArray();
    if (ch === "{") return this.parseInlineTable();

    // Number or datetime
    return this.parseNumberOrDatetime();
  }

  private parseBoolean(): boolean {
    if (this.input.startsWith("true", this.pos)) {
      this.pos += 4;
      return true;
    }
    if (this.input.startsWith("false", this.pos)) {
      this.pos += 5;
      return false;
    }
    throw new Error(`Expected boolean at position ${this.pos}`);
  }

  private parseArray(): TOMLValue[] {
    this.pos++; // skip [
    const arr: TOMLValue[] = [];
    this.skipWhitespaceAndNewlines();
    if (this.peek() === "]") { this.pos++; return arr; }

    arr.push(this.parseValue());
    this.skipWhitespaceAndNewlines();

    while (this.peek() === ",") {
      this.pos++;
      this.skipWhitespaceAndNewlines();
      if (this.peek() === "]") break;
      arr.push(this.parseValue());
      this.skipWhitespaceAndNewlines();
    }

    if (this.peek() !== "]") throw new Error(`Expected ] at position ${this.pos}`);
    this.pos++;
    return arr;
  }

  private parseInlineTable(): TOMLTable {
    this.pos++; // skip {
    const table: TOMLTable = {};
    this.skipWhitespace();
    if (this.peek() === "}") { this.pos++; return table; }

    this.parseKeyValue(table);
    this.skipWhitespace();

    while (this.peek() === ",") {
      this.pos++;
      this.skipWhitespace();
      if (this.peek() === "}") break;
      this.parseKeyValue(table);
      this.skipWhitespace();
    }

    if (this.peek() !== "}") throw new Error(`Expected } at position ${this.pos}`);
    this.pos++;
    return table;
  }

  private parseNumberOrDatetime(): TOMLValue {
    const start = this.pos;
    // Collect the raw token until delimiter
    while (this.pos < this.input.length && !/[\s,\]}\n\r#]/.test(this.input[this.pos])) {
      this.pos++;
    }
    const raw = this.input.slice(start, this.pos);
    if (!raw) throw new Error(`Expected value at position ${start}`);

    // Special float values
    if (raw === "inf" || raw === "+inf") return Infinity;
    if (raw === "-inf") return -Infinity;
    if (raw === "nan" || raw === "+nan" || raw === "-nan") return NaN;

    // Datetime patterns - return as string
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw;
    if (/^\d{2}:\d{2}/.test(raw)) return raw;

    // Strip underscores for numeric parsing
    const cleaned = raw.replace(/_/g, "");

    // Hex
    if (/^[+-]?0x[0-9a-fA-F]+$/.test(cleaned)) return parseInt(cleaned, 16);
    // Octal
    if (/^[+-]?0o[0-7]+$/.test(cleaned)) return parseInt(cleaned.replace("0o", ""), 8);
    // Binary
    if (/^[+-]?0b[01]+$/.test(cleaned)) return parseInt(cleaned.replace("0b", ""), 2);
    // Float (has dot or exponent)
    if (/^[+-]?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(cleaned) && (/\./.test(cleaned) || /[eE]/.test(cleaned))) {
      return parseFloat(cleaned);
    }
    // Integer
    if (/^[+-]?\d+$/.test(cleaned)) return parseInt(cleaned, 10);

    // Fallback - return as string
    return raw;
  }

  // --- Table headers ---

  private parseTableHeader(): void {
    this.pos++; // skip first [
    const isArrayTable = this.peek() === "[";
    if (isArrayTable) this.pos++; // skip second [

    this.skipWhitespace();
    const keys = this.parseKey();
    this.skipWhitespace();

    if (isArrayTable) {
      if (this.peek() !== "]" || this.input[this.pos + 1] !== "]") {
        throw new Error(`Expected ]] at position ${this.pos}`);
      }
      this.pos += 2;
    } else {
      if (this.peek() !== "]") throw new Error(`Expected ] at position ${this.pos}`);
      this.pos++;
    }

    this.expectNewlineOrEOF();

    if (isArrayTable) {
      this.handleArrayTable(keys);
    } else {
      this.handleStandardTable(keys);
    }
  }

  private resolveOrCreateTable(keys: string[], allowImplicit: boolean): TOMLTable {
    let table = this.root;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (!(key in table)) {
        const newTable: TOMLTable = {};
        table[key] = newTable;
        if (allowImplicit) this.implicitTables.add(newTable);
        table = newTable;
      } else {
        const existing = table[key];
        if (Array.isArray(existing)) {
          // Navigate into the last element of an array of tables
          table = existing[existing.length - 1] as TOMLTable;
        } else if (typeof existing === "object" && existing !== null) {
          table = existing as TOMLTable;
        } else {
          throw new Error(`Key "${keys.slice(0, i + 1).join(".")}" already exists as a non-table value`);
        }
      }
    }
    return table;
  }

  private handleStandardTable(keys: string[]): void {
    // Navigate/create parent tables as implicit
    const parentKeys = keys.slice(0, -1);
    const lastKey = keys[keys.length - 1];
    const parent = this.resolveOrCreateTable(parentKeys, true);

    if (lastKey in parent) {
      const existing = parent[lastKey];
      if (typeof existing === "object" && existing !== null && !Array.isArray(existing)) {
        if (!this.implicitTables.has(existing as TOMLTable)) {
          // Table was already explicitly defined - TOML spec says this is an error,
          // but we allow it for lenient parsing (last definition wins for new keys)
        }
        this.implicitTables.delete(existing as TOMLTable);
        this.currentTable = existing as TOMLTable;
        return;
      }
    }

    const newTable: TOMLTable = {};
    parent[lastKey] = newTable;
    this.currentTable = newTable;
  }

  private handleArrayTable(keys: string[]): void {
    const parentKeys = keys.slice(0, -1);
    const lastKey = keys[keys.length - 1];
    const parent = this.resolveOrCreateTable(parentKeys, true);

    const pathStr = keys.join(".");
    if (!this.arrayTables.has(pathStr)) {
      this.arrayTables.set(pathStr, []);
      parent[lastKey] = [];
    }

    const newTable: TOMLTable = {};
    const arr = parent[lastKey];
    if (Array.isArray(arr)) {
      arr.push(newTable);
      this.arrayTables.get(pathStr)?.push(newTable);
    }
    this.currentTable = newTable;
  }

  // --- Key/value assignment ---

  private parseKeyValue(table: TOMLTable): void {
    const keys = this.parseKey();
    this.skipWhitespace();
    if (this.peek() !== "=") throw new Error(`Expected = at position ${this.pos}`);
    this.pos++;
    this.skipWhitespace();
    const value = this.parseValue();

    // Handle dotted keys: a.b.c = val -> nested tables
    let target = table;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in target)) {
        const sub: TOMLTable = {};
        target[k] = sub;
        target = sub;
      } else {
        const existing = target[k];
        if (typeof existing === "object" && existing !== null && !Array.isArray(existing)) {
          target = existing as TOMLTable;
        } else {
          throw new Error(`Key "${k}" is not a table`);
        }
      }
    }
    target[keys[keys.length - 1]] = value;
  }
}

// --- TOML Serializer ---

function serializeTOMLValue(value: TOMLValue): string {
  if (typeof value === "string") return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\t/g, "\\t")}"`;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (Object.is(value, Infinity)) return "inf";
    if (Object.is(value, -Infinity)) return "-inf";
    if (Number.isNaN(value)) return "nan";
    return String(value);
  }
  if (Array.isArray(value)) {
    // Check if array of tables
    if (value.length > 0 && value.every((v) => typeof v === "object" && v !== null && !Array.isArray(v))) {
      // Handled separately in serializeTOML
      return `[${value.map(serializeTOMLValue).join(", ")}]`;
    }
    return `[${value.map(serializeTOMLValue).join(", ")}]`;
  }
  if (typeof value === "object" && value !== null) {
    // Inline table
    const entries = Object.entries(value as TOMLTable)
      .map(([k, v]) => `${k} = ${serializeTOMLValue(v)}`)
      .join(", ");
    return `{ ${entries} }`;
  }
  return String(value);
}

function serializeTOMLSection(obj: TOMLTable, prefix: string, lines: string[]): void {
  const simple: [string, TOMLValue][] = [];
  const tables: [string, TOMLTable][] = [];
  const arrayTables: [string, TOMLTable[]][] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === "object" && v !== null && !Array.isArray(v))) {
      arrayTables.push([key, value as TOMLTable[]]);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      tables.push([key, value as TOMLTable]);
    } else {
      simple.push([key, value]);
    }
  }

  for (const [key, value] of simple) {
    lines.push(`${key} = ${serializeTOMLValue(value)}`);
  }

  for (const [key, table] of tables) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    lines.push("");
    lines.push(`[${fullKey}]`);
    serializeTOMLSection(table, fullKey, lines);
  }

  for (const [key, arr] of arrayTables) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    for (const table of arr) {
      lines.push("");
      lines.push(`[[${fullKey}]]`);
      serializeTOMLSection(table, fullKey, lines);
    }
  }
}

// --- Public API ---

export function parseTOML(input: string): Record<string, unknown> {
  return new TOMLParser(input).parse();
}

export function serializeTOML(obj: Record<string, unknown>): string {
  const lines: string[] = [];
  serializeTOMLSection(obj as TOMLTable, "", lines);
  return lines.join("\n");
}
