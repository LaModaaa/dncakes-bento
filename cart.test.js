// Проверка логики корзины: node cart.test.js
require("./cart.js");
const assert = require("assert");
const C = globalThis.CartCore;
const list = [
  { name: "Брусничный пирог домашний", price: 99, unit: "100 г", qty: 3 }, // 300 г
  { name: "Эклер", price: 119, unit: "шт", qty: 2 },
];
assert.strictEqual(C.isWeight("100 г"), true);
assert.strictEqual(C.isWeight("шт"), false);
assert.strictEqual(C.qtyLabel(list[0]), "300 г");
assert.strictEqual(C.qtyLabel(list[1]), "2 шт");
assert.strictEqual(C.total(list), 99 * 3 + 119 * 2); // 535
assert.strictEqual(C.hasWeight(list), true);
assert.strictEqual(C.validPhone("+7 (995) 011-52-11"), true);
assert.strictEqual(C.validPhone("12345"), false);
const t = C.orderText(list, { name: "Анна", phone: "+79990000000", how: "Доставка", address: "ул. Ленина, 1", when: "", comment: "" });
assert.ok(t.includes("Брусничный пирог домашний – 300 г"));
assert.ok(t.includes("Итого: ≈ 535"));
assert.ok(t.includes("Адрес: ул. Ленина, 1"));
assert.ok(!t.includes("Когда:"));
const t2 = C.orderText([list[1]], { name: "Анна", phone: "+79990000000", how: "Самовывоз", address: "x", when: "к 18:00", comment: "" });
assert.ok(!t2.includes("≈") && !t2.includes("Адрес:") && t2.includes("Когда: к 18:00"));
console.log("cart ok");

// Сверка корзины с каталогом
const cart = [{ name: "Эклер", price: 100, unit: "шт", qty: 2 }, { name: "Старый пирог", price: 50, unit: "100 г", qty: 3 }];
const r = C.sync(cart, [{ name: "Эклер", price: 119, unit: "шт" }]);
assert.deepStrictEqual(r.removed, ["Старый пирог"]);
assert.strictEqual(r.list.length, 1);
assert.strictEqual(r.list[0].price, 119);
assert.strictEqual(r.list[0].qty, 2);
assert.strictEqual(r.changed, true);
assert.strictEqual(C.sync([{ name: "Эклер", price: 119, unit: "шт", qty: 1 }], [{ name: "Эклер", price: 119, unit: "шт" }]).changed, false);
console.log("sync ok");
// торт на заказ без цены: сумма не ломается, в тексте – «по запросу»
const ask = [{ name: "Бенто-торт S", price: 1600, unit: "шт", qty: 1 }, { name: "Свадебный торт", price: 0, unit: "шт", qty: 1 }];
assert.strictEqual(C.hasUnpriced(ask), true);
assert.strictEqual(C.hasUnpriced([ask[0]]), false);
assert.strictEqual(C.total(ask), 1600);
assert.ok(C.orderText(ask, { name: "А", phone: "+79990000000", how: "Самовывоз" }).includes("Свадебный торт – 1 шт – цена по запросу"));
console.log("unpriced ok");
// бенто со своей надписью не пропадает при сверке с каталогом
const own = C.sync([{ name: "Бенто-торт S «Спасибо, мама»", price: 1600, unit: "шт", qty: 1, custom: true }], [{ name: "Бенто-торт S", price: 1600, unit: "шт" }]);
assert.strictEqual(own.list.length, 1);
assert.strictEqual(own.changed, false);
console.log("custom ok");
