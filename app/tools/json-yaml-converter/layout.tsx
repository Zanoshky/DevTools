import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "JSON to YAML Converter",
  description: "Convert between JSON and YAML formats. Handles nested objects, arrays, and special characters.",
  slug: "json-yaml-converter",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
