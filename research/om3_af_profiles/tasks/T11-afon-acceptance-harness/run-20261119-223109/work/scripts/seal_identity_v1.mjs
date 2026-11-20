import { readFileSync } from 'node:fs';
import { writeSeal } from '../harness/identity_v1.mjs';

const body = JSON.parse(readFileSync('work/out/identity-t11-v5.json', 'utf8'));
if (body.ok !== true) throw new Error('identity run was not ok');
const keys = Object.keys(body.rows || {});
if (!keys.some((key) => key.startsWith('k1e:'))) throw new Error('no K1e identity rows');
if (!keys.some((key) => key.startsWith('k2:'))) throw new Error('no K2 identity rows');
if (!keys.some((key) => key.startsWith('k1e:zone-'))) throw new Error('no zone identity rows');
const seal = writeSeal('work/out/identity-t11-v5.json', 'work/out/identity-t11-v5.seal.json');
process.stdout.write(JSON.stringify(seal) + '\n');
