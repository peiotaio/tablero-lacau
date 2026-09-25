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
//  25/09/2026 (v3): el link se puede compartir (tabla.html v9.1). Cada ancho se
//  prueba con las DOS formas de pasar la clave: ?k= (query: tiene que
//  desaparecer de la barra) y #k= (hash). Y al final una apertura "de memoria"
//  en el mismo navegador, SIN clave en el link: tiene que cargar igual porque
//  el aparato la recuerda (localStorage cf_clave). Se verifica ademas que
//  exista el link "olvidar la clave". Todas las consultas van con prueba=1:
//  la funcion las anota en cf_uso_web con origen='prueba', separadas del uso
//  real.
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
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const KEY = process.env.TABLERO_KEY;
if (!KEY) {
  console.error('Falta TABLERO_KEY. Corre:  TABLERO_KEY=... node probar.mjs');
  process.exit(1);
}

// Donde esta Playwright: primero al lado (playwright-core / playwright), despues el repo del bot.
async function cargarPlaywright() {
  const candidatos = [];
  // Al lado del script, y en el directorio desde donde se corre (en el watchdog el script
  // vive en web/ pero playwright-core se instala en la raiz del repo del bot: npm sube
  // hasta el package.json mas cercano, asi que instalarlo "en web/" no lo deja en web/).
  const bases = [new URL('./', import.meta.url).href, pathToFileURL(process.cwd() + '/').href];
  if (process.env.PLAYWRIGHT_DIR) bases.push(pathToFileURL(process.env.PLAYWRIGHT_DIR.replace(/\/$/, '') + '/').href);
  bases.push(new URL('../albor-cashflow-bot/', import.meta.url).href);
  for (const b of bases) for (const pkg of ['playwright-core', 'playwright']) {
    candidatos.push(b + `node_modules/${pkg}/index.mjs`);
  }
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

// Un contexto por ancho (el localStorage vive en el contexto: asi la apertura
// "de memoria" encuentra la clave que guardo la apertura anterior).
async function contexto(ancho) {
  const ctx = await nav.newContext({ viewport: { width: ancho, height: ancho < 600 ? 812 : 900 }, deviceScaleFactor: 2 });
  if (!URL_PUBLICADA) {
    // Se sirve el tabla.html local, pero los DATOS salen del endpoint de produccion:
    // es la mitad que mas se rompe.
    await ctx.route('https://tablero.local/**', (r) =>
      r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html }));
  }
  return ctx;
}

// modo: 'query' (?k=…#prueba=1) · 'hash' (#k=…&prueba=1) · 'memoria' (sin clave: la recuerda el aparato)
async function probarEn(ancho, modo, ctx) {
  const pag = await ctx.newPage();
  const rot = `${ancho} px · ${modo === 'query' ? '?k=' : modo === 'hash' ? '#k=' : 'sin clave (memoria)'}`;
  const errores = [];
  pag.on('pageerror', (e) => errores.push('PAGEERROR: ' + e.message));
  pag.on('console', (m) => {
    // Un 404 de favicon no es la pagina rota: se ignora (la pagina ya trae un icono vacio).
    if (m.type() === 'error' && !/favicon/.test(m.location()?.url ?? '')) errores.push('CONSOLE: ' + m.text());
  });

  const base = URL_PUBLICADA ? URL_PUBLICADA.split('#')[0].split('?')[0] : 'https://tablero.local/tabla.html';
  const destino = modo === 'query' ? base + '?k=' + encodeURIComponent(KEY) + '#prueba=1'
                : modo === 'hash'  ? base + '#k=' + encodeURIComponent(KEY) + '&prueba=1'
                : base + '#prueba=1';
  await pag.goto(destino, { waitUntil: 'domcontentloaded' });

  // El comparador es lo primero que tiene que aparecer. 45 s cubre la edge function fria.
  let filas = 0;
  try {
    await pag.waitForSelector('table.comp tbody tr', { timeout: 45000 });
  } catch {
    const aviso = await pag.evaluate(() => document.querySelector('.aviso')?.textContent?.trim() ?? '');
    fallas.push(`${rot}: el comparador no aparecio en 45 s` + (aviso ? ` (la pagina dice: "${aviso.slice(0, 160)}")` : ''));
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
    search: location.search,
    hashConClave: /(^|[#&])k=/.test(location.hash),
    olvidar: !!document.querySelector('#olvidar'),
    claveGuardada: (function () { try { return !!localStorage.getItem('cf_clave'); } catch (e) { return false; } })(),
  }), ancho);
  filas = r.filas;

  if (process.env.FOTO) {
    await pag.screenshot({ path: `${FOTO_DIR}/tabla_${ancho}_${modo}.png`, fullPage: true });
  }
  await pag.close();

  resumen.push(`--- ${rot} ---`);
  resumen.push('clave                : ' + (r.search.indexOf('k=') >= 0 ? 'QUEDO EN LA BARRA (?k=)' : 'no esta en la query') +
    ' · en el hash: ' + (r.hashConClave ? 'si' : 'no') + ' · recordada: ' + (r.claveGuardada ? 'si' : 'no') +
    ' · link olvidar: ' + (r.olvidar ? 'si' : 'no'));
  resumen.push('errores de la pagina : ' + (errores.length ? errores.join(' | ') : 'ninguno'));
  resumen.push('numero grande        : ' + (r.heroNum || '(vacio)') + '  ' + r.heroDelta);
  resumen.push('sello del contraste  : ' + (r.sello || '(vacio)'));
  resumen.push('filas del comparador : ' + r.filas + '  (evolucion: ' + r.evoFilas + ', linea svg: ' + (r.spark ? 'si' : 'no') + ')');
  resumen.push('pie del residuo      : ' + r.lineasPie + ' lineas' + (r.lineasPie === 3 ? '' : '  <- ' + r.pieTexto));
  resumen.push('scroll horizontal    : scrollWidth ' + r.scrollWidth + ' vs viewport ' + ancho);

  if (errores.length) fallas.push(`${rot}: la pagina tiro errores (${errores[0].slice(0, 120)})`);
  if (!r.filas) fallas.push(`${rot}: el comparador no tiene filas`);
  if (r.lineasPie !== 3) fallas.push(`${rot}: el pie del residuo tiene ${r.lineasPie} lineas y no 3`);
  if (!r.heroNum || r.heroNum === '·MM') fallas.push(`${rot}: el numero grande esta vacio`);
  if (r.scrollWidth > ancho) fallas.push(`${rot}: hay scroll horizontal (scrollWidth ${r.scrollWidth})`);
  if (/(^\?|&)k=/.test(r.search)) fallas.push(`${rot}: la clave quedo en la barra de direcciones (?k=)`);
  if (!r.olvidar) fallas.push(`${rot}: falta el link "olvidar la clave en este aparato"`);
  if (r.filas && !r.claveGuardada) fallas.push(`${rot}: la clave no quedo recordada en el aparato (localStorage cf_clave)`);
  return filas;
}

// 375: primero ?k= (la forma que se comparte), despues #k=.
const c375 = await contexto(375);
await probarEn(375, 'query', c375);
await probarEn(375, 'hash', c375);
await c375.close();
// 1280: #k=, ?k=, y una tercera apertura SIN clave en el mismo navegador (memoria).
const c1280 = await contexto(1280);
await probarEn(1280, 'hash', c1280);
await probarEn(1280, 'query', c1280);
await probarEn(1280, 'memoria', c1280);
await c1280.close();
await nav.close();

console.log(resumen.join('\n'));
console.log(`duracion             : ${((Date.now() - t0) / 1000).toFixed(1)} s`);
console.log(fallas.length ? '\nFALLA:\n  - ' + fallas.join('\n  - ') : '\nTodo OK.');
process.exit(fallas.length ? 1 : 0);
