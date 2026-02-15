import type { MetadataRoute } from "next";

const tools = [
  "base64",
  "casing-converter",
  "color-hex-converter",
  "color-palette-generator",
  "color-scheme-designer",
  "cron-builder",
  "curl-hurl-converter",
  "data-visualizer",
  "har-analyzer",
  "hash",
  "json-compare",
  "json-csv-converter",
  "json-editor",
  "json-to-code",
  "json-to-openapi",
  "json-xml-converter",
  "json-yaml-converter",
  "jwt",
  "otp-generator",
  "password-generator",
  "payload-calculator",
  "random-data-generator",
  "regex-validator",
  "timer",
  "timestamp-converter",
  "timestamp-mongo",
  "url-encoder",
  "uuid",
  "validator-csv",
  "validator-json",
  "validator-xml",
  "validator-yaml",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const toolEntries = tools.map((tool) => ({
    url: `https://devtoolbox.co/tools/${tool}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: "https://devtoolbox.co",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://devtoolbox.co/privacy",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...toolEntries,
  ];
}
