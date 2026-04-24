# AI Model Versions: A Moving Target

**TL;DR**: Google Gemini model names we hardcode (e.g. `gemini-2.0-flash`) get silently retired. When that happens, the API returns **`429 Resource exhausted`** — NOT a 404 — which looks exactly like a quota / billing issue but isn't. Update the model string, restart the backend, redeploy.

---

## The Symptom

Every chatbot or AI concierge call fails:

```
POST /api/chat → 500 Internal Server Error
{
  "error": "Failed to generate response",
  "details": "[GoogleGenerativeAI Error]: 429 Too Many Requests - Resource exhausted"
}
```

Both locally and in production. Translation (Google Cloud Translation) keeps working fine. Misleading clues that make this look like a billing problem:

- Same key worked yesterday, fails today
- Fails on both dev and prod (they share the key)
- Error code 429 = classic rate-limit signal
- `[Google Cloud doc link about 429 errors]` in the error message

## Why It's Not Billing

Run this direct-to-Google test with the `GEMINI_API_KEY` from `app/.env`:

```bash
# Listing models — always works if the key is valid and billing is active
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY" | head -c 400
```

If you see a JSON model list back, the key and billing are fine. Then:

```bash
# Try the currently-hardcoded model
curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"ok"}]}]}' -w "\n%{http_code}\n"
```

| Result | Meaning |
|---|---|
| `200` + generated text | Model is live — look elsewhere for the bug |
| `429 RESOURCE_EXHAUSTED` | Model is retired/throttled. Pick a newer one |
| `404 NOT_FOUND` | Model is fully removed. Pick a newer one |

Google uses 429 as a soft-deprecation signal on some older models instead of cleanly 404'ing. The only reliable way to tell a retired model from a live one is to hit a known-good model version.

## Finding a Currently-Supported Model

```bash
# List every model the key can use for generateContent
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY" \
  | python3 -c "import sys, json; [print(m['name']) for m in json.load(sys.stdin)['models'] if 'generateContent' in m.get('supportedGenerationMethods', [])]"
```

Pick the newest stable flash model (cheap, fast, good enough for our use cases). As of 2026-04, `gemini-2.5-flash` works. Avoid preview/experimental tags in production.

## The Fix

Three files hardcode the model string. Update all three together:

- [app/server/routes/chat.ts](../app/server/routes/chat.ts) — visitor chatbot
- [app/server/routes/concierge.ts](../app/server/routes/concierge.ts) — AI concierge route
- [app/server/routes/gemini.ts](../app/server/routes/gemini.ts) — general Gemini route

```bash
# Quick check for any stragglers
grep -rn "gemini-[0-9]" app/server/
```

Then:

1. Restart the local backend — our `npm run server` uses `tsx` (not `tsx watch`), so hot-reload won't pick up the change. `Ctrl+C` + `npm run start`.
2. Verify locally: `curl -s -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"message":"hello","language":"en"}' -w "\n%{http_code}\n"` → expect `200`.
3. Commit + push. Coolify redeploys automatically. No env var changes, no DB migration, no config changes.

## Hardening (Optional, Future)

A few things that would make this less of a silent trap:

- **Move the model string to env** (`GEMINI_MODEL`) with a sensible default. Swap models without a code deploy.
- **Add a nightly canary** that hits each hardcoded model and alerts when one starts returning 429s — catches deprecation before users do.
- **Surface `429` specifically** in [app/server/routes/chat.ts](../app/server/routes/chat.ts) error handling so the UI can say "our AI is upgrading, try again shortly" instead of a generic failure.

None of these are worth building preemptively — but if we hit this a second time, it's time.

## Timeline

- **2026-04-24** — First occurrence. `gemini-2.0-flash` started returning 429 in both dev and prod. Masqueraded as a billing issue (user had just replaced an expired credit card). Diagnosis took longer than it should have because the error points at billing docs. Fixed by swapping all three hardcoded strings to `gemini-2.5-flash`.
