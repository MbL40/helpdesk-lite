import { test, expect } from '@playwright/test';

test('login, crea un ticket y lo ve en el listado', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Organización').fill('acme');
  await page.getByLabel('Correo').fill('cliente@acme.com');
  await page.getByLabel('Contraseña').fill('Test1234!');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('**/dashboard');

  await page.getByRole('link', { name: 'Ver tickets' }).click();
  await page.waitForURL('**/tickets');
  await page.getByRole('link', { name: 'Nuevo ticket' }).click();
  await page.waitForURL('**/tickets/new');

  const title = `Ticket e2e ${Date.now()}`;
  await page.getByLabel('Título').fill(title);
  await page.getByLabel('Descripción').fill('Creado por el test e2e de Playwright.');
  await page.getByLabel('Prioridad').selectOption('MEDIUM');
  await page.getByRole('button', { name: 'Crear ticket' }).click();

  await page.waitForURL('**/tickets');
  await expect(page.getByText(title)).toBeVisible();
});