import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToolLayout } from "@/components/tool-layout";
import { HistorySidebar } from "@/components/history-sidebar";
import { ActionToolbar } from "@/components/action-toolbar";
import { Badge } from "@/components/ui/badge";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { toast } from "@/hooks/use-toast";
import { Copy, RefreshCw, Trash2 } from "lucide-react";

type PasswordMode = "character" | "word" | "diceware";
type WordList = "short" | "memorable" | "nato";
type Separator = "-" | "_" | "." | " " | "none";

interface DicewareSettings {
  wordCount: number;
  separator: Separator;
  capitalize: boolean;
}

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


// Task 4.1: Module-level diceware list cache and fetcher
let dicewareListCache: string[] | null = null;

async function fetchDicewareList(): Promise<string[]> {
  if (dicewareListCache) return dicewareListCache;
  const response = await fetch("/data/diceware-wordlist.json");
  if (!response.ok) throw new Error("Failed to fetch Diceware word list");
  const list: string[] = await response.json();
  dicewareListCache = list;
  return list;
}

// Task 2.5: Entropy-based strength assessment
function getStrengthFromEntropy(entropy: number): { strength: string; color: string } {
  if (entropy >= 100) return { strength: "Very Strong", color: "text-green-600" };
  if (entropy >= 80) return { strength: "Strong", color: "text-green-500" };
  if (entropy >= 60) return { strength: "Medium", color: "text-yellow-500" };
  if (entropy >= 40) return { strength: "Fair", color: "text-orange-500" };
  return { strength: "Weak", color: "text-red-500" };
}

export default function PasswordGeneratorPage() {
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<PasswordMode>("character");
  const [history, setHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

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

  // Task 2.1: Diceware-specific state
  const [dicewareWordCount, setDicewareWordCount] = useState(6);
  const [dicewareSeparator, setDicewareSeparator] = useState<Separator>("-");
  const [dicewareCapitalize, setDicewareCapitalize] = useState(true);

  // Task 2.1: Diceware fetch state
  const [dicewareList, setDicewareList] = useState<string[] | null>(null);
  const [dicewareLoading, setDicewareLoading] = useState(false);
  const [dicewareError, setDicewareError] = useState<string | null>(null);


  // Task 6.1: Restore mode and diceware settings from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedMode = localStorage.getItem("password-generator-mode");
      if (savedMode === "character" || savedMode === "word" || savedMode === "diceware") {
        setMode(savedMode);
      }
    } catch (e) {
      console.error("Failed to load mode:", e);
    }
    try {
      const savedSettings = localStorage.getItem("password-generator-diceware-settings");
      if (savedSettings) {
        const parsed: DicewareSettings = JSON.parse(savedSettings);
        if (typeof parsed.wordCount === "number") {
          setDicewareWordCount(Math.max(4, Math.min(8, parsed.wordCount)));
        }
        if (["-", "_", ".", " ", "none"].includes(parsed.separator)) {
          setDicewareSeparator(parsed.separator);
        }
        if (typeof parsed.capitalize === "boolean") {
          setDicewareCapitalize(parsed.capitalize);
        }
      }
    } catch (e) {
      console.error("Failed to load diceware settings:", e);
    }
  }, []);

  // Task 6.1: Persist mode to localStorage on change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("password-generator-mode", mode);
    } catch (e) {
      console.error("Failed to save mode:", e);
    }
  }, [mode]);

  // Task 6.1: Persist diceware settings to localStorage on change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const settings: DicewareSettings = {
        wordCount: dicewareWordCount,
        separator: dicewareSeparator,
        capitalize: dicewareCapitalize,
      };
      localStorage.setItem("password-generator-diceware-settings", JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save diceware settings:", e);
    }
  }, [dicewareWordCount, dicewareSeparator, dicewareCapitalize]);

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


  const generateCharacterPassword = useCallback(() => {
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
  }, [length, uppercase, lowercase, numbers, symbols]);

  const generateWordPassword = useCallback(() => {
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
  }, [wordCount, wordList, separator, capitalize, charSubstitution]);

  // Task 4.2: Generate diceware password callback
  const generateDicewarePassword = useCallback(async () => {
    setDicewareLoading(true);
    setDicewareError(null);
    try {
      const list = await fetchDicewareList();
      setDicewareList(list);

      const selectedWords: string[] = [];
      const array = new Uint32Array(dicewareWordCount);
      crypto.getRandomValues(array);

      for (let i = 0; i < dicewareWordCount; i++) {
        let word = list[array[i] % list.length];
        if (dicewareCapitalize) {
          word = word.charAt(0).toUpperCase() + word.slice(1);
        }
        selectedWords.push(word);
      }

      const actualSeparator = dicewareSeparator === "none" ? "" : dicewareSeparator;
      const result = selectedWords.join(actualSeparator);
      setPassword(result);
      setHistory((prev) => [result, ...prev.slice(0, 19)]);
    } catch {
      setDicewareError("Failed to load Diceware word list. Falling back to word mode.");
      toast({ description: "Failed to load Diceware word list. Using word mode instead.", variant: "destructive" });
      setMode("word");
      setWordList("memorable");
    } finally {
      setDicewareLoading(false);
    }
  }, [dicewareWordCount, dicewareSeparator, dicewareCapitalize]);


  // Task 5.3: Updated generatePassword to handle diceware mode
  const generatePassword = useCallback(() => {
    if (mode === "character") {
      generateCharacterPassword();
    } else if (mode === "diceware") {
      void generateDicewarePassword();
    } else {
      generateWordPassword();
    }
  }, [mode, generateCharacterPassword, generateWordPassword, generateDicewarePassword]);

  // Auto-generate on mount
  useEffect(() => {
    generatePassword();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Regenerate when config changes
  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  // Task 5.3: Trigger fetch on diceware tab selection
  useEffect(() => {
    if (mode === "diceware" && !dicewareListCache) {
      void generateDicewarePassword();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleClear = useCallback(() => {
    setPassword("");
  }, []);

  const copyToClipboard = useCallback(async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ description: "Failed to copy", variant: "destructive" });
    }
  }, [password]);

  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "c",
        ctrl: true,
        shift: true,
        action: () => { void copyToClipboard(); },
        description: "Copy output",
      },
      {
        key: "x",
        ctrl: true,
        shift: true,
        action: handleClear,
        description: "Clear all",
      },
    ],
  });


  // Task 5.4: Handle renderPasswordWithColors for diceware mode
  const renderPasswordWithColors = (pwd: string) => {
    if (!pwd) return null;

    if (mode === "word" || mode === "diceware") {
      const activeSeparator = mode === "diceware" ? dicewareSeparator : separator;
      const actualSeparator = activeSeparator === "none" ? "" : activeSeparator;
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
      return (
        <div className="flex flex-wrap items-center justify-center gap-0.5">
          {pwd.split("").map((char, idx) => {
            let colorClass = "text-foreground";
            if (/[a-zA-Z]/.test(char)) {
              colorClass = "text-blue-600 dark:text-blue-400";
            } else if (/[0-9]/.test(char)) {
              colorClass = "text-orange-600 dark:text-orange-400";
            } else if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(char)) {
              colorClass = "text-pink-600 dark:text-pink-400";
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
    if (mode === "diceware") {
      return "A strong passphrase generated from the Diceware 7,776-word list";
    }
    if (mode === "word") {
      return `A memorable password created from ${wordList === "short" ? "short" : wordList === "nato" ? "NATO phonetic" : "memorable"} words`;
    }
    return "A secure random password with mixed characters";
  };

  // Task 2.2 & 2.5: Entropy-based strength info
  const getStrengthInfo = () => {
    if (!password) return null;

    const len = password.length;
    let entropy = 0;

    if (mode === "character") {
      let charPoolSize = 0;
      if (uppercase) charPoolSize += 26;
      if (lowercase) charPoolSize += 26;
      if (numbers) charPoolSize += 10;
      if (symbols) charPoolSize += 27;
      entropy = charPoolSize > 0 ? len * Math.log2(charPoolSize) : 0;
    } else if (mode === "word") {
      const listSize = getWordList(wordList).length;
      entropy = wordCount * Math.log2(listSize);
    } else {
      // diceware
      const listSize = dicewareList ? dicewareList.length : 7776;
      entropy = dicewareWordCount * Math.log2(listSize);
    }

    const { strength, color } = getStrengthFromEntropy(entropy);
    return { strength, color, length: len, entropy: Math.round(entropy) };
  };

  const strengthInfo = getStrengthInfo();
  const isEmpty = password.length === 0;


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
        {/* Mode Selection - Task 5.1: grid-cols-3 with Diceware tab */}
        <div className="p-3 bg-card border rounded-lg">
          <Label className="text-sm mb-2 block">Password Type</Label>
          <Tabs value={mode} onValueChange={(v) => setMode(v as PasswordMode)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="character" className="text-xs">Char</TabsTrigger>
              <TabsTrigger value="word" className="text-xs">Words</TabsTrigger>
              <TabsTrigger value="diceware" className="text-xs">Diceware</TabsTrigger>
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
          ) : mode === "word" ? (
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
                  <strong>Substitutions:</strong> a-&gt;4, e-&gt;3, i-&gt;1, o-&gt;0, s-&gt;5, g-&gt;9, t-&gt;7, b-&gt;8
                </div>
              )}
            </>
          ) : (

            /* Task 5.2: Diceware settings panel */
            <>
              {dicewareLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status" aria-label="Loading Diceware word list">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Loading Diceware word list...
                </div>
              )}

              {dicewareError && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-200 dark:border-red-800" role="alert">
                  {dicewareError}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Word Count: {dicewareWordCount}</Label>
                </div>
                <Slider
                  value={[dicewareWordCount]}
                  onValueChange={(v) => setDicewareWordCount(v[0])}
                  min={4}
                  max={8}
                  step={1}
                  className="py-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="diceware-separator" className="text-xs text-muted-foreground">
                    Separator
                  </Label>
                  <Select value={dicewareSeparator} onValueChange={(v) => setDicewareSeparator(v as Separator)}>
                    <SelectTrigger id="diceware-separator" className="h-8 text-xs">
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="diceware-capitalize"
                  checked={dicewareCapitalize}
                  onCheckedChange={(c) => setDicewareCapitalize(!!c)}
                />
                <Label htmlFor="diceware-capitalize" className="cursor-pointer text-xs">
                  Capitalize Words
                </Label>
              </div>
            </>
          )}
        </div>


        {/* Action Toolbar with Regenerate and Clear */}
        <ActionToolbar
          right={
            <>
              <Button onClick={generatePassword} size="sm" className="gap-2" aria-label="Regenerate password">
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Regenerate
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                size="sm"
                disabled={isEmpty}
                aria-label="Clear generated password"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </>
          }
        />

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
                  onClick={() => { void copyToClipboard(); }}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  aria-label="Copy password to clipboard"
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  {copied ? "Copied!" : "Copy Password"}
                </Button>
              </div>

              {/* Stats - Task 2.2: Updated entropy display */}
              {strengthInfo && (
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                  <span>Length: {strengthInfo.length} characters</span>
                  <span>Entropy: ~{strengthInfo.entropy} bits</span>
                </div>
              )}
            </div>
          </div>
        )}


        {/* Info Cards - Task 7.1: grid-cols-3 with Diceware card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

          <div className="p-3 bg-card border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">Diceware</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Diceware passphrases from a 7,776-word list. Each word adds ~12.9 bits of entropy. Created by Arnold Reinhold, widely recommended for strong, memorable passphrases.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
