import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "Color Scheme Designer",
  description: "Design complete UI color schemes with complementary, analogous, triadic, and split-complementary harmonies.",
  slug: "color-scheme-designer",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
