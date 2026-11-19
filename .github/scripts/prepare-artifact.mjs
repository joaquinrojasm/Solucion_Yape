import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const jars = readdirSync('target').filter(name => name.endsWith('.jar'));
if (jars.length !== 1) throw new Error('Debe existir exactamente un JAR de la aplicacion.');
const artifact = jars[0];
const sha256 = createHash('sha256').update(readFileSync(`target/${artifact}`)).digest('hex');
const commit = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const manifest = {
  artifact, sha256, commit,
  workingTreeDirty: execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim().length > 0,
  createdAt: new Date().toISOString(),
  runId: process.env.GITHUB_RUN_ID || 'local',
  runAttempt: process.env.GITHUB_RUN_ATTEMPT || '1',
  runUrl: process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : null,
};
writeFileSync('target/release-manifest.json', JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest, null, 2));
