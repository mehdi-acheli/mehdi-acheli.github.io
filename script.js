document.documentElement.classList.add("js");
const root = document.documentElement;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// theme
try { const saved = localStorage.getItem("theme"); if (saved) root.dataset.theme = saved; } catch {}
document.getElementById("theme").addEventListener("click", () => {
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("theme", root.dataset.theme); } catch {}
});
document.getElementById("year").textContent = new Date().getFullYear();

// cursor glow
let lastX = -400, lastY = -400;
function updateGlow() {
  root.style.setProperty("--mx", lastX + "px");
  root.style.setProperty("--my", lastY + "px");
  root.style.setProperty("--sy", -(scrollY % 28) + "px"); // keep the lit grid aligned with the page grid
  const el = document.elementFromPoint(lastX, lastY);
  document.body.classList.toggle("in-text", !!(el && el.closest("#about, #experience, #education")));
}
addEventListener("pointermove", e => { lastX = e.clientX; lastY = e.clientY; updateGlow(); });
addEventListener("scroll", updateGlow, { passive: true });

// reveal on scroll (staggered inside a group)
const groups = new Map();
document.querySelectorAll(".reveal").forEach(el => {
  const p = el.parentElement;
  const i = groups.get(p) || 0;
  groups.set(p, i + 1);
  el.style.setProperty("--d", Math.min(i, 5) * 0.08 + "s");
});
const io = new IntersectionObserver(entries => entries.forEach(en => {
  if (!en.isIntersecting) return;
  en.target.classList.add("in");
  io.unobserve(en.target);
  const n = en.target.querySelector("[data-count]");
  if (n) countUp(n);
}), { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

function countUp(el) {
  const end = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
  if (reduce) return;
  const t0 = performance.now();
  (function step(t) {
    const k = Math.min((t - t0) / 1100, 1), ease = 1 - Math.pow(1 - k, 3);
    el.textContent = (end * ease).toFixed(dec);
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}

// active nav link
const links = [...document.querySelectorAll(".nav nav a")];
const spy = new IntersectionObserver(entries => entries.forEach(en => {
  if (en.isIntersecting) {
    links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
    document.querySelector(".more-btn").classList.toggle("active", !!document.querySelector(".more-menu a.active"));
  }
}), { rootMargin: "-40% 0px -55% 0px" });
document.querySelectorAll("main section[id]").forEach(s => spy.observe(s));

// typed terminal
const TABS = {
  now: "whoami\nMehdi Acheli — postdoctoral researcher in AI, CEA\nfocus: federated learning under resource heterogeneity",
  focus: "ls research/\nfederated-edge-learning  cloud-edge-iot  process-science\ngraph-learning  security-rating",
  reach: "mail mehdi.acheli@gmail.com\n# also on DBLP and LinkedIn — see links below",
};
if (document.documentElement.lang === "fr") Object.assign(TABS, {
  now: "whoami\nMehdi Acheli — chercheur postdoctoral en IA, CEA\nfocus : federated learning sous hétérogénéité des ressources",
  focus: "ls research/\nfederated-edge-learning  cloud-edge-iot  process-science\ngraph-learning  security-rating",
  reach: "mail mehdi.acheli@gmail.com\n# aussi sur DBLP et LinkedIn — voir les liens ci-dessous",
});
const out = document.getElementById("typed");
let timer, current = "now";
function type(key) {
  clearTimeout(timer);
  current = key;
  const text = TABS[key];
  if (reduce) { out.textContent = text; return; }
  out.textContent = "";
  let i = 0;
  (function tick() {
    out.textContent = text.slice(0, ++i);
    if (i < text.length) timer = setTimeout(tick, text[i - 1] === "\n" ? 260 : 22);
  })();
}
document.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(x => x.classList.toggle("on", x === b));
  type(b.dataset.tab);
}));
type("now");

// publication filters: every button is an independent toggle.
// Projects combine with OR, the two type buttons (students' papers, thesis) combine with OR,
// and the two groups narrow each other (AND). Preprints are hidden unless "Preprints" is on;
// when it is on they are simply added to whatever the other filters show, and counted in their project.
(() => {
  const items = [...document.querySelectorAll(".pubs li")];
  const phdBtn = document.getElementById("f-phd");
  const thesisBtn = document.getElementById("f-thesis");
  const preprintBtn = document.getElementById("f-preprint");
  const projBtns = [...document.querySelectorAll(".fbtn[data-project]")];
  const clearBtn = document.getElementById("f-clear");
  const none = document.getElementById("noresult");
  const projects = new Set();
  let phdOnly = false, thesisOnly = false, preprintOn = false;
  const counts = projBtns.map(b => {
    const sup = document.createElement("sup");
    b.appendChild(sup);
    return sup;
  });
  function apply() {
    const typeOn = phdOnly || thesisOnly;
    let shown = 0;
    items.forEach(li => {
      const gateOk = li.dataset.preprint !== "1" || preprintOn;
      const typeOk = !typeOn || (phdOnly && li.dataset.phd === "1") || (thesisOnly && li.dataset.thesis === "1");
      const projOk = projects.size === 0 || projects.has(li.dataset.project);
      li.hidden = !(gateOk && typeOk && projOk);
      if (!li.hidden) shown++;
    });
    none.hidden = shown > 0;
    projBtns.forEach((b, i) => {
      counts[i].textContent = items.filter(li => li.dataset.project === b.dataset.project && (preprintOn || li.dataset.preprint !== "1")).length;
    });
    const state = [[phdBtn, phdOnly], [thesisBtn, thesisOnly], [preprintBtn, preprintOn], ...projBtns.map(b => [b, projects.has(b.dataset.project)])];
    state.forEach(([b, on]) => { b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    clearBtn.hidden = !(typeOn || preprintOn || projects.size);
  }
  phdBtn.addEventListener("click", () => { phdOnly = !phdOnly; apply(); });
  thesisBtn.addEventListener("click", () => { thesisOnly = !thesisOnly; apply(); });
  preprintBtn.addEventListener("click", () => { preprintOn = !preprintOn; apply(); });
  projBtns.forEach(b => b.addEventListener("click", () => {
    const p = b.dataset.project;
    projects.has(p) ? projects.delete(p) : projects.add(p);
    apply();
  }));
  clearBtn.addEventListener("click", () => { phdOnly = thesisOnly = preprintOn = false; projects.clear(); apply(); });
  apply();
})();

// nav "More" menu: open on click (touch / keyboard), close on outside click, Escape or link choice
(() => {
  const more = document.querySelector(".more");
  const btn = more.querySelector(".more-btn");
  const set = open => { more.classList.toggle("open", open); btn.setAttribute("aria-expanded", open); };
  btn.addEventListener("click", e => { e.stopPropagation(); set(!more.classList.contains("open")); });
  document.addEventListener("click", () => set(false));
  document.addEventListener("keydown", e => { if (e.key === "Escape") set(false); });
  more.querySelectorAll("a").forEach(a => a.addEventListener("click", () => set(false)));
})();

// small screens: burger button opens the full link list
(() => {
  const nav = document.querySelector(".nav");
  const btn = document.getElementById("burger");
  const set = open => {
    nav.classList.toggle("open", open);
    document.documentElement.classList.toggle("nav-open", open);
    btn.setAttribute("aria-expanded", open);
    btn.textContent = open ? "✕" : "☰";
  };
  btn.addEventListener("click", e => { e.stopPropagation(); set(!nav.classList.contains("open")); });
  document.addEventListener("click", e => { if (!nav.contains(e.target)) set(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") set(false); });
  nav.querySelectorAll("nav a").forEach(a => a.addEventListener("click", () => set(false)));
})();

// language switch: keep the reader on the section they are in
// (the position is remembered as "section + how far through it", since the two languages differ in length;
// it travels in sessionStorage so the URL stays clean)
(() => {
  const link = document.getElementById("lang");
  if (!link) return;
  link.addEventListener("click", () => {
    const secs = [...document.querySelectorAll("main section[id]")];
    // at the very bottom (e.g. in Contact on a phone, where the last section cannot reach the top of the screen)
    // the section under the top edge is the previous one: remember "bottom" instead
    // (generous margin: phone browsers resize the viewport as their address bar slides, so "exactly at the bottom" is unreliable)
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 150) {
      try { sessionStorage.setItem("langjump", JSON.stringify({ bottom: true, t: Date.now() })); } catch {}
      return;
    }
    const here = secs.filter(s => s.getBoundingClientRect().top <= 1).pop();
    if (!here) return;
    const r = here.getBoundingClientRect();
    try { sessionStorage.setItem("langjump", JSON.stringify({ id: here.id, f: Math.min(Math.max(-r.top / r.height, 0), 1), t: Date.now() })); } catch {}
  });
})();

// arriving from the language switch: restore the position while the page is still hidden
// (see html.arriving in the stylesheet), once fonts and images have settled, then reveal it
(() => {
  const root = document.documentElement;
  if (!root.classList.contains("arriving")) return;
  let pos = null;
  try {
    pos = JSON.parse(sessionStorage.getItem("langjump"));
    sessionStorage.removeItem("langjump");
  } catch {}
  if (pos && Date.now() - pos.t > 10000) pos = null;
  const target = pos ? (pos.id && document.getElementById(pos.id)) : document.getElementById(decodeURIComponent(location.hash.slice(1)));
  let done = false;
  const reveal = () => {
    if (done) return;
    done = true;
    if (pos && pos.bottom) {
      const toBottom = () => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
      toBottom();
      setTimeout(toBottom, 250); // once late layout changes (fonts, images) have settled
    } else if (pos && target) {
      const r = target.getBoundingClientRect();
      scrollTo({ top: scrollY + r.top + pos.f * r.height, behavior: "instant" });
    } else if (target) target.scrollIntoView({ behavior: "instant" });
    setTimeout(() => root.classList.remove("arriving"), 30); // a timer, not rAF: rAF is paused in background tabs
  };
  const settle = () => (document.fonts ? document.fonts.ready : Promise.resolve()).then(reveal);
  if (document.readyState === "complete") settle(); else addEventListener("load", settle);
  setTimeout(reveal, 2500);
})();

// nav: collapse into the menu button whenever the links do not fit on one line (any language, any width)
(() => {
  const nav = document.querySelector(".nav");
  const theme = document.getElementById("theme");
  const burger = document.getElementById("burger");
  const fit = () => {
    nav.classList.remove("compact");
    const room = nav.getBoundingClientRect().right - parseFloat(getComputedStyle(nav).paddingRight);
    if (theme.getBoundingClientRect().right > room + 0.5) {
      nav.classList.add("compact");
    } else {
      // the full bar fits: make sure a menu left open on a smaller window does not keep the page locked
      nav.classList.remove("open");
      document.documentElement.classList.remove("nav-open");
      burger.textContent = "☰";
      burger.setAttribute("aria-expanded", "false");
    }
  };
  fit();
  addEventListener("resize", fit);
  if (document.fonts) document.fonts.ready.then(fit);
})();
