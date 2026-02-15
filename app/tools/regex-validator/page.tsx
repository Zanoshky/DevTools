"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ToolLayout } from "@/components/tool-layout";
import { CopyInput } from "@/components/copy-input";
import { CopyTextarea } from "@/components/copy-textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  XCircle,
  Info,
  Lightbulb,
  Copy,
} from "lucide-react";

interface Match {
  text: string;
  index: number;
  groups: Record<string, string>;
  length: number;
}

const commonPatterns = {
  email: {
    pattern: "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b",
    description: "Email address",
    sample: "john@example.com, support@company.org",
  },
  url: {
    pattern: "https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)",
    description: "URL",
    sample: "https://example.com, http://www.test.org/path",
  },
  phone: {
    pattern: "\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}",
    description: "US Phone number",
    sample: "(555) 123-4567, 555-123-4567, 5551234567",
  },
  ipv4: {
    pattern: "\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b",
    description: "IPv4 address",
    sample: "192.168.1.1, 10.0.0.1, 255.255.255.0",
  },
  ipv6: {
    pattern: "(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|::(?:ffff(?::0{1,4})?:)?(?:(?:25[0-5]|(?:2[0-4]|1?[0-9])?[0-9])\\.){3}(?:25[0-5]|(?:2[0-4]|1?[0-9])?[0-9])",
    description: "IPv6 address",
    sample: "2001:0db8:85a3:0000:0000:8a2e:0370:7334, ::1, fe80::1",
  },
  dateYMD: {
    pattern: "\\d{4}-\\d{2}-\\d{2}",
    description: "Date (YYYY-MM-DD)",
    sample: "2024-01-15, 2023-12-31",
  },
  dateDMY: {
    pattern: "\\d{2}-\\d{2}-\\d{4}",
    description: "Date (DD-MM-YYYY)",
    sample: "15-01-2024, 31-12-2023",
  },
  hex: {
    pattern: "#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})",
    description: "Hex color",
    sample: "#FF5733, #f00, 3498db",
  },
  username: {
    pattern: "[a-zA-Z0-9_-]{3,16}",
    description: "Username (3-16 chars)",
    sample: "john_doe, user123, test-user",
  },
  password: {
    pattern: "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}",
    description: "Strong password",
    sample: "Pass123!, MyP@ssw0rd",
  },
};

export default function RegexTesterPage() {
  const [pattern, setPattern] = useState("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b");
  const [testString, setTestString] = useState("Contact: john@example.com or support@company.org");
  const [flags, setFlags] = useState({ g: true, i: true, m: false, s: false, u: false });
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState("");
  const [highlightedText, setHighlightedText] = useState("");

  const testRegex = useCallback(() => {
    setError("");
    setMatches([]);

    if (!pattern) {
      setHighlightedText(testString);
      return;
    }

    try {
      const flagString = Object.entries(flags)
        .filter(([, enabled]) => enabled)
        .map(([flag]) => flag)
        .join("");

      const regex = new RegExp(pattern, flagString);
      const foundMatches: Match[] = [];

      if (flags.g) {
        let match: RegExpExecArray | null;
        const regexCopy = new RegExp(pattern, flagString);
        while ((match = regexCopy.exec(testString)) !== null) {
          foundMatches.push({
            text: match[0],
            index: match.index,
            groups: match.groups || {},
            length: match[0].length,
          });
        }
      } else {
        const match = regex.exec(testString);
        if (match) {
          foundMatches.push({
            text: match[0],
            index: match.index,
            groups: match.groups || {},
            length: match[0].length,
          });
        }
      }

      setMatches(foundMatches);
      
      // Create highlighted text with proper escaping
      if (foundMatches.length > 0) {
        let highlighted = "";
        let lastIndex = 0;
        
        foundMatches.forEach((match) => {
          // Escape HTML in non-matched text
          const beforeMatch = testString.slice(lastIndex, match.index);
          highlighted += escapeHtml(beforeMatch);
          // Escape HTML in matched text
          highlighted += `<mark class="bg-yellow-200 dark:bg-yellow-800">${escapeHtml(match.text)}</mark>`;
          lastIndex = match.index + match.length;
        });
        // Escape HTML in remaining text
        highlighted += escapeHtml(testString.slice(lastIndex));
        setHighlightedText(highlighted);
      } else {
        setHighlightedText(escapeHtml(testString));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid regex");
      setHighlightedText(escapeHtml(testString));
    }
  }, [pattern, testString, flags]);

  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      testRegex();
    }, 300);

    return () => clearTimeout(timer);
  }, [pattern, testString, flags, testRegex]);

  const loadPattern = (key: string) => {
    const selected = commonPatterns[key as keyof typeof commonPatterns];
    if (selected) {
      setPattern(selected.pattern);
      setTestString(selected.sample);
    }
  };

  const generateCode = (language: string) => {
    const flagString = Object.entries(flags)
      .filter(([, enabled]) => enabled)
      .map(([flag]) => flag)
      .join("");

    switch (language) {
      case "javascript":
        return `const regex = /${pattern}/${flagString};\nconst matches = text.match(regex);`;
      case "python":
        return `import re\npattern = r"${pattern}"\nmatches = re.findall(pattern, text${flagString.includes('i') ? ', re.IGNORECASE' : ''})`;
      case "java":
        return `Pattern pattern = Pattern.compile("${pattern}"${flagString.includes('i') ? ', Pattern.CASE_INSENSITIVE' : ''});\nMatcher matcher = pattern.matcher(text);`;
      case "php":
        return `$pattern = '/${pattern}/${flagString}';\npreg_match_all($pattern, $text, $matches);`;
      default:
        return "";
    }
  };

  const copyCode = (language: string) => {
    navigator.clipboard.writeText(generateCode(language));
  };

  return (
    <ToolLayout
      title="Regex Tester"
      description="Test and validate regular expressions with real-time matching and code generation"
    >
      <div className="space-y-3">
        {/* Configuration Toolbar */}
        <div className="p-3 bg-card border rounded-lg space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Quick Patterns</Label>
            <Select onValueChange={loadPattern}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select a common pattern..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(commonPatterns).map(([key, { description }]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Flags</Label>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="flag-g"
                  checked={flags.g}
                  onCheckedChange={(c) => setFlags((prev) => ({ ...prev, g: !!c }))}
                />
                <Label htmlFor="flag-g" className="cursor-pointer text-xs">
                  g (global)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="flag-i"
                  checked={flags.i}
                  onCheckedChange={(c) => setFlags((prev) => ({ ...prev, i: !!c }))}
                />
                <Label htmlFor="flag-i" className="cursor-pointer text-xs">
                  i (ignore case)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="flag-m"
                  checked={flags.m}
                  onCheckedChange={(c) => setFlags((prev) => ({ ...prev, m: !!c }))}
                />
                <Label htmlFor="flag-m" className="cursor-pointer text-xs">
                  m (multiline)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="flag-s"
                  checked={flags.s}
                  onCheckedChange={(c) => setFlags((prev) => ({ ...prev, s: !!c }))}
                />
                <Label htmlFor="flag-s" className="cursor-pointer text-xs">
                  s (dotAll)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="flag-u"
                  checked={flags.u}
                  onCheckedChange={(c) => setFlags((prev) => ({ ...prev, u: !!c }))}
                />
                <Label htmlFor="flag-u" className="cursor-pointer text-xs">
                  u (unicode)
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Pattern Input */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Regex Pattern</Label>
          <CopyInput
            value={pattern}
            onChange={setPattern}
            placeholder="Enter regex pattern..."
            className="font-mono text-xs"
          />
        </div>

        {/* Input/Output Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Test String */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Test String</Label>
            <CopyTextarea
              value={testString}
              onChange={setTestString}
              placeholder="Enter text to test..."
              rows={20}
              className="font-mono text-xs"
            />
          </div>

          {/* Results */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Results</Label>
            <div className="border rounded-lg p-3 bg-card min-h-[520px] overflow-y-auto">
              {error ? (
                <Alert variant="destructive" className="text-xs">
                  <XCircle className="h-3 w-3" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">

                  <div className="flex items-center gap-2 mb-3">
                    {matches.length > 0 ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-semibold text-green-600 dark:text-green-400 text-sm">
                          {matches.length} Match{matches.length !== 1 ? "es" : ""} Found
                        </span>
                      </>
                    ) : (
                      <>
                        <Info className="h-5 w-5 text-blue-500" />
                        <span className="font-semibold text-muted-foreground text-sm">
                          No matches found
                        </span>
                      </>
                    )}
                  </div>

                  <Tabs defaultValue="matches" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="matches" className="text-xs">Matches</TabsTrigger>
                      <TabsTrigger value="highlighted" className="text-xs">Highlighted</TabsTrigger>
                      <TabsTrigger value="code" className="text-xs">Code</TabsTrigger>
                    </TabsList>

                    <TabsContent value="matches" className="space-y-2 mt-3">
                      {matches.length > 0 ? (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {matches.map((match, i) => (
                            <div
                              key={i}
                              className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                            >
                              <div className="flex items-start justify-between mb-1">
                                <Badge variant="outline" className="text-xs">
                                  Match {i + 1}
                                </Badge>
                                <div className="text-xs text-muted-foreground">
                                  Pos: {match.index}-{match.index + match.length}
                                </div>
                              </div>
                              <div className="font-mono text-xs text-green-700 dark:text-green-300 break-all">
                                {match.text}
                              </div>
                              {Object.keys(match.groups).length > 0 && (
                                <div className="mt-1 pt-1 border-t border-green-200 dark:border-green-800">
                                  <div className="text-xs font-semibold mb-0.5">Groups:</div>
                                  {Object.entries(match.groups).map(([name, value]) => (
                                    <div key={name} className="text-xs">
                                      <span className="font-mono">{name}:</span> {value}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground text-xs">
                          <Info className="h-8 w-8 mx-auto mb-2" />
                          <p>No matches found</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="highlighted" className="mt-3">
                      <div className="p-3 rounded-lg bg-muted/50 border">
                        <div
                          className="font-mono text-xs whitespace-pre-wrap break-all"
                          dangerouslySetInnerHTML={{ __html: highlightedText }}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="code" className="space-y-2 mt-3">
                      <Alert className="text-xs">
                        <Lightbulb className="h-3 w-3" />
                        <AlertDescription className="text-xs">
                          Copy the regex pattern in your preferred language
                        </AlertDescription>
                      </Alert>

                      {["javascript", "python", "java", "php"].map((lang) => (
                        <div key={lang} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Label className="capitalize text-xs">{lang}</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyCode(lang)}
                              className="h-7 text-xs"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                          <div className="p-2 rounded-lg bg-muted/50 border font-mono text-xs overflow-x-auto">
                            <pre>{generateCode(lang)}</pre>
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
