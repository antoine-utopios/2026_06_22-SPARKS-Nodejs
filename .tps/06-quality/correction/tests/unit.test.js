import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { AppError, NotFoundError, ValidationError } from "../src/errors.js";
import { errorHandler } from "../src/middleware/errorHandler.js";
import { buildReport } from "../src/routes/products.js";
import { installProcessHandlers } from "../src/processHandlers.js";

test("classes d'erreurs : statut + isOperational + name", () => {
  assert.equal(new NotFoundError().statusCode, 404);
  assert.equal(new ValidationError().statusCode, 400);
  assert.equal(new AppError("x").statusCode, 500);
  assert.equal(new NotFoundError().name, "NotFoundError");
  assert.equal(new NotFoundError().isOperational, true);
});

test("buildReport calcule un checksum numerique", () => {
  const r = buildReport(1000);
  assert.equal(r.total, 2);
  assert.equal(typeof r.checksum, "number");
});

test("errorHandler operationnel : renvoie le message tel quel", () => {
  let status;
  let payload;
  const res = {
    status(c) {
      status = c;
      return this;
    },
    json(p) {
      payload = p;
    },
  };
  errorHandler(new ValidationError("mauvais id"), {}, res, () => {});
  assert.equal(status, 400);
  assert.deepEqual(payload, { error: "mauvais id" });
});

test("errorHandler non operationnel : masque le detail (500 generique)", () => {
  let status;
  let payload;
  const res = {
    status(c) {
      status = c;
      return this;
    },
    json(p) {
      payload = p;
    },
  };
  errorHandler(new Error("secret interne"), {}, res, () => {});
  assert.equal(status, 500);
  assert.deepEqual(payload, { error: "Erreur interne" });
});

test("installProcessHandlers enregistre uncaughtException et unhandledRejection", () => {
  const proc = new EventEmitter();
  proc.exit = () => {};
  installProcessHandlers(proc, () => {});
  assert.equal(proc.listenerCount("uncaughtException"), 1);
  assert.equal(proc.listenerCount("unhandledRejection"), 1);
});

test("le handler unhandledRejection appelle exit(1)", () => {
  const proc = new EventEmitter();
  let code;
  installProcessHandlers(proc, (c) => {
    code = c;
  });
  proc.emit("unhandledRejection", new Error("rejet"));
  assert.equal(code, 1);
});
