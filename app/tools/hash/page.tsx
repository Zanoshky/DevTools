
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToolLayout } from "@/components/tool-layout";
import { CodeEditor } from "@/components/code-editor";
import { CopyInput } from "@/components/copy-input";
import { Badge } from "@/components/ui/badge";
import { ActionToolbar } from "@/components/action-toolbar";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { Hash, Trash2 } from "lucide-react";

// MD5 implementation
function md5(str: string): string {
  function rotateLeft(value: number, shift: number): number {
    return (value << shift) | (value >>> (32 - shift));
  }

  function addUnsigned(x: number, y: number): number {
    const lsw = (x & 0xFFFF) + (y & 0xFFFF);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
  }

  function cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, q), addUnsigned(x, t)), s), b);
  }

  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn((b & c) | ((~b) & d), a, b, x, s, t);
  }

  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn((b & d) | (c & (~d)), a, b, x, s, t);
  }

  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }

  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn(c ^ (b | (~d)), a, b, x, s, t);
  }

  function convertToWordArray(str: string): number[] {
    const wordArray: number[] = [];
    for (let i = 0; i < str.length * 8; i += 8) {
      wordArray[i >> 5] |= (str.charCodeAt(i / 8) & 0xFF) << (i % 32);
    }
    return wordArray;
  }

  function wordToHex(value: number): string {
    let str = '';
    for (let i = 0; i < 4; i++) {
      str += ((value >> (i * 8 + 4)) & 0x0F).toString(16) + ((value >> (i * 8)) & 0x0F).toString(16);
    }
    return str;
  }

  const x = convertToWordArray(str);
  let a = 0x67452301;
  let b = 0xEFCDAB89;
  let c = 0x98BADCFE;
  let d = 0x10325476;

  x[str.length * 8 >> 5] |= 0x80 << (str.length * 8 % 32);
  x[(((str.length * 8 + 64) >>> 9) << 4) + 14] = str.length * 8;

  for (let i = 0; i < x.length; i += 16) {
    const oldA = a, oldB = b, oldC = c, oldD = d;

    a = ff(a, b, c, d, x[i + 0], 7, 0xD76AA478);
    d = ff(d, a, b, c, x[i + 1], 12, 0xE8C7B756);
    c = ff(c, d, a, b, x[i + 2], 17, 0x242070DB);
    b = ff(b, c, d, a, x[i + 3], 22, 0xC1BDCEEE);
    a = ff(a, b, c, d, x[i + 4], 7, 0xF57C0FAF);
    d = ff(d, a, b, c, x[i + 5], 12, 0x4787C62A);
    c = ff(c, d, a, b, x[i + 6], 17, 0xA8304613);
    b = ff(b, c, d, a, x[i + 7], 22, 0xFD469501);
    a = ff(a, b, c, d, x[i + 8], 7, 0x698098D8);
    d = ff(d, a, b, c, x[i + 9], 12, 0x8B44F7AF);
    c = ff(c, d, a, b, x[i + 10], 17, 0xFFFF5BB1);
    b = ff(b, c, d, a, x[i + 11], 22, 0x895CD7BE);
    a = ff(a, b, c, d, x[i + 12], 7, 0x6B901122);
    d = ff(d, a, b, c, x[i + 13], 12, 0xFD987193);
    c = ff(c, d, a, b, x[i + 14], 17, 0xA679438E);
    b = ff(b, c, d, a, x[i + 15], 22, 0x49B40821);

    a = gg(a, b, c, d, x[i + 1], 5, 0xF61E2562);
    d = gg(d, a, b, c, x[i + 6], 9, 0xC040B340);
    c = gg(c, d, a, b, x[i + 11], 14, 0x265E5A51);
    b = gg(b, c, d, a, x[i + 0], 20, 0xE9B6C7AA);
    a = gg(a, b, c, d, x[i + 5], 5, 0xD62F105D);
    d = gg(d, a, b, c, x[i + 10], 9, 0x02441453);
    c = gg(c, d, a, b, x[i + 15], 14, 0xD8A1E681);
    b = gg(b, c, d, a, x[i + 4], 20, 0xE7D3FBC8);
    a = gg(a, b, c, d, x[i + 9], 5, 0x21E1CDE6);
    d = gg(d, a, b, c, x[i + 14], 9, 0xC33707D6);
    c = gg(c, d, a, b, x[i + 3], 14, 0xF4D50D87);
    b = gg(b, c, d, a, x[i + 8], 20, 0x455A14ED);
    a = gg(a, b, c, d, x[i + 13], 5, 0xA9E3E905);
    d = gg(d, a, b, c, x[i + 2], 9, 0xFCEFA3F8);
    c = gg(c, d, a, b, x[i + 7], 14, 0x676F02D9);
    b = gg(b, c, d, a, x[i + 12], 20, 0x8D2A4C8A);

    a = hh(a, b, c, d, x[i + 5], 4, 0xFFFA3942);
    d = hh(d, a, b, c, x[i + 8], 11, 0x8771F681);
    c = hh(c, d, a, b, x[i + 11], 16, 0x6D9D6122);
    b = hh(b, c, d, a, x[i + 14], 23, 0xFDE5380C);
    a = hh(a, b, c, d, x[i + 1], 4, 0xA4BEEA44);
    d = hh(d, a, b, c, x[i + 4], 11, 0x4BDECFA9);
    c = hh(c, d, a, b, x[i + 7], 16, 0xF6BB4B60);
    b = hh(b, c, d, a, x[i + 10], 23, 0xBEBFBC70);
    a = hh(a, b, c, d, x[i + 13], 4, 0x289B7EC6);
    d = hh(d, a, b, c, x[i + 0], 11, 0xEAA127FA);
    c = hh(c, d, a, b, x[i + 3], 16, 0xD4EF3085);
    b = hh(b, c, d, a, x[i + 6], 23, 0x04881D05);
    a = hh(a, b, c, d, x[i + 9], 4, 0xD9D4D039);
    d = hh(d, a, b, c, x[i + 12], 11, 0xE6DB99E5);
    c = hh(c, d, a, b, x[i + 15], 16, 0x1FA27CF8);
    b = hh(b, c, d, a, x[i + 2], 23, 0xC4AC5665);

    a = ii(a, b, c, d, x[i + 0], 6, 0xF4292244);
    d = ii(d, a, b, c, x[i + 7], 10, 0x432AFF97);
    c = ii(c, d, a, b, x[i + 14], 15, 0xAB9423A7);
    b = ii(b, c, d, a, x[i + 5], 21, 0xFC93A039);
    a = ii(a, b, c, d, x[i + 12], 6, 0x655B59C3);
    d = ii(d, a, b, c, x[i + 3], 10, 0x8F0CCC92);
    c = ii(c, d, a, b, x[i + 10], 15, 0xFFEFF47D);
    b = ii(b, c, d, a, x[i + 1], 21, 0x85845DD1);
    a = ii(a, b, c, d, x[i + 8], 6, 0x6FA87E4F);
    d = ii(d, a, b, c, x[i + 15], 10, 0xFE2CE6E0);
    c = ii(c, d, a, b, x[i + 6], 15, 0xA3014314);
    b = ii(b, c, d, a, x[i + 13], 21, 0x4E0811A1);
    a = ii(a, b, c, d, x[i + 4], 6, 0xF7537E82);
    d = ii(d, a, b, c, x[i + 11], 10, 0xBD3AF235);
    c = ii(c, d, a, b, x[i + 2], 15, 0x2AD7D2BB);
    b = ii(b, c, d, a, x[i + 9], 21, 0xEB86D391);

    a = addUnsigned(a, oldA);
    b = addUnsigned(b, oldB);
    c = addUnsigned(c, oldC);
    d = addUnsigned(d, oldD);
  }

  return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
}

// CRC8
function crc8(str: string): string {
  let crc = 0;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x80) ? ((crc << 1) ^ 0x07) : (crc << 1);
    }
  }
  return (crc & 0xFF).toString(16).padStart(2, '0');
}

// CRC16
function crc16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x0001) ? ((crc >> 1) ^ 0xA001) : (crc >> 1);
    }
  }
  return crc.toString(16).padStart(4, '0');
}

// CRC32
function crc32(str: string): string {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < str.length; i++) {
    crc = table[(crc ^ str.charCodeAt(i)) & 0xFF] ^ (crc >>> 8);
  }
  return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0');
}

// CRC64
function crc64(str: string): string {
  let crc = BigInt(0xFFFFFFFFFFFFFFFF);
  const poly = BigInt(0x42F0E1EBA9EA3693);
  
  for (let i = 0; i < str.length; i++) {
    crc ^= BigInt(str.charCodeAt(i));
    for (let j = 0; j < 8; j++) {
      if (crc & BigInt(1)) {
        crc = (crc >> BigInt(1)) ^ poly;
      } else {
        crc = crc >> BigInt(1);
      }
    }
  }
  
  return (crc ^ BigInt(0xFFFFFFFFFFFFFFFF)).toString(16).padStart(16, '0');
}

// Adler-32
function adler32(str: string): string {
  const MOD_ADLER = 65521;
  let a = 1, b = 0;
  
  for (let i = 0; i < str.length; i++) {
    a = (a + str.charCodeAt(i)) % MOD_ADLER;
    b = (b + a) % MOD_ADLER;
  }
  
  return ((b << 16) | a).toString(16).padStart(8, '0');
}

// FNV-1a
function fnv1a(str: string): string {
  const FNV_PRIME = 0x01000193;
  let hash = 0x811c9dc5;
  
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  
  return (hash >>> 0).toString(16).padStart(8, '0');
}

// MurmurHash3 32-bit
function murmurhash3(str: string, seed = 0): string {
  let h = seed;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  
  for (let i = 0; i < str.length; i++) {
    let k = str.charCodeAt(i);
    k = Math.imul(k, c1);
    k = (k << 15) | (k >>> 17);
    k = Math.imul(k, c2);
    
    h ^= k;
    h = (h << 13) | (h >>> 19);
    h = Math.imul(h, 5) + 0xe6546b64;
  }
  
  h ^= str.length;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  
  return (h >>> 0).toString(16).padStart(8, '0');
}

export default function HashPage() {
  const [input, setInput] = useState("");
  const [algorithm, setAlgorithm] = useState("SHA-256");
  const [output, setOutput] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  const algorithms = [
    "MD5",
    "SHA-1", 
    "SHA-256", 
    "SHA-384", 
    "SHA-512",
    "CRC8",
    "CRC16",
    "CRC32",
    "CRC64",
    "Adler-32",
    "FNV-1a",
    "MurmurHash3"
  ];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const generateHash = async () => {
    if (!input) {
      setOutput("");
      return;
    }

    if (!isMounted) {
      setOutput("Loading...");
      return;
    }

    try {
      // Try Web Crypto API for SHA algorithms
      if (window.crypto?.subtle && ["SHA-1", "SHA-256", "SHA-384", "SHA-512"].includes(algorithm)) {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        const hashBuffer = await window.crypto.subtle.digest(algorithm, data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
        setOutput(hashHex);
        return;
      }
      
      // Use JS implementations for other algorithms
      let hash = '';
      switch (algorithm) {
        case "MD5":
          hash = md5(input);
          break;
        case "CRC8":
          hash = crc8(input);
          break;
        case "CRC16":
          hash = crc16(input);
          break;
        case "CRC32":
          hash = crc32(input);
          break;
        case "CRC64":
          hash = crc64(input);
          break;
        case "Adler-32":
          hash = adler32(input);
          break;
        case "FNV-1a":
          hash = fnv1a(input);
          break;
        case "MurmurHash3":
          hash = murmurhash3(input);
          break;
        default:
          setOutput(`${algorithm} requires HTTPS for Web Crypto API`);
          return;
      }
      setOutput(hash);
    } catch (err) {
      setOutput("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  // Auto-generate hash when input or algorithm changes
  useEffect(() => {
    if (input && isMounted) {
      const timer = setTimeout(() => {
        generateHash();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setOutput("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, algorithm, isMounted]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
  }, []);

  const isEmpty = input.length === 0;

  useKeyboardShortcuts({
    shortcuts: [
      { key: "x", ctrl: true, shift: true, action: handleClear, description: "Clear all" },
    ],
  });

  const getHashInfo = () => {
    const info: Record<string, string> = {
      "MD5": "128-bit • Legacy (not secure)",
      "SHA-1": "160-bit • Legacy (not secure)",
      "SHA-256": "256-bit • Secure",
      "SHA-384": "384-bit • Secure",
      "SHA-512": "512-bit • Secure",
      "CRC8": "8-bit • Checksum",
      "CRC16": "16-bit • Checksum",
      "CRC32": "32-bit • Checksum",
      "CRC64": "64-bit • Checksum",
      "Adler-32": "32-bit • Fast checksum",
      "FNV-1a": "32-bit • Fast hash",
      "MurmurHash3": "32-bit • Fast hash"
    };
    return info[algorithm] || "";
  };

  return (
    <ToolLayout
      title="Hash Generator"
      description="Generate cryptographic hashes and checksums with multiple algorithms"
    >
      <div className="space-y-3">
        <ActionToolbar
          left={
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium whitespace-nowrap">Algorithm:</Label>
              <Select value={algorithm} onValueChange={setAlgorithm}>
                <SelectTrigger className="h-8 text-xs w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {algorithms.map((algo) => (
                    <SelectItem key={algo} value={algo}>
                      {algo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
          right={
            <Button
              onClick={handleClear}
              variant="outline"
              size="sm"
              disabled={isEmpty}
              aria-label="Clear input"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          }
        />

        {/* Side-by-side layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Input Text</Label>
            <CodeEditor language="text"
              value={input}
              onChange={setInput}
              placeholder="Enter text to hash..."

            />
            {input && (
              <div className="text-xs text-muted-foreground">
                Length: {input.length} characters • {new Blob([input]).size} bytes
              </div>
            )}
          </div>

          {/* Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Hash Output</Label>
              {output && (
                <div className="text-xs text-muted-foreground">
                  {output.length} chars
                </div>
              )}
            </div>
            <div className="border rounded-lg min-h-[520px] overflow-hidden">
              {output ? (
                <div className="space-y-3 p-3">
                  {/* Algorithm badge bar */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="default" className="text-xs">{algorithm}</Badge>
                    <Badge variant="outline" className="text-xs">{getHashInfo()}</Badge>
                  </div>

                  {/* Main hash display */}
                  <div className="relative overflow-hidden rounded-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
                    <div className="relative p-4 bg-card/80">
                      <Label className="text-xs text-muted-foreground mb-2 block">Hash (lowercase)</Label>
                      <CopyInput
                        value={output}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Uppercase</Label>
                    <CopyInput
                      value={output.toUpperCase()}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">With 0x Prefix</Label>
                    <CopyInput
                      value={`0x${output}`}
                      readOnly
                    />
                  </div>

                  {/* Visual hash length indicator */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Hash length: {output.length} hex chars</span>
                      <span>{output.length * 4} bits</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[520px] text-muted-foreground p-6">
                  <Hash className="h-8 w-8 mb-3 opacity-50" />
                  <p className="text-sm">{input ? "Generating hash..." : "Enter text to generate hash"}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
