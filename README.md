# 🌪️ Zephra — "The ultra-fast, minimalist full-stack framework"

**Tagline:** "Breeze through your stack."

Zephra is an ultra-fast, minimalist full-stack framework designed for building modern web applications with exceptional performance and a delightful developer experience. It aims to provide a Next.js-like DX but lighter, faster, and with less bloat.

## 🔧 Core Tech Stack

| Layer      | Tech                | Role                             |
|------------|---------------------|----------------------------------|
| Runtime    | Bun                 | Lightning-fast server runtime    |
| API        | ElysiaJS            | Typed backend with plugin system |
| Frontend   | React               | SPA + SSR-ready rendering        |
| Routing    | File-based (custom) | Unified routing for API/pages    |
| Styling    | Tailwind CSS (opt.) | Fast UI prototyping              |
| Validation | Zod                 | End-to-end schema validation     |
| Bundling   | Bun (native)        | Optimized builds (SSR + CSR)     |
| Tooling    | Bun dev server + CLI| DX-focused, in-house             |

## 🚀 Quick Start (Development)

```bash
# Install dependencies
bun install

# Run the example app (in a separate terminal for each command)
cd apps/example
bun run dev         # Starts the Bun server (with hot reload)
bun run tailwind:watch  # Runs Tailwind in watch mode
bun build app/main.tsx --outdir dist/static --target browser --minify --watch  # Bundles client code in real-time
```

The example app will start at http://localhost:3000 with the following endpoints:

- `/api/hello` - Basic API endpoint
- `/api/users/:id` - Dynamic API endpoint with parameters
- `/api/items` (POST) - Method-specific API endpoint

Example API calls:

```bash
# Get hello message
curl http://localhost:3000/api/hello

# Get user with ID
curl http://localhost:3000/api/users/123

# Create a new item
curl -X POST -H "Content-Type: application/json" \
  -d '{"name":"New Item","price":9.99}' \
  http://localhost:3000/api/items
```

## 🛠️ CLI Usage

You can use the Zephra CLI to help develop your application:

```bash
# Start development server
bun run zephra dev

# Create a new API route
bun run zephra new api users/[id]

# Create a method-specific API route
bun run zephra new api items -m post

# Create a new page component
bun run zephra new page about
```

## 📂 Project Structure

```
app/
├── api/               # API routes (served at /api/*)
│   ├── hello.ts      # GET /api/hello
│   ├── items.post.ts # POST /api/items
│   └── users/
│       └── [id].ts   # /api/users/:id (dynamic route)
│
├── main.tsx          # Client entry for CSR/hydration
└── about/           # Page route for /about
    └── page.tsx     # React component
```

## ⚡ SSR & CSR

- **SSR:** Bun + React render pages on the server for fast initial load and SEO.
- **CSR:** Bun's native bundler outputs a browser-ready JS bundle for hydration and interactivity.
- **Hydration:** SSR output is hydrated on the client for a seamless experience.
- **HMR:** Currently, HMR is handled via auto-reload (full page reload) using Bun's watcher and injected scripts. True Fast Refresh/stateful HMR is not available without Babel/Webpack.

## 🧪 Diagnostics & Roadmap

- **Diagnostics:** In-house tools for tracking component renders, module graph, and change impact analysis are in progress.
- **Advanced HMR:** Fast Refresh-style HMR is not available without code transforms. Future plans may include custom Bun plugins or transforms.
- **Developer Experience:** Focus on type safety, CLI, and in-house DX improvements.

## 🗺️ Roadmap

See [ROADMAP.md](ROADMAP.md) for the detailed project plan.

## 🤝 Contributing

Details on contributing will be added soon. We welcome your ideas and contributions! 