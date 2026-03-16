import { Shield, Lock, Eye, Server, Wifi, Code, Globe, HardDrive, FileCode, Fingerprint, ShieldCheck, MonitorSmartphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useHead } from '@/hooks/use-head';

export default function PrivacyPage() {
  useHead({
    title: "Privacy & Security | DevToolbox",
    description: "Learn how DevToolbox guarantees your privacy. 100% client-side processing, no analytics, no tracking, no data collection.",
    canonical: "https://devtoolbox.co/privacy",
  });

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-8" role="article">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Privacy & Security</h1>
        <p className="text-muted-foreground">
          Your data never leaves your browser. Here&apos;s how we guarantee it.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            100% Client-Side Processing
          </CardTitle>
          <CardDescription>
            All tools run entirely in your browser using JavaScript
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex gap-3">
              <Lock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">No Server Processing</div>
                <div className="text-sm text-muted-foreground">
                  Your sensitive data (JWTs, API keys, JSON) never touches our servers. Every operation runs in your browser&apos;s JavaScript engine.
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Eye className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">No Analytics</div>
                <div className="text-sm text-muted-foreground">
                  Zero tracking scripts, no Google Analytics, no Mixpanel, no telemetry. We have no idea what you do here.
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Server className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">No Database</div>
                <div className="text-sm text-muted-foreground">
                  No backend database exists. Preferences and history live in your browser&apos;s localStorage, which only you can access.
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Wifi className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">Works Offline</div>
                <div className="text-sm text-muted-foreground">
                  A Service Worker caches the entire app after first load. Disconnect your internet and everything still works.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            How to Verify
          </CardTitle>
          <CardDescription>
            Don&apos;t trust us? Verify it yourself
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <div className="font-medium mb-1">1. Check Network Activity</div>
              <div className="text-sm text-muted-foreground mb-2">
                Open your browser&apos;s DevTools (F12) → Network tab
              </div>
              <code className="block bg-muted p-3 rounded text-xs">
                • Use any tool (JWT decoder, JSON formatter, etc.)<br />
                • Watch the Network tab<br />
                • You&apos;ll see NO requests to external servers<br />
                • Only static assets (JS, CSS) from our domain
              </code>
            </div>

            <div>
              <div className="font-medium mb-1">2. Disconnect Your Internet</div>
              <div className="text-sm text-muted-foreground mb-2">
                After the page loads once, turn off your WiFi
              </div>
              <code className="block bg-muted p-3 rounded text-xs">
                • Disable your network connection<br />
                • Refresh the page (it will load from cache)<br />
                • All tools still work perfectly<br />
                • This proves no server communication
              </code>
            </div>

            <div>
              <div className="font-medium mb-1">3. Inspect the Source Code</div>
              <div className="text-sm text-muted-foreground mb-2">
                The code is open source and fully inspectable
              </div>
              <code className="block bg-muted p-3 rounded text-xs">
                • View page source (Ctrl+U / Cmd+U)<br />
                • Check the JavaScript files<br />
                • No API endpoints, no fetch() to external domains<br />
                • All processing is pure client-side functions
              </code>
            </div>

            <div>
              <div className="font-medium mb-1">4. Use the Privacy Badge</div>
              <div className="text-sm text-muted-foreground mb-2">
                Click the shield icon in the top bar
              </div>
              <code className="block bg-muted p-3 rounded text-xs">
                • Real-time network monitoring<br />
                • Shows any external requests (there are none)<br />
                • Transparent proof of privacy
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Technical Details
          </CardTitle>
          <CardDescription>
            A deeper look at how your privacy is protected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex gap-3">
              <Globe className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">Architecture</div>
                <div className="text-sm text-muted-foreground">
                  Static Vite SPA with client-side React components. The server only delivers HTML, JS, and CSS - it never receives or processes your data.
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <HardDrive className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">Data Storage</div>
                <div className="text-sm text-muted-foreground">
                  All preferences, favorites, and history are stored in <code className="bg-muted px-1 rounded text-xs">localStorage</code> — a browser-only storage mechanism that never syncs to any server.
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <FileCode className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">External Dependencies</div>
                <div className="text-sm text-muted-foreground">
                  All npm packages are bundled at build time into static JS files. No runtime calls to package CDNs or third-party APIs for data processing.
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <MonitorSmartphone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">CDN & Fonts</div>
                <div className="text-sm text-muted-foreground">
                  Static assets served via CDN. Google Fonts are loaded for typography — these are the only external requests and carry no user data.
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Fingerprint className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">Cryptography</div>
                <div className="text-sm text-muted-foreground">
                  Hash generation and JWT operations use the browser-native <code className="bg-muted px-1 rounded text-xs">Web Crypto API</code> — no external crypto libraries phone home.
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">Security Headers</div>
                <div className="text-sm text-muted-foreground">
                  Enforced via <code className="bg-muted px-1 rounded text-xs">HSTS</code>, <code className="bg-muted px-1 rounded text-xs">X-Frame-Options: DENY</code>, <code className="bg-muted px-1 rounded text-xs">CSP</code>, <code className="bg-muted px-1 rounded text-xs">COOP</code>, and <code className="bg-muted px-1 rounded text-xs">COEP</code> to prevent embedding, clickjacking, and cross-origin data leaks.
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Eye className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">Spell Check Disabled</div>
                <div className="text-sm text-muted-foreground">
                  All input fields disable browser spell check to prevent your data from being sent to cloud-based spell-check services (e.g. Enhanced Spellcheck in Chrome).
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Wifi className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">Network Monitor</div>
                <div className="text-sm text-muted-foreground">
                  A built-in monitor intercepts <code className="bg-muted px-1 rounded text-xs">fetch</code>, <code className="bg-muted px-1 rounded text-xs">XMLHttpRequest</code>, <code className="bg-muted px-1 rounded text-xs">sendBeacon</code>, and <code className="bg-muted px-1 rounded text-xs">WebSocket</code> to alert you if any external request is ever made.
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Fingerprint className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">Device Authentication (OTP)</div>
                <div className="text-sm text-muted-foreground">
                  The OTP Authenticator is protected by <code className="bg-muted px-1 rounded text-xs">WebAuthn</code> — your device&apos;s biometrics (Touch ID, Face ID, fingerprint), PIN, or system password. The credential is stored on your device&apos;s secure enclave and never leaves it.
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Lock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">Encrypted Backups (OTP)</div>
                <div className="text-sm text-muted-foreground">
                  OTP account exports are encrypted with <code className="bg-muted px-1 rounded text-xs">AES-256-GCM</code> using a key derived from your password via <code className="bg-muted px-1 rounded text-xs">PBKDF2</code> (100,000 iterations). Salt and IV are randomly generated per export. All encryption runs locally via the Web Crypto API.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground text-center">
        Questions? Check the source code or contact us for a security audit.
      </div>
    </div>
  );
}
