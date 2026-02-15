"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToolLayout } from "@/components/tool-layout";
import { HistorySidebar } from "@/components/history-sidebar";
import { Badge } from "@/components/ui/badge";

type PasswordMode = "character" | "word";
type WordList = "short" | "memorable" | "nato";
type Separator = "-" | "_" | "." | " " | "none";

const SHORT_WORDS = [
  "cat", "dog", "sun", "moon", "star", "tree", "fish", "bird", "rock", "wave",
  "fire", "wind", "rain", "snow", "leaf", "seed", "bear", "wolf", "lion", "deer",
  "blue", "red", "gold", "pink", "gray", "dark", "light", "soft", "hard", "fast",
  "slow", "hot", "cold", "new", "old", "big", "tiny", "tall", "wide", "deep"
];

const MEMORABLE_WORDS = [
  "apple", "banana", "cherry", "dragon", "eagle", "forest", "garden", "happy",
  "island", "jungle", "kitten", "lemon", "magic", "ninja", "ocean", "panda",
  "queen", "river", "sunset", "tiger", "unicorn", "valley", "wizard", "yellow",
  "zebra", "castle", "diamond", "emerald", "falcon", "galaxy", "harbor", "iceberg"
];

const NATO_WORDS = [
  "alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf", "hotel",
  "india", "juliet", "kilo", "lima", "mike", "november", "oscar", "papa",
  "quebec", "romeo", "sierra", "tango", "uniform", "victor", "whiskey", "xray",
  "yankee", "zulu"
];

export default function PasswordGeneratorPage() {
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<PasswordMode>("character");
  const [history, setHistory] = useState<string[]>([]);

  // Character-based settings
  const [length, setLength] = useState(16);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);

  // Word-based settings
  const [wordCount, setWordCount] = useState(4);
  const [wordList, setWordList] = useState<WordList>("memorable");
  const [separator, setSeparator] = useState<Separator>("-");
  const [capitalize, setCapitalize] = useState(true);
  const [charSubstitution, setCharSubstitution] = useState(false);

  const getWordList = (type: WordList): string[] => {
    switch (type) {
      case "short": return SHORT_WORDS;
      case "memorable": return MEMORABLE_WORDS;
      case "nato": return NATO_WORDS;
    }
  };

  const applyCharSubstitution = (word: string): string => {
    return word
      .replace(/a/gi, "4")
      .replace(/e/gi, "3")
      .replace(/i/gi, "1")
      .replace(/o/gi, "0")
      .replace(/s/gi, "5")
      .replace(/g/gi, "9")
      .replace(/t/gi, "7")
      .replace(/b/gi, "8");
  };

  const generateCharacterPassword = () => {
    let chars = "";
    if (uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (lowercase) chars += "abcdefghijklmnopqrstuvwxyz";
    if (numbers) chars += "0123456789";
    if (symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (!chars) return;

    let result = "";
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }

    setPassword(result);
    setHistory((prev) => [result, ...prev.slice(0, 19)]);
  };

  const generateWordPassword = () => {
    const words = getWordList(wordList);
    const selectedWords: string[] = [];
    
    const array = new Uint32Array(wordCount);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < wordCount; i++) {
      let word = words[array[i] % words.length];
      
      if (capitalize) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }
      
      if (charSubstitution) {
        word = applyCharSubstitution(word);
      }
      
      selectedWords.push(word);
    }

    const actualSeparator = separator === "none" ? "" : separator;
    const result = selectedWords.join(actualSeparator);
    setPassword(result);
    setHistory((prev) => [result, ...prev.slice(0, 19)]);
  };

  const generatePassword = () => {
    if (mode === "character") {
      generateCharacterPassword();
    } else {
      generateWordPassword();
    }
  };

  const renderPasswordWithColors = (pwd: string) => {
    if (!pwd) return null;

    if (mode === "word") {
      // For word-based passwords, color each word differently
      const actualSeparator = separator === "none" ? "" : separator;
      const words = actualSeparator ? pwd.split(actualSeparator) : [pwd];
      const colors = [
        "text-blue-600 dark:text-blue-400",
        "text-purple-600 dark:text-purple-400", 
        "text-pink-600 dark:text-pink-400",
        "text-orange-600 dark:text-orange-400",
        "text-green-600 dark:text-green-400",
        "text-cyan-600 dark:text-cyan-400",
        "text-yellow-600 dark:text-yellow-400",
        "text-red-600 dark:text-red-400"
      ];

      return (
        <div className="flex flex-wrap items-center gap-1 justify-center">
          {words.map((word, idx) => (
            <span key={idx}>
              <span className={`${colors[idx % colors.length]} font-bold`}>
                {word}
              </span>
              {idx < words.length - 1 && actualSeparator && (
                <span className="text-muted-foreground">{actualSeparator}</span>
              )}
            </span>
          ))}
        </div>
      );
    } else {
      // For character-based passwords, simple color scheme
      return (
        <div className="flex flex-wrap items-center justify-center gap-0.5">
          {pwd.split("").map((char, idx) => {
            let colorClass = "text-foreground"; // Default color
            if (/[a-zA-Z]/.test(char)) {
              colorClass = "text-blue-600 dark:text-blue-400"; // All letters (uppercase + lowercase)
            } else if (/[0-9]/.test(char)) {
              colorClass = "text-orange-600 dark:text-orange-400"; // Numbers
            } else if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(char)) {
              colorClass = "text-pink-600 dark:text-pink-400"; // Special characters
            }
            
            return (
              <span key={idx} className={`${colorClass} font-bold`}>
                {char}
              </span>
            );
          })}
        </div>
      );
    }
  };

  const getPasswordDescription = () => {
    if (!password) return "";
    if (mode === "word") {
      return `A memorable password created from ${wordList === "short" ? "short" : wordList === "nato" ? "NATO phonetic" : "memorable"} words`;
    }
    return "A secure random password with mixed characters";
  };

  const getStrengthInfo = () => {
    if (!password) return null;
    
    const len = password.length;
    let strength = "Weak";
    let color = "text-red-500";
    
    if (len >= 20) {
      strength = "Very Strong";
      color = "text-green-600";
    } else if (len >= 16) {
      strength = "Strong";
      color = "text-green-500";
    } else if (len >= 12) {
      strength = "Medium";
      color = "text-yellow-500";
    } else if (len >= 8) {
      strength = "Fair";
      color = "text-orange-500";
    }
    
    return { strength, color, length: len };
  };

  const strengthInfo = getStrengthInfo();

  return (
    <ToolLayout
      title="Password Generator"
      description="Generate secure passwords with character-based or word-based methods"
      sidebar={
        <HistorySidebar
          items={history}
          onSelect={setPassword}
          onClear={() => setHistory([])}
        />
      }
    >
      <div className="space-y-3">
        {/* Mode Selection */}
        <div className="p-3 bg-card border rounded-lg">
          <Label className="text-sm mb-2 block">Password Type</Label>
          <Tabs value={mode} onValueChange={(v) => setMode(v as PasswordMode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="character" className="text-xs">Character-Based</TabsTrigger>
              <TabsTrigger value="word" className="text-xs">Word-Based</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Settings */}
        <div className="p-3 bg-card border rounded-lg space-y-4">
          {mode === "character" ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Length: {length}</Label>
                </div>
                <Slider
                  value={[length]}
                  onValueChange={(v) => setLength(v[0])}
                  min={4}
                  max={64}
                  step={1}
                  className="py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="uppercase"
                    checked={uppercase}
                    onCheckedChange={(c) => setUppercase(!!c)}
                  />
                  <Label htmlFor="uppercase" className="cursor-pointer text-xs">
                    Uppercase (A-Z)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lowercase"
                    checked={lowercase}
                    onCheckedChange={(c) => setLowercase(!!c)}
                  />
                  <Label htmlFor="lowercase" className="cursor-pointer text-xs">
                    Lowercase (a-z)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="numbers"
                    checked={numbers}
                    onCheckedChange={(c) => setNumbers(!!c)}
                  />
                  <Label htmlFor="numbers" className="cursor-pointer text-xs">
                    Numbers (0-9)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="symbols"
                    checked={symbols}
                    onCheckedChange={(c) => setSymbols(!!c)}
                  />
                  <Label htmlFor="symbols" className="cursor-pointer text-xs">
                    Symbols (!@#$...)
                  </Label>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Word Count: {wordCount}</Label>
                </div>
                <Slider
                  value={[wordCount]}
                  onValueChange={(v) => setWordCount(v[0])}
                  min={2}
                  max={8}
                  step={1}
                  className="py-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="wordlist" className="text-xs text-muted-foreground">
                    Word List
                  </Label>
                  <Select value={wordList} onValueChange={(v) => setWordList(v as WordList)}>
                    <SelectTrigger id="wordlist" className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short" className="text-xs">Short Words (3-4 chars)</SelectItem>
                      <SelectItem value="memorable" className="text-xs">Memorable Words</SelectItem>
                      <SelectItem value="nato" className="text-xs">NATO Phonetic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="separator" className="text-xs text-muted-foreground">
                    Separator
                  </Label>
                  <Select value={separator} onValueChange={(v) => setSeparator(v as Separator)}>
                    <SelectTrigger id="separator" className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-" className="text-xs">Hyphen (-)</SelectItem>
                      <SelectItem value="_" className="text-xs">Underscore (_)</SelectItem>
                      <SelectItem value="." className="text-xs">Dot (.)</SelectItem>
                      <SelectItem value=" " className="text-xs">Space ( )</SelectItem>
                      <SelectItem value="none" className="text-xs">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="capitalize"
                    checked={capitalize}
                    onCheckedChange={(c) => setCapitalize(!!c)}
                  />
                  <Label htmlFor="capitalize" className="cursor-pointer text-xs">
                    Capitalize Words
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="charSub"
                    checked={charSubstitution}
                    onCheckedChange={(c) => setCharSubstitution(!!c)}
                  />
                  <Label htmlFor="charSub" className="cursor-pointer text-xs">
                    Character Substitution
                  </Label>
                </div>
              </div>

              {charSubstitution && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded border">
                  <strong>Substitutions:</strong> a→4, e→3, i→1, o→0, s→5, g→9, t→7, b→8
                </div>
              )}
            </>
          )}
        </div>

        {/* Generate Button */}
        <Button onClick={generatePassword} className="w-full" size="sm">
          Generate Password
        </Button>

        {/* Generated Password */}
        {password && (
          <div className="relative overflow-hidden">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-lg" />
            
            <div className="relative p-6 bg-card/80 backdrop-blur-sm border rounded-lg space-y-4">
              {/* Header */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Generated Password</h3>
                  {strengthInfo && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs font-semibold ${strengthInfo.color} border-current`}
                    >
                      {strengthInfo.strength}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {getPasswordDescription()}
                </p>
              </div>

              {/* Password Display with Colors */}
              <div className="relative">
                <div className="p-4 bg-gray-100 dark:bg-black/40 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-white/10">
                  <div className="text-2xl font-mono tracking-wide break-all">
                    {renderPasswordWithColors(password)}
                  </div>
                </div>
              </div>

              {/* Copy Button */}
              <div className="flex justify-center">
                <Button
                  onClick={async () => {
                    try {
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(password);
                      } else {
                        // Fallback for older browsers
                        const textArea = document.createElement("textarea");
                        textArea.value = password;
                        textArea.style.position = "fixed";
                        textArea.style.left = "-999999px";
                        textArea.setAttribute("aria-hidden", "true");
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand("copy");
                        document.body.removeChild(textArea);
                      }
                    } catch (err) {
                      console.error("Failed to copy:", err);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                  Copy Password
                </Button>
              </div>

              {/* Stats */}
              {strengthInfo && (
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                  <span>Length: {strengthInfo.length} characters</span>
                  <span>Entropy: ~{Math.floor(strengthInfo.length * 4)} bits</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-card border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">Character-Based</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Random characters from selected sets. Maximum entropy but harder to remember. Best for password managers.
            </p>
          </div>

          <div className="p-3 bg-card border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">Word-Based</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Memorable passphrases using real words. Easier to type and remember. Good balance of security and usability.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
