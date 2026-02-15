import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "Random Data Generator",
  description: "Generate realistic test data including names, emails, addresses, phone numbers, and more.",
  slug: "random-data-generator",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
