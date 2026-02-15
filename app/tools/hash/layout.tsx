import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "Hash Generator",
  description: "Generate MD5, SHA-1, SHA-256, SHA-384, SHA-512, and CRC32 hashes from text input.",
  slug: "hash",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
