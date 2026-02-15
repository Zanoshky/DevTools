"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ToolLayout } from "@/components/tool-layout";
import { CopyTextarea } from "@/components/copy-textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Clock, Calendar, Key } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  return (
    <ToolLayout
      title="JWT Encoder/Decoder"
      description="Encode and decode JSON Web Tokens with detailed inspection"
    >
      <div className="space-y-3">
        {/* Mode Selection */}
        <div className="p-3 bg-card border rounded-lg">
          <Label className="text-sm mb-2 block">Mode</Label>
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="decode" className="text-xs">Decode JWT</TabsTrigger>
              <TabsTrigger value="encode" className="text-xs">Encode JWT</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {mode === "decode" ? (
          <>
            {/* Decode Mode */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Input */}
              <div className="space-y-3">
                <div className="p-3 bg-card border rounded-lg space-y-2">
                  <Label className="text-sm font-medium">JWT Token</Label>
                  <CopyTextarea
                    value={jwt}
                    onChange={setJwt}
                    placeholder="Paste your JWT token here..."
                    rows={8}
                    className="font-mono text-xs"
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

                {header && (
                  <>
                    <div className="p-3 bg-card border rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium">Header</Label>
                        <Badge variant="outline" className="text-xs">Decoded</Badge>
                      </div>
                      <CopyTextarea
                        value={header}
                        readOnly
                        rows={6}
                        className="font-mono text-xs"
                      />
                    </div>

                    <div className="p-3 bg-card border rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium">Payload</Label>
                        <Badge variant="outline" className="text-xs">Decoded</Badge>
                      </div>
                      <CopyTextarea
                        value={payload}
                        readOnly
                        rows={12}
                        className="font-mono text-xs"
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Input */}
              <div className="space-y-3">
                <div className="p-3 bg-card border rounded-lg space-y-2">
                  <Label className="text-sm font-medium">Header (JSON)</Label>
                  <CopyTextarea
                    value={encodeHeader}
                    onChange={setEncodeHeader}
                    rows={6}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="p-3 bg-card border rounded-lg space-y-2">
                  <Label className="text-sm font-medium">Payload (JSON)</Label>
                  <CopyTextarea
                    value={encodePayload}
                    onChange={setEncodePayload}
                    rows={8}
                    className="font-mono text-xs"
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
                        <Select value={algorithm} onValueChange={(v) => setAlgorithm(v as Algorithm)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HS256">HS256 (SHA-256)</SelectItem>
                            <SelectItem value="HS384">HS384 (SHA-384)</SelectItem>
                            <SelectItem value="HS512">HS512 (SHA-512)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Secret Key</Label>
                        <Input
                          type="password"
                          value={secretKey}
                          onChange={(e) => setSecretKey(e.target.value)}
                          placeholder="Enter your secret key..."
                          className="h-8 text-xs font-mono"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Your secret key is used locally and never sent to any server
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

                {encodedJwt && (
                  <>
                    <div className="p-3 bg-card border rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium">Encoded JWT</Label>
                        <Badge variant={signToken ? "default" : "outline"} className="text-xs">
                          {signToken ? `Signed (${algorithm})` : "Unsigned"}
                        </Badge>
                      </div>
                      <CopyTextarea
                        value={encodedJwt}
                        readOnly
                        rows={8}
                        className="font-mono text-xs break-all"
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
