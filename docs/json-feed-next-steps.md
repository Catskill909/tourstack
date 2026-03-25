# JSON Feed — Next Steps Plan

> Follow-up to [json-audit.md](json-audit.md). The v2.0 feed changes (missing fields, recursive language filtering, base64 stripping) are done. This doc covers what's left.

---

## 1. Base URL Injection (Priority: HIGH)

**Problem:** All media URLs in the feed are relative paths (`/uploads/audio/xyz.mp3`, `/uploads/images/abc.jpg`). Consumer apps have no base URL to resolve them against.

**Solution:** Derive base URL from the request and pass it through to `formatMediaUrl()`.

**Scope:** ~15 lines in `feeds.ts`

```
Changes needed:
- In each route handler, derive baseUrl from req:
    const baseUrl = `${req.protocol}://${req.get('host')}`;
- Pass baseUrl through formatTourForFeed → formatStopForFeed → formatMediaUrl
- formatMediaUrl already accepts baseUrl param, it's just never passed
- Also pass into stripBase64Deep replacement (or post-process URLs after stripping)
```

**Risk:** Low. Additive change, doesn't alter existing field structure.

**Note:** In production behind Coolify's reverse proxy, `req.get('host')` may need `X-Forwarded-Host` handling. Check if Express `trust proxy` is set.

---

## 2. Visitor API Alignment (Priority: MEDIUM)

**Problem:** The visitor API (`/api/visitor/*`) uses camelCase, the feed API uses snake_case. Two different shapes for the same data.

**Constraint:** The visitor frontend (`VisitorStop.tsx`, `KioskStaffScreen.tsx`, `qrScannerUtils.ts`) depends on camelCase field names. Changing the visitor API directly would break the live visitor experience.

**Recommendation: Don't align them. They serve different purposes.**

| API | Audience | Naming | Auth |
|-----|----------|--------|------|
| `/api/visitor/*` | Our frontend (VisitorStop, Kiosk) | camelCase | Public |
| `/api/feeds/*` | External apps, integrations | snake_case | Protected |

The visitor API is an internal implementation detail of our frontend. The feed API is the public contract. Trying to unify them adds risk for zero user benefit.

**If alignment is ever needed:** Create `/api/visitor/v2/*` with snake_case, migrate frontend, deprecate v1. But there's no reason to do this now.

---

## 3. OpenAPI / Schema Documentation (Priority: MEDIUM)

**Problem:** No machine-readable documentation of the feed API. Consumer apps have to reverse-engineer the shape.

**Approach:** Generate an OpenAPI 3.0 spec for the three feed endpoints. Two options:

### Option A: Static spec file (recommended)
- Write `docs/openapi-feeds.yaml` by hand based on current output
- Lightweight, no dependencies, easy to keep in sync
- Can be served at `/api/feeds/openapi.json` as a static route

### Option B: Runtime generation (e.g. zod-to-openapi)
- Define response shapes in Zod schemas, auto-generate OpenAPI
- More work upfront, stays in sync automatically
- Adds dependencies (`zod`, `@asteasolutions/zod-to-openapi`)

**Recommended:** Option A for now. The feed shape doesn't change often, and we already have the audit doc describing every field.

```
Endpoints to document:
- GET /api/feeds/tours?lang=&format=&status=&include_stops=
- GET /api/feeds/tours/:id?lang=&format=
- GET /api/feeds/tours/:id/stops?lang=
```

**Deliverable:** `docs/openapi-feeds.yaml` + static route to serve it.

---

## 4. Feed Version Bump Automation (Priority: LOW)

**Problem:** `FEED_VERSION` is a manual constant. Easy to forget bumping it when the schema changes.

**This is low priority because:**
- The feed rarely changes (this was the first update since v1.0)
- A forgotten version bump is annoying but not destructive
- No consumers are currently checking the version field

**If we want it later:** Add a pre-commit hook or CI check that diffs `feeds.ts` and warns if `FEED_VERSION` wasn't changed. Not worth building now.

---

## Suggested Execution Order

| Step | Task | Effort | Can Do Now? |
|------|------|--------|-------------|
| 1 | Base URL injection | ~30 min | Yes |
| 2 | OpenAPI spec file | ~1-2 hours | Yes |
| 3 | Visitor API decision | 0 (decision: keep separate) | Done |
| 4 | Version bump automation | Skip for now | N/A |

Steps 1 and 2 are independent and can be done in either order. Step 1 is the most impactful since external apps literally can't resolve media URLs without it.
