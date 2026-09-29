export const VERSION = "1.0.0";
export const PRESETS = {
  workshop: {
    label: "Crafting workshop",
    note: "Friends spend RF to craft cosmetic items. A modest reward budget keeps participation affordable.",
    initial: 120,
    dailyNew: 8,
    activity: 60,
    retention: 97,
    price: 2,
    reward: 3,
    chance: 30,
    burn: 15,
    creator: 10,
    treasury: 350,
  },
  arcade: {
    label: "Reward-heavy arcade",
    note: "Generous rewards bring an appealing promise. Find out who pays when claims arrive.",
    initial: 120,
    dailyNew: 10,
    activity: 75,
    retention: 98,
    price: 1,
    reward: 5,
    chance: 40,
    burn: 10,
    creator: 10,
    treasury: 350,
  },
  club: {
    label: "Friends creative club",
    note: "RF purchases support a creator and a shared reward reserve, with no promise of financial return.",
    initial: 120,
    dailyNew: 5,
    activity: 40,
    retention: 98,
    price: 3,
    reward: 2,
    chance: 20,
    burn: 20,
    creator: 20,
    treasury: 350,
  },
};
export const SCENARIOS = {
  calm: "Steady activity",
  drought: "Demand dries up",
  rush: "Reward claim surge",
};
const bounds = {
  initial: [10, 500],
  dailyNew: [0, 30],
  activity: [0, 100],
  retention: [50, 100],
  price: [0.1, 10],
  reward: [0, 20],
  chance: [0, 100],
  burn: [0, 50],
  creator: [0, 40],
  treasury: [0, 5000],
};
export function validate(p) {
  for (const [k, [lo, hi]] of Object.entries(bounds))
    if (!Number.isFinite(p[k]) || p[k] < lo || p[k] > hi)
      throw Error(`Invalid ${k}: expected ${lo}–${hi}.`);
  if (p.burn + p.creator > 100) throw Error("Allocation exceeds 100%.");
  if (!Number.isInteger(p.initial) || !Number.isInteger(p.dailyNew))
    throw Error("People must be whole numbers.");
  return p;
}
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function simulate(p, scenario = "calm", seed = 42) {
  validate(p);
  if (!SCENARIOS[scenario]) throw Error("Unknown scenario.");
  const random = rng(seed);
  let agents = Array(p.initial).fill(0),
    treasury = p.treasury,
    totalSpend = 0,
    totalBurn = 0,
    totalCreator = 0,
    totalPaid = 0,
    totalUnfunded = 0,
    firstShortfall = null;
  const days = [];
  for (let day = 1; day <= 30; day++) {
    const shock = day >= 10;
    const demand = scenario === "drought" && shock ? 0.2 : 1;
    const claimChance = Math.min(
      1,
      (p.chance / 100) * (scenario === "rush" && shock ? 2 : 1),
    );
    const newcomers = Math.round(p.dailyNew * demand);
    agents.push(...Array(newcomers).fill(0));
    let spend = 0,
      burned = 0,
      creatorPaid = 0,
      paid = 0,
      unfunded = 0,
      actions = 0,
      claims = 0;
    for (let i = 0; i < agents.length; i++) {
      if (random() >= (p.activity / 100) * demand) continue;
      actions++;
      spend += p.price;
      const b = (p.price * p.burn) / 100,
        c = (p.price * p.creator) / 100;
      burned += b;
      creatorPaid += c;
      treasury += p.price - b - c;
      if (random() < claimChance) {
        claims++;
        const amount = Math.min(treasury, p.reward);
        treasury -= amount;
        paid += amount;
        unfunded += p.reward - amount;
      }
    }
    if (unfunded > 1e-7 && firstShortfall === null) firstShortfall = day;
    totalSpend += spend;
    totalBurn += burned;
    totalCreator += creatorPaid;
    totalPaid += paid;
    totalUnfunded += unfunded;
    const population = agents.length;
    agents = agents.filter(() => random() < p.retention / 100);
    days.push({
      day,
      population,
      actions,
      claims,
      spend,
      burned,
      creatorPaid,
      paid,
      unfunded,
      treasury,
      totalSpend,
      totalBurn,
      totalCreator,
      totalPaid,
      totalUnfunded,
    });
  }
  return {
    days,
    firstShortfall,
    end: days.at(-1),
    scenario,
    seed,
    params: { ...p },
  };
}
export function stress(p, scenario, runs = 100) {
  if (!Number.isInteger(runs) || runs < 1 || runs > 1000)
    throw Error("Invalid run count.");
  const results = Array.from({ length: runs }, (_, i) =>
    simulate(p, scenario, 1000 + i),
  );
  const reserves = results.map((r) => r.end.treasury).sort((a, b) => a - b);
  return {
    runs,
    shortfalls: results.filter((r) => r.firstShortfall !== null).length,
    p10: reserves[Math.floor((runs - 1) * 0.1)],
    median: reserves[Math.floor((runs - 1) * 0.5)],
    p90: reserves[Math.floor((runs - 1) * 0.9)],
  };
}
export function unitEconomics(p, scenario = "calm") {
  validate(p);
  const chance = Math.min(1, (p.chance / 100) * (scenario === "rush" ? 2 : 1));
  return {
    reserveIn: p.price * (1 - (p.burn + p.creator) / 100),
    expectedReward: p.reward * chance,
    margin: p.price * (1 - (p.burn + p.creator) / 100) - p.reward * chance,
  };
}
export function encodeConfig(p, scenario) {
  validate(p);
  return new URLSearchParams({
    ...Object.fromEntries(Object.keys(bounds).map((k) => [k, String(p[k])])),
    scenario,
  }).toString();
}
export function decodeConfig(search) {
  const q = new URLSearchParams(search);
  if (!q.has("initial")) return null;
  const p = {};
  for (const k of Object.keys(bounds)) p[k] = Number(q.get(k) ?? NaN);
  validate(p);
  const scenario = q.get("scenario");
  if (!SCENARIOS[scenario]) throw Error("Unknown shared scenario.");
  return { p, scenario };
}
