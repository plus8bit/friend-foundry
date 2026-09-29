import {
  PRESETS,
  SCENARIOS,
  simulate,
  stress,
  unitEconomics,
  encodeConfig,
  decodeConfig,
  VERSION,
} from "./engine.mjs";
const $ = (id) => document.getElementById(id),
  fmt = (n) =>
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(n);
let params = { ...PRESETS.workshop },
  scenario = "calm",
  result,
  day = 0,
  timer = null,
  pinned = null,
  stressResult = null;
const fields = [
  ["price", "RF per purchase", 0.1, 10, 0.1, " RF"],
  ["reward", "RF per reward", 0, 20, 0.5, " RF"],
  ["chance", "Reward probability", 0, 100, 5, "%"],
  ["treasury", "Starting reserve", 0, 5000, 50, " RF"],
  ["burn", "Burn allocation", 0, 50, 5, "%"],
  ["creator", "Creator allocation", 0, 40, 5, "%"],
];
const people = [
  ["initial", "Initial Friends", 10, 500, 10, ""],
  ["dailyNew", "New Friends / day", 0, 30, 1, ""],
  ["activity", "Daily purchase probability", 0, 100, 5, "%"],
  ["retention", "Daily retention", 50, 100, 1, "%"],
];
const scenarioNotes = {
  calm: "A steady community. Same assumptions for all 30 days.",
  drought: "From day 10: arrivals and purchase probability fall by 80%.",
  rush: "From day 10: reward probability doubles, capped at 100%.",
};
function controls(list, target) {
  $(target).innerHTML = list
    .map(
      ([id, label, min, max, step, unit]) =>
        `<div class="control"><label for="${id}">${label}<output id="${id}-value" for="${id}"></output></label><input id="${id}" type="range" min="${min}" max="${max}" step="${step}"></div>`,
    )
    .join("");
  list.forEach(([id, , , , , unit]) =>
    $(id).addEventListener("input", () => {
      params[id] = Number($(id).value);
      rebuild();
    }),
  );
}
controls(fields, "controls");
controls(people, "community-controls");
function sync() {
  for (const [id, , , , , unit] of [...fields, ...people]) {
    $(id).value = params[id];
    $(id + "-value").textContent = fmt(params[id]) + unit;
  }
  $("allocation-bar").innerHTML =
    `<span class="orange" style="width:${params.burn}%"></span><span class="purple" style="width:${params.creator}%"></span><span class="green" style="width:${100 - params.burn - params.creator}%"></span>`;
  document.querySelectorAll("[data-scenario]").forEach((b) => {
    const sel = b.dataset.scenario === scenario;
    b.classList.toggle("selected", sel);
    b.setAttribute("aria-pressed", sel);
  });
  $("scenario-note").textContent = scenarioNotes[scenario];
  const u = unitEconomics(params, scenario);
  $("unit-margin").textContent =
    `${u.margin >= 0 ? "+" : ""}${fmt(u.margin)} RF${scenario === "rush" ? " after day 10" : ""}`;
}
function stop() {
  clearInterval(timer);
  timer = null;
  $("world").classList.remove("running");
  $("run").textContent = day === 30 ? "↻ Replay 30 days" : "▶ Run 30 days";
  $("run-label").textContent =
    day === 30 ? "SIMULATION COMPLETE" : "READY TO SIMULATE";
}
function rebuild() {
  day = 0;
  stop();
  stressResult = null;
  result = simulate(params, scenario);
  sync();
  render();
  $("stress-result").textContent =
    "One path tells a story. A hundred paths test how often it holds up.";
}
function chart() {
  const shown = result.days.slice(0, day);
  const max =
    Math.max(
      params.treasury,
      ...shown.map((d) => d.treasury),
      ...(pinned ? pinned.days.map((d) => d.treasury) : []),
      1,
    ) * 1.1;
  const x = (i) => 32 + (i / 29) * 615,
    y = (v) => 130 - (v / max) * 110;
  const path = (data) =>
    data
      .map(
        (v, i) =>
          `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v.treasury).toFixed(1)}`,
      )
      .join(" ");
  let svg = "";
  for (let i = 0; i < 3; i++) {
    const v = (max * i) / 2;
    svg += `<line x1="32" x2="650" y1="${y(v)}" y2="${y(v)}" stroke="#dce1d5" stroke-dasharray="3 5"/><text x="0" y="${y(v) + 3}" fill="#87927e" font-size="8">${fmt(v)}</text>`;
  }
  if (scenario !== "calm")
    svg += `<line x1="${x(9)}" x2="${x(9)}" y1="12" y2="135" stroke="#d16d41" stroke-dasharray="4 4"/><text x="${x(9) + 5}" y="10" fill="#b96541" font-size="8">DAY 10 SHOCK</text>`;
  if (pinned)
    svg += `<path d="${path(pinned.days)}" stroke="#9785b9" stroke-width="2" fill="none" stroke-dasharray="6 4"/>`;
  if (shown.length) {
    const p = path(shown);
    svg += `<path d="${p}L${x(shown.length - 1)},130L32,130Z" fill="#668559" opacity=".1"/><path d="${p}" fill="none" stroke="#668559" stroke-width="2.5"/><circle cx="${x(shown.length - 1)}" cy="${y(shown.at(-1).treasury)}" r="4" fill="#668559"/>`;
  }
  $("chart").innerHTML = svg;
  $("chart").setAttribute(
    "aria-label",
    `Reserve through day ${day}: ${day ? fmt(result.days[day - 1].treasury) : fmt(params.treasury)} RF. ${pinned ? "Pinned comparison shown." : ""}`,
  );
}
function render() {
  const d = day
    ? result.days[day - 1]
    : {
        totalSpend: 0,
        totalBurn: 0,
        totalPaid: 0,
        totalUnfunded: 0,
        totalCreator: 0,
        treasury: params.treasury,
      };
  $("day").textContent = String(day).padStart(2, "0");
  $("timeline").value = day;
  $("timeline-label").textContent = "Day " + day;
  for (const [id, key] of [
    ["spent", "totalSpend"],
    ["burned", "totalBurn"],
    ["paid", "totalPaid"],
    ["unfunded", "totalUnfunded"],
  ])
    $(id).textContent = fmt(d[key]);
  $("map-burn").textContent = fmt(d.totalBurn) + " RF";
  $("map-creator").textContent = fmt(d.totalCreator) + " RF";
  $("map-reserve").textContent = fmt(d.treasury) + " RF";
  $("unfunded").style.color = d.totalUnfunded > 0.01 ? "#b14c2b" : "";
  const bad = d.totalUnfunded > 0.01;
  const u = unitEconomics(params, scenario);
  $("health").classList.toggle("danger", bad);
  $("health").textContent =
    day === 0 ? "DESIGN MODE" : bad ? "SHORTFALL" : "FUNDED SO FAR";
  $("verdict").textContent =
    day === 0
      ? "Give your economy a test run."
      : bad
        ? `The promise outgrew the reserve.`
        : day === 30
          ? "This run stayed within its means."
          : "The loop is funding its rewards.";
  $("insight").textContent =
    day === 0
      ? "The reserve can only pay out what it holds. A shortfall is recorded, never hidden by a negative balance."
      : bad
        ? `First shortfall: day ${result.firstShortfall}. ${fmt(d.totalUnfunded)} RF requested but unfunded so far. Try reducing reward size or increasing RF retained per purchase.`
        : `${fmt(d.treasury)} RF remains after ${day} days. ${u.margin < 0 ? "Expected outflow exceeds inflow per action; a funded run can still consume its starting reserve." : "The expected flow per action supports the reserve under these assumptions."} This is a model result, not a forecast.`;
  chart();
  if (pinned)
    $("comparison").textContent =
      `Pinned design: ${fmt(pinned.end.treasury)} RF final reserve, ${fmt(pinned.end.totalUnfunded)} RF unfunded (${SCENARIOS[pinned.scenario]}). Current full run: ${fmt(result.end.treasury)} RF reserve, ${fmt(result.end.totalUnfunded)} RF unfunded.`;
}
$("preset").addEventListener("change", () => {
  const k = $("preset").value;
  params = { ...PRESETS[k] };
  $("preset-note").textContent = params.note;
  $("world-title").textContent = {
    workshop: "The crafting district",
    arcade: "The arcade district",
    club: "The creative district",
  }[k];
  rebuild();
});
document.querySelectorAll("[data-scenario]").forEach((b) =>
  b.addEventListener("click", () => {
    scenario = b.dataset.scenario;
    rebuild();
  }),
);
$("run").addEventListener("click", () => {
  if (timer) {
    stop();
    return;
  }
  if (day === 30) day = 0;
  $("world").classList.add("running");
  $("run").textContent = "Ⅱ Pause";
  $("run-label").textContent = "SIMULATION RUNNING";
  timer = setInterval(
    () => {
      day++;
      render();
      if (day === 30) stop();
    },
    matchMedia("(prefers-reduced-motion: reduce)").matches ? 80 : 180,
  );
});
$("finish").addEventListener("click", () => {
  day = 30;
  stop();
  render();
});
$("reset").addEventListener("click", rebuild);
$("timeline").addEventListener("input", () => {
  stop();
  day = Number($("timeline").value);
  render();
});
$("pin").addEventListener("click", () => {
  pinned = structuredClone(result);
  $("pin").textContent = "✓ Update pinned design";
  render();
  $("comparison").scrollIntoView({ block: "nearest" });
});
$("stress").addEventListener("click", () => {
  stressResult = stress(params, scenario);
  const s = stressResult;
  $("stress-result").textContent =
    `${s.shortfalls} / ${s.runs} simulated months had an unfunded reward request. Final reserve: ${fmt(s.p10)} RF at the 10th percentile · ${fmt(s.median)} RF median · ${fmt(s.p90)} RF at the 90th percentile. These are model outcomes, not real-world probabilities.`;
});
$("share").addEventListener("click", () => {
  const url = new URL(location.href);
  url.search = encodeConfig(params, scenario);
  url.hash = "";
  // Always expose the link: clipboard permission can remain pending in an
  // embedded browser, so sharing must not depend on its resolution.
  $("status").textContent = "Your blueprint link is ready. ";
  const link = document.createElement("a");
  link.href = url.href;
  link.textContent = "Open or copy this exact design ↗";
  link.style.textDecoration = "underline";
  $("status").append(link);
  navigator.clipboard?.writeText(url.href).catch(() => {});
});
$("export").addEventListener("click", () => {
  const report = {
    project: "Friend Foundry",
    version: VERSION,
    builder: "plus8bit",
    simulated: true,
    generatedAt: new Date().toISOString(),
    scenario,
    seed: 42,
    parameters: params,
    unitEconomics: unitEconomics(params, scenario),
    stressTest: stressResult,
    days: result.days,
    firstShortfall: result.firstShortfall,
    limitations:
      "Hypothetical behavioral assumptions; no live chain, price, gas, or real reward claim. Does not forecast returns.",
  };
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "friend-foundry-blueprint.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $("status").textContent =
    "Exported the design, random seed and complete 30-day ledger.";
});
try {
  const shared = decodeConfig(location.search);
  if (shared) {
    params = shared.p;
    scenario = shared.scenario;
    $("preset-note").textContent =
      "Shared blueprint loaded. Every control below is part of this reproducible scenario.";
    $("world-title").textContent = "Your shared district";
    $("preset").selectedIndex = -1;
  } else $("preset-note").textContent = params.note;
} catch (e) {
  $("status").textContent =
    "Invalid shared blueprint. Loaded the default workshop instead.";
  $("preset-note").textContent = params.note;
}
rebuild();
