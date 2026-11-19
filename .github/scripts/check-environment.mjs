import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function validateEnvironment(name, environment) {
  if (!['demo-automatico', 'demo-revision'].includes(name)) throw new Error('Ambiente no autorizado.');
  const review = environment.protection_rules?.find(rule => rule.type === 'required_reviewers');
  if (name === 'demo-revision' && !review?.reviewers?.length) {
    throw new Error('demo-revision debe tener un revisor requerido. Se bloquea el despliegue para evitar omitir la aprobacion.');
  }
  if (name === 'demo-automatico' && review?.reviewers?.length) {
    throw new Error('demo-automatico debe permitir la ruta automatica sin revisores de despliegue.');
  }
}

async function main() {
  const name = process.env.RELEASE_ENVIRONMENT;
  if (!['demo-automatico', 'demo-revision'].includes(name)) throw new Error('Ambiente no autorizado.');
  const response = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/environments/${name}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`Configura el ambiente ${name} en Settings > Environments. Respuesta HTTP ${response.status}.`);
  validateEnvironment(name, await response.json());
  const message = `Ambiente verificado: ${name}. ${name === 'demo-revision' ? 'El siguiente trabajo esperara aprobacion humana.' : 'Ruta automatica habilitada.'}`;
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Autorizacion\n\n${message}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
