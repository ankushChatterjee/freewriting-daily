## Prerequisites

- Node.js 18+ or Bun
- Backend API running (see `../backend/README.md`)

## Setup

1. Install dependencies:
```bash
bun install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your backend API URL (default is `http://localhost:3000`)

## Development

Start the development server:

```bash
bun run dev
```

The app will be available at `http://localhost:5173`

## Build

Build for production:

```bash
bun run build
```

Preview production build:

```bash
bun run preview
```