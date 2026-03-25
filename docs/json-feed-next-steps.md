# JSON Feed — Next Steps Plan

> Follow-up to [json-audit.md](json-audit.md). The v2.0 feed changes (missing fields, recursive language filtering, base64 stripping) are done. This doc covers what's left.

---

## 1. ~~Base URL Injection~~ — DONE

All media URLs now resolve to absolute URLs (e.g. `https://tourstack.app/uploads/audio/xyz.mp3`).

- `getBaseUrl(req)` derives origin from request (works behind Coolify proxy via `trust proxy`)
- Threaded through `formatTourForFeed` → `formatStopForFeed` → all `formatMediaUrl` calls
- `resolveUrlsDeep()` recursively resolves `/uploads/...` paths inside content blocks at any nesting depth
- Every feed response includes a top-level `base_url` field

---

## 2. ~~Visitor API Alignment~~ — DECIDED: Keep Separate

| API | Audience | Naming | Auth |
|-----|----------|--------|------|
| `/api/visitor/*` | Our frontend (VisitorStop, Kiosk) | camelCase | Public |
| `/api/feeds/*` | External apps, integrations | snake_case | Protected |

The visitor API is an internal implementation detail of our frontend. The feed API is the public contract. No alignment needed.

---

## 3. ~~OpenAPI / Schema Documentation~~ — DONE

Static OpenAPI 3.0 spec written to `docs/openapi-feeds.yaml`. Covers all three feed endpoints with full request/response schemas including all 17 content block types.

Served live at `GET /api/feeds/openapi.json` (returns YAML with correct content type).

Covers:
- `GET /api/feeds/tours` — list tours (minimal/compact/full formats)
- `GET /api/feeds/tours/:id` — single tour
- `GET /api/feeds/tours/:id/stops` — stops only

---

## 4. Feed Version Bump Automation (Priority: LOW — Skip for now)

`FEED_VERSION` is a manual constant. The feed changes rarely enough that automation isn't worth building yet. If needed later: pre-commit hook or CI check that diffs `feeds.ts` and warns if version wasn't bumped.

---

## Progress

| Step | Task | Status |
|------|------|--------|
| 1 | Base URL injection | **Done** |
| 2 | Visitor API alignment | **Done** (decision: keep separate) |
| 3 | OpenAPI spec file | **Done** |
| 4 | Version bump automation | Skip for now |
