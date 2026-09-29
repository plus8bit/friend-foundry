# Verification record

2026-09-29 / 30 · Friend Foundry 1.0.0

## Automated

`npm test`: 9 tests pass. Conservation is checked for every day in 180 runs (3 presets × 3 scenarios × 20 seeds). Checks also cover deterministic replay, empty activity, shortfalls, day-10 transitions, malformed input, share configuration round trips, stress percentiles and unit economics.

## Browser

- Public GitHub Pages app loads with the expected controls and ES modules.
- Default workshop, seed 42: full run funded, ending reserve 2,132 RF.
- Reward-heavy arcade, seed 42: first shortfall on day 4; ending reserve 0.8 RF, unfunded requests 5,518.8 RF.
- Pinning the workshop and switching to arcade shows both curves and their summaries.
- Arcade 100-run test: 100/100 model paths have shortfalls; reserve p10 = 0, median = 0.8, p90 = 3 RF.
- Run button starts animated playback; completion reaches day 30.
- Export click produces the completed-export status; automated download-file retrieval timed out in the embedded browser, so downloaded JSON content was not verified through that browser. Ledger generation is covered by the engine tests.
- Layout checked at 390×844: document width and scroll width both 390. Desktop checked at 1280×900. Keyboard-accessible native controls and reduced-motion CSS included; a full screen-reader audit has not been performed.
- No browser console errors were reported during the local main-flow checks.
- Share button now exposes a navigable link immediately; clipboard is best-effort because browser permission prompts may stay pending.

## Deployment

GitHub Actions tests and deploys a clean five-file static bundle. First run occurred before Pages was enabled and failed at site configuration; enabling Pages and the next push produced a successful deployment. No user wallet files, credentials or unrelated workspace artifacts are included in this repository or the deployed site.
