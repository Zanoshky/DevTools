import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "Cron Expression Builder",
  description: "Build and validate cron expressions visually. Preview next execution times and understand cron syntax.",
  slug: "cron-builder",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
