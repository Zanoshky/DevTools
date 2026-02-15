"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToolLayout } from "@/components/tool-layout";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Plus,
  Copy,
  Trash2,
  Download,
  Upload,
  Shield,
  Clock,
  Search,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  X,
  ChevronDown,
  ChevronUp,
  QrCode,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsQR from "jsqr";
import QRCodeStyling from "qr-code-styling";

interface TOTPAccount {
  id: string;
  name: string;
  issuer: string;
  secret: string;
  color: string;
  algorithm?: "SHA1" | "SHA256" | "SHA512";
  digits?: number;
  period?: number;
  type?: "totp" | "hotp" | "steam";
  counter?: number; // For HOTP
  notes?: string;
}

function AccountQRCode({ account }: { account: TOTPAccount }) {
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (qrRef.current && typeof window !== "undefined") {
      qrRef.current.innerHTML = "";
      
      const params = new URLSearchParams({
        secret: account.secret,
        issuer: account.issuer,
      });
      
      if (account.algorithm && account.algorithm !== "SHA1") {
        params.append("algorithm", account.algorithm);
      }
      if (account.digits && account.digits !== 6) {
        params.append("digits", account.digits.toString());
      }
      if (account.period && account.period !== 30) {
        params.append("period", account.period.toString());
      }
      
      const uri = `otpauth://totp/${encodeURIComponent(account.issuer)}:${encodeURIComponent(account.name)}?${params.toString()}`;
      
      const qrCode = new QRCodeStyling({
        width: 200,
        height: 200,
        data: uri,
        margin: 5,
        qrOptions: {
          typeNumber: 0,
          mode: "Byte",
          errorCorrectionLevel: "M",
        },
        dotsOptions: {
          color: "#000000",
          type: "square",
        },
        backgroundOptions: {
          color: "#ffffff",
        },
      });

      qrCode.append(qrRef.current);
    }
  }, [account]);

  return <div ref={qrRef} />;
}

export default function TOTPGeneratorPage() {
  const [accounts, setAccounts] = useState<TOTPAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentCodes, setCurrentCodes] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(30);
  const [progressPercent, setProgressPercent] = useState(100);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExportForm, setShowExportForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [addMethod, setAddMethod] = useState<"manual" | "qr" | "camera">("manual");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [expandedQRId, setExpandedQRId] = useState<string | null>(null);
  
  // Add account form
  const [newName, setNewName] = useState("");
  const [newIssuer, setNewIssuer] = useState("");
  const [newSecret, setNewSecret] = useState("");
  const [newAlgorithm, setNewAlgorithm] = useState<"SHA1" | "SHA256" | "SHA512">("SHA1");
  const [newDigits, setNewDigits] = useState<6 | 7 | 8>(6);
  const [newPeriod, setNewPeriod] = useState(30);
  const [newType, setNewType] = useState<"totp" | "hotp" | "steam">("totp");
  const [newCounter, setNewCounter] = useState(0);
  const [newNotes, setNewNotes] = useState("");
  
  // Export/Import
  const [exportPassword, setExportPassword] = useState("");
  const [importPassword, setImportPassword] = useState("");
  const [importData, setImportData] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrImageInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();

  const colors = [
    "bg-blue-600",
    "bg-purple-600",
    "bg-pink-600",
    "bg-emerald-600",
    "bg-amber-600",
    "bg-rose-600",
    "bg-indigo-600",
    "bg-cyan-600",
    "bg-fuchsia-600",
    "bg-lime-600",
    "bg-orange-600",
    "bg-violet-600",
  ];

  // Generate consistent color based on issuer name
  const getColorForIssuer = (issuer: string): string => {
    let hash = 0;
    for (let i = 0; i < issuer.length; i++) {
      hash = issuer.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Load accounts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("otp-accounts");
    if (stored) {
      try {
        setAccounts(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to load accounts:", error);
      }
    }
  }, []);

  // Save accounts to localStorage whenever they change
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    if (accounts.length > 0) {
      localStorage.setItem("otp-accounts", JSON.stringify(accounts));
    } else {
      localStorage.removeItem("otp-accounts");
    }
  }, [accounts]);

  // Smooth lerp animation for progress bar
  useEffect(() => {
    const animate = () => {
      const now = Date.now() / 1000;
      const period = accounts[0]?.period || 30;
      const elapsed = now % period;
      const remaining = period - elapsed;
      const percent = (remaining / period) * 100;
      
      setTimeLeft(Math.ceil(remaining));
      setProgressPercent(percent);
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [accounts]);

  // Generate OTP codes (TOTP, HOTP, Steam)
  useEffect(() => {
    const generateCodes = async () => {
      const codes: Record<string, string> = {};
      const now = Math.floor(Date.now() / 1000);
      
      await Promise.all(
        accounts.map(async (account) => {
          try {
            const period = account.period || 30;
            const type = account.type || "totp";
            
            let counter: number;
            if (type === "hotp") {
              // HOTP uses stored counter
              counter = account.counter || 0;
            } else {
              // TOTP and Steam use time-based counter
              counter = Math.floor(now / period);
            }
            
            const code = await generateOTP(
              account.secret, 
              counter, 
              account.algorithm || "SHA1",
              account.digits || 6,
              type
            );
            codes[account.id] = code;
          } catch (error) {
            codes[account.id] = "ERROR";
          }
        })
      );
      
      setCurrentCodes(codes);
    };

    generateCodes();
    const interval = setInterval(generateCodes, 1000);
    return () => clearInterval(interval);
  }, [accounts]);

  const generateOTP = async (
    secret: string, 
    counter: number, 
    algorithm: "SHA1" | "SHA256" | "SHA512" = "SHA1",
    digits: number = 6,
    type: string = "totp"
  ): Promise<string> => {
    // Remove spaces and convert to uppercase
    const cleanSecret = secret.replace(/\s/g, "").toUpperCase();
    
    // Base32 decode
    const key = base32Decode(cleanSecret);
    
    // Create counter buffer
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setUint32(4, counter, false);
    
    // HMAC with selected algorithm using Web Crypto API
    const hmac = await hmacWebCrypto(key, new Uint8Array(buffer), algorithm);
    
    // Steam Guard uses different character set
    if (type === "steam") {
      const steamChars = "23456789BCDFGHJKMNPQRTVWXY";
      const offset = hmac[hmac.length - 1] & 0x0f;
      const code =
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff);
      
      let steamCode = "";
      let fullCode = code;
      for (let i = 0; i < 5; i++) {
        steamCode += steamChars[fullCode % steamChars.length];
        fullCode = Math.floor(fullCode / steamChars.length);
      }
      return steamCode;
    }
    
    // Dynamic truncation
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
    
    // Return code with specified digits
    const divisor = Math.pow(10, digits);
    return (code % divisor).toString().padStart(digits, "0");
  };

  const base32Decode = (input: string): Uint8Array => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const output: number[] = [];
    let bits = 0;
    let value = 0;

    for (let i = 0; i < input.length; i++) {
      const idx = alphabet.indexOf(input[i]);
      if (idx === -1) continue;
      
      value = (value << 5) | idx;
      bits += 5;

      if (bits >= 8) {
        output.push((value >>> (bits - 8)) & 0xff);
        bits -= 8;
      }
    }

    return new Uint8Array(output);
  };

  // HMAC using Web Crypto API (secure and performant)
  const hmacWebCrypto = async (
    key: Uint8Array,
    message: Uint8Array,
    algorithm: "SHA1" | "SHA256" | "SHA512"
  ): Promise<Uint8Array> => {
    // Create proper ArrayBuffer copies for Web Crypto API
    const keyBuffer = key.slice().buffer;
    const messageBuffer = message.slice().buffer;
    
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "HMAC", hash: `SHA-${algorithm.slice(3)}` },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageBuffer);
    return new Uint8Array(signature);
  };

  const addAccount = () => {
    if (!newName || !newSecret) {
      toast({
        title: "Missing information",
        description: "Please provide both name and secret key",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicates
    const cleanSecret = newSecret.replace(/\s/g, "").toUpperCase();
    const duplicate = accounts.find(acc => 
      acc.name === newName && acc.secret === cleanSecret
    );

    if (duplicate) {
      toast({
        title: "Duplicate account",
        description: "An account with this name and secret already exists",
        variant: "destructive",
      });
      return;
    }

    const account: TOTPAccount = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newName,
      issuer: newIssuer || "Unknown",
      secret: cleanSecret,
      color: getColorForIssuer(newIssuer || "Unknown"),
      algorithm: newAlgorithm,
      digits: newDigits,
      period: newPeriod,
      type: newType,
      counter: newType === "hotp" ? newCounter : undefined,
      notes: newNotes.trim() || undefined,
    };

    setAccounts([...accounts, account]);
    setNewName("");
    setNewIssuer("");
    setNewSecret("");
    setNewAlgorithm("SHA1");
    setNewDigits(6);
    setNewPeriod(30);
    setNewType("totp");
    setNewCounter(0);
    setNewNotes("");
    setShowAddForm(false);
    setAddMethod("manual");
    setShowAdvanced(false);
    stopCamera();

    toast({
      title: "Account added",
      description: `${account.name} has been added successfully`,
    });
  };

  const parseTOTPUri = useCallback((uri: string) => {
    try {
      
      // Parse otpauth://totp/Label?secret=SECRET&issuer=Issuer
      // Also support otpauth://hotp/Label?secret=SECRET&counter=0
      const url = new URL(uri);
      
      if (url.protocol !== "otpauth:" || (url.host !== "totp" && url.host !== "hotp")) {
        throw new Error("Invalid OTP URI");
      }

      const label = decodeURIComponent(url.pathname.substring(1));
      const secret = url.searchParams.get("secret");
      const issuer = url.searchParams.get("issuer");
      const algorithm = url.searchParams.get("algorithm") || "SHA1";
      const digits = url.searchParams.get("digits") || "6";
      const period = url.searchParams.get("period") || "30";

      if (!secret) {
        throw new Error("No secret found in QR code");
      }

      // Parse label (format: "Issuer:Account" or just "Account")
      let accountName = label;
      let accountIssuer = issuer || "Unknown";

      if (label.includes(":")) {
        const parts = label.split(":");
        accountIssuer = parts[0];
        accountName = parts[1];
      }

      setNewName(accountName);
      setNewIssuer(accountIssuer);
      setNewSecret(secret);
      setNewAlgorithm(algorithm as "SHA1" | "SHA256" | "SHA512");
      setNewDigits(parseInt(digits) as 6 | 7 | 8);
      setNewPeriod(parseInt(period));
      
      // Stop camera after successful scan
      stopCamera();

      toast({
        title: "QR Code scanned!",
        description: `Found account: ${accountName}`,
      });
    } catch (error) {
      console.error("Parse error:", error);
      toast({
        title: "Invalid QR code",
        description: "This doesn't appear to be a valid OTP QR code",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleQRImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) return;
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          parseTOTPUri(code.data);
        } else {
          toast({
            title: "No QR code found",
            description: "Could not detect a QR code in this image",
            variant: "destructive",
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Camera not supported",
          description: "Your browser doesn't support camera access. Try using HTTPS or a modern browser.",
          variant: "destructive",
        });
        return;
      }

      // Set camera active FIRST to show the video element
      setIsCameraActive(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
      });
      
      streamRef.current = stream;
      
      // Wait a tick for React to render the video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play()
                .catch((playError) => {
                  console.error("Video play error:", playError);
                  toast({
                    title: "Video playback failed",
                    description: "Could not start video playback",
                    variant: "destructive",
                  });
                });
            }
          };
        } else {
          console.error("Video ref is null after setting camera active");
        }
      }, 100);
      
    } catch (error) {
      console.error("Camera error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Camera access failed",
        description: errorMessage.includes("Permission") || errorMessage.includes("NotAllowedError")
          ? "Please allow camera access in your browser settings"
          : "Camera not available. Make sure you're using HTTPS or localhost.",
        variant: "destructive",
      });
      setIsCameraActive(false);
      
      // Clean up stream if it was created
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const scanQRFromCamera = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      if (isCameraActive) {
        requestAnimationFrame(scanQRFromCamera);
      }
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    if (canvas.width === 0 || canvas.height === 0) {
      if (isCameraActive) {
        requestAnimationFrame(scanQRFromCamera);
      }
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Try to detect QR code with multiple inversion attempts for better detection
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });

    if (code && code.data) {
      parseTOTPUri(code.data);
      return;
    }

    if (isCameraActive) {
      requestAnimationFrame(scanQRFromCamera);
    }
  }, [isCameraActive, parseTOTPUri]);

  useEffect(() => {
    if (isCameraActive) {
      const animationId = requestAnimationFrame(scanQRFromCamera);
      return () => {
        cancelAnimationFrame(animationId);
      };
    }
  }, [isCameraActive, scanQRFromCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const deleteAccount = (id: string) => {
    const updatedAccounts = accounts.filter((acc) => acc.id !== id);
    setAccounts(updatedAccounts);
    
    // Update localStorage immediately
    if (updatedAccounts.length > 0) {
      localStorage.setItem("otp-accounts", JSON.stringify(updatedAccounts));
    } else {
      localStorage.removeItem("otp-accounts");
    }
    
    toast({
      title: "Account removed",
      description: "The account has been deleted",
    });
  };

  const removeDuplicates = () => {
    const seen = new Map<string, TOTPAccount>();
    const unique: TOTPAccount[] = [];
    
    accounts.forEach(account => {
      const key = `${account.name}-${account.secret}`;
      if (!seen.has(key)) {
        seen.set(key, account);
        unique.push(account);
      }
    });
    
    const duplicatesCount = accounts.length - unique.length;
    
    if (duplicatesCount > 0) {
      setAccounts(unique);
      toast({
        title: "Duplicates removed",
        description: `Removed ${duplicatesCount} duplicate ${duplicatesCount === 1 ? 'account' : 'accounts'}`,
      });
    } else {
      toast({
        title: "No duplicates found",
        description: "All accounts are unique",
      });
    }
  };

  const clearAllAccounts = () => {
    if (accounts.length === 0) {
      toast({
        title: "No accounts",
        description: "There are no accounts to clear",
      });
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete all ${accounts.length} account${accounts.length === 1 ? '' : 's'}? This action cannot be undone.`
    );

    if (confirmed) {
      setAccounts([]);
      localStorage.removeItem("otp-accounts");
      setCurrentCodes({});
      
      toast({
        title: "All accounts cleared",
        description: "All OTP accounts have been permanently deleted",
      });
    }
  };

  const copyCode = (code: string, name: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code);
      toast({
        title: "Copied!",
        description: `${name} code copied to clipboard`,
      });
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement("textarea");
      textArea.value = code;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        toast({
          title: "Copied!",
          description: `${name} code copied to clipboard`,
        });
      } catch (error) {
        toast({
          title: "Copy failed",
          description: "Please copy the code manually",
          variant: "destructive",
        });
      }
      document.body.removeChild(textArea);
    }
  };

  const incrementHOTPCounter = (accountId: string) => {
    setAccounts(accounts.map(acc => {
      if (acc.id === accountId && acc.type === "hotp") {
        return { ...acc, counter: (acc.counter || 0) + 1 };
      }
      return acc;
    }));
    
    toast({
      title: "Counter incremented",
      description: "Next HOTP code generated",
    });
  };

  const exportAccounts = async () => {
    if (!exportPassword) {
      toast({
        title: "Password required",
        description: "Please enter a password to encrypt your backup",
        variant: "destructive",
      });
      return;
    }

    try {
      const data = JSON.stringify(accounts);
      const encrypted = await secureEncrypt(data, exportPassword);
      const blob = new Blob([encrypted], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const filename = `devtools-otp-${year}-${month}-${day}.json`;
      
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setExportPassword("");
      setShowExportForm(false);

      toast({
        title: "Backup created",
        description: "Your accounts have been exported securely",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to encrypt backup",
        variant: "destructive",
      });
    }
  };

  const importAccounts = async () => {
    if (!importPassword || !importData) {
      toast({
        title: "Missing information",
        description: "Please provide both password and import data",
        variant: "destructive",
      });
      return;
    }

    const decrypted = await secureDecrypt(importData, importPassword);
    
    if (!decrypted) {
      toast({
        title: "Import failed",
        description: "Wrong password. Please check your password and try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      const imported = JSON.parse(decrypted) as TOTPAccount[];
      
      // Regenerate IDs and ensure colors are assigned
      const importedWithNewIds = imported.map(account => ({
        ...account,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        color: account.color || getColorForIssuer(account.issuer || "Unknown"),
      }));
      
      setAccounts([...accounts, ...importedWithNewIds]);
      
      setImportPassword("");
      setImportData("");
      setShowImportForm(false);
      
      toast({
        title: "Import successful",
        description: `${imported.length} account${imported.length === 1 ? '' : 's'} imported`,
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Invalid backup file format. Please check your file.",
        variant: "destructive",
      });
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImportData(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  // Secure encryption using Web Crypto API (AES-GCM with PBKDF2)
  const secureEncrypt = async (text: string, password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Generate a random salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // Derive key from password using PBKDF2
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    // Generate a random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the data
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      data
    );
    
    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedData), salt.length + iv.length);
    
    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  };

  const secureDecrypt = async (encrypted: string, password: string): Promise<string | null> => {
    try {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      // Decode from base64
      const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
      
      // Extract salt, iv, and encrypted data
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const encryptedData = combined.slice(28);
      
      // Derive key from password using PBKDF2
      const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );
      
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        passwordKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      
      // Decrypt the data
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encryptedData
      );
      
      return decoder.decode(decryptedData);
    } catch (error) {
      // Decryption failed - return null instead of throwing
      return null;
    }
  };

  // Account field management
  const updateAccountNotes = (accountId: string, notes: string) => {
    setAccounts(accounts.map(acc => 
      acc.id === accountId ? { ...acc, notes: notes.trim() || undefined } : acc
    ));
  };

  const updateAccountName = (accountId: string, name: string) => {
    if (name.trim()) {
      setAccounts(accounts.map(acc => 
        acc.id === accountId ? { ...acc, name: name.trim() } : acc
      ));
    }
  };

  const updateAccountIssuer = (accountId: string, issuer: string) => {
    setAccounts(accounts.map(acc => 
      acc.id === accountId ? { ...acc, issuer: issuer.trim() || "Unknown" } : acc
    ));
  };

  // Filter accounts
  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch = 
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.issuer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (acc.notes?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    return matchesSearch;
  });

  const [showSecurityInfo, setShowSecurityInfo] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  return (
    <ToolLayout
      title="OTP Authenticator"
      description="Generate one-time passwords (TOTP, HOTP, Steam) locally with secure backup"
    >
      <div className="space-y-4">
        {/* Top Action Bar with Info Buttons, Timer, and Search */}
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWarning(!showWarning)}
              className="gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Important Info
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSecurityInfo(!showSecurityInfo)}
              className="gap-2"
            >
              <Shield className="h-4 w-4" />
              Security & Privacy
            </Button>
            
          </div>
          
          {/* Timer and Search Bar - Side by Side */}
          <div className="flex gap-2">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        </div>

        {/* Warning Alert - Collapsible */}
        {showWarning && (
          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            <AlertDescription className="text-xs">
              <strong>Important:</strong> Save your secret keys! If you clear browser data, you&apos;ll need to re-enter them.
              Use the export feature to create encrypted backups.
            </AlertDescription>
          </Alert>
        )}

        {/* Security & Privacy Info - Collapsible */}
        {showSecurityInfo && (
          <Card className="p-4 bg-green-500/5 border-green-500/20">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600 dark:text-green-500" />
                <h3 className="font-semibold text-sm">Security & Privacy</h3>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600 dark:text-green-500 flex-shrink-0" />
                  <span><strong>100% Local:</strong> All processing happens in your browser. No data sent to servers.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600 dark:text-green-500 flex-shrink-0" />
                  <span><strong>Offline Mode:</strong> Works completely offline after initial load.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600 dark:text-green-500 flex-shrink-0" />
                  <span><strong>AES-256-GCM:</strong> Backups encrypted with industry-standard AES-256 in GCM mode.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600 dark:text-green-500 flex-shrink-0" />
                  <span><strong>PBKDF2:</strong> Your password is strengthened with 100,000 iterations before encryption.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600 dark:text-green-500 flex-shrink-0" />
                  <span><strong>No Tracking:</strong> Zero analytics, cookies, or third-party scripts.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600 dark:text-green-500 flex-shrink-0" />
                  <span><strong>Open Source:</strong> Code is transparent and auditable.</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Desktop: Two Column Layout, Mobile: Single Column */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column: Actions & Forms (1/3 on desktop) */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            {/* Action Buttons */}
            <Card className="p-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Actions</h3>
                <div className="grid grid-cols-2 lg:flex lg:flex-col gap-2">
                  <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} className="w-full justify-start">
                    {showAddForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    {showAddForm ? "Cancel" : "Add Account"}
                  </Button>

                  <Button variant="outline" size="sm" onClick={() => setShowExportForm(!showExportForm)} className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export Backup
                  </Button>

                  <Button variant="outline" size="sm" onClick={() => setShowImportForm(!showImportForm)} className="w-full justify-start">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Backup
                  </Button>

                  {accounts.length > 0 && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={clearAllAccounts} 
                      className="w-full justify-start"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All Accounts
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Stats */}
            {accounts.length > 0 && (
              <Card className="p-4 order-last lg:order-none">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>{accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Add Account Form */}
            {showAddForm && (
              <Card className="p-4 border-2 border-primary/20">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Add Account</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <Tabs value={addMethod} onValueChange={(v) => setAddMethod(v as typeof addMethod)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="manual" className="text-xs">
                        <Plus className="h-3 w-3 mr-1" />
                        Manual
                      </TabsTrigger>
                      <TabsTrigger value="qr" className="text-xs">
                        <ImageIcon className="h-3 w-3 mr-1" />
                        Upload QR
                      </TabsTrigger>
                      <TabsTrigger value="camera" className="text-xs">
                        <Camera className="h-3 w-3 mr-1" />
                        Scan QR
                      </TabsTrigger>
                    </TabsList>

                <TabsContent value="manual" className="space-y-3 mt-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Account Name *</Label>
                    <Input
                      placeholder="e.g., GitHub, Google"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Issuer (Optional)</Label>
                    <Input
                      placeholder="e.g., github.com"
                      value={newIssuer}
                      onChange={(e) => setNewIssuer(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Secret Key *</Label>
                    <Input
                      placeholder="JBSWY3DPEHPK3PXP"
                      value={newSecret}
                      onChange={(e) => setNewSecret(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>

                  {/* Advanced Options */}
                  <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between">
                        <span className="text-xs">Advanced Options</span>
                        {showAdvanced ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 pt-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Type</Label>
                        <select
                          value={newType}
                          onChange={(e) => setNewType(e.target.value as "totp" | "hotp" | "steam")}
                          className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                        >
                          <option value="totp">TOTP (Time-based)</option>
                          <option value="hotp">HOTP (Counter-based)</option>
                          <option value="steam">Steam Guard</option>
                        </select>
                      </div>
                      {newType === "hotp" && (
                        <div className="space-y-2">
                          <Label className="text-xs">Initial Counter</Label>
                          <Input
                            type="number"
                            min="0"
                            value={newCounter}
                            onChange={(e) => setNewCounter(parseInt(e.target.value) || 0)}
                            className="text-sm"
                          />
                          <p className="text-xs text-muted-foreground">
                            Starting counter value for HOTP
                          </p>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label className="text-xs">Algorithm</Label>
                        <select
                          value={newAlgorithm}
                          onChange={(e) => setNewAlgorithm(e.target.value as "SHA1" | "SHA256" | "SHA512")}
                          className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                        >
                          <option value="SHA1">SHA-1 (Default)</option>
                          <option value="SHA256">SHA-256</option>
                          <option value="SHA512">SHA-512</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Digits</Label>
                        <select
                          value={newDigits}
                          onChange={(e) => setNewDigits(parseInt(e.target.value) as 6 | 7 | 8)}
                          className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                          disabled={newType === "steam"}
                        >
                          <option value="6">6 digits (Default)</option>
                          <option value="7">7 digits</option>
                          <option value="8">8 digits</option>
                        </select>
                        {newType === "steam" && (
                          <p className="text-xs text-muted-foreground">
                            Steam Guard uses 5 characters
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Period (seconds)</Label>
                        <Input
                          type="number"
                          min="15"
                          max="120"
                          value={newPeriod}
                          onChange={(e) => setNewPeriod(parseInt(e.target.value) || 30)}
                          className="text-sm"
                          disabled={newType === "hotp"}
                        />
                        <p className="text-xs text-muted-foreground">
                          {newType === "hotp" ? "Not used for HOTP" : "Default: 30 seconds"}
                        </p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Note */}
                  <div className="space-y-2">
                    <Label className="text-xs">Note (Optional)</Label>
                    <textarea
                      placeholder="Add a note about this account..."
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      className="w-full min-h-[60px] px-3 py-2 text-xs rounded-md border border-input bg-background resize-none"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="qr" className="space-y-3 mt-4">
                  <input
                    ref={qrImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleQRImageUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => qrImageInputRef.current?.click()}
                    className="w-full"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Choose QR Code Image
                  </Button>
                  {(newName || newSecret) && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-500 text-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        QR Code Detected: {newName}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="camera" className="space-y-3 mt-4">
                  {!isCameraActive ? (
                    <Button variant="outline" onClick={startCamera} className="w-full">
                      <Camera className="h-4 w-4 mr-2" />
                      Start Camera
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          muted
                          className="w-full h-auto"
                        />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="absolute inset-4 border-2 border-blue-500 rounded-lg pointer-events-none" />
                        <div className="absolute bottom-4 left-0 right-0 text-center">
                          <div className="inline-block bg-black/70 text-white text-xs px-3 py-1 rounded-full">
                            Position QR code within the frame
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" onClick={stopCamera} className="w-full">
                        Stop Camera
                      </Button>
                    </div>
                  )}
                  {(newName || newSecret) && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-500 text-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        QR Code Scanned: {newName}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <Button onClick={addAccount} className="w-full" disabled={!newName || !newSecret}>
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </div>
          </Card>
        )}

        {/* Export Form */}
        {showExportForm && (
          <Card className="p-4 border-2 border-primary/20">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Export Backup</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowExportForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Encryption Password</Label>
                <Input
                  type="password"
                  placeholder="Enter a strong password"
                  value={exportPassword}
                  onChange={(e) => setExportPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Remember this password - you&apos;ll need it to import the backup
                </p>
              </div>
              <Button onClick={exportAccounts} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Backup
              </Button>
            </div>
          </Card>
        )}

        {/* Import Form */}
        {showImportForm && (
          <Card className="p-4 border-2 border-primary/20">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Import Backup</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowImportForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Backup File</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
                {importData && (
                  <p className="text-xs text-green-600 dark:text-green-500 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    File loaded
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Decryption Password</Label>
                <Input
                  type="password"
                  placeholder="Enter backup password"
                  value={importPassword}
                  onChange={(e) => setImportPassword(e.target.value)}
                />
              </div>
              <Button onClick={importAccounts} className="w-full" disabled={!importData}>
                <Upload className="h-4 w-4 mr-2" />
                Import Accounts
              </Button>
            </div>
          </Card>
        )}
          </div>

          {/* Right Column: Accounts Display (2/3 on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Accounts Grid */}
            {filteredAccounts.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No accounts found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery ? 'Try adjusting your search' : 'Add your first 2FA account to get started'}
                  </p>
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Account
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {filteredAccounts.map((account) => {
                  // Map Tailwind color classes to actual hex colors
                  const colorMap: Record<string, string> = {
                    'bg-blue-600': '#2563eb',
                    'bg-purple-600': '#9333ea',
                    'bg-pink-600': '#db2777',
                    'bg-emerald-600': '#059669',
                    'bg-amber-600': '#d97706',
                    'bg-rose-600': '#e11d48',
                    'bg-indigo-600': '#4f46e5',
                    'bg-cyan-600': '#0891b2',
                    'bg-fuchsia-600': '#c026d3',
                    'bg-lime-600': '#65a30d',
                    'bg-orange-600': '#ea580c',
                    'bg-violet-600': '#7c3aed',
                  };
                  
                  const borderColor = colorMap[account.color] || '#6b7280';
                  
                  return (
              <div
                key={account.id}
                className="group relative p-4 bg-card border rounded-xl hover:shadow-lg transition-all border-l-4"
                style={{ borderLeftColor: borderColor }}
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 space-y-1 overflow-hidden">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <input
                          type="text"
                          defaultValue={account.issuer}
                          onBlur={(e) => updateAccountIssuer(account.id, e.target.value)}
                          className="font-semibold text-base flex-1 min-w-0 bg-transparent border-none outline-none focus:ring-1 focus:ring-primary rounded px-1 -ml-1 truncate"
                          placeholder="Issuer"
                          title={account.issuer}
                        />
                      </div>
                      <input
                        type="text"
                        defaultValue={account.name}
                        onBlur={(e) => updateAccountName(account.id, e.target.value)}
                        className="text-xs text-muted-foreground w-full min-w-0 bg-transparent border-none outline-none focus:ring-1 focus:ring-primary rounded px-1 -ml-1 truncate"
                        placeholder="Account name"
                        title={account.name}
                      />
                    </div>
                  </div>

                  {/* Code Display */}
                  <div className="space-y-2">
                    <div className="space-y-0 overflow-hidden rounded-lg">
                      <div
                        className="text-4xl font-bold font-mono tracking-wider text-center py-5 bg-secondary/50 cursor-pointer hover:bg-secondary transition-colors"
                        onClick={() => copyCode(currentCodes[account.id] || "------", account.name)}
                      >
                        {currentCodes[account.id] || "------"}
                      </div>
                      {/* Progress bar under code - only for TOTP */}
                      {account.type !== "hotp" && (
                        <Progress 
                          value={(() => {
                            const now = Date.now() / 1000;
                            const period = account.period || 30;
                            const elapsed = now % period;
                            const remaining = period - elapsed;
                            return (remaining / period) * 100;
                          })()} 
                          className="h-1 rounded-none [&>div]:transition-none [&>div]:duration-0" 
                        />
                      )}
                    </div>
                    
                    {account.type === "hotp" ? (
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyCode(currentCodes[account.id] || "------", account.name)}
                          className="flex-1"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedQRId(expandedQRId === account.id ? null : account.id)}
                          className="h-9 w-9 p-0"
                          title="Export as QR"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteAccount(account.id)}
                          className="h-9 w-9 p-0"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => incrementHOTPCounter(account.id)}
                          className="flex-1"
                        >
                          Next Code
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyCode(currentCodes[account.id] || "------", account.name)}
                          className="flex-1"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Code
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedQRId(expandedQRId === account.id ? null : account.id)}
                          className="h-9 w-9 p-0"
                          title="Export as QR"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteAccount(account.id)}
                          className="h-9 w-9 p-0"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* QR Code (collapsible) */}
                  {expandedQRId === account.id && (
                    <div className="pt-3 border-t">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium">Export as QR Code</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedQRId(null)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex justify-center bg-white p-3 rounded-lg">
                          <AccountQRCode account={account} />
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          Scan with another authenticator app
                        </p>
                        <div className="pt-2">
                          <p className="text-xs text-muted-foreground mb-1">Secret Key:</p>
                          <p className="text-xs font-mono break-all bg-secondary/30 p-2 rounded">
                            {account.secret}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Note (collapsible, always editable) */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between h-7 text-xs">
                        <span className="text-xs font-medium text-muted-foreground">Note</span>
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-1">
                      <textarea
                        placeholder="Add a note about this account..."
                        defaultValue={account.notes || ''}
                        onBlur={(e) => updateAccountNotes(account.id, e.target.value)}
                        className="w-full min-h-[50px] px-2 py-1.5 text-xs rounded-md border border-input bg-background resize-none focus:ring-1 focus:ring-primary"
                      />
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>
            );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
