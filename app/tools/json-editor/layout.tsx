import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "JSON Editor",
  description: "Professional JSON editor with tree view, text mode, formatting, filtering, sorting, and side-by-side comparison.",
  slug: "json-editor",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
