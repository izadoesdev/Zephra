# 🗺️ Zephra Project Roadmap

This document outlines the planned development phases for Zephra.

## 🚀 Phase 1: Foundation (Week 1–2)
**✅ Goals:**
* Set up the project repo
* Create file-based routing for API & frontend
* Scaffold Elysia server

**📦 Tasks:**
* Create `zephra/` monorepo with `apps/web` and `core/framework`
* Build `app/` directory with auto-routing for:
    * `app/pages/*.tsx` → rendered routes
    * `app/api/*.ts` → API endpoints
* Add dev server with hot reload via Bun + Vite
* Implement CLI:
    * `zephra dev`
    * `zephra build`
    * `zephra new route [name]`

## 🖼️ Phase 2: Frontend Engine (Week 2–3)
**✅ Goals:**
* React rendering engine
* SSR hydration support
* Layouts and nested routing

**📦 Tasks:**
* Add `vite.config.ts` + SSR entry
* Create `renderToHTML()` function using `react-dom/server`
* Automatically import layouts if `app/layout.tsx` exists
* Serve static assets from `/public`

## 🔒 Phase 3: Plugins & DX (Week 3–4)
**✅ Goals:**
* Zephra plugin ecosystem
* First-party plugins: auth, logger, CORS, cookies
* Better developer ergonomics

**📦 Tasks:**
* `zephra.config.ts` for project-level config
* Plugin system similar to Elysia's (`app.use(pluginAuth());`)
* Add plugin auto-loader from `./plugins/*`
* Add environment variable system (`.env` + `Bun.env`)

## 🧪 Phase 4: Dev Experience Polish (Week 4–5)
**✅ Goals:**
* DX > everything
* Typed CLI, preview, logs, helpful errors

**📦 Tasks:**
* Typed route mapping (like Remix or tRPC)
* Route-level error boundaries & loading UI
* `zephra preview` to test SSR output
* Better Bun logging integration
* Type-safe route generation for React pages

## 🌍 Phase 5: Deployment & Adapters (Week 5–6)
**✅ Goals:**
* Ready for real-world deploy
* Adapter system for platforms (Edge, Node, Docker, etc.)

**📦 Tasks:**
* Build adapter for Node, Bun native, Edge Function
* Add simple Dockerfile for Bun-based deploys
* Optional: Add deploy to Bun.sh, Deno Deploy, or Cloudflare Workers

## 🧰 Phase 6: Templates & Tooling (Week 6–7)
**✅ Goals:**
* Easy to start with Zephra
* Production-grade templates

**📦 Tasks:**
* `create-zephra-app` CLI scaffolder
* Starter templates:
    * `zephra-basic` (API + SPA)
    * `zephra-ssr-blog`
    * `zephra-dashboard` (auth, layout, dark mode)
* Prettier + ESLint + GitHub Actions built-in

## 🔮 Phase 7: Optional Ecosystem & Growth (Post-launch)
* Zephra Cloud? (Analytics, logs, edge deploys)
* Integrate AI CLI assistant ("Zai")
* VSCode Extension: route & config autocomplete
* Docs & marketing site (zephra.dev)

## 🧭 Roadmap Summary
| Phase | Focus                   | ETA       |
|-------|-------------------------|-----------|
| 1     | Core routing & backend  | Week 1–2  |
| 2     | React SSR integration   | Week 2–3  |
| 3     | Plugin & config system  | Week 3–4  |
| 4     | Developer experience    | Week 4–5  |
| 5     | Deployment readiness    | Week 5–6  |
| 6     | CLI + templates         | Week 6–7  |
| 7     | Ecosystem & cloud tools | Ongoing   | 

CRON: croner