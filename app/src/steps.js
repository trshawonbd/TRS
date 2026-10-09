/* ================= step pictures for the Method tab and the step-by-step player ================= */
// Which action a step is about, read from the English step text (Bangla steps use the same order).
const STEP_RULES = [
  ["appliance", /time below for your appliance|for your appliance|as below for your/i],
  ["plate", /^(serve|top with|garnish|finish|eat |sprinkle)/i],
  ["fridge", /\b(chill(?!i)|fridge|refrigerat|freez|overnight|set in the)/i],
  ["air", /air[- ]?fr/i],
  ["oven", /\b(oven|bake|roast|preheat)/i],
  ["grill", /\b(grill|skewer|tawa|griddle|barbecue|bbq|char\b|charred)/i],
  ["micro", /\bmicrowave/i],
  ["steam", /\bsteam/i],
  ["blend", /\b(blend|grind|whizz|purée|puree|food processor|mash)/i],
  ["pan", /\b(fry|sauté|saute|sear|heat (the )?(oil|ghee|pan)|soften|temper|stir-fry|wok|in (the )?oil)/i],
  ["knife", /\b(chop|slice|cut|dice|grate|peel|shred|halve|score|prick|trim)/i],
  ["pot", /\b(boil|simmer|pressure|dum\b|stew|cover and cook|cover,|cover\b|hot water|pour in)/i],
  ["pan", /\b(toast|brown|pan|cook|add the)\b/i],
  ["bowl", /\b(marinat|rub|coat|mix|whisk|stir|combine|knead|toss|soak|season|dress|layer|fold|beat|shape|form|roll|wrap|fill|spread|drain|pat|hang|make a|paste)/i],
  ["clock", /\b(rest|leave|wait|stand|cool)/i],
  ["plate", /\b(serve|garnish|sprinkle|top with|squeeze|plate|enjoy|finish)/i]
];
const APPLIANCES = ["air", "oven", "grill", "micro", "steam"];
function stepKind(r, i) {
  const s = (r.en && r.en.steps ? r.en.steps[i] : r.steps[i]) || "";
  let k = (STEP_RULES.find(([, re]) => re.test(s)) || ["bowl"])[0];
  if (APPLIANCES.includes(k)) {
    // a step can name several appliances ("grill in the oven … air fryer: …"): use the one mentioned first
    let best = Infinity;
    STEP_RULES.filter(([kk]) => APPLIANCES.includes(kk)).forEach(([kk, re]) => { const m = s.search(re); if (m >= 0 && m < best) { best = m; k = kk; } });
    if (k === "grill" && /\boven\b/i.test(s) && s.search(/\boven\b/i) < 40) k = "oven";
  }
  if (k === "appliance") {
    const name = (r.en && r.en.name) || r.name;
    k = /microwave/i.test(name) ? "micro" : /air[- ]?fr/i.test(name) || (r.ao && r.ao.air && !r.ao.oven) ? "air" : "oven";
  }
  return k;
}
// Time and temperature mentioned in a step, shown as small tags.
function stepTags(r, i) {
  const s = (r.en && r.en.steps ? r.en.steps[i] : r.steps[i]) || "", tags = [];
  const t = s.match(/(\d+)(?:\s*[–-]\s*(\d+))?\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?)\b/i);
  if (t) {
    const u = t[3].toLowerCase(), unit = /^h/.test(u) ? tr("hr", "ঘণ্টা") : /^s/.test(u) ? tr("sec", "সেকেন্ড") : tr("min", "মিনিট");
    tags.push(["time", N(t[1]) + (t[2] ? "–" + N(t[2]) : "") + " " + unit]);
  }
  const c = s.match(/(\d{2,3})\s*°\s*C/i);
  if (c) tags.push(["temp", N(c[1]) + "°C"]);
  return tags;
}
const STEP_LABEL = () => ({
  knife: tr("Chop", "কাটুন"), bowl: tr("Mix", "মেশান"), pan: tr("Pan", "কড়াই/প্যান"), pot: tr("Pot", "হাঁড়ি"),
  oven: tr("Oven", "ওভেন"), air: tr("Air fryer", "এয়ার ফ্রায়ার"), grill: tr("Grill", "গ্রিল"), steam: tr("Steam", "ভাপ"),
  blend: tr("Blend", "ব্লেন্ড"), micro: tr("Microwave", "মাইক্রোওয়েভ"), fridge: tr("Chill", "ফ্রিজে"), clock: tr("Wait", "অপেক্ষা"), plate: tr("Serve", "পরিবেশন")
});
// Drawings: 64×64, line style. Classes: k = ink line, a = saffron fill, g = leaf fill, c = chili fill, w = light fill.
const STEP_ICON = {
  knife: `<path class="w" d="M8 44h48v8H8z"/><path class="k" d="M8 44h48v8H8z"/><path class="w" d="M14 40 44 14c3-2 6 1 4 4L22 44z"/><path class="k" d="M14 40 44 14c3-2 6 1 4 4L22 44"/><path class="k" d="M44 14l6-6"/><circle class="g" cx="40" cy="39" r="3"/><circle class="a" cx="48" cy="38" r="3"/><circle class="c" cx="33" cy="40" r="2.5"/>`,
  bowl: `<path class="a" d="M10 30h44c0 13-10 22-22 22S10 43 10 30z"/><path class="k" d="M10 30h44c0 13-10 22-22 22S10 43 10 30zM24 52h16"/><path class="k" d="M40 10 30 30"/><ellipse class="w" cx="42" cy="9" rx="4" ry="3" transform="rotate(25 42 9)"/><path class="k" d="M18 26c4-3 8-3 12 0s8 3 12 0"/><circle class="g" cx="22" cy="36" r="2"/><circle class="c" cx="34" cy="38" r="2"/>`,
  pan: `<path class="a" d="M8 30h36v4c0 8-6 12-14 12h-8C14 46 8 42 8 34z"/><path class="k" d="M8 30h36v4c0 8-6 12-14 12h-8C14 46 8 42 8 34zM44 32h14"/><path class="k" d="M18 22c0-4 4-4 4-8M28 22c0-4 4-4 4-8"/><path class="c" d="M18 58c0-4 3-5 3-8 2 2 3 4 3 6 0 1-1 2-3 2zm10 0c0-4 3-5 3-8 2 2 3 4 3 6 0 1-1 2-3 2z"/>`,
  pot: `<path class="a" d="M12 24h40v22c0 4-3 7-7 7H19c-4 0-7-3-7-7z"/><path class="k" d="M12 24h40v22c0 4-3 7-7 7H19c-4 0-7-3-7-7zM6 28h6M52 28h6M10 24h44M28 18h8"/><path class="k" d="M24 12c0-3 3-3 3-6M38 12c0-3 3-3 3-6"/><circle class="w" cx="24" cy="36" r="2.5"/><circle class="w" cx="36" cy="40" r="2"/><circle class="w" cx="42" cy="33" r="1.8"/>`,
  oven: `<rect class="w" x="8" y="10" width="48" height="44" rx="5"/><rect class="k" x="8" y="10" width="48" height="44" rx="5"/><path class="k" d="M8 20h48"/><circle class="k" cx="16" cy="15" r="1.5"/><circle class="k" cx="23" cy="15" r="1.5"/><rect class="a" x="15" y="26" width="34" height="20" rx="3"/><rect class="k" x="15" y="26" width="34" height="20" rx="3"/><path class="c" d="M22 40h20" style="stroke:var(--chili);stroke-width:3"/>`,
  air: `<path class="w" d="M16 8h32c4 0 6 3 6 7v34c0 4-3 7-7 7H17c-4 0-7-3-7-7V15c0-4 2-7 6-7z"/><path class="k" d="M16 8h32c4 0 6 3 6 7v34c0 4-3 7-7 7H17c-4 0-7-3-7-7V15c0-4 2-7 6-7z"/><circle class="a" cx="32" cy="24" r="9"/><circle class="k" cx="32" cy="24" r="9"/><path class="k" d="M32 24c3-6 7-4 6-1M32 24c-3 6-7 4-6 1M32 24c6 3 4 7 1 6M32 24c-6-3-4-7-1-6"/><path class="k" d="M14 40h36M26 46h12"/>`,
  grill: `<path class="k" d="M10 40h44M14 46h36"/><path class="c" d="M20 60c0-5 4-6 4-10 3 3 4 5 4 8 0 1-1 2-3 2zm14 0c0-5 4-6 4-10 3 3 4 5 4 8 0 1-1 2-3 2z"/><path class="k" d="M8 34 56 14"/><rect class="a" x="16" y="24" width="9" height="9" rx="2" transform="rotate(-22 20 28)"/><rect class="g" x="28" y="19" width="9" height="9" rx="2" transform="rotate(-22 32 23)"/><rect class="c" x="40" y="14" width="9" height="9" rx="2" transform="rotate(-22 44 18)"/>`,
  micro: `<rect class="w" x="6" y="14" width="52" height="36" rx="5"/><rect class="k" x="6" y="14" width="52" height="36" rx="5"/><rect class="a" x="12" y="20" width="30" height="24" rx="3"/><rect class="k" x="12" y="20" width="30" height="24" rx="3"/><path class="k" d="M48 22h4M48 28h4M48 34h4M18 32c3-3 6 3 9 0s6 3 9 0" /><path class="k" d="M14 50v4M50 50v4"/>`,
  steam: `<path class="a" d="M10 34h44l-4 16H14z"/><path class="k" d="M10 34h44l-4 16H14zM16 40h32M8 34h48"/><path class="k" d="M20 26c0-4 4-4 4-8s-4-4-4-8M32 26c0-4 4-4 4-8s-4-4-4-8M44 26c0-4 4-4 4-8s-4-4-4-8"/>`,
  blend: `<path class="w" d="M18 8h28l-4 34H22z"/><path class="g" d="M20 24h24l-2 18H22z"/><path class="k" d="M18 8h28l-4 34H22zM46 14h6v14l-7 2"/><rect class="a" x="16" y="42" width="32" height="14" rx="3"/><rect class="k" x="16" y="42" width="32" height="14" rx="3"/><path class="k" d="M26 36l6-3 6 3"/><circle class="k" cx="32" cy="49" r="2.5"/>`,
  fridge: `<rect class="w" x="14" y="6" width="36" height="52" rx="5"/><rect class="k" x="14" y="6" width="36" height="52" rx="5"/><path class="k" d="M14 24h36M20 12v6M20 30v8"/><path class="k" d="M38 33v14M32 36l12 8M44 36l-12 8" style="stroke:var(--leaf)"/>`,
  clock: `<circle class="a" cx="32" cy="34" r="20"/><circle class="k" cx="32" cy="34" r="20"/><path class="k" d="M32 22v12l8 6M26 8h12M32 8v6M50 16l4-4"/>`,
  plate: `<ellipse class="w" cx="32" cy="40" rx="24" ry="12"/><ellipse class="k" cx="32" cy="40" rx="24" ry="12"/><ellipse class="a" cx="32" cy="38" rx="14" ry="6"/><circle class="g" cx="26" cy="36" r="2.5"/><circle class="c" cx="36" cy="37" r="2"/><path class="k" d="M10 14v12M14 14v12M10 20h4M12 26v6M52 14c-3 2-3 8 0 10v8"/><path class="k" d="M28 18l2-4 2 4M40 22l1-3 1 3" style="stroke:var(--saffron)"/>`
};
const stepSvg = (k, cls = "") => `<svg class="si ${cls}" viewBox="0 0 64 64" aria-hidden="true">${STEP_ICON[k] || STEP_ICON.bowl}</svg>`;
