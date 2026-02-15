import { Shield, Lock, Eye, Server, Wifi, Code } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Privacy & Security",
  description: "Learn how DevToolbox guarantees your privacy. 100% client-side processing, no analytics, no tracking, no data collection.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
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
            <Shield className="h-5 w-5 text-green-600" />
            100% Client-Side Processing
          </CardTitle>
          <CardDescription>
            All tools run entirely in your browser using JavaScript
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex gap-3">
              <Lock className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">No Server Processing</div>
                <div className="text-sm text-muted-foreground">
                  Your sensitive data (JWTs, API keys, JSON) never touches our servers
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Eye className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">No Analytics</div>
                <div className="text-sm text-muted-foreground">
                  We don't track what you do or what data you process
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Server className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">No Database</div>
                <div className="text-sm text-muted-foreground">
                  We don't store anything. History is saved in your browser only
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Wifi className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Works Offline</div>
                <div className="text-sm text-muted-foreground">
                  After first load, all tools work without internet
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            How to Verify
          </CardTitle>
          <CardDescription>
            Don't trust us? Verify it yourself
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <div className="font-medium mb-1">1. Check Network Activity</div>
              <div className="text-sm text-muted-foreground mb-2">
                Open your browser's DevTools (F12) → Network tab
              </div>
              <code className="block bg-muted p-3 rounded text-xs">
                • Use any tool (JWT decoder, JSON formatter, etc.)<br />
                • Watch the Network tab<br />
                • You'll see NO requests to external servers<br />
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
                Our code is open source (if applicable) or inspectable
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
                Click the green shield icon in the top bar
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
          <CardTitle>Technical Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <span className="font-medium">Architecture:</span> Static Next.js app with client-side React components
          </div>
          <div>
            <span className="font-medium">Data Storage:</span> localStorage only (stays in your browser)
          </div>
          <div>
            <span className="font-medium">External Dependencies:</span> None for data processing
          </div>
          <div>
            <span className="font-medium">CDN:</span> Only for serving static assets (HTML, JS, CSS)
          </div>
          <div>
            <span className="font-medium">Fonts:</span> Google Fonts (can be self-hosted if needed)
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground text-center">
        Questions? Check the source code or contact us for a security audit.
      </div>
    </div>
  );
}
