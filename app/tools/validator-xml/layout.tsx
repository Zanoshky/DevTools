import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "XML Validator",
  description: "Validate XML syntax with detailed error reporting. Check well-formedness and structure.",
  slug: "validator-xml",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
