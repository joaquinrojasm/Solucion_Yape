'use strict';
const { test, expect } = require('@playwright/test');
const { randomInt } = require('node:crypto');
const phone = () => `9${String(randomInt(0, 100000000)).padStart(8, '0')}`;
async function enterPhone(page, number = phone()) {
  await page.goto('/');
  await page.getByRole('button', { name: 'REGISTRARME', exact: true }).click();
  await page.getByLabel('Número de celular', { exact: true }).fill(number);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'CONTINUAR', exact: true }).click();
  return number;
}
async function verify(page) {
  await expect(page.locator('#demo-code')).toHaveText(/^\d{6}$/);
  await page.getByLabel('Código de 6 dígitos').fill(await page.locator('#demo-code').textContent());
  await page.getByRole('button', { name: 'VERIFICAR CÓDIGO' }).click();
  await expect(page.getByRole('heading', { name: 'Crea tu usuario de prueba' })).toBeVisible();
}
async function createProfile(page) {
  await page.getByLabel('Nombre', { exact: true }).fill('María de Prueba');
  await page.getByLabel('Correo electrónico').fill('maria.prueba+demo@example.com');
  await page.getByLabel('Clave de acceso de la demo').fill('012345');
  await page.getByRole('button', { name: 'CREAR CUENTA' }).click();
  await expect(page.getByRole('heading', { name: '¡Bien, María de Prueba!' })).toBeVisible();
}

test('recorrido completo, recarga, saldo y acciones de la demo', async ({ page }, testInfo) => {
  const errors = [];
  const externalRequests = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => { if (!request.url().startsWith('http://127.0.0.1:3100')) externalRequests.push(request.url()); });
  await enterPhone(page);
  await expect(page.getByRole('heading', { name: 'Ahora ingresa tu código' })).toBeVisible();
  await page.reload();
  await verify(page);
  await createProfile(page);
  await page.getByRole('button', { name: 'CONTINUAR CON TARJETA DE PRUEBA' }).click();
  await page.getByRole('button', { name: 'Usar una fecha de prueba vigente' }).click();
  await page.getByRole('button', { name: 'CONTINUAR', exact: true }).click();
  await page.getByLabel('Clave de prueba de 4 dígitos').fill('1234');
  await page.getByRole('button', { name: 'REGISTRAR TARJETA DE PRUEBA' }).click();
  await expect(page.getByRole('heading', { name: 'Hola, María de Prueba' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Hola, María de Prueba' })).toBeVisible();
  await page.getByRole('button', { name: 'Mostrar saldo de prueba' }).click();
  await expect(page.locator('#balance')).toContainText('S/ 0.00');
  await page.getByRole('button', { name: 'Ocultar saldo de prueba' }).click();
  await expect(page.locator('#balance')).toBeHidden();
  for (const action of ['Enviar pago', 'Recibir pago']) {
    await page.getByRole('button', { name: action, exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText('no se pueden enviar ni recibir pagos');
    await page.getByRole('button', { name: 'ENTENDIDO' }).click();
  }
  await page.screenshot({ path: testInfo.outputPath('dashboard.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await page.locator('img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
  expect(errors).toEqual([]);
  expect(externalRequests).toEqual([]);
  await page.getByRole('button', { name: 'Cerrar demo y volver al inicio' }).click();
  await expect(page.getByRole('heading', { name: 'Paga a tus amigos' })).toBeVisible();
});
test('mantiene la pantalla y los datos cuando falla la conexión', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'REGISTRARME', exact: true }).click();
  const number = phone();
  await page.getByLabel('Número de celular', { exact: true }).fill(number);
  await page.getByRole('checkbox').check();
  await page.route('**/api/registerNumber', (route) => route.abort());
  await page.getByRole('button', { name: 'CONTINUAR', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('No se pudo conectar');
  await expect(page.getByLabel('Número de celular', { exact: true })).toHaveValue(number);
  await expect(page.getByRole('button', { name: 'CONTINUAR', exact: true })).toBeEnabled();
});
test('muestra el error del servidor para un código incorrecto', async ({ page }) => {
  await enterPhone(page);
  const code = await page.locator('#demo-code').textContent();
  await page.getByLabel('Código de 6 dígitos').fill(code === '000000' ? '000001' : '000000');
  await page.getByRole('button', { name: 'VERIFICAR CÓDIGO' }).click();
  await expect(page.getByRole('alert')).toContainText('El código no es correcto');
  await expect(page.getByRole('heading', { name: 'Ahora ingresa tu código' })).toBeVisible();
  await verify(page);
});
test('conserva el perfil tras recargar y rechaza una fecha vencida', async ({ page }) => {
  await enterPhone(page); await verify(page); await createProfile(page);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Agrega una tarjeta de prueba' })).toBeVisible();
  await page.getByLabel('Mes de vencimiento').fill('01');
  await page.getByLabel('Año de vencimiento').fill('2020');
  await page.getByRole('button', { name: 'CONTINUAR', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Ingresa una fecha vigente');
  await expect(page.getByLabel('Número de tarjeta de prueba')).toHaveAttribute('readonly', '');
});
test('un número ya registrado muestra un error y permite corregirlo', async ({ page }) => {
  const number = await enterPhone(page); await verify(page); await createProfile(page);
  await page.evaluate(() => sessionStorage.clear());
  await enterPhone(page, number);
  await expect(page.getByRole('alert')).toContainText('Este número ya está registrado');
  await page.getByLabel('Número de celular', { exact: true }).fill(phone());
  await page.getByRole('button', { name: 'CONTINUAR', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ahora ingresa tu código' })).toBeVisible();
});
test('cambia las diapositivas y respeta el consentimiento obligatorio', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Diapositiva 2' }).click();
  await expect(page.getByRole('heading', { name: 'Solo con tu celular' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('inicio.png'), fullPage: true });
  await page.getByRole('button', { name: 'REGISTRARME', exact: true }).click();
  await page.getByRole('button', { name: 'Usar un número de ejemplo' }).click();
  await page.getByRole('button', { name: 'CONTINUAR', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Empecemos por tu celular' })).toBeVisible();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'CONTINUAR', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ahora ingresa tu código' })).toBeVisible();
});
