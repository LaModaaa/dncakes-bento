// Анимации и кнопки бенто. Корзина и каталог живут в cart.js и catalog.js.
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s) { return [].slice.call(document.querySelectorAll(s)); };

  // Шапка прячется при прокрутке вниз
  var lastY = 0, header = document.querySelector(".header");
  addEventListener("scroll", function () {
    header.classList.toggle("hide", scrollY > lastY && scrollY > 300);
    lastY = scrollY;
  }, { passive: true });

  // Бенто S/M/L: кнопка «В корзину» та же, что в каталоге
  function fillSizes() {
    var items = window.CATALOG_ITEMS || [];
    $$(".size").forEach(function (s) {
      var it = items.find(function (x) { return x.name === s.dataset.item; });
      if (!it || !window.CatalogBuyBox) return;
      s.querySelector(".buy").replaceWith(window.CatalogBuyBox(it));
      s.querySelector(".size-price").textContent = CartCore.money(it.price);
    });
  }
  document.addEventListener("catalog:ready", function () { fillSizes(); if (window.ScrollTrigger) ScrollTrigger.refresh(); });
  document.addEventListener("cart:change", fillSizes);
  if (window.CATALOG_ITEMS) fillSizes();

  if (!window.gsap || !window.ScrollTrigger || reduce) { document.documentElement.classList.add("no-gsap"); return; }
  gsap.registerPlugin(ScrollTrigger);

  // Плитки первого экрана выпрыгивают по очереди
  gsap.from(".hero .pop", { scale: 0.85, y: 40, opacity: 0, duration: 0.8, stagger: 0.08, ease: "back.out(1.7)" });
  gsap.from(".hero mark", { backgroundSize: "0% 100%", duration: 0.9, delay: 0.6, ease: "power2.out" });

  // Фото в плитках чуть двигаются при прокрутке
  $$(".hero img").forEach(function (img, i) {
    gsap.to(img, { yPercent: i % 2 ? -6 : 6, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  });

  // Всё с классом reveal появляется снизу с лёгким поворотом
  $$(".reveal").forEach(function (el, i) {
    gsap.from(el, { y: 50, opacity: 0, rotate: i % 2 ? 2 : -2, duration: 0.8, ease: "back.out(1.4)",
      scrollTrigger: { trigger: el, start: "top 90%" } });
  });

  // Кружки размеров бенто растут при появлении
  gsap.from(".size .dot", { scale: 0, duration: 0.9, stagger: 0.15, ease: "elastic.out(1, 0.6)", scrollTrigger: { trigger: ".sizes", start: "top 80%" } });
})();
