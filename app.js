// Первый экран: надпись покупателя поверх фото бенто + анимации в духе «Моей Анечки».
// Корзина и каталог живут в cart.js и catalog.js.
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(pointer: fine)").matches;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return [].slice.call(document.querySelectorAll(s)); };
  var form = $("#builder"), phrase = $("#phrase"), ins = $("#inscription");
  var PRICE = { S: 1600, M: 2200, L: 2800 }; // из поста D&N; если каталог загрузился – берём оттуда
  var INFO = { S: "на 1–2 человек", M: "на 3–4 человек", L: "на 5–6 человек" };
  // пример на торте идёт в паре со словом в заголовке: словами / шутками / признаниями / «люблю»
  var SAMPLES = ["Спасибо, мама", "Мой любимый душнила", "Люблю тебя", "Люблю"], si = 0;

  /* ---------- конструктор надписи ---------- */
  function pick(name) { return form.querySelector("input[name=" + name + "]:checked"); }
  function draw() {
    var t = phrase.value.trim() || SAMPLES[si];
    ins.textContent = t;
    ins.classList.toggle("sample", !phrase.value.trim()); // пример бледнее – видно, что это не ваша надпись
    ins.style.setProperty("--k", Math.max(0.5, Math.min(1, 13 / Math.max(t.length, 7))).toFixed(2)); // длинная фраза – мельче
    ins.style.color = pick("cream").dataset.ink;
    var s = pick("size").value;
    $("#bentoPrice").textContent = CartCore.money(PRICE[s]);
    $("#sizeInfo").textContent = INFO[s];
  }
  form.addEventListener("input", draw);
  $$(".ideas button").forEach(function (b) {
    b.addEventListener("click", function () { phrase.value = b.textContent; draw(); phrase.focus(); });
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var s = pick("size").value, t = phrase.value.trim(), c = pick("cream").value.toLowerCase();
    Cart.add({ name: "Бенто-торт " + s + (t ? " «" + t + "», крем надписи " + c : " без надписи"), price: PRICE[s], unit: "шт", custom: true });
  });
  document.addEventListener("catalog:ready", function () {
    (window.CATALOG_ITEMS || []).forEach(function (it) {
      var m = /^Бенто-торт ([SML])$/.exec(it.name);
      if (m && it.price) PRICE[m[1]] = it.price;
    });
    draw();
  });
  draw();

  // Шапка прячется при прокрутке вниз
  var lastY = 0, header = $(".header");
  addEventListener("scroll", function () { header.classList.toggle("hide", scrollY > lastY && scrollY > 300); lastY = scrollY; }, { passive: true });

  // Плавный переход по ссылкам меню (CSS-вариант ломает ScrollTrigger)
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var el = document.querySelector(a.getAttribute("href"));
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); }
    });
  });

  if (!window.gsap || !window.ScrollTrigger || reduce) { document.documentElement.classList.add("no-gsap"); return; }
  var G = window.gsap;
  G.registerPlugin(ScrollTrigger);
  var splitWords = function (el) {
    var esc = function (w) { return w.replace(/&/g, "&amp;").replace(/</g, "&lt;"); };
    el.innerHTML = el.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w"><span>' + esc(w) + "</span></span>"; }).join(" ");
    return el.querySelectorAll(".w > span");
  };

  // 1. Вступление первого экрана – после того, как уехала заставка
  G.timeline({ delay: 1.8 })
    .from(".hero .line > span", { yPercent: 115, duration: 1, ease: "expo.out", stagger: 0.12 }, 0)
    .from(".hero-sub", { opacity: 0, y: 24, duration: 0.7, ease: "power3.out" }, 0.35)
    .from(".builder", { opacity: 0, y: 50, duration: 0.9, ease: "power3.out" }, 0.45)
    .fromTo(".preview-photo", { clipPath: "inset(100% 0% 0% 0% round 14px)" }, { clipPath: "inset(0% 0% 0% 0% round 14px)", duration: 1.2, ease: "expo.inOut" }, 0.1)
    .from(".preview-photo img", { scale: 1.25, duration: 1.6, ease: "expo.out" }, 0.3)
    .from(".inscription", { opacity: 0, y: 20, duration: 0.8, ease: "back.out(2)" }, 1.1);

  // 2. Меняющееся слово в заголовке, и в такт – пример надписи на торте (пока человек не начал писать сам)
  var words = $$(".swap b"), wi = 0;
  G.set(words.slice(1), { opacity: 1, yPercent: 110 });
  function nextWord() {
    var cur = words[wi];
    wi = (wi + 1) % words.length;
    G.to(cur, { yPercent: -110, duration: 0.55, ease: "power3.in" });
    G.fromTo(words[wi], { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: "back.out(1.8)", delay: 0.4 });
    if (!phrase.value.trim()) {
      si = wi; // тот же номер, что у слова в заголовке
      G.to(ins, { opacity: 0, y: -8, duration: 0.3, onComplete: function () { draw(); G.fromTo(ins, { y: 8 }, { opacity: 0.55, y: 0, duration: 0.5, clearProps: "opacity" }); } });
    }
    G.delayedCall(2.6, nextWord);
  }
  G.delayedCall(4, nextWord);

  // 3. Ленты бегут бесконечно и ускоряются от скорости прокрутки
  var tapes = $$(".tape-in").map(function (el, k) {
    return k ? G.fromTo(el, { xPercent: -50 }, { xPercent: 0, repeat: -1, duration: 30, ease: "none" })
             : G.to(el, { xPercent: -50, repeat: -1, duration: 30, ease: "none" });
  });
  var boost = 0;
  ScrollTrigger.create({ onUpdate: function (s) { boost = Math.min(Math.abs(s.getVelocity()) / 220, 9); } });
  G.ticker.add(function () { boost *= 0.93; tapes.forEach(function (t) { t.timeScale(1 + boost); }); });
  G.fromTo(".tape-rose", { rotate: -7 }, { rotate: -2, ease: "none", scrollTrigger: { trigger: ".tapes", start: "top bottom", end: "bottom top", scrub: true } });
  G.fromTo(".tape-ink", { rotate: 6 }, { rotate: 2, ease: "none", scrollTrigger: { trigger: ".tapes", start: "top bottom", end: "bottom top", scrub: true } });

  // 4. Заголовки разделов выезжают по словам
  $$(".split").forEach(function (h) {
    G.from(splitWords(h), { yPercent: 115, duration: 0.9, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: h, start: "top 88%" } });
  });

  // 5. Примеры надписей: фото раскрываются по очереди
  G.from(".written figure", { y: 80, opacity: 0, rotate: function (i) { return (i % 2 ? 4 : -4); }, stagger: 0.12, duration: 1, ease: "back.out(1.4)", scrollTrigger: { trigger: ".written-row", start: "top 85%" } });

  // 6. Каталог: карточки падают пачкой и наклоняются за мышью
  document.addEventListener("catalog:ready", function () {
    G.set("#grid .card", { y: 90, opacity: 0, rotate: function () { return G.utils.random(-6, 6); } });
    ScrollTrigger.batch("#grid .card", { start: "top 92%", once: true,
      onEnter: function (b) { G.to(b, { y: 0, opacity: 1, rotate: 0, stagger: 0.1, duration: 1, ease: "back.out(1.5)" }); } });
    if (fine) $$("#grid .card").forEach(function (c) {
      c.addEventListener("mousemove", function (e) {
        var r = c.getBoundingClientRect();
        G.to(c, { rotateY: ((e.clientX - r.left) / r.width - 0.5) * 12, rotateX: -((e.clientY - r.top) / r.height - 0.5) * 12, transformPerspective: 900, duration: 0.4 });
      });
      c.addEventListener("mouseleave", function () { G.to(c, { rotateY: 0, rotateX: 0, duration: 0.8, ease: "elastic.out(1, .5)" }); });
    });
    ScrollTrigger.refresh();
  });

  // 7. Торты на заказ: секция закрепляется, лента фото едет вбок
  var custom = $(".custom"), strip = $(".strip");
  custom.classList.add("pinned");
  var dist = function () { return Math.max(0, strip.scrollWidth - innerWidth + 32); };
  var hs = G.to(strip, { x: function () { return -dist(); }, ease: "none",
    scrollTrigger: { trigger: custom, start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true } });
  $$(".strip img").forEach(function (img) {
    G.from(img, { rotate: 6, yPercent: 10, scale: 0.88, ease: "none", scrollTrigger: { trigger: img, containerAnimation: hs, start: "left right", end: "center 60%", scrub: true } });
  });

  // 8. Шаги лесенкой
  G.from(".steps li", { y: 60, opacity: 0, stagger: 0.12, duration: 0.9, ease: "back.out(1.5)", scrollTrigger: { trigger: ".steps ol", start: "top 85%" } });

  // 9. Контакты: блок «разворачивается», карта раскрывается кругом
  G.fromTo(".contacts", { clipPath: "inset(8% 6% 0% 6% round 40px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", scrollTrigger: { trigger: ".contacts", start: "top bottom", end: "top 30%", scrub: true } });
  G.fromTo(".map", { clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)", duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: ".contacts", start: "top 60%" } });

  // 10. Магнитные кнопки (только мышь)
  if (fine) {
    $$(".magnetic").forEach(function (b) {
      b.addEventListener("mousemove", function (e) {
        var r = b.getBoundingClientRect();
        G.to(b, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.3 });
      });
      b.addEventListener("mouseleave", function () { G.to(b, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, .4)" }); });
    });
  }

  // Пересчитать точки срабатывания, когда догрузятся картинки и шрифты
  addEventListener("load", function () { ScrollTrigger.refresh(); });
  document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
