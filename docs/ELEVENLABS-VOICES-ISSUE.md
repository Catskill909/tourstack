# ElevenLabs Voice Slots Issue - CRITICAL DOCUMENTATION

**Created**: January 24, 2026  
**Status**: ✅ RESOLVED - GUARDRAILS IN PLACE  
**Priority**: CRITICAL - READ BEFORE ANY ELEVENLABS CHANGES
**Time Wasted**: ~8 hours debugging (don't repeat this!)

---

## 🚨🚨🚨 THE ONE RULE 🚨🚨🚨

```
╔════════════════════════════════════════════════════════════════════╗
║  ELEVENLABS: USE PREMADE VOICES ONLY. PERIOD.                      ║
║                                                                    ║
║  ✅ /voices API filtered to category === 'premade'                 ║
║  ❌ NEVER use /shared-voices for GENERATION                        ║
║                                                                    ║
║  Premade voices work for ALL 32 languages via Multilingual v2.     ║
║  Roger speaking Italian = Italian pronunciation. It works.         ║
╚════════════════════════════════════════════════════════════════════╝
```

---

## 🚨 The Problem

ElevenLabs was showing **native language voices** (Italian voices for Italian, Chinese voices for Chinese) but now shows the **same 21 English premade voices for ALL languages**.

### What We Want (Like Deepgram)
- English → Thalia, Andromeda, Helena (English voices)
- Spanish → Celeste, Estrella, Nestor (Spanish voices)  
- Italian → Marco, Antonio, Brando (Italian voices)

### What We Have Now (Broken)
- English → Roger, Sarah, Laura, Charlie (English voices)
- Spanish → Roger, Sarah, Laura, Charlie (SAME English voices!)
- Italian → Roger, Sarah, Laura, Charlie (SAME English voices!)
- ALL languages → SAME 21 English premade voices

---

## 🔍 Root Cause Analysis

### Working Implementation (commit a62728f - Jan 22, 2026)

Used the `/shared-voices` API with language parameter:
```typescript
fetch(`${ELEVENLABS_API_URL}/shared-voices?page_size=50&language=${language}&sort=trending`)
```

This returned:
- Italian → Adam, Marco, Antonio (native Italian voices)
- Chinese → Haoran, Siqi Liu (native Chinese voices)
- etc.

### Why It Was Changed

When users **generated audio** with shared voices, ElevenLabs automatically added those voices to "My Voices", consuming **custom voice slots**.

**Your Account Status:**
```
voice_slots_used: 10
voice_limit: 10  (Starter tier)
```

The 10 slots are filled with voices that were auto-added:
1. Mr. Magoo - Italian Professional Voice
2. Otani
3. Raquel - Conversational
4. Kina (Cute happy girl)
5. Francois-Louis - French
6. Northern Vietnamese Male
7. Zara - Conversationalist
8. Haoran
9. Gustavo Sancho
10. Martin Osborne 4

**Once slots are full, ANY attempt to use a new shared voice fails with "voice_limit_reached"**

### ✅ FINAL SOLUTION: Premade Voices Only (LOCKED IN)

The code now uses `/voices` API filtered to `category === 'premade'`:
```typescript
// ✅ CORRECT - This is the ONLY safe approach
fetch(`${ELEVENLABS_API_URL}/voices`)
  .filter((voice) => voice.category === 'premade')
```

**This returns 21 built-in voices that:**
- Work for ALL 32 languages via Multilingual v2 model
- NEVER consume voice slots
- Roger + Italian text = Italian pronunciation
- Sarah + Chinese text = Chinese pronunciation
- Are always available on any tier, including FREE

---

## 📊 ElevenLabs Voice Categories

| Category | Description | Uses Slots? | Safe for Production? |
|----------|-------------|-------------|---------------------|
| `premade` | 21 built-in English-named voices | ❌ No | ✅ **YES - USE THIS** |
| `professional` | Shared library voices | ✅ Yes (when generating) | ❌ NO - breaks at 10 |
| `cloned` | Custom cloned voices | ✅ Yes | ❌ NO - requires premium |

---

## ❌ Solutions We Considered But REJECTED

### Option 1: Delete Existing Professional Voices + Use Shared Voices
**REJECTED:** Shared voices still auto-add on generation, would fill slots again

### Option 2: Upgrade ElevenLabs Plan (More Slots)
**REJECTED:** Just delays the problem, still hits limit eventually

### Option 3: Curated Voice List (10 Pre-Selected Voices)
**REJECTED:** Requires manual slot management, fragile

### Option 4: Preview vs Generate Split
**REJECTED:** Confusing UX - preview sounds different from generated audio

---

## ✅ THE ONLY WORKING SOLUTION

### Option 5: Premade Voices Only (IMPLEMENTED)

**Why this works:**
- 21 voices × 32 languages = 672 combinations via Multilingual v2
- Zero slot usage, ever
- Works on FREE tier
- No management required
- Voice NAMES are English but PRONUNCIATION is native

**Trade-off accepted:**
- UI shows "Roger" instead of "Marco" for Italian
- This is fine - users care about pronunciation, not names
- Pronunciation IS native via Multilingual v2 model

- **Preview:** Use shared-voices API (just plays preview_url, no slot used)
- **Generate:** Force use of premade voices only

**Pros:** Users can HEAR native voices in gallery, generation always works  
**Cons:** Mismatch between preview and generation

---

## 🔗 Relevant Code Locations

| File | Purpose |
|------|---------|
| `app/server/routes/elevenlabs.ts` | API endpoints, voice fetching |
| `app/src/pages/Audio.tsx` | ElevenLabs tab UI |
| `app/src/services/elevenlabsService.ts` | Frontend API calls |
| `app/src/components/AudioCollectionModal.tsx` | Batch generation modal |

---

## 📝 Git History

| Commit | Date | Description |
|--------|------|-------------|
| `a62728f` | Jan 22 | ✅ Implemented native language voices (shared-voices API) |
| `7381453` | Jan 22 | Fixed TypeScript errors |
| `c5155cc` | Jan 24 | ❌ "Fixed" by removing shared-voices (broke native voices) |
| `8592e28` | Jan 24 | Updates (maintained broken state) |

---

## ⚠️ Key Learnings

1. **Shared voices consume slots when GENERATING**, not when fetching/previewing
2. **Starter tier = 10 slots max** - easy to hit limit with multi-language support
3. **Premade voices don't consume slots** but are all English-based
4. **The Multilingual v2 model handles pronunciation** - Roger CAN speak Italian correctly, just with an English name

---

## 🎯 Recommended Next Step

**Immediate:** Delete unused professional voices to free slots  
**Short-term:** Implement Option 3 (curated voice list) with slot management  
**Long-term:** Consider plan upgrade if more voice variety needed

---

## 🔄 To Restore Native Voices (After Freeing Slots)

Revert the voices endpoint to use shared-voices API:

```typescript
// In app/server/routes/elevenlabs.ts

router.get('/voices', async (req: Request, res: Response) => {
    const language = req.query.language as string || 'en';
    
    // Use shared-voices API for native language voices
    const response = await fetch(
        `${ELEVENLABS_API_URL}/shared-voices?page_size=50&language=${language}&sort=trending`,
        { headers: { 'xi-api-key': getApiKey() } }
    );
    
    // ... rest of implementation
});
```

**WARNING:** Only do this AFTER freeing voice slots!
