
const TITLES = { plan: "আজকের থালা", recipes: "রেসিপি", spin: "চাকা ঘোরান", sides: "সস ও সালাদ", tips: "টিপস", bazar: "বাজার ও বার্তা", family: "পরিবার" };
const BADGE = { "বাংলাদেশি": ["", ""], "পাকিস্তানি": ["", "pk"], "আফগান": ["", "af"], "ইংলিশ": ["", ""], "ইতালিয়ান": ["", "af"], "স্প্যানিশ": ["", "pk"], "মেক্সিকান": ["", "af"], "তুর্কি": ["", "af"], "লেবানিজ": ["", ""], "আরব": ["", "pk"], "মরোক্কান": ["", "af"], "ইরানি": ["", "pk"], "মালয়েশিয়ান": ["", ""] };
let curDay = DAYS.find((d) => d.js === new Date().getDay()) || DAYS[0];
const todayKey = curDay.k;
let curTab = "plan";
const TOOL_IC = {
  air: '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="4"/><circle cx="12" cy="10" r="3.5"/><path d="M8 17h8"/></svg>',
  oven: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><rect x="6" y="9" width="12" height="8" rx="1"/><path d="M7 6.5h.01M10 6.5h.01"/></svg>',
  micro: '<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><rect x="5" y="8" width="10" height="8" rx="1"/><path d="M18 9v.01M18 12v.01M18 15v.01"/></svg>',
  stove: '<svg viewBox="0 0 24 24"><path d="M4 14h16v6H4z"/><path d="M8 14c0-3 2-3 2-6M12 14c0-3 2-3 2-6M16 14c0-2 1-3 1-4"/></svg>',
  none: '<svg viewBox="0 0 24 24"><path d="M6 3v8M9 3v8M6 7h3M7.5 11v10M16 3c-2 2-2 6 0 8v10"/></svg>'
};
let curTool = "all", curType = "সব", query = "";
let cur = null, servings = 2, part = "ing", pushed = false;

/* tabs */
function showTab(t) {
  curTab = t;
  document.querySelectorAll(".tab").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === t));
  ["plan", "recipes", "spin", "sides", "tips", "bazar", "family"].forEach((k) => { document.getElementById("s-" + k).hidden = k !== t; });
  document.getElementById("title").textContent = t === "plan" && curDay.k !== todayKey ? curDay.n + "বারের থালা" : TITLES[t];
  store.set("tab", t);
  window.scrollTo(0, 0);
}
document.querySelectorAll(".tab").forEach((b) => (b.onclick = () => showTab(b.dataset.tab)));
document.querySelectorAll("[data-goto]").forEach((b) => (b.onclick = () => showTab(b.dataset.goto)));

/* plan */
function renderDays() {
  const box = document.getElementById("days");
  box.innerHTML = "";
  DAYS.forEach((d) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.setAttribute("aria-pressed", d === curDay);
    b.innerHTML = d.n + (d.k === todayKey ? '<span class="dot" aria-label="আজ"></span>' : "");
    b.onclick = () => { curDay = d; renderDays(); renderPlan(); showTab("plan"); };
    box.appendChild(b);
    if (d === curDay) requestAnimationFrame(() => b.scrollIntoView({ inline: "center", block: "nearest" }));
  });
}
const pillify = (t) => t.replace(/\{(\w+)\}/g, (_, id) => `<button class="pill" data-r="${id}">${R[id].name}</button>`);
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>';

function renderPlan() {
  const box = document.getElementById("meals");
  box.innerHTML = curDay.meals.map(([slot, text, kc, p], i) => {
    const id = `meal-${curDay.k}-${i}`;
    const done = store.get(id) === "1";
    return `<div class="meal${done ? " done" : ""}" data-id="${id}">
      <button class="tick" aria-pressed="${done}" aria-label="${slot} খাওয়া হয়েছে">${CHECK}</button>
      <div>${(text.match(/\{(\w+)\}/) ? `<span class="thumb meal-art ${(BADGE[R[text.match(/\{(\w+)\}/)[1]].origin] || ["", ""])[1]}">${ART(text.match(/\{(\w+)\}/)[1])}</span>` : "")}<div class="slot"><span>${slot}</span><span class="kc num">${bn(kc)} ক্যালরি</span></div>
      <div class="what">${pillify(text)}</div><div class="pro num">প্রোটিন ${bn(p)} গ্রাম</div></div></div>`;
  }).join("");
  box.querySelectorAll(".tick").forEach((t) => (t.onclick = () => {
    const m = t.closest(".meal");
    const on = !m.classList.contains("done");
    m.classList.toggle("done", on);
    t.setAttribute("aria-pressed", on);
    store.set(m.dataset.id, on ? "1" : "0");
    updateSummary();
  }));
  box.querySelectorAll(".pill").forEach((b) => (b.onclick = () => openRecipe(b.dataset.r)));
  updateSummary();
}
function updateSummary() {
  let tk = 0, tp = 0, ek = 0;
  curDay.meals.forEach(([, , kc, p], i) => { tk += kc; tp += p; if (store.get(`meal-${curDay.k}-${i}`) === "1") ek += kc; });
  document.getElementById("ring").style.setProperty("--pct", tk ? Math.round((ek / tk) * 100) : 0);
  document.getElementById("ring-n").textContent = bn(ek);
  document.getElementById("sum-k").textContent = `${bn(tk)} ক্যালরি`;
  document.getElementById("sum-p").textContent = `প্রোটিন ${bn(tp)} গ্রাম · ${bn(curDay.meals.length)} বেলা`;
}

/* lists */
const toolNames = (r) => TOOLS.filter(([k]) => k !== "stove" && k !== "none" && HOW[r.id] && HOW[r.id][k]).map(([, l]) => l).join(", ");
function rowHTML(r) {
  const [ch, cls] = BADGE[r.origin] || ["বা", ""];
  return `<button class="row" data-r="${r.id}"><span class="thumb ${cls}">${ART(r.id)}</span>
    <span style="min-width:0"><span class="nm">${FAV_IDS().has(r.id) ? '<span class="heart">❤</span> ' : ""}${r.name}</span><br><span class="mt">${r.origin} · ${r.time}${toolNames(r) ? " · " + toolNames(r) : ""}</span></span>
    <span class="kc num">${bn(r.kcal)}<small>ক্যালরি</small></span></button>`;
}
function bindRows(el) { el.querySelectorAll(".row").forEach((b) => (b.onclick = () => openRecipe(b.dataset.r))); }
function renderRecipes() {
  const f = document.getElementById("filters");
  f.innerHTML = "";
  REGIONS.forEach((o) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.textContent = o;
    b.setAttribute("aria-pressed", o === curOrigin);
    b.onclick = () => { curOrigin = o; renderRecipes(); };
    f.appendChild(b);
  });
  const ty = document.getElementById("types");
  ty.innerHTML = "";
  TYPES.forEach((o) => {
    const x = document.createElement("button");
    x.className = "chip";
    x.textContent = o;
    x.setAttribute("aria-pressed", o === curType);
    x.onclick = () => { curType = o; renderRecipes(); };
    ty.appendChild(x);
  });
  const tb = document.getElementById("tools");
  tb.innerHTML = "";
  [["all", "সব যন্ত্র"], ["air", "এয়ার ফ্রায়ার"], ["oven", "ওভেন"], ["micro", "মাইক্রোওয়েভ"], ["stove", "শুধু চুলা"]].forEach(([k, l]) => {
    const b = document.createElement("button");
    b.className = "chip tool-chip";
    b.innerHTML = (TOOL_IC[k] || "") + l;
    b.setAttribute("aria-pressed", k === curTool);
    b.onclick = () => { curTool = k; renderRecipes(); };
    tb.appendChild(b);
  });
  const list = document.getElementById("recipe-list");
  const okTool = (r) => curTool === "all" || (HOW[r.id] && HOW[r.id][curTool]);
  const q = query.trim();
  const hit = (r) => !q || (r.name + " " + r.origin + " " + r.type + " " + r.ing.map((x) => x[2]).join(" ")).includes(q);
  const shown = RECIPES.filter((r) => (curType === "সব" || r.type === curType || (curType === "❤ পছন্দ" && FAV_IDS().has(r.id))) && okTool(r) && (curOrigin === "সব" || REGION(r) === curOrigin) && hit(r));
  document.getElementById("count").textContent = `${bn(shown.length)}টা রেসিপি`;
  list.innerHTML = shown.length ? shown.map(rowHTML).join("") : '<p class="muted" style="padding:16px">এই বাছাইয়ে কোনো রেসিপি নেই।</p>';
  bindRows(list);
  const mains = RECIPES.filter((r) => r.type === TYPE_MAIN || r.type === TYPE_SOUP).length;
  document.getElementById("count-line").textContent = `${bn(mains)}টা রেসিপি থেকে চাকা একটা বেছে দেবে।`;
}
function renderSides() {
  const list = document.getElementById("side-list");
  list.innerHTML = RECIPES.filter((r) => r.side).map(rowHTML).join("");
  bindRows(list);
}
document.getElementById("swaps").innerHTML = SWAPS.map(([a, b, c]) =>
  `<div class="swap"><span class="old">${a}</span><span class="new">${b}</span><span class="save num">সাশ্রয়: ${c}</span></div>`).join("");

/* recipe sheet */
const sheet = document.getElementById("sheet");
function openRecipe(id) {
  cur = R[id]; servings = cur.base; part = "ing";
  renderSheet();
  sheet.scrollTop = 0;
  sheet.classList.add("open");
  document.body.classList.add("lock");
  sheet.setAttribute("aria-hidden", "false");
  try { history.pushState({ sheet: 1 }, ""); pushed = true; } catch (e) { pushed = false; }
}
function closeSheet(fromPop) {
  if (!sheet.classList.contains("open")) return;
  sheet.classList.remove("open");
  document.body.classList.remove("lock");
  sheet.setAttribute("aria-hidden", "true");
  if (!fromPop && pushed) { pushed = false; try { history.back(); } catch (e) {} }
  if (fromPop) pushed = false;
}
document.getElementById("back").onclick = () => closeSheet(false);
window.addEventListener("popstate", () => closeSheet(true));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(false); });

function renderSheet() {
  const r = cur, max = Math.max(r.reg, r.kcal), f = servings / r.base;
  document.getElementById("sheet-t").textContent = r.name;
  const ing = r.ing.map(([q, u, t], i) =>
    `<li data-i="${i}"><span class="box" aria-hidden="true"></span><span class="tx">${q == null ? "" : `<span class="q num">${fmtQty(q * f)} ${u}</span>`}${t}</span></li>`).join("");
  const steps = r.steps.map((s, i) => `<li><span>${s}</span></li>`).join("");
  document.getElementById("sheet-body").innerHTML = `
    <div class="hero-art ${(BADGE[r.origin] || ["", ""])[1]}">${ART(r.id)}</div>
    <button class="video-btn" id="play-video"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>ধাপে ধাপে ভিডিও দেখুন</button>
    <div class="hero"><h2>${r.name}</h2>
      <div class="facts num"><span class="fact">${bn(r.kcal)} ক্যালরি</span><span class="fact">প্রোটিন ${bn(r.p)} গ্রা</span>
      <span class="fact">${r.time}</span><span class="fact">${r.origin} · ${r.level}</span></div></div>
    <div class="card cmp num">
      <div class="r reg"><span>সাধারণ</span><span class="tr"><i style="width:${(r.reg / max) * 100}%"></i></span><span>${bn(r.reg)}</span></div>
      <div class="r hl"><span>হালকা</span><span class="tr"><i style="width:${(r.kcal / max) * 100}%"></i></span><span>${bn(r.kcal)}</span></div>
      ${r.reg > r.kcal ? `<span class="muted" style="font-size:.9rem">প্রতি জনে প্রায় ${bn(r.reg - r.kcal)} ক্যালরি কম</span>` : ""}
    </div>
    <div class="seg" role="tablist">
      <button role="tab" data-p="ing" aria-selected="${part === "ing"}">উপকরণ</button>
      <button role="tab" data-p="steps" aria-selected="${part === "steps"}">রান্না</button>
    </div>
    <div class="card" ${part === "ing" ? "" : "hidden"}>
      <div class="serv"><span class="num" style="font-weight:600">${bn(servings)} জনের জন্য</span>
        <span class="step-btns"><button id="minus" aria-label="একজন কমান">−</button><button id="plus" aria-label="একজন বাড়ান">+</button></span></div>
      <ul class="ing">${ing}</ul>
      <p class="muted" style="font-size:.85rem">বাজার করার সময় চাপ দিয়ে টিক দিন।</p>
    </div>
    <div class="card" ${part === "steps" ? "" : "hidden"}>${AO[r.id] ? `<p class="bd">আপনার এয়ার ফ্রায়ার বা ওভেনের ঠিক তাপমাত্রা আর সময় উপরের "কোন যন্ত্রে কীভাবে" কার্ডে দেখুন।</p>` : ""}<ol class="steps">${steps}</ol></div>
    <div class="card"><div class="how-head"><h3 style="font-weight:700;font-size:1rem">কোন যন্ত্রে কীভাবে</h3><button class="link" data-goto2="kitchen">আমার যন্ত্র বদলান</button></div>
      <div class="how">${TOOLS.filter(([k]) => HOW[r.id] && HOW[r.id][k]).map(([k, l]) => {
        const ao = AO[r.id] && AO[r.id][k];
        const label = k === "oven" ? (OVEN_TYPES.find((o) => o[0] === (store.get("ovenType") || "otg")) || OVEN_TYPES[0])[1] : k === "air" ? "এয়ার ফ্রায়ার, " + (AIR_TYPES.find((o) => o[0] === (store.get("airSize") || "small")) || AIR_TYPES[0])[1] : l;
        const txt = ao ? (k === "oven" ? ovenText(ao) : airText(ao)) : HOW[r.id][k];
        return `<div class="${k === curTool ? "on" : ""}"><span class="ic">${TOOL_IC[k]}</span><span><b>${label}</b>${txt}</span></div>`;
      }).join("")}</div>
      ${kindOf(r.id) && AO[r.id] ? `<p class="bd"><b>হয়েছে কিনা বুঝবেন যেভাবে:</b> ${DONE[kindOf(r.id)]}</p><p class="bd"><b>বাংলাদেশের বাজারের জন্য:</b> ${BDCUT[kindOf(r.id)]}</p>` : ""}
    </div>
    <p class="tip"><b>টিপ:</b> ${r.tip}</p>`;
  const body = document.getElementById("sheet-body");
  body.querySelectorAll(".steps li").forEach((li, i) => { li.style.setProperty("--n", `"${bn(i + 1)}"`); });
  document.getElementById("play-video").onclick = () => PL.open(r.id);
  body.querySelectorAll("[data-goto2]").forEach((x) => (x.onclick = () => { closeSheet(false); showTab("tips"); setTimeout(() => document.getElementById("kitchen").scrollIntoView({ behavior: "smooth" }), 50); }));
  body.querySelectorAll(".seg button").forEach((b) => (b.onclick = () => { part = b.dataset.p; renderSheet(); }));
  body.querySelectorAll(".ing li").forEach((li) => (li.onclick = () => li.classList.toggle("got")));
  const m = document.getElementById("minus"), p = document.getElementById("plus");
  if (m) m.onclick = () => { if (servings > 1) { servings--; renderSheet(); } };
  if (p) p.onclick = () => { if (servings < 12) { servings++; renderSheet(); } };
}

/* spin wheel */
const MEAL = (r) => r.type === TYPE_MAIN || r.type === TYPE_SOUP;
const KINDS = [["যেকোনো", MEAL], ["পেট ভরা", (r) => MEAL(r) && r.kcal > 260], ["হালকা কিছু", (r) => (MEAL(r) || r.type === TYPE_SNACK || r.type === TYPE_SALAD) && r.kcal <= 260], ["মিষ্টি কিছু", (r) => r.type === TYPE_SWEET]];
let spinKind = "যেকোনো", spinOrigin = "সব", slots = [], rot = 0, spinning = false;
const shortName = (n) => {
  let s = n.replace(/^হালকা\s+/, "").replace(/\s*\(.*?\)\s*/g, "").trim();
  return s.length > 15 ? s.slice(0, 14) + "…" : s;
};
function pool() {
  const k = KINDS.find((x) => x[0] === spinKind)[1];
  return RECIPES.filter((r) => k(r) && (spinOrigin === "সব" || REGION(r) === spinOrigin));
}
function chipRow(id, opts, curv, set) {
  const box = document.getElementById(id);
  box.innerHTML = "";
  opts.forEach((o) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.textContent = o;
    b.setAttribute("aria-pressed", o === curv);
    b.onclick = () => { if (!spinning) set(o); };
    box.appendChild(b);
  });
}
function renderSpinControls() {
  chipRow("spin-kind", KINDS.map((k) => k[0]), spinKind, (o) => { spinKind = o; renderSpinControls(); buildWheel(); });
  chipRow("spin-origin", REGIONS, spinOrigin, (o) => { spinOrigin = o; renderSpinControls(); buildWheel(); });
}
function buildWheel() {
  const p = pool().slice();
  for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  slots = p.slice(0, 8);
  const w = document.getElementById("wheel");
  const n = slots.length, r = 150;
  document.getElementById("hub").textContent = bn(pool().length) + "টা";
  document.getElementById("result").hidden = true;
  document.getElementById("spin-btn").disabled = n === 0;
  if (n === 0) { w.innerHTML = `<circle r="150" class="s3"/><text class="t3" text-anchor="middle" y="-80">এই বাছাইয়ে কোনো রেসিপি নেই</text>`; return; }
  w.classList.add("instant");
  rot = 0;
  w.style.transform = "rotate(0deg)";
  void w.getBoundingClientRect();
  w.classList.remove("instant");
  const half = 180 / n, pt = (deg) => [r * Math.sin((deg * Math.PI) / 180), -r * Math.cos((deg * Math.PI) / 180)];
  let svg = "";
  slots.forEach((s, i) => {
    const c = i * (360 / n), cls = n === 1 ? 0 : (i % 4 === 3 && i === n - 1 ? 1 : i % 4);
    if (n === 1) svg += `<circle r="${r}" class="s0"/>`;
    else {
      const [x1, y1] = pt(c - half), [x2, y2] = pt(c + half);
      svg += `<path class="s${cls}" d="M0 0L${x1.toFixed(2)} ${y1.toFixed(2)}A${r} ${r} 0 ${n <= 2 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}Z"/>`;
    }
    const left = c > 180;
    svg += `<text class="t${n === 1 ? 0 : cls}" transform="rotate(${left ? c + 90 : c - 90})" x="${left ? -(r - 14) : r - 14}" y="5" text-anchor="${left ? "start" : "end"}">${shortName(s.name)}</text>`;
  });
  if (n > 1) slots.forEach((s, i) => { const [x, y] = pt(i * (360 / n) - half); svg += `<line class="sep" x1="0" y1="0" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}"/>`; });
  svg += `<circle r="${r}" class="rim"/>`;
  w.innerHTML = svg;
}
function spin() {
  if (spinning || !slots.length) return;
  spinning = true;
  const btn = document.getElementById("spin-btn");
  btn.disabled = true;
  btn.textContent = "ঘুরছে…";
  document.getElementById("result").hidden = true;
  const n = slots.length, k = Math.floor(Math.random() * n), seg = 360 / n;
  const jitter = (Math.random() - 0.5) * seg * 0.6;
  const target = ((-(k * seg) - jitter) % 360 + 360) % 360;
  const curMod = ((rot % 360) + 360) % 360;
  rot += 360 * 6 + ((target - curMod + 360) % 360);
  const w = document.getElementById("wheel");
  const done = () => { w.removeEventListener("transitionend", done); clearTimeout(timer); showResult(slots[k]); };
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const timer = setTimeout(done, reduce ? 50 : 4500);
  w.addEventListener("transitionend", done);
  w.style.transform = `rotate(${rot}deg)`;
}
function showResult(r) {
  spinning = false;
  const btn = document.getElementById("spin-btn");
  btn.disabled = false;
  btn.textContent = "আবার ঘোরান";
  const box = document.getElementById("result");
  box.innerHTML = `<div class="res-top"><span class="thumb ${(BADGE[r.origin] || ["", ""])[1]}">${ART(r.id)}</span><div><p class="muted">আজ রাঁধুন</p><h3>${r.name}</h3></div></div>
    <div class="facts num" style="margin:0"><span class="fact">${bn(r.kcal)} ক্যালরি</span><span class="fact">প্রোটিন ${bn(r.p)} গ্রা</span><span class="fact">${r.time}</span></div>
    <div class="acts"><button id="res-open">রেসিপি দেখুন</button><button id="res-again">অন্য কিছু</button></div>
    <button class="video-btn" id="res-video"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>ভিডিও দেখুন</button>`;
  box.hidden = false;
  document.getElementById("res-open").onclick = () => openRecipe(r.id);
  document.getElementById("res-video").onclick = () => PL.open(r.id);
  document.getElementById("res-again").onclick = () => { buildWheel(); spin(); };
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
document.getElementById("spin-btn").onclick = spin;
renderSpinControls();
buildWheel();

function renderKitchen() {
  const mk = (id, opts, key, def) => {
    const box = document.getElementById(id);
    box.innerHTML = "";
    opts.forEach(([k, l]) => {
      const x = document.createElement("button");
      x.className = "opt";
      x.textContent = l;
      x.setAttribute("aria-pressed", (store.get(key) || def) === k);
      x.onclick = () => { store.set(key, k); renderKitchen(); };
      box.appendChild(x);
    });
  };
  mk("k-oven", OVEN_TYPES, "ovenType", "otg");
  mk("k-air", AIR_TYPES, "airSize", "small");
}
document.getElementById("q").addEventListener("input", (e) => { query = e.target.value; renderRecipes(); });
renderKitchen();
renderDays();
renderPlan();
renderRecipes();
renderSides();
const saved = store.get("tab");
showTab(TITLES[saved] ? saved : "plan");
