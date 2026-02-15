import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "URL Encoder & Decoder",
  description: "Encode and decode URL components. Handle special characters, query parameters, and URI encoding.",
  slug: "url-encoder",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
