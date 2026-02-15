import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "Color Converter (HEX, RGB, HSL)",
  description: "Convert between HEX, RGB, and HSL color formats. Preview colors and copy values instantly.",
  slug: "color-hex-converter",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
