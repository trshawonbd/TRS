
/* hand-drawn food illustrations, 120x120 */
const ART = (() => {
  const SH = (cy = 100, rx = 42) => `<ellipse cx="60" cy="${cy}" rx="${rx}" ry="6" fill="rgba(0,0,0,.13)"/>`;
  const PLATE = `${SH(96, 46)}<ellipse cx="60" cy="74" rx="50" ry="22" fill="#F8F4EC"/><ellipse cx="60" cy="74" rx="41" ry="17" fill="#ECE4D4"/>`;
  const LEAF = (x, y, r = 0) => `<ellipse cx="${x}" cy="${y}" rx="3.6" ry="1.8" fill="#3E8E41" transform="rotate(${r} ${x} ${y})"/>`;
  const POS = [[42, 56], [61, 53], [78, 57], [50, 61], [70, 62], [33, 59], [88, 60], [58, 58]];
  const item = (t, c, [x, y], i) => {
    if (t === "chunk") return `<rect x="${x - 5}" y="${y - 4}" width="10" height="8" rx="2.5" fill="${c}" transform="rotate(${(i * 23) % 40 - 20} ${x} ${y})"/>`;
    if (t === "ball") return `<circle cx="${x}" cy="${y}" r="5.5" fill="${c}"/><circle cx="${x - 1.8}" cy="${y - 1.8}" r="1.6" fill="rgba(255,255,255,.35)"/>`;
    if (t === "pea") return `<circle cx="${x}" cy="${y}" r="2.8" fill="${c}"/>`;
    if (t === "egg") return `<ellipse cx="${x}" cy="${y}" rx="8" ry="5.5" fill="#FBF8F0"/><circle cx="${x}" cy="${y}" r="3.2" fill="#F2B705"/>`;
    if (t === "ring") return `<circle cx="${x}" cy="${y}" r="4" fill="none" stroke="${c}" stroke-width="1.6"/>`;
    if (t === "strand") return `<path d="M${x - 6} ${y + 1}q6 -5 12 0" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    if (t === "swirl") return `<path d="M${x - 14} ${y}c6 -6 14 6 22 0" stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    if (t === "piece") return `<rect x="${x - 8}" y="${y - 5}" width="16" height="10" rx="3" fill="${c}" transform="rotate(${(i * 31) % 50 - 25} ${x} ${y})"/><path d="M${x - 3} ${y - 4}v8M${x + 3} ${y - 4}v8" stroke="rgba(0,0,0,.18)" stroke-width="1.4" transform="rotate(${(i * 31) % 50 - 25} ${x} ${y})"/>`;
    if (t === "slice") return `<circle cx="${x}" cy="${y}" r="6" fill="${c}"/><circle cx="${x}" cy="${y}" r="4.2" fill="#FBEFA8"/><path d="M${x - 4} ${y}h8M${x} ${y - 4}v8" stroke="${c}" stroke-width="1"/>`;
    if (t === "leafcup") return `<path d="M${x - 12} ${y}c2-9 22-9 24 0-4 6-20 6-24 0z" fill="#7DB84A"/><path d="M${x - 8} ${y - 1}c4-3 12-3 16 0" stroke="#5E9A3A" stroke-width="1.4" fill="none"/>`;
    if (t === "shrimp") return `<path d="M${x - 6} ${y}a6 6 0 1 1 6 6" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    return LEAF(x, y, i * 37);
  };
  const scatter = (items) => {
    let k = 0, out = "";
    items.forEach(([t, c, n]) => { for (let j = 0; j < n; j++) { out += item(t, c, POS[k % POS.length], k); k++; } });
    return out;
  };
  const bowl = (c, items = [], leaves = 3) => SH(100, 40) +
    `<path d="M14 58h92c0 24-20 40-46 40S14 82 14 58z" fill="#EADFCB"/><path d="M16 64h88c-.6 2.4-1.4 4.6-2.4 6.8H18.4c-1-2.2-1.8-4.4-2.4-6.8z" fill="#D9C9AC"/>` +
    `<ellipse cx="60" cy="58" rx="46" ry="12" fill="#F8F2E6"/><ellipse cx="60" cy="58" rx="41" ry="9.5" fill="${c}"/>` +
    scatter(items) + [[40, 53, 20], [74, 52, -30], [56, 63, 60], [86, 57, 10]].slice(0, leaves).map(([x, y, r]) => LEAF(x, y, r)).join("");
  const pot = (rice, extra = "") => SH(102, 40) +
    `<path d="M22 64h76l-5 28a9 9 0 0 1-9 7H36a9 9 0 0 1-9-7z" fill="#7A4A26"/><path d="M27 74h66" stroke="#64391B" stroke-width="3"/>` +
    `<rect x="17" y="60" width="86" height="9" rx="4.5" fill="#5E381C"/><path d="M21 63c3-32 75-32 78 0z" fill="${rice}"/>` + extra;
  const skewer = (pieces) => {
    let out = `${PLATE}<path d="M20 98L100 26" stroke="#8A6A44" stroke-width="3.2" stroke-linecap="round"/>`;
    pieces.forEach(([c, w, h], i) => {
      const t = 0.24 + i * (0.56 / Math.max(1, pieces.length - 1));
      const x = 20 + 80 * t, y = 98 - 72 * t;
      out += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(-42)"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${Math.min(w, h) / 2.4}" fill="${c}"/>` +
        `<path d="M${-w / 4} ${-h / 2 + 2}v${h - 4}M${w / 4} ${-h / 2 + 2}v${h - 4}" stroke="rgba(0,0,0,.25)" stroke-width="1.6"/></g>`;
    });
    return out + LEAF(30, 78, 30) + LEAF(90, 82, -20) + `<path d="M82 70a8 8 0 0 1 16 0z" fill="#F4D03F"/><path d="M90 70v-7" stroke="#E5B92F" stroke-width="1"/>`;
  };
  const fish = (c, mark) => PLATE +
    `<path d="M24 72c12-17 46-19 64 0-18 19-52 17-64 0z" fill="${c}"/><path d="M86 72l16-12v24z" fill="${c}"/>` +
    `<path d="M44 64q3 8 0 16M54 62q3 10 0 20M64 63q3 9 0 18" stroke="${mark}" stroke-width="2.2" fill="none" stroke-linecap="round"/>` +
    `<circle cx="33" cy="69" r="2" fill="#2A2A2A"/><path d="M28 88a9 9 0 0 1 18 0z" fill="#F4D03F"/>` + LEAF(84, 88, 15) + LEAF(90, 86, -30);
  const cup = (c, top = "") => SH(94, 32) +
    `<path d="M28 60h64c0 18-14 32-32 32S28 78 28 60z" fill="#EADFCB"/><ellipse cx="60" cy="60" rx="32" ry="9" fill="#F8F2E6"/><ellipse cx="60" cy="60" rx="27.5" ry="6.6" fill="${c}"/>` + top;

  const drum = (c, m) => PLATE + [[46, 72, -18], [72, 70, 14]].map(([x, y, r]) => `<g transform="rotate(${r} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="15" ry="11" fill="${c}"/><path d="M${x - 8} ${y - 4}l12 8M${x - 4} ${y - 8}l12 8" stroke="${m}" stroke-width="2" stroke-linecap="round"/><rect x="${x + 12}" y="${y - 2.5}" width="12" height="5" rx="2.5" fill="#F4EFE6"/><circle cx="${x + 25}" cy="${y - 2}" r="3" fill="#F4EFE6"/><circle cx="${x + 25}" cy="${y + 2}" r="3" fill="#F4EFE6"/></g>`).join("") + LEAF(34, 88, 10) + LEAF(86, 88, -10);
  const pan = (rice, extra) => SH(102, 46) + `<rect x="98" y="66" width="20" height="6" rx="3" fill="#2F2F2F"/><rect x="2" y="66" width="20" height="6" rx="3" fill="#2F2F2F"/><ellipse cx="60" cy="70" rx="46" ry="22" fill="#3A3A3A"/><ellipse cx="60" cy="68" rx="40" ry="17" fill="${rice}"/>` + extra;
  const A = {
    shepherd: () => SH(100, 44) + `<rect x="18" y="56" width="84" height="38" rx="14" fill="#E9E2D6"/><rect x="22" y="52" width="76" height="30" rx="12" fill="#F2D27A"/><path d="M30 62q8-6 16 0t16 0 16 0 16 0M30 72q8-6 16 0t16 0 16 0 16 0" stroke="#D9A441" stroke-width="2.4" fill="none"/>` + LEAF(40, 50, 20) + `<circle cx="84" cy="50" r="2.6" fill="#6BAA3A"/><circle cx="78" cy="48" r="2.6" fill="#6BAA3A"/>`,
    fishchips: () => PLATE + `<path d="M24 74c8-12 32-14 44 0-12 13-36 11-44 0z" fill="#D9A441"/><path d="M66 74l10-8v16z" fill="#D9A441"/>` + [[72, 64, 30], [78, 68, 20], [84, 72, 40], [76, 80, 10], [86, 82, 25]].map(([x, y, r]) => `<rect x="${x - 2.5}" y="${y - 9}" width="5" height="18" rx="2" fill="#F2C24F" transform="rotate(${r} ${x} ${y})"/>`).join("") + `<path d="M30 88a7 7 0 0 1 14 0z" fill="#F4D03F"/><circle cx="52" cy="88" r="2.4" fill="#6BAA3A"/><circle cx="57" cy="90" r="2.4" fill="#6BAA3A"/>`,
    jacket: () => PLATE + `<ellipse cx="60" cy="72" rx="30" ry="16" fill="#9C6B3E"/><ellipse cx="60" cy="68" rx="24" ry="11" fill="#F3E3B5"/><path d="M44 66c6-6 26-6 32 0-4 6-28 6-32 0z" fill="#F8F4EC"/><circle cx="54" cy="66" r="2" fill="#F2C24F"/><circle cx="64" cy="64" r="2" fill="#F2C24F"/><circle cx="60" cy="68" r="1.6" fill="#8E3A6E"/>` + LEAF(70, 66, 20),
    cacciatore: () => bowl("#B8402A", [["chunk", "#E5A26B", 3], ["pea", "#2A2A2A", 3], ["chunk", "#E23B2A", 1]], 2),
    pasta: () => bowl("#C8402A", [], 0) + `<path d="M30 56q10-8 20 0t20 0 20 0M34 60q10-6 18 0t18 0 18 0M40 54q8-5 14 0t14 0" stroke="#F2D27A" stroke-width="3" fill="none" stroke-linecap="round"/>` + `<rect x="52" y="52" width="10" height="7" rx="2" fill="#EAC9A0"/><rect x="70" y="58" width="10" height="7" rx="2" fill="#EAC9A0"/>` + LEAF(44, 58, 10) + LEAF(80, 54, -20) + LEAF(62, 62, 40),
    parmigiana: () => PLATE + `<path d="M28 72c4-12 52-14 62-2 4 8-6 16-20 17-18 2-36 0-40-6-2-3-3-6-2-9z" fill="#C98A3A"/><path d="M36 70c8-6 34-8 44 0-6 6-36 8-44 0z" fill="#C8402A"/><ellipse cx="52" cy="68" rx="8" ry="4" fill="#FBF3DC"/><ellipse cx="68" cy="70" rx="7" ry="3.5" fill="#FBF3DC"/>` + LEAF(60, 66, 30) + LEAF(46, 72, -20),
    paella: () => pan("#E8B53A", `<path d="M40 62a6 6 0 1 1 6 6M66 58a6 6 0 1 1 6 6M54 74a6 6 0 1 1 6 6" stroke="#EE8A4F" stroke-width="4" fill="none" stroke-linecap="round"/><rect x="30" y="68" width="10" height="5" rx="2" fill="#D9452E"/><rect x="76" y="72" width="10" height="5" rx="2" fill="#D9452E"/><ellipse cx="52" cy="62" rx="7" ry="5" fill="#B5652E"/><circle cx="84" cy="62" r="2.6" fill="#6BAA3A"/><circle cx="46" cy="78" r="2.6" fill="#6BAA3A"/><circle cx="70" cy="80" r="2.6" fill="#6BAA3A"/><path d="M76 56a8 8 0 0 1 14 2z" fill="#F4D03F"/>`),
    gambas: () => SH(98, 40) + `<ellipse cx="60" cy="70" rx="42" ry="20" fill="#A0522D"/><ellipse cx="60" cy="66" rx="36" ry="14" fill="#E9B04A"/>` + [[42, 64], [58, 60], [74, 64], [52, 72], [70, 72]].map(([x, y]) => `<path d="M${x - 6} ${y}a6 6 0 1 1 6 6" stroke="#EE7A45" stroke-width="4.4" fill="none" stroke-linecap="round"/>`).join("") + `<ellipse cx="46" cy="60" rx="2.6" ry="1.6" fill="#FBF3DC"/><ellipse cx="66" cy="68" rx="2.6" ry="1.6" fill="#FBF3DC"/>` + LEAF(84, 66, 0),
    tortilla: () => PLATE + `<path d="M60 74L28 66a34 16 0 0 1 64 0z" fill="#F2C94C"/><path d="M60 74L92 66a34 16 0 0 1-12 14z" fill="#E8B53A"/><path d="M60 74L28 66" stroke="#D9A441" stroke-width="2"/><circle cx="48" cy="66" r="2" fill="#F8E7A8"/><circle cx="62" cy="62" r="2" fill="#F8E7A8"/>` + LEAF(36, 84, 20),
    fajita: () => A.traybake() + `<circle cx="96" cy="40" r="14" fill="#F1DFB8" stroke="#D9C49B" stroke-width="2"/>`,
    burrito: () => bowl("#F3EBDA", [["pea", "#3A2A2A", 3], ["pea", "#F2C24F", 3], ["chunk", "#D9822B", 2], ["chunk", "#D9452E", 2]], 2),
    chili: () => bowl("#9C3B22", [["pea", "#5A1E14", 4], ["chunk", "#C77A3A", 3], ["swirl", "#F8F2E6", 1]], 2),
    shish: () => skewer([["#D35A2A", 14, 13], ["#5C9E3A", 11, 11], ["#D35A2A", 14, 13], ["#5C9E3A", 11, 11], ["#D35A2A", 14, 13]]),
    mercimek: () => bowl("#E39B3A", [["swirl", "#C8402A", 1]], 2) + `<path d="M80 50a8 8 0 0 1 14 2z" fill="#F4D03F"/>`,
    shawarma: () => PLATE + [[40, 70, -10], [52, 66, 5], [64, 70, -5], [76, 66, 10]].map(([x, y, r]) => `<rect x="${x - 7}" y="${y - 4}" width="14" height="8" rx="3" fill="#B86A2E" transform="rotate(${r} ${x} ${y})"/>`).join("") + `<path d="M76 80a12 8 0 0 1 22-4z" fill="#F1DFB8"/><ellipse cx="44" cy="82" rx="8" ry="4" fill="#FBF8F0"/><circle cx="58" cy="82" r="2.6" fill="#D9452E"/><circle cx="64" cy="84" r="2.6" fill="#BFD69A"/>` + LEAF(50, 60, 20),
    falafel: () => PLATE + [[42, 70], [56, 64], [70, 68], [50, 80], [66, 80]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7.5" fill="#8E5A2B"/><path d="M${x - 4} ${y - 1}a4 4 0 0 1 8 0" fill="#6BAA3A"/>`).join("") + `<ellipse cx="84" cy="78" rx="9" ry="5" fill="#FBF8F0"/>` + LEAF(82, 66, 20),
    tajine: () => SH(100, 40) + `<ellipse cx="60" cy="86" rx="40" ry="10" fill="#B5582E"/><path d="M28 84c6-22 20-42 32-50 12 8 26 28 32 50z" fill="#C8693A"/><path d="M36 76c6-16 16-30 24-36" stroke="#E08A55" stroke-width="3" fill="none"/><circle cx="60" cy="32" r="5" fill="#A54A22"/>`,
    joojeh: () => skewer([["#E8A317", 14, 13], ["#D9452E", 10, 10], ["#E8A317", 14, 13], ["#D9452E", 10, 10], ["#E8A317", 14, 13]]),
    satay: () => skewer([["#9A5B2B", 22, 9], ["#9A5B2B", 22, 9], ["#9A5B2B", 22, 9]]) + `<ellipse cx="34" cy="62" rx="12" ry="6" fill="#C98A3A"/><ellipse cx="34" cy="60" rx="9" ry="3.5" fill="#B5762E"/>`,
    kabsa: () => pot("#E3B26B", `<ellipse cx="54" cy="52" rx="9" ry="6" fill="#A85A27"/><ellipse cx="70" cy="48" rx="7" ry="5" fill="#B5652E"/><path d="M40 52l6-3M76 54l6-2" stroke="#E8742A" stroke-width="2.4" stroke-linecap="round"/><circle cx="62" cy="56" r="2" fill="#4A2A1A"/><circle cx="46" cy="46" r="2" fill="#F3E3BC"/>`),
    tabbouleh: () => bowl("#5FA24A", [["pea", "#D9452E", 4], ["pea", "#E9DDB0", 4], ["pea", "#DCEBC0", 2]], 3),
    beguni: () => PLATE + [[42, 70, -20], [62, 66, 5], [78, 76, 25]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="16" ry="8" fill="#D9A441" stroke="#6B2E6E" stroke-width="2.4" transform="rotate(${r} ${x} ${y})"/><ellipse cx="${x - 3}" cy="${y - 2}" rx="5" ry="2" fill="rgba(255,255,255,.3)" transform="rotate(${r} ${x} ${y})"/>`).join("") + LEAF(34, 86, 0),
    piyaju: () => PLATE + [[40, 70], [54, 64], [68, 66], [82, 72], [48, 80], [64, 80], [78, 84]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7.5" fill="#C98A3A"/><circle cx="${x - 2}" cy="${y - 2}" r="1.4" fill="#5C9E3A"/><circle cx="${x + 2}" cy="${y + 1}" r="1.2" fill="#8E3A6E"/>`).join(""),
    patori: () => PLATE + [[46, 72, -10], [74, 70, 12]].map(([x, y, r]) => `<g transform="rotate(${r} ${x} ${y})"><rect x="${x - 16}" y="${y - 10}" width="32" height="20" rx="5" fill="#5E9A3A"/><path d="M${x - 16} ${y}h32" stroke="#4A7E2C" stroke-width="1.5"/><path d="M${x} ${y - 10}v20" stroke="#E8D9B5" stroke-width="2.4"/></g>`).join("") + `<path d="M52 56q6-8 14 0" stroke="#3E8E41" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    traybake: () => SH(100, 48) + `<rect x="12" y="50" width="96" height="46" rx="8" fill="#3A3A3A"/><rect x="17" y="55" width="86" height="36" rx="5" fill="#545454"/>` +
      [[30, 66, "#D9822B"], [48, 74, "#D9822B"], [70, 64, "#D9822B"], [88, 78, "#D9822B"], [38, 82, "#F1DFC0"], [58, 66, "#5C9E3A"], [80, 68, "#E23B2A"], [62, 82, "#E8742A"], [90, 62, "#F1DFC0"]].map(([x, y, c], i) => `<rect x="${x - 6}" y="${y - 5}" width="12" height="10" rx="3" fill="${c}" transform="rotate(${(i * 29) % 50 - 25} ${x} ${y})"/>`).join(""),
    eggmug: () => SH(100, 26) + `<path d="M84 52c12 0 12 26 0 26" stroke="#D9C9AC" stroke-width="6" fill="none"/><path d="M36 40h50v52a8 8 0 0 1-8 8H44a8 8 0 0 1-8-8z" fill="#EADFCB"/><ellipse cx="61" cy="40" rx="25" ry="7" fill="#F2C94C"/><circle cx="54" cy="39" r="1.8" fill="#3E8E41"/><circle cx="66" cy="41" r="1.8" fill="#3E8E41"/><circle cx="60" cy="37" r="1.6" fill="#D9452E"/><path d="M48 32q4-8 10-4" stroke="#F4F0E6" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    biryani: () => pot("#F5E6BE", `<path d="M40 50q6-4 10 1M60 44q5-3 9 2M72 52q4-4 9 0" stroke="#E8A317" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="52" cy="54" rx="7" ry="5" fill="#B5652E"/><ellipse cx="70" cy="47" rx="6" ry="4.5" fill="#A85A27"/>${LEAF(44, 46, 20)}${LEAF(80, 50, -20)}${LEAF(62, 55, 50)}`),
    kabuli: () => pot("#E9C98F", `<path d="M38 52l8-6M50 46l9-4M64 47l8 3M76 52l7-5M56 54l10-2" stroke="#E8742A" stroke-width="3" stroke-linecap="round"/><circle cx="46" cy="54" r="2.4" fill="#4A2A1A"/><circle cx="68" cy="53" r="2.4" fill="#4A2A1A"/><circle cx="60" cy="44" r="2.4" fill="#4A2A1A"/><circle cx="80" cy="55" r="2.2" fill="#4A2A1A"/>`),
    khichuri: () => bowl("#E3B23C", [["pea", "#6BAA3A", 3], ["chunk", "#E8742A", 2], ["pea", "#F4E3B5", 2]], 2),
    haleem: () => bowl("#9A5B32", [["strand", "#F2D16B", 3], ["strand", "#C77A3A", 2]], 3),
    shorwa: () => bowl("#E3A24A", [["chunk", "#E8742A", 2], ["chunk", "#F1DFC0", 2], ["pea", "#D9B36A", 3], ["chunk", "#C98A5A", 1]], 2),
    dal: () => bowl("#E8B33A", [["pea", "#B5412A", 2], ["strand", "#8B5A2B", 1]], 3),
    daalmash: () => bowl("#D9A54E", [["pea", "#F3E3BC", 5], ["strand", "#F2D16B", 2]], 3),
    karahi: () => bowl("#C2452B", [["chunk", "#E79A5B", 4], ["strand", "#F2D16B", 2], ["pea", "#5C9E3A", 1]], 3),
    jhol: () => bowl("#C8682B", [["chunk", "#E5A26B", 3], ["chunk", "#F1DFC0", 1], ["pea", "#5C9E3A", 2]], 3),
    palak: () => bowl("#3F7A34", [["chunk", "#EAC9A0", 4], ["swirl", "#F8F2E6", 1]], 0),
    chana: () => bowl("#B5662F", [["pea", "#E6C27A", 5], ["chunk", "#E5A26B", 2]], 3),
    kofta: () => bowl("#C24A2E", [["ball", "#7A3E22", 4], ["swirl", "#F8F2E6", 1]], 3),
    jalfrezi: () => bowl("#B8402A", [["chunk", "#5C9E3A", 2], ["chunk", "#E23B2A", 2], ["chunk", "#EAC9A0", 3]], 1),
    dimbhuna: () => bowl("#C8682B", [["egg", "", 2], ["pea", "#5C9E3A", 2]], 3),
    lau: () => bowl("#DCE8C3", [["shrimp", "#EE8A4F", 3], ["chunk", "#BFD69A", 3]], 3),
    seekh: () => skewer([["#8E4A28", 26, 12], ["#8E4A28", 26, 12], ["#8E4A28", 26, 12]]),
    tikka: () => skewer([["#D9822B", 14, 13], ["#5C9E3A", 11, 11], ["#D9822B", 14, 13], ["#E9D7C3", 11, 11], ["#D9822B", 14, 13]]),
    afghankabab: () => skewer([["#D9A35B", 14, 13], ["#E9D7C3", 10, 10], ["#D9A35B", 14, 13], ["#E9D7C3", 10, 10], ["#D9A35B", 14, 13]]),
    jali: () => PLATE + `<ellipse cx="48" cy="72" rx="20" ry="11" fill="#8E4E2B"/><ellipse cx="72" cy="68" rx="20" ry="11" fill="#9A5530"/>` +
      `<path d="M58 62c4 4 8 2 12 6s8 0 12 4M60 70c4-3 7 2 11-1s8 2 12-1M32 70c4 3 8-2 12 2s8-1 12 3M34 77c5-2 8 2 12 0s7 2 11 0" stroke="#F2C94C" stroke-width="2" fill="none" stroke-linecap="round"/>` + LEAF(86, 82, 10) + LEAF(30, 84, -20),
    chapli: () => PLATE + `<path d="M26 74c0-12 18-18 34-18s34 6 34 18-18 16-34 16-34-4-34-16z" fill="#7E4426"/>` +
      `<circle cx="50" cy="70" r="7" fill="#D9452E"/><circle cx="50" cy="70" r="4" fill="#F07A5A"/><circle cx="70" cy="76" r="1.8" fill="#5C9E3A"/><circle cx="64" cy="66" r="1.8" fill="#5C9E3A"/><circle cx="76" cy="68" r="1.6" fill="#F3E3BC"/>` + LEAF(84, 86, 0),
    chap: () => PLATE + `<path d="M28 66c6-10 52-12 62-2 6 8-2 20-14 22-16 3-40 2-46-6-3-4-4-9-2-14z" fill="#C46A2C"/>` +
      `<path d="M40 64l26 22M52 62l26 22M64 62l20 17" stroke="#8A4318" stroke-width="2.6" stroke-linecap="round"/>` + LEAF(30, 88, 20) + `<path d="M84 90a8 8 0 0 1 16 0z" fill="#F4D03F"/>`,
    fish: () => fish("#E07B39", "#B4521F"),
    vapa: () => fish("#D9A21B", "#A97A0E"),
    lahori: () => fish("#D88A2E", "#9E5A16"),
    mantu: () => PLATE + `<ellipse cx="60" cy="74" rx="36" ry="14" fill="#FBF8F0"/>` +
      [[44, 70], [62, 66], [78, 72], [56, 80]].map(([x, y]) => `<path d="M${x - 9} ${y + 4}c0-9 4-14 9-14s9 5 9 14c-6 3-12 3-18 0z" fill="#F1E3C4" stroke="#D9C49B" stroke-width="1.2"/><path d="M${x} ${y - 9}v4" stroke="#D9C49B" stroke-width="1.4"/>`).join("") +
      `<path d="M40 64c8 6 16 0 24 6s14 2 20 6" stroke="#C8402A" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="50" cy="84" r="1.6" fill="#3E8E41"/><circle cx="70" cy="62" r="1.6" fill="#3E8E41"/><circle cx="76" cy="82" r="1.6" fill="#3E8E41"/>`,
    tomatoegg: () => SH(100, 44) + `<rect x="92" y="64" width="26" height="7" rx="3.5" fill="#2F2F2F" transform="rotate(-12 92 64)"/><ellipse cx="56" cy="70" rx="44" ry="20" fill="#2F2F2F"/><ellipse cx="56" cy="68" rx="38" ry="15" fill="#C8402A"/>` +
      `<ellipse cx="44" cy="66" rx="11" ry="7" fill="#FBF8F0"/><circle cx="44" cy="66" r="4" fill="#F2B705"/><ellipse cx="68" cy="70" rx="11" ry="7" fill="#FBF8F0"/><circle cx="68" cy="70" r="4" fill="#F2B705"/>` + LEAF(56, 60, 20) + LEAF(30, 72, -30) + LEAF(82, 62, 40),
    afghani: () => drum("#E7C48F", "#B98A4E"),
    roast: () => drum("#B5572B", "#7E3516") + `<circle cx="40" cy="86" r="2.2" fill="#4A2A1A"/><circle cx="80" cy="60" r="2.2" fill="#4A2A1A"/><circle cx="60" cy="88" r="2.2" fill="#4A2A1A"/><path d="M50 58l6-6" stroke="#3E8E41" stroke-width="3" stroke-linecap="round"/>`,
    _old: () => PLATE + [[46, 72, -18], [72, 70, 14]].map(([x, y, r]) => `<g transform="rotate(${r} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="15" ry="11" fill="#E7C48F"/><path d="M${x - 8} ${y - 4}l12 8M${x - 4} ${y - 8}l12 8" stroke="#B98A4E" stroke-width="2" stroke-linecap="round"/><rect x="${x + 12}" y="${y - 2.5}" width="12" height="5" rx="2.5" fill="#F4EFE6"/><circle cx="${x + 25}" cy="${y - 2}" r="3" fill="#F4EFE6"/><circle cx="${x + 25}" cy="${y + 2}" r="3" fill="#F4EFE6"/></g>`).join("") + LEAF(34, 88, 10) + LEAF(86, 88, -10),
    chaat: () => bowl("#E9CC8A", [["pea", "#D8A85A", 4], ["chunk", "#D9452E", 2], ["ring", "#8E3A6E", 1], ["chunk", "#BFD69A", 1]], 3),
    borhani: () => SH(102, 22) + `<path d="M42 28h36l-5 70H47z" fill="#E7EEDB" stroke="#CDD8BE" stroke-width="2"/><path d="M42 28h36l-1 10H43z" fill="#F8FAF2"/>` +
      `<path d="M68 18l-6 50" stroke="#2E7D4F" stroke-width="3" stroke-linecap="round"/>` + LEAF(54, 30, -10) + LEAF(62, 27, 30) + `<circle cx="52" cy="60" r="1.2" fill="#3E8E41"/><circle cx="60" cy="72" r="1.2" fill="#3E8E41"/><circle cx="56" cy="84" r="1.2" fill="#3E8E41"/>`,
    salad: () => bowl("#8CC152", [["chunk", "#D9452E", 2], ["ring", "#8E3A6E", 1], ["pea", "#DCEBC0", 3], ["strand", "#E8742A", 1]], 2),
    grillsalad: () => bowl("#B9D98A", [["ring", "#8E3A6E", 2], ["strand", "#E8742A", 2], ["chunk", "#D9452E", 2], ["pea", "#E9F3D8", 2]], 1),
    garlic: () => cup("#FBF7EE", `<circle cx="52" cy="58" r="1.6" fill="#3E8E41"/><circle cx="64" cy="61" r="1.6" fill="#3E8E41"/><circle cx="70" cy="57" r="1.2" fill="#2A2A2A"/><path d="M86 40c0-7 10-7 10 0 0 5-5 8-5 8s-5-3-5-8z" fill="#F4EFE6" stroke="#D9CDB4" stroke-width="1.2"/>`),
    pudina: () => cup("#5FA24A", `<path d="M50 59c6-3 14 3 20 0" stroke="#F8F2E6" stroke-width="2" fill="none" stroke-linecap="round"/>${LEAF(88, 42, -30)}${LEAF(92, 48, 20)}${LEAF(84, 48, 60)}`),
    tomato: () => cup("#C8402A", `<circle cx="90" cy="44" r="9" fill="#D9452E"/><path d="M86 36l4 3 4-3" stroke="#3E8E41" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M28 44l6 4" stroke="#B5412A" stroke-width="3" stroke-linecap="round"/>`),
    borani: () => PLATE + `<ellipse cx="60" cy="74" rx="36" ry="14" fill="#FBF8F0"/>` +
      [[44, 70], [62, 66], [78, 72], [58, 80]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="6" fill="#E9D7A6" stroke="#5B2A5E" stroke-width="2.4"/>`).join("") +
      `<path d="M46 72c6-4 12 4 18 0s10 2 16 0" stroke="#C8402A" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="54" cy="64" r="1.6" fill="#3E8E41"/><circle cx="70" cy="78" r="1.6" fill="#3E8E41"/>`,
    bhorta: () => bowl("#8A6A4A", [["pea", "#5C9E3A", 3], ["ring", "#8E3A6E", 1], ["pea", "#C9A27A", 2]], 3) + `<path d="M84 34c8 2 14 10 12 18" stroke="#5B2A5E" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M82 32l4-6" stroke="#3E8E41" stroke-width="3" stroke-linecap="round"/>`
  };
  const POSP = [[44, 72], [60, 66], [76, 71], [52, 80], [68, 80], [36, 77], [84, 79], [60, 74], [46, 64], [74, 63]];
  const onPlate = (items) => { let k = 0, out = ""; items.forEach(([t, c, n]) => { for (let j = 0; j < n; j++) { out += item(t, c, POSP[k % POSP.length], k); k++; } }); return out; };
  const glass = (c) => SH(102, 22) + `<path d="M42 28h36l-5 70H47z" fill="${c}" stroke="rgba(0,0,0,.12)" stroke-width="2"/><path d="M42 28h36l-1 10H43z" fill="rgba(255,255,255,.55)"/><path d="M68 18l-6 50" stroke="#2E7D4F" stroke-width="3" stroke-linecap="round"/>` + LEAF(54, 30, -10) + LEAF(62, 27, 30);
  const fromSpec = (s) => {
    if (!s) return A.jhol();
    const [k, c, it, l] = s;
    if (k === "bowl") return bowl(c, it || [], l == null ? 2 : l);
    if (k === "plate") return PLATE + onPlate(c);
    if (k === "pan") return pan(c, (() => { let q = 0, o = ""; (it || []).forEach(([t, cc, n]) => { for (let j = 0; j < n; j++) { o += item(t, cc, POSP[q % POSP.length].map((v, ix) => ix ? v - 6 : v), q); q++; } }); return o; })());
    if (k === "glass") return glass(c);
    if (k === "cup") return cup(c, LEAF(88, 44, -20));
    if (k === "fish") return fish(c, it);
    return A.jhol();
  };
  return (id) => `<svg viewBox="0 0 120 120" aria-hidden="true">${A[id] ? A[id]() : fromSpec(typeof R !== "undefined" && R[id] ? R[id].art : null)}</svg>`;
})();
