import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "MongoDB ObjectId Timestamp Extractor",
  description: "Extract and convert timestamps from MongoDB ObjectId values. Decode creation dates from ObjectIds.",
  slug: "timestamp-mongo",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
