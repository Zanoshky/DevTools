import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "Color Palette Generator",
  description: "Generate beautiful color palettes for your designs. Create harmonious color combinations with various algorithms.",
  slug: "color-palette-generator",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
