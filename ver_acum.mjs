// Chequeo puntual 18/08: que el cuadro del acumulado siga la regla nueva.
import { readFileSync } from 'node:fs';
// 24/09/2026: el repo del bot se mudo a «04 Proyectos y Codigo», al lado de este. La ruta
// se resuelve relativa a este archivo (../albor-cashflow-bot) y se puede pisar con
// PLAYWRIGHT_DIR=/ruta/al/repo/del/bot si algun dia vuelven a vivir separados.
const PW = new URL(
  (process.env.PLAYWRIGHT_DIR ? process.env.PLAYWRIGHT_DIR.replace(/\/$/, '') + '/' : '../albor-cashflow-bot/')
  + 'node_modules/playwright/index.mjs',
  process.env.PLAYWRIGHT_DIR ? 'file://' : import.meta.url).href;
const { chromium } = await import(PW);
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const nav = await chromium.launch();
const pag = await nav.newPage();
await pag.route('https://tablero.local/', (r) => r.fulfill({ contentType: 'text/html', body: html }));
// 19/08/2026: la clave sale del entorno, nunca del repo (es publico).
const KEY = process.env.TABLERO_KEY;
if (!KEY) {
  console.error('Falta TABLERO_KEY. Corre:  TABLERO_KEY=... node ver_acum.mjs');
  process.exit(1);
}
await pag.goto('https://tablero.local/#k=' + KEY);
await pag.waitForSelector('#acum-linea .mes', { timeout: 30000 });
await pag.click('#acum-ver');
const r = await pag.evaluate(() => ({
  barra: document.getElementById('acum-linea').innerText.replace(/\n/g, ' | '),
  filas: [...document.querySelectorAll('#acum-tabla tr')].map((tr) =>
    [...tr.children].map((c) => c.innerText.trim()).join(' | ')),
  botones: [...document.querySelectorAll('.capa-b b')].map((b) => b.innerText),
}));
console.log('botones :', r.botones.join(' / '));
console.log('barra   :', r.barra);
r.filas.forEach((f) => console.log('  ', f));
await nav.close();
