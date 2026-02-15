import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "JSON to XML Converter",
  description: "Convert between JSON and XML formats with proper formatting and indentation.",
  slug: "json-xml-converter",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
