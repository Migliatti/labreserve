import { expect, test } from '@playwright/test';

// Os cenários rodam em paralelo contra um único banco `:memory:`. Cada teste deve usar um recurso exclusivo
// (lab-chemistry no primeiro, equipment-microscope no último) para que contagens exatas não colidam.

function localDate(offsetMinutes: number): string {
  const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + offsetMinutes * 60_000);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function reservationsResponse(resourceId?: string, status?: string) {
  return (response: import('@playwright/test').Response) => {
    const url = new URL(response.url());
    return url.pathname === '/api/reservations'
      && response.status() === 200
      && (resourceId === undefined || url.searchParams.get('resourceId') === resourceId)
      && (status === undefined || url.searchParams.get('status') === status);
  };
}

async function expectAllReservationsFor(page: import('@playwright/test').Page, resourceId: string, expectedCount: number, status?: string): Promise<void> {
  const items = page.locator('.reservation-list li');
  await expect(items).toHaveCount(expectedCount);
  for (const item of await items.all()) {
    await expect(item).toContainText(resourceId);
    if (status) await expect(item).toContainText(status);
  }
}

test('cria, rejeita conflito, permite período consecutivo, cancela e mostra histórico', async ({ page }) => {
  const start = localDate(0);
  const end = localDate(60);
  const nextEnd = localDate(120);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'LabReserve' })).toBeVisible();
  await expect(page.getByLabel('Recurso', { exact: true })).not.toHaveValue('');

  await page.getByLabel('Início').fill(start);
  await page.getByLabel('Término').fill(end);
  await page.getByRole('button', { name: 'Criar reserva' }).click();
  const notice = page.getByRole('status');
  await expect(notice).toContainText('criada com sucesso');
  const createdId = (await notice.textContent())?.match(/^Reserva ([\w-]+) criada/)?.[1];
  expect(createdId).toBeTruthy();

  await page.getByRole('button', { name: 'Criar reserva' }).click();
  await expect(page.getByRole('status')).toContainText('já está reservado');

  await page.getByLabel('Início').fill(end);
  await page.getByLabel('Término').fill(nextEnd);
  await page.getByRole('button', { name: 'Criar reserva' }).click();
  await expect(page.getByRole('status')).toContainText('criada com sucesso');

  await page.getByLabel('Filtrar por recurso').selectOption('lab-chemistry');
  await Promise.all([
    page.waitForResponse(reservationsResponse('lab-chemistry')),
    page.getByRole('button', { name: 'Aplicar filtros' }).click(),
  ]);
  await Promise.all([
    page.waitForResponse(reservationsResponse('lab-chemistry')),
    page.locator('.reservation-list li').filter({ hasText: 'lab-chemistry' }).first().getByRole('button', { name: 'Cancelar reserva' }).click(),
  ]);
  await expect(page.getByRole('status')).toContainText('cancelada com sucesso');
  await expectAllReservationsFor(page, 'lab-chemistry', 2);
  await page.getByLabel('Início').fill(start);
  await page.getByLabel('Término').fill(end);
  await page.getByRole('button', { name: 'Criar reserva' }).click();
  await expect(page.getByRole('status')).toContainText('criada com sucesso');
  await expect(page.getByRole('heading', { name: 'Histórico global' }).locator('..')).toContainText(`Reserva cancelada (${createdId})`);
});

test('consulta período com data vazia sem deixar carregamento pendente', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Início').fill('');
  await page.getByRole('button', { name: 'Consultar período' }).click();
  await expect(page.getByRole('status')).toHaveText('Informe uma data e hora válidas para o início.');
  await expect(page.getByText('Carregando…')).toHaveCount(0);
  await page.getByLabel('Início').fill(localDate(0));
  await page.getByRole('button', { name: 'Consultar período' }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(page.getByText('Carregando…')).toHaveCount(0);
});

test('aplica filtros de reserva', async ({ page }) => {
  const start = localDate(180);
  const end = localDate(240);
  await page.addInitScript(() => {
    const consumed: string[] = [];
    Object.assign(window, { __consumedResponses: consumed });
    const json = Response.prototype.json;
    Response.prototype.json = async function (this: Response) {
      const body: unknown = await json.call(this);
      consumed.push(this.url);
      return body;
    };
  });
  await page.goto('/');
  await expect(page.getByLabel('Recurso', { exact: true })).not.toHaveValue('');
  await page.getByLabel('Recurso', { exact: true }).selectOption('equipment-microscope');
  await page.getByLabel('Início').fill(start);
  await page.getByLabel('Término').fill(end);
  await page.getByRole('button', { name: 'Criar reserva' }).click();
  await expect(page.getByRole('status')).toContainText('criada com sucesso');
  await page.getByLabel('Filtrar por recurso').selectOption('equipment-microscope');
  await Promise.all([
    page.waitForResponse(reservationsResponse('equipment-microscope')),
    page.getByRole('button', { name: 'Aplicar filtros' }).click(),
  ]);
  await Promise.all([
    page.waitForResponse(reservationsResponse('equipment-microscope')),
    page.locator('.reservation-list li').filter({ hasText: 'equipment-microscope' }).getByRole('button', { name: 'Cancelar reserva' }).click(),
  ]);
  await expect(page.getByRole('status')).toContainText('cancelada com sucesso');
  await page.getByLabel('Início').fill(localDate(300));
  await page.getByLabel('Término').fill(localDate(360));
  await page.getByRole('button', { name: 'Criar reserva' }).click();
  await expect(page.getByRole('status')).toContainText('criada com sucesso');

  let releaseFirstResponse!: () => void;
  const firstResponseReleased = new Promise<void>((resolve) => {
    releaseFirstResponse = resolve;
  });
  let firstRequestBlocked!: () => void;
  const firstRequestIsBlocked = new Promise<void>((resolve) => {
    firstRequestBlocked = resolve;
  });
  let requestCount = 0;
  await page.route('**/api/reservations?resourceId=equipment-microscope*', async (route) => {
    if (requestCount++ === 0) {
      firstRequestBlocked();
      await firstResponseReleased;
    }
    await route.continue();
  });

  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await firstRequestIsBlocked;
  await page.getByLabel('Estado').selectOption('CONFIRMED');
  await Promise.all([
    page.waitForResponse(reservationsResponse('equipment-microscope', 'CONFIRMED')),
    page.getByRole('button', { name: 'Aplicar filtros' }).click(),
  ]);
  const staleUrlPart = '/api/reservations?resourceId=equipment-microscope';
  const consumedBefore = await page.evaluate((part) => (window as unknown as { __consumedResponses: string[] }).__consumedResponses
    .filter((url) => url.endsWith(part)).length, staleUrlPart);
  releaseFirstResponse();
  // Espera a UI consumir a resposta obsoleta e concluir o render seguinte antes de afirmar a lista.
  await page.waitForFunction(([part, count]) => (window as unknown as { __consumedResponses: string[] }).__consumedResponses
    .filter((url) => url.endsWith(part)).length > count, [staleUrlPart, consumedBefore] as const);
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expectAllReservationsFor(page, 'equipment-microscope', 1, 'Confirmada');
});
