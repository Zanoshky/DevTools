"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout";
import { CodeEditor } from "@/components/code-editor";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActionToolbar } from "@/components/action-toolbar";
import { EmptyState } from "@/components/empty-state";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { KeyRound, Trash2, AlertCircle, RefreshCw, Lock, Unlock, Shield, Zap, X, ChevronDown, ChevronRight, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ActiveTab = "generate" | "encrypt";
type KeyType = "RSA" | "EC" | "Ed25519" | "ML-KEM";
type RSASize = 2048 | 3072 | 4096;
type ECCurve = "P-256" | "P-384" | "P-521";
type MlKemLevel = "512" | "768" | "1024";
type EncScheme = "rsa" | "mlkem";

// --- Utility functions ---

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function formatPEM(base64: string, label: string): string {
  const lines: string[] = [];
  for (let i = 0; i < base64.length; i += 64) {
    lines.push(base64.slice(i, i + 64));
  }
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----`;
}

function parsePEM(pem: string): { base64: string; label: string } | null {
  const match = pem.match(/-----BEGIN ([^-]+)-----\s*([\s\S]+?)\s*-----END [^-]+-----/);
  if (!match) return null;
  return { label: match[1], base64: match[2].replace(/\s/g, "") };
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// --- Key generation functions ---

async function generateRSAKeyPair(size: RSASize, forEncryption: boolean): Promise<{ publicKey: string; privateKey: string; info: string }> {
  if (forEncryption) {
    const keyPair = await window.crypto.subtle.generateKey(
      { name: "RSA-OAEP", modulusLength: size, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
      true, ["encrypt", "decrypt"]
    );
    const pub = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const priv = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    return {
      publicKey: formatPEM(arrayBufferToBase64(pub), "PUBLIC KEY"),
      privateKey: formatPEM(arrayBufferToBase64(priv), "PRIVATE KEY"),
      info: `RSA-OAEP ${size}-bit (encrypt/decrypt)`,
    };
  }
  const keyPair = await window.crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: size, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true, ["sign", "verify"]
  );
  const pub = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const priv = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  return {
    publicKey: formatPEM(arrayBufferToBase64(pub), "PUBLIC KEY"),
    privateKey: formatPEM(arrayBufferToBase64(priv), "PRIVATE KEY"),
    info: `RSA ${size}-bit PKCS1-v1.5 (sign/verify)`,
  };
}

async function generateECKeyPair(curve: ECCurve): Promise<{ publicKey: string; privateKey: string; info: string }> {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: curve }, true, ["sign", "verify"]
  );
  const pub = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const priv = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  return {
    publicKey: formatPEM(arrayBufferToBase64(pub), "PUBLIC KEY"),
    privateKey: formatPEM(arrayBufferToBase64(priv), "PRIVATE KEY"),
    info: `ECDSA ${curve} (sign/verify)`,
  };
}

async function generateEd25519KeyPair(): Promise<{ publicKey: string; privateKey: string; info: string }> {
  const keyPair = await window.crypto.subtle.generateKey("Ed25519", true, ["sign", "verify"]);
  const pub = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const priv = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  return {
    publicKey: formatPEM(arrayBufferToBase64(pub), "PUBLIC KEY"),
    privateKey: formatPEM(arrayBufferToBase64(priv), "PRIVATE KEY"),
    info: "Ed25519 (sign/verify)",
  };
}

async function generateMlKemKeyPair(level: MlKemLevel): Promise<{ publicKey: string; privateKey: string; info: string }> {
  const { MlKem512, MlKem768, MlKem1024 } = await import("mlkem");
  const kem = level === "512" ? new MlKem512() : level === "1024" ? new MlKem1024() : new MlKem768();
  const [pk, sk] = await kem.generateKeyPair();
  return {
    publicKey: formatPEM(uint8ToBase64(pk), "ML-KEM PUBLIC KEY"),
    privateKey: formatPEM(uint8ToBase64(sk), "ML-KEM PRIVATE KEY"),
    info: `ML-KEM-${level} (FIPS 203, post-quantum KEM)`,
  };
}

// --- Encrypt/Decrypt functions ---

async function encryptWithRSA(publicKeyPem: string, plaintext: string): Promise<string> {
  const parsed = parsePEM(publicKeyPem);
  if (!parsed) throw new Error("Invalid PEM public key");
  const keyData = base64ToArrayBuffer(parsed.base64);
  const key = await window.crypto.subtle.importKey("spki", keyData, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]);
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, key, encoded);
  return arrayBufferToBase64(encrypted);
}

async function decryptWithRSA(privateKeyPem: string, ciphertextB64: string): Promise<string> {
  const parsed = parsePEM(privateKeyPem);
  if (!parsed) throw new Error("Invalid PEM private key");
  const keyData = base64ToArrayBuffer(parsed.base64);
  const key = await window.crypto.subtle.importKey("pkcs8", keyData, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["decrypt"]);
  const encrypted = base64ToArrayBuffer(ciphertextB64);
  const decrypted = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, key, encrypted);
  return new TextDecoder().decode(decrypted);
}

async function encryptWithMlKem(publicKeyPem: string, plaintext: string): Promise<string> {
  const parsed = parsePEM(publicKeyPem);
  if (!parsed || !parsed.label.includes("ML-KEM")) throw new Error("Invalid ML-KEM public key");
  const pk = base64ToUint8(parsed.base64);
  const { MlKem512, MlKem768, MlKem1024 } = await import("mlkem");
  let kem;
  if (pk.length <= 900) kem = new MlKem512();
  else if (pk.length <= 1300) kem = new MlKem768();
  else kem = new MlKem1024();
  const [ct, sharedSecret] = await kem.encap(pk);
  const aesKey = await window.crypto.subtle.importKey("raw", sharedSecret.slice(0, 32), "AES-GCM", false, ["encrypt"]);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, encoded);
  const ctLen = new Uint8Array(4);
  new DataView(ctLen.buffer).setUint32(0, ct.length, false);
  const aesBytes = new Uint8Array(encrypted);
  const packed = new Uint8Array(4 + ct.length + 12 + aesBytes.length);
  packed.set(ctLen, 0);
  packed.set(ct, 4);
  packed.set(iv, 4 + ct.length);
  packed.set(aesBytes, 4 + ct.length + 12);
  return uint8ToBase64(packed);
}

async function decryptWithMlKem(privateKeyPem: string, ciphertextB64: string): Promise<string> {
  const parsed = parsePEM(privateKeyPem);
  if (!parsed || !parsed.label.includes("ML-KEM")) throw new Error("Invalid ML-KEM private key");
  const sk = base64ToUint8(parsed.base64);
  const packed = base64ToUint8(ciphertextB64);
  const ctLen = new DataView(packed.buffer, packed.byteOffset).getUint32(0, false);
  const ct = packed.slice(4, 4 + ctLen);
  const iv = packed.slice(4 + ctLen, 4 + ctLen + 12);
  const aesCiphertext = packed.slice(4 + ctLen + 12);
  const { MlKem512, MlKem768, MlKem1024 } = await import("mlkem");
  let kem;
  if (sk.length <= 1800) kem = new MlKem512();
  else if (sk.length <= 2600) kem = new MlKem768();
  else kem = new MlKem1024();
  const sharedSecret = await kem.decap(ct, sk);
  const aesKey = await window.crypto.subtle.importKey("raw", sharedSecret.slice(0, 32), "AES-GCM", false, ["decrypt"]);
  const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, aesCiphertext);
  return new TextDecoder().decode(decrypted);
}

// --- Component ---

export default function KeyGeneratorPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("generate");

  // Generate tab state
  const [keyType, setKeyType] = useState<KeyType>("Ed25519");
  const [rsaSize, setRsaSize] = useState<RSASize>(2048);
  const [ecCurve, setEcCurve] = useState<ECCurve>("P-256");
  const [mlKemLevel, setMlKemLevel] = useState<MlKemLevel>("768");
  const [rsaForEncryption, setRsaForEncryption] = useState(false);
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [keyInfo, setKeyInfo] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Encrypt tab state
  const [encPublicKey, setEncPublicKey] = useState("");
  const [encPrivateKey, setEncPrivateKey] = useState("");
  const [plaintext, setPlaintext] = useState("");
  const [ciphertext, setCiphertext] = useState("");
  const [encError, setEncError] = useState("");
  const [encMode, setEncMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [encScheme, setEncScheme] = useState<EncScheme>("rsa");

  // Saved keys state - session only, never persisted to localStorage
  const [savedEncKeys, setSavedEncKeys] = useState<Record<string, { pub: string; priv: string }>>({});
  const hasSavedEncKey = Boolean(savedEncKeys[encScheme]);

  useEffect(() => {
    const saved = savedEncKeys[encScheme];
    if (saved) {
      setEncPublicKey(saved.pub);
      setEncPrivateKey(saved.priv);
    }
  }, [encScheme, savedEncKeys]);

  const handleSaveEncKey = useCallback(() => {
    if (!encPublicKey && !encPrivateKey) return;
    setSavedEncKeys((prev) => ({ ...prev, [encScheme]: { pub: encPublicKey, priv: encPrivateKey } }));
  }, [encPublicKey, encPrivateKey, encScheme]);

  const handleRemoveEncKey = useCallback(() => {
    setSavedEncKeys((prev) => {
      const next = { ...prev };
      delete next[encScheme];
      return next;
    });
    setEncPublicKey("");
    setEncPrivateKey("");
  }, [encScheme]);

  const handleGenerate = useCallback(async () => {
    if (typeof window === "undefined" || !window.crypto?.subtle) {
      setError("Web Crypto API not available");
      return;
    }
    setError("");
    setIsGenerating(true);
    try {
      let result: { publicKey: string; privateKey: string; info: string };
      if (keyType === "RSA") {
        result = await generateRSAKeyPair(rsaSize, rsaForEncryption);
      } else if (keyType === "EC") {
        result = await generateECKeyPair(ecCurve);
      } else if (keyType === "ML-KEM") {
        result = await generateMlKemKeyPair(mlKemLevel);
      } else {
        result = await generateEd25519KeyPair();
      }
      setPublicKey(result.publicKey);
      setPrivateKey(result.privateKey);
      setKeyInfo(result.info);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate key pair";
      if (keyType === "Ed25519" && msg.includes("Unrecognized")) {
        setError("Ed25519 not supported in this browser. Try Chrome 137+, Safari 17+, or Firefox 130+.");
      } else {
        setError(msg);
      }
      setPublicKey("");
      setPrivateKey("");
    } finally {
      setIsGenerating(false);
    }
  }, [keyType, rsaSize, ecCurve, rsaForEncryption, mlKemLevel]);

  const handleClear = useCallback(() => {
    setPublicKey("");
    setPrivateKey("");
    setError("");
    setKeyInfo("");
  }, []);

  const applyPreset = useCallback((preset: "everyday" | "privacy" | "quantum") => {
    if (preset === "everyday") {
      setKeyType("Ed25519");
    } else if (preset === "quantum") {
      setKeyType("ML-KEM");
      setMlKemLevel("768");
    } else {
      setKeyType("RSA");
      setRsaSize(4096);
      setRsaForEncryption(false);
    }
  }, []);

  const useGeneratedKeys = useCallback(() => {
    setEncPublicKey(publicKey);
    setEncPrivateKey(privateKey);
    setEncScheme(keyType === "ML-KEM" ? "mlkem" : "rsa");
    setActiveTab("encrypt");
  }, [publicKey, privateKey, keyType]);

  const handleEncrypt = useCallback(async () => {
    setEncError("");
    try {
      const result = encScheme === "mlkem"
        ? await encryptWithMlKem(encPublicKey, plaintext)
        : await encryptWithRSA(encPublicKey, plaintext);
      setCiphertext(result);
    } catch (err) {
      setEncError(err instanceof Error ? err.message : "Encryption failed.");
    }
  }, [encPublicKey, plaintext, encScheme]);

  const handleDecrypt = useCallback(async () => {
    setEncError("");
    try {
      const result = encScheme === "mlkem"
        ? await decryptWithMlKem(encPrivateKey, ciphertext)
        : await decryptWithRSA(encPrivateKey, ciphertext);
      setPlaintext(result);
    } catch (err) {
      setEncError(err instanceof Error ? err.message : "Decryption failed.");
    }
  }, [encPrivateKey, ciphertext, encScheme]);

  const handleClearEnc = useCallback(() => {
    setEncPublicKey(savedEncKeys[encScheme]?.pub || "");
    setEncPrivateKey(savedEncKeys[encScheme]?.priv || "");
    setPlaintext("");
    setCiphertext("");
    setEncError("");
  }, [savedEncKeys, encScheme]);

  const isGenEmpty = publicKey === "" && privateKey === "";
  const isEncEmpty = encPublicKey === "" && encPrivateKey === "" && plaintext === "" && ciphertext === "";

  useKeyboardShortcuts({
    shortcuts: [
      { key: "Enter", ctrl: true, action: activeTab === "generate" ? handleGenerate : (encMode === "encrypt" ? handleEncrypt : handleDecrypt), description: activeTab === "generate" ? "Generate" : "Encrypt/Decrypt" },
      { key: "x", ctrl: true, shift: true, action: activeTab === "generate" ? handleClear : handleClearEnc, description: "Clear all" },
    ],
  });

  return (
    <ToolLayout
      title="Key Generator & Encryptor"
      description="Generate RSA, EC, Ed25519, and ML-KEM (post-quantum) key pairs in PEM format"
    >
      <div className="space-y-3">
        <ActionToolbar
          left={
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)}>
              <TabsList className="h-8">
                <TabsTrigger value="generate" className="text-xs gap-1.5">
                  <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                  Generate
                </TabsTrigger>
                <TabsTrigger value="encrypt" className="text-xs gap-1.5">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  Encrypt / Decrypt
                </TabsTrigger>
              </TabsList>
            </Tabs>
          }
          right={
            activeTab === "generate" ? (
              <>
                <Button onClick={handleGenerate} size="sm" disabled={isGenerating} aria-label="Generate key pair">
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isGenerating ? "animate-spin" : ""}`} aria-hidden="true" />
                  Generate
                </Button>
                <Button onClick={handleClear} variant="outline" size="sm" disabled={isGenEmpty} aria-label="Clear all">
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </>
            ) : (
              <>
                {encMode === "encrypt" ? (
                  <Button onClick={handleEncrypt} size="sm" disabled={!encPublicKey || !plaintext} aria-label="Encrypt">
                    <Lock className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                    Encrypt
                  </Button>
                ) : (
                  <Button onClick={handleDecrypt} size="sm" disabled={!encPrivateKey || !ciphertext} aria-label="Decrypt">
                    <Unlock className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                    Decrypt
                  </Button>
                )}
                <Button onClick={handleClearEnc} variant="outline" size="sm" disabled={isEncEmpty} aria-label="Clear all">
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </>
            )
          }
        />

        {activeTab === "generate" && (
          <div className="space-y-3">
            {/* Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <Label className="text-xs text-muted-foreground">Presets:</Label>
              <button onClick={() => applyPreset("everyday")} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/40 transition-colors">
                <Zap className="h-3 w-3" aria-hidden="true" />
                Everyday (Ed25519)
              </button>
              <button onClick={() => applyPreset("privacy")} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/40 transition-colors">
                <Shield className="h-3 w-3" aria-hidden="true" />
                Max Privacy (RSA-4096)
              </button>
              <button onClick={() => applyPreset("quantum")} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 transition-colors">
                <Shield className="h-3 w-3" aria-hidden="true" />
                Quantum Safe (ML-KEM-768)
              </button>
            </div>

            {/* Key type + options */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex gap-1">
                {(["Ed25519", "RSA", "EC", "ML-KEM"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => { setKeyType(type); if (type !== "RSA") setRsaForEncryption(false); }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      keyType === type ? "bg-primary/10 border-primary text-primary" : "bg-card hover:bg-secondary"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {keyType === "RSA" && (
                <>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Size:</Label>
                    <div className="flex gap-1">
                      {([2048, 3072, 4096] as const).map((size) => (
                        <button key={size} onClick={() => setRsaSize(size)} className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors ${rsaSize === size ? "bg-primary/10 border-primary text-primary" : "bg-card hover:bg-secondary"}`}>
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Purpose:</Label>
                    <div className="flex gap-1">
                      <button onClick={() => setRsaForEncryption(false)} className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors ${!rsaForEncryption ? "bg-primary/10 border-primary text-primary" : "bg-card hover:bg-secondary"}`}>Sign/Verify</button>
                      <button onClick={() => setRsaForEncryption(true)} className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors ${rsaForEncryption ? "bg-primary/10 border-primary text-primary" : "bg-card hover:bg-secondary"}`}>Encrypt/Decrypt</button>
                    </div>
                  </div>
                </>
              )}

              {keyType === "EC" && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Curve:</Label>
                  <div className="flex gap-1">
                    {(["P-256", "P-384", "P-521"] as const).map((curve) => (
                      <button key={curve} onClick={() => setEcCurve(curve)} className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors ${ecCurve === curve ? "bg-primary/10 border-primary text-primary" : "bg-card hover:bg-secondary"}`}>
                        {curve}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {keyType === "ML-KEM" && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Level:</Label>
                  <div className="flex gap-1">
                    {(["512", "768", "1024"] as const).map((level) => (
                      <button key={level} onClick={() => setMlKemLevel(level)} className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors ${mlKemLevel === level ? "bg-primary/10 border-primary text-primary" : "bg-card hover:bg-secondary"}`}>
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contextual info */}
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {keyType === "Ed25519" && "Ed25519 - fast, compact keys. Ideal for signing, JWT, Web Crypto. Sign/verify only."}
              {keyType === "EC" && `ECDSA ${ecCurve} - elliptic curve signing. Good for TLS, JWT, code signing. Sign/verify only.`}
              {keyType === "RSA" && !rsaForEncryption && `RSA ${rsaSize}-bit PKCS1-v1.5 - widely compatible signing keys. Use for JWT, certificates, code signing.`}
              {keyType === "RSA" && rsaForEncryption && `RSA ${rsaSize}-bit OAEP - encryption keys. Use with the Encrypt/Decrypt tab. Not for signing.`}
              {keyType === "ML-KEM" && `ML-KEM-${mlKemLevel} (FIPS 203) - post-quantum key encapsulation. Use with Encrypt/Decrypt tab for quantum-safe encryption via KEM + AES-256-GCM.`}
            </p>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            {isGenEmpty && !error && (
              <div className="p-3 bg-card border rounded-lg min-h-[300px] flex items-center justify-center">
                <EmptyState icon={KeyRound} message="Choose key type and click Generate" />
              </div>
            )}

            {!isGenEmpty && (
              <div className="space-y-3">
                {keyInfo && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">{keyInfo}</Badge>
                    {((keyType === "RSA" && rsaForEncryption) || keyType === "ML-KEM") && (
                      <Button onClick={useGeneratedKeys} variant="outline" size="sm" className="text-xs h-7 gap-1.5">
                        <Lock className="h-3 w-3" aria-hidden="true" />
                        Use for Encrypt/Decrypt
                      </Button>
                    )}
                  </div>
                )}

                {/* Keys - side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium">Public Key</Label>
                      <Badge variant="outline" className="text-[10px]">SPKI / PEM</Badge>
                    </div>
                    <CodeEditor language="text" value={publicKey} readOnly placeholder="" height="140px" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium">Private Key</Label>
                      <Badge variant="outline" className="text-[10px]">PKCS8 / PEM</Badge>
                    </div>
                    <CodeEditor language="text" value={privateKey} readOnly placeholder="" height="140px" />
                    <p className="text-[10px] text-muted-foreground">
                      Keep this secret. Never share it.
                    </p>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground">
                  Generated locally via Web Crypto API. Never sent to any server.
                </p>
              </div>
            )}

            {/* User-friendly key guide */}
            <div className="border rounded-lg">
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="flex items-center gap-2 w-full p-3 text-left text-xs font-medium hover:bg-secondary/50 transition-colors rounded-lg"
                aria-expanded={showGuide}
              >
                {showGuide ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                Which key should I use? A plain-English guide
              </button>
              {showGuide && (
                <div className="px-4 pb-4 space-y-4 text-xs text-muted-foreground leading-relaxed">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Ed25519 */}
                    <div className="rounded-lg border bg-blue-50/50 dark:bg-blue-950/10 p-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px]">Ed25519</Badge>
                        <span className="text-[10px] font-semibold text-foreground">Best all-rounder</span>
                      </div>
                      <p className="text-[11px]">
                        Think of it as your everyday house key - small, fast, and secure. This is what most developers should pick.
                      </p>
                      <div className="space-y-0.5 text-[10px]">
                        <p><span className="font-semibold text-foreground">Use it for:</span> Git commit signing, JWT tokens, Web Crypto API, TLS client certs</p>
                        <p><span className="font-semibold text-foreground">How:</span> Generate, use the PEM keys with your toolchain or application code</p>
                        <p><span className="font-semibold text-foreground">Why this one:</span> Fastest to generate, smallest keys, strong security, supported everywhere modern</p>
                        <p><span className="font-semibold text-foreground">Not for:</span> Encrypting data, older systems that only support RSA</p>
                      </div>
                    </div>

                    {/* RSA */}
                    <div className="rounded-lg border bg-purple-50/50 dark:bg-purple-950/10 p-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px]">RSA</Badge>
                        <span className="text-[10px] font-semibold text-foreground">Maximum compatibility</span>
                      </div>
                      <p className="text-[11px]">
                        The old reliable - works with everything, even legacy systems from the 2000s. Bigger keys, but universal support.
                      </p>
                      <div className="space-y-0.5 text-[10px]">
                        <p><span className="font-semibold text-foreground">Use it for:</span> SSH (legacy servers), TLS certificates, JWT tokens, encrypting small data</p>
                        <p><span className="font-semibold text-foreground">How:</span> Pick Sign/Verify for SSH and signing, or Encrypt/Decrypt to protect data</p>
                        <p><span className="font-semibold text-foreground">Why this one:</span> Works on every system, can both sign and encrypt, widely understood</p>
                        <p><span className="font-semibold text-foreground">Sizes:</span> 2048 = minimum safe, 3072 = recommended, 4096 = maximum paranoia</p>
                      </div>
                    </div>

                    {/* ECDSA */}
                    <div className="rounded-lg border bg-amber-50/50 dark:bg-amber-950/10 p-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[10px]">ECDSA</Badge>
                        <span className="text-[10px] font-semibold text-foreground">Industry standard curves</span>
                      </div>
                      <p className="text-[11px]">
                        The corporate pick - NIST-approved curves used in TLS, cloud services, and enterprise systems.
                      </p>
                      <div className="space-y-0.5 text-[10px]">
                        <p><span className="font-semibold text-foreground">Use it for:</span> TLS/HTTPS certificates, JWT (ES256/ES384), AWS and cloud signing, code signing</p>
                        <p><span className="font-semibold text-foreground">How:</span> Pick a curve (P-256 is most common), generate, use the PEM keys with your toolchain</p>
                        <p><span className="font-semibold text-foreground">Why this one:</span> Required by many cloud providers and compliance standards (FIPS, SOC2)</p>
                        <p><span className="font-semibold text-foreground">Curves:</span> P-256 = default/fastest, P-384 = stronger, P-521 = overkill for most</p>
                      </div>
                    </div>

                    {/* ML-KEM */}
                    <div className="rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/10 p-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px]">ML-KEM</Badge>
                        <span className="text-[10px] font-semibold text-foreground">Future-proof (post-quantum)</span>
                      </div>
                      <p className="text-[11px]">
                        Protection against quantum computers. Not widely used yet, but if you are encrypting data that must stay secret for 10+ years, start here.
                      </p>
                      <div className="space-y-0.5 text-[10px]">
                        <p><span className="font-semibold text-foreground">Use it for:</span> Encrypting sensitive data for long-term storage, quantum-safe key exchange</p>
                        <p><span className="font-semibold text-foreground">How:</span> Generate keys, switch to Encrypt/Decrypt tab, encrypt your data</p>
                        <p><span className="font-semibold text-foreground">Why this one:</span> FIPS 203 standard, resistant to quantum attacks, hybrid AES-256-GCM encryption</p>
                        <p><span className="font-semibold text-foreground">Not for:</span> SSH (no support yet), signing, or anything needing broad compatibility today</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-secondary/30 p-3 space-y-2">
                    <p className="text-[11px] font-semibold text-foreground">Quick decision tree</p>
                    <div className="space-y-1 text-[10px]">
                      <p>Need to sign JWT tokens for a web API? <span className="font-semibold text-foreground">-&gt; ECDSA P-256 (ES256)</span></p>
                      <p>Need broad compatibility with legacy systems? <span className="font-semibold text-foreground">-&gt; RSA 3072 or 4096</span></p>
                      <p>Building with Web Crypto or Node.js crypto? <span className="font-semibold text-foreground">-&gt; Ed25519</span></p>
                      <p>Need to encrypt a message with a public key? <span className="font-semibold text-foreground">-&gt; RSA (Encrypt/Decrypt mode)</span></p>
                      <p>Protecting secrets that must last decades? <span className="font-semibold text-foreground">-&gt; ML-KEM-768</span></p>
                      <p>Not sure at all? <span className="font-semibold text-foreground">-&gt; Ed25519. You can always generate more later.</span></p>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-secondary/30 p-3 space-y-2">
                    <p className="text-[11px] font-semibold text-foreground">What are these outputs?</p>
                    <div className="space-y-1 text-[10px]">
                      <p><span className="font-semibold text-foreground">Public Key (SPKI/PEM):</span> The key you share. Used by others to verify your signatures or encrypt data for you.</p>
                      <p><span className="font-semibold text-foreground">Private Key (PKCS8/PEM):</span> Keep this secret. Used to sign data or decrypt messages. Anyone with it can impersonate you.</p>
                      <p><span className="font-semibold text-foreground">PEM format:</span> The standard key encoding used by OpenSSL, Node.js crypto, Web Crypto API, TLS certificates, and most libraries.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "encrypt" && (
          <div className="space-y-3">
            {/* Mode + scheme toggles */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1">
                <button onClick={() => setEncMode("encrypt")} className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${encMode === "encrypt" ? "bg-primary/10 border-primary text-primary" : "bg-card hover:bg-secondary"}`}>Encrypt</button>
                <button onClick={() => setEncMode("decrypt")} className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${encMode === "decrypt" ? "bg-primary/10 border-primary text-primary" : "bg-card hover:bg-secondary"}`}>Decrypt</button>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex gap-1">
                <button onClick={() => setEncScheme("rsa")} className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors ${encScheme === "rsa" ? "bg-primary/10 border-primary text-primary" : "bg-card hover:bg-secondary"}`}>RSA-OAEP</button>
                <button onClick={() => setEncScheme("mlkem")} className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors ${encScheme === "mlkem" ? "bg-primary/10 border-primary text-primary" : "bg-card hover:bg-secondary"}`}>ML-KEM</button>
              </div>
              <Badge variant="outline" className="text-xs">
                {encScheme === "mlkem" ? "ML-KEM + AES-256-GCM" : "RSA-OAEP + SHA-256"}
              </Badge>
            </div>

            {encError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{encError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
              <div className="lg:col-span-3 space-y-3">
                <div className="rounded-lg border bg-card p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${encMode === "encrypt" ? "bg-blue-500" : "bg-amber-500"}`} aria-hidden="true" />
                    <span className="text-xs font-semibold text-foreground">
                      {encMode === "encrypt" ? "Plaintext" : "Ciphertext (Base64)"}
                    </span>
                  </div>
                  {encMode === "encrypt" ? (
                    <CodeEditor language="text" value={plaintext} onChange={setPlaintext} placeholder="Enter text to encrypt..." minHeight="140px" />
                  ) : (
                    <CodeEditor language="base64" value={ciphertext} onChange={setCiphertext} placeholder="Paste encrypted base64..." minHeight="140px" />
                  )}
                </div>
                <div className="rounded-lg border bg-card p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
                    <span className="text-xs font-semibold text-foreground">
                      {encMode === "encrypt" ? "Encrypted Output (Base64)" : "Decrypted Output"}
                    </span>
                  </div>
                  <CodeEditor
                    language={encMode === "encrypt" ? "base64" : "text"}
                    value={encMode === "encrypt" ? ciphertext : plaintext}
                    readOnly
                    placeholder={encMode === "encrypt" ? "Encrypted output will appear here..." : "Decrypted output will appear here..."}
                    minHeight="140px"
                  />
                </div>
              </div>

              <div className="lg:col-span-2 space-y-3">
                <div className={`rounded-lg border p-3 space-y-2 transition-colors ${encMode === "encrypt" ? "bg-card ring-1 ring-primary/30" : "bg-card opacity-60"}`}>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${encMode === "encrypt" ? "bg-primary" : "bg-muted-foreground"}`} aria-hidden="true" />
                    <span className="text-xs font-semibold text-foreground">Public Key</span>
                    {encMode === "encrypt" && <Badge className="text-[9px] px-1 py-0 h-4">Active</Badge>}
                    <Badge variant="outline" className="text-[9px] ml-auto">{encScheme === "mlkem" ? "ML-KEM" : "RSA-OAEP"}</Badge>
                  </div>
                  <CodeEditor language="text" value={encPublicKey} onChange={setEncPublicKey} placeholder={encScheme === "mlkem" ? "Paste ML-KEM public key..." : "Paste RSA-OAEP public key..."} minHeight="120px" readOnly={encMode === "decrypt"} />
                </div>
                <div className={`rounded-lg border p-3 space-y-2 transition-colors ${encMode === "decrypt" ? "bg-card ring-1 ring-primary/30" : "bg-card opacity-60"}`}>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${encMode === "decrypt" ? "bg-primary" : "bg-muted-foreground"}`} aria-hidden="true" />
                    <span className="text-xs font-semibold text-foreground">Private Key</span>
                    {encMode === "decrypt" && <Badge className="text-[9px] px-1 py-0 h-4">Active</Badge>}
                    <Badge variant="outline" className="text-[9px] ml-auto">PKCS8</Badge>
                  </div>
                  <CodeEditor language="text" value={encPrivateKey} onChange={setEncPrivateKey} placeholder={encScheme === "mlkem" ? "Paste ML-KEM private key..." : "Paste RSA-OAEP private key..."} minHeight="120px" readOnly={encMode === "encrypt"} />
                </div>
                <div className="flex items-center gap-2">
                  {hasSavedEncKey ? (
                    <Button onClick={handleRemoveEncKey} variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive text-xs" type="button" aria-label="Remove saved key pair">
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      Remove Saved Keys
                    </Button>
                  ) : (
                    <Button onClick={handleSaveEncKey} variant="outline" size="sm" className="gap-1.5 text-xs" type="button" disabled={!encPublicKey && !encPrivateKey} aria-label="Save key pair for session">
                      <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                      Save Keys (Session)
                    </Button>
                  )}
                  {hasSavedEncKey && <span className="text-[10px] text-muted-foreground">Session only. Cleared on tab close.</span>}
                </div>
                <div className="rounded-md bg-secondary/50 p-2.5">
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {encScheme === "rsa"
                      ? "Requires RSA-OAEP keys. Generate them in the Generate tab with RSA + Encrypt/Decrypt purpose."
                      : "Requires ML-KEM keys. Generate them in the Generate tab. Uses KEM + AES-256-GCM hybrid encryption."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
