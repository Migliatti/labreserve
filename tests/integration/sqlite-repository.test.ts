import assert from 'node:assert/strict';
import test from 'node:test';
import { SqliteLabReserveRepository } from '../../src/persistence/sqlite-lab-reserve-repository.js';

test('um banco novo recebe laboratório e equipamento determinísticos', () => {
  const repository = new SqliteLabReserveRepository(':memory:');

  try {
    assert.deepEqual(repository.listResources().map(({ id, category }) => ({ id, category })), [
      { id: 'lab-chemistry', category: 'LABORATORY' },
      { id: 'equipment-microscope', category: 'EQUIPMENT' },
    ]);
  } finally {
    repository.close();
  }
});
