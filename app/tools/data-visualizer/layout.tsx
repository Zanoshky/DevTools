import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "Data Visualizer",
  description: "Visualize CSV and JSON data with interactive charts. Create bar, line, pie, and scatter plots.",
  slug: "data-visualizer",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
