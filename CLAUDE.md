@AGENTS.md

# Project notes

appwizer.com marketing site + quickscans + MCP hub + admin. Next.js 16 / React 19 / Tailwind 4 / Neon. Read `README.md` for structure, env vars and design decisions (Dutch).

- Language: UI copy, comments and docs are Dutch; keep that. Code identifiers are English.
- Routes live under `src/app/(site)/`. `/admin/*` is guarded by `src/proxy.ts` (not `middleware.ts`) and every server action re-checks the session itself.
- Brand colors and theme tokens are in `src/app/globals.css` (`@theme`); there is no color config in `tailwind.config.ts`. Support light and dark mode.
- Database is optional (`src/lib/db.ts` returns null without `DATABASE_URL`). Keep features degrading gracefully; builds must not need secrets.
- Scoring (`src/lib/quickscan/scoring.ts`) is shared by client and server; the server recomputes on lead save. Don't duplicate score logic.
- Charts are hand-written SVG, no chart library. Icons: `lucide-react` / `simple-icons`.
- Verify with `npx tsc --noEmit`, `npm run lint`, `npm run build` (same as CI).
- Never commit `.env*`; `.env.example` holds placeholders only.
