// Бенто с надписью на первом экране. Корзина и каталог живут в cart.js и catalog.js.
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var G = !reduce && window.gsap ? window.gsap : null;
  var NS = "http://www.w3.org/2000/svg";
  var $ = function (s) { return document.querySelector(s); };
  var form = $("#builder"), phrase = $("#phrase"), words = $("#words"), body = $("#cakeBody");
  var SCALE = { S: 0.84, M: 0.93, L: 1 };
  var PRICE = { S: 1600, M: 2200, L: 2800 }; // из поста D&N; если каталог загрузился – берём оттуда

  // Бортик из кремовых «капель» по краю торта
  var rim = $("#rim");
  for (var i = 0; i < 44; i++) {
    var a = i / 44 * Math.PI * 2, c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", (200 + Math.cos(a) * 141).toFixed(1));
    c.setAttribute("cy", (200 + Math.sin(a) * 141).toFixed(1));
    c.setAttribute("r", "10.5");
    rim.appendChild(c);
  }

  // Фраза → строки по 2–3 слова, чтобы надпись была как у кондитера: крупно и по центру
  function lines(text) {
    var ws = text.split(/\s+/).filter(Boolean), out = [], cur = "";
    ws.forEach(function (w) {
      if (cur && (cur + " " + w).length > 11) { out.push(cur); cur = w; } else cur = cur ? cur + " " + w : w;
    });
    if (cur) out.push(cur);
    return out.slice(0, 4);
  }

  function pick(name) { return form.querySelector("input[name=" + name + "]:checked"); }

  function draw() {
    var ls = lines(phrase.value.trim()), longest = Math.max.apply(null, ls.map(function (l) { return l.length; }).concat(4));
    var fs = Math.min(58, 230 / (longest * 0.44), 210 / (ls.length * 1.05));
    var cream = pick("cream");
    words.textContent = "";
    ls.forEach(function (l, i) {
      var t = document.createElementNS(NS, "tspan");
      t.setAttribute("x", "200");
      t.setAttribute("dy", i ? (fs * 1.02).toFixed(1) : (-(ls.length - 1) / 2 * fs * 1.02 + fs * 0.3).toFixed(1));
      t.textContent = l;
      words.appendChild(t);
    });
    words.setAttribute("font-size", fs.toFixed(1));
    words.style.fill = cream.dataset.ink;
    $("#hearts").style.fill = cream.dataset.ink;
    $("#cakeTop").style.fill = cream.dataset.c;
    rim.style.fill = cream.dataset.c;
  }

  function size() {
    var s = pick("size").value, k = SCALE[s];
    var tr = "translate(200 200) scale(" + k + ") translate(-200 -200)";
    if (G) G.to(body, { attr: { transform: tr }, duration: 0.5, ease: "power3.out" }); else body.setAttribute("transform", tr);
    $("#bentoPrice").textContent = CartCore.money(PRICE[s]);
  }

  form.addEventListener("input", function (e) { draw(); if (e.target.name === "size") size(); });
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

  body.setAttribute("transform", "translate(200 200) scale(" + SCALE.S + ") translate(-200 -200)");
  draw();
  size();

  // Один момент движения: надпись «выписывается» кремом слева направо при загрузке
  if (G) {
    var clip = document.createElementNS(NS, "clipPath"), r = document.createElementNS(NS, "rect");
    clip.id = "write"; r.setAttribute("x", "40"); r.setAttribute("y", "0"); r.setAttribute("height", "400"); r.setAttribute("width", "0");
    clip.appendChild(r); $("#cake").appendChild(clip);
    words.setAttribute("clip-path", "url(#write)");
    G.to(r, { attr: { width: 320 }, duration: 1.6, delay: 0.4, ease: "power1.inOut", onComplete: function () { words.removeAttribute("clip-path"); } });
    G.from("#hearts path", { scale: 0, transformOrigin: "50% 50%", duration: 0.5, stagger: 0.08, delay: 1.6, ease: "back.out(3)" });
  }
})();
