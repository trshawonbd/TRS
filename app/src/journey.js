/* ================= "Our kitchen journey": what the family has cooked ================= */
// Cooked entries: Supabase cooked_log for a family, localStorage for a guest.
function localCooked() { try { return JSON.parse(store.get("cooked") || "[]"); } catch (e) { return []; } }
function cookedRows() { return inFamily() ? S.cooked : localCooked(); }
const cookedToday = (rid) => cookedRows().some((x) => x.recipe_id === rid && x.day === today());
const timesCooked = (rid) => cookedRows().filter((x) => x.recipe_id === rid).length;

async function loadCooked() {
  const { data } = await sb.from("cooked_log").select("recipe_id, day, cooked_by, created_at").eq("family_id", S.family.id).order("day", { ascending: false }).limit(2000);
  S.cooked = data || [];
}
async function loadPopularity() {
  const { data } = await sb.rpc("recipe_popularity");
  S.pop = new Map((data || []).map((x) => [x.recipe_id, Number(x.families)]));
}

const dayNum = (d) => Math.round(new Date(d + "T12:00:00").getTime() / 86400000);
function journeyStats() {
  const rows = cookedRows().filter((x) => R[x.recipe_id]);
  const tried = new Set(rows.map((x) => x.recipe_id));
  (inFamily() ? S.photoList || [] : []).forEach((p) => R[p.recipe_id] && tried.add(p.recipe_id));
  const days = [...new Set(rows.map((x) => dayNum(x.day)))].sort((a, b) => a - b);
  let best = 0, run = 0;
  days.forEach((d, i) => { run = i && d === days[i - 1] + 1 ? run + 1 : 1; best = Math.max(best, run); });
  const t = dayNum(today());
  let streak = 0;
  if (days.includes(t) || days.includes(t - 1)) { let d = days.includes(t) ? t : t - 1; while (days.includes(d)) { streak++; d--; } }
  const saved = rows.reduce((a, x) => { const r = R[x.recipe_id]; return a + Math.max(0, r.reg - r.kcal) * (r.base || 2); }, 0);
  const cuisines = new Map();
  tried.forEach((id) => cuisines.set(R[id].origin, (cuisines.get(R[id].origin) || 0) + 1));
  const weeks = Array.from({ length: 8 }, (_, i) => ({ start: t - (7 - i) * 7 - ((new Date().getDay() + 6) % 7), n: 0 }));
  rows.forEach((x) => { const d = dayNum(x.day); const w = weeks.find((w, i) => d >= w.start && (i === 7 || d < weeks[i + 1].start)); if (w && d <= t) w.n++; });
  const byCook = new Map();
  rows.forEach((x) => x.cooked_by && byCook.set(x.cooked_by, (byCook.get(x.cooked_by) || 0) + 1));
  return { rows, tried, times: rows.length, streak, best, saved, cuisines, weeks, byCook, photos: inFamily() ? (S.photoList || []).length : 0 };
}
const BADGES = () => [
  ["🍳", tr("First dish", "প্রথম রান্না"), (s) => s.tried.size, 1],
  ["🥗", tr("5 recipes", "৫টি রেসিপি"), (s) => s.tried.size, 5],
  ["🏅", tr("10 recipes", "১০টি রেসিপি"), (s) => s.tried.size, 10],
  ["🏆", tr("25 recipes", "২৫টি রেসিপি"), (s) => s.tried.size, 25],
  ["👑", tr("50 recipes", "৫০টি রেসিপি"), (s) => s.tried.size, 50],
  ["🧭", tr("5 cuisines", "৫ দেশের রান্না"), (s) => s.cuisines.size, 5],
  ["🌍", tr("10 cuisines", "১০ দেশের রান্না"), (s) => s.cuisines.size, 10],
  ["📸", tr("5 photos", "৫টি ছবি"), (s) => s.photos, 5],
  ["🔥", tr("7-day streak", "টানা ৭ দিন"), (s) => s.best, 7],
  ["🪶", tr("5,000 kcal lighter", "৫,০০০ ক্যালরি কম"), (s) => s.saved, 5000]
];
const earnedBadges = (s) => BADGES().filter(([, , f, goal]) => f(s) >= goal).map((b) => b[1]);
const fmtBig = (n) => N(Math.round(n).toLocaleString("en-US"));

async function markCooked(rid) {
  const r = R[rid]; if (!r) return;
  const before = earnedBadges(journeyStats());
  if (!cookedToday(rid)) {
    const row = { recipe_id: rid, day: today(), cooked_by: S.user?.id || null, created_at: new Date().toISOString() };
    if (!inFamily()) store.set("cooked", JSON.stringify([row, ...localCooked()]));
    else {
      S.cooked = [row, ...S.cooked];
      const { error } = await sb.from("cooked_log").insert({ family_id: S.family.id, recipe_id: rid, day: today() });
      if (error && error.code !== "23505") { S.cooked = S.cooked.filter((x) => x !== row); refreshAll(); return toast(tr("Couldn't save, try again", "সেভ হয়নি, আবার চেষ্টা করুন")); }
      logActivity(tr(`cooked ${r.name}`, `রান্না করেছেন: ${r.name}`));
    }
  }
  refreshAll();
  const s = journeyStats(), fresh = earnedBadges(s).filter((b) => !before.includes(b));
  toast(fresh.length ? tr(`New badge: ${fresh[0]}!`, `নতুন ব্যাজ: ${fresh[0]}!`) : tr(`Well done! ${s.tried.size} recipes tried so far.`, `দারুণ! এ পর্যন্ত ${N(s.tried.size)}টি রেসিপি রান্না হলো।`));
}
async function unmarkCooked(rid, day) {
  if (!inFamily()) { store.set("cooked", JSON.stringify(localCooked().filter((x) => !(x.recipe_id === rid && x.day === day)))); refreshAll(); return; }
  S.cooked = S.cooked.filter((x) => !(x.recipe_id === rid && x.day === day && x.cooked_by === S.user.id));
  refreshAll();
  await sb.from("cooked_log").delete().match({ family_id: S.family.id, recipe_id: rid, day, cooked_by: S.user.id });
}

/* small card on the Today screen */
function journeyCard() {
  const s = journeyStats(), pics = inFamily() ? (S.photoList || []).filter((p) => p.url).slice(0, 4) : [];
  return `<button class="card journey-card" data-sub="journey">
    <span class="jc-top"><span class="eyebrow">${tr("Our kitchen journey", "আমাদের রান্নার খাতা")}</span><span class="chev">${ICON.chev}</span></span>
    <span class="jc-stats num"><span><b>${N(s.tried.size)}</b>${tr("recipes tried", "রেসিপি রান্না")}</span><span><b>${N(s.streak)}</b>${tr("day streak", "দিন টানা")}</span><span><b>${N(earnedBadges(s).length)}</b>${tr("badges", "ব্যাজ")}</span></span>
    ${pics.length ? `<span class="jc-pics">${pics.map((p) => `<img src="${esc(p.url)}" alt="" loading="lazy">`).join("")}</span>` : s.tried.size ? "" : `<span class="small muted">${tr("Tap “We cooked it” after a meal to start your journey.", "রান্নার পর “রান্না হয়েছে” চাপুন, এখান থেকেই খাতা শুরু।")}</span>`}
  </button>`;
}

/* the full dashboard page */
function renderJourney(pb) {
  const s = journeyStats(), total = RECIPES.length, pct = Math.round((s.tried.size / total) * 100);
  const allCuisines = [...new Set(RECIPES.map((r) => r.origin))];
  const wmax = Math.max(1, ...s.weeks.map((w) => w.n));
  const wlabel = (w) => { const d = new Date(w.start * 86400000); return N(d.getDate() + "/" + (d.getMonth() + 1)); };
  const cooks = [...s.byCook.entries()].sort((a, b) => b[1] - a[1]);
  const cmax = Math.max(1, ...cooks.map((c) => c[1]));
  const photos = inFamily() ? (S.photoList || []).filter((p) => p.url) : [];
  const recent = s.rows.slice(0, 8);
  const fmtDay = (d) => new Date(d + "T12:00:00").toLocaleDateString(BNL ? "bn-BD" : "en-GB", { day: "numeric", month: "short" });
  pb.innerHTML = `
    <div class="r-title"><p class="eyebrow">${tr("Our kitchen journey", "আমাদের রান্নার খাতা")}</p><h1>${esc(inFamily() ? S.family.name : tr("Your kitchen", "আপনার রান্নাঘর"))}</h1></div>
    <div class="card j-hero">
      <div class="j-big num"><b>${N(s.tried.size)}</b><span>${tr(`of ${total} recipes tried`, `${N(total)}টি রেসিপির মধ্যে রান্না হয়েছে`)}</span></div>
      <div class="meter" role="meter" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${s.tried.size}" aria-label="${tr("Recipes tried", "রান্না করা রেসিপি")}"><i style="width:${Math.max(pct, s.tried.size ? 2 : 0)}%"></i></div>
      <p class="small muted num">${tr(`${pct}% of the book. ${total - s.tried.size} still to discover.`, `বইয়ের ${N(pct)}%। আরও ${N(total - s.tried.size)}টি বাকি।`)}</p>
    </div>
    <div class="kpis num">
      <div class="card"><span class="eyebrow">${tr("Times cooked", "মোট রান্না")}</span><b>${N(s.times)}</b></div>
      <div class="card"><span class="eyebrow">${tr("Day streak", "টানা দিন")}</span><b>${N(s.streak)}${s.streak ? " 🔥" : ""}</b><small>${tr(`best ${s.best}`, `সেরা ${N(s.best)}`)}</small></div>
      <div class="card"><span class="eyebrow">${tr("Lighter than usual", "সাধারণের চেয়ে কম")}</span><b>${fmtBig(s.saved)}</b><small>${tr("kcal saved", "ক্যালরি বাঁচল")}</small></div>
      <div class="card"><span class="eyebrow">${tr("Photos", "ছবি")}</span><b>${N(s.photos)}</b></div>
    </div>
    <div class="card">
      <div class="section-h"><h2 style="font-size:1.15rem">${tr("Photo wall", "ছবির দেয়াল")}</h2></div>
      ${photos.length ? `<div class="wall">${photos.slice(0, 30).map((p) => `<button data-r="${p.recipe_id}" aria-label="${esc(R[p.recipe_id]?.name || "")}"><img src="${esc(p.url)}" alt="" loading="lazy"></button>`).join("")}</div>`
        : `<p class="muted small">${inFamily() ? tr("Open a recipe you cooked and tap “Add your photo”. Every photo lands here.", "যে রেসিপি রাঁধলেন সেটা খুলে “আপনার ছবি দিন” চাপুন। সব ছবি এখানে জমা হবে।") : tr("Sign in to add photos and share them with your family.", "ছবি দিতে আর পরিবারের সাথে দেখতে লগ ইন করুন।")}</p>`}
    </div>
    <div class="card">
      <div class="section-h"><h2 style="font-size:1.15rem">${tr("Last 8 weeks", "গত ৮ সপ্তাহ")}</h2><span class="small muted">${tr("meals cooked", "রান্না")}</span></div>
      <div class="cols" role="img" aria-label="${esc(s.weeks.map((w) => wlabel(w) + ": " + w.n).join(", "))}">${s.weeks.map((w) => `<div class="col" title="${esc(tr(`Week from ${wlabel(w)}: ${w.n} cooked`, `${wlabel(w)} থেকে সপ্তাহে: ${N(w.n)}টি রান্না`))}"><span class="v num">${w.n ? N(w.n) : ""}</span><i style="height:${w.n ? Math.max(6, (w.n / wmax) * 100) : 0}%"></i><span class="l num">${wlabel(w)}</span></div>`).join("")}</div>
    </div>
    ${inFamily() && cooks.length ? `<div class="card"><div class="section-h"><h2 style="font-size:1.15rem">${tr("Who cooked", "কে রেঁধেছেন")}</h2></div>
      <div class="hbars">${cooks.map(([u, n]) => `<div class="hbar" title="${esc(nameOf(u))}: ${N(n)}"><span class="who">${esc(nameOf(u))}</span><span class="track"><i style="width:${(n / cmax) * 100}%"></i></span><span class="n num">${N(n)}</span></div>`).join("")}</div></div>` : ""}
    <div class="card">
      <div class="section-h"><h2 style="font-size:1.15rem">${tr("Cuisines explored", "যত দেশের রান্না")}</h2><span class="small muted num">${tr(`${s.cuisines.size} of ${allCuisines.length}`, `${N(allCuisines.length)}টির মধ্যে ${N(s.cuisines.size)}টি`)}</span></div>
      <div class="wrapchips">${allCuisines.map((o) => `<span class="cz${s.cuisines.has(o) ? " on" : ""}">${esc(tOrigin(o))}${s.cuisines.has(o) ? ` <b class="num">${N(s.cuisines.get(o))}</b>` : ""}</span>`).join("")}</div>
    </div>
    <div class="card">
      <div class="section-h"><h2 style="font-size:1.15rem">${tr("Badges", "ব্যাজ")}</h2><span class="small muted num">${N(earnedBadges(s).length)} / ${N(BADGES().length)}</span></div>
      <div class="badges">${BADGES().map(([ic, name, f, goal]) => { const v = f(s), ok = v >= goal; return `<div class="bdg${ok ? " on" : ""}"><span class="ic">${ic}</span><b>${esc(name)}</b><small class="num">${ok ? tr("Earned", "পেয়েছেন") : `${fmtBig(Math.min(v, goal))} / ${fmtBig(goal)}`}</small></div>`; }).join("")}</div>
    </div>
    ${recent.length ? `<div class="card" style="gap:0"><div class="section-h" style="margin-bottom:6px"><h2 style="font-size:1.15rem">${tr("Recently cooked", "সম্প্রতি রান্না")}</h2></div>
      ${recent.map((x) => `<div class="act recent"><span class="tile ${TINT(R[x.recipe_id])}">${PIC(x.recipe_id)}</span><button class="link-plain" data-r="${x.recipe_id}"><b>${esc(R[x.recipe_id].name)}</b><small>${fmtDay(x.day)}${inFamily() && x.cooked_by ? " · " + esc(nameOf(x.cooked_by)) : ""}</small></button>${!inFamily() || x.cooked_by === S.user?.id ? `<button class="iconbtn undo" data-undo="${x.recipe_id}|${x.day}" aria-label="${tr("Remove", "সরান")}">✕</button>` : "<span></span>"}</div>`).join("")}</div>` : ""}`;
  pb.querySelectorAll("[data-undo]").forEach((b) => (b.onclick = () => { const [rid, day] = b.dataset.undo.split("|"); if (window.confirm(tr("Remove this from your journey?", "খাতা থেকে এটা সরাবেন?"))) unmarkCooked(rid, day); }));
}
