/* ================= Cook less often: a week plan built around 1–4 cooking days ================= */
// Settings live with My diet on this phone: cook (cooking days a week, 7 = every day), people, cookDay (0 = Sunday).
const prepCfg = () => { const d = diet(); return { cook: [1, 2, 3, 4, 7].includes(+d.cook) ? +d.cook : 7, people: Math.min(8, Math.max(1, +d.people || 2)), cookDay: Number.isInteger(+d.cookDay) && d.cookDay !== "" ? +d.cookDay % 7 : 5 }; };
const prepOn = () => prepCfg().cook < 7 && !!dietCalc().target;

// How well dishes keep. Fish and prawns: eat within 2 days. NO_FREEZE: fine for 3 days in the fridge, not frozen.
const NO_BATCH = new Set(["larb", "fishchips", "jacket", "burrito", "friedrice", "stirfry", "tomatoegg", "paneer", "gambas", "tomyum", "paella"]);
const FISHY = new Set(["fish", "vapa", "lahori", "ruijhol", "patori", "salmon", "malai", "lau"]);
const NO_FREEZE = new Set(["dimbhuna", "tortilla", "pasta", "khichuri", "mujaddara", "shepherd", "fajita", "shawarma", "nasigoreng", "kabuli", "kabsa"]);
const keepsFor = (r, span) => POOL.main(r) && !NO_BATCH.has(r.id) && !(FISHY.has(r.id) && span > 2) && !(NO_FREEZE.has(r.id) && span > 3);

const DAY_NAMES = () => (BNL ? ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র", "শনি"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
const addDays = (iso, n) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const dowOf = (iso) => new Date(iso + "T12:00:00").getDay();

function buildWeek() {
  const c = dietCalc(); if (!c.target) return null;
  const cfg = prepCfg();
  const back = (dowOf(today()) - cfg.cookDay + 7) % 7, start = addDays(today(), -back);
  const rand = seededRand(start + "|week|" + (store.get("week-seed-" + start) || "0") + "|" + c.target + "|" + c.meals + "|" + cfg.cook);
  const slots = SLOT_SETS[c.meals], wsum = slots.reduce((a, s) => a + SLOT_W[s], 0), times = mealTimes(slots.length);
  const mainIdx = slots.map((s, i) => (s === "main" ? i : -1)).filter((i) => i >= 0);
  const offs = Array.from({ length: cfg.cook }, (_, k) => Math.round((k * 7) / cfg.cook));
  const used = new Set(), sessions = [], days = Array.from({ length: 7 }, (_, i) => ({ date: addDays(start, i), meals: [] }));
  offs.forEach((off, k) => {
    const span = (k + 1 < offs.length ? offs[k + 1] : 7) - off;
    const mainBudget = (c.target * SLOT_W.main) / wsum;
    const nDishes = Math.min(span * mainIdx.length, span >= 4 && mainIdx.length >= 2 ? 3 : mainIdx.length >= 2 || span >= 3 ? 2 : 1);
    let pool = RECIPES.filter((r) => keepsFor(r, span) && !used.has(r.id));
    let fits = pool.filter((r) => r.kcal <= mainBudget && r.kcal >= mainBudget * 0.45);
    if (fits.length < nDishes) fits = pool.filter((r) => r.kcal <= mainBudget);
    if (fits.length < nDishes) fits = pool;
    const dishes = [];
    while (dishes.length < nDishes && fits.length) { const r = fits.splice(Math.floor(rand() * fits.length), 1)[0]; dishes.push(r); used.add(r.id); }
    const portions = new Map(dishes.map((r) => [r.id, 0]));
    let riceCups = 0, rotis = 0, n = 0;
    for (let di = 0; di < span; di++) {
      const day = days[off + di];
      slots.forEach((slot, si) => {
        let meal;
        if (slot === "main") {
          const r = dishes[n++ % dishes.length];
          const sz = sizeMeal("main", r, (c.target * SLOT_W.main) / wsum, c.meals);
          portions.set(r.id, portions.get(r.id) + sz.serv * cfg.people);
          riceCups += (sz.adds.filter((a) => a === "rice").length + sz.adds.filter((a) => a === "halfrice").length * 0.5) * cfg.people;
          rotis += sz.adds.filter((a) => a === "roti").length * cfg.people;
          meal = { slot, r, ...sz, cookToday: di === 0, freezer: di >= 3 && !NO_FREEZE.has(r.id) };
        } else meal = { slot, r: null, ...sidesOnly(slot, (c.target * SLOT_W[slot]) / wsum) };
        day.meals.push({ ...meal, time: times[si] });
      });
    }
    sessions.push({ date: addDays(start, off), span, dishes: dishes.map((r) => ({ r, portions: Math.round(portions.get(r.id) * 2) / 2 })), riceCups: Math.round(riceCups * 2) / 2, rotis });
  });
  days.forEach((d) => { d.total = d.meals.reduce((a, m) => a + m.kcal, 0); d.protein = d.meals.reduce((a, m) => a + m.p, 0); });
  return { start, sessions, days, target: c.target, cfg };
}

const sideText = (adds) => [...new Set(adds)].map((k) => { const n = adds.filter((x) => x === k).length; return (n > 1 ? N(n) + " × " : "") + esc(tr(ADDONS[k][2], ADDONS[k][3])); }).join(", ");
const dayLabel = (iso) => { const d = new Date(iso + "T12:00:00"); return `${DAY_NAMES()[d.getDay()]} ${N(d.getDate())}/${N(d.getMonth() + 1)}`; };
function mealRow(m) {
  const tag = m.r ? (m.cookToday ? `<span class="tagc cook">${tr("cook today", "আজ রান্না")}</span>` : m.freezer ? `<span class="tagc ice">❄ ${tr("from freezer", "ফ্রিজার থেকে")}</span>` : `<span class="tagc fr">${tr("from fridge", "ফ্রিজ থেকে")}</span>`) : `<span class="tagc nc">${tr("no cooking", "রান্না ছাড়া")}</span>`;
  return `<li class="pm"><span class="pm-time num">${clockOf(m.time)}</span>
    <span class="pm-body">${m.r ? `<button class="link-plain" data-r="${m.r.id}"><b>${esc(m.r.name)}</b></button>` : `<b>${sideText(m.adds)}</b>`}
      ${m.r && m.serv > 1 ? `<small class="num">${m.serv === 2 ? tr("2 servings", "২ জনের পরিমাণ") : tr("1½ servings", "দেড় জনের পরিমাণ")}</small>` : ""}
      ${m.r && m.adds.length ? `<small>+ ${sideText(m.adds)}</small>` : ""}${tag}</span>
    <span class="pm-k num">${fmtBig(m.kcal)}</span></li>`;
}
/* Today card when cooking less often: today's meals from the week plan */
function prepTodayHTML() {
  const w = buildWeek(); if (!w) return "";
  const d = w.days.find((x) => x.date === today()), s = w.sessions.find((x) => x.date === today());
  return `<div class="card plan-card">
    <div class="section-h"><h2 style="font-size:1.15rem">${tr("Your plan today", "আজ আপনার খাবারের প্ল্যান")}</h2><button class="link" data-sub="prep" style="min-height:0">${tr("Week plan", "সপ্তাহের প্ল্যান")} →</button></div>
    ${s ? `<p class="note small"><b>${tr("Cooking day", "আজ রান্নার দিন")}</b>${tr(`Cook ${s.dishes.map((x) => `${x.r.name} (${fmtBig(x.portions)} portions)`).join(" and ")}${s.riceCups ? ` and about ${fmtBig(s.riceCups)} cups of rice` : ""}. It covers ${s.span} day${s.span > 1 ? "s" : ""}.`, `${s.dishes.map((x) => `${x.r.name} (${N(x.portions)} জনের)`).join(" আর ")}${s.riceCups ? ` আর প্রায় ${N(s.riceCups)} কাপ ভাত` : ""} রাঁধুন। এতে ${N(s.span)} দিন চলবে।`)}</p>` : ""}
    <ol class="pm-list">${d.meals.map(mealRow).join("")}</ol>
    <p class="small muted num">${tr(`Total ${fmtBig(d.total)} of ${fmtBig(w.target)} kcal · about ${d.protein} g protein`, `মোট ${fmtBig(d.total)} / ${fmtBig(w.target)} ক্যালরি · প্রোটিন প্রায় ${N(d.protein)} গ্রাম`)}</p>
  </div>`;
}
/* shopping list for one cooking day: every dish's ingredients scaled to the portions */
function sessionShopping(s) {
  const lines = [];
  // things you buy whole (onions, eggs, cans) are rounded up
  const whole = (u) => !u || /^(can|cans|টি|piece|pieces|টুকরো|clove|cloves|কোয়া)$/i.test(u);
  s.dishes.forEach(({ r, portions }) => { const f = portions / r.base; r.ing.forEach(([q, u, t], i) => lines.push((q != null && whole(u) ? qtyUnit(Math.ceil(q * f), u) + " " + one(Math.ceil(q * f), u, t) : ingLine(r, i, f)) + " · " + r.name)); });
  if (s.rotis) lines.push(tr(`Atta for ${s.rotis} rotis (about ${Math.ceil(s.rotis * 30 / 50) * 50} g)`, `${N(s.rotis)}টি রুটির আটা (প্রায় ${N(Math.ceil(s.rotis * 30 / 50) * 50)} গ্রাম)`));
  if (s.riceCups) lines.push(tr(`Rice, about ${Math.ceil(s.riceCups / 3 * 10) / 10} cups uncooked (${s.riceCups} cups cooked)`, `চাল, প্রায় ${N(Math.ceil(s.riceCups / 3 * 10) / 10)} কাপ (রান্না করলে ${N(s.riceCups)} কাপ ভাত)`));
  return lines;
}
async function addSessionToShop(s) {
  const items = sessionShopping(s);
  if (!inFamily()) {
    window.open("https://wa.me/?text=" + encodeURIComponent(tr(`Shopping for ${dayLabel(s.date)}:`, `${dayLabel(s.date)}-এর বাজার:`) + "\n" + items.map((x) => "• " + x).join("\n")), "_blank");
    return;
  }
  const { error } = await sb.from("shopping_items").insert(items.map((t) => ({ family_id: S.family.id, text: t.slice(0, 200), added_by: S.user.id })));
  if (error) return toast(tr("Couldn't add, try again", "যোগ হয়নি, আবার চেষ্টা করুন"));
  await loadShop(); refreshAll(); toast(tr(`${items.length} items added to Shopping`, `বাজারের তালিকায় ${N(items.length)}টি জিনিস যোগ হয়েছে`));
}

/* the week page */
function renderPrep(pb) {
  const cfg = prepCfg(), c = dietCalc();
  const chip = (k, v, label, cur) => `<button type="button" class="chip" data-pk="${k}" data-pv="${v}" aria-pressed="${cur === v}">${label}</button>`;
  const freqLabel = (n) => (n === 7 ? tr("Every day", "প্রতিদিন") : tr(n === 1 ? "Once a week" : `${n} times a week`, n === 1 ? "সপ্তাহে ১ বার" : `সপ্তাহে ${N(n)} বার`));
  let body = "";
  if (!c.target) body = `<div class="card"><p>${tr("First set your calorie target in My diet.", "আগে “আমার ডায়েট”-এ ক্যালরির লক্ষ্য ঠিক করুন।")}</p><button class="btn primary" data-sub="diet">${tr("Open My diet", "আমার ডায়েট খুলুন")}</button></div>`;
  else if (cfg.cook === 7) body = `<div class="card"><p class="muted">${tr("You cook every day, so the plan changes daily. Choose how often you want to cook above to get a batch-cooking week.", "আপনি প্রতিদিন রাঁধেন, তাই প্ল্যান রোজ বদলায়। একবারে রেঁধে কয়েক দিন খেতে চাইলে উপরে কতবার রাঁধবেন তা বাছুন।")}</p></div>`;
  else {
    const w = buildWeek();
    body = `${w.sessions.map((s, k) => `<div class="card session">
        <div class="section-h"><h2 style="font-size:1.15rem">🍳 ${dayLabel(s.date)}${s.date === today() ? ` · ${tr("today", "আজ")}` : ""}</h2><span class="small muted num">${tr(`for ${s.span} day${s.span > 1 ? "s" : ""}`, `${N(s.span)} দিনের জন্য`)}</span></div>
        <ul class="cooklist">${s.dishes.map(({ r, portions }) => `<li><span class="tile ${TINT(r)}">${PIC(r.id)}</span><button class="link-plain" data-r="${r.id}" data-serv="${portions}"><b>${esc(r.name)}</b><small class="num">${tr(`${fmtBig(portions)} portions · ${r.kcal} kcal each`, `${N(portions)} জনের পরিমাণ · প্রতি জনে ${N(r.kcal)} ক্যালরি`)}${FISHY.has(r.id) ? tr(" · eat within 2 days", " · ২ দিনের মধ্যে খাবেন") : NO_FREEZE.has(r.id) ? tr(" · fridge only, 3 days", " · শুধু ফ্রিজে, ৩ দিন") : ""}</small></button></li>`).join("")}
          ${s.rotis ? `<li><span class="tile">🫓</span><span><b>${tr("Roti", "রুটি")}</b><small class="num">${tr(`${s.rotis} atta rotis in total; make fresh, or freeze cooked rotis and warm on a tawa`, `মোট ${N(s.rotis)}টি আটার রুটি; টাটকা বানান, অথবা বানিয়ে ফ্রিজারে রেখে তাওয়ায় গরম করুন`)}</small></span></li>` : ""}
          ${s.riceCups ? `<li><span class="tile">🍚</span><span><b>${tr("Rice", "ভাত")}</b><small class="num">${tr(`about ${fmtBig(s.riceCups)} cups cooked, or cook fresh rice each day (15 min)`, `প্রায় ${N(s.riceCups)} কাপ, অথবা রোজ টাটকা ভাত রাঁধুন (১৫ মিনিট)`)}</small></span></li>` : ""}</ul>
        <div class="row2"><button class="btn soft" data-shop="${k}">${inFamily() ? tr("Add to shopping", "বাজারে যোগ করুন") : tr("Shopping on WhatsApp", "WhatsApp-এ বাজার")}</button><button class="btn ghost" data-r="${s.dishes[0].r.id}" data-serv="${s.dishes[0].portions}">${tr("Start cooking", "রান্না শুরু")}</button></div>
      </div>`).join("")}
      <div class="card"><div class="section-h"><h2 style="font-size:1.15rem">${tr("Your week", "আপনার সপ্তাহ")}</h2><button class="link" id="week-shuffle" style="min-height:0">↻ ${tr("Shuffle", "বদলে দিন")}</button></div>
        ${w.days.map((d) => `<details class="wday"${d.date === today() ? " open" : ""}><summary><b>${dayLabel(d.date)}${d.date === today() ? ` · ${tr("today", "আজ")}` : ""}</b><span class="small muted num">${fmtBig(d.total)} ${tr("kcal", "ক্যালরি")}</span></summary><ol class="pm-list">${d.meals.map(mealRow).join("")}</ol></details>`).join("")}
      </div>
      <div class="card"><h2 style="font-size:1.15rem">${tr("Keeping it safe", "নিরাপদে রাখার নিয়ম")}</h2>
        <div class="note"><b>${tr("Cool fast, then fridge", "দ্রুত ঠান্ডা করে ফ্রিজে")}</b>${tr("Spread cooked food in shallow boxes and put it in the fridge within 2 hours of cooking.", "রান্নার পর অগভীর বাক্সে ভাগ করে ২ ঘণ্টার মধ্যে ফ্রিজে রাখুন।")}</div>
        <div class="note"><b>${tr("Fridge 3 days, freezer after that", "ফ্রিজে ৩ দিন, তারপর ফ্রিজারে")}</b>${tr("Meals marked ❄ go into the freezer on cooking day. Move them to the fridge the night before.", "❄ চিহ্নের খাবার রান্নার দিনই ফ্রিজারে রাখুন। খাওয়ার আগের রাতে ফ্রিজে নামিয়ে রাখুন।")}</div>
        <div class="note"><b>${tr("Reheat until steaming hot", "ভাপ ওঠা পর্যন্ত গরম করুন")}</b>${tr("Reheat only the portion you will eat, and only once. Rice: cool quickly and eat within 1 day, or cook fresh.", "যতটুকু খাবেন শুধু ততটুকু, একবারই গরম করুন। ভাত দ্রুত ঠান্ডা করে ১ দিনের মধ্যে খান, নয়তো টাটকা রাঁধুন।")}</div>
        <div class="note"><b>${tr("Fish and prawns", "মাছ ও চিংড়ি")}</b>${tr("Only planned for the first 2 days after cooking.", "রান্নার পর প্রথম ২ দিনের মধ্যেই প্ল্যানে রাখা হয়।")}</div>
      </div>`;
  }
  pb.innerHTML = `<div class="r-title"><p class="eyebrow">${tr("Cook once, eat for days", "একবার রেঁধে কয়েক দিন")}</p><h1>${tr("Week plan", "সপ্তাহের প্ল্যান")}</h1>
      <p class="muted">${tr("Pick how often you can cook. We plan dishes that keep well, enough for everyone until the next cooking day.", "কতবার রাঁধতে পারবেন বাছুন। এমন খাবার বাছা হবে যা ভালো থাকে, আর পরের রান্নার দিন পর্যন্ত সবার জন্য যথেষ্ট।")}</p></div>
    <div class="card dform">
      <div class="drow col"><span class="dl">${tr("How often can you cook?", "কতবার রাঁধতে পারবেন?")}</span><div class="wrapchips">${[1, 2, 3, 4, 7].map((n) => chip("cook", n, freqLabel(n), cfg.cook)).join("")}</div></div>
      <div class="drow col"><span class="dl">${tr("Main cooking day", "প্রধান রান্নার দিন")}</span><div class="wrapchips">${DAY_NAMES().map((nm, i) => chip("cookDay", i, nm, cfg.cookDay)).join("")}</div></div>
      <div class="drow col"><span class="dl">${tr("People eating", "কতজন খাবেন")}</span><div class="wrapchips">${[1, 2, 3, 4, 5, 6].map((n) => chip("people", n, N(n), cfg.people)).join("")}</div></div>
    </div>
    ${body}`;
  pb.querySelectorAll("[data-pk]").forEach((b) => (b.onclick = () => { saveDiet({ ...diet(), [b.dataset.pk]: +b.dataset.pv }); renderPrep(pb); renderHome(); }));
  const ws = $("week-shuffle");
  if (ws) ws.onclick = () => { const w = buildWeek(), k = "week-seed-" + w.start; store.set(k, String((+store.get(k) || 0) + 1)); renderPrep(pb); renderHome(); };
  pb.querySelectorAll("[data-shop]").forEach((b) => (b.onclick = () => addSessionToShop(buildWeek().sessions[+b.dataset.shop])));
  pb.querySelectorAll("[data-serv]").forEach((b) => (b.onclick = (e) => { e.stopPropagation(); openRecipe(b.dataset.r, +b.dataset.serv); }));
  bindCommon(pb);
  pb.querySelectorAll("[data-serv]").forEach((b) => (b.onclick = (e) => { e.stopPropagation(); openRecipe(b.dataset.r, +b.dataset.serv); }));
}
