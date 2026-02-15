import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "cURL to Hurl Converter",
  description: "Convert cURL commands to Hurl format for HTTP testing. Supports headers, body, and authentication.",
  slug: "curl-hurl-converter",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
