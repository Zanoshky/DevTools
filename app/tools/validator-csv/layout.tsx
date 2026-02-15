import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "CSV Validator",
  description: "Validate CSV structure and data integrity. Check column consistency, delimiters, and formatting.",
  slug: "validator-csv",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
