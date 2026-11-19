import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyRisk } from './classify-risk.mjs';
import { validateEnvironment } from './check-environment.mjs';

test('documentacion aislada permite la ruta de bajo riesgo', () => {
  assert.equal(classifyRisk(['README.md', 'docs/manual.md']).level, 'bajo');
});

test('presentacion requiere revision y nunca se considera bajo riesgo', () => {
  assert.equal(classifyRisk(['src/main/frontend/src/yape/yape.css']).level, 'medio');
});

test('codigo, dependencias y controles se clasifican como alto riesgo', () => {
  for (const file of ['pom.xml', '.github/workflows/ci.yml', 'src/main/frontend/package-lock.json', 'src/main/frontend/src/yape/wallet.js', 'src/main/java/README.md', 'archivo-desconocido']) {
    assert.equal(classifyRisk(['README.md', file]).level, 'alto', file);
  }
});

test('un cambio de presentacion no reduce el riesgo de un cambio de codigo', () => {
  assert.equal(classifyRisk(['src/main/frontend/src/yape/yape.css', 'pom.xml']).level, 'alto');
});

test('sin evidencia o con revision solicitada se aplica la ruta humana', () => {
  assert.equal(classifyRisk([]).level, 'alto');
  assert.equal(classifyRisk(['README.md'], true).level, 'alto');
});

test('un ambiente sin revisores nunca autoriza un cambio que requiere aprobacion', () => {
  assert.throws(() => validateEnvironment('demo-revision', { protection_rules: [] }), /revisor requerido/);
  assert.throws(() => validateEnvironment('demo-revision', { protection_rules: [{ type: 'required_reviewers', reviewers: [] }] }), /revisor requerido/);
});

test('el ambiente manual requiere un revisor y el automatico debe conservar su ruta', () => {
  const manual = { protection_rules: [{ type: 'required_reviewers', reviewers: [{ type: 'User', reviewer: { login: 'revisor-demo' } }] }] };
  assert.doesNotThrow(() => validateEnvironment('demo-revision', manual));
  assert.doesNotThrow(() => validateEnvironment('demo-automatico', { protection_rules: [] }));
  assert.throws(() => validateEnvironment('demo-automatico', manual), /sin revisores/);
});

test('un nombre de ambiente desconocido se rechaza', () => {
  assert.throws(() => validateEnvironment('produccion', {}), /no autorizado/);
});
