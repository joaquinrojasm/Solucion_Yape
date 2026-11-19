import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CONTACTS,
  initialWallet,
  loadWallet,
  parseAmount,
  sendPayment,
} from "./wallet.js";

test("un yapeo conserva exactamente los centavos y registra el movimiento", () => {
  const wallet = initialWallet();
  const updated = sendPayment(wallet, CONTACTS[0], "12,35", " Almuerzo ");
  assert.equal(updated.balance, 123845);
  assert.equal(updated.transactions[0].cents, 1235);
  assert.equal(updated.transactions[0].message, "Almuerzo");
  assert.equal(updated.transactions[0].name, CONTACTS[0].name);
  assert.match(updated.transactions[0].id, /^DEMO-/);
  assert.equal(updated.transactions.length, wallet.transactions.length + 1);
  assert.equal(wallet.balance, 125080);
  assert.equal(wallet.transactions.length, 5);
});

test("rechaza fondos insuficientes sin cambiar saldo ni movimientos", () => {
  const wallet = { balance: 999, transactions: [] };
  assert.throws(
    () => sendPayment(wallet, CONTACTS[0], "10"),
    /saldo no es suficiente/,
  );
  assert.deepEqual(wallet, { balance: 999, transactions: [] });
});

test("rechaza montos negativos, cero, no finitos, precisión excesiva y límite excedido", () => {
  for (const input of [
    "-1",
    "0",
    "0.00",
    "NaN",
    "Infinity",
    "1e2",
    "1.234",
    "1.234,00",
    "500.01",
    "",
  ]) {
    assert.throws(() => parseAmount(input), Error, input);
  }
  assert.equal(parseAmount("0.01"), 1);
  assert.equal(parseAmount("500"), 50000);
  assert.equal(parseAmount("12.3"), 1230);
});

test("solo permite contactos de demostración y permite consumir el saldo exacto", () => {
  assert.throws(
    () => sendPayment(initialWallet(), { id: "desconocido" }, "10"),
    /contacto de demostración/,
  );
  const updated = sendPayment(
    { balance: 30, transactions: [] },
    CONTACTS[1],
    "0.30",
  );
  assert.equal(updated.balance, 0);
});

test("recupera la demo cuando el almacenamiento falta, es inválido o no está disponible", () => {
  const originalStorage = globalThis.localStorage;
  try {
    for (const value of [
      null,
      "no es JSON",
      '{"balance":-1,"transactions":[]}',
      '{"balance":100,"transactions":[{}]}',
    ]) {
      globalThis.localStorage = { getItem: () => value };
      assert.deepEqual(loadWallet(), initialWallet());
    }
    globalThis.localStorage = {
      getItem: () => {
        throw new Error("Almacenamiento bloqueado");
      },
    };
    assert.deepEqual(loadWallet(), initialWallet());
    const saved = sendPayment(initialWallet(), CONTACTS[0], "5");
    globalThis.localStorage = { getItem: () => JSON.stringify(saved) };
    assert.deepEqual(loadWallet(), saved);
  } finally {
    globalThis.localStorage = originalStorage;
  }
});
