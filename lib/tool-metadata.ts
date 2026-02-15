import type { Metadata } from "next";

type ToolMeta = {
  title: string;
  description: string;
  slug: string;
};

export function generateToolMetadata({ title, description, slug }: ToolMeta): Metadata {
  const fullTitle = `${title} - Free Online Tool`;
  return {
    title: fullTitle,
    description: `${description} Free, privacy-first, 100% client-side. No data leaves your browser.`,
    alternates: {
      canonical: `/tools/${slug}`,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: `/tools/${slug}`,
      type: "website",
    },
  };
}
