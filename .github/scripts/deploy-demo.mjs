import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { appendFileSync, createWriteStream, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

const artifactDir = resolve(process.argv[2] || 'target');
const reportsDir = resolve('target/release-reports');
mkdirSync(reportsDir, { recursive: true });
const report = { startedAt: new Date().toISOString(), environment: process.env.RELEASE_ENVIRONMENT || 'local', risk: process.env.RELEASE_RISK || 'local', status: 'failed', checks: [] };
let child;
const log = createWriteStream(resolve(reportsDir, 'application.log'));

try {
  const manifest = JSON.parse(readFileSync(resolve(artifactDir, 'release-manifest.json'), 'utf8'));
  assert.equal(basename(manifest.artifact), manifest.artifact, 'Nombre de artefacto no valido.');
  const jar = resolve(artifactDir, manifest.artifact);
  const digest = createHash('sha256').update(readFileSync(jar)).digest('hex');
  assert.equal(digest, manifest.sha256, 'El artefacto no coincide con su huella SHA-256.');
  if (process.env.GITHUB_SHA) assert.equal(manifest.commit, process.env.GITHUB_SHA, 'El artefacto pertenece a otro commit.');
  if (process.env.GITHUB_ACTIONS === 'true') assert.equal(manifest.workingTreeDirty, false, 'La construccion contiene cambios sin registrar.');
  Object.assign(report, { commit: manifest.commit, workingTreeDirty: manifest.workingTreeDirty, artifact: manifest.artifact, sha256: digest, buildRun: manifest.runUrl });
  report.checks.push('Integridad e identificacion del artefacto verificadas.');

  const requestedPort = Number(process.env.DEMO_PORT || 0);
  assert.ok(Number.isInteger(requestedPort) && (requestedPort === 0 || requestedPort > 1024) && requestedPort < 65536, 'Puerto de demostracion no valido.');
  const probe = createServer();
  probe.listen(requestedPort, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise((accept, reject) => probe.close(error => error ? reject(error) : accept()));
  const url = `http://127.0.0.1:${port}`;
  report.endpoint = url;
  child = spawn('java', ['-jar', jar, '--server.address=127.0.0.1', `--server.port=${port}`], { stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.pipe(log, { end: false });
  child.stderr.pipe(log, { end: false });
  let spawnError;
  child.on('error', error => { spawnError = error; });
  const deadline = Date.now() + 120000;
  let ready = false;
  while (Date.now() < deadline) {
    if (spawnError) throw spawnError;
    if (child.exitCode !== null) throw new Error(`La aplicacion termino antes de estar disponible: ${child.exitCode}.`);
    try {
      const response = await fetch(`${url}/api/cuentas`, { signal: AbortSignal.timeout(2000) });
      if (response.ok && (await response.json()).length >= 2) { ready = true; break; }
    } catch { /* El proceso aun puede estar iniciandose. */ }
    await delay(500);
  }
  assert.ok(ready, 'La aplicacion no estuvo disponible dentro del plazo.');
  report.checks.push('Aplicacion iniciada y disponible en loopback.');

  const page = await fetch(url, { signal: AbortSignal.timeout(5000) });
  assert.equal(page.status, 200);
  assert.match(await page.text(), /<div id="root"><\/div>/);
  report.checks.push('Interfaz web servida correctamente.');

  const accounts = async () => {
    const response = await fetch(`${url}/api/cuentas`, { signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 200);
    return Object.fromEntries((await response.json()).map(account => [account.numeroCuenta, account.saldo]));
  };
  const csrfResponse = await fetch(`${url}/api/csrf`, { signal: AbortSignal.timeout(5000) });
  assert.equal(csrfResponse.status, 200);
  const csrf = await csrfResponse.json();
  assert.ok(csrf.token && csrf.headerName);
  const cookie = csrfResponse.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
  assert.ok(cookie, 'La sesion CSRF debe tener cookie.');
  const transfer = (monto, includeToken = true) => fetch(`${url}/api/transferencias`, {
    method: 'POST', headers: {
      'Content-Type': 'application/json', Cookie: cookie,
      ...(includeToken ? { [csrf.headerName]: csrf.token } : {}),
    },
    body: JSON.stringify({ cuentaOrigen: '1001', cuentaDestino: '1002', monto }),
    signal: AbortSignal.timeout(5000),
  });
  const before = await accounts();
  const withoutToken = await transfer(100, false);
  assert.equal(withoutToken.status, 403);
  assert.deepEqual(await accounts(), before);
  report.checks.push('Operacion sin token CSRF rechazada sin modificar saldos.');
  const valid = await transfer(100);
  assert.equal(valid.status, 200);
  const transaction = await valid.json();
  assert.equal(transaction.estado, 'COMPLETADA');
  assert.ok(transaction.id);
  const after = await accounts();
  assert.equal(after['1001'], before['1001'] - 100);
  assert.equal(after['1002'], before['1002'] + 100);
  report.checks.push('Transferencia ficticia: debito, credito e identificador correctos.');

  const invalid = await transfer(after['1001'] + 1);
  assert.equal(invalid.status, 400);
  assert.deepEqual(await accounts(), after);
  report.checks.push('Fondos insuficientes rechazados sin modificar saldos.');
  report.status = 'passed';
  console.log('DESPLIEGUE DE DEMOSTRACION VERIFICADO');
} catch (error) {
  report.error = error.message;
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (child && child.exitCode === null) {
    const exited = once(child, 'exit').catch(() => {});
    child.kill();
    await Promise.race([exited, delay(5000)]);
  }
  log.end();
  report.finishedAt = new Date().toISOString();
  report.operation = process.env.GITHUB_ACTIONS === 'true'
    ? 'Instancia temporal en runner aislado; se detiene al finalizar la verificacion.'
    : 'Instancia temporal local; se detiene al finalizar la verificacion.';
  writeFileSync(resolve(reportsDir, 'deployment-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Despliegue de demostracion\n\nResultado: **${report.status}**\n\nAmbiente: **${report.environment}**\n\nCommit: \`${report.commit || 'no verificado'}\`\n\nSHA-256: \`${report.sha256 || 'no verificado'}\`\n\n${report.checks.map(check => `- ${check}`).join('\n')}\n\n${report.operation}\n`);
  }
}
