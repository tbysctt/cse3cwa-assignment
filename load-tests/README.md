# JMeter load tests

Staged load testing for the Phoneme Activity Builder workflow: home, Wordle builder, Word Search builder, word bank, and `/health`.

## Prerequisites

1. PostgreSQL available (`docker compose up -d db`) and migrations applied.
2. App running in production mode (preferred for realistic numbers):

   ```sh
   npm run build && npm start
   ```

3. Apache JMeter installed:

   ```sh
   brew install jmeter
   ```

   Or set `JMETER_BIN` to the `jmeter` executable.

## Run all stages (x1, x10, x100, x1000, x10000)

```sh
chmod +x load-tests/run.sh
./load-tests/run.sh
```

Selected levels:

```sh
./load-tests/run.sh 1 10 100
```

Optional env overrides: `HOST`, `PORT`, `PROTOCOL`, `JMETER_BIN`.

## Outputs

| File | Contents |
| --- | --- |
| `results/xN.jtl` | Raw sample log for concurrency N |
| `results/xN.log` | JMeter run log |
| `results/summary.csv` | Aggregated metrics per level |

Open `builder-workflow.jmx` in the JMeter GUI for exploratory runs.
