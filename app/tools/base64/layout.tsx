import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "Base64 Encoder & Decoder",
  description: "Encode and decode Base64 strings with full UTF-8 support. Convert text to Base64 and back instantly.",
  slug: "base64",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
