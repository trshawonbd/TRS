/* ================= My diet: calorie target, BMI, goal weight, meals per day, intermittent fasting ================= */
// Health data stays on this phone only (localStorage). It is never sent to Supabase or shown to the family.
const DIET_DEF = { sex: "", age: "", cm: "", kg: "", goal: "", act: "light", custom: "", meals: 3, fast: "none", start: "12:00", unit: "cm" };
function diet() { try { return { ...DIET_DEF, ...JSON.parse(store.get("diet") || "{}") }; } catch (e) { return { ...DIET_DEF }; } }
function saveDiet(d) { store.set("diet", JSON.stringify(d)); }
function weightLog() { try { return JSON.parse(store.get("weights") || "[]"); } catch (e) { return []; } }
const ACT = () => [
  ["low", 1.2, tr("Mostly sitting", "বেশিরভাগ সময় বসে থাকি")],
  ["light", 1.375, tr("Light: walking, housework", "হালকা: হাঁটা, ঘরের কাজ")],
  ["mod", 1.55, tr("Exercise 3–5 days a week", "সপ্তাহে ৩–৫ দিন ব্যায়াম")],
  ["high", 1.725, tr("Hard exercise or physical job", "কঠোর ব্যায়াম বা শারীরিক কাজ")]
];
const FASTS = [["none", 0], ["12:12", 12], ["14:10", 14], ["16:8", 16], ["18:6", 18], ["20:4", 20]];
const r10 = (n) => Math.round(n / 10) * 10;

function dietCalc(d = diet()) {
  const kg = +d.kg, cm = +d.cm, age = +d.age, goal = +d.goal;
  const ok = kg >= 25 && kg <= 300 && cm >= 120 && cm <= 230 && age >= 13 && age <= 100 && (d.sex === "m" || d.sex === "f");
  const bmi = kg >= 25 && cm >= 120 ? kg / (cm / 100) ** 2 : null;
  const healthy = cm >= 120 ? [Math.round(18.5 * (cm / 100) ** 2), Math.round(22.9 * (cm / 100) ** 2)] : null;
  let tdee = null, suggested = null, mode = null;
  if (ok) {
    tdee = (10 * kg + 6.25 * cm - 5 * age + (d.sex === "m" ? 5 : -161)) * ACT().find((a) => a[0] === d.act)[1];
    mode = goal && goal < kg - 0.5 ? "lose" : goal && goal > kg + 0.5 ? "gain" : "keep";
    suggested = r10(mode === "lose" ? Math.max(d.sex === "m" ? 1500 : 1200, tdee - 500) : mode === "gain" ? tdee + 300 : tdee);
  }
  const custom = +d.custom >= 800 && +d.custom <= 5000 ? r10(+d.custom) : null;
  const target = custom || suggested;
  const meals = Math.min(5, Math.max(1, +d.meals || 3));
  const perMeal = target ? r10(target / meals) : null;
  let weeks = null;
  if (ok && target && mode === "lose") { const perWeek = ((tdee - target) * 7) / 7700; if (perWeek > 0.05) weeks = Math.ceil((kg - goal) / perWeek); }
  if (ok && target && mode === "gain") { const perWeek = ((target - tdee) * 7) / 7700; if (perWeek > 0.05) weeks = Math.ceil((goal - kg) / perWeek); }
  return { ok, bmi, healthy, tdee, suggested, custom, target, meals, perMeal, mode, weeks, kg, goal };
}
// BMI bands for South Asian adults (WHO Asia-Pacific): healthy 18.5–22.9, overweight 23–27.4, obese 27.5+.
function bmiBand(b) {
  if (b < 18.5) return ["under", tr("Underweight", "কম ওজন")];
  if (b < 23) return ["ok", tr("Healthy", "স্বাস্থ্যকর")];
  if (b < 27.5) return ["over", tr("Overweight", "বেশি ওজন")];
  return ["obese", tr("Obese", "স্থূলতা")];
}

/* fasting */
function fastStatus(d = diet(), now = new Date()) {
  const f = FASTS.find((x) => x[0] === d.fast);
  if (!f || !f[1]) return null;
  const [h, m] = (d.start || "12:00").split(":").map(Number);
  const startMin = h * 60 + m, eat = (24 - f[1]) * 60, endMin = (startMin + eat) % 1440, nowMin = now.getHours() * 60 + now.getMinutes();
  const inWin = startMin < endMin ? nowMin >= startMin && nowMin < endMin : nowMin >= startMin || nowMin < endMin;
  const until = (t) => (t - nowMin + 1440) % 1440;
  return inWin ? { eating: true, left: until(endMin), total: eat, startMin, endMin } : { eating: false, left: until(startMin), total: f[1] * 60, startMin, endMin };
}
const clockOf = (min) => N(String(Math.floor(min / 60) % 24).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0"));
const hm = (min) => { const h = Math.floor(min / 60), m = min % 60; return BNL ? `${h ? N(h) + " ঘণ্টা " : ""}${N(m)} মিনিট` : `${h ? h + "h " : ""}${m}m`; };
function fastCard() {
  const s = fastStatus(); if (!s) return "";
  const pct = Math.round(((s.total - s.left) / s.total) * 100);
  return `<button class="card fast-card${s.eating ? " eat" : ""}" id="fast-card" data-sub="diet">
    <span class="fc-top"><span class="eyebrow">${s.eating ? tr("Eating window", "খাওয়ার সময়") : tr("Fasting", "ফাস্টিং চলছে")} · ${N(esc(diet().fast))}</span><b class="num">${hm(s.left)}</b></span>
    <span class="meter" aria-hidden="true"><i style="width:${pct}%"></i></span>
    <span class="small muted num">${s.eating ? tr(`Window closes at ${clockOf(s.endMin)}`, `${clockOf(s.endMin)}-এ খাওয়ার সময় শেষ`) : tr(`You can eat from ${clockOf(s.startMin)}`, `${clockOf(s.startMin)} থেকে খেতে পারবেন`)}</span>
  </button>`;
}
function updateFastCard() { const el = $("fast-card"); if (el) { el.outerHTML = fastCard(); const n = $("fast-card"); if (n) n.onclick = () => openSub("diet"); } }

/* the Today mini card */
function dietMini() {
  const c = dietCalc();
  return c.target
    ? `<button class="card" data-sub="diet"><span class="eyebrow">${tr("Daily target", "দৈনিক লক্ষ্য")}</span><b class="num">${fmtBig(c.target)}</b><span class="small muted num">${tr(`kcal · ${c.meals} meal${c.meals > 1 ? "s" : ""}`, `ক্যালরি · ${N(c.meals)} বেলা`)}</span></button>`
    : `<button class="card" data-sub="diet"><span class="eyebrow">${tr("My diet", "আমার ডায়েট")}</span><b style="font-size:1.15rem">${tr("Set your goal", "লক্ষ্য ঠিক করুন")}</b><span class="small muted">${tr("Calories, BMI, fasting", "ক্যালরি, BMI, ফাস্টিং")}</span></button>`;
}
/* one line on a recipe page */
function mealFitLine(r) {
  const c = dietCalc(); if (!c.perMeal) return "";
  const d = r.kcal - c.perMeal;
  return d <= 0 ? `<span class="fit fit-ok num">✓ ${tr(`Fits your ${c.perMeal} kcal meal`, `আপনার ${N(c.perMeal)} ক্যালরির বেলায় মানায়`)}</span>`
    : `<span class="fit fit-no num">${tr(`${d} kcal over your meal budget`, `আপনার বেলার হিসাবের চেয়ে ${N(d)} ক্যালরি বেশি`)}</span>`;
}

/* the My diet page */
function renderDiet(pb) {
  const d = diet();
  const chip = (k, v, label) => `<button type="button" class="chip" data-dk="${k}" data-dv="${esc(v)}" aria-pressed="${String(d[k]) === String(v)}">${label}</button>`;
  const ft = d.cm ? Math.floor(+d.cm / 30.48) : "", inch = d.cm ? Math.round((+d.cm / 2.54) % 12) : "";
  pb.innerHTML = `
    <div class="r-title"><p class="eyebrow">${tr("Only on this phone", "শুধু এই ফোনে থাকে")}</p><h1>${tr("My diet", "আমার ডায়েট")}</h1>
      <p class="muted">${tr("Tell us a little about you. We suggest a daily calorie target, and you can change it.", "নিজের সম্পর্কে একটু বলুন। আমরা দৈনিক ক্যালরির লক্ষ্য বলে দেব, চাইলে নিজে বদলাতে পারবেন।")}</p></div>
    <div class="card dform">
      <div class="drow"><span class="dl">${tr("I am", "আমি")}</span><div class="wrapchips">${chip("sex", "f", tr("Woman", "নারী"))}${chip("sex", "m", tr("Man", "পুরুষ"))}</div></div>
      <label class="drow"><span class="dl">${tr("Age", "বয়স")}</span><input class="field num" id="d-age" type="number" inputmode="numeric" min="13" max="100" value="${esc(d.age)}" placeholder="30"><span class="du">${tr("years", "বছর")}</span></label>
      <div class="drow"><span class="dl">${tr("Height", "উচ্চতা")}</span>
        <div class="hgt">${d.unit === "ft"
          ? `<input class="field num" id="d-ft" type="number" inputmode="numeric" min="4" max="7" value="${ft}" placeholder="5"><span class="du">${tr("ft", "ফুট")}</span><input class="field num" id="d-in" type="number" inputmode="numeric" min="0" max="11" value="${inch}" placeholder="4"><span class="du">${tr("in", "ইঞ্চি")}</span>`
          : `<input class="field num" id="d-cm" type="number" inputmode="decimal" min="120" max="230" value="${esc(d.cm)}" placeholder="163"><span class="du">${tr("cm", "সেমি")}</span>`}
          <button type="button" class="link" id="d-unit">${d.unit === "ft" ? tr("Use cm", "সেমি দিন") : tr("Use feet", "ফুট-ইঞ্চি দিন")}</button></div></div>
      <label class="drow"><span class="dl">${tr("Weight now", "এখনকার ওজন")}</span><input class="field num" id="d-kg" type="number" inputmode="decimal" min="25" max="300" step="0.1" value="${esc(d.kg)}" placeholder="72"><span class="du">${tr("kg", "কেজি")}</span></label>
      <label class="drow"><span class="dl">${tr("Goal weight", "লক্ষ্য ওজন")}</span><input class="field num" id="d-goal" type="number" inputmode="decimal" min="25" max="300" step="0.1" value="${esc(d.goal)}" placeholder="65"><span class="du">${tr("kg", "কেজি")}</span></label>
      <div class="drow col"><span class="dl">${tr("How active are you?", "কতটা সক্রিয়?")}</span><div class="wrapchips">${ACT().map(([k, , l]) => chip("act", k, l)).join("")}</div></div>
    </div>
    <div id="d-res"></div>
    <div class="card">
      <h2 style="font-size:1.15rem">${tr("Meals per day", "দিনে কয় বেলা খাবেন")}</h2>
      <div class="wrapchips">${[1, 2, 3, 4, 5].map((n) => chip("meals", n, N(n))).join("")}</div>
      <p class="small muted" id="d-meal"></p>
    </div>
    <div class="card">
      <h2 style="font-size:1.15rem">${tr("Intermittent fasting", "ইন্টারমিটেন্ট ফাস্টিং")}</h2>
      <p class="small muted">${tr("Fast for some hours, eat within a window. 16:8 means 16 hours fasting and 8 hours for meals.", "কিছু ঘণ্টা না খেয়ে থাকা, নির্দিষ্ট সময়ের মধ্যে খাওয়া। ১৬:৮ মানে ১৬ ঘণ্টা না খাওয়া, ৮ ঘণ্টায় খাওয়া।")}</p>
      <div class="wrapchips">${FASTS.map(([k]) => chip("fast", k, k === "none" ? tr("Off", "বন্ধ") : N(k))).join("")}</div>
      <label class="drow" ${d.fast === "none" ? "hidden" : ""} id="d-start-row"><span class="dl">${tr("First meal at", "প্রথম খাবার")}</span><input class="field" id="d-start" type="time" value="${esc(d.start)}"></label>
      <p class="small" id="d-fast"></p>
    </div>
    <div class="card" id="d-wlog"></div>
    <p class="small muted">${tr("Estimates only, using the Mifflin–St Jeor formula. If you are under 18, pregnant or breastfeeding, or have diabetes, kidney disease or another condition, ask your doctor before dieting or fasting.", "এগুলো আনুমানিক হিসাব (Mifflin–St Jeor সূত্র)। ১৮ বছরের কম হলে, গর্ভবতী বা বুকের দুধ খাওয়ালে, বা ডায়াবেটিস, কিডনির সমস্যা বা অন্য অসুখ থাকলে ডায়েট বা ফাস্টিংয়ের আগে ডাক্তারের সাথে কথা বলুন।")}</p>`;
  const save = (patch) => { saveDiet({ ...diet(), ...patch }); renderDietResults(); refreshTodayBits(); };
  pb.querySelectorAll("[data-dk]").forEach((b) => (b.onclick = () => {
    const k = b.dataset.dk, v = k === "meals" ? +b.dataset.dv : b.dataset.dv;
    pb.querySelectorAll(`[data-dk="${k}"]`).forEach((x) => x.setAttribute("aria-pressed", x === b));
    save({ [k]: v });
    if (k === "fast") $("d-start-row").hidden = v === "none";
  }));
  const num = (id, key) => { const el = $(id); if (el) el.oninput = () => save({ [key]: el.value }); };
  num("d-age", "age"); num("d-kg", "kg"); num("d-goal", "goal"); num("d-cm", "cm");
  const ftIn = () => { const f = +$("d-ft").value || 0, i = +$("d-in").value || 0; save({ cm: f || i ? String(Math.round((f * 12 + i) * 2.54)) : "" }); };
  if ($("d-ft")) { $("d-ft").oninput = ftIn; $("d-in").oninput = ftIn; }
  $("d-unit").onclick = () => { saveDiet({ ...diet(), unit: diet().unit === "ft" ? "cm" : "ft" }); renderDiet(pb); };
  $("d-start").onchange = () => save({ start: $("d-start").value || "12:00" });
  renderDietResults();
}
function renderDietResults() {
  const d = diet(), c = dietCalc(d), box = $("d-res"); if (!box) return;
  const kcal = tr("kcal", "ক্যালরি"), kgU = tr("kg", "কেজি");
  let bmiHtml = "";
  if (c.bmi) {
    const [band, label] = bmiBand(c.bmi), pos = Math.max(0, Math.min(100, ((c.bmi - 15) / (35 - 15)) * 100));
    bmiHtml = `<div class="card">
      <div class="section-h"><h2 style="font-size:1.15rem">BMI</h2><span class="bmi-tag b-${band}">${label}</span></div>
      <div class="j-big num"><b>${N(c.bmi.toFixed(1))}</b><span>${tr("healthy range 18.5–22.9 for South Asians", "দক্ষিণ এশীয়দের জন্য স্বাস্থ্যকর ১৮.৫–২২.৯")}</span></div>
      <div class="bmi-scale" aria-hidden="true"><i class="s1"></i><i class="s2"></i><i class="s3"></i><i class="s4"></i><b style="left:${pos}%"></b></div>
      <div class="bmi-ticks num" aria-hidden="true"><span>${N("18.5")}</span><span>${N(23)}</span><span>${N("27.5")}</span></div>
      ${c.healthy ? `<p class="small muted num">${tr(`A healthy weight for your height: ${c.healthy[0]}–${c.healthy[1]} kg.`, `আপনার উচ্চতায় স্বাস্থ্যকর ওজন: ${N(c.healthy[0])}–${N(c.healthy[1])} কেজি।`)}</p>` : ""}
    </div>`;
  }
  let goalHtml = "";
  if (c.ok && c.goal) {
    const diff = Math.abs(c.kg - c.goal), lowGoal = c.healthy && c.goal < c.healthy[0];
    goalHtml = `<p class="num">${c.mode === "keep" ? tr("Your goal is your current weight: we'll aim to keep it.", "লক্ষ্য আর এখনকার ওজন প্রায় একই: ওজন ধরে রাখাই লক্ষ্য।")
      : c.mode === "lose" ? tr(`Lose ${diff.toFixed(1)} kg${c.weeks ? `, about ${c.weeks} weeks at this target` : ""}.`, `${N(diff.toFixed(1))} কেজি কমাতে হবে${c.weeks ? `, এই লক্ষ্যে প্রায় ${N(c.weeks)} সপ্তাহ` : ""}।`)
      : tr(`Gain ${diff.toFixed(1)} kg${c.weeks ? `, about ${c.weeks} weeks at this target` : ""}.`, `${N(diff.toFixed(1))} কেজি বাড়াতে হবে${c.weeks ? `, এই লক্ষ্যে প্রায় ${N(c.weeks)} সপ্তাহ` : ""}।`)}</p>
      ${lowGoal ? `<p class="small" style="color:var(--chili)">${tr("This goal is below the healthy range for your height.", "এই লক্ষ্য আপনার উচ্চতার স্বাস্থ্যকর সীমার নিচে।")}</p>` : ""}`;
  }
  box.innerHTML = `${bmiHtml}
    <div class="card">
      <div class="section-h"><h2 style="font-size:1.15rem">${tr("Daily calorie target", "দৈনিক ক্যালরির লক্ষ্য")}</h2></div>
      ${c.target ? `<div class="j-big num"><b>${fmtBig(c.target)}</b><span>${kcal} ${c.custom ? tr("(your own)", "(আপনার ঠিক করা)") : tr("(suggested)", "(প্রস্তাবিত)")}</span></div>`
        : `<p class="muted">${tr("Fill in the details above, or type your own target below.", "উপরের ঘরগুলো পূরণ করুন, অথবা নিচে নিজের লক্ষ্য লিখুন।")}</p>`}
      ${goalHtml}
      ${c.tdee ? `<p class="small muted num">${tr(`You burn about ${fmtBig(c.tdee)} kcal a day.${c.suggested ? ` Suggested: ${fmtBig(c.suggested)} kcal.` : ""}`, `আপনি দিনে প্রায় ${fmtBig(c.tdee)} ক্যালরি খরচ করেন।${c.suggested ? ` প্রস্তাবিত: ${fmtBig(c.suggested)} ক্যালরি।` : ""}`)}</p>` : ""}
      <label class="drow"><span class="dl">${tr("Set my own", "নিজে ঠিক করব")}</span><input class="field num" id="d-custom" type="number" inputmode="numeric" min="800" max="5000" step="50" value="${esc(d.custom)}" placeholder="${c.suggested || 1600}"><span class="du">${kcal}</span></label>
      ${c.custom && c.custom < 1200 ? `<p class="small" style="color:var(--chili)">${tr("Below 1,200 kcal a day is hard to do safely without a doctor.", "দিনে ১,২০০ ক্যালরির কম ডাক্তারের পরামর্শ ছাড়া নিরাপদ নয়।")}</p>` : ""}
      ${mathHTML()}
    </div>
    <div id="d-plan">${planHTML(false)}</div>`;
  const dp = $("d-plan");
  if (dp) { const redraw = () => { dp.innerHTML = planHTML(false); bindPlan(dp, redraw); }; bindPlan(dp, redraw); }
  const cu = $("d-custom");
  cu.oninput = () => { saveDiet({ ...diet(), custom: cu.value }); clearTimeout(cu.t); cu.t = setTimeout(() => { const pos = cu.selectionStart; renderDietResults(); const n = $("d-custom"); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} }, 600); refreshTodayBits(); };
  const meal = $("d-meal");
  if (meal) meal.innerHTML = c.perMeal ? tr(`About <b class="num">${fmtBig(c.perMeal)} kcal</b> per meal.`, `প্রতি বেলায় প্রায় <b class="num">${fmtBig(c.perMeal)} ক্যালরি</b>।`) : "";
  const fs = $("d-fast"), s = fastStatus(d);
  if (fs) fs.innerHTML = s ? `${tr(`Eat between <b class="num">${clockOf(s.startMin)}</b> and <b class="num">${clockOf(s.endMin)}</b>.`, `<b class="num">${clockOf(s.startMin)}</b> থেকে <b class="num">${clockOf(s.endMin)}</b>-এর মধ্যে খাবেন।`)}${c.meals > Math.max(1, Math.floor((24 - FASTS.find((f) => f[0] === d.fast)[1]) / 3)) ? " " + tr("That's a short window for so many meals; 2 meals may suit it better.", "এত বেলার জন্য সময়টা কম; ২ বেলা হয়তো ভালো হবে।") : ""}` : "";
  renderWeightLog();
}
function renderWeightLog() {
  const box = $("d-wlog"); if (!box) return;
  const log = weightLog(), d = diet(), last = log[log.length - 1];
  const pts = log.slice(-30);
  let chart = "";
  if (pts.length >= 2) {
    const W = 300, H = 110, pad = 14, ws = pts.map((p) => p.kg), goal = +d.goal || null;
    const lo = Math.min(...ws, goal || Infinity) - 1, hi = Math.max(...ws, goal || -Infinity) + 1;
    const x = (i) => pad + (i * (W - pad * 2)) / (pts.length - 1), y = (v) => pad + ((hi - v) * (H - pad * 2)) / (hi - lo);
    chart = `<svg class="wchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(tr("Weight over time", "সময়ের সাথে ওজন"))}">
      ${goal ? `<line x1="${pad}" x2="${W - pad}" y1="${y(goal)}" y2="${y(goal)}" class="goal"/><text x="${W - pad}" y="${y(goal) - 4}" text-anchor="end" class="gl">${esc(tr("goal", "লক্ষ্য"))} ${N(goal)}</text>` : ""}
      <polyline points="${pts.map((p, i) => `${x(i)},${y(p.kg)}`).join(" ")}" class="ln"/>
      ${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.kg)}" r="4" class="pt"><title>${esc(p.d)}: ${N(p.kg)} ${tr("kg", "কেজি")}</title></circle>`).join("")}
    </svg>`;
  }
  const first = log[0], change = first && last ? +(last.kg - first.kg).toFixed(1) : 0;
  box.innerHTML = `<div class="section-h"><h2 style="font-size:1.15rem">${tr("Weight log", "ওজনের খাতা")}</h2>${log.length ? `<span class="small muted num">${change === 0 ? "" : (change < 0 ? "↓ " : "↑ ") + N(Math.abs(change)) + " " + tr("kg since start", "কেজি শুরু থেকে")}</span>` : ""}</div>
    ${chart || `<p class="small muted">${tr("Log your weight once a week, same time of day. Your progress shows here.", "সপ্তাহে একবার, একই সময়ে ওজন লিখুন। এখানে অগ্রগতি দেখাবে।")}</p>`}
    <form class="addbar" id="w-add"><input class="field num" id="w-kg" type="number" inputmode="decimal" step="0.1" min="25" max="300" placeholder="${last ? last.kg : d.kg || "70"}" aria-label="${tr("Weight in kg", "ওজন কেজিতে")}"><button class="btn primary">${tr("Save today", "আজকের ওজন")}</button></form>
    ${log.length ? `<p class="small muted num">${tr(`Last: ${last.kg} kg on ${last.d}`, `শেষ: ${N(last.d)} তারিখে ${N(last.kg)} কেজি`)} · <button type="button" class="link" id="w-undo" style="min-height:0">${tr("Remove last", "শেষটা মুছুন")}</button></p>` : ""}`;
  $("w-add").onsubmit = (e) => {
    e.preventDefault();
    const v = +$("w-kg").value; if (!(v >= 25 && v <= 300)) return toast(tr("Enter a weight in kg", "কেজিতে ওজন লিখুন"));
    const l = weightLog().filter((x) => x.d !== today()); l.push({ d: today(), kg: Math.round(v * 10) / 10 }); l.sort((a, b) => (a.d < b.d ? -1 : 1));
    store.set("weights", JSON.stringify(l.slice(-200)));
    saveDiet({ ...diet(), kg: String(Math.round(v * 10) / 10) });
    const kgIn = $("d-kg"); if (kgIn) kgIn.value = Math.round(v * 10) / 10;
    renderDietResults(); refreshTodayBits(); toast(tr("Weight saved", "ওজন সেভ হয়েছে"));
  };
  const u = $("w-undo"); if (u) u.onclick = () => { const l = weightLog(); l.pop(); store.set("weights", JSON.stringify(l)); renderWeightLog(); };
}
/* keep Today's cards in step without re-rendering the whole screen */
function refreshTodayBits() { if (typeof renderHome === "function") renderHome(); }

/* ================= personal meal plan for a day ================= */
// Built from the recipes: each meal gets a share of the daily target, a recipe that fits,
// then simple portions (rice, roti, fruit, yoghurt…) to bring it close to the budget.
const ADDONS = {
  rice: [200, 4, "1 cup cooked rice", "১ কাপ ভাত"],
  roti: [110, 3, "1 atta roti", "১টি আটার রুটি"],
  halfrice: [100, 2, "½ cup cooked rice", "আধা কাপ ভাত"],
  salad: [40, 1, "cucumber-tomato salad", "শসা-টমেটো সালাদ"],
  yog: [100, 15, "150 g Greek yoghurt", "১৫০ গ্রাম গ্রিক দই"],
  fruit: [80, 1, "1 fruit (guava, apple or orange)", "১টি ফল (পেয়ারা, আপেল বা কমলা)"],
  egg: [75, 6, "1 boiled egg", "১টি সেদ্ধ ডিম"],
  nuts: [70, 3, "10 almonds", "১০টি কাঠবাদাম"]
};
const SLOT_SETS = { 1: ["main", "snack"], 2: ["main", "main"], 3: ["main", "snack", "main"], 4: ["main", "snack", "main", "light"], 5: ["main", "snack", "main", "snack", "light"] };
const SLOT_W = { main: 1, snack: 0.45, light: 0.3 };
const POOL = {
  main: (r) => r.type === "Main" || r.type === "Soup & Dal",
  snack: (r) => r.type === "Snack" || r.type === "Salad" || r.type === "Sweet",
  light: (r) => r.type === "Salad" || r.type === "Drink"
};
const FILL = { main: ["rice", "roti", "halfrice", "salad"], mainStarch: ["salad", "yog", "fruit", "egg"], snack: ["yog", "fruit", "egg", "nuts"], light: ["fruit", "nuts", "egg"] };
// dishes that already bring their own rice, bread, potato or pasta don't get extra rice or roti
const STARCHY = /\b(rice|basmati|pasta|spaghetti|noodle|bread|roti|paratha|pitta|pita|tortilla|wrap|potato|oats|couscous|bulgur|quinoa|chips|vermicelli|semolina|suji)\b/i;
// don't add a side the dish already has (yoghurt parfait + yoghurt)
const HAS = { yog: /yog(h)?urt|curd|doi|raita|labneh/i, egg: /\begg/i, nuts: /almond|cashew|walnut|peanut|\bnuts?\b/i, fruit: /banana|apple|mango|berr|orange|guava|fruit|dates?\b|papaya/i };
const recipeText = (r) => ((r.en && r.en.ing) || r.ing.map((x) => x[2]).join(" ")) + " " + ((r.en && r.en.name) || r.name);
const isStarchy = (r) => STARCHY.test(((r.en && r.en.ing) || r.ing.map((x) => x[2]).join(" ")) + " " + ((r.en && r.en.name) || r.name));
function seededRand(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const planSeedKey = () => "plan-seed-" + today();
function mealTimes(n, d = diet()) {
  const f = FASTS.find((x) => x[0] === d.fast), [h, m] = (d.start || "12:00").split(":").map(Number);
  const start = f && f[1] ? h * 60 + m : 13 * 60, end = f && f[1] ? start + (24 - f[1]) * 60 - 30 : 21 * 60;
  if (n === 1) return [start];
  return Array.from({ length: n }, (_, i) => Math.round((start + ((end - start) * i) / (n - 1)) / 15) * 15);
}
function buildDayPlan() {
  const c = dietCalc(); if (!c.target) return null;
  const rand = seededRand(today() + "|" + (store.get(planSeedKey()) || "0") + "|" + c.target + "|" + c.meals);
  const slots = SLOT_SETS[c.meals], wsum = slots.reduce((a, s) => a + SLOT_W[s], 0), used = new Set();
  const times = c.meals === 1 ? slots.map(() => mealTimes(1)[0]) : mealTimes(slots.length);
  const meals = slots.map((slot, i) => {
    const budget = (c.target * SLOT_W[slot]) / wsum;
    const pool = RECIPES.filter((r) => POOL[slot](r) && !used.has(r.id));
    let fits = pool.filter((r) => r.kcal <= budget && r.kcal >= budget * (slot === "main" ? 0.45 : 0.3));
    if (!fits.length) fits = pool.filter((r) => r.kcal <= budget);
    if (!fits.length) fits = pool.slice().sort((a, b) => a.kcal - b.kcal).slice(0, 3);
    const r = fits[Math.floor(rand() * fits.length)]; used.add(r.id);
    // bigger budgets: 1½ or 2 servings of the main dish (2 only when eating 1–2 meals a day)
    let serv = 1;
    if (slot === "main") for (const sv of c.meals <= 2 ? [2, 1.5] : [1.5]) if (r.kcal * sv <= budget - 60) { serv = sv; break; }
    let kcal = r.kcal * serv, p = Math.round(r.p * serv); const adds = [];
    const allowed = FILL[slot === "main" && isStarchy(r) ? "mainStarch" : r.type === "Sweet" ? "light" : slot].filter((k) => !(r.type === "Sweet" && k === "egg"));
    for (let guard = 0; guard < 3; guard++) {
      const left = budget - kcal;
      const pick = allowed.filter((k) => !adds.includes(k) || k === "roti").filter((k) => !(HAS[k] && HAS[k].test(recipeText(r)))).filter((k) => !(adds.includes("rice") && (k === "halfrice" || k === "roti")) && !(adds.includes("roti") && k !== "roti" && (k === "rice" || k === "halfrice")))
        .filter((k) => ADDONS[k][0] <= left + 25 && !(k === "roti" && adds.filter((x) => x === "roti").length >= 2))
        .sort((x, y) => ADDONS[y][0] - ADDONS[x][0])[0];
      if (!pick || left < 35) break;
      adds.push(pick); kcal += ADDONS[pick][0]; p += ADDONS[pick][1];
    }
    return { slot, time: times[i], r, serv, adds, kcal: Math.round(kcal), p };
  });
  const total = meals.reduce((a, m) => a + m.kcal, 0), protein = meals.reduce((a, m) => a + m.p, 0);
  return { meals, total, protein, target: c.target };
}
function planHTML(compact) {
  const pl = buildDayPlan(); if (!pl) return "";
  const kc = tr("kcal", "ক্যালরি");
  const rows = pl.meals.map((m, i) => `<li class="pm">
      <span class="pm-time num">${clockOf(m.time)}</span>
      <span class="pm-body"><button class="link-plain" data-r="${m.r.id}"><b>${esc(m.r.name)}</b></button>
        ${m.serv > 1 ? `<small class="num">${m.serv === 2 ? tr("2 servings", "২ জনের পরিমাণ") : tr("1½ servings", "দেড় জনের পরিমাণ")}</small>` : ""}
        ${m.adds.length ? `<small>+ ${[...new Set(m.adds)].map((k) => { const n = m.adds.filter((x) => x === k).length; return (n > 1 ? N(n) + " × " : "") + esc(tr(ADDONS[k][2], ADDONS[k][3])); }).join(", ")}</small>` : ""}</span>
      <span class="pm-k num">${fmtBig(m.kcal)}</span></li>`).join("");
  const diff = pl.total - pl.target;
  return `<div class="card plan-card">
    <div class="section-h"><h2 style="font-size:1.15rem">${tr("Your plan today", "আজ আপনার খাবারের প্ল্যান")}</h2><button class="link" id="plan-shuffle" style="min-height:0">↻ ${tr("Shuffle", "বদলে দিন")}</button></div>
    <ol class="pm-list">${rows}</ol>
    <p class="small muted num">${tr(`Total ${fmtBig(pl.total)} of ${fmtBig(pl.target)} kcal · about ${pl.protein} g protein`, `মোট ${fmtBig(pl.total)} / ${fmtBig(pl.target)} ক্যালরি · প্রোটিন প্রায় ${N(pl.protein)} গ্রাম`)}${Math.abs(diff) > 120 ? (diff < 0 ? tr(" · add a fruit or yoghurt to reach it", " · লক্ষ্যে পৌঁছাতে একটা ফল বা দই যোগ করুন") : "") : ""}</p>
    ${compact ? "" : `<p class="small muted">${tr("Tap a dish to see the recipe. Use the same oil-light methods as the recipes, and drink plenty of water.", "রেসিপি দেখতে খাবারের নামে চাপুন। রেসিপির মতো কম তেলে রান্না করুন, আর প্রচুর পানি খান।")}</p>`}
  </div>`;
}
function bindPlan(root, rerender) {
  const b = root.querySelector("#plan-shuffle");
  if (b) b.onclick = () => { store.set(planSeedKey(), String((+store.get(planSeedKey()) || 0) + 1)); rerender(); };
  if (typeof bindCommon === "function") bindCommon(root);
}

/* "How is this calculated?" with the person's own numbers */
function mathHTML() {
  const d = diet(), c = dietCalc(d); if (!c.ok) return "";
  const kg = +d.kg, cm = +d.cm, age = +d.age, act = ACT().find((a) => a[0] === d.act);
  const bmr = Math.round(10 * kg + 6.25 * cm - 5 * age + (d.sex === "m" ? 5 : -161));
  const n = (x) => N(x), f = (x) => fmtBig(x);
  const step = (t) => `<li>${t}</li>`;
  return `<details class="math"><summary>${tr("How is this calculated?", "কীভাবে হিসাব হলো?")}</summary><ol>
    ${step(tr(`<b>Calories your body uses at rest (BMR)</b>, Mifflin–St Jeor formula:<br>10 × ${kg} kg + 6.25 × ${cm} cm − 5 × ${age} years ${d.sex === "m" ? "+ 5" : "− 161"} = <b>${f(bmr)} kcal</b>`, `<b>বিশ্রামে শরীরের খরচ (BMR)</b>, Mifflin–St Jeor সূত্রে:<br>১০ × ${n(kg)} কেজি + ৬.২৫ × ${n(cm)} সেমি − ৫ × ${n(age)} বছর ${d.sex === "m" ? "+ ৫" : "− ১৬১"} = <b>${f(bmr)} ক্যালরি</b>`))}
    ${step(tr(`<b>With your activity</b> (${esc(act[2])}): ${f(bmr)} × ${act[1]} = <b>${f(c.tdee)} kcal</b> a day to stay the same weight.`, `<b>আপনার কাজকর্ম ধরে</b> (${esc(act[2])}): ${f(bmr)} × ${n(act[1])} = <b>${f(c.tdee)} ক্যালরি</b>, এতে ওজন একই থাকে।`))}
    ${step(c.mode === "lose" ? tr(`<b>To lose weight</b>, eat about 500 kcal less: ${f(c.tdee)} − 500 = ${f(c.tdee - 500)}, but never below ${d.sex === "m" ? "1,500" : "1,200"}. Suggested: <b>${f(c.suggested)} kcal</b>.`, `<b>ওজন কমাতে</b> দিনে প্রায় ৫০০ ক্যালরি কম: ${f(c.tdee)} − ৫০০ = ${f(c.tdee - 500)}, তবে ${d.sex === "m" ? "১,৫০০" : "১,২০০"}-এর নিচে নয়। প্রস্তাবিত: <b>${f(c.suggested)} ক্যালরি</b>।`)
      : c.mode === "gain" ? tr(`<b>To gain weight</b>, eat about 300 kcal more: <b>${f(c.suggested)} kcal</b>.`, `<b>ওজন বাড়াতে</b> প্রায় ৩০০ ক্যালরি বেশি: <b>${f(c.suggested)} ক্যালরি</b>।`)
      : tr(`<b>To keep your weight</b>, eat about what you burn: <b>${f(c.suggested)} kcal</b>.`, `<b>ওজন ধরে রাখতে</b> যত খরচ তত খান: <b>${f(c.suggested)} ক্যালরি</b>।`))}
    ${c.weeks ? step(tr(`<b>Time to goal:</b> 7,700 kcal ≈ 1 kg of body fat. ${f(Math.abs(c.tdee - c.target))} kcal a day × 7 = ${f(Math.abs(c.tdee - c.target) * 7)} a week ≈ ${(Math.abs(c.tdee - c.target) * 7 / 7700).toFixed(2)} kg, so about <b>${c.weeks} weeks</b>.`, `<b>লক্ষ্যে কত দিন:</b> ৭,৭০০ ক্যালরি ≈ ১ কেজি চর্বি। দিনে ${f(Math.abs(c.tdee - c.target))} × ৭ = সপ্তাহে ${f(Math.abs(c.tdee - c.target) * 7)} ≈ ${n((Math.abs(c.tdee - c.target) * 7 / 7700).toFixed(2))} কেজি, তাই প্রায় <b>${n(c.weeks)} সপ্তাহ</b>।`)) : ""}
    ${step(tr(`<b>Per meal:</b> ${f(c.target)} ÷ ${c.meals} meals ≈ <b>${f(c.perMeal)} kcal</b>.`, `<b>প্রতি বেলায়:</b> ${f(c.target)} ÷ ${n(c.meals)} বেলা ≈ <b>${f(c.perMeal)} ক্যালরি</b>।`))}
    ${step(tr(`<b>BMI</b> = weight ÷ height² = ${kg} ÷ ${(cm / 100).toFixed(2)}² = <b>${c.bmi.toFixed(1)}</b>.`, `<b>BMI</b> = ওজন ÷ উচ্চতা² = ${n(kg)} ÷ ${n((cm / 100).toFixed(2))}² = <b>${n(c.bmi.toFixed(1))}</b>।`))}
  </ol></details>`;
}
