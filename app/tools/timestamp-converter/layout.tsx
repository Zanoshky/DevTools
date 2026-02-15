import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "Unix Timestamp Converter",
  description: "Convert between UNIX timestamps and human-readable dates. Supports seconds and milliseconds.",
  slug: "timestamp-converter",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
