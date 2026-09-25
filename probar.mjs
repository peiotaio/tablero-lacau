// ===========================================================================
//  probar.mjs — prueba de humo de tabla.html, contra el endpoint REAL.
//
//  POR QUE EXISTE (12/08/2026): el bloque de auditoria del tablero viejo se
//  agrego y "andaba". Andaba en la segunda visita. En la primera —arranque en
//  frio de la edge function— PostgREST devolvia 401 por desfasaje de reloj, la
//  consulta se rendia sin reintentar y el bloque desaparecia en silencio. El
//  DOM no tiraba ningun error: simplemente faltaba medio tablero. Abrir la
//  pagina a mano y ver que "se ve bien" no lo hubiera agarrado nunca.
//
//  24/09/2026 (v2): pasa a probar tabla.html (la pantalla v8/v9, dos bloques).
//  Que verifica, en 375 px primero y despues en 1280 px:
//    1. la pagina carga con la clave y no tira errores de consola;
//    2. el comparador tiene filas (table.comp tbody tr);
//    3. el pie del residuo tiene sus TRES lineas (#pie .residuo .linea);
//    4. no hay scroll horizontal de pagina a 375 px (scrollWidth <= 375);
//    5. el numero grande (#hero-num) esta pintado.
//
//  Uso:
//    TABLERO_KEY=... node probar.mjs                 -> tabla.html LOCAL (lo que esta por pushearse)
//    TABLERO_KEY=... TABLERO_URL=https://.../tabla.html node probar.mjs
//                                                    -> la pagina PUBLICADA (lo que abre Pablo;
//                                                       asi corre en el watchdog del bot)
//    FOTO=1                                          -> ademas guarda capturas (FOTO_DIR o /tmp)
//    PW_CHANNEL=chrome                               -> usa el Chrome del sistema (GitHub Actions
//                                                       lo trae; evita bajar Chromium)
//
//  La clave NUNCA vive en este repo (es publico, GitHub Pages lo necesita):
//  sale del entorno o aborta. Playwright: el paquete del repo del bot
//  (../albor-cashflow-bot, o PLAYWRIGHT_DIR), o `playwright-core` si esta
//  instalado al lado (caso del watchdog).
// ===========================================================================
import { readFileSync, existsSync } from 'node:fs';

const KEY = process.env.TABLERO_KEY;
if (!KEY) {
  console.error('Falta TABLERO_KEY. Corre:  TABLERO_KEY=... node probar.mjs');
  process.exit(1);
}

// Donde esta Playwright: primero al lado (playwright-core / playwright), despues el repo del bot.
async function cargarPlaywright() {
  const candidatos = [];
  for (const pkg of ['playwright-core', 'playwright']) {
    candidatos.push(new URL(`./node_modules/${pkg}/index.mjs`, import.meta.url).href);
  }
  const base = process.env.PLAYWRIGHT_DIR
    ? 'file://' + process.env.PLAYWRIGHT_DIR.replace(/\/$/, '') + '/'
    : new URL('../albor-cashflow-bot/', import.meta.url).href;
  candidatos.push(base + 'node_modules/playwright/index.mjs');
  for (const c of candidatos) {
    try { return await import(c); } catch { /* siguiente */ }
  }
  console.error('No encuentro Playwright. Probe:\n  ' + candidatos.join('\n  ') +
    '\nCorré `npm install` en albor-cashflow-bot, o `npm install --no-save playwright-core` acá.');
  process.exit(2);
}
const { chromium } = await cargarPlaywright();

const URL_PUBLICADA = process.env.TABLERO_URL || null;
const html = URL_PUBLICADA ? null : readFileSync(new URL('./tabla.html', import.meta.url), 'utf8');
const FOTO_DIR = process.env.FOTO_DIR || '/tmp';
const t0 = Date.now();

const nav = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
const fallas = [];
const resumen = [];

async function probarEn(ancho) {
  const pag = await nav.newPage({ viewport: { width: ancho, height: ancho < 600 ? 812 : 900 }, deviceScaleFactor: 2 });
  const errores = [];
  pag.on('pageerror', (e) => errores.push('PAGEERROR: ' + e.message));
  pag.on('console', (m) => { if (m.type() === 'error') errores.push('CONSOLE: ' + m.text()); });

  let destino;
  if (URL_PUBLICADA) {
    destino = URL_PUBLICADA.split('#')[0] + '#k=' + KEY;
  } else {
    // Se sirve el tabla.html local, pero los DATOS salen del endpoint de produccion:
    // es la mitad que mas se rompe.
    await pag.route('https://tablero.local/**', (r) =>
      r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html }));
    destino = 'https://tablero.local/tabla.html#k=' + KEY;
  }
  await pag.goto(destino, { waitUntil: 'domcontentloaded' });

  // El comparador es lo primero que tiene que aparecer. 45 s cubre la edge function fria.
  let filas = 0;
  try {
    await pag.waitForSelector('table.comp tbody tr', { timeout: 45000 });
  } catch {
    const aviso = await pag.evaluate(() => document.querySelector('.aviso')?.textContent?.trim() ?? '');
    fallas.push(`${ancho}px: el comparador no aparecio en 45 s` + (aviso ? ` (la pagina dice: "${aviso.slice(0, 160)}")` : ''));
  }
  await pag.waitForTimeout(800); // el sello del contraste llega en una segunda llamada

  const r = await pag.evaluate((w) => ({
    filas: document.querySelectorAll('table.comp tbody tr').length,
    lineasPie: document.querySelectorAll('#pie .residuo .linea').length,
    pieTexto: document.querySelector('#pie')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 200) ?? '',
    heroNum: document.querySelector('#hero-num')?.textContent?.trim() ?? '',
    heroDelta: document.querySelector('#hero-delta')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    sello: document.querySelector('#sello')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    scrollWidth: document.documentElement.scrollWidth,
    ancho: w,
    evoFilas: document.querySelectorAll('table.evo tbody tr').length,
    spark: !!document.querySelector('svg.spark'),
  }), ancho);
  filas = r.filas;

  if (process.env.FOTO) {
    await pag.screenshot({ path: `${FOTO_DIR}/tabla_${ancho}.png`, fullPage: true });
  }
  await pag.close();

  resumen.push(`--- ${ancho} px ---`);
  resumen.push('errores de la pagina : ' + (errores.length ? errores.join(' | ') : 'ninguno'));
  resumen.push('numero grande        : ' + (r.heroNum || '(vacio)') + '  ' + r.heroDelta);
  resumen.push('sello del contraste  : ' + (r.sello || '(vacio)'));
  resumen.push('filas del comparador : ' + r.filas + '  (evolucion: ' + r.evoFilas + ', linea svg: ' + (r.spark ? 'si' : 'no') + ')');
  resumen.push('pie del residuo      : ' + r.lineasPie + ' lineas' + (r.lineasPie === 3 ? '' : '  <- ' + r.pieTexto));
  resumen.push('scroll horizontal    : scrollWidth ' + r.scrollWidth + ' vs viewport ' + ancho);

  if (errores.length) fallas.push(`${ancho}px: la pagina tiro errores (${errores[0].slice(0, 120)})`);
  if (!r.filas) fallas.push(`${ancho}px: el comparador no tiene filas`);
  if (r.lineasPie !== 3) fallas.push(`${ancho}px: el pie del residuo tiene ${r.lineasPie} lineas y no 3`);
  if (!r.heroNum || r.heroNum === '·MM') fallas.push(`${ancho}px: el numero grande esta vacio`);
  if (r.scrollWidth > ancho) fallas.push(`${ancho}px: hay scroll horizontal (scrollWidth ${r.scrollWidth})`);
  return filas;
}

await probarEn(375);
await probarEn(1280);
await nav.close();

console.log(resumen.join('\n'));
console.log(`duracion             : ${((Date.now() - t0) / 1000).toFixed(1)} s`);
console.log(fallas.length ? '\nFALLA:\n  - ' + fallas.join('\n  - ') : '\nTodo OK.');
process.exit(fallas.length ? 1 : 0);
