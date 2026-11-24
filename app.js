// Первый экран: живой заголовок и объёмный бенто с надписью. Корзина и каталог живут в cart.js и catalog.js.
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var G = !reduce && window.gsap ? window.gsap : null;
  var NS = "http://www.w3.org/2000/svg";
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return [].slice.call(document.querySelectorAll(s)); };
  var form = $("#builder"), phrase = $("#phrase"), words = $("#words"), body = $("#cakeBody");
  var SCALE = { S: 0.84, M: 0.93, L: 1 };
  var PRICE = { S: 1600, M: 2200, L: 2800 }; // из поста D&N; если каталог загрузился – берём оттуда
  var INFO = { S: "400–500 г, на 1–2 человек", M: "700–800 г, на 3–4 человек", L: "1 кг, на 5–6 человек" };
  var IDEAS = ["спасибо", "люблю", "с днюхой", "прости", "обнимаю"]; // короткие – влезают в строку заголовка
  var typed = false; // пока человек не начал писать сам, торт повторяет фразу из заголовка

  // Кремовые «капли»: бортик по краю верха и по низу торта. Рисуем от дальних к ближним.
  function dots(group, cy, rx, ry, n, r, front) {
    var pts = [];
    for (var i = 0; i < n; i++) pts.push(i / n * Math.PI * 2);
    pts.sort(function (a, b) { return Math.sin(a) - Math.sin(b); });
    pts.forEach(function (a) {
      if (front && Math.sin(a) < -0.05) return;
      var c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", (230 + Math.cos(a) * rx).toFixed(1));
      c.setAttribute("cy", (cy + Math.sin(a) * ry).toFixed(1));
      c.setAttribute("r", (r + Math.sin(a) * 2.2).toFixed(1));
      group.appendChild(c);
    });
  }
  dots($("#rim"), 190, 160, 66, 46, 10, false);
  dots($("#base"), 270, 168, 50, 46, 10, true);

  function lines(text) {
    var ws = text.split(/\s+/).filter(Boolean), out = [], cur = "";
    ws.forEach(function (w) {
      if (cur && (cur + " " + w).length > 12) { out.push(cur); cur = w; } else cur = cur ? cur + " " + w : w;
    });
    if (cur) out.push(cur);
    return out.slice(0, 3);
  }
  function pick(name) { return form.querySelector("input[name=" + name + "]:checked"); }
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

  function write(text) {
    var ls = lines(text), longest = Math.max.apply(null, ls.map(function (l) { return l.length; }).concat(4));
    var fs = Math.min(50, 250 / (longest * 0.6), 170 / (ls.length * 1.15)); // Comfortaa шире рукописного
    words.textContent = "";
    ls.forEach(function (l, i) {
      var t = document.createElementNS(NS, "tspan");
      t.setAttribute("x", "0");
      t.setAttribute("dy", i ? (fs * 1.15).toFixed(1) : (-(ls.length - 1) / 2 * fs * 1.15 + fs * 0.35).toFixed(1));
      t.textContent = l;
      words.appendChild(t);
    });
    words.setAttribute("font-size", fs.toFixed(1));
  }

  function paint() {
    var c = pick("cream");
    words.style.fill = c.dataset.ink;
    $("#hearts").style.fill = c.dataset.ink;
    $("#cakeTop").style.fill = c.dataset.c;
    $("#rim").style.fill = c.dataset.c;
    $("#base").style.fill = c.dataset.c;
    $("#sg1").setAttribute("stop-color", c.dataset.side);
    $("#sg2").setAttribute("stop-color", c.dataset.c);
    $("#sg3").setAttribute("stop-color", c.dataset.side);
  }

  function size() {
    var s = pick("size").value, tr = "translate(230 300) scale(" + SCALE[s] + ") translate(-230 -300)";
    if (G) G.to(body, { attr: { transform: tr }, duration: 0.6, ease: "back.out(2)" }); else body.setAttribute("transform", tr);
    $("#bentoPrice").textContent = CartCore.money(PRICE[s]);
    $("#sizeInfo").textContent = INFO[s];
  }

  form.addEventListener("input", function (e) {
    if (e.target === phrase) { typed = !!phrase.value.trim(); write(phrase.value.trim() || cap($("#swap").textContent)); }
    if (e.target.name === "size") size();
    if (e.target.name === "cream") paint();
  });
  $$(".ideas button").forEach(function (b) {
    b.addEventListener("click", function () { phrase.value = b.textContent; phrase.dispatchEvent(new Event("input", { bubbles: true })); });
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var s = pick("size").value, t = phrase.value.trim(), cream = pick("cream").value.toLowerCase();
    Cart.add({ name: "Бенто-торт " + s + (t ? " «" + t + "»" : " без надписи") + ", крем " + cream, price: PRICE[s], unit: "шт", custom: true });
  });
  document.addEventListener("catalog:ready", function () {
    (window.CATALOG_ITEMS || []).forEach(function (it) {
      var m = /^Бенто-торт ([SML])$/.exec(it.name);
      if (m && it.price) PRICE[m[1]] = it.price;
    });
    size();
  });

  body.setAttribute("transform", "translate(230 300) scale(" + SCALE.S + ") translate(-230 -300)");
  paint();
  write(cap(IDEAS[0]));
  size();

  // Живой заголовок: «Скажите … тортом», фраза меняется – и та же фраза пишется на торте
  var swap = $("#swap"), k = 0;
  function next() {
    k = (k + 1) % IDEAS.length;
    var t = IDEAS[k];
    if (!G) { swap.textContent = t; if (!typed) write(cap(t)); return; }
    G.to(swap, { yPercent: -60, opacity: 0, duration: 0.35, ease: "power2.in", onComplete: function () {
      swap.textContent = t;
      G.fromTo(swap, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: "back.out(2)" });
      if (!typed) { write(cap(t)); G.fromTo(words, { opacity: 0, scale: 0.9, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" }); }
    } });
  }
  setInterval(next, 2600);

  if (!G) return;

  // Загрузка: строки заголовка выезжают, торт «ставится» на подставку, фото разлетаются по местам
  G.from(".hero h1 .l", { yPercent: 100, opacity: 0, duration: 0.9, stagger: 0.1, ease: "expo.out" });
  G.from(".hero .script, .hero-sub, .builder", { y: 30, opacity: 0, duration: 0.8, stagger: 0.1, delay: 0.3, ease: "power3.out" });
  G.from("#cake", { y: -60, opacity: 0, duration: 1, delay: 0.2, ease: "bounce.out" });
  G.from(".float, .sticker", { scale: 0, opacity: 0, duration: 0.8, stagger: 0.12, delay: 0.5, ease: "back.out(2)" });
  G.from("#hearts path", { scale: 0, transformOrigin: "50% 50%", duration: 0.5, stagger: 0.08, delay: 1.1, ease: "back.out(3)" });

  // Фото и торт слегка двигаются за курсором, как в «Моей Анечке»
  if (matchMedia("(pointer: fine)").matches) {
    var vis = $(".hero-visual");
    vis.parentElement.addEventListener("mousemove", function (e) {
      var r = vis.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      $$(".hero-visual [data-depth]").forEach(function (el) {
        var d = +el.dataset.depth;
        G.to(el, { x: x * d, y: y * d, duration: 0.8, ease: "power3.out", overwrite: "auto" });
      });
    });
  }
})();
