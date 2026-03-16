
import { useState, useCallback, useEffect } from "react";

const CREDENTIAL_KEY = "device-auth-credential-id";

/**
 * Uses WebAuthn to verify the device owner via biometrics, PIN, or password.
 * On first use, registers a credential. On subsequent uses, authenticates with it.
 * Falls back gracefully if WebAuthn is not supported.
 */
export function useDeviceAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Defer the support check to avoid hydration mismatch
  useEffect(() => {
    setIsSupported(!!window.PublicKeyCredential && !!navigator.credentials);
    setIsReady(true);
  }, []);

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      // If WebAuthn isn't available, grant access (graceful fallback)
      setIsAuthenticated(true);
      return true;
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      const storedId = localStorage.getItem(CREDENTIAL_KEY);

      if (storedId) {
        // Authenticate with existing credential
        const credentialId = Uint8Array.from(atob(storedId), (c) =>
          c.charCodeAt(0)
        );

        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            allowCredentials: [
              {
                id: credentialId,
                type: "public-key",
                transports: ["internal"],
              },
            ],
            userVerification: "required",
            timeout: 60000,
          },
        });

        if (assertion) {
          setIsAuthenticated(true);
          setIsAuthenticating(false);
          return true;
        }
      } else {
        // First time — register a credential
        const credential = (await navigator.credentials.create({
          publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            rp: { name: "DevToolbox", id: window.location.hostname },
            user: {
              id: crypto.getRandomValues(new Uint8Array(16)),
              name: "devtoolbox-user",
              displayName: "DevToolbox User",
            },
            pubKeyCredParams: [
              { alg: -7, type: "public-key" },   // ES256
              { alg: -257, type: "public-key" },  // RS256
            ],
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "required",
              residentKey: "preferred",
            },
            timeout: 60000,
          },
        })) as PublicKeyCredential | null;

        if (credential) {
          // Store credential ID for future authentication
          const idArray = new Uint8Array(credential.rawId);
          const idBase64 = btoa(String.fromCharCode(...idArray));
          localStorage.setItem(CREDENTIAL_KEY, idBase64);

          setIsAuthenticated(true);
          setIsAuthenticating(false);
          return true;
        }
      }

      setIsAuthenticating(false);
      return false;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Authentication failed";

      // User cancelled — not a real error
      if (message.includes("cancelled") || message.includes("canceled") || message.includes("AbortError") || message.includes("NotAllowedError")) {
        setError("Authentication cancelled");
      } else {
        setError(message);
      }

      setIsAuthenticating(false);
      return false;
    }
  }, [isSupported]);

  const lock = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    isAuthenticating,
    isSupported,
    isReady,
    error,
    authenticate,
    lock,
  };
}
