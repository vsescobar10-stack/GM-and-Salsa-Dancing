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

  /* ---------- Question tools ---------- */
  var readyCount = $("#readyCount");
  function updateReady() {
    var n = $$(".q.ready").length;
    readyCount.textContent = n + " of 3 ready";
    readyCount.classList.toggle("done", n === 3);
  }
  function fmt(s) { return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function copyText(text, msgEl) {
    function done(ok) {
      msgEl.textContent = ok ? "Copied" : "Could not copy. Select the text and copy it manually.";
      setTimeout(function () { msgEl.textContent = ""; }, 2500);
    }
    try {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    } catch (e) { done(false); }
  }

  $$(".q").forEach(function (card) {
    var q = card.getAttribute("data-q");
    var tools = $(".tools", card);
    var C = 163.4; /* circumference of r=26 */

    tools.innerHTML =
      '<div class="notes">' +
        '<label for="' + q + '-notes">My notes for this answer</label>' +
        '<textarea id="' + q + '-notes" placeholder="Name what you will feel. Write the fixed-mindset voice. Answer it with a concrete strategy."></textarea>' +
        '<div class="btn-row">' +
          '<button type="button" class="ghost" data-act="copy-line">Copy opening line</button>' +
          '<button type="button" class="ghost" data-act="copy-notes">Copy my notes</button>' +
          '<label class="ready-toggle"><input type="checkbox" id="' + q + '-ready"> Ready to record</label>' +
          '<span class="msg" role="status"></span>' +
        '</div>' +
      '</div>' +
      '<div class="timer">' +
        '<div class="ring">' +
          '<svg viewBox="0 0 64 64" aria-hidden="true"><circle class="bg" cx="32" cy="32" r="26"></circle><circle class="fg" cx="32" cy="32" r="26"></circle></svg>' +
          '<output>1:00</output>' +
        '</div>' +
        '<button type="button" data-act="timer">Start 60 s</button>' +
        '<span class="hint">Practice run. Nothing is recorded.</span>' +
      '</div>';

    var ta = $("textarea", card);
    var ready = $("#" + q + "-ready");
    var msg = $(".msg", card);

    var savedNote = store.get("vl-notes-" + q);
    if (savedNote) ta.value = savedNote;
    ta.addEventListener("input", function () { store.set("vl-notes-" + q, ta.value); });

    if (store.get("vl-ready-" + q) === "1") { ready.checked = true; card.classList.add("ready"); }
    ready.addEventListener("change", function () {
      card.classList.toggle("ready", ready.checked);
      store.set("vl-ready-" + q, ready.checked ? "1" : "0");
      updateReady();
    });

    $('[data-act="copy-line"]', card).addEventListener("click", function () {
      copyText($(".line", card).textContent, msg);
    });
    $('[data-act="copy-notes"]', card).addEventListener("click", function () {
      if (!ta.value.trim()) { msg.textContent = "Write something first."; setTimeout(function () { msg.textContent = ""; }, 2000); return; }
      copyText(ta.value, msg);
    });

    /* Timer with progress ring */
    var tBtn = $('[data-act="timer"]', card);
    var ring = $(".ring", card);
    var fg = $(".fg", card);
    var out = $("output", card);
    var left = 60, id = null;
    fg.style.strokeDasharray = C;
    function paint() {
      out.textContent = fmt(left);
      fg.style.strokeDashoffset = String(C * (1 - left / 60));
      ring.classList.toggle("low", left <= 10);
    }
    function stop(label) {
      clearInterval(id); id = null;
      tBtn.textContent = label || "Start 60 s";
    }
    tBtn.addEventListener("click", function () {
      if (id) { stop(); left = 60; paint(); return; }
      if (left <= 0) left = 60;
      paint();
      tBtn.textContent = "Stop";
      id = setInterval(function () {
        left -= 1;
        paint();
        if (left <= 0) { stop("Start again"); }
      }, 1000);
    });
    paint();
  });
  updateReady();
})();
