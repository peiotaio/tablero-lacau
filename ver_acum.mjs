// Chequeo puntual 18/08: que el cuadro del acumulado siga la regla nueva.
import { readFileSync } from 'node:fs';
const PW = '/Users/peiolacau/Desktop/albor-cashflow-bot/node_modules/playwright/index.mjs';
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
