import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "JSON to CSV Converter",
  description: "Convert between JSON and CSV formats. Flatten nested objects and handle arrays automatically.",
  slug: "json-csv-converter",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
