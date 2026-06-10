# Klingshot Agent Notes

## Project Overview
Klingshot is a multi-app Next.js repository for the Klickshot series platform. The product has moved away from the MinChap name; user-facing product copy, new documentation, and new code should use Klickshot unless an existing external service/domain/env var still requires the old name.

Main apps:
- `web`: official Klickshot website. It is currently a temporary landing site, but `terms-of-service` and `privacy-policy` are important registered TikTok review URLs and must remain available.
- `tiktokapp`: TikTok Minis customer app for browsing, watching, VIP/top-up, profile, policy, FAQ, and contact flows.
- `api`: standalone API app for TikTok Minis only. It serves `tiktokapp` and is not the API for `backoffice` or `partner`.
- `backoffice`: internal admin dashboard for managing the TikTok app content and operations. It has its own API routes.
- `partner`: partner portal for dashboard, series stats, billing, feedback, and partner account flows. It has its own API routes.

## Tech Stack
- Next.js 16.x apps with React 19.x.
- Styling uses Tailwind CSS; `web` and `backoffice` use Tailwind 4, while `tiktokapp` uses Tailwind 3.
- Supabase is the main database/backend service.
- BytePlus VOD/CDN is used for video playback, subtitles, play auth, and media delivery.
- TikTok Minis integration is handled through `tiktokapp` and server routes in `api`.
- `backoffice` uses Vitest and Playwright scripts.

## Domains And Deployment Targets
- `web` deploys to `www.klickshotseries.com`.
- `api` deploys to `api.klickshotseries.com` and is only for `tiktokapp`.
- `tiktokapp` is used only inside TikTok Minis and consumes the `api` app.
- VOD currently uses `vod.minchapseries.com`. Do not change it to `vod.klickshotseries.com` yet. A future migration to `vod.klickshotseries.com` is planned but not active.
- Existing env var names or config values may still contain `MINCHAP`/`minchapseries` for compatibility. Do not rename them unless the requested task is specifically a migration and all callers/deployment settings are accounted for.

## Important Directories
- `api/app/api/*`: public/server API routes.
- `api/app/lib/*`: API-side service helpers for Supabase admin, TikTok tokens, customer auth, CORS, and BytePlus CDN.
- `tiktokapp/app/*`: TikTok Minis app pages and client helpers.
- `tiktokapp/tools/*`: PowerShell scripts for TikTok Minis build/package workflows.
- `backoffice/src/app/(dashboard)/*`: admin dashboard pages.
- `backoffice/src/app/api/backoffice/*`: backoffice API routes.
- `backoffice/src/lib/*`: backoffice Supabase, BytePlus, and server/session helpers.
- `partner/src/app/(dashboard)/*`: partner dashboard pages.
- `partner/src/app/api/partner/*`: partner API routes.
- `web/src/app/terms-of-service/page.js`: TikTok-registered terms page. Keep route stable.
- `web/src/app/privacy-policy/page.js`: TikTok-registered privacy page. Keep route stable.
- `docs/database-data-dictionary.md`: database reference/data dictionary. Keep this updated when database structure, important fields, or table semantics change.

## Run Commands
Run commands from the app folder, not from the repo root.

`web`:
```bash
npm install
npm run dev
npm run build
npm run lint
```

`api`:
```bash
npm install
npm run dev
npm run build
```
Local API runs on `http://localhost:4000`.

`tiktokapp`:
```bash
npm install
npm run dev
npm run dev:lan
npm run build
npm run build:tiktok
npm run package:tiktok
```

`backoffice`:
```bash
npm install
npm run dev
npm run build
npm run test
npm run test:e2e
```

`partner`:
```bash
npm install
npm run dev
npm run build
```
Partner dev server uses port `3004`.

## Environment Notes
- `api/.env.example` lists server-side Supabase, BytePlus, CORS, and TikTok payment/webhook settings.
- `tiktokapp/.env.example` lists public Supabase, API base URL, BytePlus license, and TikTok client/debug flags.
- `NEXT_PUBLIC_MINCHAP_API_BASE_URL` should point to the API app. For local API development use `http://localhost:4000`.
- Never commit real service role keys, TikTok secrets, BytePlus credentials, or license values.

## Next.js Version Warning
Some child apps already contain an `AGENTS.md` warning that this Next.js version may differ from older training data. Before making framework-sensitive changes, prefer the installed docs under that app's `node_modules/next/dist/docs/` when available, and follow deprecation warnings.

## Coding Guidelines
- Keep changes scoped to the relevant app and route/module.
- Prefer existing local helpers before adding new service wrappers.
- Preserve each app's current JavaScript style; most files are `.js`/`.jsx`, not TypeScript.
- Use structured APIs and existing Supabase/BytePlus helper functions rather than duplicating request logic.
- Avoid changing auth, payment, webhook, or VIP subscription behavior without tracing all related routes.
- Do not edit generated build/package output unless explicitly requested.
- Respect existing uncommitted user changes. Do not revert unrelated work.

## Data And Business Rules To Treat Carefully
- Supabase admin access in `api/app/lib/supabaseAdmin.js` uses service role credentials and direct REST/RPC calls.
- VIP subscription activation, purchase reporting, customer recent/favorite series, app visits, and episode daily views are recorded through API helpers and RPC calls.
- TikTok Minis payment routes and webhook confirmation need idempotency and signature/secret handling.
- BytePlus VOD playback routes exist in both `api` and `backoffice`; check which app owns the caller before editing. Keep current `vod.minchapseries.com` usage unless explicitly migrating VOD domains.
- Backoffice and partner session/auth flows are separate from TikTok customer auth.
- `backoffice` database changes must be checked for impact on `api` and `tiktokapp`. If a change could affect them, stop and ask before proceeding. Prefer changes that avoid breaking or coupling those apps.
- `partner` database changes must be checked for impact on `api` and `tiktokapp`. If a change could affect them, stop and ask before proceeding. Prefer changes that avoid breaking or coupling those apps.
- When changing Supabase schema, table meaning, key fields, or cross-app data contracts, update `docs/database-data-dictionary.md` in the same task.

## Testing And Verification
- For app changes, run the relevant app's `npm run build` when practical.
- For `backoffice`, run `npm run test` for logic changes and `npm run test:e2e` for dashboard/user-flow changes when practical.
- For frontend changes, visually verify the affected page in a browser when a local dev server is available.
- If tests cannot be run because dependencies/env vars are missing, state that clearly in the final response.

## Existing App-Specific Notes
- `web/AGENTS.md` and `backoffice/AGENTS.md` contain app-local Next.js warnings. Read the closest `AGENTS.md` when working inside a subdirectory.
