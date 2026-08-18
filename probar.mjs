// ===========================================================================
//  probar.mjs — prueba de humo del tablero, contra el endpoint REAL.
//
//  POR QUE EXISTE (12/08/2026): el bloque de auditoria se agrego y "andaba".
//  Andaba en la segunda visita. En la primera —arranque en frio de la edge
//  function— PostgREST devolvia 401 por desfasaje de reloj, la consulta se
//  rendia sin reintentar y el bloque desaparecia en silencio. El DOM no tiraba
//  ningun error: simplemente faltaba medio tablero. Abrir la pagina a mano y
//  ver que "se ve bien" no lo hubiera agarrado nunca.
//
//  Uso:
//    node probar.mjs           -> chequea y reporta
//    FOTO=1 node probar.mjs    -> ademas guarda capturas en /tmp
//
//  Correrlo DOS VECES seguidas: la primera pega contra la funcion fria, que
//  es donde aparecen los problemas.
//
//  Depende de Playwright, que ya esta instalado en el repo del bot.
// ===========================================================================
import { readFileSync } from 'node:fs';

const PW = '/Users/peiolacau/Desktop/albor-cashflow-bot/node_modules/playwright/index.mjs';
const KEY = process.env.TABLERO_KEY ?? 'sihXvUvqYWvTwdTdmeqfV3wb9nrEIkCV';

const { chromium } = await import(PW).catch(() => {
  console.error('No encuentro Playwright en ' + PW + '\nCorré `npm install` en albor-cashflow-bot.');
  process.exit(2);
});

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const nav = await chromium.launch();
const pag = await nav.newPage({ viewport: { width: 1280, height: 1400 }, deviceScaleFactor: 2 });

const errores = [];
pag.on('pageerror', (e) => errores.push('PAGEERROR: ' + e.message));
pag.on('console', (m) => { if (m.type() === 'error') errores.push('CONSOLE: ' + m.text()); });

// Se sirve el index.html local para probar lo que esta por pushearse, pero los
// DATOS salen del endpoint de produccion: es la mitad que mas se rompe.
await pag.route('https://tablero.local/', (r) =>
  r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html }));
await pag.goto('https://tablero.local/#k=' + KEY, { waitUntil: 'networkidle' });
await pag.waitForTimeout(2500);

const r = await pag.evaluate(() => {
  const q = (id) => document.getElementById(id);
  return {
    visible: q('audit') ? !q('audit').classList.contains('oculto') : null,
    sem: q('audit-sem')?.textContent ?? '',
    piezas: [...document.querySelectorAll('#audit-piezas .audit-pieza')].map((p) => ({
      rot: p.querySelector('.ap-rot').textContent,
      num: p.querySelector('.ap-num').textContent,
    })),
    nocomp: document.querySelectorAll('.nocomp').length,
    kpis: q('kpis')?.textContent.replace(/\s+/g, ' ').trim().slice(0, 110) ?? '',
  };
});

if (process.env.FOTO) {
  await pag.screenshot({ path: '/tmp/tablero_portada.png' });
  await pag.locator('#audit').screenshot({ path: '/tmp/tablero_audit.png' });
}
await nav.close();

const fallas = [];
console.log('errores de la pagina :', errores.length ? errores.join(' | ') : 'ninguno');
if (errores.length) fallas.push('la pagina tiro errores');

console.log('bloque auditoria     :', r.visible ? 'visible' : 'OCULTO', '|', r.sem);
for (const p of r.piezas) console.log('   ', p.rot.padEnd(13), p.num);
console.log('fotos no comparables :', r.nocomp);
console.log('KPIs                 :', r.kpis);

if (!r.visible) fallas.push('el bloque de auditoria no se pinto (mirar los logs de la edge function)');
// 18/08: la quinta pieza es "Pasado reescrito" (endpoint v13). Con un endpoint
// viejo pueden ser 4 y no es falla del front.
if (r.piezas.length !== 4 && r.piezas.length !== 5)
  fallas.push('se esperaban 4 o 5 piezas y hay ' + r.piezas.length);

// El control que importa: las piezas tienen que sumar el neto.
// OJO: el tablero usa el menos tipografico U+2212, no el guion ASCII. Un
// parser que solo contemple '-' se come el signo y todo parece no cerrar.
const n = (s) => Number(String(s).replace(/−/g, '-')
  .replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
if (r.piezas.length >= 4) {
  const [neto, altas, bajas, modif] = r.piezas.map((p) => n(p.num));
  const suma = altas + bajas + modif;
  const cierra = Math.abs(suma - neto) <= 0.3;
  console.log(`reconciliacion       : ${suma.toFixed(1)} vs neto ${neto.toFixed(1)} -> ${cierra ? 'OK' : 'NO CIERRA'}`);
  if (!cierra) fallas.push('la descomposicion del delta no suma el neto');
}

console.log(fallas.length ? '\nFALLA:\n  - ' + fallas.join('\n  - ') : '\nTodo OK.');
process.exit(fallas.length ? 1 : 0);
