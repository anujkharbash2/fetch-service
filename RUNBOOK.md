# Fetch Service — Runbook

## Starting the service
1. `redis-cli ping` → confirm Redis is up
2. `node src/worker.js` (or `pm2 start src/worker.js -i 5`) to start workers
3. Enqueue jobs via `enqueueFetchJob(url)` — normally called by the API Gateway

## Health checks
- Worker prints "Worker started, waiting for jobs..." on boot
- Redis stream `fetch-jobs` should not grow unboundedly (check with `redis-cli XLEN fetch-jobs`)

## Common issues
| Symptom | Likely cause | Fix |
|---|---|---|
| All requests TIMEOUT | Proxy exhausted / network down | Check proxy dashboard usage, curl-test the proxy directly |
| 503 on every URL | Proxy concurrency/quota limit hit | Reduce concurrent workers, check proxy quota |
| CAPTCHA/BLOCKED on legit sites | False positive in blockDetector | Check title-match logic, inspect raw HTML |
| ALL_PROXIES_RETIRED crash | Pool exhausted mid-run | Restart process (resets in-memory scores) or add more proxies |

## Error taxonomy
`TIMEOUT`, `BLOCKED`, `CAPTCHA`, `DNS_FAIL`, `INVALID_URL`, `ROBOTS_DISALLOWED`, `NO_PROXIES_AVAILABLE`

## Known limitations (be upfront about these)
- Free-tier proxies only — success rate ~56% on hard targets (Flipkart/JS-heavy sites), ~100% on easy targets (news)
- No CAPTCHA-solving integration yet
- Proxy scores are in-memory only, reset on restart