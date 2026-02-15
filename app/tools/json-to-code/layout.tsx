import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "JSON to Code Generator",
  description: "Convert JSON to TypeScript interfaces, Go structs, Python dataclasses, and more programming languages.",
  slug: "json-to-code",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
