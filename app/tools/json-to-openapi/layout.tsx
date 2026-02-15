import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "JSON to OpenAPI Generator",
  description: "Generate OpenAPI 3.0 schema definitions from JSON examples. Create API documentation automatically.",
  slug: "json-to-openapi",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
