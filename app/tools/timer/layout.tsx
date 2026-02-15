import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "Timer & Stopwatch",
  description: "Online stopwatch and countdown timer with lap tracking and audio alerts.",
  slug: "timer",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
