import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "Password Generator",
  description: "Generate strong, secure passwords with customizable length, character sets, and entropy calculation.",
  slug: "password-generator",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
