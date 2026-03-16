type ToolMeta = {
  title: string;
  description: string;
  slug: string;
};

export type ToolMetadata = {
  fullTitle: string;
  description: string;
  slug: string;
};

export function generateToolMetadata({ title, description, slug }: ToolMeta): ToolMetadata {
  const fullTitle = `${title} - Free Online Tool`;
  return {
    fullTitle,
    description: `${description} Free, privacy-first, 100% client-side. No data leaves your browser.`,
    slug,
  };
}

// All tool metadata in one place
export const toolMetadataMap: Record<string, ToolMetadata> = {
  "base64": generateToolMetadata({ title: "Base64 Encoder & Decoder", description: "Encode and decode Base64 strings with full UTF-8 support. Convert text to Base64 and back instantly.", slug: "base64" }),
  "casing-converter": generateToolMetadata({ title: "JSON Casing Converter", description: "Convert JSON key casing between camelCase, snake_case, PascalCase, and more.", slug: "casing-converter" }),
  "color-hex-converter": generateToolMetadata({ title: "Color Hex / RGB / HSL Converter", description: "Convert between Hex, RGB, and HSL color formats instantly.", slug: "color-hex-converter" }),
  "color-palette-generator": generateToolMetadata({ title: "Color Palette Generator", description: "Generate beautiful color palettes for your projects.", slug: "color-palette-generator" }),
  "color-scheme-designer": generateToolMetadata({ title: "Color Scheme Designer", description: "Design harmonious color schemes for UI and web projects.", slug: "color-scheme-designer" }),
  "cron-builder": generateToolMetadata({ title: "Cron Expression Builder", description: "Build and validate cron expressions with a visual interface.", slug: "cron-builder" }),
  "curl-hurl-converter": generateToolMetadata({ title: "cURL to Hurl Converter", description: "Convert cURL commands to Hurl format and vice versa.", slug: "curl-hurl-converter" }),
  "data-converter": generateToolMetadata({ title: "Data Converter", description: "Convert between JSON, XML, CSV, YAML, and TOML formats in one place.", slug: "data-converter" }),
  "data-visualizer": generateToolMetadata({ title: "Data Visualizer", description: "Visualize CSV and JSON data with interactive charts.", slug: "data-visualizer" }),
  "har-analyzer": generateToolMetadata({ title: "HAR File Analyzer", description: "Analyze HTTP Archive (HAR) files with performance insights and request details.", slug: "har-analyzer" }),
  "hash": generateToolMetadata({ title: "Hash Generator", description: "Generate MD5, SHA-1, SHA-256, SHA-512, and CRC32 hashes.", slug: "hash" }),
  "json-compare": generateToolMetadata({ title: "Data Compare & Diff", description: "Compare JSON, YAML, or plain text side by side with detailed diff view.", slug: "json-compare" }),

  "json-editor": generateToolMetadata({ title: "JSON Editor", description: "Edit, format, filter, sort, and transform JSON data.", slug: "json-editor" }),
  "json-to-code": generateToolMetadata({ title: "JSON to Code Generator", description: "Convert JSON to TypeScript, Python, Go, and more.", slug: "json-to-code" }),
  "key-generator": generateToolMetadata({ title: "Key Generator & Encryptor", description: "Generate RSA, EC, Ed25519, and ML-KEM key pairs with encrypt/decrypt support.", slug: "key-generator" }),
  "json-to-openapi": generateToolMetadata({ title: "JSON to OpenAPI Generator", description: "Generate OpenAPI specifications from JSON examples.", slug: "json-to-openapi" }),

  "jwt": generateToolMetadata({ title: "JWT Decoder & Encoder", description: "Decode and encode JSON Web Tokens. Inspect headers, payloads, expiration, and sign tokens with HMAC algorithms.", slug: "jwt" }),
  "otp-generator": generateToolMetadata({ title: "OTP Authenticator", description: "Generate TOTP, HOTP, and Steam Guard codes locally.", slug: "otp-generator" }),
  "password-generator": generateToolMetadata({ title: "Password Generator", description: "Generate strong, secure passwords with customizable options.", slug: "password-generator" }),
  "payload-calculator": generateToolMetadata({ title: "Payload Size Calculator", description: "Calculate payload size and estimate transfer times.", slug: "payload-calculator" }),
  "random-data-generator": generateToolMetadata({ title: "Random Data Generator", description: "Generate realistic test data for development.", slug: "random-data-generator" }),
  "regex-validator": generateToolMetadata({ title: "Regex Validator & Tester", description: "Test and validate regular expressions with real-time matching.", slug: "regex-validator" }),
  "text-sorter": generateToolMetadata({ title: "Text Line Sorter & Deduplicator", description: "Sort lines, remove duplicates, trim whitespace, and filter empty lines.", slug: "text-sorter" }),
  "timer": generateToolMetadata({ title: "Timer & Stopwatch", description: "Stopwatch and countdown timer for developers.", slug: "timer" }),
  "timestamp-converter": generateToolMetadata({ title: "Timestamp / Epoch Converter", description: "Convert between UNIX timestamps and human-readable dates.", slug: "timestamp-converter" }),
  "timestamp-mongo": generateToolMetadata({ title: "MongoDB ObjectId Timestamp", description: "Extract and convert timestamps from MongoDB ObjectIds.", slug: "timestamp-mongo" }),
  "url-encoder": generateToolMetadata({ title: "URL Encoder & Decoder", description: "Encode and decode URL components.", slug: "url-encoder" }),
  "uuid": generateToolMetadata({ title: "UUID Generator & Validator", description: "Generate and validate UUIDs (v1, v4, v7).", slug: "uuid" }),
  "validator-json": generateToolMetadata({ title: "Data Validator", description: "Validate JSON, YAML, XML, CSV, and TOML with detailed error reporting, statistics, and formatting.", slug: "validator-json" }),
};
