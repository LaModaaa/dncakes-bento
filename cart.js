// Корзина и оформление заказа. Логика (window.CartCore) отделена от интерфейса, чтобы её можно было проверить тестом.
(function () {
  var KEY = "dn-cart-v1";

  // Весовые товары продаются шагом 100 г: qty = число шагов
  function isWeight(unit) { return /^100\s*г$/i.test(unit || ""); }
  function qtyLabel(it) { return isWeight(it.unit) ? it.qty * 100 + " г" : it.qty + " шт"; }
  function money(n) { return Math.round(n).toLocaleString("ru-RU") + " ₽"; }

  var CartCore = {
    isWeight: isWeight,
    qtyLabel: qtyLabel,
    money: money,
    lineSum: function (it) { return it.price * it.qty; },
    total: function (list) { return list.reduce(function (s, it) { return s + it.price * it.qty; }, 0); },
    hasWeight: function (list) { return list.some(function (it) { return isWeight(it.unit); }); },
    // цена 0 = торт на заказ, цену называет кондитерская
    hasUnpriced: function (list) { return list.some(function (it) { return !it.price; }); },
    orderText: function (list, f) {
      var lines = ["Заказ с сайта D&N cakes", ""];
      list.forEach(function (it) { lines.push("• " + it.name + " – " + qtyLabel(it) + " – " + (it.price ? money(it.price * it.qty) : "цена по запросу")); });
      lines.push("", "Итого: " + (CartCore.hasWeight(list) ? "≈ " : "") + money(CartCore.total(list)) + (CartCore.hasUnpriced(list) ? " + торты по запросу" : ""));
      lines.push("", "Имя: " + f.name, "Телефон: " + f.phone, "Получение: " + f.how);
      if (f.how === "Доставка") lines.push("Адрес: " + f.address);
      if (f.when) lines.push("Когда: " + f.when);
      if (f.comment) lines.push("Комментарий: " + f.comment);
      return lines.join("\n");
    },
    validPhone: function (p) { return String(p || "").replace(/\D/g, "").length >= 10; },
    // Сверка корзины с каталогом: свежие цены, убранные товары выпадают
    sync: function (list, catalog) {
      var removed = [], changed = false;
      var next = list.filter(function (it) {
        if (it.custom) return true; // бенто со своей надписью – в каталоге его нет, сверять нечего
        var c = catalog.find(function (x) { return x.name === it.name; });
        if (!c) { removed.push(it.name); return false; }
        if (c.price !== it.price || c.unit !== it.unit) { it.price = c.price; it.unit = c.unit; changed = true; }
        return true;
      });
      return { list: next, removed: removed, changed: changed || removed.length > 0 };
    },
  };
  (typeof window !== "undefined" ? window : globalThis).CartCore = CartCore;
  if (typeof document === "undefined") return; // запуск из теста без браузера

  var cfg = window.BAKERY_CONFIG || {};
  var list = [];
  try { list = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { list = []; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} }

  var $ = function (s, r) { return (r || document).querySelector(s); };
  // Кнопки MAX видны, только если в config.js указана ссылка на профиль
  if (cfg.maxLink) {
    [].forEach.call(document.querySelectorAll(".max-only"), function (a) { a.href = cfg.maxLink; a.hidden = false; });
    var via = document.querySelector(".done .via");
    if (via) via.textContent = "ВКонтакте или в MAX";
  }
  var drawer = $(".drawer"), overlay = $(".overlay"), form = $(".order"), dlg = $(".done");

  function find(name) { return list.find(function (it) { return it.name === name; }); }

  function changed() {
    save();
    renderCart();
    document.dispatchEvent(new CustomEvent("cart:change"));
  }

  var Cart = {
    qty: function (name) { var it = find(name); return it ? it.qty : 0; },
    add: function (p) {
      var it = find(p.name);
      if (it) it.qty++;
      else list.push({ name: p.name, price: Number(p.price) || 0, unit: p.unit, qty: isWeight(p.unit) ? 3 : 1, custom: !!p.custom });
      changed();
      bump();
      toast("Добавили: " + p.name);
    },
    change: function (name, d) {
      var it = find(name);
      if (!it) return;
      it.qty += d;
      if (it.qty <= 0) list = list.filter(function (x) { return x !== it; });
      changed();
    },
    open: openDrawer,
  };
  window.Cart = Cart;

  // --- шапка ---
  function bump() {
    var b = $(".cart-btn");
    b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
  }
  function renderHeader() {
    var n = list.length;
    $(".cart-count").hidden = !n;
    $(".cart-count").textContent = n;
    $(".cart-sum").textContent = money(CartCore.total(list));
  }

  // --- выезжающая корзина ---
  function renderCart() {
    renderHeader();
    var ul = $(".cart-list");
    ul.innerHTML = "";
    list.forEach(function (it) {
      var li = document.createElement("li");
      li.innerHTML = '<div class="ci-name"></div><div class="stepper"><button type="button" aria-label="Меньше">−</button><span></span><button type="button" aria-label="Больше">+</button></div><b class="ci-sum"></b>';
      li.querySelector(".ci-name").textContent = it.name;
      li.querySelector(".stepper span").textContent = qtyLabel(it);
      li.querySelector(".ci-sum").textContent = it.price ? money(it.price * it.qty) : "по запросу";
      var btns = li.querySelectorAll("button");
      btns[0].onclick = function () { Cart.change(it.name, -1); };
      btns[1].onclick = function () { Cart.change(it.name, 1); };
      ul.appendChild(li);
    });
    $(".cart-empty").hidden = list.length > 0;
    form.hidden = !list.length;
    $(".total-sum").textContent = (CartCore.hasWeight(list) ? "≈ " : "") + money(CartCore.total(list));
    $(".total-note").hidden = !CartCore.hasWeight(list) && !CartCore.hasUnpriced(list);
  }

  function openDrawer() {
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    drawer.inert = false;
    overlay.hidden = false;
    document.body.classList.add("lock");
  }
  function closeDrawer() {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    drawer.inert = true;
    overlay.hidden = true;
    document.body.classList.remove("lock");
  }
  $(".cart-btn").addEventListener("click", openDrawer);
  $(".drawer .close").addEventListener("click", closeDrawer);
  overlay.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawer(); });
  drawer.inert = true; // закрытая корзина не ловит Tab

  // Каталог загрузился или обновился – подтягиваем свежие цены в корзину
  document.addEventListener("catalog:ready", function () {
    var r = CartCore.sync(list, window.CATALOG_ITEMS || []);
    if (!r.changed) return;
    list = r.list;
    changed();
    if (r.removed.length) toast("Убрали из корзины – больше нет в продаже: " + r.removed.join(", "));
  });

  // Адрес нужен только для доставки
  form.addEventListener("change", function () {
    var delivery = form.elements.how.value === "Доставка";
    $(".addr").hidden = !delivery;
    form.elements.address.required = delivery;
  });

  // --- оформление ---
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).catch(fallback);
    return Promise.resolve(fallback());
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      ta.remove();
    }
  }

  var lastText = "";
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var el = form.elements;
    var f = {
      name: el.name.value.trim(), phone: el.phone.value.trim(), how: el.how.value,
      address: el.address.value.trim(), when: el.when.value.trim(), comment: el.comment.value.trim(),
    };
    var err = !f.name ? "Укажите, пожалуйста, имя"
      : !CartCore.validPhone(f.phone) ? "Проверьте номер телефона"
      : f.how === "Доставка" && !f.address ? "Укажите адрес доставки" : "";
    $(".form-error").textContent = err;
    if (err) return;

    lastText = CartCore.orderText(list, f);
    copy(lastText);
    $(".order-text").textContent = lastText;
    $(".send-vk").href = cfg.vkMessages || "https://vk.me/club90663604";
    $(".send-call").href = "tel:" + (cfg.phone || "");
    $(".pay").hidden = !cfg.payLink;
    if (cfg.payLink) $(".pay").href = cfg.payLink;
    closeDrawer();
    dlg.showModal();
  });
  $(".copy-again").addEventListener("click", function () { copy(lastText); toast("Текст заказа скопирован"); });
  $(".done .close").addEventListener("click", function () { dlg.close(); });

  var tt;
  function toast(t) {
    var el = $(".toast");
    el.textContent = t;
    el.classList.add("show");
    clearTimeout(tt);
    tt = setTimeout(function () { el.classList.remove("show"); }, 2200);
  }

  renderCart();
})();
