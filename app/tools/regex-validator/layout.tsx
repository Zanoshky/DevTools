import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "Regex Validator & Tester",
  description: "Test and validate regular expressions with real-time matching, capture groups, and match highlighting.",
  slug: "regex-validator",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
