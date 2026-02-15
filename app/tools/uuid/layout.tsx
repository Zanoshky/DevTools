import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "UUID Generator",
  description: "Generate universally unique identifiers (UUID v1, v4, v7). Time-based, random, and time-ordered UUIDs.",
  slug: "uuid",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
