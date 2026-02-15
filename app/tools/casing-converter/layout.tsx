import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "JSON Casing Converter",
  description: "Convert JSON key casing between camelCase, snake_case, PascalCase, kebab-case, and more.",
  slug: "casing-converter",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
