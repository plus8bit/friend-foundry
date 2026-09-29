import test from "node:test";
import assert from "node:assert/strict";
import {
  simulate,
  stress,
  PRESETS,
  validate,
  unitEconomics,
  encodeConfig,
  decodeConfig,
} from "./engine.mjs";
test("every ledger row conserves RF across all presets and shocks", () => {
  for (const p of Object.values(PRESETS))
    for (const scenario of ["calm", "drought", "rush"])
      for (let seed = 0; seed < 20; seed++) {
        const r = simulate(p, scenario, seed);
        for (const d of r.days) {
          assert.ok(d.treasury >= -1e-8);
          assert.ok(
            Math.abs(
              p.treasury +
                d.totalSpend -
                d.totalBurn -
                d.totalCreator -
                d.totalPaid -
                d.treasury,
            ) < 1e-6,
          );
          assert.ok(Math.abs(d.claims * p.reward - d.paid - d.unfunded) < 1e-6);
        }
      }
});
test("same seed and config reproduce exactly", () => {
  assert.deepEqual(simulate(PRESETS.workshop), simulate(PRESETS.workshop));
});
test("no activity cannot invent RF or payouts", () => {
  const p = { ...PRESETS.workshop, activity: 0 };
  const r = simulate(p);
  assert.equal(r.end.treasury, p.treasury);
  assert.equal(r.end.totalSpend, 0);
  assert.equal(r.end.totalPaid, 0);
});
test("unfunded reward requests are explicit, reserve cannot go negative", () => {
  const p = {
    ...PRESETS.arcade,
    initial: 10,
    dailyNew: 0,
    retention: 100,
    activity: 100,
    chance: 100,
    treasury: 0,
  };
  const r = simulate(p);
  assert.equal(r.firstShortfall, 1);
  assert.equal(r.end.treasury, 0);
  assert.ok(r.end.totalUnfunded > 0);
});
test("day-ten shocks leave first nine days identical", () => {
  for (const scenario of ["drought", "rush"])
    assert.deepEqual(
      simulate(PRESETS.workshop, scenario).days.slice(0, 9),
      simulate(PRESETS.workshop).days.slice(0, 9),
    );
});
test("invalid or incomplete configurations are rejected", () => {
  for (const v of [NaN, Infinity, -1, 10001])
    assert.throws(() => validate({ ...PRESETS.workshop, treasury: v }));
  assert.throws(() => decodeConfig("initial=120"));
  assert.throws(() => simulate(PRESETS.workshop, "bad"));
});
test("share round-trip preserves numeric inputs and scenario", () => {
  const { p, scenario } = decodeConfig(encodeConfig(PRESETS.club, "rush"));
  assert.equal(scenario, "rush");
  assert.deepEqual(
    simulate(p, "rush").days,
    simulate(PRESETS.club, "rush").days,
  );
});
test("deterministic stress intervals are ordered, solvent and failing controls separate", () => {
  const good = stress({ ...PRESETS.club, reward: 0 }, "calm", 20);
  assert.equal(good.shortfalls, 0);
  assert.ok(good.p10 <= good.median && good.median <= good.p90);
  assert.equal(
    stress(
      { ...PRESETS.arcade, treasury: 0, activity: 100, chance: 100 },
      "calm",
      20,
    ).shortfalls,
    20,
  );
});
test("unit economics includes both allocations and capped surge probability", () => {
  const u = unitEconomics({ ...PRESETS.club, chance: 80 }, "rush");
  assert.equal(u.expectedReward, 2);
  assert.ok(Math.abs(u.reserveIn - 1.8) < 1e-9);
});
