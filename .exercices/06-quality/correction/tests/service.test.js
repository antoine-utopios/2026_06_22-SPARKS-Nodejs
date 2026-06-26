import { test } from "node:test";
import assert from "node:assert/strict";
import { getArticle } from "../src/articleService.js";
import { NotFoundError, ValidationError } from "../src/errors.js";

test("getArticle convertit l'id string et renvoie l'article", async () => {
  const a = await getArticle("1");
  assert.deepEqual(a, { id: 1, title: "Node" });
});

test("getArticle leve ValidationError si id non numerique", async () => {
  await assert.rejects(() => getArticle("abc"), ValidationError);
});

test("getArticle leve NotFoundError si absent", async () => {
  await assert.rejects(() => getArticle("999"), NotFoundError);
});

test("getArticle n'avale plus les erreurs (pas de undefined/null)", async () => {
  // l'ancien code renvoyait undefined ; desormais il leve.
  await assert.rejects(() => getArticle("42"), NotFoundError);
});
