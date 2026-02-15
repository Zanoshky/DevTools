import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "JSON Compare & Diff",
  description: "Compare two JSON objects side by side with visual diff highlighting. Find added, removed, and modified fields.",
  slug: "json-compare",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
