import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useToolTracking } from "@/hooks/use-tool-tracking";

// Map of tool URLs to their names
const toolMap: Record<string, string> = {
  "/tools/har-analyzer": "HAR Analyzer",
  "/tools/timer": "Timer",
  "/tools/jwt": "JWT Decode",
  "/tools/json-compare": "Data Compare",
  "/tools/json-editor": "JSON Editor",
  "/tools/validator-json": "Data Validator",

  "/tools/uuid": "UUID Generator",
  "/tools/otp-generator": "OTP Authenticator",
  "/tools/payload-calculator": "Payload Calculator",
  "/tools/cron-builder": "Cron Builder",
  "/tools/timestamp-converter": "Time / Epoch",
  "/tools/timestamp-mongo": "Time / Mongo OID",
  "/tools/base64": "Base64",
  "/tools/regex-validator": "Regex Validator",
  "/tools/json-to-code": "JSON to Code",
  "/tools/json-to-openapi": "JSON to OpenAPI",
  "/tools/casing-converter": "JSON Casing",
  "/tools/random-data-generator": "Random Data",
  "/tools/url-encoder": "URL Encoder",

  "/tools/color-hex-converter": "Hex / RGB / HSL",
  "/tools/color-palette-generator": "Color Palette",
  "/tools/color-scheme-designer": "Scheme Designer",
  "/tools/password-generator": "Password Generator",
  "/tools/hash": "Hash Generator",

  "/tools/curl-hurl-converter": "cURL / Hurl",
  "/tools/data-converter": "Data Converter",
  "/tools/key-generator": "Key Generator",
  "/tools/text-sorter": "Text Sorter",
};

export function ToolTracker() {
  const { pathname } = useLocation();
  const { trackVisit } = useToolTracking();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    // Only track if pathname changed and it's a tool page
    if (pathname && pathname.startsWith("/tools/") && pathname !== lastTrackedPath.current) {
      const toolName = toolMap[pathname];
      if (toolName) {
        trackVisit(pathname, toolName, pathname);
        lastTrackedPath.current = pathname;
      }
    }
  }, [pathname, trackVisit]);

  return null;
}
