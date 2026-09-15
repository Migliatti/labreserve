import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

test('o projeto declara scripts reproduzíveis sem versões flutuantes', () => {
  assert.equal(existsSync('package.json'), true, 'package.json deve existir');
  const manifest = JSON.parse(readFileSync('package.json', 'utf8'));

  for (const script of ['test', 'typecheck', 'lint', 'build', 'dev']) {
    assert.equal(typeof manifest.scripts?.[script], 'string', `script ${script} deve existir`);
  }

  for (const dependency of Object.values({ ...manifest.dependencies, ...manifest.devDependencies })) {
    assert.notEqual(dependency, 'latest', 'dependências não podem usar latest');
  }
});
