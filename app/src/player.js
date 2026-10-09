
/* recipe video player: animated step-by-step scenes */
const PL = (() => {
  const el = document.getElementById("player");
  let scenes = [], idx = 0, playing = false, elapsed = 0, last = 0, raf = 0, wake = null, rec = false, recipe = null;
  let timer = null;
  const minutesIn = (s) => {
    const m = s.match(/(\d+)(?:\s*[–-]\s*(\d+))?\s*(?:min|minute)/i);
    return m ? +(m[2] || m[1]) : 0;
  };
  const mmss = (sec) => String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0");

  function build(r) {
    const cls = TINT(r);
    const s = [];
    s.push({ d: 4200, kind: "intro", html: `<div class="pl-art ${cls}">${ART(r.id)}<i class="st s1"></i><i class="st s2"></i><i class="st s3"></i></div>
      <p class="pl-kicker">${esc(r.origin)} · easy · light</p><h2 class="pl-title">${esc(r.name)}</h2>
      <p class="pl-meta num">${r.kcal} kcal · ${r.p} g protein · ${esc(r.time)}</p>` });
    const ing = r.ing.slice(0, 8);
    s.push({ d: Math.min(9000, 2600 + ing.length * 650), kind: "ing", html: `<p class="pl-kicker">Serves ${r.base}</p><h2 class="pl-title sm">What you need</h2>
      <ul class="pl-ing">${ing.map(([q, u, t], i) => `<li style="animation-delay:${0.35 + i * 0.45}s"><b class="num">${q == null ? "" : fmtQty(q) + (u ? " " + esc(u) : "")}</b> ${esc(one(q, u, t))}</li>`).join("")}</ul>` });
    r.steps.forEach((t, i) => {
      s.push({ d: Math.min(10000, 3600 + t.length * 55), kind: "step", min: minutesIn(t), html: `<div class="pl-art small ${cls}">${ART(r.id)}<i class="st s1"></i><i class="st s2"></i></div>
        <p class="pl-kicker num">Step ${i + 1} of ${r.steps.length}</p><p class="pl-step">${esc(t)}</p>` });
    });
    s.push({ d: 4500, kind: "outro", html: `<div class="pl-art ${cls}">${ART(r.id)}</div><h2 class="pl-title">Ready to eat!</h2>
      ${r.reg > r.kcal ? `<p class="pl-meta num">About ${r.reg - r.kcal} kcal lighter per serving than the usual version</p>` : ""}<p class="pl-brand">Deshi Diet Thala</p>` });
    return s;
  }
  function bars() {
    el.querySelector(".pl-bars").innerHTML = scenes.map(() => `<span><i></i></span>`).join("");
  }
  function show(i) {
    idx = Math.max(0, Math.min(scenes.length - 1, i));
    elapsed = 0;
    stopTimer();
    const sc = scenes[idx];
    const stage = el.querySelector(".pl-stage");
    stage.className = "pl-stage " + sc.kind;
    stage.innerHTML = sc.html;
    void stage.offsetWidth;
    stage.classList.add("in");
    const tb = el.querySelector(".pl-timer");
    if (sc.min && !rec) { tb.hidden = false; tb.textContent = `Start a ${sc.min}-minute timer`; tb.onclick = () => startTimer(sc.min); }
    else tb.hidden = true;
    paint();
  }
  function paint() {
    el.querySelectorAll(".pl-bars i").forEach((b, i) => {
      b.style.width = i < idx ? "100%" : i > idx ? "0%" : Math.min(100, (elapsed / scenes[idx].d) * 100) + "%";
    });
    el.querySelector(".pl-play").innerHTML = playing ? ICON.pause : ICON.play;
    el.querySelector(".pl-play").setAttribute("aria-label", playing ? "Pause" : "Play");
  }
  function loop(t) {
    if (!playing) return;
    if (last) elapsed += t - last;
    last = t;
    if (elapsed >= scenes[idx].d) {
      if (idx < scenes.length - 1) show(idx + 1);
      else { playing = false; elapsed = scenes[idx].d; paint(); el.dispatchEvent(new Event("ended")); return; }
    }
    paint();
    raf = requestAnimationFrame(loop);
  }
  function play() { if (playing) return; if (idx === scenes.length - 1 && elapsed >= scenes[idx].d) show(0); playing = true; last = 0; el.classList.remove("paused"); raf = requestAnimationFrame(loop); paint(); }
  function pause() { playing = false; cancelAnimationFrame(raf); el.classList.add("paused"); paint(); }
  function startTimer(min) {
    pause();
    let left = min * 60;
    const tb = el.querySelector(".pl-timer");
    tb.classList.add("on");
    tb.textContent = `⏱ ${mmss(left)} · tap to stop`;
    tb.onclick = () => { stopTimer(); tb.textContent = `Start a ${min}-minute timer`; tb.onclick = () => startTimer(min); };
    timer = setInterval(() => {
      left--;
      if (left <= 0) {
        stopTimer();
        tb.classList.add("on");
        tb.textContent = "Time's up — next step";
        beep();
        tb.onclick = () => { show(idx + 1); play(); };
        return;
      }
      tb.textContent = `⏱ ${mmss(left)} · tap to stop`;
    }, 1000);
  }
  function stopTimer() { if (timer) clearInterval(timer); timer = null; const tb = el.querySelector(".pl-timer"); if (tb) tb.classList.remove("on"); }
  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.35, 0.7].forEach((o) => {
        const g = ctx.createGain(), osc = ctx.createOscillator();
        osc.frequency.value = 880; osc.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.0001, ctx.currentTime + o);
        g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + o + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + o + 0.25);
        osc.start(ctx.currentTime + o); osc.stop(ctx.currentTime + o + 0.3);
      });
    } catch (e) {}
    try { navigator.vibrate && navigator.vibrate([300, 150, 300]); } catch (e) {}
  }
  const ICON = {
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor" stroke="none"/></svg>'
  };
  function open(id, opts = {}) {
    recipe = R[id];
    rec = !!opts.rec;
    scenes = build(recipe);
    el.classList.toggle("rec", rec);
    el.hidden = false;
    document.body.classList.add("lock");
    el.setAttribute("aria-hidden", "false");
    bars();
    show(0);
    play();
    try { navigator.wakeLock && navigator.wakeLock.request("screen").then((w) => (wake = w)).catch(() => {}); } catch (e) {}
  }
  function close() {
    pause();
    stopTimer();
    el.hidden = true;
    if (!document.getElementById("page").classList.contains("open")) document.body.classList.remove("lock");
    el.setAttribute("aria-hidden", "true");
    try { wake && wake.release(); } catch (e) {}
    wake = null;
  }
  el.querySelector(".pl-close").onclick = close;
  el.querySelector(".pl-play").onclick = () => (playing ? pause() : play());
  el.querySelector(".pl-prev").onclick = () => { show(idx - 1); };
  el.querySelector(".pl-next").onclick = () => { if (idx < scenes.length - 1) show(idx + 1); };
  el.querySelector(".pl-stage").addEventListener("click", (e) => {
    const x = e.clientX / window.innerWidth;
    if (x < 0.3) show(idx - 1); else if (x > 0.7 && idx < scenes.length - 1) show(idx + 1); else (playing ? pause() : play());
  });
  document.addEventListener("keydown", (e) => {
    if (el.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === " ") { e.preventDefault(); playing ? pause() : play(); }
    if (e.key === "ArrowRight" && idx < scenes.length - 1) show(idx + 1);
    if (e.key === "ArrowLeft") show(idx - 1);
  });
  return { open, close, total: () => scenes.reduce((a, s) => a + s.d, 0) };
})();
