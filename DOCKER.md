# Running DevToolbox with Docker

Run DevToolbox locally without installing Node.js, pnpm, or any dependencies. The Docker image builds the app and serves it with nginx on a lightweight Alpine container.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed and running

## Quick Start

```bash
# Build the image
docker build -t devtoolbox .

# Run the container
docker run -d -p 8080:8080 --name devtoolbox devtoolbox
```

Open [http://localhost:8080](http://localhost:8080).

## Commands

| Action | Command |
|--------|---------|
| Build image | `docker build -t devtoolbox .` |
| Run (detached) | `docker run -d -p 8080:8080 --name devtoolbox devtoolbox` |
| Run (foreground) | `docker run -p 8080:8080 --name devtoolbox devtoolbox` |
| Stop | `docker stop devtoolbox` |
| Start again | `docker start devtoolbox` |
| Remove container | `docker rm devtoolbox` |
| Remove image | `docker rmi devtoolbox` |
| View logs | `docker logs devtoolbox` |
| Rebuild from scratch | `docker build --no-cache -t devtoolbox .` |

## Custom Port

To run on a different port, change the first number in `-p`:

```bash
# Run on port 3000
docker run -d -p 3000:8080 --name devtoolbox devtoolbox
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

The Dockerfile uses a multi-stage build:

1. **Build stage** - Node 22 Alpine installs dependencies with pnpm and runs `pnpm build`, producing static files in `dist/`
2. **Serve stage** - nginx Alpine copies the static files and serves them with gzip, SPA routing, and security headers

The final image contains only nginx and the built static files - no Node.js, no `node_modules`, no source code.

## What's Inside

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build (Node 22 -> nginx Alpine) |
| `nginx.conf` | SPA routing, gzip, cache headers, security headers |
| `.dockerignore` | Excludes node_modules, .git, and other unnecessary files from the build context |

## nginx Configuration

The included `nginx.conf` provides:

- SPA fallback - all routes serve `index.html` so client-side routing works
- Gzip compression for JS, CSS, JSON, SVG
- Aggressive caching for `/assets/` (1 year, immutable)
- Security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`

## Docker Compose

If you prefer docker compose, create a `docker-compose.yml`:

```yaml
services:
  devtoolbox:
    build: .
    ports:
      - "8080:8080"
    restart: unless-stopped
```

Then run:

```bash
docker compose up -d
```

## Troubleshooting

**Port already in use**
```bash
# Use a different port
docker run -d -p 9090:8080 --name devtoolbox devtoolbox
```

**Container already exists**
```bash
docker rm devtoolbox
docker run -d -p 8080:8080 --name devtoolbox devtoolbox
```

**Rebuild after code changes**
```bash
docker stop devtoolbox
docker rm devtoolbox
docker build -t devtoolbox .
docker run -d -p 8080:8080 --name devtoolbox devtoolbox
```
