# Friend Foundry

**Good friends. Lasting economies.**

A visual design studio for proposed $RAREFRIENDS economies. Create an RF spending loop, watch 30 simulated days, stress it with disappearing demand or a wave of reward claims, and export a reproducible ledger. Built by [plus8bit](https://github.com/plus8bit) for **Economy Potential**, Rare Friends Vibeathon 2026.

**[Open the demo](https://plus8bit.github.io/friend-foundry/)** · [Contest](https://github.com/spokesz/rarefriends-vibeathon)

## Why build this?

Reward-heavy experiences can look exciting while paying out more than they take in. Builders need to see that failure before publishing a promise. Friend Foundry makes the proposed RF economy inspectable, stressable and shareable. Its output is a blueprint other Rare Friends builders can use, not a token-price forecast.

## A 90-second demo

1. Choose **Reward-heavy arcade** and **Skip to results**. Notice the first shortfall and unfunded reward requests.
2. **Pin this design** to keep its treasury curve as a comparison.
3. Reduce **RF per reward** from 5 to 1. The reserve delta per action changes; replay the month to compare.
4. Try **Claim surge**: reward probability doubles from day 10. Then try **Demand dries up**.
5. **Test 100 possible months** for seeded model variability. Inspect the shortfall count and reserve percentiles.
6. **Copy shareable blueprint** to reproduce the inputs in another browser. **Export design & ledger** downloads every daily RF flow and the seed as JSON.

All amounts and rewards are simulated. No wallet, NFT, API key, gas or transaction is required. No analytics, cookies or persistent wallet data are collected. Fonts are loaded from Google Fonts with system fallbacks.

## Run and test

Node.js 22+ for tests, Python 3 for the static development server. No package installation or build step is necessary.

```sh
npm test
npm start
# Open http://localhost:8766
```

Deploy the static files at any subpath; all app imports are relative. The `.github/workflows/pages.yml` workflow runs tests, builds a clean `dist` folder with only the five application files, and deploys it to GitHub Pages. The app works without a backend.

## Model and RF connection

This is a **non-FriendSDK tool**, not an SDK game. RF is the proposed spend/reward unit; the participants are Friends. Each purchase splits into optional burn, creator revenue and a finite reserve. The economy is our proposal, **not Rare Friends' existing on-chain reward distribution**. The diagram uses original schematic characters, not modified Generations art.

On each of 30 days:

- A fixed number of new Friends joins (rounded after scenario adjustment).
- Every Friend independently makes zero or one purchase with the configured activity probability.
- Price is split into burn %, creator %, and the rest to the reserve.
- A Bernoulli reward request is sampled. It is paid only up to the available reserve. Any remainder is recorded as **unfunded**, not minted or represented as enforceable debt.
- Friends independently remain for tomorrow according to the retention assumption.

The invariant after each day is:

```text
starting reserve + cumulative spending
= current reserve + cumulative burn + cumulative creator income + cumulative paid rewards
```

Expected reserve change per purchase = `price × (1 − burn% − creator%) − reward × probability`. Under claim surge, the displayed expectation uses the post-day-10 probability.

Scenarios: steady activity; day-10 demand shock (80% lower arrivals and purchase probability); day-10 claim surge (double reward probability, capped at 100%). The RNG is seeded (42 for replay; 1000–1099 for the stress test). Reserve percentiles use sorted observations at floor((n−1)×quantile). Different configurations may consume RNG draws differently; comparisons are not a controlled paired experiment.

## Checks

Nine automated tests cover conservation over 180 runs, nonnegative reserves, explicit shortfalls, zero-activity behavior, deterministic replay, shock timing, input rejection, share-link round trips, stress-test bounds and expected unit economics. Browser verification covers funded and failing presets, pinned comparison and the 100-run interaction. Full verification evidence is in `VERIFICATION.md`.

## Limits and path to production

- All behavior is hypothetical: no empirical calibration, price feed, wallet/NFT verification, secondary-market liquidity or gas model.
- Participants are assumed able to afford a purchase; rewards and balances do not affect their retention. Creator revenue is gross RF, not profit.
- No issuance or RF exchange-rate appreciation is assumed. Burns do not imply rising price. A successful run does not demonstrate economic viability.
- Shared URLs contain public simulation inputs only. Exports are reports, never executable contracts.
- For production: validate engagement with real experiments, add multi-action cohorts and optional RF telemetry, then integrate audited escrow/reward contracts and official Friend identity. Do not deploy these JS calculations as financial settlement code.

## Credits

Concept and implementation by plus8bit with OpenAI Codex assistance. Original UI, diagram and simulation engine; no FriendSDK assets or package included. DM Sans and Space Grotesk are served by Google Fonts under their respective open font licenses. Rare Friends name is used to identify the ecosystem; this is an independent contest entry.

References: [official economy](https://rarefriends.com/docs/economy), [submission rules](https://github.com/spokesz/rarefriends-vibeathon). MIT licensed source.

Contact: [open an issue](https://github.com/plus8bit/friend-foundry/issues) or mention **@plus8bit** in the submission PR.
