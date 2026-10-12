#!/usr/bin/env bash
# Run staged JMeter load levels against the builder workflow.
# Usage:
#   ./load-tests/run.sh              # all levels: 1 10 100 1000 10000
#   ./load-tests/run.sh 1 10 100     # selected levels
# Env:
#   HOST PORT PROTOCOL JMETER_BIN BASE_URL

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLAN="${ROOT}/load-tests/builder-workflow.jmx"
RESULTS_DIR="${ROOT}/load-tests/results"
SUMMARY_CSV="${RESULTS_DIR}/summary.csv"

HOST="${HOST:-localhost}"
PORT="${PORT:-3000}"
PROTOCOL="${PROTOCOL:-http}"

if [[ -n "${JMETER_BIN:-}" ]]; then
  JMETER="$JMETER_BIN"
elif command -v jmeter >/dev/null 2>&1; then
  JMETER="$(command -v jmeter)"
elif [[ -x /opt/homebrew/bin/jmeter ]]; then
  JMETER=/opt/homebrew/bin/jmeter
elif [[ -x /usr/local/bin/jmeter ]]; then
  JMETER=/usr/local/bin/jmeter
else
  echo "Apache JMeter not found. Install with: brew install jmeter" >&2
  echo "Or set JMETER_BIN to the jmeter executable." >&2
  exit 1
fi

LEVELS=("$@")
if [[ ${#LEVELS[@]} -eq 0 ]]; then
  LEVELS=(1 10 100 1000 10000)
fi

mkdir -p "$RESULTS_DIR"

health_url="${PROTOCOL}://${HOST}:${PORT}/health"
echo "Checking ${health_url} ..."
if ! curl -fsS --max-time 10 "$health_url" >/dev/null; then
  echo "App health check failed. Start the app (npm run build && npm start) with Postgres available." >&2
  exit 1
fi

ramp_for() {
  local n="$1"
  if (( n <= 1 )); then echo 0
  elif (( n <= 10 )); then echo 2
  elif (( n <= 100 )); then echo 10
  elif (( n <= 1000 )); then echo 30
  else echo 60
  fi
}

loops_for() {
  local n="$1"
  if (( n >= 1000 )); then echo 1
  else echo 2
  fi
}

write_summary() {
  python3 - "$RESULTS_DIR" "$SUMMARY_CSV" "${LEVELS[@]}" <<'PY'
import csv, math, os, sys

results_dir = sys.argv[1]
summary_csv = sys.argv[2]
levels = [int(x) for x in sys.argv[3:]]

def ramp_for(n: int) -> int:
    if n <= 1:
        return 0
    if n <= 10:
        return 2
    if n <= 100:
        return 10
    if n <= 1000:
        return 30
    return 60

def loops_for(n: int) -> int:
    return 1 if n >= 1000 else 2

rows_out = []
for n in levels:
    path = os.path.join(results_dir, f"x{n}.jtl")
    if not os.path.exists(path):
        continue
    samples = []
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            try:
                elapsed = int(row["elapsed"])
                ts = int(row["timeStamp"])
            except (KeyError, ValueError):
                continue
            ok = row.get("success", "true").lower() == "true"
            samples.append((elapsed, ok, ts))
    count = len(samples)
    errors = sum(1 for _, ok, _ in samples if not ok)
    error_pct = (errors / count * 100) if count else 100.0
    avg = sum(e for e, _, _ in samples) / count if count else 0.0
    times = sorted(e for e, _, _ in samples)
    p95 = times[min(count - 1, max(0, math.ceil(0.95 * count) - 1))] if times else 0
    ts_list = [t for _, _, t in samples]
    if len(ts_list) >= 2:
        duration_s = max((max(ts_list) - min(ts_list)) / 1000.0, 0.001)
        thr = count / duration_s
    else:
        thr = 0.0
    rows_out.append(
        {
            "level": f"x{n}",
            "threads": n,
            "ramp_up": ramp_for(n),
            "loops": loops_for(n),
            "samples": count,
            "errors": errors,
            "error_pct": f"{error_pct:.2f}",
            "avg_ms": f"{avg:.1f}",
            "p95_ms": p95,
            "throughput": f"{thr:.2f}",
        }
    )

with open(summary_csv, "w", newline="") as f:
    writer = csv.DictWriter(
        f,
        fieldnames=[
            "level",
            "threads",
            "ramp_up",
            "loops",
            "samples",
            "errors",
            "error_pct",
            "avg_ms",
            "p95_ms",
            "throughput",
        ],
    )
    writer.writeheader()
    writer.writerows(rows_out)

for row in rows_out:
    print(
        f"Done {row['level']}: samples={row['samples']} errors={row['errors']} "
        f"({row['error_pct']}%) avg={row['avg_ms']}ms p95={row['p95_ms']}ms "
        f"thr={row['throughput']}/s"
    )
PY
}

for level in "${LEVELS[@]}"; do
  threads="$level"
  ramp="$(ramp_for "$threads")"
  loops="$(loops_for "$threads")"
  label="x${threads}"
  jtl="${RESULTS_DIR}/${label}.jtl"
  log="${RESULTS_DIR}/${label}.log"

  echo ""
  echo "=== Running load level ${label} (threads=${threads}, ramp=${ramp}s, loops=${loops}) ==="
  rm -f "$jtl" "$log"

  "$JMETER" -n \
    -t "$PLAN" \
    -l "$jtl" \
    -j "$log" \
    -JHOST="$HOST" \
    -JPORT="$PORT" \
    -JPROTOCOL="$PROTOCOL" \
    -JTHREADS="$threads" \
    -JRAMP_UP="$ramp" \
    -JLOOPS="$loops"
done

echo ""
write_summary
echo ""
echo "Summary written to ${SUMMARY_CSV}"
column -t -s, "$SUMMARY_CSV" 2>/dev/null || cat "$SUMMARY_CSV"
