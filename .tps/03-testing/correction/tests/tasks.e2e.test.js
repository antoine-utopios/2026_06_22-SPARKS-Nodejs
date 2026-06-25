// Test fonctionnel headless avec Playwright.
//
// IMPORTANT : NON inclus dans `npm test`. Le script test cible explicitement
// task-service.test.js et tasks.routes.test.js, donc ce fichier n'est jamais
// chargé par node --test. Playwright a besoin d'un navigateur Chromium
// (npx playwright install) indisponible en conteneur node:20-alpine.
//
// Exécution hors conteneur :
//   npm install -D @playwright/test
//   npx playwright install chromium
//   npm run test:e2e
import { test, expect } from "@playwright/test";

test("ajoute une tâche depuis l'interface", async ({ page }) => {
  await page.goto("http://localhost:3000/");
  await page.fill("#task-title", "Préparer la démo");
  await page.click("#add");
  await expect(page.locator("#list li")).toHaveText("Préparer la démo");
});
