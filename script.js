(function () {
  "use strict";

  /* Safe storage: may be missing or throw in the viewer's frame. */
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Theme ---------- */
  var themeBtn = $("#themeBtn");
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function isDark() {
    var t = root.getAttribute("data-theme");
    if (t) return t === "dark";
    return !!(mq && mq.matches);
  }
  var onTheme = function () {};
  function paintThemeBtn() { themeBtn.textContent = isDark() ? "Light mode" : "Dark mode"; onTheme(); }
  var saved = store.get("vl-theme");
  if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);
  paintThemeBtn();
  themeBtn.addEventListener("click", function () {
    var next = isDark() ? "light" : "dark";
    root.setAttribute("data-theme", next);
    store.set("vl-theme", next);
    paintThemeBtn();
  });
  if (mq && mq.addEventListener) mq.addEventListener("change", paintThemeBtn);

  /* ---------- Reading progress ---------- */
  var bar = $("#progress");
  function onScroll() {
    var h = root.scrollHeight - root.clientHeight;
    bar.style.width = (h > 0 ? Math.min(100, (root.scrollTop || document.body.scrollTop) / h * 100) : 0) + "%";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Active nav link ---------- */
  var links = $$(".nav a");
  var sections = links.map(function (a) { return $(a.getAttribute("href")); }).filter(Boolean);
  function setActive(id) {
    links.forEach(function (a) {
      if (a.getAttribute("href") === "#" + id) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: "-30% 0px -60% 0px" });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---------- Hero waveform ---------- */
  var wave = $("#wave");
  if (wave) {
    var heights = [30, 55, 78, 46, 92, 64, 38, 84, 58, 100, 70, 44, 88, 52, 74, 36, 82, 60, 96, 48, 68, 34, 76, 54];
    heights.forEach(function (h, i) {
      var b = document.createElement("i");
      b.style.setProperty("--h", h + "%");
      b.style.setProperty("--d", (i * 0.07).toFixed(2) + "s");
      wave.appendChild(b);
    });
  }

  /* ---------- Fixed vs growth pairing ---------- */
  var compare = $(".compare");
  var rows = $$(".compare .row");
  function highlight(k) {
    rows.forEach(function (r) { r.classList.toggle("hl", !!k && r.getAttribute("data-k") === k); });
    compare.classList.toggle("has-hl", !!k);
  }
  rows.forEach(function (r) {
    var k = r.getAttribute("data-k");
    r.addEventListener("mouseenter", function () { highlight(k); });
    r.addEventListener("mouseleave", function () { highlight(null); });
    r.addEventListener("focus", function () { highlight(k); });
    r.addEventListener("blur", function () { highlight(null); });
    r.addEventListener("click", function () { highlight(r.classList.contains("hl") ? null : k); });
  });

  /* ---------- Reframe toggle ---------- */
  var reframeBtn = $("#reframeBtn");
  var sessions = $("#sessions");
  reframeBtn.addEventListener("click", function () {
    var on = sessions.classList.toggle("reframed");
    reframeBtn.setAttribute("aria-pressed", on ? "true" : "false");
    reframeBtn.textContent = on ? "Show original voices" : "Reframe the voices";
  });

})();
