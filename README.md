# Developer Toolbox

A comprehensive collection of 30+ developer utilities built with Next.js 15, React 19, and TypeScript. All tools run entirely in your browser - no data is sent to any server.

## Features

- **30+ Developer Tools** - From JSON formatters to OTP generators
- **100% Client-Side** - All processing happens in your browser
- **Privacy-First** - No tracking, no analytics, no data collection
- **PWA Support** - Install as a standalone app
- **Dark Mode** - Easy on the eyes
- **Responsive Design** - Works on desktop and mobile
- **Offline Capable** - Use tools without internet connection

## Tools Included

### Data Conversion & Formatting
- JSON/YAML/XML/CSV Converters
- Base64 Encoder/Decoder
- URL Encoder/Decoder
- Casing Converter
- JSON to Code Generator
- JSON to OpenAPI Converter

### Security & Cryptography
- Hash Generator (MD5, SHA-1, SHA-256, SHA-512)
- JWT Decoder
- Password Generator
- OTP/TOTP Authenticator
- Random Data Generator

### Development Utilities
- JSON Editor & Validator
- JSON Compare
- Regex Validator
- HAR Analyzer
- cURL to Hurl Converter
- Timestamp Converter
- MongoDB ObjectId Timestamp Decoder

### Design Tools
- Color Hex Converter
- Color Palette Generator
- Color Scheme Designer

### Productivity
- Timer with Notifications
- UUID Generator
- Payload Size Calculator
- Data Visualizer

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **Icons:** Lucide React
- **PWA:** Custom Service Worker

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── tools/             # Individual tool pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
└── public/               # Static assets
```

## Privacy & Security

- All tools run entirely in your browser
- No data is sent to any server
- No cookies, no tracking, no analytics
- Open source - audit the code yourself
- Encryption uses Web Crypto API for secure operations

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Author

**Marko Zanoski**
- Website: [zanoski.com/me](https://zanoski.com/me)
- GitHub: [@Zanoshky](https://github.com/Zanoshky)
- Support: [Buy me a coffee](https://www.buymeacoffee.com/zanoshky)

## Links

- **Repository:** [github.com/Zanoshky/DevTools](https://github.com/Zanoshky/DevTools)
- **Live Demo:** [dev.zanoski.com](https://dev.zanoski.com)

---

Made with love by developers, for developers
