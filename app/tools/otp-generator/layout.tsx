import { generateToolMetadata } from "@/lib/tool-metadata";

export const metadata = generateToolMetadata({
  title: "OTP Authenticator",
  description: "Generate TOTP, HOTP, and Steam Guard 2FA codes locally. Compatible with Google Authenticator secrets.",
  slug: "otp-generator",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
