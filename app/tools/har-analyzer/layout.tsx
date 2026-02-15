import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "HAR File Analyzer",
  description: "Visualize and analyze HTTP Archive (HAR) files. Inspect requests, timings, dependencies, and performance.",
  slug: "har-analyzer",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
