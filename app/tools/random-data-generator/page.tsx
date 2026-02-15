"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ToolLayout } from "@/components/tool-layout";
import { CopyTextarea } from "@/components/copy-textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

type DataType = 
  // Personal
  | "firstName" | "lastName" | "fullName" | "email" | "username" | "password" | "phone" 
  | "gender" | "age" | "title" | "ssn" | "avatar"
  // Address
  | "streetNumber" | "streetName" | "streetSuffix" | "streetAddress" | "addressLine2" 
  | "city" | "state" | "zip" | "country" | "countryCode" | "latitude" | "longitude"
  // Company
  | "company" | "companySuffix" | "jobTitle" | "department" | "ein"
  // Finance
  | "creditCard" | "creditCardType" | "iban" | "bankName" | "bankRouting" 
  | "currency" | "currencyCode" | "amount" | "bitcoinAddress" | "ethereumAddress"
  // Internet
  | "url" | "website" | "domain" | "ipv4" | "ipv6" | "mac" | "userAgent" | "emoji"
  // Product
  | "productName" | "productCategory" | "productPrice" | "sku" | "barcode"
  // Tech
  | "uuid" | "shortUuid" | "guid" | "ulid" | "mongoId" | "md5" | "sha1" | "sha256"
  | "appName" | "appVersion" | "appBundleId" | "mimeType"
  // Transport
  | "carMake" | "carModel" | "carYear" | "vin" | "licensePlate"
  | "airportCode" | "airportName" | "flightNumber" | "airline"
  // Date/Time
  | "date" | "time" | "datetime" | "timezone" | "timestamp"
  // Text
  | "sentence" | "paragraph" | "word" | "buzzword" | "catchPhrase" | "slogan"
  // Color
  | "color" | "hexColor" | "shortHexColor" | "rgb"
  // Other
  | "boolean" | "number" | "language" | "languageCode" | "status" | "tag" | "note";

type OutputFormat = "list" | "json" | "csv";

type DataCategory = {
  name: string;
  types: DataType[];
};

const FIRST_NAMES = [
  "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
  "William", "Barbara", "David", "Elizabeth", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa"
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
  "Taylor", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris"
];

const CITIES = [
  "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
  "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville",
  "Fort Worth", "Columbus", "Charlotte", "San Francisco", "Indianapolis", "Seattle"
];

const STATES = ["NY", "CA", "TX", "FL", "IL", "PA", "OH", "GA", "NC", "MI"];

const DOMAINS = ["example.com", "test.com", "demo.com", "sample.org", "mail.com"];

const STREETS = ["Main St", "Oak Ave", "Maple Dr", "Park Blvd", "Washington St", "Lake Rd"];

const STREET_SUFFIXES = ["Street", "Avenue", "Boulevard", "Drive", "Court", "Lane", "Road", "Way", "Place", "Terrace"];

const ADDRESS_LINE_2 = ["Apt", "Suite", "Unit", "Floor", "Room", "Building", "PO Box"];

const COMPANIES = [
  "Tech Corp", "Global Industries", "Innovative Solutions", "Digital Systems", "Smart Technologies",
  "Future Enterprises", "Prime Services", "Elite Group", "Apex Corporation", "Nexus Inc"
];

const COMPANY_SUFFIXES = ["Inc", "LLC", "Corp", "Ltd", "Group", "Co", "Partners", "Associates"];

const JOB_TITLES = [
  "Software Engineer", "Product Manager", "Data Analyst", "UX Designer", "Marketing Manager",
  "Sales Representative", "HR Specialist", "Financial Analyst", "Project Manager", "DevOps Engineer",
  "Content Writer", "Customer Success Manager", "Business Analyst", "QA Engineer", "Accountant"
];

const DEPARTMENTS = [
  "Engineering", "Sales", "Marketing", "Human Resources", "Finance", "Operations",
  "Customer Service", "IT", "Legal", "Research & Development"
];

const COUNTRIES = [
  "United States", "Canada", "United Kingdom", "Germany", "France", "Spain", "Italy",
  "Australia", "Japan", "China", "India", "Brazil", "Mexico", "Netherlands", "Sweden"
];

const COUNTRY_CODES = ["US", "CA", "GB", "DE", "FR", "ES", "IT", "AU", "JP", "CN", "IN", "BR", "MX", "NL", "SE"];

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR", "BRL"];

const LANGUAGES = ["English", "Spanish", "French", "German", "Chinese", "Japanese", "Portuguese", "Russian", "Arabic", "Hindi"];

const LANGUAGE_CODES = ["en", "es", "fr", "de", "zh", "ja", "pt", "ru", "ar", "hi"];

const TIMEZONES = [
  "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Tokyo",
  "Asia/Shanghai", "Australia/Sydney", "America/Chicago", "America/Denver", "Europe/Berlin"
];

const STATUSES = ["Active", "Inactive", "Pending", "Completed", "In Progress", "Cancelled", "Draft", "Published"];

const TITLES = ["Mr", "Mrs", "Ms", "Dr", "Prof"];

const TAGS = ["important", "urgent", "review", "approved", "pending", "archived", "featured", "new", "popular", "trending"];

const EMOJIS = ["😀", "😃", "😄", "😁", "🎉", "🎊", "🎈", "🎁", "🌟", "⭐", "✨", "💫", "🔥", "💯", "✅", "❌", "⚠️", "📌", "🚀", "💡"];

const SENTENCES = [
  "The quick brown fox jumps over the lazy dog.",
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  "Technology is rapidly changing the way we live and work.",
  "Innovation drives progress in every industry.",
  "Data analysis helps make better business decisions."
];

const WORDS = ["lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do"];

const BUZZWORDS = ["synergy", "leverage", "paradigm", "disruptive", "innovative", "scalable", "agile", "robust"];

const CATCH_PHRASES = [
  "Innovative solutions for tomorrow",
  "Empowering your digital future",
  "Excellence in every detail",
  "Where quality meets innovation"
];

const SLOGANS = [
  "Just do it",
  "Think different",
  "The ultimate driving machine",
  "Because you're worth it"
];

const BANKS = ["Bank of America", "Wells Fargo", "JPMorgan Chase", "Citibank", "US Bank"];

const CREDIT_CARD_TYPES = ["Visa", "Mastercard", "American Express", "Discover"];

const CAR_MAKES = ["Toyota", "Honda", "Ford", "Chevrolet", "BMW", "Mercedes-Benz", "Audi", "Tesla"];

const CAR_MODELS = ["Camry", "Accord", "F-150", "Silverado", "3 Series", "C-Class", "A4", "Model 3"];

const AIRPORTS = ["JFK", "LAX", "ORD", "DFW", "ATL", "SFO", "LHR", "CDG"];

const AIRPORT_NAMES = [
  "John F. Kennedy International Airport",
  "Los Angeles International Airport",
  "O'Hare International Airport",
  "Dallas/Fort Worth International Airport"
];

const AIRLINES = ["American Airlines", "Delta Air Lines", "United Airlines", "Southwest Airlines"];

const PRODUCT_NAMES = [
  "Wireless Headphones", "Smart Watch", "Laptop Stand", "Coffee Maker", "Desk Lamp",
  "Backpack", "Water Bottle", "Phone Case", "Keyboard", "Mouse"
];

const PRODUCT_CATEGORIES = [
  "Electronics", "Clothing", "Home & Garden", "Sports & Outdoors", "Books",
  "Toys & Games", "Health & Beauty", "Automotive", "Food & Beverage"
];

const APP_NAMES = ["PhotoShare", "TaskMaster", "FitTracker", "BudgetPro", "NoteTaker"];

const MIME_TYPES = [
  "text/plain", "text/html", "application/json", "application/pdf", "image/png",
  "image/jpeg", "video/mp4", "audio/mpeg"
];

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
];

const DATA_CATEGORIES: DataCategory[] = [
  {
    name: "Personal",
    types: ["firstName", "lastName", "fullName", "email", "username", "password", "phone", "gender", "age", "title", "ssn", "avatar"]
  },
  {
    name: "Address",
    types: ["streetNumber", "streetName", "streetSuffix", "streetAddress", "addressLine2", "city", "state", "zip", "country", "countryCode", "latitude", "longitude"]
  },
  {
    name: "Company",
    types: ["company", "companySuffix", "jobTitle", "department", "ein"]
  },
  {
    name: "Finance",
    types: ["creditCard", "creditCardType", "iban", "bankName", "bankRouting", "currency", "currencyCode", "amount", "bitcoinAddress", "ethereumAddress"]
  },
  {
    name: "Internet",
    types: ["url", "website", "domain", "ipv4", "ipv6", "mac", "userAgent", "emoji"]
  },
  {
    name: "Product",
    types: ["productName", "productCategory", "productPrice", "sku", "barcode"]
  },
  {
    name: "Tech/IDs",
    types: ["uuid", "shortUuid", "guid", "ulid", "mongoId", "md5", "sha1", "sha256", "appName", "appVersion", "appBundleId", "mimeType"]
  },
  {
    name: "Transport",
    types: ["carMake", "carModel", "carYear", "vin", "licensePlate", "airportCode", "airportName", "flightNumber", "airline"]
  },
  {
    name: "Date/Time",
    types: ["date", "time", "datetime", "timezone", "timestamp"]
  },
  {
    name: "Text",
    types: ["sentence", "paragraph", "word", "buzzword", "catchPhrase", "slogan"]
  },
  {
    name: "Color",
    types: ["color", "hexColor", "shortHexColor", "rgb"]
  },
  {
    name: "Other",
    types: ["boolean", "number", "language", "languageCode", "status", "tag", "note"]
  }
];

export default function RandomDataGeneratorPage() {
  const [selectedTypes, setSelectedTypes] = useState<DataType[]>(["email"]);
  const [count, setCount] = useState(10);
  const [output, setOutput] = useState("");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("list");
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggleType = (t: DataType) => {
    setSelectedTypes(prev => {
      if (prev.includes(t)) {
        // Don't allow deselecting if it's the last one
        if (prev.length === 1) return prev;
        return prev.filter(type => type !== t);
      } else {
        return [...prev, t];
      }
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const downloadFile = () => {
    const extensions: Record<OutputFormat, string> = {
      list: "txt",
      json: "json",
      csv: "csv"
    };
    
    const filename = `random-data-${Date.now()}.${extensions[outputFormat]}`;
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const generateFirstName = () => FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  
  const generateLastName = () => LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];

  const generateEmail = () => {
    const name = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)].toLowerCase();
    const num = Math.floor(Math.random() * 1000);
    const domain = DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
    return `${name}${num}@${domain}`;
  };

  const generateFullName = () => {
    const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    return `${first} ${last}`;
  };

  const generateUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const generateShortUUID = () => {
    return "xxxxxxxx".replace(/[x]/g, () => {
      return ((Math.random() * 16) | 0).toString(16);
    });
  };

  const generateGUID = () => generateUUID();
  
  const generateULID = () => {
    const timestamp = Date.now().toString(36).toUpperCase().padStart(10, '0');
    const random = Array.from({ length: 16 }, () => 
      Math.floor(Math.random() * 36).toString(36)
    ).join('').toUpperCase();
    return timestamp + random;
  };
  
  const generateMongoId = () => {
    return Array.from({ length: 24 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  };
  
  const generateMD5 = () => {
    return Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  };
  
  const generateSHA1 = () => {
    return Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  };
  
  const generateSHA256 = () => {
    return Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  };

  const generateHexColor = () => {
    return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
  };
  
  const generateShortHexColor = () => {
    return "#" + Array.from({ length: 3 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  };
  
  const generateRGB = () => {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const generatePhone = () => {
    const area = Math.floor(Math.random() * 900) + 100;
    const prefix = Math.floor(Math.random() * 900) + 100;
    const line = Math.floor(Math.random() * 9000) + 1000;
    return `(${area}) ${prefix}-${line}`;
  };
  
  const generateStreetNumber = () => (Math.floor(Math.random() * 9999) + 1).toString();
  
  const generateStreetName = () => {
    const names = ["Main", "Oak", "Maple", "Pine", "Cedar", "Elm", "Washington", "Park", "Lake", "Hill"];
    return names[Math.floor(Math.random() * names.length)];
  };
  
  const generateStreetSuffix = () => STREET_SUFFIXES[Math.floor(Math.random() * STREET_SUFFIXES.length)];

  const generateStreetAddress = () => {
    const num = Math.floor(Math.random() * 9999) + 1;
    const name = generateStreetName();
    const suffix = generateStreetSuffix();
    return `${num} ${name} ${suffix}`;
  };
  
  const generateAddressLine2 = () => {
    const type = ADDRESS_LINE_2[Math.floor(Math.random() * ADDRESS_LINE_2.length)];
    const num = Math.floor(Math.random() * 999) + 1;
    return `${type} ${num}`;
  };

  const generateCity = () => CITIES[Math.floor(Math.random() * CITIES.length)];
  
  const generateState = () => STATES[Math.floor(Math.random() * STATES.length)];
  
  const generateZip = () => (Math.floor(Math.random() * 90000) + 10000).toString();
  
  const generateCountry = () => COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
  
  const generateCountryCode = () => COUNTRY_CODES[Math.floor(Math.random() * COUNTRY_CODES.length)];

  const generateDate = () => {
    const start = new Date(2020, 0, 1);
    const end = new Date();
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
  };
  
  const generateTime = () => {
    const hour = Math.floor(Math.random() * 24);
    const minute = Math.floor(Math.random() * 60);
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };
  
  const generateDatetime = () => {
    const start = new Date(2020, 0, 1);
    const end = new Date();
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString();
  };
  
  const generateTimestamp = () => Math.floor(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toString();

  const generateIPv4 = () => {
    return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join('.');
  };
  
  const generateIPv6 = () => {
    return Array.from({ length: 8 }, () => 
      Math.floor(Math.random() * 65536).toString(16).padStart(4, '0')
    ).join(':');
  };

  const generateMAC = () => {
    return Array.from({ length: 6 }, () => 
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join(':').toUpperCase();
  };

  const generateUsername = () => {
    const name = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)].toLowerCase();
    const num = Math.floor(Math.random() * 1000);
    const suffixes = ["", "_dev", "_user", "123", "_pro"];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return `${name}${num}${suffix}`;
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const generateURL = () => {
    const protocols = ["https://", "http://"];
    const subdomains = ["", "www.", "api.", "app."];
    const domains = ["example.com", "test.org", "demo.io", "sample.net"];
    const paths = ["", "/home", "/api/users", "/products", "/about"];
    
    const protocol = protocols[Math.floor(Math.random() * protocols.length)];
    const subdomain = subdomains[Math.floor(Math.random() * subdomains.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const path = paths[Math.floor(Math.random() * paths.length)];
    
    return `${protocol}${subdomain}${domain}${path}`;
  };

  const generateWebsite = () => {
    const subdomains = ["", "www."];
    const domains = ["example.com", "test.org", "demo.io", "sample.net", "company.com"];
    const subdomain = subdomains[Math.floor(Math.random() * subdomains.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `https://${subdomain}${domain}`;
  };
  
  const generateDomain = () => {
    const domains = ["example.com", "test.org", "demo.io", "sample.net", "company.com"];
    return domains[Math.floor(Math.random() * domains.length)];
  };

  const generateCompany = () => COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
  
  const generateCompanySuffix = () => COMPANY_SUFFIXES[Math.floor(Math.random() * COMPANY_SUFFIXES.length)];
  
  const generateJobTitle = () => JOB_TITLES[Math.floor(Math.random() * JOB_TITLES.length)];
  
  const generateDepartment = () => DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)];
  
  const generateCurrency = () => CURRENCIES[Math.floor(Math.random() * CURRENCIES.length)];
  
  const generateCurrencyCode = () => CURRENCIES[Math.floor(Math.random() * CURRENCIES.length)];
  
  const generateAmount = () => (Math.random() * 10000).toFixed(2);
  
  const generateGender = () => ["Male", "Female", "Non-binary", "Other"][Math.floor(Math.random() * 4)];
  
  const generateAge = () => (Math.floor(Math.random() * 70) + 18).toString();
  
  const generateBoolean = () => Math.random() > 0.5 ? "true" : "false";
  
  const generateNumber = () => (Math.random() * 1000).toFixed(2);
  
  const generateCreditCard = () => {
    const parts = Array.from({ length: 4 }, () => 
      Math.floor(Math.random() * 9000) + 1000
    );
    return parts.join(' ');
  };
  
  const generateCreditCardType = () => CREDIT_CARD_TYPES[Math.floor(Math.random() * CREDIT_CARD_TYPES.length)];
  
  const generateIBAN = () => {
    const country = COUNTRY_CODES[Math.floor(Math.random() * COUNTRY_CODES.length)];
    const check = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const account = Array.from({ length: 18 }, () => 
      Math.floor(Math.random() * 36).toString(36).toUpperCase()
    ).join('');
    return `${country}${check}${account}`;
  };
  
  const generateBankName = () => BANKS[Math.floor(Math.random() * BANKS.length)];
  
  const generateBankRouting = () => {
    return Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
  };
  
  const generateBitcoinAddress = () => {
    const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    const length = Math.random() > 0.5 ? 34 : 42;
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };
  
  const generateEthereumAddress = () => {
    return "0x" + Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  };
  
  const generateSSN = () => {
    const area = Math.floor(Math.random() * 900) + 100;
    const group = Math.floor(Math.random() * 90) + 10;
    const serial = Math.floor(Math.random() * 9000) + 1000;
    return `${area}-${group}-${serial}`;
  };
  
  const generateEIN = () => {
    const prefix = Math.floor(Math.random() * 90) + 10;
    const suffix = Math.floor(Math.random() * 9000000) + 1000000;
    return `${prefix}-${suffix}`;
  };
  
  const generateAvatar = () => {
    const id = Math.floor(Math.random() * 1000);
    return `https://robohash.org/${id}?set=set1`;
  };

  const generateLanguage = () => LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)];
  
  const generateLanguageCode = () => LANGUAGE_CODES[Math.floor(Math.random() * LANGUAGE_CODES.length)];
  
  const generateTimezone = () => TIMEZONES[Math.floor(Math.random() * TIMEZONES.length)];
  
  const generateLatitude = () => ((Math.random() * 180) - 90).toFixed(6);
  
  const generateLongitude = () => ((Math.random() * 360) - 180).toFixed(6);
  
  const generateStatus = () => STATUSES[Math.floor(Math.random() * STATUSES.length)];
  
  const generateTitle = () => TITLES[Math.floor(Math.random() * TITLES.length)];
  
  const generateTag = () => TAGS[Math.floor(Math.random() * TAGS.length)];
  
  const generateEmoji = () => EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  
  const generateSentence = () => SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
  
  const generateParagraph = () => {
    const numSentences = Math.floor(Math.random() * 3) + 3;
    return Array.from({ length: numSentences }, () => 
      SENTENCES[Math.floor(Math.random() * SENTENCES.length)]
    ).join(' ');
  };
  
  const generateWord = () => WORDS[Math.floor(Math.random() * WORDS.length)];
  
  const generateBuzzword = () => BUZZWORDS[Math.floor(Math.random() * BUZZWORDS.length)];
  
  const generateCatchPhrase = () => CATCH_PHRASES[Math.floor(Math.random() * CATCH_PHRASES.length)];
  
  const generateSlogan = () => SLOGANS[Math.floor(Math.random() * SLOGANS.length)];

  const generateNote = () => {
    const templates = [
      "Please review this item",
      "Follow up required",
      "Needs attention",
      "Important update",
      "Action required"
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  };
  
  const generateCarMake = () => CAR_MAKES[Math.floor(Math.random() * CAR_MAKES.length)];
  
  const generateCarModel = () => CAR_MODELS[Math.floor(Math.random() * CAR_MODELS.length)];
  
  const generateCarYear = () => (Math.floor(Math.random() * 30) + 1995).toString();
  
  const generateVIN = () => {
    const chars = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789";
    return Array.from({ length: 17 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };
  
  const generateLicensePlate = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const nums = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const prefix = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * 26)]).join('');
    return `${prefix}-${nums}`;
  };
  
  const generateAirportCode = () => AIRPORTS[Math.floor(Math.random() * AIRPORTS.length)];
  
  const generateAirportName = () => AIRPORT_NAMES[Math.floor(Math.random() * AIRPORT_NAMES.length)];
  
  const generateFlightNumber = () => {
    const airline = ["AA", "DL", "UA", "SW"][Math.floor(Math.random() * 4)];
    const num = Math.floor(Math.random() * 9000) + 1000;
    return `${airline}${num}`;
  };
  
  const generateAirline = () => AIRLINES[Math.floor(Math.random() * AIRLINES.length)];
  
  const generateProductName = () => PRODUCT_NAMES[Math.floor(Math.random() * PRODUCT_NAMES.length)];
  
  const generateProductCategory = () => PRODUCT_CATEGORIES[Math.floor(Math.random() * PRODUCT_CATEGORIES.length)];
  
  const generateProductPrice = () => (Math.random() * 500 + 10).toFixed(2);
  
  const generateSKU = () => {
    const prefix = Array.from({ length: 3 }, () => 
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join('');
    const num = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `${prefix}-${num}`;
  };
  
  const generateBarcode = () => {
    return Array.from({ length: 13 }, () => Math.floor(Math.random() * 10)).join('');
  };
  
  const generateAppName = () => APP_NAMES[Math.floor(Math.random() * APP_NAMES.length)];
  
  const generateAppVersion = () => {
    const major = Math.floor(Math.random() * 10);
    const minor = Math.floor(Math.random() * 20);
    const patch = Math.floor(Math.random() * 50);
    return `${major}.${minor}.${patch}`;
  };
  
  const generateAppBundleId = () => {
    const domains = ["com", "org", "io"];
    const companies = ["google", "microsoft", "apple", "amazon"];
    const apps = ["app", "mobile", "pro", "lite"];
    return `${domains[Math.floor(Math.random() * 3)]}.${companies[Math.floor(Math.random() * 4)]}.${apps[Math.floor(Math.random() * 4)]}`;
  };
  
  const generateMimeType = () => MIME_TYPES[Math.floor(Math.random() * MIME_TYPES.length)];
  
  const generateUserAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

  const generateSingleItem = (type: DataType): string => {
    switch (type) {
      // Personal
      case "firstName": return generateFirstName();
      case "lastName": return generateLastName();
      case "fullName": return generateFullName();
      case "email": return generateEmail();
      case "username": return generateUsername();
      case "password": return generatePassword();
      case "phone": return generatePhone();
      case "gender": return generateGender();
      case "age": return generateAge();
      case "title": return generateTitle();
      case "ssn": return generateSSN();
      case "avatar": return generateAvatar();
      // Address
      case "streetNumber": return generateStreetNumber();
      case "streetName": return generateStreetName();
      case "streetSuffix": return generateStreetSuffix();
      case "streetAddress": return generateStreetAddress();
      case "addressLine2": return generateAddressLine2();
      case "city": return generateCity();
      case "state": return generateState();
      case "zip": return generateZip();
      case "country": return generateCountry();
      case "countryCode": return generateCountryCode();
      case "latitude": return generateLatitude();
      case "longitude": return generateLongitude();
      // Company
      case "company": return generateCompany();
      case "companySuffix": return generateCompanySuffix();
      case "jobTitle": return generateJobTitle();
      case "department": return generateDepartment();
      case "ein": return generateEIN();
      // Finance
      case "creditCard": return generateCreditCard();
      case "creditCardType": return generateCreditCardType();
      case "iban": return generateIBAN();
      case "bankName": return generateBankName();
      case "bankRouting": return generateBankRouting();
      case "currency": return generateCurrency();
      case "currencyCode": return generateCurrencyCode();
      case "amount": return generateAmount();
      case "bitcoinAddress": return generateBitcoinAddress();
      case "ethereumAddress": return generateEthereumAddress();
      // Internet
      case "url": return generateURL();
      case "website": return generateWebsite();
      case "domain": return generateDomain();
      case "ipv4": return generateIPv4();
      case "ipv6": return generateIPv6();
      case "mac": return generateMAC();
      case "userAgent": return generateUserAgent();
      case "emoji": return generateEmoji();
      // Product
      case "productName": return generateProductName();
      case "productCategory": return generateProductCategory();
      case "productPrice": return generateProductPrice();
      case "sku": return generateSKU();
      case "barcode": return generateBarcode();
      // Tech
      case "uuid": return generateUUID();
      case "shortUuid": return generateShortUUID();
      case "guid": return generateGUID();
      case "ulid": return generateULID();
      case "mongoId": return generateMongoId();
      case "md5": return generateMD5();
      case "sha1": return generateSHA1();
      case "sha256": return generateSHA256();
      case "appName": return generateAppName();
      case "appVersion": return generateAppVersion();
      case "appBundleId": return generateAppBundleId();
      case "mimeType": return generateMimeType();
      // Transport
      case "carMake": return generateCarMake();
      case "carModel": return generateCarModel();
      case "carYear": return generateCarYear();
      case "vin": return generateVIN();
      case "licensePlate": return generateLicensePlate();
      case "airportCode": return generateAirportCode();
      case "airportName": return generateAirportName();
      case "flightNumber": return generateFlightNumber();
      case "airline": return generateAirline();
      // Date/Time
      case "date": return generateDate();
      case "time": return generateTime();
      case "datetime": return generateDatetime();
      case "timezone": return generateTimezone();
      case "timestamp": return generateTimestamp();
      // Text
      case "sentence": return generateSentence();
      case "paragraph": return generateParagraph();
      case "word": return generateWord();
      case "buzzword": return generateBuzzword();
      case "catchPhrase": return generateCatchPhrase();
      case "slogan": return generateSlogan();
      // Color
      case "color": return generateHexColor();
      case "hexColor": return generateHexColor();
      case "shortHexColor": return generateShortHexColor();
      case "rgb": return generateRGB();
      // Other
      case "boolean": return generateBoolean();
      case "number": return generateNumber();
      case "language": return generateLanguage();
      case "languageCode": return generateLanguageCode();
      case "status": return generateStatus();
      case "tag": return generateTag();
      case "note": return generateNote();
      default: return "";
    }
  };

  const generateData = () => {
    // For small datasets (< 10k), generate in memory
    if (count <= 10000) {
      generateInMemory();
    } else {
      // For large datasets, stream directly to file
      generateAndDownloadStreaming();
    }
  };

  const generateInMemory = () => {
    if (selectedTypes.length === 1) {
      // Single type - generate as before
      const results: string[] = [];
      const type = selectedTypes[0];

      for (let i = 0; i < count; i++) {
        results.push(generateSingleItem(type));
      }

      if (outputFormat === "json") {
        const jsonArray = results.map(item => ({ value: item }));
        setOutput(JSON.stringify(jsonArray, null, 2));
      } else if (outputFormat === "csv") {
        setOutput(`${type}\n${results.join("\n")}`);
      } else {
        setOutput(results.join("\n"));
      }
    } else {
      // Multiple types - generate objects with all selected types
      const results: Record<string, string | number | boolean>[] = [];

      for (let i = 0; i < count; i++) {
        const item: Record<string, string | number | boolean> = {};
        selectedTypes.forEach(type => {
          item[type] = generateSingleItem(type);
        });
        results.push(item);
      }

      if (outputFormat === "json") {
        setOutput(JSON.stringify(results, null, 2));
      } else if (outputFormat === "csv") {
        // CSV header
        const header = selectedTypes.join(",");
        const rows = results.map(item => 
          selectedTypes.map(type => {
            const value = item[type];
            const strValue = String(value);
            // Escape values with commas or quotes
            if (strValue.includes(",") || strValue.includes('"') || strValue.includes("\n")) {
              return `"${strValue.replace(/"/g, '""')}"`;
            }
            return strValue;
          }).join(",")
        );
        setOutput(`${header}\n${rows.join("\n")}`);
      } else {
        // List format - show as key: value pairs
        const lines = results.map((item, idx) => {
          const pairs = selectedTypes.map(type => `${type}: ${item[type]}`).join(", ");
          return `${idx + 1}. ${pairs}`;
        });
        setOutput(lines.join("\n"));
      }
    }
  };

  const generateAndDownloadStreaming = async () => {
    setIsGenerating(true);
    setProgress(0);
    
    try {
      const CHUNK_SIZE = 1000; // Generate 1000 records at a time
      const totalChunks = Math.ceil(count / CHUNK_SIZE);
      
      // Create a writable stream
      const fileStream = streamSaver.createWriteStream(
        `random-data-${Date.now()}.${outputFormat === 'json' ? 'json' : outputFormat === 'csv' ? 'csv' : 'txt'}`,
        {
          size: undefined // We don't know the size in advance
        }
      );
      
      const writer = fileStream.getWriter();
      const encoder = new TextEncoder();
      
      // Write header based on format
      if (outputFormat === "json") {
        await writer.write(encoder.encode("[\n"));
      } else if (outputFormat === "csv" && selectedTypes.length > 1) {
        const header = selectedTypes.join(",") + "\n";
        await writer.write(encoder.encode(header));
      } else if (outputFormat === "csv" && selectedTypes.length === 1) {
        await writer.write(encoder.encode(selectedTypes[0] + "\n"));
      }
      
      // Generate and write chunks
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const chunkStart = chunkIndex * CHUNK_SIZE;
        const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, count);
        const chunkSize = chunkEnd - chunkStart;
        
        let chunkData = "";
        
        for (let i = 0; i < chunkSize; i++) {
          const globalIndex = chunkStart + i;
          
          if (selectedTypes.length === 1) {
            const value = generateSingleItem(selectedTypes[0]);
            
            if (outputFormat === "json") {
              chunkData += `  ${JSON.stringify({ value })}${globalIndex < count - 1 ? ',' : ''}\n`;
            } else if (outputFormat === "csv") {
              chunkData += value + "\n";
            } else {
              chunkData += value + "\n";
            }
          } else {
            const item: Record<string, string | number | boolean> = {};
            selectedTypes.forEach(type => {
              item[type] = generateSingleItem(type);
            });
            
            if (outputFormat === "json") {
              chunkData += `  ${JSON.stringify(item)}${globalIndex < count - 1 ? ',' : ''}\n`;
            } else if (outputFormat === "csv") {
              const row = selectedTypes.map(type => {
                const value = item[type];
                const strValue = String(value);
                if (strValue.includes(",") || strValue.includes('"') || strValue.includes("\n")) {
                  return `"${strValue.replace(/"/g, '""')}"`;
                }
                return strValue;
              }).join(",");
              chunkData += row + "\n";
            } else {
              const pairs = selectedTypes.map(type => `${type}: ${item[type]}`).join(", ");
              chunkData += `${globalIndex + 1}. ${pairs}\n`;
            }
          }
        }
        
        await writer.write(encoder.encode(chunkData));
        
        // Update progress
        const progressPercent = ((chunkIndex + 1) / totalChunks) * 100;
        setProgress(progressPercent);
        
        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      // Write footer
      if (outputFormat === "json") {
        await writer.write(encoder.encode("]\n"));
      }
      
      await writer.close();
      
      toast.success(`Generated and downloaded ${count.toLocaleString()} records!`);
      setOutput(`Generated ${count.toLocaleString()} records and downloaded to file.`);
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate data");
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  // Fallback for browsers without StreamSaver support
  const streamSaver = {
    createWriteStream: (filename: string, options?: { size?: number }) => {
      let chunks: Uint8Array[] = [];
      
      return {
        getWriter: () => ({
          write: async (chunk: Uint8Array) => {
            chunks.push(chunk);
          },
          close: async () => {
            const blob = new Blob(chunks as BlobPart[], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            chunks = [];
          }
        })
      };
    }
  };

  const getTypeDescription = (t: DataType): string => {
    const descriptions: Record<DataType, string> = {
      // Personal
      firstName: "First names",
      lastName: "Last names",
      fullName: "Full names (first + last)",
      email: "Email addresses",
      username: "Usernames",
      password: "Secure passwords",
      phone: "Phone numbers",
      gender: "Gender values",
      age: "Age (18-88)",
      title: "Name titles (Mr, Mrs, Dr)",
      ssn: "Social Security Numbers",
      avatar: "Avatar image URLs",
      // Address
      streetNumber: "Street numbers",
      streetName: "Street names",
      streetSuffix: "Street suffixes",
      streetAddress: "Full street addresses",
      addressLine2: "Apt, Suite, Floor, etc",
      city: "City names",
      state: "State codes",
      zip: "ZIP codes",
      country: "Country names",
      countryCode: "Country codes (US, CA)",
      latitude: "Latitude coordinates",
      longitude: "Longitude coordinates",
      // Company
      company: "Company names",
      companySuffix: "Company suffixes (Inc, LLC)",
      jobTitle: "Job titles",
      department: "Department names",
      ein: "Employer ID Numbers",
      // Finance
      creditCard: "Credit card numbers",
      creditCardType: "Card types (Visa, MC)",
      iban: "IBAN numbers",
      bankName: "Bank names",
      bankRouting: "Bank routing numbers",
      currency: "Currency names",
      currencyCode: "Currency codes (USD, EUR)",
      amount: "Monetary amounts",
      bitcoinAddress: "Bitcoin addresses",
      ethereumAddress: "Ethereum addresses",
      // Internet
      url: "URLs with paths",
      website: "Website URLs",
      domain: "Domain names",
      ipv4: "IPv4 addresses",
      ipv6: "IPv6 addresses",
      mac: "MAC addresses",
      userAgent: "Browser user agents",
      emoji: "Random emojis",
      // Product
      productName: "Product names",
      productCategory: "Product categories",
      productPrice: "Product prices",
      sku: "SKU codes",
      barcode: "Barcode numbers",
      // Tech
      uuid: "UUID v4 identifiers",
      shortUuid: "Short UUIDs (8 chars)",
      guid: "GUID identifiers",
      ulid: "ULID identifiers",
      mongoId: "MongoDB ObjectIDs",
      md5: "MD5 hashes",
      sha1: "SHA1 hashes",
      sha256: "SHA256 hashes",
      appName: "App names",
      appVersion: "App version numbers",
      appBundleId: "App bundle IDs",
      mimeType: "MIME types",
      // Transport
      carMake: "Car manufacturers",
      carModel: "Car models",
      carYear: "Car years",
      vin: "Vehicle VIN numbers",
      licensePlate: "License plates",
      airportCode: "Airport codes (JFK, LAX)",
      airportName: "Airport names",
      flightNumber: "Flight numbers",
      airline: "Airline names",
      // Date/Time
      date: "Dates (YYYY-MM-DD)",
      time: "Times (HH:MM)",
      datetime: "ISO datetime strings",
      timezone: "Timezone identifiers",
      timestamp: "Unix timestamps",
      // Text
      sentence: "Random sentences",
      paragraph: "Random paragraphs",
      word: "Random words",
      buzzword: "Business buzzwords",
      catchPhrase: "Marketing catch phrases",
      slogan: "Marketing slogans",
      // Color
      color: "Color names",
      hexColor: "Hex color codes (#RRGGBB)",
      shortHexColor: "Short hex codes (#RGB)",
      rgb: "RGB color values",
      // Other
      boolean: "True/false values",
      number: "Random numbers",
      language: "Language names",
      languageCode: "Language codes (en, es)",
      status: "Status values",
      tag: "Tag labels",
      note: "Note templates"
    };
    return descriptions[t] || "";
  };

  return (
    <ToolLayout
      title="Random Data Generator"
      description="Generate realistic test data for development and testing"
    >
      <div className="space-y-3">
        {/* Data Type Selection */}
        <div className="p-3 bg-card border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Data Types</Label>
            <Badge variant="secondary" className="text-xs">
              {selectedTypes.length} selected
            </Badge>
          </div>
          
          {DATA_CATEGORIES.map((category) => (
            <div key={category.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {category.name}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => {
                    const allSelected = category.types.every(t => selectedTypes.includes(t));
                    if (allSelected) {
                      setSelectedTypes(prev => prev.filter(t => !category.types.includes(t)));
                    } else {
                      setSelectedTypes(prev => [...new Set([...prev, ...category.types])]);
                    }
                  }}
                >
                  {category.types.every(t => selectedTypes.includes(t)) ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {category.types.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleType(t)}
                    className={`p-2 rounded-lg border text-left transition-colors ${
                      selectedTypes.includes(t)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card hover:bg-accent"
                    }`}
                  >
                    <div className="text-xs font-medium capitalize">
                      {t.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                      {getTypeDescription(t).split(" ").slice(0, 2).join(" ")}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
          
          {selectedTypes.length === 1 && (
            <p className="text-xs text-muted-foreground pt-2 border-t">
              {getTypeDescription(selectedTypes[0])}
            </p>
          )}
          {selectedTypes.length > 1 && (
            <p className="text-xs text-muted-foreground pt-2 border-t">
              Generating {selectedTypes.length} fields per record
            </p>
          )}
        </div>

        {/* Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 bg-card border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Count: {count.toLocaleString()}</Label>
              <Badge variant="secondary" className="text-xs">{count.toLocaleString()} items</Badge>
            </div>
            <Slider
              value={[Math.log10(count)]}
              onValueChange={(v) => setCount(Math.round(Math.pow(10, v[0])))}
              min={0}
              max={6}
              step={0.1}
              className="py-2"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1</span>
              <span>100</span>
              <span>10K</span>
              <span>1M</span>
            </div>
            {count > 10000 && (
              <p className="text-xs text-amber-600 dark:text-amber-500">
                Large dataset: Will stream directly to file download
              </p>
            )}
          </div>

          <div className="p-3 bg-card border rounded-lg space-y-2">
            <Label className="text-sm">Output Format</Label>
            <Tabs value={outputFormat} onValueChange={(v) => setOutputFormat(v as OutputFormat)}>
              <TabsList className="grid w-full grid-cols-3 h-8">
                <TabsTrigger value="list" className="text-xs">List</TabsTrigger>
                <TabsTrigger value="json" className="text-xs">JSON</TabsTrigger>
                <TabsTrigger value="csv" className="text-xs">CSV</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Generate Button */}
        <Button onClick={generateData} className="w-full" size="sm" disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating... {Math.round(progress)}%
            </>
          ) : (
            <>Generate {count.toLocaleString()} {selectedTypes.length === 1 ? selectedTypes[0].charAt(0).toUpperCase() + selectedTypes[0].slice(1).replace(/([A-Z])/g, ' $1') : "Records"}</>
          )}
        </Button>

        {/* Progress Bar */}
        {isGenerating && (
          <div className="p-3 bg-card border rounded-lg space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Generating data...</span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Output */}
        {output && (
          <div className="p-3 bg-card border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Generated Data</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {output.split("\n").length} lines
                </Badge>
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  onClick={downloadFile}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                >
                  <Download className="h-3 w-3" />
                  Download
                </Button>
              </div>
            </div>
            <CopyTextarea
              value={output}
              readOnly
              rows={20}
              className="font-mono text-xs"
            />
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
