import { useHead } from "@/hooks/use-head";
import type { ToolMetadata } from "@/lib/tool-metadata";

interface ToolPageWrapperProps {
  metadata: ToolMetadata;
  children: React.ReactNode;
}

export function ToolPageWrapper({ metadata, children }: ToolPageWrapperProps) {
  useHead({
    title: `${metadata.fullTitle} | DevToolbox`,
    description: metadata.description,
    canonical: `https://devtoolbox.co/tools/${metadata.slug}`,
    ogTitle: metadata.fullTitle,
    ogDescription: metadata.description,
    ogUrl: `https://devtoolbox.co/tools/${metadata.slug}`,
    ogType: "website",
  });

  return <>{children}</>;
}
