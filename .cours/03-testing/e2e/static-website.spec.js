import { test, expect } from '@playwright/test'

test.describe('For a 1080*800 screen', () => {
  test.use({
    viewport: {
      width: 1080,
      height: 800 
    }
  })

  test('Submit contact form button should not be disabled when the form is filled', async ({ page }) => {
    await page.route('/api/v1/users', async route => {
      const json = [
        { userId: 1, userName: 'J.DUPONT'},
        { userId: 2, userName: 'M.DUPONT'}
      ];

      await route.fulfill(json);
    })

    await page.goto('/contact');

    // Arrange
    const messageTextAreaByLocator = page.locator('textarea#message-content');
    const messageTextAreaByRole = page.getByRole('textarea', { id: 'message-content'});
    const emailInputByPlaceholder = page.getByPlaceholder('john.dupont@example.com');
    const emailInputByTestId = page.getByTestId('email-input');


    // Act
    await page.fill('textarea#message-content', "J'ai un soucis de connexion, je ne peux plus accéder à mon compte");
    await page.type('textarea#message-content', "J'ai un soucis de connexion, je ne peux plus accéder à mon compte", { delay: 500 });
    await page.check('input#remember-me');
    await page.selectOption('select#theme', 'account');

    //Assert
    await expect(messageTextAreaByLocator).not.toBeEmpty();
    await expect(messageTextAreaByLocator).toHaveValue("J'ai un soucis de connexion, je ne peux plus accéder à mon compte");
    await expect(page.getByRole('button', { name: 'Send' })).toBeEnabled();
  })
})

/*
  Locators: 

  page.locator("#quote")                       // sélecteur CSS
  page.getByRole("button", { name: "Charger" })// rôle ARIA + nom (recommandé)
  page.getByText("Bienvenue")                  // par texte visible
  page.getByLabel("Email")                     // par label de formulaire
  page.getByPlaceholder("Rechercher")          // par placeholder
  page.getByTestId("submit")                   // data-testid

  Actions: 

  await page.click("#load");
  await page.getByRole("button", { name: "Envoyer" }).click();
  await page.fill("#email", "ada@example.com"); // remplit un champ
  await page.type("#search", "node", { delay: 50 });
  await page.check("#cgu");                      // coche une case
  await page.selectOption("#pays", "FR");        // menu déroulant
  await page.setInputFiles("#file", "photo.png");// upload
  await page.keyboard.press("Enter");

  Vérifications: 

  await expect(page.locator("#quote")).not.toBeEmpty();
  await expect(page.locator("#quote")).toHaveText("Bonjour");
  await expect(page.locator("#quote")).toContainText("Bon");
  await expect(page.getByRole("button")).toBeVisible();
  await expect(page.getByRole("button")).toBeEnabled();
  await expect(page.locator(".item")).toHaveCount(3);
  await expect(page).toHaveURL(/dashboard/);
  await expect(page).toHaveTitle(/Accueil/);
  await expect(page.locator("#email")).toHaveValue("ada@example.com");
*/