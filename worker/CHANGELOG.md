# Changelog - Blog View Counter

All notable changes to the blog view counter implementation are documented in this file.

---

## [November 2025] - Security & Code Quality Improvements

### Added

**Rate Limiting**
- Implemented token bucket algorithm with KV-based tracking
- 20 requests per minute per IP address
- Sliding window approach with automatic expiration (60 seconds + 5 second buffer)
- Returns 429 status code when limit exceeded
- Rate limit enforced before any KV writes

**Server-Side Deduplication**
- SHA-256 hashing of IP + slug + salt for privacy-preserving deduplication
- 24-hour deduplication window stored in KV with automatic expiration
- Worker refuses to start if DEDUP_SALT environment variable is missing
- Prevents users from bypassing client-side deduplication by clearing localStorage
- Dedicated npm script: `npm run generate:dedup-salt` for salt generation
- Salt stored in worker/.dev.vars (gitignored) and Cloudflare secrets (production)

**API Authentication**
- X-Worker-Api-Key header validation for POST requests
- Optional: only enforced when VIEW_COUNTER_API_KEY is configured
- Returns 401 Unauthorized for missing or invalid API keys
- Authentication check runs before rate limiting
- Dedicated npm script: `npm run generate:view-counter-api-key`
- Public key approach: exposed via PUBLIC_VIEW_COUNTER_API_KEY in static site
- Note: Key is observable in browser traffic due to static site architecture

**Environment-Based CORS Configuration**
- Replaced hard-coded domain with ALLOWED_ORIGINS environment variable
- Comma-separated list of allowed origins
- Worker refuses to start if ALLOWED_ORIGINS is missing
- Blocks requests with 403 Forbidden if origin not in allowed list
- CORS headers now include X-Worker-Api-Key for preflight requests
- Operational note: Environment variable must be named exactly "ALLOWED_ORIGINS" in Cloudflare dashboard
- Values must include full origin (scheme + domain), e.g., https://sumit.ml,http://localhost:4321

**Input Validation**
- Slug length validation (maximum 256 characters)
- Character validation (alphanumeric, hyphens, underscores, forward slashes only)
- Returns 400 Bad Request with specific error messages for invalid input
- Prevents potential abuse via malformed slugs

**Comprehensive Localhost Detection**
- Added isLocalEnvironment() helper function
- Detects: localhost, 127.0.0.1, 0.0.0.0, [::1] (IPv6)
- Detects: .local domains (Bonjour/mDNS)
- Detects: hostnames containing 'localhost'
- Detects: non-standard ports (anything other than 80/443)
- Local environment views automatically prefixed with 'local-' to isolate from production data

**IP Detection**
- CF-Connecting-IP header (primary)
- X-Forwarded-For header (fallback)
- Gracefully handles missing IP addresses

### Changed

**Worker Configuration**
- Updated wrangler.toml with comment on DEDUP_SALT secret setup
- Removed hard-coded production domain references
- Added comprehensive error messages for misconfiguration

**ViewCounter Component**
- Removed unnecessary TypeScript type assertion, replaced with proper instanceof check
- Added `data-worker-api-key` attribute for API key forwarding
- Component now reads `PUBLIC_VIEW_COUNTER_API_KEY` from environment
- Conditionally includes `X-Worker-Api-Key` header in fetch requests

**Error Handling**
- Simplified catch block to only log errors (component stays hidden on error)
- Generic error messages to prevent information leakage

**Git Hooks**
- Refactored pre-push hook to call `cleanup-localhost-views.sh` script

### Security Improvements

**Multi-Layer Defense**
- Rate limiting prevents spam/abuse
- Server-side deduplication prevents client-side bypass
- API authentication adds additional barrier (when configured)
- CORS configuration prevents unauthorized cross-origin requests
- Input validation prevents malformed data attacks

**Privacy Considerations**
- IP addresses never stored in plaintext
- SHA-256 hashing with external salt
- Salt rotation capability without code changes
- Deduplication markers auto-expire after 24 hours

**Configuration Safeguards**
- Worker refuses to start without required environment variables
- Explicit error messages for misconfiguration (500 Internal Server Error)
- Prevents accidental deployment without proper security setup

### Implementation Notes

**Deduplication Strategy**
- Chose server-side IP hashing over pure client-side for better accuracy
- Balances privacy (hashed IPs) with abuse prevention
- 24-hour window provides reasonable deduplication without excessive tracking
- Client-side localStorage check still present as first-line optimization

**Authentication Strategy**
- API key approach chosen for simplicity over more complex OAuth/JWT
- Optional enforcement allows gradual rollout
- Public key exposure acceptable for non-critical engagement metrics
- Can be upgraded to server-side injection via Cloudflare Rules/Transform if needed (but this is just a darn blog site, so I'm chill)

**CORS Configuration**
- Comma-separated format provides flexibility for multiple environments
- Localhost wildcard (localhost:*) maintained for development convenience
- Strict origin checking prevents basic cross-origin abuse

---

## Known Limitations

### Race Condition in View Counting
**Issue**: KV get/increment/put operations are not atomic
**Impact**: LOW - Multiple simultaneous requests may result in slight undercounting
**Scenario**: Request A and B both read count=10, both write count=11 (should be 12)
**Potential Fix**: Cloudflare Durable Objects provide atomic operations (requires paid plan)
**Decision**: Acceptable trade-off for personal blog scale

### API Key Exposure (Static Sites)
**Issue**: `PUBLIC_VIEW_COUNTER_API_KEY` is observable in browser traffic
**Impact**: MEDIUM - Attackers can extract and reuse the API key
**Mitigation**: Rate limiting and deduplication provide defense-in-depth
**Better Approach**: Use Cloudflare Rules/Transform to inject header server-side
**Decision**: Acceptable for engagement metrics that aren't business-critical

### No Abuse Monitoring
**Issue**: No automated alerts or anomaly detection
**Impact**: LOW - Abuse would need manual detection via KV inspection
**Potential Addition**: Simple KV-based spike detection or Cloudflare Analytics integration
**Decision**: Manual monitoring sufficient for current scale

---

## Operational Checklist

### Before Production Deployment

1. Generate and set DEDUP_SALT
   - Locally: `npm run generate:dedup-salt`
   - Production: `wrangler secret put DEDUP_SALT`

2. Generate and set VIEW_COUNTER_API_KEY (optional but recommended)
   - Locally: `npm run generate:view-counter-api-key`
   - Production: `wrangler secret put VIEW_COUNTER_API_KEY`
   - Frontend: Set PUBLIC_VIEW_COUNTER_API_KEY in .env

3. Configure ALLOWED_ORIGINS
   - Set in worker/.dev.vars for local development
   - Set in Cloudflare Worker environment variables for production
   - Include all domains: production, preview, localhost

4. Test view counter on all environments
   - Local development with local- prefix
   - Production domain
   - Preview/staging domains if applicable

5. Verify security measures
   - Rate limiting triggers at 20 req/min
   - Deduplication prevents repeat views within 24 hours
   - API key validation returns 401 for invalid keys
   - Unauthorized origins receive 403

### Ongoing Maintenance

- Review KV usage monthly (storage and request costs)
- Monitor for unusual view count spikes
- Rotate DEDUP_SALT periodically for enhanced privacy (optional)
- Keep worker dependencies updated
- Review ALLOWED_ORIGINS when adding new domains

---

## Technical Reference

### Environment Variables

**Required:**
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins (e.g., "https://sumit.ml,http://localhost:4321")
- `DEDUP_SALT`: Secret salt for IP hashing (never commit to git)

**Optional:**
- `VIEW_COUNTER_API_KEY`: Secret for API authentication (recommended for production)

**Frontend:**
- `PUBLIC_WORKER_URL`: Worker endpoint URL
- `PUBLIC_VIEW_COUNTER_API_KEY`: API key for frontend (if authentication enabled)

### KV Key Patterns

- `views:{slug}` - View count storage
- `dedup:{slug}:{hash}` - Deduplication markers (24-hour TTL)
- `ratelimit:{ip}:{window}` - Rate limit counters (60-second TTL)
- `local-{slug}` - Development environment view counts

### API Endpoints

**GET /views/{slug}**
- Returns current view count
- No authentication required
- No rate limiting
- Does not increment counter

**POST /views/{slug}**
- Increments view count (if not duplicate)
- Requires X-Worker-Api-Key header (if configured)
- Subject to rate limiting (20 req/min per IP)
- Subject to deduplication (24-hour window)

**OPTIONS /views/{slug}**
- CORS preflight
- Returns allowed methods and headers

### Error Codes

- 400: Invalid slug format or missing slug
- 401: Missing or invalid API key
- 403: Origin not in ALLOWED_ORIGINS
- 405: Method not allowed (only GET, POST, OPTIONS supported)
- 429: Rate limit exceeded
- 500: Worker misconfiguration (missing environment variables)

---

## Future Considerations

### Not Implemented For Now (By Design)

**Atomic Increment Operations**
- Would require Cloudflare Durable Objects (paid plan)
- Current race condition impact is negligible for personal blog traffic
- Trade-off: Slight undercounting vs. increased cost/complexity

**Advanced Abuse Detection**
- Automated monitoring and alerting for anomalies
- Could be added via KV-based analytics or Cloudflare Analytics API
- Current approach: Manual monitoring sufficient for current scale

**View Count Analytics Dashboard**
- Real-time view statistics and trends
- Could be built on top of existing KV data
- Current approach: Raw KV data inspection via wrangler CLI

**Longer Deduplication Windows**
- Current 24-hour window could be extended to weeks/months
- Trade-off: Longer tracking vs. privacy considerations
- Current window balances accuracy with user privacy
