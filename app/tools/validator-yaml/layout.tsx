import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "YAML Validator",
  description: "Validate YAML syntax with detailed error reporting. Check indentation, structure, and formatting.",
  slug: "validator-yaml",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
