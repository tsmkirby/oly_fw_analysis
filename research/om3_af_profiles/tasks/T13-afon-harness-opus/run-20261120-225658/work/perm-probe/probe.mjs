import fs from 'node:fs';
import { readFileSync } from 'node:fs';
const out = [];
const t = (name, fn) => { try { fn(); out.push(name + ': ALLOWED'); } catch (e) { out.push(name + ': ' + (e.code || e.message)); } };
t('allowed readFileSync', () => readFileSync('allowed.txt'));
t('denied named readFileSync', () => readFileSync('denied.txt'));
t('denied fs.openSync', () => fs.openSync('denied.txt', 'r'));
t('denied Buffer path', () => fs.readFileSync(Buffer.from('denied.txt')));
t('denied URL', () => fs.readFileSync(new URL('./denied.txt', import.meta.url)));
t('denied statSync', () => fs.statSync('denied.txt'));
try { await fs.promises.readFile('denied.txt'); out.push('denied promises: ALLOWED'); } catch (e) { out.push('denied promises: ' + e.code); }
try { await import('./dep.mjs'); out.push('allowed import: ALLOWED'); } catch (e) { out.push('allowed import: ' + e.code); }
try { await import('./other.mjs'); out.push('denied import: ALLOWED'); } catch (e) { out.push('denied import: ' + (e.code || e.message)); }
t('write denied', () => fs.writeFileSync('x.txt', 'x'));
out.push('permission api: ' + typeof process.permission?.has + ' has(read,denied)=' + process.permission?.has('fs.read', process.cwd() + '/denied.txt'));
out.push('execArgv: ' + JSON.stringify(process.execArgv));
console.log(out.join('\n'));
