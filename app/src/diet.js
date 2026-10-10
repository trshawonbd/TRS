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
    </div>`;
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
