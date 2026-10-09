
/* ================= Deshi Diet Thala — app (English / বাংলা) ================= */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
};

/* ---------- language ---------- */
const LANG = (() => { const s = store.get("lang"); return s === "bn" || s === "en" ? s : /^bn/i.test(navigator.language || "") ? "bn" : "en"; })();
const BNL = LANG === "bn";
const tr = (en, bn) => (BNL ? bn : en);
const N = (v) => (BNL ? String(v).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[d]) : String(v));
document.documentElement.lang = LANG;
function setLang(l) { store.set("lang", l); location.reload(); }
const langPicker = () => `<span class="langsw" role="group" aria-label="Language">${[["en", "English"], ["bn", "বাংলা"]].map(([k, l]) => `<button type="button" data-lang="${k}" aria-pressed="${LANG === k}">${l}</button>`).join("")}</span>`;
const bindLang = (root) => {
  root.querySelectorAll("[data-lang]").forEach((b) => (b.onclick = () => { if (b.dataset.lang !== LANG) setLang(b.dataset.lang); }));
  root.querySelectorAll("[data-theme-v]").forEach((b) => (b.onclick = () => { setTheme(b.dataset.themeV); root.querySelectorAll("[data-theme-v]").forEach((x) => x.setAttribute("aria-pressed", x === b)); }));
};

/* ---------- theme: light, dark or follow the phone ---------- */
const themeNow = () => store.get("theme") || "auto";
function setTheme(t) {
  store.set("theme", t);
  if (t === "auto") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  const dark = t === "dark" || (t === "auto" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", dark ? "#0F1511" : "#1F5C3D"));
}
setTheme(themeNow());
const themePicker = () => `<span class="langsw" role="group" aria-label="Theme">${[["light", tr("Light", "দিন")], ["dark", tr("Dark", "রাত")], ["auto", tr("Auto", "অটো")]].map(([k, l]) => `<button type="button" data-theme-v="${k}" aria-pressed="${themeNow() === k}">${l}</button>`).join("")}</span>`;
function openSettings() {
  openSheet(`<h3>${tr("Language & theme", "ভাষা ও থিম")}</h3>
    <div class="setrow"><span><b>${tr("Language", "ভাষা")}</b></span>${langPicker()}</div>
    <div class="setrow"><span><b>${tr("Theme", "থিম")}</b><br><span class="small muted">${tr("Auto follows your phone", "অটো মানে ফোনের সেটিং অনুযায়ী")}</span></span>${themePicker()}</div>
    <button class="btn soft block" id="set-done">${tr("Done", "ঠিক আছে")}</button>`);
  bindLang($("bs-card")); $("set-done").onclick = closeSheet;
}

/* recipe text: data.js is English, data-bn.js holds the Bangla text for the same ids */
if (BNL && typeof BN !== "undefined") {
  RECIPES.forEach((r) => {
    const b = BN.R[r.id]; if (!b) return;
    r.en = { name: r.name, time: r.time, ing: r.ing.map((x) => x[2]).join(" ") };
    r.name = b.name; r.time = b.time; r.steps = b.steps; r.tip = b.tip;
    r.ing = r.ing.map(([q], i) => [q, b.ing[i][0], b.ing[i][1]]);
    Object.keys(r.how || {}).forEach((k) => { if (b.how[k]) r.how[k] = b.how[k]; });
    if (r.ao) Object.keys(r.ao).forEach((k) => { r.ao[k] = [r.ao[k][0], r.ao[k][1], r.ao[k][2], b.ao[k] || "", r.ao[k][3]]; });
  });
  DAYS.forEach((d, i) => { d.n = BN.DAYS[i].n; d.meals.forEach((m, j) => { m[0] = BN.DAYS[i].meals[j][0]; m[1] = BN.DAYS[i].meals[j][1]; }); });
  SWAPS.splice(0, SWAPS.length, ...BN.SWAPS);
}
const R = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
const tType = (t) => (BNL ? BN.TYPE[t] || t : t);
const tOrigin = (o) => (BNL ? BN.ORIGIN[o] || o : o);

const fmtQty = (q) => {
  if (q == null) return "";
  const r = Math.round(q * 100) / 100;
  const whole = Math.floor(r), frac = r - whole;
  const f = Math.abs(frac - 0.5) < 0.01 ? "½" : Math.abs(frac - 0.25) < 0.01 ? "¼" : Math.abs(frac - 0.75) < 0.01 ? "¾" : frac ? String(Math.round(frac * 10) / 10).slice(1) : "";
  return N((whole || !f ? whole : "") + f);
};
const one = (q, u, t) => (!BNL && q != null && q <= 1 && !u ? t.replace(/^([a-z]+?)(ies|oes|s)\b/i, (w, s0, e) => (/ss$/i.test(w) ? w : s0 + (e === "ies" ? "i" : e === "oes" ? "o" : ""))) : t);
const qtyUnit = (q, u) => fmtQty(q) + (!u ? "" : u === "টি" ? u : " " + u);
const ingLine = (r, i, f = 1) => { const [q, u, t] = r.ing[i]; return (q == null ? "" : qtyUnit(q * f, u) + " ") + one(q == null ? q : q * f, u, t); };
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const KCAL = tr("kcal", "ক্যালরি");
const ICON = {
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor" stroke="none"/></svg>',
  bell: '<svg viewBox="0 0 24 24"><path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
  share: '<svg viewBox="0 0 24 24"><path d="M12 15V3M8 7l4-4 4 4"/><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/></svg>',
  chev: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
  air: '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="4"/><circle cx="12" cy="10" r="3.5"/><path d="M8 17h8"/></svg>',
  oven: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><rect x="6" y="9" width="12" height="8" rx="1"/><path d="M7 6.5h.01M10 6.5h.01"/></svg>',
  micro: '<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><rect x="5" y="8" width="10" height="8" rx="1"/><path d="M18 9v.01M18 12v.01M18 15v.01"/></svg>',
  stove: '<svg viewBox="0 0 24 24"><path d="M4 14h16v6H4z"/><path d="M8 14c0-3 2-3 2-6M12 14c0-3 2-3 2-6M16 14c0-2 1-3 1-4"/></svg>',
  none: '<svg viewBox="0 0 24 24"><path d="M6 3v8M9 3v8M6 7h3M7.5 11v10M16 3c-2 2-2 6 0 8v10"/></svg>',
  people: '<svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="3"/><circle cx="16" cy="9" r="2.5"/><path d="M2.5 20c.5-4 3-6 5.5-6s5 2 5.5 6M13.5 20c.4-3 2-4.5 3.5-4.5s3.6 1.5 4 4.5"/></svg>',
  cal: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>',
  bulb: '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>',
  moon: '<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
  globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>'
};
const TYPE_LABEL = BNL ? BN.TYPE : { "Main": "Mains", "Soup & Dal": "Soups & dal", "Salad": "Salads", "Snack": "Snacks", "Sweet": "Sweets", "Drink": "Drinks", "Side & Sauce": "Sides & sauces" };
const CATS = ["All", "Favourites", "Main", "Soup & Dal", "Salad", "Snack", "Sweet", "Drink", "Side & Sauce"];
const MUSLIM = ["Turkish", "Lebanese", "Arab", "Moroccan", "Persian", "Malaysian", "Indonesian", "Egyptian"];
const EURAM = ["English", "Italian", "Spanish", "Greek", "Nordic", "American", "Mexican"];
const ASIA = ["Chinese", "Thai", "Japanese"];
const REGION = (r) => (MUSLIM.includes(r.origin) ? "Middle East" : EURAM.includes(r.origin) ? "Europe & Americas" : ASIA.includes(r.origin) ? "East Asian" : r.origin);
const REGIONS = ["Any cuisine", "Bangladeshi", "Pakistani", "Afghan", "Middle East", "Europe & Americas", "East Asian"];
const REGION_BN = { "Any cuisine": "সব দেশের", "Bangladeshi": "বাংলাদেশি", "Pakistani": "পাকিস্তানি", "Afghan": "আফগান", "Middle East": "মধ্যপ্রাচ্য ও মুসলিম দেশ", "Europe & Americas": "ইউরোপ ও আমেরিকা", "East Asian": "পূর্ব এশিয়া" };
const tRegion = (x) => (BNL ? REGION_BN[x] || x : x);
const TINT = (r) => ({ Bangladeshi: "", Pakistani: "t1", Afghan: "t2" }[r.origin] ?? (MUSLIM.includes(r.origin) ? "t1" : EURAM.includes(r.origin) ? "t2" : ""));
const TOOLS = [["air", tr("Air fryer", "এয়ার ফ্রায়ার")], ["oven", tr("Oven", "ওভেন")], ["micro", tr("Microwave", "মাইক্রোওয়েভ")], ["stove", tr("Stove", "চুলা")], ["none", tr("No cooking", "রান্না ছাড়া")]];
const minutesOf = (r) => { const t = r.en ? r.en.time : r.time, h = /(\d+)\s*hr/.exec(t), m = /(\d+)\s*min/.exec(t); return (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0) || 999; };
const MEAL = (r) => r.type === "Main" || r.type === "Soup & Dal";
const shortTime = (r) => esc(r.time.replace(/\s*\+.*/, ""));

/* ---------- kitchen (appliance) settings ---------- */
const OVEN_TYPES = [["otg", tr("Electric oven without fan (OTG)", "ইলেকট্রিক ওভেন (OTG, ফ্যান ছাড়া)")], ["conv", tr("Fan / convection oven", "কনভেকশন ওভেন (ফ্যানসহ)")], ["cmw", tr("Convection microwave", "কনভেকশন মাইক্রোওয়েভ")], ["gas", tr("Gas oven", "গ্যাস ওভেন")]];
const AIR_TYPES = [["small", tr("Small, 3–4 litres", "ছোট (৩–৪ লিটার)")], ["big", tr("Large, 5 litres or more", "বড় (৫ লিটার বা বেশি)")]];
const GAS = (c) => (c <= 180 ? 4 : c <= 190 ? 5 : c <= 210 ? 6 : c <= 220 ? 7 : 8);
const MIN = tr("min", "মিনিট");
const rng = (a, b, f) => { const p = Math.ceil(a * f), q = Math.ceil(b * f); return p === q ? `${N(p)} ${MIN}` : `${N(p)}–${N(q)} ${MIN}`; };
const STOP = tr(". ", "। ");
// ao = [°C, min, max, note, englishNote]
function ovenText([c, a, b, x, xen]) {
  const t = store.get("ovenType") || "otg", grill = /grill/i.test(xen || x || ""), extra = x ? x + STOP : "";
  if (t === "conv") return `${N(c)}°C · ${rng(a, b, 1)}${STOP}${extra}${tr("Fan mode, preheat 5 min.", "ফ্যান মোড, আগে ৫ মিনিট প্রিহিট।")}`;
  if (t === "cmw") return `${tr("Convection mode", "কনভেকশন মোডে")} ${N(c - 10)}°C · ${rng(a, b, 1)}${STOP}${extra}${tr("Metal trays only in convection mode.", "ধাতব ট্রে শুধু কনভেকশন মোডে চলে।")}`;
  if (t === "gas") return `${tr("Gas mark", "গ্যাস মার্ক")} ${N(GAS(c))} (${tr("about", "প্রায়")} ${N(c)}°C) · ${rng(a, b, 1.1)}${STOP}${extra}${grill ? tr("No grill? Use the top shelf. ", "গ্রিল না থাকলে সবচেয়ে উপরের র‍্যাকে দিন। ") : ""}${tr("Turn the tray halfway.", "মাঝে ট্রে ঘুরিয়ে দিন।")}`;
  if (grill) return `${N(c)}°C · ${rng(a, b, 1)}${STOP}${extra}${tr("Top element only, upper shelf, preheat 10 min.", "শুধু উপরের কয়েল চালু, উপরের দিকের র‍্যাক, আগে ১০ মিনিট প্রিহিট।")}`;
  return `${N(c)}°C · ${rng(a, b, 1.15)}${STOP}${extra}${tr("Top and bottom elements, middle shelf, preheat 10 min.", "উপর-নিচ দুই কয়েল চালু, মাঝের র‍্যাক, আগে ১০ মিনিট প্রিহিট।")}`;
}
function airText([c, a, b, x]) {
  const small = (store.get("airSize") || "small") === "small";
  return `${N(c)}°C · ${rng(a, b, 1)}${STOP}${x ? x + STOP : ""}${tr("Preheat 3 min, single layer, turn once.", "৩ মিনিট প্রিহিট, এক স্তরে সাজান, মাঝে একবার উল্টে দিন।")}${small ? tr(" In a small basket, cook 2 portions in two batches.", " ছোট ঝুড়িতে ২ জনের পরিমাণ দুই ভাগে করুন।") : ""}`;
}
const DONE = BNL ? {
  chicken: "সবচেয়ে মোটা টুকরোটা কেটে দেখুন: ভেতরে গোলাপি থাকবে না, রস পরিষ্কার হবে। থার্মোমিটার থাকলে ৭৫°C।",
  mince: "মাঝখানে কেটে দেখুন, ভেতরে লালচে থাকবে না।",
  fish: "কাঁটাচামচ দিয়ে চাপ দিলে মাছ সহজে ফ্লেক হয়ে আলাদা হবে, ভেতরটা সাদা আর অস্বচ্ছ।",
  veg: "বাইরে সোনালি হবে আর কাঁটাচামচ সহজে ঢুকে যাবে।"
} : {
  chicken: "Cut the thickest piece: no pink inside and clear juices (75°C if you have a thermometer).",
  mince: "Cut one open: no red left in the middle.",
  fish: "It flakes easily with a fork and is opaque all the way through.",
  veg: "Golden outside and a fork slides in easily."
};
const LOCAL = BNL ? {
  chicken: "বাজারের হাড়সহ বড় টুকরো হলে ৫ মিনিট বেশি দিন। দেশি মুরগি শক্ত হয়, তাই আগে প্রেশার কুকারে ১ সিটি দিয়ে নিন।",
  mince: "কিমায় চর্বি বেশি থাকলে এয়ার ফ্রায়ারের নিচে তেল জমে, মাঝে একবার ঢেলে ফেলুন।",
  fish: "ইলিশ, পাঙ্গাশ বা তেলাপিয়ার পাতলা ফিলে হলে ২–৩ মিনিট কম। রুই-কাতলার মোটা টুকরো হলে ২–৩ মিনিট বেশি।",
  veg: "বেগুন বেশি পানি ছাড়লে আগে লবণ মেখে ১০ মিনিট রেখে মুছে নিন, তাহলে মচমচে হবে।"
} : {
  chicken: "Bone-in market pieces need about 5 more minutes. Tough deshi chicken: pressure-cook for 1 whistle first.",
  mince: "If the mince is fatty, pour off the fat from the air fryer drawer halfway.",
  fish: "Thin hilsa, pangas or tilapia fillets need 2–3 minutes less; thick rui or katla pieces 2–3 minutes more.",
  veg: "If aubergine is watery, salt it for 10 minutes and pat dry first so it crisps."
};

/* ---------- state ---------- */
let tab = "home", cat = "All", region = "Any cuisine", tool = "all", query = "";
let cur = null, servings = 2, part = "ing";
const sb = window.supabase ? window.supabase.createClient("https://fschjgkvvjcwfpbgwiei.supabase.co", "sb_publishable_mf_sr2nS345glCGeovJJkw_vxP9V3lC", { auth: { persistSession: true, detectSessionInUrl: true, flowType: "pkce" } }) : null;
const VAPID_PUBLIC = "BIckWfK5nY56lXMgy0DypwZ-XXGc3gyhsEfSHlAqnox8rDmaV5SEzknH4LrXtx4GAawonxH2fgPTnsAcmSaG5WM";
var S = { user: null, family: null, members: [], favs: [], plan: null, ing: new Map(), shop: [], inbox: [], activity: [], channel: null };
function inFamily() { return !!(S && S.user && S.family); }
const myName = () => S.members.find((m) => m.user_id === S.user?.id)?.name || tr("Someone", "কেউ একজন");
const nameOf = (uid) => (uid === S.user?.id ? tr("You", "আপনি") : S.members.find((m) => m.user_id === uid)?.name || tr("Family member", "পরিবারের সদস্য"));
const initial = (n) => esc((n || "?").trim().slice(0, 1).toUpperCase());
const ago = (t) => {
  const s = Math.max(0, (Date.now() - new Date(t).getTime()) / 1000);
  if (s < 60) return tr("just now", "এইমাত্র");
  if (s < 3600) return tr(`${Math.floor(s / 60)} min ago`, `${N(Math.floor(s / 60))} মিনিট আগে`);
  if (s < 86400) return tr(`${Math.floor(s / 3600)} h ago`, `${N(Math.floor(s / 3600))} ঘণ্টা আগে`);
  return tr(`${Math.floor(s / 86400)} d ago`, `${N(Math.floor(s / 86400))} দিন আগে`);
};
function toast(msg) { const t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => (t.hidden = true), 2800); }

/* favourites */
function localFavs() { try { return JSON.parse(store.get("favs") || "[]"); } catch (e) { return []; } }
function FAV_IDS() { return inFamily() ? new Set(S.favs.map((f) => f.recipe_id)) : new Set(localFavs()); }
function isMyFav(rid) { return inFamily() ? S.favs.some((f) => f.user_id === S.user.id && f.recipe_id === rid) : localFavs().includes(rid); }
async function toggleFav(rid) {
  if (!inFamily()) {
    const f = new Set(localFavs()); f.has(rid) ? f.delete(rid) : f.add(rid);
    store.set("favs", JSON.stringify([...f])); refreshAll(); return;
  }
  const mine = S.favs.find((f) => f.user_id === S.user.id && f.recipe_id === rid);
  if (mine) { S.favs = S.favs.filter((f) => f !== mine); refreshAll(); await sb.from("favorites").delete().match({ family_id: S.family.id, user_id: S.user.id, recipe_id: rid }); }
  else { S.favs.push({ user_id: S.user.id, recipe_id: rid }); refreshAll(); await sb.from("favorites").insert({ family_id: S.family.id, user_id: S.user.id, recipe_id: rid }); logActivity(tr(`liked ${R[rid].name}`, `${R[rid].name} পছন্দ করেছেন`)); }
}

/* today's dish and ingredient marks */
const planRid = () => (inFamily() ? S.plan?.recipe_id : store.get("plan-" + today()));
function localIng() { try { return JSON.parse(store.get("ing-" + today()) || "{}"); } catch (e) { return {}; } }
function ingStatus(rid, i) { if (!inFamily()) { const v = localIng()[`${rid}:${i}`]; return v ? { status: v } : null; } return S.ing.get(`${rid}:${i}`) || null; }
const neededOf = (r) => r.ing.map((_, i) => i).filter((i) => ingStatus(r.id, i)?.status === "need");
const haveOf = (r) => r.ing.map((_, i) => i).filter((i) => ingStatus(r.id, i)?.status === "have");
async function cycleIng(rid, i) {
  const cur0 = ingStatus(rid, i)?.status;
  const next = !cur0 ? "have" : cur0 === "have" ? "need" : null;
  if (!inFamily()) {
    const m = localIng(); if (next) m[`${rid}:${i}`] = next; else delete m[`${rid}:${i}`];
    store.set("ing-" + today(), JSON.stringify(m)); renderPage(); renderHome(); return;
  }
  const key = `${rid}:${i}`;
  if (next) S.ing.set(key, { recipe_id: rid, idx: i, status: next, updated_by: S.user.id }); else S.ing.delete(key);
  renderPage(); renderHome();
  const q = { family_id: S.family.id, day: today(), recipe_id: rid, idx: i };
  if (next) await sb.from("ingredient_status").upsert({ ...q, status: next, updated_by: S.user.id, updated_at: new Date().toISOString() });
  else await sb.from("ingredient_status").delete().match(q);
}
async function setPlan(rid) {
  const msg = tr(`Today's dish: ${R[rid].name}`, `আজকের রান্না: ${R[rid].name}`);
  if (!inFamily()) { store.set("plan-" + today(), rid); toast(msg); refreshAll(); return; }
  S.plan = { family_id: S.family.id, day: today(), recipe_id: rid, picked_by: S.user.id };
  refreshAll();
  const { error } = await sb.from("cook_plans").upsert({ family_id: S.family.id, day: today(), recipe_id: rid, picked_by: S.user.id, picked_at: new Date().toISOString() });
  if (error) return toast(tr("Couldn't save, try again", "সেভ হয়নি, আবার চেষ্টা করুন"));
  toast(msg);
  logActivity(tr(`chose today's dish: ${R[rid].name}`, `আজকের রান্না ঠিক করেছেন: ${R[rid].name}`));
  const others = S.members.filter((m) => m.user_id !== S.user.id).map((m) => m.user_id);
  if (others.length) sendNotify(others, tr("Today's dish is decided", "আজকের রান্না ঠিক হয়েছে"), tr(`${myName()} picked ${R[rid].name}`, `${myName()} বেছেছেন ${R[rid].name}`), rid);
}

/* ---------- tabs ---------- */
const TITLES = { home: tr("Today", "আজ"), recipes: tr("Recipes", "রেসিপি"), spin: tr("Spin", "ঘোরান"), shop: tr("Shopping", "বাজার"), family: tr("Family", "পরিবার") };
function showTab(t) {
  tab = t;
  document.querySelectorAll(".tab").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === t));
  Object.keys(TITLES).forEach((k) => { $("s-" + k).hidden = k !== t; });
  $("title").textContent = TITLES[t];
  $("greet").textContent = t === "home" ? greeting() : "";
  store.set("tab", t);
  window.scrollTo(0, 0);
}
function greeting() {
  const h = new Date().getHours();
  const part = h < 12 ? tr("Good morning", "শুভ সকাল") : h < 17 ? tr("Good afternoon", "শুভ দুপুর") : tr("Good evening", "শুভ সন্ধ্যা");
  return S.user ? `${part}, ${myName().split(" ")[0]}` : part;
}
document.querySelectorAll(".tab").forEach((b) => (b.onclick = () => showTab(b.dataset.tab)));
$("bell").onclick = () => showTab("shop");
$("settings").onclick = () => openSettings();

/* ---------- home ---------- */
const daySeed = () => { const d = new Date(); return d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate(); };
function seeded(list, n, seed) { const a = list.slice(); let s = seed; for (let i = a.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor((s / 233280) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); }
const rcard = (r) => `<button class="rcard" data-r="${r.id}"><span class="tile ${TINT(r)}">${ART(r.id)}</span><span class="nm">${FAV_IDS().has(r.id) ? '<span class="heart">♥</span> ' : ""}${esc(r.name)}</span><span class="mt num">${N(r.kcal)} ${KCAL} · ${shortTime(r)}</span></button>`;
function renderHome() {
  const box = $("s-home");
  const rid = planRid(), r = rid && R[rid];
  let hero;
  if (r) {
    const have = haveOf(r).length, need = neededOf(r).length, total = r.ing.length;
    const picked = inFamily() ? tr(" · picked by ", " · বেছেছেন ") + esc(nameOf(S.plan.picked_by)) : "";
    hero = `<article class="card hero"><div class="tile ${TINT(r)}">${ART(r.id)}</div><div class="hero-body">
      <p class="eyebrow">${tr("Tonight's dish", "আজকের রান্না")}${picked}</p>
      <h2>${esc(r.name)}</h2>
      <div class="progress" aria-hidden="true"><i style="width:${Math.round((have / total) * 100)}%"></i></div>
      <p class="small muted num">${tr(`${have} of ${total} ingredients ready`, `${N(total)}টির মধ্যে ${N(have)}টি উপকরণ আছে`)}${need ? ` · <b style="color:var(--chili)">${tr(`${need} missing`, `${N(need)}টি নেই`)}</b>` : ""}</p>
      <div class="row2"><button class="btn primary" data-open="${r.id}">${tr("Check ingredients", "উপকরণ দেখুন")}</button><button class="btn soft" data-tab-go="spin">${tr("Change", "বদলান")}</button></div>
    </div></article>`;
  } else {
    hero = `<article class="card"><p class="eyebrow">${tr("Tonight's dish", "আজকের রান্না")}</p><h2 style="font-size:1.6rem">${tr("What's cooking today?", "আজ কী রান্না হবে?")}</h2>
      <p class="muted">${inFamily() ? tr("Spin the wheel or pick a recipe. Everyone in the family will see it.", "চাকা ঘোরান বা একটা রেসিপি বেছে নিন। পরিবারের সবাই দেখতে পাবে।") : tr("Spin the wheel or pick a recipe.", "চাকা ঘোরান বা একটা রেসিপি বেছে নিন।")}</p>
      <div class="row2"><button class="btn primary" data-tab-go="spin">${tr("Spin the wheel", "চাকা ঘোরান")}</button><button class="btn soft" data-tab-go="recipes">${tr("Browse", "রেসিপি দেখুন")}</button></div></article>`;
  }
  const unread = S.inbox.filter((x) => !x.read_at);
  const toBuy = S.shop.filter((x) => !x.bought).length;
  const favs = [...FAV_IDS()].filter((id) => R[id]).map((id) => R[id]);
  const quick = seeded(RECIPES.filter((x) => MEAL(x) && minutesOf(x) <= 30), 8, daySeed());
  const plan = DAYS.find((d) => d.js === new Date().getDay()) || DAYS[0];
  const planK = plan.meals.reduce((a, m) => a + m[2], 0);
  box.innerHTML = `
    ${unread.length ? `<button class="msg-strip" data-tab-go="shop"><span class="dot"></span><span><b>${esc(unread[0].title)}</b><br><span class="small muted">${esc(nameOf(unread[0].from_user))} · ${ago(unread[0].created_at)}${unread.length > 1 ? tr(` · +${unread.length - 1} more`, ` · আরও ${N(unread.length - 1)}টি`) : ""}</span></span></button>` : ""}
    ${hero}
    <div class="mini">
      <button class="card" data-tab-go="shop"><span class="eyebrow">${tr("Shopping", "বাজার")}</span><b class="num">${N(toBuy)}</b><span class="small muted">${tr(toBuy === 1 ? "item to buy" : "items to buy", "টি জিনিস কিনতে হবে")}</span></button>
      <button class="card" data-sub="plan"><span class="eyebrow">${tr("Diet plan", "ডায়েট প্ল্যান")}</span><b class="num">${N(planK)}</b><span class="small muted">${tr("kcal today", "ক্যালরি আজ")}</span></button>
    </div>
    ${favs.length ? `<div class="section-h"><h2>${inFamily() ? tr("Family favourites", "পরিবারের পছন্দ") : tr("Your favourites", "আপনার পছন্দ")}</h2><button class="link" data-cat-go="Favourites">${tr("See all", "সব দেখুন")}</button></div>${hscroll(favs.slice(0, 10).map(rcard).join(""))}` : ""}
    <div class="section-h"><h2>${tr("Quick &amp; light tonight", "আজ রাতে দ্রুত ও হালকা")}</h2><button class="link" data-tab-go="recipes">${tr("All recipes", "সব রেসিপি")}</button></div>
    ${hscroll(quick.map(rcard).join(""))}`;
  bindCommon(box);
  box.querySelectorAll(".hs").forEach(bindHscroll);
}
/* sideways rows: arrows for mouse users, drag with the mouse, swipe on touch */
const hscroll = (inner) => `<div class="hs"><button type="button" class="hs-btn prev" aria-label="${tr("Scroll left", "বাঁয়ে")}">‹</button><div class="carousel">${inner}</div><button type="button" class="hs-btn next" aria-label="${tr("Scroll right", "ডানে")}">›</button></div>`;
function bindHscroll(hs) {
  const c = hs.querySelector(".carousel"), prev = hs.querySelector(".prev"), next = hs.querySelector(".next");
  const update = () => { prev.disabled = c.scrollLeft < 4; next.disabled = c.scrollLeft + c.clientWidth >= c.scrollWidth - 4; };
  prev.onclick = () => c.scrollBy({ left: -c.clientWidth * 0.8, behavior: "smooth" });
  next.onclick = () => c.scrollBy({ left: c.clientWidth * 0.8, behavior: "smooth" });
  c.addEventListener("scroll", update, { passive: true });
  requestAnimationFrame(update);
}
let drag = null;
document.addEventListener("pointerdown", (e) => {
  const el = e.pointerType === "mouse" && e.button === 0 && e.target.closest(".carousel, .chips");
  if (el && el.scrollWidth > el.clientWidth) { drag = { el, x: e.clientX, left: el.scrollLeft, moved: false }; e.preventDefault(); }
});
document.addEventListener("dragstart", (e) => { if (e.target.closest && e.target.closest(".carousel, .chips")) e.preventDefault(); });
document.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x;
  if (!drag.moved && Math.abs(dx) > 6) { drag.moved = true; drag.el.classList.add("dragging"); }
  if (drag.moved) drag.el.scrollLeft = drag.left - dx;
});
document.addEventListener("pointerup", () => { if (drag?.moved) { const el = drag.el; setTimeout(() => el.classList.remove("dragging"), 0); el.dataset.dragged = "1"; setTimeout(() => delete el.dataset.dragged, 0); } drag = null; });
document.addEventListener("click", (e) => { const el = e.target.closest(".carousel, .chips"); if (el && el.dataset.dragged) { e.stopPropagation(); e.preventDefault(); } }, true);

function bindCommon(root) {
  root.querySelectorAll("[data-r]").forEach((b) => (b.onclick = () => openRecipe(b.dataset.r)));
  root.querySelectorAll("[data-open]").forEach((b) => (b.onclick = () => openRecipe(b.dataset.open)));
  root.querySelectorAll("[data-tab-go]").forEach((b) => (b.onclick = () => showTab(b.dataset.tabGo)));
  root.querySelectorAll("[data-cat-go]").forEach((b) => (b.onclick = () => { cat = b.dataset.catGo; showTab("recipes"); renderRecipes(); }));
  root.querySelectorAll("[data-sub]").forEach((b) => (b.onclick = () => openSub(b.dataset.sub)));
  bindLang(root);
}

/* ---------- recipes ---------- */
function renderRecipes() {
  $("cats").innerHTML = CATS.map((c) => `<button class="chip" data-c="${esc(c)}" aria-pressed="${c === cat}">${c === "All" ? tr("All", "সব") : c === "Favourites" ? tr("♥ Favourites", "♥ পছন্দ") : TYPE_LABEL[c]}</button>`).join("");
  $("cats").querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => { cat = b.dataset.c; renderRecipes(); }));
  const q = query.trim().toLowerCase(), favs = FAV_IDS();
  const shown = RECIPES.filter((r) =>
    (cat === "All" ? true : cat === "Favourites" ? favs.has(r.id) : r.type === cat) &&
    (region === "Any cuisine" || REGION(r) === region) &&
    (tool === "all" || (r.how && r.how[tool])) &&
    (!q || (r.name + " " + r.origin + " " + tOrigin(r.origin) + " " + r.ing.map((x) => x[2]).join(" ") + (r.en ? " " + r.en.name + " " + r.en.ing : "")).toLowerCase().includes(q)));
  const nf = (region !== "Any cuisine") + (tool !== "all");
  $("filter-n").hidden = !nf; $("filter-n").textContent = N(nf);
  $("count").textContent = tr(`${shown.length} ${shown.length === 1 ? "recipe" : "recipes"}`, `${N(shown.length)}টি রেসিপি`);
  $("grid").innerHTML = shown.length ? shown.map(rcard).join("") : `<p class="empty" style="grid-column:1/-1">${cat === "Favourites" ? tr("Tap ♥ on a recipe to save it here.", "রেসিপির ভেতরে ♥ চাপলে এখানে জমা হবে।") : tr("No recipes match. Try another search or clear the filters.", "কিছু পাওয়া যায়নি। অন্য কিছু লিখে খুঁজুন বা ফিল্টার মুছে দিন।")}</p>`;
  bindCommon($("grid"));
}
$("q").addEventListener("input", (e) => { query = e.target.value; renderRecipes(); });
$("filter-btn").onclick = () => {
  const draw = () => {
    openSheet(`<h3>${tr("Filters", "ফিল্টার")}</h3>
      <div><p class="eyebrow" style="margin-bottom:8px">${tr("Cuisine", "কোন দেশের")}</p><div class="wrapchips">${REGIONS.map((x) => `<button class="chip" data-reg="${esc(x)}" aria-pressed="${x === region}">${esc(tRegion(x))}</button>`).join("")}</div></div>
      <div><p class="eyebrow" style="margin-bottom:8px">${tr("Cook with", "কী দিয়ে রান্না")}</p><div class="wrapchips">${[["all", tr("Anything", "যেকোনো")], ...TOOLS.slice(0, 4)].map(([k, l]) => `<button class="chip" data-tool="${k}" aria-pressed="${k === tool}">${l}</button>`).join("")}</div></div>
      <div class="row2"><button class="btn soft" id="f-reset">${tr("Reset", "মুছুন")}</button><button class="btn primary" id="f-done">${tr("Show recipes", "রেসিপি দেখুন")}</button></div>`);
    $("bs-card").querySelectorAll("[data-reg]").forEach((b) => (b.onclick = () => { region = b.dataset.reg; renderRecipes(); draw(); }));
    $("bs-card").querySelectorAll("[data-tool]").forEach((b) => (b.onclick = () => { tool = b.dataset.tool; renderRecipes(); draw(); }));
    $("f-reset").onclick = () => { region = "Any cuisine"; tool = "all"; renderRecipes(); draw(); };
    $("f-done").onclick = closeSheet;
  };
  draw();
};

/* ---------- bottom sheet ---------- */
function openSheet(html) { $("bs-card").innerHTML = html; $("bs").hidden = false; document.body.classList.add("lock"); }
function closeSheet() { $("bs").hidden = true; if (!$("page").classList.contains("open")) document.body.classList.remove("lock"); }
$("bs").onclick = (e) => { if (e.target === $("bs")) closeSheet(); };

/* ---------- full-screen page (recipe or settings) ---------- */
let pageKind = null, pushed = false;
function openPageShell(kind, title) {
  pageKind = kind;
  $("page-t").textContent = title;
  $("page").classList.add("open"); $("page").setAttribute("aria-hidden", "false");
  $("page").scrollTop = 0;
  document.body.classList.add("lock");
  if (!pushed) { try { history.pushState({ page: 1 }, ""); pushed = true; } catch (e) {} }
}
function closePage(fromPop) {
  if (!$("page").classList.contains("open")) return;
  $("page").classList.remove("open"); $("page").setAttribute("aria-hidden", "true");
  $("actionbar").hidden = true; document.body.classList.remove("lock");
  pageKind = null; cur = null;
  if (!fromPop && pushed) { pushed = false; try { history.back(); } catch (e) {} }
  if (fromPop) pushed = false;
}
$("back").onclick = () => closePage(false);
window.addEventListener("popstate", () => { if (!$("player").hidden) PL.close(); else if (!$("bs").hidden) closeSheet(); else closePage(true); });
$("page").addEventListener("scroll", () => $("pagebar").classList.toggle("scrolled", $("page").scrollTop > 120));

function openRecipe(id) { cur = R[id]; servings = cur.base; part = "ing"; openPageShell("recipe", cur.name); renderPage(); }
function renderPage() {
  if (pageKind !== "recipe" || !cur) return;
  const r = cur, f = servings / r.base, fav = isMyFav(r.id);
  $("page-act").innerHTML = `<button class="iconbtn favbtn${fav ? " on" : ""}" id="fav-btn" aria-pressed="${fav}" aria-label="${fav ? tr("Remove from favourites", "পছন্দ থেকে সরান") : tr("Add to favourites", "পছন্দে রাখুন")}">${ICON.heart}</button>`;
  $("fav-btn").onclick = () => toggleFav(r.id);
  const favBy = inFamily() ? S.favs.filter((x) => x.recipe_id === r.id).map((x) => nameOf(x.user_id)) : [];
  const need = neededOf(r);
  let body = "";
  if (part === "ing") {
    body = `<div class="card" style="gap:10px">
      <div class="serv"><span class="legend"><span><i style="background:var(--leaf)"></i>${tr("Have", "আছে")}</span><span><i style="background:var(--chili)"></i>${tr("Need", "লাগবে")}</span></span>
        <span class="stepper num"><button id="minus" aria-label="${tr("Fewer servings", "কম জন")}">−</button>${tr(`${servings} ${servings === 1 ? "serving" : "servings"}`, `${N(servings)} জন`)}<button id="plus" aria-label="${tr("More servings", "বেশি জন")}">+</button></span></div>
      <ul class="ing">${r.ing.map((_, i) => {
        const st = ingStatus(r.id, i), [q, u, t] = r.ing[i];
        const who = inFamily() && st && st.updated_by && st.updated_by !== S.user.id ? `<span class="who">${tr("marked by", "চিহ্ন দিয়েছেন")} ${esc(nameOf(st.updated_by))}</span>` : "";
        const stLabel = st?.status === "have" ? tr("have", "আছে") : st?.status === "need" ? tr("need", "লাগবে") : tr("not checked", "দেখা হয়নি");
        return `<li data-i="${i}" class="${st?.status || ""}" role="button" aria-label="${esc(ingLine(r, i, f))}: ${stLabel}"><span class="mark">${st?.status === "have" ? "✓" : st?.status === "need" ? "!" : ""}</span><span class="tx">${q == null ? "" : `<span class="q num">${esc(qtyUnit(q * f, u))}</span> `}${esc(one(q == null ? q : q * f, u, t))}${who}</span></li>`;
      }).join("")}</ul>
      <p class="small muted">${tr("Tap once for <b>have</b>, twice for <b>need</b>.", "একবার চাপলে <b>আছে</b>, দুবার চাপলে <b>লাগবে</b>।")}</p></div>`;
  } else if (part === "steps") {
    const tools = TOOLS.filter(([k]) => r.how && r.how[k]);
    body = `<button class="btn warm block" id="play2">${ICON.play} ${tr("Play step by step", "ধাপে ধাপে ভিডিও")}</button>
      <div class="card"><ol class="steps">${r.steps.map((s) => `<li><span>${esc(s)}</span></li>`).join("")}</ol></div>
      ${tools.length ? `<div class="card"><div class="section-h"><h2 style="font-size:1.1rem">${tr("How to cook it", "কোন যন্ত্রে কীভাবে")}</h2><button class="link" data-sub="kitchen">${tr("My appliances", "আমার যন্ত্র")}</button></div>
        <div class="how">${tools.map(([k, l]) => {
          const ao = r.ao && r.ao[k];
          const label = k === "oven" ? OVEN_TYPES.find((o) => o[0] === (store.get("ovenType") || "otg"))[1] : k === "air" ? tr("Air fryer, ", "এয়ার ফ্রায়ার, ") + AIR_TYPES.find((o) => o[0] === (store.get("airSize") || "small"))[1].toLowerCase() : l;
          return `<div><span class="ic">${ICON[k]}</span><span><b>${esc(label)}</b>${esc(ao ? (k === "oven" ? ovenText(ao) : airText(ao)) : r.how[k])}</span></div>`;
        }).join("")}</div></div>` : ""}`;
  } else {
    body = `<div class="note"><b>${tr("Tip", "টিপস")}</b>${esc(r.tip)}</div>
      ${r.kind && r.ao ? `<div class="note"><b>${tr("Is it done?", "রান্না হলো কিনা বুঝবেন যেভাবে")}</b>${esc(DONE[r.kind])}</div><div class="note"><b>${tr("Cuts from a Bangladeshi market", "দেশি বাজারের মাছ-মাংস হলে")}</b>${esc(LOCAL[r.kind])}</div>` : ""}
      ${r.reg > r.kcal ? `<div class="note"><b>${tr("Why it's lighter", "কেন হালকা")}</b>${tr(`A usual restaurant or festive version is about ${r.reg} kcal per serving. This one is ${r.kcal} kcal: less oil, no deep-frying, and more vegetables or yogurt.`, `রেস্টুরেন্ট বা দাওয়াতের সাধারণ রান্নায় প্রতি জনে প্রায় ${N(r.reg)} ক্যালরি। এখানে ${N(r.kcal)} ক্যালরি: তেল কম, ডুবো তেলে ভাজা নেই, সবজি বা দই বেশি।`)}</div>` : ""}`;
  }
  const extraTime = /\+/.test(r.time) ? "+ " + esc(r.time.split("+")[1].trim()) : tr("time", "সময়");
  $("page-body").innerHTML = `
    <div class="r-hero"><div class="tile ${TINT(r)}">${ART(r.id)}</div></div>
    <div class="r-title"><p class="eyebrow">${esc(tOrigin(r.origin))} · ${esc(tType(r.type))}</p><h1>${esc(r.name)}</h1>
      ${favBy.length ? `<p class="small muted">♥ ${esc(favBy.join(", "))}</p>` : ""}</div>
    <div class="stats num"><div><b>${N(r.kcal)}</b><span>${KCAL}</span></div><div><b>${N(r.p)} ${tr("g", "গ্রাম")}</b><span>${tr("protein", "প্রোটিন")}</span></div><div><b>${shortTime(r)}</b><span>${extraTime}</span></div></div>
    ${r.reg > r.kcal ? `<span class="lighter num">${tr(`${r.reg - r.kcal} kcal lighter than usual`, `সাধারণের চেয়ে ${N(r.reg - r.kcal)} ক্যালরি কম`)}</span>` : ""}
    <div class="seg" role="tablist">${[["ing", tr("Ingredients", "উপকরণ")], ["steps", tr("Method", "রান্নার ধাপ")], ["tips", tr("Tips", "টিপস")]].map(([k, l]) => `<button role="tab" data-p="${k}" aria-selected="${k === part}">${l}</button>`).join("")}</div>
    ${body}`;
  const pb = $("page-body");
  pb.querySelectorAll("[data-p]").forEach((b) => (b.onclick = () => { part = b.dataset.p; renderPage(); }));
  pb.querySelectorAll(".ing li").forEach((li) => (li.onclick = () => cycleIng(r.id, +li.dataset.i)));
  const m = $("minus"), p = $("plus");
  if (m) m.onclick = () => { if (servings > 1) { servings--; renderPage(); } };
  if (p) p.onclick = () => { if (servings < 12) { servings++; renderPage(); } };
  const p2 = $("play2"); if (p2) p2.onclick = () => PL.open(r.id);
  bindCommon(pb);
  // action bar
  const isPlan = planRid() === r.id;
  let main;
  if (need.length) main = `<button class="btn primary" id="ab-main">${ICON.bell} ${tr(`Ask for ${need.length} missing`, `${N(need.length)}টি জিনিস চেয়ে পাঠান`)}</button>`;
  else if (!isPlan) main = `<button class="btn primary" id="ab-main">${tr("Cook this today", "আজ এটা রাঁধব")}</button>`;
  else main = `<button class="btn primary" id="ab-main">${ICON.share} ${tr("Share ingredients", "উপকরণ শেয়ার করুন")}</button>`;
  $("actionbar-in").innerHTML = `<button class="btn round" id="ab-play" aria-label="${tr("Play video", "ভিডিও চালান")}">${ICON.play}</button>${main}`;
  $("actionbar").hidden = false;
  $("ab-play").onclick = () => PL.open(r.id);
  $("ab-main").onclick = () => (need.length ? openNotify(r) : !isPlan ? setPlan(r.id) : shareCard(r, r.ing.map((_, i) => ingLine(r, i)), tr("Ingredients", "উপকরণ")));
}

/* ---------- notify sheet ---------- */
function openNotify(r) {
  const need = neededOf(r), others = S.members.filter((m) => m.user_id !== S.user?.id);
  openSheet(`<h3>${tr("Ask for what's missing", "যা নেই তা চেয়ে পাঠান")}</h3>
    <p class="small muted">${esc(r.name)}${tr(" needs:", "-এর জন্য লাগবে:")}</p>
    <div class="checks">${need.map((i) => `<label><input type="checkbox" checked data-i="${i}"> ${esc(ingLine(r, i))}</label>`).join("")}</div>
    ${inFamily() && others.length ? `<p class="eyebrow">${tr("Send to", "কাকে পাঠাবেন")}</p><div class="wrapchips">${others.map((o) => `<button class="person" data-u="${o.user_id}" aria-pressed="true"><span class="av">${initial(o.name)}</span>${esc(o.name)}</button>`).join("")}</div>
      <button class="btn primary block" id="n-send">${ICON.bell} ${tr("Notify and add to shopping list", "নোটিফাই করুন ও বাজারের তালিকায় যোগ করুন")}</button>`
      : `<p class="note">${inFamily() ? tr("Nobody else has joined your family yet. Send them your invite code from the Family tab.", "পরিবারে এখনো আর কেউ যোগ দেয়নি। পরিবার ট্যাব থেকে ইনভাইট কোড পাঠান।") : tr("Sign in and create a family to send notifications. For now you can share by WhatsApp or as an image.", "নোটিফিকেশন পাঠাতে লগ ইন করে পরিবার তৈরি করুন। আপাতত WhatsApp বা ছবি হিসেবে শেয়ার করতে পারেন।")}</p>`}
    <div class="row2"><button class="btn soft" id="n-wa">WhatsApp</button><button class="btn soft" id="n-img">${tr("Share image", "ছবি শেয়ার")}</button></div>`);
  const card = $("bs-card");
  card.querySelectorAll(".person").forEach((b) => (b.onclick = () => b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true")));
  const picked = () => [...card.querySelectorAll("input[data-i]:checked")].map((x) => ingLine(r, +x.dataset.i));
  $("n-wa").onclick = () => window.open("https://wa.me/?text=" + encodeURIComponent(tr(`For ${r.name} we need:`, `${r.name}-এর জন্য লাগবে:`) + "\n" + picked().map((x) => "• " + x).join("\n")), "_blank");
  $("n-img").onclick = () => shareCard(r, picked(), tr("Shopping needed", "বাজার লাগবে"));
  const send = $("n-send");
  if (send) send.onclick = async () => {
    const items = picked(), to = [...card.querySelectorAll(".person[aria-pressed=true]")].map((x) => x.dataset.u);
    if (!items.length) return toast(tr("Pick at least one item", "অন্তত একটা জিনিস বাছুন"));
    if (!to.length) return toast(tr("Choose who to notify", "কাকে জানাবেন বাছুন"));
    send.disabled = true;
    await sb.from("shopping_items").insert(items.map((t) => ({ family_id: S.family.id, text: t.slice(0, 200), recipe_id: r.id, added_by: S.user.id, assigned_to: to[0] })));
    const res = await sendNotify(to, tr(`Needed for ${r.name}`, `${r.name}-এর জন্য লাগবে`), items.join(", "), r.id);
    logActivity(tr(`asked for ${items.length} item${items.length > 1 ? "s" : ""} for ${r.name}`, `${r.name}-এর জন্য ${N(items.length)}টি জিনিস চেয়েছেন`));
    closeSheet(); await loadShop(); refreshAll();
    if (res) toast(res.sent ? tr("Sent. They'll get a notification.", "পাঠানো হয়েছে, ফোনে নোটিফিকেশন যাবে।") : tr("Sent. Their phone has notifications off, they'll see it in the app.", "পাঠানো হয়েছে। ওনার ফোনে নোটিফিকেশন বন্ধ, অ্যাপ খুললে দেখবেন।"));
  };
}
async function shareCard(r, items, heading) {
  const W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d");
  await document.fonts.ready;
  g.fillStyle = "#0E2016"; g.fillRect(0, 0, W, H);
  const img = new Image();
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(ART(r.id).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" '));
  await new Promise((ok) => { img.onload = ok; img.onerror = ok; });
  g.fillStyle = "#17331F"; g.beginPath(); g.arc(W / 2, 330, 250, 0, Math.PI * 2); g.fill();
  try { g.drawImage(img, W / 2 - 220, 110, 440, 440); } catch (e) {}
  g.textAlign = "center"; g.fillStyle = "#F0B653"; g.font = "600 38px Figtree, 'Hind Siliguri', sans-serif"; g.fillText(BNL ? heading : heading.toUpperCase(), W / 2, 650);
  g.fillStyle = "#F4F1E6"; g.font = "60px 'Young Serif', 'Tiro Bangla', serif"; g.fillText(r.name.slice(0, 32), W / 2, 740);
  g.textAlign = "left"; g.font = "40px Figtree, 'Hind Siliguri', sans-serif";
  items.slice(0, 9).forEach((t, i) => g.fillText("•  " + t.slice(0, 44), 120, 840 + i * 56));
  g.textAlign = "center"; g.fillStyle = "#F0B653"; g.font = "700 34px Figtree, 'Hind Siliguri', sans-serif"; g.fillText(tr("Deshi Diet Thala", "দেশি ডায়েট থালা"), W / 2, H - 60);
  const blob = await new Promise((ok) => c.toBlob(ok, "image/png"));
  const file = new File([blob], "deshi-thala.png", { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: r.name }); return; } catch (e) { if (e.name === "AbortError") return; } }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "deshi-thala-" + r.id + ".png";
  document.body.appendChild(a); a.click(); a.remove(); toast(tr("Image saved", "ছবি সেভ হয়েছে"));
}

/* ---------- sub pages: diet plan, kitchen, activity, tips ---------- */
let planDay = (DAYS.find((d) => d.js === new Date().getDay()) || DAYS[0]).k;
function openSub(kind) {
  const titles = { plan: tr("Diet plan", "ডায়েট প্ল্যান"), kitchen: tr("My kitchen", "আমার রান্নাঘর"), activity: tr("Activity", "কে কী করেছে"), tips: tr("Healthy swaps", "স্বাস্থ্যকর বদল") };
  openPageShell(kind, titles[kind]);
  $("page-act").innerHTML = "";
  $("actionbar").hidden = true;
  renderSub();
}
function renderSub() {
  const k = pageKind, pb = $("page-body");
  if (k === "plan") {
    const d = DAYS.find((x) => x.k === planDay), tot = d.meals.reduce((a, m) => a + m[2], 0), prot = d.meals.reduce((a, m) => a + m[3], 0);
    const linkify = (t) => esc(t).replace(/\{(\w+)\}/g, (_, id) => (R[id] ? `<button data-r="${id}">${esc(R[id].name)}</button>` : id));
    pb.innerHTML = `<div class="r-title"><p class="eyebrow">${tr("No breakfast · 3 meals", "নাস্তা ছাড়া · দিনে ৩ বেলা")}</p><h1>${tr("Weekly diet plan", "সাপ্তাহিক ডায়েট প্ল্যান")}</h1><p class="muted">${tr(`About ${tot} kcal and ${prot} g protein on ${esc(d.n)}. Tick meals as you eat them.`, `${esc(d.n)}বার প্রায় ${N(tot)} ক্যালরি আর ${N(prot)} গ্রাম প্রোটিন। খাওয়া হলে টিক দিন।`)}</p></div>
      <div class="chips">${DAYS.map((x) => `<button class="chip" data-d="${x.k}" aria-pressed="${x.k === planDay}">${esc(BNL ? x.n : x.n.slice(0, 3))}${x.js === new Date().getDay() ? " ·" : ""}</button>`).join("")}</div>
      <div class="card" style="gap:0">${d.meals.map(([slot, text, kc], i) => { const id = `meal-${d.k}-${i}`, done = store.get(id) === "1";
        return `<div class="meal${done ? " done" : ""}"><div><p class="slot num">${esc(slot)} · ${N(kc)} ${KCAL}</p><p class="what">${linkify(text)}</p></div><button class="tick" data-m="${id}" aria-pressed="${done}" aria-label="${tr("Eaten", "খাওয়া হয়েছে")}">✓</button></div>`; }).join("")}</div>
      <p class="small muted">${tr("Numbers are estimates. If you have diabetes, kidney disease or another condition, check with your doctor.", "হিসাবগুলো আনুমানিক। ডায়াবেটিস, কিডনির সমস্যা বা অন্য অসুখ থাকলে ডাক্তারের সাথে কথা বলে নিন।")}</p>`;
    pb.querySelectorAll("[data-d]").forEach((b) => (b.onclick = () => { planDay = b.dataset.d; renderSub(); }));
    pb.querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => { store.set(b.dataset.m, store.get(b.dataset.m) === "1" ? "0" : "1"); renderSub(); }));
  } else if (k === "kitchen") {
    const note = (h, t) => `<div class="note"><b>${h}</b>${t}</div>`;
    pb.innerHTML = `<div class="r-title"><h1>${tr("My kitchen", "আমার রান্নাঘর")}</h1><p class="muted">${tr("Pick your appliances. Every recipe then shows the right temperature and time.", "আপনার যন্ত্রগুলো বেছে দিন। তাহলে প্রতিটা রেসিপিতে ঠিক তাপমাত্রা আর সময় দেখাবে।")}</p></div>
      <div class="card"><p class="eyebrow">${tr("Oven", "ওভেন")}</p>${OVEN_TYPES.map(([v, l]) => `<button class="opt" data-k="ovenType" data-v="${v}" aria-pressed="${(store.get("ovenType") || "otg") === v}">${l}<span>${(store.get("ovenType") || "otg") === v ? "✓" : ""}</span></button>`).join("")}</div>
      <div class="card"><p class="eyebrow">${tr("Air fryer", "এয়ার ফ্রায়ার")}</p>${AIR_TYPES.map(([v, l]) => `<button class="opt" data-k="airSize" data-v="${v}" aria-pressed="${(store.get("airSize") || "small") === v}">${l}<span>${(store.get("airSize") || "small") === v ? "✓" : ""}</span></button>`).join("")}</div>
      <div class="card"><h2 style="font-size:1.15rem">${tr("Good to know", "জেনে রাখুন")}</h2>
        ${note(tr("Always preheat", "সবসময় প্রিহিট করুন"), tr("Electric oven 10 min, air fryer 3 min. A cold oven dries meat out.", "ইলেকট্রিক ওভেন ১০ মিনিট, এয়ার ফ্রায়ার ৩ মিনিট। ঠান্ডা ওভেনে দিলে মাংস শুকিয়ে যায়।"))}
        ${note(tr("Ovens without a fan are slower", "ফ্যান ছাড়া ওভেনে সময় বেশি লাগে"), tr("Most ovens sold in Bangladesh have no fan, so cooking takes about 15% longer. The app adds this for you.", "বাংলাদেশে বিক্রি হওয়া বেশিরভাগ ওভেনে ফ্যান নেই, তাই প্রায় ১৫% বেশি সময় লাগে। অ্যাপ নিজেই সেটা যোগ করে দেয়।"))}
        ${note(tr("Low voltage or IPS power", "ভোল্টেজ কম বা আইপিএসে চললে"), tr("Heating is slower, so allow 3–5 extra minutes and don't run the oven and air fryer together.", "গরম হতে দেরি হয়, তাই ৩–৫ মিনিট বেশি দিন আর ওভেন-এয়ার ফ্রায়ার একসাথে চালাবেন না।"))}
        ${note(tr("Don't crowd the basket", "ঝুড়ি ভরে ফেলবেন না"), tr("One layer only. Crowded food steams instead of crisping.", "এক স্তরে সাজান। গাদাগাদি করলে মচমচে না হয়ে ভাপে সেদ্ধ হয়।"))}
        ${note(tr("Never foil or steel in microwave mode", "মাইক্রোওয়েভ মোডে ফয়েল বা স্টিল নয়"), tr("Only in convection mode.", "শুধু কনভেকশন মোডে চলে।"))}
        <p class="eyebrow">${tr("Gas oven marks", "গ্যাস ওভেনের মার্ক")}</p><div class="gas num">${[[4, 180], [5, 190], [6, 200], [7, 220], [8, 230]].map(([g, c]) => `<span><b>${N(g)}</b>${N(c)}°C</span>`).join("")}</div></div>`;
    pb.querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => { store.set(b.dataset.k, b.dataset.v); renderSub(); }));
  } else if (k === "activity") {
    pb.innerHTML = `<div class="r-title"><h1>${tr("Activity", "কে কী করেছে")}</h1></div><div class="card" style="gap:0">${S.activity.map((a) => `<div class="act"><span class="av">${initial(nameOf(a.user_id))}</span><span><b>${esc(nameOf(a.user_id))}</b> ${esc(a.text)}<small>${ago(a.created_at)}</small></span></div>`).join("") || `<p class="muted">${tr("Nothing yet.", "এখনো কিছু হয়নি।")}</p>`}</div>`;
  } else if (k === "tips") {
    pb.innerHTML = `<div class="r-title"><h1>${tr("Healthy swaps", "স্বাস্থ্যকর বদল")}</h1><p class="muted">${tr("Same taste, far fewer calories.", "একই স্বাদ, অনেক কম ক্যালরি।")}</p></div>
      <div class="card" style="gap:0">${SWAPS.map(([a, b, c]) => `<div class="act" style="grid-template-columns:1fr"><span><span class="small muted" style="text-decoration:line-through">${esc(a)}</span><br><b>${esc(b)}</b><small style="color:var(--leaf)">${esc(c)}</small></span></div>`).join("")}</div>
      <div class="card"><h2 style="font-size:1.15rem">${tr("The plate rule", "প্লেটের নিয়ম")}</h2><p>${tr("Half vegetables and salad, a quarter protein, a quarter rice or bread.", "প্লেটের অর্ধেক সবজি আর সালাদ, এক ভাগ মাছ-মাংস-ডাল, এক ভাগ ভাত বা রুটি।")}</p></div>`;
  }
  bindCommon(pb);
}

/* ---------- spin ---------- */
const KINDS = [["Any meal", MEAL, "যেকোনো খাবার"], ["Filling", (r) => MEAL(r) && r.kcal > 260, "ভরপেট"], ["Light", (r) => (MEAL(r) || r.type === "Snack" || r.type === "Salad") && r.kcal <= 260, "হালকা"], ["Something sweet", (r) => r.type === "Sweet", "মিষ্টি কিছু"]];
let spinKind = "Any meal", spinRegion = "Any cuisine", slots = [], rot = 0, spinning = false;
const shortName = (n) => { const s = n.replace(/\s*\(.*?\)\s*/g, "").replace(/^(Light|Healthy|Low-Oil|Easy|One-Pot)\s+/i, "").trim(); return s.length > 18 ? s.slice(0, 17) + "…" : s; };
const pool = () => { const k = KINDS.find((x) => x[0] === spinKind)[1]; return RECIPES.filter((r) => k(r) && (spinRegion === "Any cuisine" || REGION(r) === spinRegion)); };
function chipRow(id, opts, val, set) {
  $(id).innerHTML = opts.map(([o, l]) => `<button class="chip" data-v="${esc(o)}" aria-pressed="${o === val}">${esc(l)}</button>`).join("");
  $(id).querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => { if (!spinning) set(b.dataset.v); }));
}
function renderSpinControls() {
  chipRow("spin-kind", KINDS.map((k) => [k[0], tr(k[0], k[2])]), spinKind, (v) => { spinKind = v; renderSpinControls(); buildWheel(); });
  chipRow("spin-origin", REGIONS.map((x) => [x, tRegion(x)]), spinRegion, (v) => { spinRegion = v; renderSpinControls(); buildWheel(); });
}
function buildWheel() {
  const p = pool().slice();
  for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  slots = p.slice(0, 8);
  const w = $("wheel"), n = slots.length, r = 150;
  $("hub").textContent = N(pool().length);
  $("result").hidden = true;
  $("spin-btn").disabled = !n;
  if (!n) { w.innerHTML = `<circle r="150" class="s3"/><text class="t3" text-anchor="middle" y="-60">${tr("No recipes here", "এখানে কোনো রেসিপি নেই")}</text>`; return; }
  w.classList.add("instant"); rot = 0; w.style.transform = "rotate(0deg)"; void w.getBoundingClientRect(); w.classList.remove("instant");
  const half = 180 / n, pt = (deg) => [r * Math.sin((deg * Math.PI) / 180), -r * Math.cos((deg * Math.PI) / 180)];
  let svg = "";
  slots.forEach((s, i) => {
    const c = i * (360 / n), cls = n === 1 ? 0 : i % 4 === 3 && i === n - 1 ? 1 : i % 4;
    if (n === 1) svg += `<circle r="${r}" class="s0"/>`;
    else { const [x1, y1] = pt(c - half), [x2, y2] = pt(c + half); svg += `<path class="s${cls}" d="M0 0L${x1.toFixed(2)} ${y1.toFixed(2)}A${r} ${r} 0 ${n <= 2 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}Z"/>`; }
    const left = c > 180;
    svg += `<text class="t${n === 1 ? 0 : cls}" transform="rotate(${left ? c + 90 : c - 90})" x="${left ? -(r - 14) : r - 14}" y="4" text-anchor="${left ? "start" : "end"}">${esc(shortName(s.name))}</text>`;
  });
  if (n > 1) slots.forEach((s, i) => { const [x, y] = pt(i * (360 / n) - half); svg += `<line class="sep" x1="0" y1="0" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}"/>`; });
  w.innerHTML = svg + `<circle r="${r}" class="rim"/>`;
}
function spin() {
  if (spinning || !slots.length) return;
  spinning = true;
  const btn = $("spin-btn"); btn.disabled = true; btn.textContent = tr("Spinning…", "ঘুরছে…"); $("result").hidden = true;
  const n = slots.length, k = Math.floor(Math.random() * n), seg = 360 / n, jitter = (Math.random() - 0.5) * seg * 0.6;
  const target = ((-(k * seg) - jitter) % 360 + 360) % 360, curMod = ((rot % 360) + 360) % 360;
  rot += 360 * 6 + ((target - curMod + 360) % 360);
  const w = $("wheel");
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const done = () => { w.removeEventListener("transitionend", done); clearTimeout(timer); showResult(slots[k]); };
  const timer = setTimeout(done, reduce ? 50 : 4500);
  w.addEventListener("transitionend", done);
  w.style.transform = `rotate(${rot}deg)`;
}
function showResult(r) {
  spinning = false;
  const btn = $("spin-btn"); btn.disabled = false; btn.textContent = tr("Spin again", "আবার ঘোরান");
  const box = $("result");
  box.innerHTML = `<div class="result"><span class="tile ${TINT(r)}">${ART(r.id)}</span><div><p class="eyebrow">${tr("Tonight", "আজ রাতে")}</p><h3>${esc(r.name)}</h3><p class="small muted num">${N(r.kcal)} ${KCAL} · ${shortTime(r)}</p></div></div>
    <div class="row2"><button class="btn primary" id="res-cook">${tr("Cook this today", "আজ এটা রাঁধব")}</button><button class="btn soft" data-r="${r.id}">${tr("View recipe", "রেসিপি দেখুন")}</button></div>`;
  box.hidden = false;
  $("res-cook").onclick = () => setPlan(r.id);
  bindCommon(box);
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
$("spin-btn").onclick = spin;

/* ---------- shopping ---------- */
const QUICK = BNL ? ["ডায়াপার", "দুধ", "ডিম", "পাউরুটি", "ওষুধ", "টিস্যু", "সাবান", "চাল", "পেঁয়াজ", "বেবি ফুড", "দই", "মুরগি"] : ["Diapers", "Milk", "Eggs", "Bread", "Medicine", "Tissues", "Soap", "Rice", "Onions", "Baby food", "Yogurt", "Chicken"];
const shopSkip = new Set();
function renderShop() {
  const box = $("s-shop");
  if (!inFamily()) {
    box.innerHTML = `<div class="card"><h2 style="font-size:1.4rem">${tr("Shop together", "একসাথে বাজার")}</h2><p class="muted">${tr("Sign in and create a family to share one shopping list, send requests to each other and get notifications.", "লগ ইন করে পরিবার তৈরি করুন। তাহলে একটাই বাজারের তালিকা, একে অপরকে জিনিস চাওয়া আর নোটিফিকেশন পাবেন।")}</p><button class="btn primary block" id="go-login">${tr("Sign in or create account", "লগ ইন বা অ্যাকাউন্ট খুলুন")}</button></div>`;
    $("go-login").onclick = () => showAuth(true);
    return;
  }
  const others = S.members.filter((m) => m.user_id !== S.user.id);
  const open = S.shop.filter((x) => !x.bought), done = S.shop.filter((x) => x.bought).slice(0, 15);
  const unread = S.inbox.filter((x) => !x.read_at);
  box.innerHTML = `
    <div class="card">
      <form id="shop-add" class="addbar"><input class="field" id="shop-text" maxlength="200" placeholder="${tr("Add an item, e.g. diapers", "কী লাগবে লিখুন, যেমন ডায়াপার")}" aria-label="${tr("New item", "নতুন জিনিস")}" autocomplete="off"><button class="btn primary">${tr("Add", "যোগ")}</button></form>
      <div class="chips">${QUICK.map((q) => `<button type="button" class="chip" data-q="${esc(q)}">+ ${esc(q)}</button>`).join("")}</div>
      ${others.length ? `<div class="notify-line">${tr("Notify", "জানাবেন")} ${others.map((o) => `<button type="button" class="person" data-u="${o.user_id}" aria-pressed="${!shopSkip.has(o.user_id)}"><span class="av">${initial(o.name)}</span>${esc(o.name)}</button>`).join("")}</div>` : `<p class="small muted">${tr("Invite your partner from the Family tab to notify them when you add something.", "কিছু যোগ করলে সঙ্গীকে জানাতে পরিবার ট্যাব থেকে তাকে ইনভাইট করুন।")}</p>`}
    </div>
    <div class="card" style="gap:0">
      <div class="section-h" style="margin-bottom:6px"><h2>${tr("To buy", "কিনতে হবে")}</h2><span class="small muted num">${N(open.length)}</span></div>
      <div class="list">${open.map((x) => `<div class="item" data-id="${x.id}"><button class="box" data-buy="${x.id}" aria-label="${tr("Mark as bought", "কেনা হয়েছে")}: ${esc(x.text)}">✓</button><span class="tx">${esc(x.text)}<small>${esc(nameOf(x.added_by))}${x.recipe_id && R[x.recipe_id] ? " · " + esc(R[x.recipe_id].name) : ""}</small></span>${others.length ? `<button class="remind" data-ring="${x.id}" aria-label="${tr("Remind", "মনে করিয়ে দিন")}: ${esc(x.text)}">${ICON.bell}</button>` : "<span></span>"}</div>`).join("") || `<p class="empty">${tr("Nothing to buy. Nice.", "কিছু কেনার নেই।")}</p>`}</div>
      ${done.length ? `<details class="fold"><summary>${tr("Bought", "কেনা হয়েছে")} (${N(done.length)})</summary><div class="list">${done.map((x) => `<div class="item got"><button class="box" data-buy="${x.id}" aria-label="${tr("Mark as not bought", "কেনা হয়নি")}: ${esc(x.text)}">✓</button><span class="tx">${esc(x.text)}<small>${tr("bought by", "কিনেছেন")} ${esc(nameOf(x.bought_by))}</small></span><span></span></div>`).join("")}</div></details>` : ""}
    </div>
    <div class="card" style="gap:0">
      <div class="section-h" style="margin-bottom:6px"><h2>${tr("Messages", "মেসেজ")}</h2>${unread.length ? `<button class="link" id="read-all">${tr("Mark all read", "সব পড়া হয়েছে")}</button>` : ""}</div>
      ${S.inbox.slice(0, 12).map((n) => `<div class="msg${n.read_at ? "" : " new"}"><b>${esc(n.title)}</b><span class="small">${esc(n.body)}</span><small>${esc(nameOf(n.from_user))} · ${ago(n.created_at)}${n.recipe_id && R[n.recipe_id] ? ` · <button class="link" data-r="${n.recipe_id}" style="min-height:0">${tr("Open recipe", "রেসিপি খুলুন")}</button>` : ""}</small></div>`).join("") || `<p class="muted small" style="padding:8px 0">${tr("No messages yet.", "এখনো কোনো মেসেজ নেই।")}</p>`}
    </div>`;
  bindCommon(box);
  box.querySelectorAll("[data-q]").forEach((b) => (b.onclick = () => { const i = $("shop-text"), v = i.value.trim(); i.value = v ? v + ", " + b.dataset.q : b.dataset.q; i.focus(); }));
  box.querySelectorAll(".notify-line [data-u]").forEach((b) => (b.onclick = () => { const u = b.dataset.u; shopSkip.has(u) ? shopSkip.delete(u) : shopSkip.add(u); b.setAttribute("aria-pressed", !shopSkip.has(u)); }));
  $("shop-add").onsubmit = async (e) => {
    e.preventDefault();
    const raw = $("shop-text").value.trim();
    if (!raw) return toast(tr("Type what you need", "কী লাগবে লিখুন"));
    const items = raw.split(/[,،\n]+/).map((s) => s.trim()).filter(Boolean).slice(0, 20);
    const to = others.map((o) => o.user_id).filter((u) => !shopSkip.has(u));
    $("shop-text").value = "";
    const { error } = await sb.from("shopping_items").insert(items.map((t) => ({ family_id: S.family.id, text: t.slice(0, 200), added_by: S.user.id, assigned_to: to[0] || null })));
    if (error) return toast(tr("Couldn't add, try again", "যোগ হয়নি, আবার চেষ্টা করুন"));
    await loadShop(); refreshAll();
    logActivity(tr(`added to the list: ${items.join(", ")}`, `তালিকায় যোগ করেছেন: ${items.join(", ")}`));
    if (to.length) {
      const title = items.length === 1 ? tr(`Please buy: ${items[0]}`, `কিনে আনবেন: ${items[0]}`) : tr(`Please buy ${items.length} things`, `${N(items.length)}টি জিনিস কিনে আনবেন`);
      const res = await sendNotify(to, title, tr(`${myName()} added ${items.join(", ")}`, `${myName()} যোগ করেছেন: ${items.join(", ")}`), null);
      if (res) toast(res.sent ? tr("Added and notified", "যোগ হয়েছে, জানানো হয়েছে") : tr("Added. They'll see it when they open the app.", "যোগ হয়েছে। অ্যাপ খুললে দেখতে পাবেন।"));
    } else toast(tr("Added to the list", "তালিকায় যোগ হয়েছে"));
  };
  box.querySelectorAll("[data-buy]").forEach((b) => (b.onclick = async () => {
    const it = S.shop.find((x) => x.id === b.dataset.buy); if (!it) return;
    it.bought = !it.bought; it.bought_by = it.bought ? S.user.id : null; refreshAll();
    await sb.from("shopping_items").update({ bought: it.bought, bought_by: it.bought_by }).eq("id", it.id);
    if (it.bought) { logActivity(tr(`bought ${it.text}`, `কিনেছেন: ${it.text}`)); if (it.added_by !== S.user.id) sendNotify([it.added_by], tr("Bought", "কেনা হয়েছে"), tr(`${myName()} bought ${it.text}`, `${myName()} কিনেছেন: ${it.text}`), it.recipe_id); }
  }));
  box.querySelectorAll("[data-ring]").forEach((b) => (b.onclick = async () => {
    const it = S.shop.find((x) => x.id === b.dataset.ring); if (!it) return;
    const to = it.assigned_to && it.assigned_to !== S.user.id ? [it.assigned_to] : others.map((o) => o.user_id);
    b.disabled = true;
    const res = await sendNotify(to, tr(`Reminder: ${it.text}`, `মনে আছে? ${it.text}`), tr(`${myName()} reminded you this still needs buying.`, `${myName()} মনে করিয়ে দিলেন, এটা এখনো কেনা হয়নি।`), it.recipe_id);
    b.disabled = false;
    if (res) toast(tr(`Reminded ${to.map(nameOf).join(", ")}`, `${to.map(nameOf).join(", ")}-কে মনে করানো হয়েছে`));
  }));
  const ra = $("read-all");
  if (ra) ra.onclick = async () => { const now = new Date().toISOString(); S.inbox.forEach((x) => (x.read_at = x.read_at || now)); refreshAll(); await sb.from("notifications").update({ read_at: now }).eq("to_user", S.user.id).is("read_at", null); };
}

/* ---------- family ---------- */
async function renderFamily() {
  const box = $("s-family");
  const rows = (items) => `<div class="card" style="gap:0;padding-block:6px">${items.join("")}</div>`;
  const rowlink = (sub, ic, t, s) => `<button class="rowlink" data-sub="${sub}"><span class="ic">${ic}</span><span>${t}${s ? `<small>${s}</small>` : ""}</span><span class="chev">${ICON.chev}</span></button>`;
  const langRow = `<div class="rowlink pick" style="cursor:default"><span class="ic">${ICON.globe}</span><span>${tr("Language", "ভাষা")}</span>${langPicker()}</div>`;
  const themeRow = `<div class="rowlink pick" style="cursor:default"><span class="ic">${ICON.moon}</span><span>${tr("Theme", "থিম")}</span>${themePicker()}</div>`;
  const common = [langRow, themeRow,
    rowlink("plan", ICON.cal, tr("Weekly diet plan", "সাপ্তাহিক ডায়েট প্ল্যান"), tr("3 meals a day, no breakfast", "নাস্তা ছাড়া দিনে ৩ বেলা")),
    rowlink("kitchen", ICON.oven, tr("My kitchen", "আমার রান্নাঘর"), tr("Oven and air fryer settings", "ওভেন আর এয়ার ফ্রায়ার")),
    rowlink("tips", ICON.bulb, tr("Healthy swaps", "স্বাস্থ্যকর বদল"), tr("Lighter versions of everyday habits", "রোজকার অভ্যাসের হালকা বিকল্প"))];
  if (!S.user) {
    box.innerHTML = `<div class="card"><h2 style="font-size:1.4rem">${tr("Cook together", "একসাথে রান্না")}</h2><p class="muted">${tr("Share favourites, today's dish and one shopping list with your partner, and get notified when they need something.", "সঙ্গীর সাথে পছন্দের রেসিপি, আজকের রান্না আর বাজারের তালিকা শেয়ার করুন। কিছু লাগলে নোটিফিকেশন পাবেন।")}</p><button class="btn primary block" id="go-login2">${tr("Sign in or create account", "লগ ইন বা অ্যাকাউন্ট খুলুন")}</button></div>${rows(common)}`;
    $("go-login2").onclick = () => showAuth(true);
  } else if (!S.family) {
    box.innerHTML = `<div class="card"><h2 style="font-size:1.4rem">${tr("No family yet", "এখনো পরিবার নেই")}</h2><button class="btn primary block" id="go-setup">${tr("Create or join a family", "পরিবার তৈরি করুন বা যোগ দিন")}</button></div>${rows(common)}`;
    $("go-setup").onclick = () => showSetup(true);
  } else {
    const ps = await pushState();
    const link = location.origin + location.pathname + "?join=" + S.family.code;
    const pushSub = ps === "on" ? tr("On for this phone", "এই ফোনে চালু") : ps === "denied" ? tr("Blocked in phone settings", "ফোনের সেটিংসে বন্ধ করা") : ps === "unsupported" ? (/iphone|ipad/i.test(navigator.userAgent) ? tr("Add to Home Screen first, then open from the icon", "আগে Home Screen-এ যোগ করে আইকন থেকে খুলুন") : tr("Not supported in this browser", "এই ব্রাউজারে চলে না")) : tr("Get a ping when your partner needs something", "সঙ্গীর কিছু লাগলে ফোনে জানবেন");
    box.innerHTML = `
      <div class="card fam-head">
        <div class="members">${S.members.map((m) => `<span class="av" title="${esc(m.name)}">${initial(m.name)}</span>`).join("")}</div>
        <div><h2 style="font-size:1.5rem">${esc(S.family.name)}</h2><p class="small muted">${S.members.map((m) => esc(m.user_id === S.user.id ? m.name + tr(" (you)", " (আপনি)") : m.name)).join(" · ")}</p></div>
        <div class="note" style="display:grid;gap:8px"><span class="eyebrow">${tr("Invite code", "ইনভাইট কোড")}</span><span class="code">${esc(S.family.code)}</span>
          <div class="row2"><button class="btn primary" id="inv-share">${tr("Invite partner", "সঙ্গীকে ডাকুন")}</button><button class="btn ghost" id="inv-copy">${tr("Copy code", "কোড কপি")}</button></div></div>
      </div>
      ${rows([
        `<div class="rowlink" style="cursor:default"><span class="ic">${ICON.bell}</span><span>${tr("Notifications", "নোটিফিকেশন")}<small>${pushSub}</small></span><button class="switch" id="push-sw" role="switch" aria-checked="${ps === "on"}" aria-label="${tr("Notifications", "নোটিফিকেশন")}"></button></div>`,
        rowlink("activity", ICON.clock, tr("Activity", "কে কী করেছে"), S.activity[0] ? `${esc(nameOf(S.activity[0].user_id))} ${esc(S.activity[0].text)}` : tr("What everyone did", "সবার কাজের খবর")),
        `<button class="rowlink" data-cat-go="Favourites"><span class="ic">${ICON.heart}</span><span>${tr("Favourites", "পছন্দের রেসিপি")}<small>${S.favs.length ? tr(`${new Set(S.favs.map((f) => f.recipe_id)).size} saved`, `${N(new Set(S.favs.map((f) => f.recipe_id)).size)}টি রাখা আছে`) : tr("Tap ♥ on any recipe", "রেসিপিতে ♥ চাপুন")}</small></span><span class="chev">${ICON.chev}</span></button>`
      ])}
      ${rows(common)}
      ${rows([`<form class="rowlink" id="name-form" style="grid-template-columns:36px 1fr auto"><span class="ic">${ICON.user}</span><input class="field" id="my-name" maxlength="40" value="${esc(myName())}" aria-label="${tr("Your name", "আপনার নাম")}" style="min-height:44px"><button class="link">${tr("Save", "সেভ")}</button></form>`,
        `<button class="rowlink" id="logout"><span class="ic">${ICON.chev}</span><span style="color:var(--chili);font-weight:600">${tr("Log out", "লগ আউট")}</span><span></span></button>`])}`;
    $("inv-copy").onclick = () => navigator.clipboard?.writeText(S.family.code).then(() => toast(tr("Code copied", "কোড কপি হয়েছে")), () => toast(S.family.code));
    $("inv-share").onclick = async () => {
      const text = tr(`Join our family in Deshi Diet Thala. Code: ${S.family.code}`, `দেশি ডায়েট থালায় আমাদের পরিবারে যোগ দাও। কোড: ${S.family.code}`) + "\n" + link;
      if (navigator.share) { try { await navigator.share({ text }); return; } catch (e) { if (e.name === "AbortError") return; } }
      window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
    };
    $("push-sw").onclick = () => (ps === "on" ? testPush() : enablePush());
    $("name-form").onsubmit = async (e) => { e.preventDefault(); const n = $("my-name").value.trim(); if (!n) return; await sb.from("profiles").update({ name: n }).eq("id", S.user.id); await loadMembers(); refreshAll(); toast(tr("Name saved", "নাম সেভ হয়েছে")); };
    $("logout").onclick = async () => { await sb.auth.signOut(); location.reload(); };
  }
  bindCommon(box);
}
async function testPush() {
  const r = await sb.functions.invoke("notify", { body: { family_id: S.family.id, to: S.members.map((m) => m.user_id), title: tr("Test", "পরীক্ষা"), body: tr("Notifications are working", "নোটিফিকেশন কাজ করছে") } });
  toast(r.error ? tr("Couldn't send", "পাঠানো যায়নি") : tr("Test sent to the rest of the family", "পরিবারের বাকিদের কাছে পরীক্ষা পাঠানো হয়েছে"));
}

/* ---------- supabase data ---------- */
async function loadMembers() {
  const { data: mem } = await sb.from("family_members").select("user_id, role").eq("family_id", S.family.id);
  const ids = (mem || []).map((m) => m.user_id);
  const { data: profs } = await sb.from("profiles").select("id, name").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  S.members = (mem || []).map((m) => ({ ...m, name: (profs || []).find((p) => p.id === m.user_id)?.name || tr("Member", "সদস্য") }));
}
async function loadFavs() { const { data } = await sb.from("favorites").select("user_id, recipe_id").eq("family_id", S.family.id); S.favs = data || []; }
async function loadPlan() { const { data } = await sb.from("cook_plans").select("*").eq("family_id", S.family.id).eq("day", today()).maybeSingle(); S.plan = data || null; }
async function loadIng() { const { data } = await sb.from("ingredient_status").select("recipe_id, idx, status, updated_by").eq("family_id", S.family.id).eq("day", today()); S.ing = new Map((data || []).map((x) => [`${x.recipe_id}:${x.idx}`, x])); }
async function loadShop() {
  const since = new Date(Date.now() - 3 * 86400000).toISOString();
  const { data } = await sb.from("shopping_items").select("*").eq("family_id", S.family.id).or(`bought.eq.false,created_at.gte.${since}`).order("created_at", { ascending: false }).limit(100);
  S.shop = data || [];
}
async function loadInbox() { const { data } = await sb.from("notifications").select("*").eq("to_user", S.user.id).order("created_at", { ascending: false }).limit(40); S.inbox = data || []; }
async function loadActivity() { const { data } = await sb.from("activity").select("*").eq("family_id", S.family.id).order("created_at", { ascending: false }).limit(30); S.activity = data || []; }
async function loadAll() { await Promise.all([loadMembers(), loadFavs(), loadPlan(), loadIng(), loadShop(), loadInbox(), loadActivity()]); }
function subscribe() {
  if (S.channel) sb.removeChannel(S.channel);
  const f = `family_id=eq.${S.family.id}`;
  const reload = { favorites: loadFavs, cook_plans: loadPlan, ingredient_status: loadIng, shopping_items: loadShop, activity: loadActivity, family_members: loadMembers };
  let ch = sb.channel("fam-" + S.family.id);
  Object.keys(reload).forEach((t) => { ch = ch.on("postgres_changes", { event: "*", schema: "public", table: t, filter: f }, async () => { await reload[t](); refreshAll(); }); });
  ch = ch.on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `to_user=eq.${S.user.id}` }, async (p) => { await loadInbox(); refreshAll(); if (p.eventType === "INSERT") toast(p.new.title); });
  S.channel = ch.subscribe();
}
async function logActivity(text) { if (inFamily()) await sb.from("activity").insert({ family_id: S.family.id, user_id: S.user.id, text: text.slice(0, 300) }); }
async function sendNotify(to, title, body, recipe_id) {
  if (!inFamily()) return { stored: 0 };
  const { data, error } = await sb.functions.invoke("notify", { body: { family_id: S.family.id, to, title, body, recipe_id } });
  if (error) { toast(tr("Couldn't send, try again", "পাঠানো যায়নি, আবার চেষ্টা করুন")); return null; }
  return data;
}

/* ---------- push ---------- */
const b64u = (s) => { const p = "=".repeat((4 - (s.length % 4)) % 4); const b = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...b].map((c) => c.charCodeAt(0))); };
async function pushState() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.getRegistration();
  return reg && (await reg.pushManager.getSubscription()) ? "on" : "off";
}
async function enablePush() {
  const st = await pushState();
  if (st === "unsupported") return toast(/iphone|ipad/i.test(navigator.userAgent) ? tr("On iPhone: Share → Add to Home Screen, open the app from the icon, then try again.", "আইফোনে: Share → Add to Home Screen, তারপর আইকন থেকে অ্যাপ খুলে আবার চেষ্টা করুন।") : tr("This browser can't show notifications. Try Chrome.", "এই ব্রাউজারে নোটিফিকেশন চলে না। Chrome দিয়ে চেষ্টা করুন।"));
  if ((await Notification.requestPermission()) !== "granted") return toast(tr("Notifications not allowed", "নোটিফিকেশনের অনুমতি দেওয়া হয়নি"));
  const reg = await navigator.serviceWorker.register("sw.js");
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(VAPID_PUBLIC) });
  const j = sub.toJSON();
  const { error } = await sb.from("push_subscriptions").upsert({ user_id: S.user.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth }, { onConflict: "endpoint" });
  toast(error ? tr("Couldn't turn on: ", "চালু হয়নি: ") + error.message : tr("Notifications are on", "নোটিফিকেশন চালু হয়েছে"));
  renderFamily();
}

/* ---------- auth & setup ---------- */
function showAuth(show) { $("auth").hidden = !show; document.body.classList.toggle("lock", show); }
function showSetup(show) { $("setup").hidden = !show; document.body.classList.toggle("lock", show); if (show && store.get("pendingJoin")) $("fam-code").value = store.get("pendingJoin"); }
function authMsg(t, ok) { const m = $("auth-msg"); m.textContent = t || ""; m.className = "auth-msg" + (ok ? " ok" : ""); }
function bindAuth() {
  document.querySelectorAll("[data-auth-tab]").forEach((b) => (b.onclick = () => {
    document.querySelectorAll("[data-auth-tab]").forEach((x) => x.setAttribute("aria-selected", x === b));
    ["login", "signup", "phone"].forEach((k) => ($("auth-" + k).hidden = b.dataset.authTab !== k));
    authMsg("");
  }));
  $("auth-login").onsubmit = async (e) => {
    e.preventDefault(); authMsg(tr("Signing in…", "লগ ইন হচ্ছে…"), true);
    const { error } = await sb.auth.signInWithPassword({ email: $("li-email").value.trim(), password: $("li-pass").value });
    if (error) authMsg(/confirm/i.test(error.message) ? tr("Please confirm your email first, using the link we sent.", "আগে ইমেইলে পাঠানো লিংকে চাপ দিয়ে কনফার্ম করুন।") : tr("Wrong email or password.", "ইমেইল বা পাসওয়ার্ড ভুল।"));
  };
  $("auth-signup").onsubmit = async (e) => {
    e.preventDefault();
    const kind = invite?.name ? "family" : document.querySelector("input[name=su-kind]:checked")?.value || "family";
    const back = location.origin + location.pathname + (invite?.name ? "?join=" + encodeURIComponent(invite.code) : "");
    authMsg(tr("Creating your account…", "অ্যাকাউন্ট তৈরি হচ্ছে…"), true);
    const { data, error } = await sb.auth.signUp({ email: $("su-email").value.trim(), password: $("su-pass").value, options: { data: { name: $("su-name").value.trim(), kind }, emailRedirectTo: back } });
    if (error) return authMsg(/registered/i.test(error.message) ? tr("That email already has an account. Log in instead.", "এই ইমেইলে আগেই অ্যাকাউন্ট আছে। লগ ইন করুন।") : tr("Couldn't create the account: ", "অ্যাকাউন্ট তৈরি হয়নি: ") + error.message);
    if (!data.session) authMsg(tr("Check your email and tap the link, then log in here.", "ইমেইলে পাঠানো লিংকে চাপ দিন, তারপর এখানে লগ ইন করুন।"), true);
  };
  $("auth-google").onclick = async () => { const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname + (invite?.name ? "?join=" + encodeURIComponent(invite.code) : "") } }); if (error) authMsg(tr("Google sign-in isn't switched on yet. Use email for now.", "গুগল দিয়ে লগ ইন এখনো চালু হয়নি। আপাতত ইমেইল ব্যবহার করুন।")); };
  $("auth-phone").onsubmit = async (e) => {
    e.preventDefault();
    const phone = $("ph-num").value.replace(/\s/g, "");
    if (!$("ph-code-row").hidden) { const { error } = await sb.auth.verifyOtp({ phone, token: $("ph-code").value.trim(), type: "sms" }); if (error) authMsg(tr("That code isn't right.", "কোডটা ঠিক নয়।")); return; }
    authMsg(tr("Sending code…", "কোড পাঠানো হচ্ছে…"), true);
    const { error } = await sb.auth.signInWithOtp({ phone, options: { data: { name: $("ph-name").value.trim() } } });
    if (error) return authMsg(tr("Phone sign-in isn't switched on yet. Use email for now.", "ফোন দিয়ে লগ ইন এখনো চালু হয়নি। আপাতত ইমেইল ব্যবহার করুন।"));
    $("ph-code-row").hidden = false; $("auth-phone").querySelector("button").textContent = tr("Verify code", "কোড যাচাই করুন"); authMsg(tr("Enter the 6-digit code from the SMS.", "SMS-এ আসা ৬ সংখ্যার কোড দিন।"), true);
  };
  $("auth-guest").onclick = () => { store.set("guest", "1"); showAuth(false); refreshAll(); };
  $("setup-create").onsubmit = async (e) => { e.preventDefault(); const { data, error } = await sb.rpc("create_family", { fam_name: $("fam-name").value, fam_kind: "family" }); if (error) return toast(tr("Couldn't create: ", "তৈরি হয়নি: ") + error.message); await afterFamily(data); };
  $("setup-join").onsubmit = async (e) => { e.preventDefault(); await joinWith($("fam-code").value); };
  $("setup-single").onclick = async () => { const { data, error } = await sb.rpc("create_family", { fam_name: tr("My kitchen", "আমার রান্নাঘর"), fam_kind: "single" }); if (error) return toast(tr("Couldn't create: ", "তৈরি হয়নি: ") + error.message); await afterFamily(data); };
}
/* invite links (?join=CODE): check the code before sign-in so the visitor sees whose family it is */
let invite = null;
async function checkInvite(code) {
  code = String(code || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) return { code, bad: true };
  const { data, error } = await sb.rpc("family_preview", { join_code: code });
  if (error) return { code };
  return data ? { code, ...data } : { code, bad: true };
}
function renderInvite() {
  const box = $("auth-invite"), valid = !!invite?.name;
  $("su-kind-row").hidden = valid;
  $("auth-guest").hidden = valid;
  document.querySelector("#auth .over-in > p.muted").hidden = !!invite && (valid || invite.bad);
  if (!invite || (!valid && !invite.bad)) { box.hidden = true; return; }
  if (invite.bad) {
    box.className = "invite bad";
    box.innerHTML = `<div><b>${tr("This invite link doesn't work", "এই ইনভাইট লিংকটা কাজ করছে না")}</b><span class="sm">${tr(`No family has the code ${esc(invite.code)}. Ask for the link again, or log in and enter the code in the Family tab.`, `${esc(invite.code)} কোডের কোনো পরিবার নেই। আবার লিংকটা চেয়ে নিন, অথবা লগ ইন করে পরিবার ট্যাবে কোড দিন।`)}</span></div>`;
  } else {
    const who = invite.inviter || tr("Your partner", "আপনার সঙ্গী");
    box.className = "invite";
    box.innerHTML = `<span class="av">${initial(who)}</span><div><b>${esc(tr(`${who} invited you to “${invite.name}”`, `${who} আপনাকে “${invite.name}”-এ ডেকেছেন`))}</b><span class="sm">${tr("Create an account or log in. You'll join the family straight away.", "অ্যাকাউন্ট খুলুন বা লগ ইন করুন, সাথে সাথেই পরিবারে যোগ হয়ে যাবেন।")}</span></div>`;
    const su = document.querySelector("[data-auth-tab=signup]"); if (su && su.getAttribute("aria-selected") !== "true") su.click();
  }
  box.hidden = false;
}
async function joinWith(code) {
  const { data, error } = await sb.rpc("join_family", { join_code: code });
  if (error) { toast(tr("That code didn't work", "কোডটা কাজ করেনি")); return false; }
  store.set("pendingJoin", ""); await afterFamily(data); toast(tr(`You joined ${data.name}`, `আপনি ${data.name}-এ যোগ দিয়েছেন`)); return true;
}
async function afterFamily(fam) { S.family = fam; store.set("familyId", fam.id); showSetup(false); await loadAll(); subscribe(); refreshAll(); }

/* ---------- static text in body.html ---------- */
function translateStatic() {
  document.querySelectorAll(".langslot").forEach((el) => { el.innerHTML = langPicker(); bindLang(el); });
  if (!BNL) return;
  const lastText = (el, txt) => {
    const nodes = [...el.childNodes].filter((n) => n.nodeType === 3 && n.nodeValue.trim());
    if (nodes.length) nodes[nodes.length - 1].nodeValue = (el.tagName === "LABEL" && el.querySelector("input[type=radio]") ? " " : "") + txt; else el.textContent = txt;
  };
  const firstText = (el, txt) => { const n = [...el.childNodes].find((x) => x.nodeType === 3 && x.nodeValue.trim()); if (n) n.nodeValue = txt; };
  const T = (sel, txt, how = lastText) => document.querySelectorAll(sel).forEach((el) => how(el, txt));
  const A = (sel, attr, txt) => document.querySelectorAll(sel).forEach((el) => el.setAttribute(attr, txt));
  T("#s-spin > p.muted", "কী রাঁধবেন ভাবছেন? মুড বেছে চাকা ঘোরান, যেখানে থামবে সেটাই আজকের রান্না।");
  A("#q", "placeholder", "রেসিপি বা উপকরণ খুঁজুন"); A("#q", "aria-label", "রেসিপি খুঁজুন"); A("#filter-btn", "aria-label", "ফিল্টার");
  T("#spin-btn", "ঘোরান");
  ["home", "recipes", "shop", "family"].forEach((k) => T(`.tab[data-tab=${k}]`, TITLES[k]));
  A(".tab[data-tab=spin]", "aria-label", "ঘোরান"); A("#settings", "aria-label", "ভাষা ও থিম"); A("#bell", "aria-label", "মেসেজ ও বাজার"); A("#back", "aria-label", "ফিরে যান");
  T("#auth h1", "দেশি ডায়েট থালা");
  T("#auth .over-in > p.muted", "পুরো পরিবারের জন্য সহজ, স্বাস্থ্যকর ঘরের রান্না। পছন্দের রেসিপি শেয়ার করুন, আজকের রান্না ঠিক করুন, একে অপরকে বাজারের কথা জানান।");
  T("[data-auth-tab=login]", "লগ ইন"); T("[data-auth-tab=signup]", "নতুন অ্যাকাউন্ট"); T("[data-auth-tab=phone]", "ফোন");
  T("#auth-login label:nth-of-type(1)", "ইমেইল", firstText); T("#auth-login label:nth-of-type(2)", "পাসওয়ার্ড", firstText); T("#auth-login button", "লগ ইন");
  T("#auth-signup > label:nth-of-type(1)", "আপনার নাম", firstText); T("#auth-signup > label:nth-of-type(2)", "ইমেইল", firstText); T("#auth-signup > label:nth-of-type(3)", "পাসওয়ার্ড", firstText);
  T(".kind label:nth-child(1)", "পরিবার"); T(".kind label:nth-child(2)", "শুধু আমি"); T("#auth-signup > button", "অ্যাকাউন্ট খুলুন");
  T("#auth-phone > label:nth-of-type(1)", "আপনার নাম", firstText); T("#auth-phone > label:nth-of-type(2)", "দেশের কোডসহ ফোন নম্বর", firstText); T("#ph-code-row", "SMS-এর কোড", firstText); T("#auth-phone > button", "কোড পাঠান");
  T(".or", "অথবা"); T("#auth-google", "গুগল দিয়ে চালিয়ে যান"); T("#auth-guest", "অ্যাকাউন্ট ছাড়াই ব্যবহার করুন");
  T("#setup h1", "আপনার পরিবার"); T("#setup .over-in > p.muted", "নতুন পরিবার তৈরি করুন, অথবা সঙ্গীর পাঠানো ৬ অক্ষরের কোড দিয়ে যোগ দিন।");
  T("#setup-create label", "পরিবারের নাম", firstText); A("#fam-name", "placeholder", "যেমন: রহমান পরিবার"); T("#setup-create button", "পরিবার তৈরি করুন");
  T("#setup-join label", "ইনভাইট কোড", firstText); T("#setup-join button", "যোগ দিন"); T("#setup-single", "আমি একাই ব্যবহার করব");
  A(".pl-close", "aria-label", "ভিডিও বন্ধ করুন"); A(".pl-prev", "aria-label", "আগের ধাপ"); A(".pl-next", "aria-label", "পরের ধাপ");
  document.title = "দেশি ডায়েট থালা";
}

/* ---------- refresh ---------- */
function refreshAll() {
  renderHome(); renderRecipes(); renderShop(); renderFamily();
  const n = S.inbox.filter((x) => !x.read_at).length;
  $("bell-n").hidden = !n; $("bell-n").textContent = N(n);
  const dot = document.querySelector(".tab[data-tab=shop] .dotn"); if (dot) dot.hidden = !n;
  $("greet").textContent = tab === "home" ? greeting() : "";
  if (pageKind === "recipe") renderPage();
}

/* ---------- start ---------- */
async function start() {
  translateStatic();
  renderSpinControls(); buildWheel();
  bindAuth();
  const sp = new URLSearchParams(location.search);
  if (sp.get("join")) {
    store.set("pendingJoin", sp.get("join").trim().toUpperCase());
    sp.delete("join"); history.replaceState(null, "", location.pathname + (sp.toString() ? "?" + sp : "") + location.hash);
  }
  const want = sp.get("tab") === "bazar" ? "shop" : sp.get("tab"), saved = store.get("tab");
  showTab(TITLES[want] ? want : TITLES[saved] ? saved : "home");
  refreshAll();
  if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
  if (!sb) return;
  if (store.get("pendingJoin")) {
    invite = await checkInvite(store.get("pendingJoin"));
    if (invite.bad) { store.set("pendingJoin", ""); toast(tr(`Invite code ${invite.code} doesn't exist. Ask for the link again.`, `${invite.code} নামে কোনো ইনভাইট কোড নেই। আবার লিংক চেয়ে নিন।`)); }
    renderInvite();
  }
  const onSession = async (session) => {
    S.user = session?.user || null;
    if (!S.user) { S.family = null; if (!store.get("guest") || invite?.name) showAuth(true); refreshAll(); return; }
    showAuth(false);
    const { data: mem } = await sb.from("family_members").select("family_id, families(*)").eq("user_id", S.user.id);
    const pending = store.get("pendingJoin");
    if (pending) {
      const mine = (mem || []).find((m) => m.families?.code === pending);
      const famName = invite?.name || pending;
      if (mine) { store.set("pendingJoin", ""); store.set("familyId", mine.family_id); toast(tr(`You're already in ${famName}`, `আপনি আগে থেকেই ${famName}-এ আছেন`)); }
      else if (!(mem || []).length || window.confirm(tr(`Join "${famName}"? The app will switch to this family.`, `"${famName}"-এ যোগ দেবেন? অ্যাপ এই পরিবারে চলে যাবে।`))) { if (await joinWith(pending)) { invite = null; renderInvite(); return; } }
      else store.set("pendingJoin", "");
      invite = null; renderInvite();
    }
    const pick = (mem || []).find((m) => m.family_id === store.get("familyId")) || (mem || [])[0];
    if (pick?.families) await afterFamily(pick.families);
    else if (S.user.user_metadata?.kind === "single") { const { data } = await sb.rpc("create_family", { fam_name: tr("My kitchen", "আমার রান্নাঘর"), fam_kind: "single" }); if (data) await afterFamily(data); }
    else { showSetup(true); refreshAll(); }
    if (sp.get("code") || location.hash.includes("access_token")) history.replaceState(null, "", location.pathname);
  };
  let lastUid = undefined;
  sb.auth.onAuthStateChange((ev, session) => {
    const uid = session?.user?.id || null;
    if (uid === lastUid && ev !== "SIGNED_OUT") return;
    lastUid = uid;
    setTimeout(() => onSession(session), 0);
  });
  setInterval(() => { if (inFamily() && tab === "family") renderFamily(); }, 60000);
}
