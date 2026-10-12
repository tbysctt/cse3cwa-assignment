# Load testing results (JMeter)

Staged concurrency against the Phoneme Activity Builder workflow on a single local Next.js production process (`npm run build && npm start`) with Postgres via Docker Compose.

## Scenario

Each virtual user runs this transaction once per loop:

1. `GET /` — home
2. `GET /wordle` — Wordle builder (SSR + DB inventory)
3. `GET /word-search` — Word Search builder (SSR + DB)
4. `GET /word-bank` — word-list builder
5. `GET /health` — DAL ping

Plan: [`load-tests/builder-workflow.jmx`](../load-tests/builder-workflow.jmx). Runner: [`load-tests/run.sh`](../load-tests/run.sh).

## Results summary

| Level | Threads | Ramp (s) | Loops | Samples | Errors | Error % | Avg (ms) | p95 (ms) | Throughput (req/s) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| x1 | 1 | 0 | 2 | 12 | 0 | 0.00 | 27.0 | 127 | 63.16 |
| x10 | 10 | 2 | 2 | 120 | 0 | 0.00 | 11.5 | 36 | 63.73 |
| x100 | 100 | 10 | 2 | 1200 | 0 | 0.00 | 8.3 | 27 | 120.62 |
| x1000 | 1000 | 30 | 1 | 6000 | 0 | 0.00 | 7.1 | 22 | 200.08 |
| x10000 | 10000 | 60 | 1 | 24426 | 11387 | 46.62 | 310.7 | 1551 | 949.84 |

Source CSV: [`load-tests/results/summary.csv`](../load-tests/results/summary.csv).

## Behaviour under load

**x1–x1000 — stable.** With up to 1000 concurrent clients, the builder pages and health endpoint completed with **0% errors**. Average and p95 latency stayed low (single-digit to low tens of milliseconds after warm-up). Throughput rose with concurrency (about 63 req/s at x1/x10 up to about 200 req/s at x1000), which indicates the single Node process and Postgres still had headroom for this read-heavy SSR workflow.

**Warm-up effect.** The lone x1 user shows a higher average (27 ms) and p95 (127 ms) than later stages because the first requests pay cold-start costs (module init, connection pool, caches). Once warm, x10–x1000 are faster per request despite more concurrent users.

**x10000 — saturation and failure.** At 10 000 threads the system no longer behaves reliably:

- **~47% of samples failed**, almost entirely as client-side transport errors (`Connection reset by peer`, `Broken pipe`, `Connection reset`) rather than clean HTTP 5xx responses.
- Average latency rose to **~311 ms** and p95 to **~1.5 s**.
- JMeter itself struggled to spawn native threads (`pthread_create` / `EAGAIN`), so part of the failure mode is the load generator and OS thread limits on a laptop, not only the app.
- The Next.js process could not accept or complete that many simultaneous keep-alive connections; sockets were reset under backlog pressure.

**Interpretation.** For this deployment shape (one app instance + local Postgres), the builder/generated-activity **read path is comfortable through at least x1000 concurrent users** in a short burst, and **breaks down by x10000**. Production would need horizontal scaling (multiple app instances behind a load balancer), connection limits, and possibly SSR caching before targeting tens of thousands of concurrent browser sessions.

## Notes

- Mutations (word/activity CRUD and HTML generation via Server Actions) are covered functionally by Playwright E2E tests; JMeter stresses the HTTP surfaces those UIs load under concurrency.
- Re-run: start Postgres and `npm start`, then `./load-tests/run.sh`.
