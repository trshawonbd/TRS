
/* ================= Deshi Diet Thala — app ================= */
const R = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
};
const fmtQty = (q) => {
  if (q == null) return "";
  const r = Math.round(q * 100) / 100;
  const whole = Math.floor(r), frac = r - whole;
  const f = Math.abs(frac - 0.5) < 0.01 ? "½" : Math.abs(frac - 0.25) < 0.01 ? "¼" : Math.abs(frac - 0.75) < 0.01 ? "¾" : frac ? String(Math.round(frac * 10) / 10).slice(1) : "";
  return (whole || !f ? whole : "") + f;
};
const one = (q, u, t) => (q != null && q <= 1 && !u ? t.replace(/^([a-z]+?)(ies|oes|s)\b/i, (w, s0, e) => (/ss$/i.test(w) ? w : s0 + (e === "ies" ? "i" : e === "oes" ? "o" : ""))) : t);
const ingLine = (r, i, f = 1) => { const [q, u, t] = r.ing[i]; return (q == null ? "" : fmtQty(q * f) + (u ? " " + u : "") + " ") + one(q == null ? q : q * f, u, t); };
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
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
  user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>'
};
const TYPE_LABEL = { "Main": "Mains", "Soup & Dal": "Soups & dal", "Salad": "Salads", "Snack": "Snacks", "Sweet": "Sweets", "Drink": "Drinks", "Side & Sauce": "Sides & sauces" };
const CATS = ["All", "Favourites", "Main", "Soup & Dal", "Salad", "Snack", "Sweet", "Drink", "Side & Sauce"];
const MUSLIM = ["Turkish", "Lebanese", "Arab", "Moroccan", "Persian", "Malaysian", "Indonesian", "Egyptian"];
const EURAM = ["English", "Italian", "Spanish", "Greek", "Nordic", "American", "Mexican"];
const ASIA = ["Chinese", "Thai", "Japanese"];
const REGION = (r) => (MUSLIM.includes(r.origin) ? "Middle East" : EURAM.includes(r.origin) ? "Europe & Americas" : ASIA.includes(r.origin) ? "East Asian" : r.origin);
const REGIONS = ["Any cuisine", "Bangladeshi", "Pakistani", "Afghan", "Middle East", "Europe & Americas", "East Asian"];
const TINT = (r) => ({ Bangladeshi: "", Pakistani: "t1", Afghan: "t2" }[r.origin] ?? (MUSLIM.includes(r.origin) ? "t1" : EURAM.includes(r.origin) ? "t2" : ""));
const TOOLS = [["air", "Air fryer"], ["oven", "Oven"], ["micro", "Microwave"], ["stove", "Stove"], ["none", "No cooking"]];
const minutesOf = (r) => { const h = /(\d+)\s*hr/.exec(r.time), m = /(\d+)\s*min/.exec(r.time); return (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0) || 999; };
const MEAL = (r) => r.type === "Main" || r.type === "Soup & Dal";

/* ---------- kitchen (appliance) settings ---------- */
const OVEN_TYPES = [["otg", "Electric oven without fan (OTG)"], ["conv", "Fan / convection oven"], ["cmw", "Convection microwave"], ["gas", "Gas oven"]];
const AIR_TYPES = [["small", "Small, 3–4 litres"], ["big", "Large, 5 litres or more"]];
const GAS = (c) => (c <= 180 ? 4 : c <= 190 ? 5 : c <= 210 ? 6 : c <= 220 ? 7 : 8);
const rng = (a, b, f) => { const p = Math.ceil(a * f), q = Math.ceil(b * f); return p === q ? `${p} min` : `${p}–${q} min`; };
function ovenText([c, a, b, , x]) {
  const t = store.get("ovenType") || "otg", grill = /grill/i.test(x || ""), extra = x ? x + ". " : "";
  if (t === "conv") return `${c}°C · ${rng(a, b, 1)}. ${extra}Fan mode, preheat 5 min.`;
  if (t === "cmw") return `Convection mode ${c - 10}°C · ${rng(a, b, 1)}. ${extra}Metal trays only in convection mode.`;
  if (t === "gas") return `Gas mark ${GAS(c)} (about ${c}°C) · ${rng(a, b, 1.1)}. ${extra}${grill ? "No grill? Use the top shelf. " : ""}Turn the tray halfway.`;
  if (grill) return `${c}°C · ${rng(a, b, 1)}. ${extra}Top element only, upper shelf, preheat 10 min.`;
  return `${c}°C · ${rng(a, b, 1.15)}. ${extra}Top and bottom elements, middle shelf, preheat 10 min.`;
}
function airText([c, a, b, , x]) {
  const small = (store.get("airSize") || "small") === "small";
  return `${c}°C · ${a === b ? a + " min" : a + "–" + b + " min"}. ${x ? x + ". " : ""}Preheat 3 min, single layer, turn once.${small ? " In a small basket, cook 2 portions in two batches." : ""}`;
}
const DONE = {
  chicken: "Cut the thickest piece: no pink inside and clear juices (75°C if you have a thermometer).",
  mince: "Cut one open: no red left in the middle.",
  fish: "It flakes easily with a fork and is opaque all the way through.",
  veg: "Golden outside and a fork slides in easily."
};
const LOCAL = {
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
const myName = () => S.members.find((m) => m.user_id === S.user?.id)?.name || "Someone";
const nameOf = (uid) => (uid === S.user?.id ? "You" : S.members.find((m) => m.user_id === uid)?.name || "Family member");
const initial = (n) => esc((n || "?").trim().slice(0, 1).toUpperCase());
const ago = (t) => {
  const s = Math.max(0, (Date.now() - new Date(t).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
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
  else { S.favs.push({ user_id: S.user.id, recipe_id: rid }); refreshAll(); await sb.from("favorites").insert({ family_id: S.family.id, user_id: S.user.id, recipe_id: rid }); logActivity(`liked ${R[rid].name}`); }
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
  if (!inFamily()) { store.set("plan-" + today(), rid); toast(`Today's dish: ${R[rid].name}`); refreshAll(); return; }
  S.plan = { family_id: S.family.id, day: today(), recipe_id: rid, picked_by: S.user.id };
  refreshAll();
  const { error } = await sb.from("cook_plans").upsert({ family_id: S.family.id, day: today(), recipe_id: rid, picked_by: S.user.id, picked_at: new Date().toISOString() });
  if (error) return toast("Couldn't save, try again");
  toast(`Today's dish: ${R[rid].name}`);
  logActivity(`chose today's dish: ${R[rid].name}`);
  const others = S.members.filter((m) => m.user_id !== S.user.id).map((m) => m.user_id);
  if (others.length) sendNotify(others, "Today's dish is decided", `${myName()} picked ${R[rid].name}`, rid);
}

/* ---------- tabs ---------- */
const TITLES = { home: "Today", recipes: "Recipes", spin: "Spin", shop: "Shopping", family: "Family" };
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
  const part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return S.user ? `${part}, ${myName().split(" ")[0]}` : part;
}
document.querySelectorAll(".tab").forEach((b) => (b.onclick = () => showTab(b.dataset.tab)));
$("bell").onclick = () => showTab("shop");

/* ---------- home ---------- */
const daySeed = () => { const d = new Date(); return d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate(); };
function seeded(list, n, seed) { const a = list.slice(); let s = seed; for (let i = a.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor((s / 233280) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); }
const rcard = (r) => `<button class="rcard" data-r="${r.id}"><span class="tile ${TINT(r)}">${ART(r.id)}</span><span class="nm">${FAV_IDS().has(r.id) ? '<span class="heart">♥</span> ' : ""}${esc(r.name)}</span><span class="mt num">${r.kcal} kcal · ${esc(r.time.replace(/ \+.*/, ""))}</span></button>`;
function renderHome() {
  const box = $("s-home");
  const rid = planRid(), r = rid && R[rid];
  let hero;
  if (r) {
    const have = haveOf(r).length, need = neededOf(r).length, total = r.ing.length;
    hero = `<article class="card hero"><div class="tile ${TINT(r)}">${ART(r.id)}</div><div class="hero-body">
      <p class="eyebrow">Tonight's dish${inFamily() ? " · picked by " + esc(nameOf(S.plan.picked_by)) : ""}</p>
      <h2>${esc(r.name)}</h2>
      <div class="progress" aria-hidden="true"><i style="width:${Math.round((have / total) * 100)}%"></i></div>
      <p class="small muted num">${have} of ${total} ingredients ready${need ? ` · <b style="color:var(--chili)">${need} missing</b>` : ""}</p>
      <div class="row2"><button class="btn primary" data-open="${r.id}">Check ingredients</button><button class="btn soft" data-tab-go="spin">Change</button></div>
    </div></article>`;
  } else {
    hero = `<article class="card"><p class="eyebrow">Tonight's dish</p><h2 style="font-size:1.6rem">What's cooking today?</h2>
      <p class="muted">Spin the wheel or pick a recipe${inFamily() ? ". Everyone in the family will see it." : "."}</p>
      <div class="row2"><button class="btn primary" data-tab-go="spin">Spin the wheel</button><button class="btn soft" data-tab-go="recipes">Browse</button></div></article>`;
  }
  const unread = S.inbox.filter((x) => !x.read_at);
  const toBuy = S.shop.filter((x) => !x.bought).length;
  const favs = [...FAV_IDS()].filter((id) => R[id]).map((id) => R[id]);
  const quick = seeded(RECIPES.filter((x) => MEAL(x) && minutesOf(x) <= 30), 8, daySeed());
  const plan = DAYS.find((d) => d.js === new Date().getDay()) || DAYS[0];
  const planK = plan.meals.reduce((a, m) => a + m[2], 0);
  box.innerHTML = `
    ${unread.length ? `<button class="msg-strip" data-tab-go="shop"><span class="dot"></span><span><b>${esc(unread[0].title)}</b><br><span class="small muted">${esc(nameOf(unread[0].from_user))} · ${ago(unread[0].created_at)}${unread.length > 1 ? ` · +${unread.length - 1} more` : ""}</span></span></button>` : ""}
    ${hero}
    <div class="mini">
      <button class="card" data-tab-go="shop"><span class="eyebrow">Shopping</span><b class="num">${toBuy}</b><span class="small muted">${toBuy === 1 ? "item to buy" : "items to buy"}</span></button>
      <button class="card" data-sub="plan"><span class="eyebrow">Diet plan</span><b class="num">${planK}</b><span class="small muted">kcal today</span></button>
    </div>
    ${favs.length ? `<div class="section-h"><h2>${inFamily() ? "Family favourites" : "Your favourites"}</h2><button class="link" data-cat-go="Favourites">See all</button></div><div class="carousel">${favs.slice(0, 10).map(rcard).join("")}</div>` : ""}
    <div class="section-h"><h2>Quick &amp; light tonight</h2><button class="link" data-tab-go="recipes">All recipes</button></div>
    <div class="carousel">${quick.map(rcard).join("")}</div>`;
  bindCommon(box);
}
function bindCommon(root) {
  root.querySelectorAll("[data-r]").forEach((b) => (b.onclick = () => openRecipe(b.dataset.r)));
  root.querySelectorAll("[data-open]").forEach((b) => (b.onclick = () => openRecipe(b.dataset.open)));
  root.querySelectorAll("[data-tab-go]").forEach((b) => (b.onclick = () => showTab(b.dataset.tabGo)));
  root.querySelectorAll("[data-cat-go]").forEach((b) => (b.onclick = () => { cat = b.dataset.catGo; showTab("recipes"); renderRecipes(); }));
  root.querySelectorAll("[data-sub]").forEach((b) => (b.onclick = () => openSub(b.dataset.sub)));
}

/* ---------- recipes ---------- */
function renderRecipes() {
  $("cats").innerHTML = CATS.map((c) => `<button class="chip" data-c="${esc(c)}" aria-pressed="${c === cat}">${c === "All" ? "All" : c === "Favourites" ? "♥ Favourites" : TYPE_LABEL[c]}</button>`).join("");
  $("cats").querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => { cat = b.dataset.c; renderRecipes(); }));
  const q = query.trim().toLowerCase(), favs = FAV_IDS();
  const shown = RECIPES.filter((r) =>
    (cat === "All" ? true : cat === "Favourites" ? favs.has(r.id) : r.type === cat) &&
    (region === "Any cuisine" || REGION(r) === region) &&
    (tool === "all" || (r.how && r.how[tool])) &&
    (!q || (r.name + " " + r.origin + " " + r.ing.map((x) => x[2]).join(" ")).toLowerCase().includes(q)));
  const nf = (region !== "Any cuisine") + (tool !== "all");
  $("filter-n").hidden = !nf; $("filter-n").textContent = nf;
  $("count").textContent = `${shown.length} ${shown.length === 1 ? "recipe" : "recipes"}`;
  $("grid").innerHTML = shown.length ? shown.map(rcard).join("") : `<p class="empty" style="grid-column:1/-1">${cat === "Favourites" ? "Tap ♥ on a recipe to save it here." : "No recipes match. Try another search or clear the filters."}</p>`;
  bindCommon($("grid"));
}
$("q").addEventListener("input", (e) => { query = e.target.value; renderRecipes(); });
$("filter-btn").onclick = () => {
  const draw = () => {
    openSheet(`<h3>Filters</h3>
      <div><p class="eyebrow" style="margin-bottom:8px">Cuisine</p><div class="wrapchips">${REGIONS.map((x) => `<button class="chip" data-reg="${esc(x)}" aria-pressed="${x === region}">${esc(x)}</button>`).join("")}</div></div>
      <div><p class="eyebrow" style="margin-bottom:8px">Cook with</p><div class="wrapchips">${[["all", "Anything"], ...TOOLS.slice(0, 4)].map(([k, l]) => `<button class="chip" data-tool="${k}" aria-pressed="${k === tool}">${l}</button>`).join("")}</div></div>
      <div class="row2"><button class="btn soft" id="f-reset">Reset</button><button class="btn primary" id="f-done">Show recipes</button></div>`);
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
  $("page-act").innerHTML = `<button class="iconbtn favbtn${fav ? " on" : ""}" id="fav-btn" aria-pressed="${fav}" aria-label="${fav ? "Remove from favourites" : "Add to favourites"}">${ICON.heart}</button>`;
  $("fav-btn").onclick = () => toggleFav(r.id);
  const favBy = inFamily() ? S.favs.filter((x) => x.recipe_id === r.id).map((x) => nameOf(x.user_id)) : [];
  const need = neededOf(r), have = haveOf(r);
  let body = "";
  if (part === "ing") {
    body = `<div class="card" style="gap:10px">
      <div class="serv"><span class="legend"><span><i style="background:var(--leaf)"></i>Have</span><span><i style="background:var(--chili)"></i>Need</span></span>
        <span class="stepper num"><button id="minus" aria-label="Fewer servings">−</button>${servings} ${servings === 1 ? "serving" : "servings"}<button id="plus" aria-label="More servings">+</button></span></div>
      <ul class="ing">${r.ing.map((_, i) => {
        const st = ingStatus(r.id, i), [q, u, t] = r.ing[i];
        const who = inFamily() && st && st.updated_by && st.updated_by !== S.user.id ? `<span class="who">marked by ${esc(nameOf(st.updated_by))}</span>` : "";
        return `<li data-i="${i}" class="${st?.status || ""}" role="button" aria-label="${esc(ingLine(r, i, f))}: ${st?.status || "not checked"}"><span class="mark">${st?.status === "have" ? "✓" : st?.status === "need" ? "!" : ""}</span><span class="tx">${q == null ? "" : `<span class="q num">${fmtQty(q * f)}${u ? " " + esc(u) : ""}</span> `}${esc(one(q == null ? q : q * f, u, t))}${who}</span></li>`;
      }).join("")}</ul>
      <p class="small muted">Tap once for <b>have</b>, twice for <b>need</b>.</p></div>`;
  } else if (part === "steps") {
    const tools = TOOLS.filter(([k]) => r.how && r.how[k]);
    body = `<button class="btn warm block" id="play2">${ICON.play} Play step by step</button>
      <div class="card"><ol class="steps">${r.steps.map((s) => `<li><span>${esc(s)}</span></li>`).join("")}</ol></div>
      ${tools.length ? `<div class="card"><div class="section-h"><h2 style="font-size:1.1rem">How to cook it</h2><button class="link" data-sub="kitchen">My appliances</button></div>
        <div class="how">${tools.map(([k, l]) => {
          const ao = r.ao && r.ao[k];
          const label = k === "oven" ? OVEN_TYPES.find((o) => o[0] === (store.get("ovenType") || "otg"))[1] : k === "air" ? "Air fryer, " + AIR_TYPES.find((o) => o[0] === (store.get("airSize") || "small"))[1].toLowerCase() : l;
          return `<div><span class="ic">${ICON[k]}</span><span><b>${esc(label)}</b>${esc(ao ? (k === "oven" ? ovenText(ao) : airText(ao)) : r.how[k])}</span></div>`;
        }).join("")}</div></div>` : ""}`;
  } else {
    body = `<div class="note"><b>Tip</b>${esc(r.tip)}</div>
      ${r.kind && r.ao ? `<div class="note"><b>Is it done?</b>${esc(DONE[r.kind])}</div><div class="note"><b>Cuts from a Bangladeshi market</b>${esc(LOCAL[r.kind])}</div>` : ""}
      ${r.reg > r.kcal ? `<div class="note"><b>Why it's lighter</b>A usual restaurant or festive version is about ${r.reg} kcal per serving. This one is ${r.kcal} kcal: less oil, no deep-frying, and more vegetables or yogurt.</div>` : ""}`;
  }
  $("page-body").innerHTML = `
    <div class="r-hero"><div class="tile ${TINT(r)}">${ART(r.id)}</div></div>
    <div class="r-title"><p class="eyebrow">${esc(r.origin)} · ${esc(r.type)}</p><h1>${esc(r.name)}</h1>
      ${favBy.length ? `<p class="small muted">♥ ${esc(favBy.join(", "))}</p>` : ""}</div>
    <div class="stats num"><div><b>${r.kcal}</b><span>kcal</span></div><div><b>${r.p} g</b><span>protein</span></div><div><b>${esc(r.time.replace(/ \+.*/, ""))}</b><span>${/\+/.test(r.time) ? "+ " + esc(r.time.split("+")[1].trim()) : "time"}</span></div></div>
    ${r.reg > r.kcal ? `<span class="lighter num">${r.reg - r.kcal} kcal lighter than usual</span>` : ""}
    <div class="seg" role="tablist">${[["ing", "Ingredients"], ["steps", "Method"], ["tips", "Tips"]].map(([k, l]) => `<button role="tab" data-p="${k}" aria-selected="${k === part}">${l}</button>`).join("")}</div>
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
  if (need.length) main = `<button class="btn primary" id="ab-main">${ICON.bell} Ask for ${need.length} missing</button>`;
  else if (!isPlan) main = `<button class="btn primary" id="ab-main">Cook this today</button>`;
  else main = `<button class="btn primary" id="ab-main">${ICON.share} Share ingredients</button>`;
  $("actionbar-in").innerHTML = `<button class="btn round" id="ab-play" aria-label="Play video">${ICON.play}</button>${main}`;
  $("actionbar").hidden = false;
  $("ab-play").onclick = () => PL.open(r.id);
  $("ab-main").onclick = () => (need.length ? openNotify(r) : !isPlan ? setPlan(r.id) : shareCard(r, r.ing.map((_, i) => ingLine(r, i)), "Ingredients"));
}

/* ---------- notify sheet ---------- */
function openNotify(r) {
  const need = neededOf(r), others = S.members.filter((m) => m.user_id !== S.user?.id);
  openSheet(`<h3>Ask for what's missing</h3>
    <p class="small muted">${esc(r.name)} needs:</p>
    <div class="checks">${need.map((i) => `<label><input type="checkbox" checked data-i="${i}"> ${esc(ingLine(r, i))}</label>`).join("")}</div>
    ${inFamily() && others.length ? `<p class="eyebrow">Send to</p><div class="wrapchips">${others.map((o) => `<button class="person" data-u="${o.user_id}" aria-pressed="true"><span class="av">${initial(o.name)}</span>${esc(o.name)}</button>`).join("")}</div>
      <button class="btn primary block" id="n-send">${ICON.bell} Notify and add to shopping list</button>`
      : `<p class="note">${inFamily() ? "Nobody else has joined your family yet. Send them your invite code from the Family tab." : "Sign in and create a family to send notifications. For now you can share by WhatsApp or as an image."}</p>`}
    <div class="row2"><button class="btn soft" id="n-wa">WhatsApp</button><button class="btn soft" id="n-img">Share image</button></div>`);
  const card = $("bs-card");
  card.querySelectorAll(".person").forEach((b) => (b.onclick = () => b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true")));
  const picked = () => [...card.querySelectorAll("input[data-i]:checked")].map((x) => ingLine(r, +x.dataset.i));
  $("n-wa").onclick = () => window.open("https://wa.me/?text=" + encodeURIComponent(`For ${r.name} we need:\n${picked().map((x) => "• " + x).join("\n")}`), "_blank");
  $("n-img").onclick = () => shareCard(r, picked(), "Shopping needed");
  const send = $("n-send");
  if (send) send.onclick = async () => {
    const items = picked(), to = [...card.querySelectorAll(".person[aria-pressed=true]")].map((x) => x.dataset.u);
    if (!items.length) return toast("Pick at least one item");
    if (!to.length) return toast("Choose who to notify");
    send.disabled = true;
    await sb.from("shopping_items").insert(items.map((t) => ({ family_id: S.family.id, text: t.slice(0, 200), recipe_id: r.id, added_by: S.user.id, assigned_to: to[0] })));
    const res = await sendNotify(to, `Needed for ${r.name}`, items.join(", "), r.id);
    logActivity(`asked for ${items.length} item${items.length > 1 ? "s" : ""} for ${r.name}`);
    closeSheet(); await loadShop(); refreshAll();
    if (res) toast(res.sent ? "Sent. They'll get a notification." : "Sent. Their phone has notifications off, they'll see it in the app.");
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
  g.textAlign = "center"; g.fillStyle = "#F0B653"; g.font = "600 38px Figtree, sans-serif"; g.fillText(heading.toUpperCase(), W / 2, 650);
  g.fillStyle = "#F4F1E6"; g.font = "60px 'Young Serif', serif"; g.fillText(r.name.slice(0, 32), W / 2, 740);
  g.textAlign = "left"; g.font = "40px Figtree, sans-serif";
  items.slice(0, 9).forEach((t, i) => g.fillText("•  " + t.slice(0, 44), 120, 840 + i * 56));
  g.textAlign = "center"; g.fillStyle = "#F0B653"; g.font = "700 34px Figtree, sans-serif"; g.fillText("Deshi Diet Thala", W / 2, H - 60);
  const blob = await new Promise((ok) => c.toBlob(ok, "image/png"));
  const file = new File([blob], "deshi-thala.png", { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: r.name }); return; } catch (e) { if (e.name === "AbortError") return; } }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "deshi-thala-" + r.id + ".png";
  document.body.appendChild(a); a.click(); a.remove(); toast("Image saved");
}

/* ---------- sub pages: diet plan, kitchen, activity, tips ---------- */
let planDay = (DAYS.find((d) => d.js === new Date().getDay()) || DAYS[0]).k;
function openSub(kind) {
  const titles = { plan: "Diet plan", kitchen: "My kitchen", activity: "Activity", tips: "Healthy swaps" };
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
    pb.innerHTML = `<div class="r-title"><p class="eyebrow">No breakfast · 3 meals</p><h1>Weekly diet plan</h1><p class="muted">About ${tot} kcal and ${prot} g protein on ${esc(d.n)}. Tick meals as you eat them.</p></div>
      <div class="chips">${DAYS.map((x) => `<button class="chip" data-d="${x.k}" aria-pressed="${x.k === planDay}">${esc(x.n.slice(0, 3))}${x.js === new Date().getDay() ? " ·" : ""}</button>`).join("")}</div>
      <div class="card" style="gap:0">${d.meals.map(([slot, text, kc], i) => { const id = `meal-${d.k}-${i}`, done = store.get(id) === "1";
        return `<div class="meal${done ? " done" : ""}"><div><p class="slot num">${esc(slot)} · ${kc} kcal</p><p class="what">${linkify(text)}</p></div><button class="tick" data-m="${id}" aria-pressed="${done}" aria-label="Eaten">✓</button></div>`; }).join("")}</div>
      <p class="small muted">Numbers are estimates. If you have diabetes, kidney disease or another condition, check with your doctor.</p>`;
    pb.querySelectorAll("[data-d]").forEach((b) => (b.onclick = () => { planDay = b.dataset.d; renderSub(); }));
    pb.querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => { store.set(b.dataset.m, store.get(b.dataset.m) === "1" ? "0" : "1"); renderSub(); }));
  } else if (k === "kitchen") {
    pb.innerHTML = `<div class="r-title"><h1>My kitchen</h1><p class="muted">Pick your appliances. Every recipe then shows the right temperature and time.</p></div>
      <div class="card"><p class="eyebrow">Oven</p>${OVEN_TYPES.map(([v, l]) => `<button class="opt" data-k="ovenType" data-v="${v}" aria-pressed="${(store.get("ovenType") || "otg") === v}">${l}<span>${(store.get("ovenType") || "otg") === v ? "✓" : ""}</span></button>`).join("")}</div>
      <div class="card"><p class="eyebrow">Air fryer</p>${AIR_TYPES.map(([v, l]) => `<button class="opt" data-k="airSize" data-v="${v}" aria-pressed="${(store.get("airSize") || "small") === v}">${l}<span>${(store.get("airSize") || "small") === v ? "✓" : ""}</span></button>`).join("")}</div>
      <div class="card"><h2 style="font-size:1.15rem">Good to know</h2>
        <div class="note"><b>Always preheat</b>Electric oven 10 min, air fryer 3 min. A cold oven dries meat out.</div>
        <div class="note"><b>Ovens without a fan are slower</b>Most ovens sold in Bangladesh have no fan, so cooking takes about 15% longer. The app adds this for you.</div>
        <div class="note"><b>Low voltage or IPS power</b>Heating is slower, so allow 3–5 extra minutes and don't run the oven and air fryer together.</div>
        <div class="note"><b>Don't crowd the basket</b>One layer only. Crowded food steams instead of crisping.</div>
        <div class="note"><b>Never foil or steel in microwave mode</b>Only in convection mode.</div>
        <p class="eyebrow">Gas oven marks</p><div class="gas num"><span><b>4</b>180°C</span><span><b>5</b>190°C</span><span><b>6</b>200°C</span><span><b>7</b>220°C</span><span><b>8</b>230°C</span></div></div>`;
    pb.querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => { store.set(b.dataset.k, b.dataset.v); renderSub(); }));
  } else if (k === "activity") {
    pb.innerHTML = `<div class="r-title"><h1>Activity</h1></div><div class="card" style="gap:0">${S.activity.map((a) => `<div class="act"><span class="av">${initial(nameOf(a.user_id))}</span><span><b>${esc(nameOf(a.user_id))}</b> ${esc(a.text)}<small>${ago(a.created_at)}</small></span></div>`).join("") || '<p class="muted">Nothing yet.</p>'}</div>`;
  } else if (k === "tips") {
    pb.innerHTML = `<div class="r-title"><h1>Healthy swaps</h1><p class="muted">Same taste, far fewer calories.</p></div>
      <div class="card" style="gap:0">${SWAPS.map(([a, b, c]) => `<div class="act" style="grid-template-columns:1fr"><span><span class="small muted" style="text-decoration:line-through">${esc(a)}</span><br><b>${esc(b)}</b><small style="color:var(--leaf)">${esc(c)}</small></span></div>`).join("")}</div>
      <div class="card"><h2 style="font-size:1.15rem">The plate rule</h2><p>Half vegetables and salad, a quarter protein, a quarter rice or bread.</p></div>`;
  }
  bindCommon(pb);
}

/* ---------- spin ---------- */
const KINDS = [["Any meal", MEAL], ["Filling", (r) => MEAL(r) && r.kcal > 260], ["Light", (r) => (MEAL(r) || r.type === "Snack" || r.type === "Salad") && r.kcal <= 260], ["Something sweet", (r) => r.type === "Sweet"]];
let spinKind = "Any meal", spinRegion = "Any cuisine", slots = [], rot = 0, spinning = false;
const shortName = (n) => { const s = n.replace(/\s*\(.*?\)\s*/g, "").replace(/^(Light|Healthy|Low-Oil|Easy|One-Pot)\s+/i, "").trim(); return s.length > 18 ? s.slice(0, 17) + "…" : s; };
const pool = () => { const k = KINDS.find((x) => x[0] === spinKind)[1]; return RECIPES.filter((r) => k(r) && (spinRegion === "Any cuisine" || REGION(r) === spinRegion)); };
function chipRow(id, opts, val, set) {
  $(id).innerHTML = opts.map((o) => `<button class="chip" data-v="${esc(o)}" aria-pressed="${o === val}">${esc(o)}</button>`).join("");
  $(id).querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => { if (!spinning) set(b.dataset.v); }));
}
function renderSpinControls() {
  chipRow("spin-kind", KINDS.map((k) => k[0]), spinKind, (v) => { spinKind = v; renderSpinControls(); buildWheel(); });
  chipRow("spin-origin", REGIONS, spinRegion, (v) => { spinRegion = v; renderSpinControls(); buildWheel(); });
}
function buildWheel() {
  const p = pool().slice();
  for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  slots = p.slice(0, 8);
  const w = $("wheel"), n = slots.length, r = 150;
  $("hub").textContent = pool().length;
  $("result").hidden = true;
  $("spin-btn").disabled = !n;
  if (!n) { w.innerHTML = `<circle r="150" class="s3"/><text class="t3" text-anchor="middle" y="-60">No recipes here</text>`; return; }
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
  const btn = $("spin-btn"); btn.disabled = true; btn.textContent = "Spinning…"; $("result").hidden = true;
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
  const btn = $("spin-btn"); btn.disabled = false; btn.textContent = "Spin again";
  const box = $("result");
  box.innerHTML = `<div class="result"><span class="tile ${TINT(r)}">${ART(r.id)}</span><div><p class="eyebrow">Tonight</p><h3>${esc(r.name)}</h3><p class="small muted num">${r.kcal} kcal · ${esc(r.time.replace(/ \+.*/, ""))}</p></div></div>
    <div class="row2"><button class="btn primary" id="res-cook">Cook this today</button><button class="btn soft" data-r="${r.id}">View recipe</button></div>`;
  box.hidden = false;
  $("res-cook").onclick = () => setPlan(r.id);
  bindCommon(box);
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
$("spin-btn").onclick = spin;

/* ---------- shopping ---------- */
const QUICK = ["Diapers", "Milk", "Eggs", "Bread", "Medicine", "Tissues", "Soap", "Rice", "Onions", "Baby food", "Yogurt", "Chicken"];
const shopSkip = new Set();
function renderShop() {
  const box = $("s-shop");
  if (!inFamily()) {
    box.innerHTML = `<div class="card"><h2 style="font-size:1.4rem">Shop together</h2><p class="muted">Sign in and create a family to share one shopping list, send requests to each other and get notifications.</p><button class="btn primary block" id="go-login">Sign in or create account</button></div>`;
    $("go-login").onclick = () => showAuth(true);
    return;
  }
  const others = S.members.filter((m) => m.user_id !== S.user.id);
  const open = S.shop.filter((x) => !x.bought), done = S.shop.filter((x) => x.bought).slice(0, 15);
  const unread = S.inbox.filter((x) => !x.read_at);
  box.innerHTML = `
    <div class="card">
      <form id="shop-add" class="addbar"><input class="field" id="shop-text" maxlength="200" placeholder="Add an item, e.g. diapers" aria-label="New item" autocomplete="off"><button class="btn primary">Add</button></form>
      <div class="chips">${QUICK.map((q) => `<button type="button" class="chip" data-q="${esc(q)}">+ ${esc(q)}</button>`).join("")}</div>
      ${others.length ? `<div class="notify-line">Notify ${others.map((o) => `<button type="button" class="person" data-u="${o.user_id}" aria-pressed="${!shopSkip.has(o.user_id)}"><span class="av">${initial(o.name)}</span>${esc(o.name)}</button>`).join("")}</div>` : `<p class="small muted">Invite your partner from the Family tab to notify them when you add something.</p>`}
    </div>
    <div class="card" style="gap:0">
      <div class="section-h" style="margin-bottom:6px"><h2>To buy</h2><span class="small muted num">${open.length}</span></div>
      <div class="list">${open.map((x) => `<div class="item" data-id="${x.id}"><button class="box" data-buy="${x.id}" aria-label="Mark ${esc(x.text)} as bought">✓</button><span class="tx">${esc(x.text)}<small>${esc(nameOf(x.added_by))}${x.recipe_id && R[x.recipe_id] ? " · " + esc(R[x.recipe_id].name) : ""}</small></span>${others.length ? `<button class="remind" data-ring="${x.id}" aria-label="Remind about ${esc(x.text)}">${ICON.bell}</button>` : "<span></span>"}</div>`).join("") || '<p class="empty">Nothing to buy. Nice.</p>'}</div>
      ${done.length ? `<details class="fold"><summary>Bought (${done.length})</summary><div class="list">${done.map((x) => `<div class="item got"><button class="box" data-buy="${x.id}" aria-label="Mark ${esc(x.text)} as not bought">✓</button><span class="tx">${esc(x.text)}<small>bought by ${esc(nameOf(x.bought_by))}</small></span><span></span></div>`).join("")}</div></details>` : ""}
    </div>
    <div class="card" style="gap:0">
      <div class="section-h" style="margin-bottom:6px"><h2>Messages</h2>${unread.length ? '<button class="link" id="read-all">Mark all read</button>' : ""}</div>
      ${S.inbox.slice(0, 12).map((n) => `<div class="msg${n.read_at ? "" : " new"}"><b>${esc(n.title)}</b><span class="small">${esc(n.body)}</span><small>${esc(nameOf(n.from_user))} · ${ago(n.created_at)}${n.recipe_id && R[n.recipe_id] ? ` · <button class="link" data-r="${n.recipe_id}" style="min-height:0">Open recipe</button>` : ""}</small></div>`).join("") || '<p class="muted small" style="padding:8px 0">No messages yet.</p>'}
    </div>`;
  bindCommon(box);
  box.querySelectorAll("[data-q]").forEach((b) => (b.onclick = () => { const i = $("shop-text"), v = i.value.trim(); i.value = v ? v + ", " + b.dataset.q : b.dataset.q; i.focus(); }));
  box.querySelectorAll(".notify-line [data-u]").forEach((b) => (b.onclick = () => { const u = b.dataset.u; shopSkip.has(u) ? shopSkip.delete(u) : shopSkip.add(u); b.setAttribute("aria-pressed", !shopSkip.has(u)); }));
  $("shop-add").onsubmit = async (e) => {
    e.preventDefault();
    const raw = $("shop-text").value.trim();
    if (!raw) return toast("Type what you need");
    const items = raw.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean).slice(0, 20);
    const to = others.map((o) => o.user_id).filter((u) => !shopSkip.has(u));
    $("shop-text").value = "";
    const { error } = await sb.from("shopping_items").insert(items.map((t) => ({ family_id: S.family.id, text: t.slice(0, 200), added_by: S.user.id, assigned_to: to[0] || null })));
    if (error) return toast("Couldn't add, try again");
    await loadShop(); refreshAll();
    logActivity(`added to the list: ${items.join(", ")}`);
    if (to.length) {
      const res = await sendNotify(to, items.length === 1 ? `Please buy: ${items[0]}` : `Please buy ${items.length} things`, `${myName()} added ${items.join(", ")}`, null);
      if (res) toast(res.sent ? "Added and notified" : "Added. They'll see it when they open the app.");
    } else toast("Added to the list");
  };
  box.querySelectorAll("[data-buy]").forEach((b) => (b.onclick = async () => {
    const it = S.shop.find((x) => x.id === b.dataset.buy); if (!it) return;
    it.bought = !it.bought; it.bought_by = it.bought ? S.user.id : null; refreshAll();
    await sb.from("shopping_items").update({ bought: it.bought, bought_by: it.bought_by }).eq("id", it.id);
    if (it.bought) { logActivity(`bought ${it.text}`); if (it.added_by !== S.user.id) sendNotify([it.added_by], "Bought", `${myName()} bought ${it.text}`, it.recipe_id); }
  }));
  box.querySelectorAll("[data-ring]").forEach((b) => (b.onclick = async () => {
    const it = S.shop.find((x) => x.id === b.dataset.ring); if (!it) return;
    const to = it.assigned_to && it.assigned_to !== S.user.id ? [it.assigned_to] : others.map((o) => o.user_id);
    b.disabled = true;
    const res = await sendNotify(to, `Reminder: ${it.text}`, `${myName()} reminded you this still needs buying.`, it.recipe_id);
    b.disabled = false;
    if (res) toast(`Reminded ${to.map(nameOf).join(", ")}`);
  }));
  const ra = $("read-all");
  if (ra) ra.onclick = async () => { const now = new Date().toISOString(); S.inbox.forEach((x) => (x.read_at = x.read_at || now)); refreshAll(); await sb.from("notifications").update({ read_at: now }).eq("to_user", S.user.id).is("read_at", null); };
}

/* ---------- family ---------- */
async function renderFamily() {
  const box = $("s-family");
  const rows = (items) => `<div class="card" style="gap:0;padding-block:6px">${items.join("")}</div>`;
  const rowlink = (sub, ic, t, s) => `<button class="rowlink" data-sub="${sub}"><span class="ic">${ic}</span><span>${t}${s ? `<small>${s}</small>` : ""}</span><span class="chev">${ICON.chev}</span></button>`;
  const common = [rowlink("plan", ICON.cal, "Weekly diet plan", "3 meals a day, no breakfast"), rowlink("kitchen", ICON.oven, "My kitchen", "Oven and air fryer settings"), rowlink("tips", ICON.bulb, "Healthy swaps", "Lighter versions of everyday habits")];
  if (!S.user) {
    box.innerHTML = `<div class="card"><h2 style="font-size:1.4rem">Cook together</h2><p class="muted">Share favourites, today's dish and one shopping list with your partner, and get notified when they need something.</p><button class="btn primary block" id="go-login2">Sign in or create account</button></div>${rows(common)}`;
    $("go-login2").onclick = () => showAuth(true);
  } else if (!S.family) {
    box.innerHTML = `<div class="card"><h2 style="font-size:1.4rem">No family yet</h2><button class="btn primary block" id="go-setup">Create or join a family</button></div>${rows(common)}`;
    $("go-setup").onclick = () => showSetup(true);
  } else {
    const ps = await pushState();
    const link = location.origin + location.pathname + "?join=" + S.family.code;
    box.innerHTML = `
      <div class="card fam-head">
        <div class="members">${S.members.map((m) => `<span class="av" title="${esc(m.name)}">${initial(m.name)}</span>`).join("")}</div>
        <div><h2 style="font-size:1.5rem">${esc(S.family.name)}</h2><p class="small muted">${S.members.map((m) => esc(m.user_id === S.user.id ? m.name + " (you)" : m.name)).join(" · ")}</p></div>
        <div class="note" style="display:grid;gap:8px"><span class="eyebrow">Invite code</span><span class="code num">${esc(S.family.code)}</span>
          <div class="row2"><button class="btn primary" id="inv-share">Invite partner</button><button class="btn ghost" id="inv-copy">Copy code</button></div></div>
      </div>
      ${rows([
        `<div class="rowlink" style="cursor:default"><span class="ic">${ICON.bell}</span><span>Notifications<small>${ps === "on" ? "On for this phone" : ps === "denied" ? "Blocked in phone settings" : ps === "unsupported" ? (/iphone|ipad/i.test(navigator.userAgent) ? "Add to Home Screen first, then open from the icon" : "Not supported in this browser") : "Get a ping when your partner needs something"}</small></span><button class="switch" id="push-sw" role="switch" aria-checked="${ps === "on"}" aria-label="Notifications"></button></div>`,
        rowlink("activity", ICON.clock, "Activity", S.activity[0] ? `${esc(nameOf(S.activity[0].user_id))} ${esc(S.activity[0].text)}` : "What everyone did"),
        `<button class="rowlink" data-cat-go="Favourites"><span class="ic">${ICON.heart}</span><span>Favourites<small>${S.favs.length ? `${new Set(S.favs.map((f) => f.recipe_id)).size} saved` : "Tap ♥ on any recipe"}</small></span><span class="chev">${ICON.chev}</span></button>`
      ])}
      ${rows(common)}
      ${rows([`<form class="rowlink" id="name-form" style="grid-template-columns:36px 1fr auto"><span class="ic">${ICON.user}</span><input class="field" id="my-name" maxlength="40" value="${esc(myName())}" aria-label="Your name" style="min-height:44px"><button class="link">Save</button></form>`,
        `<button class="rowlink" id="logout"><span class="ic">${ICON.chev}</span><span style="color:var(--chili);font-weight:600">Log out</span><span></span></button>`])}`;
    $("inv-copy").onclick = () => navigator.clipboard?.writeText(S.family.code).then(() => toast("Code copied"), () => toast(S.family.code));
    $("inv-share").onclick = async () => {
      const text = `Join our family in Deshi Diet Thala. Code: ${S.family.code}\n${link}`;
      if (navigator.share) { try { await navigator.share({ text }); return; } catch (e) { if (e.name === "AbortError") return; } }
      window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
    };
    $("push-sw").onclick = () => (ps === "on" ? testPush() : enablePush());
    $("name-form").onsubmit = async (e) => { e.preventDefault(); const n = $("my-name").value.trim(); if (!n) return; await sb.from("profiles").update({ name: n }).eq("id", S.user.id); await loadMembers(); refreshAll(); toast("Name saved"); };
    $("logout").onclick = async () => { await sb.auth.signOut(); location.reload(); };
  }
  bindCommon(box);
}
async function testPush() {
  const r = await sb.functions.invoke("notify", { body: { family_id: S.family.id, to: S.members.map((m) => m.user_id), title: "Test", body: "Notifications are working" } });
  toast(r.error ? "Couldn't send" : "Test sent to the rest of the family");
}

/* ---------- supabase data ---------- */
async function loadMembers() {
  const { data: mem } = await sb.from("family_members").select("user_id, role").eq("family_id", S.family.id);
  const ids = (mem || []).map((m) => m.user_id);
  const { data: profs } = await sb.from("profiles").select("id, name").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  S.members = (mem || []).map((m) => ({ ...m, name: (profs || []).find((p) => p.id === m.user_id)?.name || "Member" }));
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
  if (error) { toast("Couldn't send, try again"); return null; }
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
  if (st === "unsupported") return toast(/iphone|ipad/i.test(navigator.userAgent) ? "On iPhone: Share → Add to Home Screen, open the app from the icon, then try again." : "This browser can't show notifications. Try Chrome.");
  if ((await Notification.requestPermission()) !== "granted") return toast("Notifications not allowed");
  const reg = await navigator.serviceWorker.register("sw.js");
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(VAPID_PUBLIC) });
  const j = sub.toJSON();
  const { error } = await sb.from("push_subscriptions").upsert({ user_id: S.user.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth }, { onConflict: "endpoint" });
  toast(error ? "Couldn't turn on: " + error.message : "Notifications are on");
  renderFamily();
}

/* ---------- auth & setup ---------- */
function showAuth(show) { $("auth").hidden = !show; document.body.classList.toggle("lock", show); }
function showSetup(show) { $("setup").hidden = !show; document.body.classList.toggle("lock", show); }
function authMsg(t, ok) { const m = $("auth-msg"); m.textContent = t || ""; m.className = "auth-msg" + (ok ? " ok" : ""); }
function bindAuth() {
  document.querySelectorAll("[data-auth-tab]").forEach((b) => (b.onclick = () => {
    document.querySelectorAll("[data-auth-tab]").forEach((x) => x.setAttribute("aria-selected", x === b));
    ["login", "signup", "phone"].forEach((k) => ($("auth-" + k).hidden = b.dataset.authTab !== k));
    authMsg("");
  }));
  $("auth-login").onsubmit = async (e) => {
    e.preventDefault(); authMsg("Signing in…", true);
    const { error } = await sb.auth.signInWithPassword({ email: $("li-email").value.trim(), password: $("li-pass").value });
    if (error) authMsg(/confirm/i.test(error.message) ? "Please confirm your email first, using the link we sent." : "Wrong email or password.");
  };
  $("auth-signup").onsubmit = async (e) => {
    e.preventDefault();
    const kind = document.querySelector("input[name=su-kind]:checked")?.value || "family";
    authMsg("Creating your account…", true);
    const { data, error } = await sb.auth.signUp({ email: $("su-email").value.trim(), password: $("su-pass").value, options: { data: { name: $("su-name").value.trim(), kind }, emailRedirectTo: location.origin + location.pathname } });
    if (error) return authMsg(/registered/i.test(error.message) ? "That email already has an account. Log in instead." : "Couldn't create the account: " + error.message);
    if (!data.session) authMsg("Check your email and tap the link, then log in here.", true);
  };
  $("auth-google").onclick = async () => { const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname } }); if (error) authMsg("Google sign-in isn't switched on yet. Use email for now."); };
  $("auth-phone").onsubmit = async (e) => {
    e.preventDefault();
    const phone = $("ph-num").value.replace(/\s/g, "");
    if (!$("ph-code-row").hidden) { const { error } = await sb.auth.verifyOtp({ phone, token: $("ph-code").value.trim(), type: "sms" }); if (error) authMsg("That code isn't right."); return; }
    authMsg("Sending code…", true);
    const { error } = await sb.auth.signInWithOtp({ phone, options: { data: { name: $("ph-name").value.trim() } } });
    if (error) return authMsg("Phone sign-in isn't switched on yet. Use email for now.");
    $("ph-code-row").hidden = false; $("auth-phone").querySelector("button").textContent = "Verify code"; authMsg("Enter the 6-digit code from the SMS.", true);
  };
  $("auth-guest").onclick = () => { store.set("guest", "1"); showAuth(false); refreshAll(); };
  $("setup-create").onsubmit = async (e) => { e.preventDefault(); const { data, error } = await sb.rpc("create_family", { fam_name: $("fam-name").value, fam_kind: "family" }); if (error) return toast("Couldn't create: " + error.message); await afterFamily(data); };
  $("setup-join").onsubmit = async (e) => { e.preventDefault(); await joinWith($("fam-code").value); };
  $("setup-single").onclick = async () => { const { data, error } = await sb.rpc("create_family", { fam_name: "My kitchen", fam_kind: "single" }); if (error) return toast("Couldn't create: " + error.message); await afterFamily(data); };
}
async function joinWith(code) {
  const { data, error } = await sb.rpc("join_family", { join_code: code });
  if (error) { toast("That code didn't work"); return false; }
  store.set("pendingJoin", ""); await afterFamily(data); toast(`You joined ${data.name}`); return true;
}
async function afterFamily(fam) { S.family = fam; store.set("familyId", fam.id); showSetup(false); await loadAll(); subscribe(); refreshAll(); }

/* ---------- refresh ---------- */
function refreshAll() {
  renderHome(); renderRecipes(); renderShop(); renderFamily();
  const n = S.inbox.filter((x) => !x.read_at).length;
  $("bell-n").hidden = !n; $("bell-n").textContent = n;
  const dot = document.querySelector(".tab[data-tab=shop] .dotn"); if (dot) dot.hidden = !n;
  $("greet").textContent = tab === "home" ? greeting() : "";
  if (pageKind === "recipe") renderPage();
}

/* ---------- start ---------- */
async function start() {
  renderSpinControls(); buildWheel();
  bindAuth();
  const sp = new URLSearchParams(location.search);
  if (sp.get("join")) store.set("pendingJoin", sp.get("join"));
  const saved = store.get("tab");
  showTab(TITLES[sp.get("tab") === "bazar" ? "shop" : sp.get("tab")] ? (sp.get("tab") === "bazar" ? "shop" : sp.get("tab")) : TITLES[saved] ? saved : "home");
  refreshAll();
  if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
  if (!sb) return;
  const onSession = async (session) => {
    S.user = session?.user || null;
    if (!S.user) { S.family = null; if (!store.get("guest")) showAuth(true); refreshAll(); return; }
    showAuth(false);
    const pending = store.get("pendingJoin");
    if (pending && (await joinWith(pending))) return;
    const { data: mem } = await sb.from("family_members").select("family_id, families(*)").eq("user_id", S.user.id);
    const pick = (mem || []).find((m) => m.family_id === store.get("familyId")) || (mem || [])[0];
    if (pick?.families) await afterFamily(pick.families);
    else if (S.user.user_metadata?.kind === "single") { const { data } = await sb.rpc("create_family", { fam_name: "My kitchen", fam_kind: "single" }); if (data) await afterFamily(data); }
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
