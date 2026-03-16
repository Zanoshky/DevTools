
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ToolLayout } from "@/components/tool-layout";
import { CodeEditor } from "@/components/code-editor";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ActionToolbar } from "@/components/action-toolbar";
import { EmptyState } from "@/components/empty-state";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { AlertCircle, CheckCircle2, Clock, Calendar, Key, Trash2, KeyRound } from "lucide-react";
import { Switch } from "@/components/ui/switch";

type Mode = "decode" | "encode";
type Algorithm = "HS256" | "HS384" | "HS512";

export default function JWTPage() {
  const [mode, setMode] = useState<Mode>("decode");
  
  // Decode mode
  const [jwt, setJwt] = useState("");
  const [header, setHeader] = useState("");
  const [payload, setPayload] = useState("");
  const [signature, setSignature] = useState("");
  
  // Encode mode
  const [encodeHeader, setEncodeHeader] = useState('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
  const [encodePayload, setEncodePayload] = useState('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}');
  const [encodedJwt, setEncodedJwt] = useState("");
  const [signToken, setSignToken] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [algorithm, setAlgorithm] = useState<Algorithm>("HS256");
  
  const [error, setError] = useState("");
  const [tokenInfo, setTokenInfo] = useState<{
    algorithm?: string;
    type?: string;
    issued?: string;
    expires?: string;
    isExpired?: boolean;
  }>({});

  const decodeJWT = () => {
    setError("");
    setHeader("");
    setPayload("");
    setSignature("");
    setTokenInfo({});

    try {
      const parts = jwt.trim().split(".");
      if (parts.length !== 3) {
        setError("Invalid JWT format. Must have 3 parts separated by dots.");
        return;
      }

      const decodeBase64 = (str: string) => {
        const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
        const padding = "=".repeat((4 - (base64.length % 4)) % 4);
        return atob(base64 + padding);
      };

      const headerDecoded = JSON.parse(decodeBase64(parts[0]));
      const payloadDecoded = JSON.parse(decodeBase64(parts[1]));

      setHeader(JSON.stringify(headerDecoded, null, 2));
      setPayload(JSON.stringify(payloadDecoded, null, 2));
      setSignature(parts[2]);

      // Extract token info
      const info: Record<string, string | boolean> = {
        algorithm: headerDecoded.alg,
        type: headerDecoded.typ
      };

      if (payloadDecoded.iat) {
        const issuedDate = new Date(payloadDecoded.iat * 1000);
        info.issued = issuedDate.toLocaleString();
      }

      if (payloadDecoded.exp) {
        const expiresDate = new Date(payloadDecoded.exp * 1000);
        info.expires = expiresDate.toLocaleString();
        info.isExpired = Date.now() > payloadDecoded.exp * 1000;
      }

      setTokenInfo(info);
    } catch (err) {
      setError("Failed to decode JWT: " + (err instanceof Error ? err.message : "Invalid format"));
    }
  };

  const base64UrlEncode = (str: string) => {
    return btoa(str)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  };

  const arrayBufferToBase64Url = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  };

  const signJWT = async (data: string, secret: string, alg: Algorithm): Promise<string> => {
    // Check if Web Crypto API is available
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto API not available');
    }

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(data);

    const algorithmMap: Record<Algorithm, string> = {
      'HS256': 'SHA-256',
      'HS384': 'SHA-384',
      'HS512': 'SHA-512'
    };

    const key = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: algorithmMap[alg] },
      false,
      ['sign']
    );

    const signature = await window.crypto.subtle.sign('HMAC', key, messageData);
    return arrayBufferToBase64Url(signature);
  };

  const encodeJWT = async () => {
    setError("");
    setEncodedJwt("");

    try {
      const headerObj = JSON.parse(encodeHeader);
      const payloadObj = JSON.parse(encodePayload);

      // Update algorithm in header if signing
      if (signToken) {
        headerObj.alg = algorithm;
      }

      const encodedHeader = base64UrlEncode(JSON.stringify(headerObj));
      const encodedPayload = base64UrlEncode(JSON.stringify(payloadObj));
      
      let token = "";
      
      if (signToken && secretKey) {
        // Sign the token
        const dataToSign = `${encodedHeader}.${encodedPayload}`;
        const signatureStr = await signJWT(dataToSign, secretKey, algorithm);
        token = `${dataToSign}.${signatureStr}`;
      } else {
        // Unsigned token
        token = `${encodedHeader}.${encodedPayload}.`;
      }
      
      setEncodedJwt(token);
    } catch (err) {
      setError("Failed to encode JWT: " + (err instanceof Error ? err.message : "Invalid JSON"));
    }
  };

  // Auto-decode when JWT changes
  useEffect(() => {
    if (mode === "decode" && jwt.trim()) {
      decodeJWT();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jwt, mode]);

  // Auto-encode when header/payload changes
  useEffect(() => {
    if (mode === "encode" && encodeHeader && encodePayload) {
      const timer = setTimeout(() => {
        encodeJWT();
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encodeHeader, encodePayload, signToken, secretKey, algorithm, mode]);

  const isEmpty = mode === "decode"
    ? jwt === "" && header === "" && payload === ""
    : encodeHeader === '{\n  "alg": "HS256",\n  "typ": "JWT"\n}' && encodePayload === '{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}' && encodedJwt === "";

  const handleClear = useCallback(() => {
    if (mode === "decode") {
      setJwt("");
      setHeader("");
      setPayload("");
      setSignature("");
      setTokenInfo({});
    } else {
      setEncodeHeader('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
      setEncodePayload('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}');
      setEncodedJwt("");
      setSignToken(false);
      setSecretKey("");
      setAlgorithm("HS256");
    }
    setError("");
  }, [mode]);

  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "x",
        ctrl: true,
        shift: true,
        action: handleClear,
        description: "Clear all",
      },
    ],
  });

  return (
    <ToolLayout
      title="JWT Encoder/Decoder"
      description="Encode and decode JSON Web Tokens with detailed inspection"
    >
      <div className="space-y-3">
        {/* Action Toolbar */}
        <ActionToolbar
          left={
            <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="decode" className="text-xs">Decode JWT</TabsTrigger>
                <TabsTrigger value="encode" className="text-xs">Encode JWT</TabsTrigger>
              </TabsList>
            </Tabs>
          }
          right={
            <Button
              onClick={handleClear}
              variant="outline"
              size="sm"
              disabled={isEmpty}
              aria-label="Clear all"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          }
        />

        {mode === "decode" ? (
          <>
            {/* Decode Mode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Input */}
              <div className="space-y-3">
                <div className="p-3 bg-card border rounded-lg space-y-2">
                  <Label className="text-sm font-medium">JWT Token</Label>
                  <CodeEditor
                    language="jwt"
                    value={jwt}
                    onChange={setJwt}
                    placeholder="Paste your JWT token here..."
                    height="120px"
                  />
                </div>

                {/* Token Info */}
                {tokenInfo.algorithm && (
                  <div className="p-3 bg-card border rounded-lg space-y-2">
                    <Label className="text-sm font-medium">Token Information</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Algorithm:</span>
                        <Badge variant="secondary" className="text-xs">{tokenInfo.algorithm}</Badge>
                      </div>
                      {tokenInfo.type && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Type:</span>
                          <Badge variant="secondary" className="text-xs">{tokenInfo.type}</Badge>
                        </div>
                      )}
                      {tokenInfo.issued && (
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Issued:</span>
                          <span className="font-mono">{tokenInfo.issued}</span>
                        </div>
                      )}
                      {tokenInfo.expires && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Expires:</span>
                            <span className="font-mono">{tokenInfo.expires}</span>
                          </div>
                          {tokenInfo.isExpired !== undefined && (
                            <Alert variant={tokenInfo.isExpired ? "destructive" : "default"} className="py-2">
                              <AlertDescription className="text-xs flex items-center gap-2">
                                {tokenInfo.isExpired ? (
                                  <>
                                    <AlertCircle className="h-3 w-3" />
                                    Token has expired
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-3 w-3" />
                                    Token is valid
                                  </>
                                )}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Output */}
              <div className="space-y-3">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}

                {!header && !error && (
                  <div className="p-3 bg-card border rounded-lg min-h-[200px] flex items-center justify-center">
                    <EmptyState
                      icon={KeyRound}
                      message="Paste a JWT token to decode its header, payload, and signature"
                    />
                  </div>
                )}

                {header && (
                  <>
                    <div className="p-3 bg-card border rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium">Header</Label>
                        <Badge variant="outline" className="text-xs">Decoded</Badge>
                      </div>
                      <CodeEditor
                        language="json"
                        value={header}
                        readOnly
                        height="100px"
                      />
                    </div>

                    <div className="p-3 bg-card border rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium">Payload</Label>
                        <Badge variant="outline" className="text-xs">Decoded</Badge>
                      </div>
                      <CodeEditor
                        language="json"
                        value={payload}
                        readOnly
                        height="150px"
                      />
                    </div>

                    {signature && (
                      <div className="p-3 bg-card border rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium">Signature</Label>
                          <Badge variant="outline" className="text-xs">Base64</Badge>
                        </div>
                        <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                          {signature}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Encode Mode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Input */}
              <div className="space-y-3">
                <div className="p-3 bg-card border rounded-lg space-y-2">
                  <Label className="text-sm font-medium">Header (JSON)</Label>
                  <CodeEditor
                    language="json"
                    value={encodeHeader}
                    onChange={setEncodeHeader}
                    height="100px"
                  />
                </div>

                <div className="p-3 bg-card border rounded-lg space-y-2">
                  <Label className="text-sm font-medium">Payload (JSON)</Label>
                  <CodeEditor
                    language="json"
                    value={encodePayload}
                    onChange={setEncodePayload}
                    height="150px"
                  />
                </div>

                {/* Signing Options */}
                <div className="p-3 bg-card border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">Sign Token</Label>
                    </div>
                    <Switch
                      checked={signToken}
                      onCheckedChange={setSignToken}
                    />
                  </div>

                  {signToken && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-sm">Algorithm</Label>
                        <div className="flex gap-1.5">
                          {(["HS256", "HS384", "HS512"] as const).map((alg) => (
                            <button
                              key={alg}
                              onClick={() => setAlgorithm(alg)}
                              className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                                algorithm === alg ? "bg-primary/10 border-primary text-primary" : "bg-card hover:bg-secondary"
                              }`}
                            >
                              {alg}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="jwt-secret" className="text-sm">Secret Key</Label>
                        <Input
                          id="jwt-secret"
                          type="password"
                          value={secretKey}
                          onChange={(e) => setSecretKey(e.target.value)}
                          placeholder="Enter your secret key..."
                          className="h-8 text-xs font-mono"
                          autoComplete="off"
                          data-1p-ignore
                          data-lpignore="true"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Your secret key is used locally and never sent to any server. Avoid using production secrets in any browser-based tool.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {!signToken && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Token will be unsigned. Enable signing for production use.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Output */}
              <div className="space-y-3">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}

                {!encodedJwt && !error && (
                  <div className="p-3 bg-card border rounded-lg min-h-[200px] flex items-center justify-center">
                    <EmptyState
                      icon={KeyRound}
                      message="Edit the header and payload to generate an encoded JWT"
                    />
                  </div>
                )}

                {encodedJwt && (
                  <>
                    <div className="p-3 bg-card border rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium">Encoded JWT</Label>
                        <Badge variant={signToken ? "default" : "outline"} className="text-xs">
                          {signToken ? `Signed (${algorithm})` : "Unsigned"}
                        </Badge>
                      </div>
                      <CodeEditor
                        language="jwt"
                        value={encodedJwt}
                        readOnly
                        className="font-mono text-xs break-all"
                        height="120px"
                      />
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>
                          Token parts: <span className="font-mono">{encodedJwt.split('.')[0].length}</span> (header) + <span className="font-mono">{encodedJwt.split('.')[1].length}</span> (payload) + <span className="font-mono">{encodedJwt.split('.')[2]?.length || 0}</span> (signature)
                        </div>
                        <div>
                          Total length: <span className="font-mono">{encodedJwt.length}</span> characters
                        </div>
                      </div>
                    </div>

                    {signToken && secretKey && (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Token successfully signed with {algorithm} algorithm
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
