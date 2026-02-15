import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "JWT Decoder & Encoder",
  description: "Decode and encode JSON Web Tokens. Inspect headers, payloads, expiration, and sign tokens with HMAC algorithms.",
  slug: "jwt",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
