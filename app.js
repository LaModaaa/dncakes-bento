// Первый экран: надпись покупателя поверх фото бенто. Корзина и каталог живут в cart.js и catalog.js.
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var form = $("#builder"), phrase = $("#phrase"), ins = $("#inscription");
  var PRICE = { S: 1600, M: 2200, L: 2800 }; // из поста D&N; если каталог загрузился – берём оттуда
  var INFO = { S: "на 1–2 человек", M: "на 3–4 человек", L: "на 5–6 человек" };
  var SAMPLE = "Спасибо, мама";

  function pick(name) { return form.querySelector("input[name=" + name + "]:checked"); }

  function draw() {
    var t = phrase.value.trim() || SAMPLE;
    ins.textContent = t;
    ins.classList.toggle("sample", !phrase.value.trim()); // пример показываем бледнее, чтобы было ясно – это не ваша надпись
    // длинная фраза – мельче, чтобы осталась внутри торта
    ins.style.setProperty("--k", Math.max(0.5, Math.min(1, 13 / Math.max(t.length, 7))).toFixed(2));
    ins.style.color = pick("cream").dataset.ink;
    var s = pick("size").value;
    $("#bentoPrice").textContent = CartCore.money(PRICE[s]);
    $("#sizeInfo").textContent = INFO[s];
  }

  form.addEventListener("input", draw);
  [].forEach.call(form.querySelectorAll(".ideas button"), function (b) {
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
})();
