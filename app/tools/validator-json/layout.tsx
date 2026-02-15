import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "JSON Validator",
  description: "Validate JSON syntax with detailed error reporting. Find and fix JSON formatting issues instantly.",
  slug: "validator-json",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
