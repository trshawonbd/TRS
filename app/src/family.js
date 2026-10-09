
/* ---------- family mode: auth, shared state, notifications ---------- */
const SB_URL = "https://fschjgkvvjcwfpbgwiei.supabase.co";
const SB_KEY = "sb_publishable_mf_sr2nS345glCGeovJJkw_vxP9V3lC";
const VAPID_PUBLIC = "BIckWfK5nY56lXMgy0DypwZ-XXGc3gyhsEfSHlAqnox8rDmaV5SEzknH4LrXtx4GAawonxH2fgPTnsAcmSaG5WM";
const sb = window.supabase ? window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, detectSessionInUrl: true, flowType: "pkce" } }) : null;
var S = { user: null, family: null, members: [], favs: [], plan: null, ing: new Map(), shop: [], inbox: [], activity: [], channel: null };
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
function inFamily() { return !!(S && S.user && S.family); }
const nameOf = (uid) => (uid === S.user?.id ? "আপনি" : (S.members.find((m) => m.user_id === uid)?.name || "পরিবারের কেউ"));
const ago = (t) => {
  const s = Math.max(0, (Date.now() - new Date(t).getTime()) / 1000);
  if (s < 60) return "এইমাত্র";
  if (s < 3600) return `${bn(Math.floor(s / 60))} মিনিট আগে`;
  if (s < 86400) return `${bn(Math.floor(s / 3600))} ঘণ্টা আগে`;
  return `${bn(Math.floor(s / 86400))} দিন আগে`;
};
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.h);
  toast.h = setTimeout(() => (t.hidden = true), 2600);
}

/* favorites (local when not in a family) */
function localFavs() { try { return JSON.parse(store.get("favs") || "[]"); } catch (e) { return []; } }
function FAV_IDS(mineOnly) {
  if (!inFamily()) return new Set(localFavs());
  return new Set(S.favs.filter((f) => !mineOnly || f.user_id === S.user.id).map((f) => f.recipe_id));
}
async function toggleFav(rid) {
  if (!inFamily()) {
    const f = new Set(localFavs());
    f.has(rid) ? f.delete(rid) : f.add(rid);
    store.set("favs", JSON.stringify([...f]));
    refreshAll();
    return;
  }
  const mine = S.favs.find((f) => f.user_id === S.user.id && f.recipe_id === rid);
  if (mine) {
    S.favs = S.favs.filter((f) => f !== mine);
    refreshAll();
    await sb.from("favorites").delete().match({ family_id: S.family.id, user_id: S.user.id, recipe_id: rid });
  } else {
    S.favs.push({ user_id: S.user.id, recipe_id: rid });
    refreshAll();
    await sb.from("favorites").insert({ family_id: S.family.id, user_id: S.user.id, recipe_id: rid });
    logActivity(`${R[rid].name} পছন্দ করেছেন`);
  }
}

/* ---------- auth screens ---------- */
function showAuth(show) { $("auth").hidden = !show; document.body.classList.toggle("lock", show); }
function authMsg(t, ok) { const m = $("auth-msg"); m.textContent = t || ""; m.className = "auth-msg" + (ok ? " ok" : ""); }
function bindAuth() {
  document.querySelectorAll("[data-auth-tab]").forEach((b) => (b.onclick = () => {
    document.querySelectorAll("[data-auth-tab]").forEach((x) => x.setAttribute("aria-selected", x === b));
    $("auth-login").hidden = b.dataset.authTab !== "login";
    $("auth-signup").hidden = b.dataset.authTab !== "signup";
    $("auth-phone").hidden = b.dataset.authTab !== "phone";
    authMsg("");
  }));
  $("auth-login").onsubmit = async (e) => {
    e.preventDefault();
    authMsg("লগইন হচ্ছে…", true);
    const { error } = await sb.auth.signInWithPassword({ email: $("li-email").value.trim(), password: $("li-pass").value });
    if (error) authMsg(error.message.includes("confirm") ? "ইমেইলে পাঠানো লিংকে চাপ দিয়ে আগে অ্যাকাউন্ট নিশ্চিত করুন।" : "ইমেইল বা পাসওয়ার্ড ঠিক নেই।");
  };
  $("auth-signup").onsubmit = async (e) => {
    e.preventDefault();
    const kind = document.querySelector("input[name=su-kind]:checked")?.value || "family";
    if ($("su-pass").value.length < 6) return authMsg("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের দিন।");
    authMsg("অ্যাকাউন্ট তৈরি হচ্ছে…", true);
    const { data, error } = await sb.auth.signUp({
      email: $("su-email").value.trim(), password: $("su-pass").value,
      options: { data: { name: $("su-name").value.trim(), kind }, emailRedirectTo: location.origin + location.pathname }
    });
    if (error) return authMsg(error.message.includes("registered") ? "এই ইমেইলে আগেই অ্যাকাউন্ট আছে, লগইন করুন।" : "অ্যাকাউন্ট তৈরি হয়নি: " + error.message);
    if (!data.session) authMsg("আপনার ইমেইলে একটা লিংক পাঠানো হয়েছে। লিংকে চাপ দিয়ে তারপর এখানে লগইন করুন।", true);
  };
  $("auth-google").onclick = async () => {
    const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname } });
    if (error) authMsg("Google লগইন এখনো চালু হয়নি। ইমেইল দিয়ে চেষ্টা করুন।");
  };
  $("auth-phone").onsubmit = async (e) => {
    e.preventDefault();
    const phone = $("ph-num").value.replace(/\s/g, "");
    if (!$("ph-code-row").hidden) {
      const { error } = await sb.auth.verifyOtp({ phone, token: $("ph-code").value.trim(), type: "sms" });
      if (error) authMsg("কোডটা ঠিক নয়, আবার দেখুন।");
      return;
    }
    authMsg("কোড পাঠানো হচ্ছে…", true);
    const { error } = await sb.auth.signInWithOtp({ phone, options: { data: { name: $("ph-name").value.trim() } } });
    if (error) return authMsg("ফোন দিয়ে লগইন এখনো চালু হয়নি। ইমেইল দিয়ে চেষ্টা করুন।");
    $("ph-code-row").hidden = false;
    authMsg("SMS-এ আসা ৬ অঙ্কের কোড দিন।", true);
  };
  $("auth-guest").onclick = () => { store.set("guest", "1"); showAuth(false); refreshAll(); };
}

/* ---------- family setup ---------- */
function showSetup(show) { $("setup").hidden = !show; document.body.classList.toggle("lock", show); }
function bindSetup() {
  $("setup-create").onsubmit = async (e) => {
    e.preventDefault();
    const { data, error } = await sb.rpc("create_family", { fam_name: $("fam-name").value, fam_kind: "family" });
    if (error) return toast("পরিবার তৈরি হয়নি: " + error.message);
    await afterFamily(data);
  };
  $("setup-join").onsubmit = async (e) => {
    e.preventDefault();
    await joinWith($("fam-code").value);
  };
  $("setup-single").onclick = async () => {
    const { data, error } = await sb.rpc("create_family", { fam_name: "আমার রান্নাঘর", fam_kind: "single" });
    if (error) return toast("হয়নি: " + error.message);
    await afterFamily(data);
  };
}
async function joinWith(code) {
  const { data, error } = await sb.rpc("join_family", { join_code: code });
  if (error) { toast(error.message.includes("কোড") ? "কোডটা ঠিক নয়" : "যোগ দেওয়া যায়নি"); return false; }
  store.set("pendingJoin", "");
  await afterFamily(data);
  toast(`${data.name}-এ যোগ দিয়েছেন`);
  return true;
}
async function afterFamily(fam) {
  S.family = fam;
  store.set("familyId", fam.id);
  showSetup(false);
  await loadAll();
  subscribe();
  refreshAll();
}

/* ---------- loading ---------- */
async function loadMembers() {
  const { data: mem } = await sb.from("family_members").select("user_id, role").eq("family_id", S.family.id);
  const ids = (mem || []).map((m) => m.user_id);
  const { data: profs } = await sb.from("profiles").select("id, name").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  S.members = (mem || []).map((m) => ({ ...m, name: (profs || []).find((p) => p.id === m.user_id)?.name || "সদস্য" }));
}
async function loadFavs() { const { data } = await sb.from("favorites").select("user_id, recipe_id").eq("family_id", S.family.id); S.favs = data || []; }
async function loadPlan() { const { data } = await sb.from("cook_plans").select("*").eq("family_id", S.family.id).eq("day", today()).maybeSingle(); S.plan = data || null; }
async function loadIng() {
  const { data } = await sb.from("ingredient_status").select("recipe_id, idx, status, updated_by").eq("family_id", S.family.id).eq("day", today());
  S.ing = new Map((data || []).map((x) => [`${x.recipe_id}:${x.idx}`, x]));
}
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
  Object.keys(reload).forEach((tbl) => {
    ch = ch.on("postgres_changes", { event: "*", schema: "public", table: tbl, filter: f }, async () => { await reload[tbl](); refreshAll(); });
  });
  ch = ch.on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `to_user=eq.${S.user.id}` }, async (p) => {
    await loadInbox();
    refreshAll();
    if (p.eventType === "INSERT") toast("নতুন বার্তা: " + p.new.title);
  });
  S.channel = ch.subscribe();
}

/* ---------- actions ---------- */
async function logActivity(text) { if (inFamily()) await sb.from("activity").insert({ family_id: S.family.id, user_id: S.user.id, text: text.slice(0, 300) }); }
async function sendNotify(to, title, body, recipe_id) {
  if (!inFamily()) return { stored: 0 };
  const { data, error } = await sb.functions.invoke("notify", { body: { family_id: S.family.id, to, title, body, recipe_id } });
  if (error) { toast("জানানো যায়নি, আবার চেষ্টা করুন"); return null; }
  return data;
}
async function setPlan(rid) {
  if (!inFamily()) { store.set("plan-" + today(), rid); toast("আজকের রান্না: " + R[rid].name); refreshAll(); return; }
  S.plan = { family_id: S.family.id, day: today(), recipe_id: rid, picked_by: S.user.id };
  refreshAll();
  const { error } = await sb.from("cook_plans").upsert({ family_id: S.family.id, day: today(), recipe_id: rid, picked_by: S.user.id, picked_at: new Date().toISOString() });
  if (error) return toast("সেভ হয়নি");
  toast("আজকের রান্না: " + R[rid].name);
  logActivity(`আজ রাঁধবেন ঠিক করেছেন: ${R[rid].name}`);
  const others = S.members.filter((m) => m.user_id !== S.user.id).map((m) => m.user_id);
  if (others.length) sendNotify(others, "আজকের রান্না ঠিক হয়েছে", `${myName()} বেছেছেন: ${R[rid].name}`, rid);
}
const QUICK = ["ডায়াপার", "দুধ", "ডিম", "পাউরুটি", "ওষুধ", "টিস্যু", "সাবান", "চাল", "পেঁয়াজ", "শিশুর খাবার"];
const shopSkip = new Set();
const myName = () => S.members.find((m) => m.user_id === S.user?.id)?.name || "পরিবারের সদস্য";
const localIng = () => { try { return JSON.parse(store.get("ing-" + today()) || "{}"); } catch (e) { return {}; } };
function ingStatus(rid, idx) {
  if (!inFamily()) return localIng()[`${rid}:${idx}`] ? { status: localIng()[`${rid}:${idx}`] } : null;
  return S.ing.get(`${rid}:${idx}`) || null;
}
async function setIng(rid, idx, status) {
  const cur = ingStatus(rid, idx);
  const next = cur && cur.status === status ? null : status;
  if (!inFamily()) {
    const m = localIng();
    if (next) m[`${rid}:${idx}`] = next; else delete m[`${rid}:${idx}`];
    store.set("ing-" + today(), JSON.stringify(m));
    renderSheet();
    return;
  }
  const key = `${rid}:${idx}`;
  if (next) S.ing.set(key, { recipe_id: rid, idx, status: next, updated_by: S.user.id }); else S.ing.delete(key);
  renderSheet();
  const q = { family_id: S.family.id, day: today(), recipe_id: rid, idx };
  if (next) await sb.from("ingredient_status").upsert({ ...q, status: next, updated_by: S.user.id, updated_at: new Date().toISOString() });
  else await sb.from("ingredient_status").delete().match(q);
}
const ingText = (r, i) => { const [q, u, t] = r.ing[i]; return (q == null ? "" : fmtQty(q) + " " + u + " ") + t; };
const neededOf = (r) => r.ing.map((_, i) => i).filter((i) => ingStatus(r.id, i)?.status === "need");

/* ---------- share image ---------- */
async function shareCard(r, items, heading) {
  const W = 1080, H = 1350, c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  await document.fonts.ready;
  g.fillStyle = "#0F2418"; g.fillRect(0, 0, W, H);
  const img = new Image();
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(ART(r.id).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" '));
  await new Promise((ok) => { img.onload = ok; img.onerror = ok; });
  g.fillStyle = "#18351F"; g.beginPath(); g.arc(W / 2, 330, 250, 0, Math.PI * 2); g.fill();
  try { g.drawImage(img, W / 2 - 220, 110, 440, 440); } catch (e) {}
  g.textAlign = "center";
  g.fillStyle = "#F0B53E"; g.font = "600 40px 'Hind Siliguri', sans-serif"; g.fillText(heading, W / 2, 650);
  g.fillStyle = "#F5F1E4"; g.font = "64px 'Tiro Bangla', serif"; g.fillText(r.name, W / 2, 740);
  g.textAlign = "left"; g.font = "40px 'Hind Siliguri', sans-serif";
  items.slice(0, 9).forEach((t, i) => { g.fillStyle = "#F5F1E4"; g.fillText("•  " + t, 120, 840 + i * 56); });
  g.textAlign = "center"; g.fillStyle = "#F0B53E"; g.font = "700 36px 'Hind Siliguri', sans-serif"; g.fillText("দেশি ডায়েট থালা", W / 2, H - 60);
  const blob = await new Promise((ok) => c.toBlob(ok, "image/png"));
  const file = new File([blob], "deshi-diet.png", { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: r.name }); return; } catch (e) { if (e.name === "AbortError") return; }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "deshi-diet-" + r.id + ".png";
  document.body.appendChild(a); a.click(); a.remove();
  toast("ছবি সেভ হয়েছে");
}

/* ---------- notify modal ---------- */
function openNotify(r) {
  const need = neededOf(r);
  const others = S.members.filter((m) => m.user_id !== S.user?.id);
  const m = $("modal");
  m.innerHTML = `<div class="mcard" role="dialog" aria-label="জানান">
    <h3>যা নেই, জানিয়ে দিন</h3>
    <p class="muted" style="font-size:.9rem">${esc(r.name)} রাঁধতে এগুলো লাগবে:</p>
    <div class="mlist">${need.map((i) => `<label><input type="checkbox" checked data-i="${i}"> ${esc(ingText(r, i))}</label>`).join("") || '<p class="muted">উপকরণের পাশে "নেই" চাপুন, তারপর এখানে আসবে।</p>'}</div>
    ${inFamily() ? (others.length ? `<p class="lbl" style="margin:0">কাকে জানাবেন</p><div class="mlist">${others.map((o) => `<label><input type="checkbox" checked data-u="${o.user_id}"> ${esc(o.name)}</label>`).join("")}</div>`
      : `<p class="note">পরিবারে এখনো আর কেউ যোগ দেননি। "পরিবার" ট্যাব থেকে কোড পাঠিয়ে আমন্ত্রণ জানান।</p>`) : `<p class="note">লগইন করে পরিবার বানালে সরাসরি নোটিফিকেশন পাঠানো যাবে। এখন WhatsApp বা ছবি দিয়ে পাঠান।</p>`}
    <div class="mact">
      ${inFamily() && others.length ? '<button class="pbtn" id="m-send">জানান ও বাজারের তালিকায় তুলুন</button>' : ""}
      <button class="sbtn" id="m-wa">WhatsApp-এ পাঠান</button>
      <button class="sbtn" id="m-img">ছবি হিসেবে শেয়ার</button>
      <button class="link" id="m-close">বন্ধ করুন</button>
    </div></div>`;
  m.hidden = false;
  const picked = () => [...m.querySelectorAll("input[data-i]:checked")].map((x) => ingText(r, +x.dataset.i));
  $("m-close").onclick = () => (m.hidden = true);
  m.onclick = (e) => { if (e.target === m) m.hidden = true; };
  $("m-wa").onclick = () => {
    const items = picked();
    const text = `${r.name} রাঁধতে এগুলো লাগবে:\n${items.map((x) => "• " + x).join("\n")}\n\nদেশি ডায়েট থালা`;
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
  };
  $("m-img").onclick = () => shareCard(r, picked(), "বাজার লাগবে");
  const send = $("m-send");
  if (send) send.onclick = async () => {
    const items = picked();
    const to = [...m.querySelectorAll("input[data-u]:checked")].map((x) => x.dataset.u);
    if (!items.length) return toast("কোনো জিনিস বাছাই করা নেই");
    if (!to.length) return toast("কাকে জানাবেন বাছুন");
    send.disabled = true;
    await sb.from("shopping_items").insert(items.map((t) => ({ family_id: S.family.id, text: t.slice(0, 200), recipe_id: r.id, added_by: S.user.id, assigned_to: to[0] })));
    const res = await sendNotify(to, `বাজার লাগবে: ${r.name}`, items.join(", "), r.id);
    logActivity(`${r.name}-এর জন্য ${bn(items.length)}টা জিনিস চেয়েছেন`);
    m.hidden = true;
    if (res) toast(res.sent ? "জানানো হয়েছে, ফোনে নোটিফিকেশন গেছে" : "জানানো হয়েছে। ওনার ফোনে নোটিফিকেশন চালু নেই, অ্যাপ খুললে দেখবেন।");
  };
}

/* ---------- push ---------- */
const b64u = (s) => { const p = "=".repeat((4 - (s.length % 4)) % 4); const b = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...b].map((ch) => ch.charCodeAt(0))); };
async function pushState() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg && (await reg.pushManager.getSubscription());
  return sub ? "on" : "off";
}
async function enablePush() {
  const st = await pushState();
  if (st === "unsupported") {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    return toast(ios ? "iPhone-এ আগে Share → Add to Home Screen করে অ্যাপ হিসেবে খুলুন, তারপর আবার চাপুন।" : "এই ব্রাউজারে নোটিফিকেশন চলে না। Chrome দিয়ে খুলুন।");
  }
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return toast("নোটিফিকেশনের অনুমতি দেওয়া হয়নি");
  const reg = await navigator.serviceWorker.register("sw.js");
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(VAPID_PUBLIC) });
  const j = sub.toJSON();
  const { error } = await sb.from("push_subscriptions").upsert({ user_id: S.user.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth }, { onConflict: "endpoint" });
  toast(error ? "সেভ হয়নি: " + error.message : "নোটিফিকেশন চালু হয়েছে");
  renderFamily();
}

/* ---------- render: today card, bazar, family ---------- */
function refreshAll() {
  renderCook(); renderBazar(); renderFamily(); renderBadge();
  if (typeof renderRecipes === "function") renderRecipes();
  if (cur && document.getElementById("sheet").classList.contains("open")) renderSheet();
}
function planRid() { return inFamily() ? S.plan?.recipe_id : store.get("plan-" + today()); }
function renderCook() {
  const box = $("cook");
  if (!box) return;
  const rid = planRid();
  if (!rid || !R[rid]) {
    box.innerHTML = `<div><b>আজ কী রাঁধবেন, এখনো ঠিক হয়নি</b><p class="muted" style="font-size:.9rem">চাকা ঘুরিয়ে বা রেসিপি থেকে বেছে "আজ এটা রাঁধব" চাপুন${inFamily() ? ", পরিবারের সবাই দেখতে পাবে" : ""}।</p></div>
      <div class="cook-acts"><button class="pbtn" data-goto="spin">চাকা ঘোরান</button><button class="sbtn" data-goto="recipes">রেসিপি দেখুন</button></div>`;
  } else {
    const r = R[rid];
    const have = r.ing.filter((_, i) => ingStatus(rid, i)?.status === "have").length, need = neededOf(r).length;
    box.innerHTML = `<div class="cook-top"><span class="thumb">${ART(rid)}</span><div style="min-width:0"><p class="lbl">আজকের রান্না</p><h3>${esc(r.name)}</h3>
      ${inFamily() ? `<p class="muted" style="font-size:.88rem">বেছেছেন: ${esc(nameOf(S.plan.picked_by))}</p>` : ""}
      <p class="num" style="font-size:.9rem"><span class="okc">আছে ${bn(have)}</span> · <span class="noc">নেই ${bn(need)}</span> · বাকি ${bn(r.ing.length - have - need)}</p></div></div>
      <div class="cook-acts"><button class="pbtn" id="cook-open">উপকরণ মিলিয়ে নিন</button><button class="sbtn" data-goto="spin">বদলান</button></div>`;
    $("cook-open").onclick = () => openRecipe(rid);
  }
  box.querySelectorAll("[data-goto]").forEach((b) => (b.onclick = () => showTab(b.dataset.goto)));
}
function renderBadge() {
  const n = S.inbox.filter((x) => !x.read_at).length + S.shop.filter((x) => !x.bought && x.assigned_to === S.user?.id).length;
  const b = $("bell-n");
  if (b) { b.textContent = bn(n); b.hidden = !n; }
  const t = document.querySelector('.tab[data-tab=bazar] .dotn');
  if (t) t.hidden = !n;
}
function renderBazar() {
  const box = $("bazar-body");
  if (!box) return;
  if (!inFamily()) {
    box.innerHTML = `<div class="card"><h2>বাজার আর বার্তা</h2><p class="muted">লগইন করে পরিবার বানালে এখানে দেখাবে কে কী চেয়েছে, আর কোন জিনিস কেনা বাকি।</p><button class="pbtn" id="go-login">লগইন বা রেজিস্টার করুন</button></div>`;
    $("go-login").onclick = () => showAuth(true);
    return;
  }
  const unread = S.inbox.filter((x) => !x.read_at);
  const open = S.shop.filter((x) => !x.bought), done = S.shop.filter((x) => x.bought).slice(0, 15);
  const others = S.members.filter((m) => m.user_id !== S.user.id);
  box.innerHTML = `
    <div class="card"><div class="how-head"><h2>বার্তা</h2>${unread.length ? '<button class="link" id="read-all">সব পড়া হয়েছে</button>' : ""}</div>
      ${S.inbox.length ? S.inbox.slice(0, 15).map((n) => `<div class="msg${n.read_at ? "" : " new"}"><b>${esc(n.title)}</b><span>${esc(n.body)}</span><small>${esc(nameOf(n.from_user))} · ${ago(n.created_at)}</small>${n.recipe_id && R[n.recipe_id] ? `<button class="link" data-r="${n.recipe_id}">রেসিপি দেখুন</button>` : ""}</div>`).join("") : '<p class="muted">এখনো কোনো বার্তা আসেনি।</p>'}
    </div>
    <div class="card"><h2>বাজারের তালিকা</h2>
      <form id="shop-add" class="sform">
        <input id="shop-text" class="search" maxlength="200" placeholder="যা লাগবে লিখুন: ডায়াপার, দুধ, ওষুধ…" aria-label="নতুন জিনিস">
        <div class="chips quick">${QUICK.map((q) => `<button type="button" class="chip" data-q="${esc(q)}">+ ${esc(q)}</button>`).join("")}</div>
        ${others.length ? `<p class="lbl" style="margin:0">কাকে জানাবেন</p><div class="chips" id="notify-to">${others.map((o) => `<button type="button" class="chip" data-u="${o.user_id}" aria-pressed="${!shopSkip.has(o.user_id)}">🔔 ${esc(o.name)}</button>`).join("")}</div>`
          : '<p class="note">পরিবারে আর কেউ যোগ দিলে এখান থেকে তাঁকে সাথে সাথে জানাতে পারবেন। "পরিবার" ট্যাব থেকে আমন্ত্রণ পাঠান।</p>'}
        <button class="pbtn">${others.length ? "যোগ করুন ও জানান" : "যোগ করুন"}</button>
      </form>
      <div class="shop">${open.map((x) => `<div class="srow"><button class="item" data-id="${x.id}"><span class="box"></span><span>${esc(x.text)}<small>${esc(nameOf(x.added_by))}${x.assigned_to ? " → " + esc(nameOf(x.assigned_to)) : ""}${x.recipe_id && R[x.recipe_id] ? " · " + esc(R[x.recipe_id].name) : ""}</small></span></button>${others.length ? `<button class="remind" data-ring="${x.id}" aria-label="${esc(x.text)} নিয়ে আবার জানান">🔔<span>জানান</span></button>` : ""}</div>`).join("") || '<p class="muted">কিছু কেনা বাকি নেই।</p>'}</div>
      ${done.length ? `<p class="lbl" style="margin:8px 0 0">কেনা হয়েছে</p><div class="shop">${done.map((x) => `<button class="item got" data-id="${x.id}"><span class="box"></span><span>${esc(x.text)}<small>কিনেছেন ${esc(nameOf(x.bought_by))}</small></span></button>`).join("")}</div>` : ""}
    </div>`;
  const ra = $("read-all");
  if (ra) ra.onclick = async () => { const now = new Date().toISOString(); S.inbox.forEach((x) => (x.read_at = x.read_at || now)); refreshAll(); await sb.from("notifications").update({ read_at: now }).eq("to_user", S.user.id).is("read_at", null); };
  box.querySelectorAll("[data-r]").forEach((b) => (b.onclick = () => openRecipe(b.dataset.r)));
  box.querySelectorAll("[data-q]").forEach((b) => (b.onclick = () => {
    const i = $("shop-text"), v = i.value.trim();
    i.value = v ? v + ", " + b.dataset.q : b.dataset.q;
    i.focus();
  }));
  box.querySelectorAll("#notify-to [data-u]").forEach((b) => (b.onclick = () => {
    const u = b.dataset.u;
    shopSkip.has(u) ? shopSkip.delete(u) : shopSkip.add(u);
    b.setAttribute("aria-pressed", !shopSkip.has(u));
  }));
  $("shop-add").onsubmit = async (e) => {
    e.preventDefault();
    const raw = $("shop-text").value.trim();
    if (!raw) return toast("কী লাগবে লিখুন");
    const items = raw.split(/[,،\n]+/).map((s) => s.trim()).filter(Boolean).slice(0, 20);
    const to = others.map((o) => o.user_id).filter((u) => !shopSkip.has(u));
    $("shop-text").value = "";
    const { error } = await sb.from("shopping_items").insert(items.map((t) => ({ family_id: S.family.id, text: t.slice(0, 200), added_by: S.user.id, assigned_to: to[0] || null })));
    if (error) return toast("যোগ হয়নি, আবার চেষ্টা করুন");
    await loadShop(); refreshAll();
    logActivity(`বাজারের তালিকায় যোগ করেছেন: ${items.join(", ")}`);
    if (to.length) {
      const res = await sendNotify(to, items.length === 1 ? `লাগবে: ${items[0]}` : `বাজারে লাগবে ${bn(items.length)}টা জিনিস`, `${myName()} যোগ করেছেন: ${items.join(", ")}`, null);
      if (res) toast(res.sent ? "যোগ হয়েছে, ফোনে নোটিফিকেশন গেছে" : "যোগ হয়েছে। ওনার ফোনে নোটিফিকেশন চালু নেই, অ্যাপ খুললে দেখবেন।");
    } else toast("তালিকায় যোগ হয়েছে");
  };
  box.querySelectorAll("[data-ring]").forEach((b) => (b.onclick = async () => {
    const it = S.shop.find((x) => x.id === b.dataset.ring);
    if (!it) return;
    const to = it.assigned_to && it.assigned_to !== S.user.id ? [it.assigned_to] : others.map((o) => o.user_id);
    b.disabled = true;
    const res = await sendNotify(to, `মনে করিয়ে দেওয়া: ${it.text}`, `${myName()} মনে করিয়ে দিয়েছেন, এটা কেনা বাকি।`, it.recipe_id);
    b.disabled = false;
    if (res) toast(`${to.map(nameOf).join(", ")}-কে জানানো হয়েছে`);
  }));
  box.querySelectorAll(".item").forEach((b) => (b.onclick = async () => {
    const it = S.shop.find((x) => x.id === b.dataset.id);
    if (!it) return;
    it.bought = !it.bought; it.bought_by = it.bought ? S.user.id : null;
    refreshAll();
    await sb.from("shopping_items").update({ bought: it.bought, bought_by: it.bought_by }).eq("id", it.id);
    if (it.bought) {
      logActivity(`কিনেছেন: ${it.text}`);
      if (it.added_by !== S.user.id) sendNotify([it.added_by], "কেনা হয়েছে", it.text, it.recipe_id);
    }
  }));
}
async function renderFamily() {
  const box = $("family-body");
  if (!box) return;
  if (!S.user) {
    box.innerHTML = `<div class="card"><h2>পরিবার</h2><p class="muted">স্বামী-স্ত্রী বা পরিবারের সবাই মিলে একসাথে পছন্দ, আজকের রান্না, বাজারের তালিকা আর নোটিফিকেশন।</p><button class="pbtn" id="go-login2">লগইন বা রেজিস্টার করুন</button></div>
      <button class="sbtn wide" data-goto="tips">টিপস ও আমার রান্নাঘর</button>`;
    $("go-login2").onclick = () => showAuth(true);
  } else if (!S.family) {
    box.innerHTML = `<div class="card"><h2>এখনো কোনো পরিবারে নেই</h2><button class="pbtn" id="go-setup">পরিবার বানান বা যোগ দিন</button></div>`;
    $("go-setup").onclick = () => showSetup(true);
  } else {
    const ps = await pushState();
    const link = location.origin + location.pathname + "?join=" + S.family.code;
    const fav2 = [...new Set(S.favs.map((f) => f.recipe_id))].filter((rid) => R[rid]).map((rid) => ({ rid, who: S.favs.filter((f) => f.recipe_id === rid).map((f) => f.user_id) }));
    box.innerHTML = `
      <div class="card fam-head"><p class="lbl">${S.family.kind === "single" ? "আমার রান্নাঘর" : "পরিবার"}</p><h2>${esc(S.family.name)}</h2>
        <p class="muted" style="font-size:.9rem">আমন্ত্রণ কোড</p><div class="code num">${esc(S.family.code)}</div>
        <div class="cook-acts"><button class="pbtn" id="inv-share">আমন্ত্রণ পাঠান</button><button class="sbtn" id="inv-copy">কোড কপি</button></div></div>
      <div class="card"><h2>সদস্য</h2>${S.members.map((m) => `<div class="mem"><span class="av">${esc((m.name || "?").slice(0, 1))}</span><span>${esc(m.user_id === S.user.id ? m.name + " (আপনি)" : m.name)}</span><small>${m.role === "owner" ? "তৈরি করেছেন" : "সদস্য"}</small></div>`).join("")}</div>
      <div class="card"><h2>নোটিফিকেশন</h2>
        <p class="muted" style="font-size:.92rem">${ps === "on" ? "এই ফোনে নোটিফিকেশন চালু আছে।" : ps === "denied" ? "ফোনের সেটিংসে এই অ্যাপের নোটিফিকেশন বন্ধ করা আছে। সেখান থেকে চালু করুন।" : ps === "unsupported" ? "iPhone হলে Safari-তে Share → Add to Home Screen করে হোম স্ক্রিন থেকে খুলুন, তারপর চালু করুন। Android-এ Chrome দিয়ে খুলুন।" : "চালু করলে পরিবারের কেউ কিছু চাইলে ফোনে বার্তা আসবে, অ্যাপ বন্ধ থাকলেও।"}</p>
        ${ps === "on" ? '<button class="sbtn" id="push-test">একটা পরীক্ষা নোটিফিকেশন পাঠান</button>' : '<button class="pbtn" id="push-on">নোটিফিকেশন চালু করুন</button>'}</div>
      <div class="card"><h2>পছন্দের রেসিপি</h2>${fav2.length ? fav2.map(({ rid, who }) => `<button class="row" data-r="${rid}"><span class="thumb">${ART(rid)}</span><span style="min-width:0"><span class="nm">${esc(R[rid].name)}</span><br><span class="mt">${who.length > 1 && who.length === S.members.length ? "সবার পছন্দ" : esc(who.map(nameOf).join(", "))}</span></span><span class="kc">❤</span></button>`).join("") : '<p class="muted">রেসিপির ভেতরে ❤ চাপলে এখানে আসবে।</p>'}</div>
      <div class="card"><h2>কার্যকলাপ</h2>${S.activity.slice(0, 12).map((a) => `<p class="act"><b>${esc(nameOf(a.user_id))}</b> ${esc(a.text)} <small>${ago(a.created_at)}</small></p>`).join("") || '<p class="muted">এখনো কিছু হয়নি।</p>'}</div>
      <div class="card"><h2>অ্যাকাউন্ট</h2><form id="name-form" class="addrow"><input id="my-name" class="search" maxlength="40" value="${esc(myName())}" aria-label="আপনার নাম"><button class="sbtn">নাম সেভ</button></form>
        <button class="link" id="logout">লগআউট</button></div>
      <button class="sbtn wide" data-goto="tips">টিপস ও আমার রান্নাঘর</button>`;
    $("inv-copy").onclick = () => navigator.clipboard?.writeText(S.family.code).then(() => toast("কোড কপি হয়েছে"), () => toast(S.family.code));
    $("inv-share").onclick = async () => {
      const text = `দেশি ডায়েট থালা অ্যাপে আমাদের পরিবারে যোগ দাও। কোড: ${S.family.code}\n${link}`;
      if (navigator.share) { try { await navigator.share({ text }); return; } catch (e) { if (e.name === "AbortError") return; } }
      window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
    };
    const po = $("push-on"); if (po) po.onclick = enablePush;
    const pt = $("push-test"); if (pt) pt.onclick = async () => {
      const r = await sb.functions.invoke("notify", { body: { family_id: S.family.id, to: S.members.map((m) => m.user_id), title: "পরীক্ষা", body: "নোটিফিকেশন ঠিকমতো কাজ করছে" } });
      toast(r.error ? "পাঠানো যায়নি" : "পরিবারের অন্যদের কাছে পরীক্ষা পাঠানো হয়েছে");
    };
    box.querySelectorAll(".row[data-r]").forEach((b) => (b.onclick = () => openRecipe(b.dataset.r)));
    $("name-form").onsubmit = async (e) => {
      e.preventDefault();
      const n = $("my-name").value.trim();
      if (!n) return;
      await sb.from("profiles").update({ name: n }).eq("id", S.user.id);
      await loadMembers(); refreshAll(); toast("নাম সেভ হয়েছে");
    };
    $("logout").onclick = async () => { await sb.auth.signOut(); location.reload(); };
  }
  box.querySelectorAll("[data-goto]").forEach((b) => (b.onclick = () => showTab(b.dataset.goto)));
}

/* ---------- hooks into the recipe sheet and wheel ---------- */
const _renderSheet = renderSheet;
renderSheet = function () {
  _renderSheet();
  const r = cur, body = $("sheet-body");
  if (!r || !body) return;
  const favs = inFamily() ? S.favs.filter((f) => f.recipe_id === r.id).map((f) => f.user_id) : (FAV_IDS().has(r.id) ? ["me"] : []);
  const mine = inFamily() ? favs.includes(S.user.id) : favs.length > 0;
  const isPlan = planRid() === r.id;
  const acts = document.createElement("div");
  acts.className = "fam-acts";
  acts.innerHTML = `<button class="favbtn${mine ? " on" : ""}" id="fav-btn" aria-pressed="${mine}">${mine ? "❤ পছন্দের" : "♡ পছন্দ করুন"}</button>
    <button class="${isPlan ? "sbtn" : "pbtn"}" id="plan-btn">${isPlan ? "✓ আজকের রান্না" : "আজ এটা রাঁধব"}</button>
    ${inFamily() && favs.length ? `<p class="muted" style="grid-column:1/-1;font-size:.85rem;margin:0">পছন্দ করেছেন: ${esc(favs.map(nameOf).join(", "))}</p>` : ""}`;
  body.querySelector(".hero").after(acts);
  $("fav-btn").onclick = () => toggleFav(r.id);
  $("plan-btn").onclick = () => { if (!isPlan) setPlan(r.id); };
  const list = body.querySelector(".ing");
  if (list) {
    list.querySelectorAll("li").forEach((li) => {
      const i = +li.dataset.i, st = ingStatus(r.id, i);
      li.onclick = null;
      li.classList.toggle("got", st?.status === "have");
      li.classList.toggle("need", st?.status === "need");
      const hn = document.createElement("span");
      hn.className = "hn";
      hn.innerHTML = `<button data-s="have" aria-pressed="${st?.status === "have"}">আছে</button><button data-s="need" aria-pressed="${st?.status === "need"}">নেই</button>`;
      hn.querySelectorAll("button").forEach((b) => (b.onclick = (e) => { e.stopPropagation(); setIng(r.id, i, b.dataset.s); }));
      li.appendChild(hn);
      if (inFamily() && st && st.updated_by !== S.user.id) {
        const who = document.createElement("small");
        who.className = "who";
        who.textContent = `${nameOf(st.updated_by)} দেখেছেন`;
        li.querySelector(".tx").appendChild(who);
      }
    });
    const need = neededOf(r).length;
    const bar = document.createElement("div");
    bar.className = "need-bar";
    bar.innerHTML = `<button class="${need ? "pbtn" : "sbtn"}" id="need-btn">${need ? `নেই এমন ${bn(need)}টা জিনিস জানান` : "উপকরণ শেয়ার করুন"}</button>`;
    list.after(bar);
    $("need-btn").onclick = () => (need ? openNotify(r) : shareCard(r, r.ing.map((_, i) => ingText(r, i)), "যা লাগবে"));
    const hint = list.parentElement.querySelector("p.muted");
    if (hint) hint.textContent = "প্রতিটা উপকরণের পাশে \"আছে\" বা \"নেই\" চাপুন। যা নেই, তা এক চাপে পরিবারকে জানাতে পারবেন।";
  }
};
const _showResult = showResult;
showResult = function (r) {
  _showResult(r);
  const acts = document.querySelector("#result .acts");
  if (acts) {
    const b = document.createElement("button");
    b.textContent = "আজ এটা রাঁধব";
    b.style.gridColumn = "1 / -1";
    b.onclick = () => setPlan(r.id);
    acts.appendChild(b);
  }
};
const _showTab = showTab;
showTab = function (t) {
  _showTab(t);
  if (t === "bazar" || t === "family") { const titles = { bazar: "বাজার ও বার্তা", family: "পরিবার" }; $("title").textContent = titles[t]; }
};

/* ---------- start ---------- */
async function startFamily() {
  bindAuth(); bindSetup();
  $("bell").onclick = () => showTab("bazar");
  const join = new URLSearchParams(location.search).get("join");
  if (join) store.set("pendingJoin", join);
  if (!sb) { renderCook(); renderBazar(); renderFamily(); return; }
  const onSession = async (session) => {
    S.user = session?.user || null;
    if (!S.user) {
      S.family = null;
      if (!store.get("guest")) showAuth(true);
      refreshAll();
      return;
    }
    showAuth(false);
    const pending = store.get("pendingJoin");
    if (pending) { if (await joinWith(pending)) return; }
    const { data: mem } = await sb.from("family_members").select("family_id, families(*)").eq("user_id", S.user.id);
    const pick = (mem || []).find((m) => m.family_id === store.get("familyId")) || (mem || [])[0];
    if (pick?.families) await afterFamily(pick.families);
    else if (S.user.user_metadata?.kind === "single") {
      const { data } = await sb.rpc("create_family", { fam_name: "আমার রান্নাঘর", fam_kind: "single" });
      if (data) await afterFamily(data);
    } else { showSetup(true); refreshAll(); }
    if (location.search.includes("code=") || location.hash.includes("access_token")) history.replaceState(null, "", location.pathname + (new URLSearchParams(location.search).get("tab") ? "?tab=" + new URLSearchParams(location.search).get("tab") : ""));
  };
  let first = true;
  sb.auth.onAuthStateChange((ev, session) => {
    if (ev === "INITIAL_SESSION" || ev === "SIGNED_IN" || ev === "SIGNED_OUT") {
      if (ev === "SIGNED_IN" && !first && S.user && session?.user?.id === S.user.id) return;
      first = false;
      setTimeout(() => onSession(session), 0);
    }
  });
  const tab = new URLSearchParams(location.search).get("tab");
  if (tab && TITLES[tab]) showTab(tab);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
  setInterval(() => { if (inFamily()) renderFamily(); }, 60000);
}
startFamily();
