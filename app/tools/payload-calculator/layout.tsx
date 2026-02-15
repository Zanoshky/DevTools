import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "Payload Size Calculator",
  description: "Calculate payload size in bytes, KB, and MB. Estimate transfer times for different network speeds.",
  slug: "payload-calculator",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
