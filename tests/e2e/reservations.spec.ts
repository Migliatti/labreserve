import { expect, test } from '@playwright/test';

function localDate(offsetMinutes: number): string {
  const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + offsetMinutes * 60_000);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

test('cria, rejeita conflito, permite período consecutivo, cancela e mostra histórico', async ({ page }) => {
  const start = localDate(0);
  const end = localDate(60);
  const nextEnd = localDate(120);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'LabReserve' })).toBeVisible();

  await page.getByLabel('Início').fill(start);
  await page.getByLabel('Término').fill(end);
  await page.getByRole('button', { name: 'Criar reserva' }).click();
  await expect(page.getByRole('status')).toContainText('criada com sucesso');

  await page.getByRole('button', { name: 'Criar reserva' }).click();
  await expect(page.getByRole('status')).toContainText('já está reservado');

  await page.getByLabel('Início').fill(end);
  await page.getByLabel('Término').fill(nextEnd);
  await page.getByRole('button', { name: 'Criar reserva' }).click();
  await expect(page.getByRole('status')).toContainText('criada com sucesso');

  await page.getByRole('button', { name: 'Cancelar reserva' }).first().click();
  await expect(page.getByRole('status')).toContainText('cancelada com sucesso');
  await expect(page.getByRole('heading', { name: 'Histórico global' }).locator('..')).toContainText('Reserva cancelada');
});

test('aplica filtros de reserva', async ({ page }) => {
  const start = localDate(180);
  const end = localDate(240);
  await page.goto('/');
  await page.getByLabel('Recurso', { exact: true }).selectOption('lab-chemistry');
  await page.getByLabel('Início').fill(start);
  await page.getByLabel('Término').fill(end);
  await page.getByRole('button', { name: 'Criar reserva' }).click();
  await expect(page.getByRole('status')).toContainText('criada com sucesso');
  await page.getByRole('button', { name: 'Cancelar reserva' }).last().click();
  await expect(page.getByRole('status')).toContainText('cancelada com sucesso');

  await page.getByLabel('Estado').selectOption('CONFIRMED');
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect(page.locator('.reservation-list')).not.toContainText('Cancelada');
  await page.getByLabel('Estado').selectOption('CANCELLED');
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect(page.locator('.reservation-list')).toContainText('Cancelada');
});
