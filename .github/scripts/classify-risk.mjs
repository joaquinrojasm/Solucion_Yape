import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function classifyRisk(files, forceReview = false) {
  if (forceReview) return { level: 'alto', reason: 'Revision humana solicitada para la demostracion.' };
  if (!files.length) return { level: 'alto', reason: 'No hay cambios identificables; se requiere revision.' };
  let level = 'bajo';
  for (const file of files) {
    if (/^(README(?:-[^/]+)?\.md|YAPE-DEMO\.md|docs\/[^\n]+\.(md|png|svg|jpg))$/i.test(file)) continue;
    if (/^src\/main\/frontend\/(src\/[^\n]+\.css|public\/[^\n]+\.(png|webp|jpg|ttf))$/i.test(file)) {
      level = 'medio';
      continue;
    }
    return { level: 'alto', reason: 'Afecta codigo, dependencias, controles o un componente no preautorizado.' };
  }
  return { level, reason: level === 'bajo' ? 'Solo documentacion; sin cambios en codigo ni dependencias.' : 'Cambios de presentacion; se requiere revision humana.' };
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' });
}

function main() {
  const head = git('rev-parse', 'HEAD').trim();
  let base = process.env.BASE_SHA;
  if (!base) {
    try { base = git('rev-parse', 'HEAD^').trim(); } catch { base = '0'.repeat(40); }
  }
  if (!/^[a-f0-9]{40,64}$/i.test(base)) throw new Error('Identificador base no valido.');
  const files = (/^0+$/.test(base)
    ? git('ls-tree', '-r', '--name-only', '-z', head)
    : git('diff', '--name-only', '-z', base, head)).split('\0').filter(Boolean);
  const result = classifyRisk(files, process.env.FORCE_REVIEW === 'true');
  const environment = result.level === 'bajo' ? 'demo-automatico' : 'demo-revision';
  const report = { commit: process.env.GITHUB_SHA || head, base, files, ...result, environment };
  mkdirSync('target', { recursive: true });
  writeFileSync('target/risk-report.json', JSON.stringify(report, null, 2));
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `nivel=${result.level}\nambiente=${environment}\n`);
  }
  const summary = `### Clasificacion del cambio\n\nRiesgo: **${result.level}**\n\n${result.reason}\n\nAmbiente: **${environment}**\n\nCommit: \`${report.commit}\`\n`;
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  console.log(summary);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
