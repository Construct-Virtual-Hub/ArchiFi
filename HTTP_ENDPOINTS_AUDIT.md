# HTTP Endpoints Audit for ArchiFi

**Generated:** $(date)  
**Repository:** archifi-1  
**Scope:** All HTTP endpoints (internal API routes and external calls)

---

## Summary Table

| Method | URL/Path | Purpose | Defined in |
|--------|----------|---------|------------|
| GET | `/api/health` | Health check endpoint | `app/api/health/route.ts:4` |
| POST | `/api/search` | Proxy search requests to upstream | `app/api/search/route.ts:19` |
| OPTIONS | `/api/search` | CORS preflight | `app/api/search/route.ts:15` |
| POST | `/api/scrape` | Proxy scrape requests to upstream | `app/api/scrape/route.ts:16` |
| OPTIONS | `/api/scrape` | CORS preflight | `app/api/scrape/route.ts:14` |
| GET | `/api/scrape-status` | Proxy scrape status queries | `app/api/scrape-status/route.ts:20` |
| OPTIONS | `/api/scrape-status` | CORS preflight | `app/api/scrape-status/route.ts:16` |
| GET | `/api/architect-details` | Proxy architect details queries | `app/api/architect-details/route.ts:15` |
| OPTIONS | `/api/architect-details` | CORS preflight | `app/api/architect-details/route.ts:13` |
| POST | External: `${UPSTREAM_SEARCH}` | Upstream search webhook (ngrok) | `app/api/search/route.ts:4-6` |
| POST | External: `${UPSTREAM_SCRAPE}` | Upstream scrape webhook (ngrok) | `app/api/scrape/route.ts:3-5` |
| GET | External: `${UPSTREAM_SCRAPE_STATUS}?session=...` | Upstream scrape status webhook (ngrok) | `app/api/scrape-status/route.ts:5-7` |
| GET | External: `${UPSTREAM_ARCHITECT_DETAILS_BASE}{id}` | Upstream architect details (optional) | `app/api/architect-details/route.ts:3-4` |
| POST | External: `OUTREACH_POST` | Outreach submission webhook (ngrok) | `app/page.tsx:152-153` |
| GET | External: `OUTREACH_STATUS_BASE{sessionId}` | Outreach status webhook (ngrok) | `app/page.tsx:154-155` |
| POST | External: `GET_ARCHITECT_DETAILS` | Architect details fetch webhook (ngrok) | `app/page.tsx:156-157` |

---

## Detailed Endpoint Documentation

### 1. GET `/api/health`

- **Defined in:** `app/api/health/route.ts:4`
- **Used in:** Not called in codebase (likely for monitoring/debugging)
- **Purpose:** Health check endpoint that lists available routes and environment variable status
- **Request:** None (no body, no query params)
- **Response shape:**
  ```typescript
  {
    ok: true,
    routes: ["/api/search", "/api/scrape", "/api/scrape-status"],
    env: {
      UPSTREAM_SCRAPE: boolean,
      UPSTREAM_SCRAPE_STATUS_BASE: boolean
    }
  }
  ```
- **Guards/env:** None
- **Notes:** Returns list of available routes and boolean flags for environment variable presence

---

### 2. POST `/api/search`

- **Defined in:** `app/api/search/route.ts:19`
- **Used in:**
  - `app/page.tsx:948` - `postJSON(SEARCH_ENDPOINT, payload)` (initial search)
  - `app/page.tsx:1002` - `postJSON(SEARCH_ENDPOINT, base)` (pagination)
- **Purpose:** Proxy search requests to upstream ngrok webhook
- **Request body:**
  ```typescript
  {
    postcode_town?: string,  // optional search query
    limit?: number,          // default 100
    nextId?: number          // for pagination
  }
  ```
- **Response shape:** Upstream response (array or object with `items` array)
  - Client reads: `items` array, `nextId` for pagination
  - Items mapped via `mapApiItemToArchitect()` expecting: `id`, `full_name`, `name`, `company_name`, `company`, `post_code`, `postcode`, `address`, `city`, `town`, `email`, `phone`, `website`, `linkedin_profile_url`, `company_linkedin_profile_url`, `instagram_profile_url`, `company_instagram_profile_url`, `facebook_profile_url`, `company_facebook_profile_url`, `specialty`, `speciality`, `projectType`, `type`, `valueMillions`, `grade`
- **Guards/env:**
- `UPSTREAM_SEARCH` (default: `"https://7a4d4f14fd68.ngrok-free.app/webhook/a4cfdee8-25f9-4c3f-bda6-c2571f1975c5"`)
- **Notes:**
  - 20 second timeout via AbortController
  - CORS headers: `Access-Control-Allow-Origin: *`
  - Cache: `no-store`, `revalidate: 0`

---

### 3. OPTIONS `/api/search`

- **Defined in:** `app/api/search/route.ts:15`
- **Used in:** Browser CORS preflight requests
- **Purpose:** Handle CORS preflight requests
- **Response:** 204 No Content with CORS headers
- **CORS headers:**
  ```
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: POST, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization
  Access-Control-Max-Age: 86400
  ```

---

### 4. POST `/api/scrape`

- **Defined in:** `app/api/scrape/route.ts:16`
- **Used in:**
  - `app/page.tsx:1096` - `postJSON(SCRAPE_ENDPOINT, requestBody)` (main scrape action)
  - `app/page.tsx:447` - `fetch(SCRAPE_ENDPOINT, ...)` (fetch details by IDs)
  - `app/page.tsx:1612` - `postJSON(SCRAPE_ENDPOINT, body)` (retry failed scrape)
- **Purpose:** Proxy scrape requests to upstream ngrok webhook
- **Request body:**
  ```typescript
  {
    architects?: Array<{
      id: number | string,
      full_name?: string,
      company_name?: string,
      email?: string,
      phone?: string,
      website?: string,
      post_code?: string,
      address?: string,
      // ... other architect fields
    }>,
    currently_logged_in_email: string
  }
  ```
  OR (for details fetch):
  ```typescript
  Array<{ id: number }>
  ```
- **Response shape:** Upstream response (forwarded as-is)
  - Client reads: `session` or `session_id` or `id` for session ID
  - For details fetch: array of architect objects with scrape fields
- **Guards/env:**
- `UPSTREAM_SCRAPE` (default: `"https://7a4d4f14fd68.ngrok-free.app/webhook/50546cbf-1229-4f96-a8a8-27ed62c0381e"`)
- **Notes:**
  - 20 second timeout via AbortController
  - CORS headers: `Access-Control-Allow-Origin: *`
  - Cache: `no-store`, `revalidate: 0`

---

### 5. OPTIONS `/api/scrape`

- **Defined in:** `app/api/scrape/route.ts:14`
- **Used in:** Browser CORS preflight requests
- **Purpose:** Handle CORS preflight requests
- **Response:** 204 No Content with CORS headers
- **CORS headers:**
  ```
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: POST, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization
  Access-Control-Max-Age: 86400
  ```

---

### 6. GET `/api/scrape-status`

- **Defined in:** `app/api/scrape-status/route.ts:20`
- **Used in:**
  - `app/page.tsx:1181` - `fetch(\`${SCRAPE_STATUS_ENDPOINT}?session=...\`)` (hydrate details)
  - `app/page.tsx:1226` - `fetch(\`${SCRAPE_STATUS_ENDPOINT}?session=...\`)` (poll status)
- **Purpose:** Proxy scrape status queries to upstream ngrok webhook
- **Query params:**
  - `session` (required): session ID string
- **Response shape:** Array of status objects
  ```typescript
  Array<{
    id: number,
    created_at: string,
    session: string,
    architect_id: number,
    status: "success" | "failed" | "inprogress" | "queued",
    architect_name?: string,
    // Optional: full architect details if available
    email?: string,
    website?: string,
    company_bio?: string,
    // ... other architect fields
  }>
  ```
- **Guards/env:**
- `UPSTREAM_SCRAPE_STATUS` (default: `"https://7a4d4f14fd68.ngrok-free.app/webhook/50546cbf-1229-4f96-a8a8-27ed62c0381e"`)
- **Notes:**
  - Returns 400 if `session` query param missing
  - Polled every 10 seconds when active
  - CORS headers: `Access-Control-Allow-Origin: *`
  - Cache: `no-store`, `revalidate: 0`

---

### 7. OPTIONS `/api/scrape-status`

- **Defined in:** `app/api/scrape-status/route.ts:16`
- **Used in:** Browser CORS preflight requests
- **Purpose:** Handle CORS preflight requests
- **Response:** 204 No Content with CORS headers
- **CORS headers:**
  ```
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization
  Access-Control-Max-Age: 86400
  ```

---

### 8. GET `/api/architect-details`

- **Defined in:** `app/api/architect-details/route.ts:15`
- **Used in:**
  - `app/page.tsx:1147` - `fetch(\`${DETAILS_ENDPOINT}?id=...\`)` (fetch details)
- **Purpose:** Proxy architect details queries to upstream (optional endpoint)
- **Query params:**
  - `id` (required): architect ID string
- **Request:** None (query param only)
- **Response shape:**
  ```typescript
  {
    email?: string,
    phone?: string,
    website?: string,
    linkedin_profile_url?: string,
    company_linkedin_profile_url?: string,
    instagram_profile_url?: string,
    company_instagram_profile_url?: string,
    facebook_profile_url?: string,
    company_facebook_profile_url?: string,
    address?: string,
    post_code?: string,
    postcode?: string,
    company_name?: string,
    company?: string,
    full_name?: string,
    name?: string
  }
  ```
- **Guards/env:**
  - `UPSTREAM_ARCHITECT_DETAILS_BASE` (default: `""` - empty, endpoint disabled if not set)
- **Notes:**
  - Returns 501 if `UPSTREAM_ARCHITECT_DETAILS_BASE` not configured
  - Returns 400 if `id` query param missing
  - CORS headers: `Access-Control-Allow-Origin: *`
  - Cache: `no-store`, `revalidate: 0`
  - Client handles 501 gracefully (falls back to other methods)

---

### 9. OPTIONS `/api/architect-details`

- **Defined in:** `app/api/architect-details/route.ts:13`
- **Used in:** Browser CORS preflight requests
- **Purpose:** Handle CORS preflight requests
- **Response:** 204 No Content with CORS headers
- **CORS headers:**
  ```
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization
  Access-Control-Max-Age: 86400
  ```

---

### 10. POST External: `${UPSTREAM_SEARCH}`

- **Defined in:** `app/api/search/route.ts:4-6`
- **Used in:** `app/api/search/route.ts:25` (proxied from `/api/search`)
- **Purpose:** Upstream search webhook (ngrok)
- **URL:** `process.env.UPSTREAM_SEARCH ?? "https://7a4d4f14fd68.ngrok-free.app/webhook/a4cfdee8-25f9-4c3f-bda6-c2571f1975c5"`
- **Request body:** Same as `/api/search` (forwarded as-is)
- **Response shape:** Upstream response (forwarded as-is)
- **Guards/env:** `UPSTREAM_SEARCH`
- **Notes:** Proxied by Next.js API route with 20s timeout

---

### 11. POST External: `${UPSTREAM_SCRAPE}`

- **Defined in:** `app/api/scrape/route.ts:3-5`
- **Used in:** `app/api/scrape/route.ts:21` (proxied from `/api/scrape`)
- **Purpose:** Upstream scrape webhook (ngrok)
- **URL:** `process.env.UPSTREAM_SCRAPE ?? "https://7a4d4f14fd68.ngrok-free.app/webhook/50546cbf-1229-4f96-a8a8-27ed62c0381e"`
- **Request body:** Same as `/api/scrape` (forwarded as-is)
- **Response shape:** Upstream response (forwarded as-is)
- **Guards/env:** `UPSTREAM_SCRAPE`
- **Notes:** Proxied by Next.js API route with 20s timeout

---

### 12. GET External: `${UPSTREAM_SCRAPE_STATUS}?session=...`

- **Defined in:** `app/api/scrape-status/route.ts:5-7`
- **Used in:** `app/api/scrape-status/route.ts:31` (proxied from `/api/scrape-status`)
- **Purpose:** Upstream scrape status webhook (ngrok)
- **URL:** `process.env.UPSTREAM_SCRAPE_STATUS || "https://7a4d4f14fd68.ngrok-free.app/webhook/50546cbf-1229-4f96-a8a8-27ed62c0381e"`
- **Query params:** `session` (required)
- **Response shape:** Array of status objects (forwarded as-is)
- **Guards/env:** `UPSTREAM_SCRAPE_STATUS`
- **Notes:** Proxied by Next.js API route

---

### 13. GET External: `${UPSTREAM_ARCHITECT_DETAILS_BASE}{id}`

- **Defined in:** `app/api/architect-details/route.ts:3-4`
- **Used in:** `app/api/architect-details/route.ts:29` (proxied from `/api/architect-details`)
- **Purpose:** Upstream architect details endpoint (optional)
- **URL:** `process.env.UPSTREAM_ARCHITECT_DETAILS_BASE || "https://7a4d4f14fd68.ngrok-free.app/webhook/a4cfdee8-25f9-4c3f-bda6-c2571f1975c5?id="`
- **Path:** `{DETAILS_BASE}{encodeURIComponent(id)}`
- **Response shape:** Architect details object (forwarded as-is)
- **Guards/env:** `UPSTREAM_ARCHITECT_DETAILS_BASE`
- **Notes:** Optional endpoint; returns 501 if not configured

---

### 14. POST External: `OUTREACH_POST`

- **Defined in:** `app/page.tsx:152-153`
- **Used in:** `app/page.tsx:836` - `fetch(OUTREACH_POST, ...)`
- **Purpose:** Submit outreach requests to upstream ngrok webhook
- **URL:** `"https://7a4d4f14fd68.ngrok-free.app/webhook/97ee6a11-ebe3-4f87-a8d1-3487101ee1bd"` (hardcoded)
- **Request body:**
  ```typescript
  {
    outreach: Array<{
      url: string,
      architect_name: string,
      account_type: "personal" | "company",
      actions: Array<{
        action: "follow" | "connect" | "like" | "message",
        item: "account" | "post",
        item_count?: number,
        message_content?: string
      }>,
      client: {
        name: string,
        profile_url: string,
        business_name: string
      },
      purpose: "outreach",
      platform: "linkedin" | "instagram"
    }>,
    currently_logged_in_email: string
  }
  ```
- **Response shape:**
  ```typescript
  Array<{
    session?: string,
    session_id?: string
  }> | {
    session?: string,
    session_id?: string
  }
  ```
  - Client reads: `session` or `session_id` from first item if array
- **Guards/env:** None (hardcoded URL)
- **Notes:** Direct client-side call (not proxied through Next.js API)

---

### 15. GET External: `OUTREACH_STATUS_BASE{sessionId}`

- **Defined in:** `app/page.tsx:154-155`
- **Used in:** `app/page.tsx:732` - `fetch(OUTREACH_STATUS_BASE + encodeURIComponent(sessionId))`
- **Purpose:** Poll outreach status from upstream ngrok webhook
- **URL:** `"https://7a4d4f14fd68.ngrok-free.app/webhook/3c3c9a81-6786-4243-9c91-a803fba4da37?session_id="` (hardcoded)
- **Query params:** `session_id` (appended to base URL)
- **Response shape:**
  ```typescript
  Array<{
    id: number,
    created_at: string,
    session: string,
    architect_id: number,
    status: "queued" | "inprogress" | "success" | "failed",
    platform: "linkedin" | "instagram",
    purpose: "outreach",
    actions?: Array<OutreachActionSpec>,
    follow_status?: OutreachProgress | null,
    connection_status?: OutreachProgress | null,
    like_post_count?: number | null,
    message_status?: OutreachProgress | null,
    client?: { name: string; profile_url: string; business_name: string },
    url?: string,
    username?: string
  }>
  ```
- **Guards/env:** None (hardcoded URL)
- **Notes:**
  - Direct client-side call (not proxied)
  - Polled every 10 seconds (`OUTREACH_POLL_INTERVAL_MS = 10_000`)
  - Stops polling when all cards reach terminal status (`success` or `failed`)

---

### 16. POST External: `GET_ARCHITECT_DETAILS`

- **Defined in:** `app/page.tsx:156-157`
- **Used in:** `app/page.tsx:459` - `fetch(GET_ARCHITECT_DETAILS, ...)`
- **Purpose:** Fetch architect details from upstream ngrok webhook
- **URL:** `"https://7a4d4f14fd68.ngrok-free.app/webhook/a4cfdee8-25f9-4c3f-bda6-c2571f1975c5"` (hardcoded)
- **Request body:**
  ```typescript
  {
    architect_id: number
  }
  ```
- **Response shape:** Architect details object (same shape as scrape response)
  - Client reads via `mapScrapeToPatch()` expecting all architect fields
- **Guards/env:** None (hardcoded URL)
- **Notes:**
  - Direct client-side call (not proxied)
  - Used when selecting an architect in Review tab
  - Throws error if response not OK

---

## Environment Variables Summary

| Variable | Default Value | Used In |
|----------|---------------|---------|
| `UPSTREAM_SEARCH` | `"https://7a4d4f14fd68.ngrok-free.app/webhook/a4cfdee8-25f9-4c3f-bda6-c2571f1975c5"` | `app/api/search/route.ts:5` |
| `UPSTREAM_SCRAPE` | `"https://7a4d4f14fd68.ngrok-free.app/webhook/50546cbf-1229-4f96-a8a8-27ed62c0381e"` | `app/api/scrape/route.ts:4` |
| `UPSTREAM_SCRAPE_STATUS` | `"https://7a4d4f14fd68.ngrok-free.app/webhook/50546cbf-1229-4f96-a8a8-27ed62c0381e"` | `app/api/scrape-status/route.ts:6` |
| `UPSTREAM_ARCHITECT_DETAILS_BASE` | `"https://7a4d4f14fd68.ngrok-free.app/webhook/a4cfdee8-25f9-4c3f-bda6-c2571f1975c5?id="` | `app/api/architect-details/route.ts:4` |

---

## Additional Notes

1. **CORS Configuration:** All internal API routes have CORS enabled (`Access-Control-Allow-Origin: *`)

2. **Caching:** All internal API routes use `dynamic = "force-dynamic"` (no caching)

3. **Hardcoded URLs:** External ngrok URLs are hardcoded in `app/page.tsx` for outreach endpoints (not using environment variables)

4. **Polling Intervals:**
   - Scrape status: 10 seconds (`window.setInterval(tick, 10_000)`)
   - Outreach status: 10 seconds (`OUTREACH_POLL_INTERVAL_MS = 10_000`)

5. **Timeouts:**
   - Search proxy: 20 seconds
   - Scrape proxy: 20 seconds

6. **Dead Code:** None identified (all endpoints are actively used)

7. **Duplicate Endpoints:** `GET_ARCHITECT_DETAILS` (line 157) and `UPSTREAM_SEARCH` (line 6 in search route) point to the same ngrok URL but serve different purposes (one is POST for search, one is POST for architect details)

---

## Validation Rules

### Request Validation

- `/api/scrape-status`: Requires `session` query param (returns 400 if missing)
- `/api/architect-details`: Requires `id` query param (returns 400 if missing)
- `/api/architect-details`: Returns 501 if `UPSTREAM_ARCHITECT_DETAILS_BASE` not configured

### Response Handling

- All proxy endpoints forward upstream status codes
- Error responses return JSON: `{ error: string }`
- Client-side fetch calls handle errors with try/catch blocks
- Safe JSON parsing helper (`safeJson`) handles incomplete ngrok responses

---

**End of Audit**

