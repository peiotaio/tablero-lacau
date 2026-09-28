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
//    2. el comparador pinto: filas (table.comp tbody tr) o su estado vacio valido;
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
//  28/09/2026 (v4): el estado vacio del comparador es VALIDO. El domingo 27/09
//  el watchdog abrio el incidente #27 (WEB_CAIDA, ROJO) porque las fotos del
//  26 y del 27 eran identicas (fin de semana: Albor no se mueve) y la pagina
//  pinto, bien, "Ningun rubro cambio entre la foto del ... y la del ..." con
//  0 filas. La web estaba sana; la prueba exigia filas. Ahora:
//    * se espera lo que aparezca primero: filas o el cartel de "Ningun rubro
//      cambio" (.ok); la falla "no tiene filas" es solo cuando no hay NI filas
//      NI cartel;
//    * la clave recordada se chequea siempre (antes dependia de que hubiera filas);
//    * ademas de las aperturas por defecto (ultimas dos fotos), una apertura
//      con un PAR FIJO que sabemos que se movio (27/09 -> 28/09, obj 2027-06:
//      2 rubros, delta +32,85 MM). Ahi SI se exigen filas: asi la prueba sigue
//      viendo si el comparador se rompe de verdad, cualquier dia. Si ese par
//      dejo de existir (raleo del detalle crudo a los 60 dias) o ya no tiene
//      filas, se toma el par consecutivo mas reciente con movimiento desde la
//      vista comparador de la funcion; nunca se inventan fechas;
//    * si la UNICA falla es "se exigian filas y la pagina pinto el estado
//      vacio", la salida termina con "PATRON: WEB_PRUEBA_SIN_MOVIMIENTO": el
//      watchdog lo registra como INFO, no como WEB_CAIDA.
//
//  Uso:
//    TABLERO_KEY=... node probar.mjs                 -> tabla.html LOCAL (lo que esta por pushearse)
//    TABLERO_KEY=... TABLERO_URL=https://.../tabla.html node probar.mjs
//                                                    -> la pagina PUBLICADA (lo que abre Pablo;
//                                                       asi corre en el watchdog del bot)
//    TABLERO_A=2026-09-26 TABLERO_B=2026-09-27 [TABLERO_OBJ=2027-06]
//                                                    -> fuerza el par de las aperturas por defecto
//                                                       (para probar a mano el estado vacio)
//    TABLERO_PAR_FIJO=2026-09-26,2026-09-27,2027-06  -> reemplaza el par fijo (para probar el camino
//                                                       "el par fijo no tiene filas, se busca otro")
//    TABLERO_API=https://.../functions/v1/tabla      -> la funcion (default: la de tabla.html)
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
// La funcion de datos (no es secreto: esta escrita en tabla.html). Se usa para elegir
// el par fijo con movimiento antes de abrir el navegador.
const API = process.env.TABLERO_API || 'https://htxtrmfmrzvgukqzjjnh.supabase.co/functions/v1/tabla';
const t0 = Date.now();

// El par de las aperturas por defecto: normalmente ninguno (la pagina elige las dos
// ultimas fotos). Se puede forzar por entorno para probar a mano el estado vacio.
const esFecha = (s) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
const esMes = (s) => !!s && /^\d{4}-\d{2}$/.test(s);
const PAR_DEFAULT = esFecha(process.env.TABLERO_A) && esFecha(process.env.TABLERO_B)
  ? { a: process.env.TABLERO_A, b: process.env.TABLERO_B, obj: esMes(process.env.TABLERO_OBJ) ? process.env.TABLERO_OBJ : null }
  : null;

// El par FIJO con movimiento conocido (verificado a mano el 28/09/2026 en Chrome:
// 2 rubros, delta +32,85 MM). Las fotos son inmutables, asi que mientras existan
// el resultado es el mismo cualquier dia.
// TABLERO_PAR_FIJO=a,b,obj lo reemplaza (solo para probar a mano el camino de "se busca otro").
const PAR_FIJO = (() => {
  const [a, b, obj] = (process.env.TABLERO_PAR_FIJO || '').split(',');
  return esFecha(a) && esFecha(b) && esMes(obj) ? { a, b, obj } : { a: '2026-09-27', b: '2026-09-28', obj: '2027-06' };
})();

const nav = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
const fallas = [];          // { texto, sinMovimiento }
const resumen = [];
const falla = (texto, sinMovimiento = false) => fallas.push({ texto, sinMovimiento });

// --- Elegir el par con movimiento, preguntandole a la funcion --------------------
// Devuelve { a, b, obj, filas, delta, origen } o null si no hay ninguno.
async function comparador(par) {
  const p = new URLSearchParams({ vista: 'comparador', k: KEY, origen: 'prueba' });
  if (par?.a) p.set('a', par.a);
  if (par?.b) p.set('b', par.b);
  if (par?.obj) p.set('objetivo', par.obj);
  const r = await fetch(API + '?' + p.toString(), { signal: AbortSignal.timeout(45000) });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${(await r.text()).slice(0, 160)}`);
  return r.json();
}
async function elegirParConMovimiento() {
  // 1) El par fijo, tal cual.
  try {
    const d = await comparador(PAR_FIJO);
    if (d.a.fecha === PAR_FIJO.a && d.b.fecha === PAR_FIJO.b && d.objetivo === PAR_FIJO.obj && d.filas.length) {
      return { ...PAR_FIJO, filas: d.filas.length, delta: d.total.delta, origen: 'fijo' };
    }
    resumen.push(`par fijo ${PAR_FIJO.a} -> ${PAR_FIJO.b}: la funcion devolvio ${d.a.fecha} -> ${d.b.fecha} obj ${d.objetivo} con ${d.filas.length} filas; se busca otro`);
  } catch (e) {
    resumen.push(`par fijo ${PAR_FIJO.a} -> ${PAR_FIJO.b}: la funcion no lo dio (${e.message.slice(0, 120)}); se busca otro`);
  }
  // 2) El par consecutivo mas reciente con filas, desde la lista de fotos registradas.
  let d;
  try { d = await comparador(null); } catch (e) {
    resumen.push(`no pude leer la vista comparador para buscar un par con movimiento: ${e.message.slice(0, 160)}`);
    return null;
  }
  const fotos = d.fotos || [];               // la ultima primero
  const probados = [];
  for (let i = 0; i + 1 < fotos.length && probados.length < 12; i++) {
    const par = { a: fotos[i + 1], b: fotos[i], obj: d.objetivo };
    try {
      const x = (par.a === d.a.fecha && par.b === d.b.fecha) ? d : await comparador(par);
      probados.push(`${par.a}->${par.b}:${x.filas.length}`);
      if (x.filas.length) return { ...par, filas: x.filas.length, delta: x.total.delta, origen: 'mas reciente con movimiento' };
    } catch (e) {
      probados.push(`${par.a}->${par.b}:error`);
    }
  }
  resumen.push('ningun par consecutivo reciente tiene filas: ' + probados.join(' '));
  return null;
}

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
// par:  null (la pagina elige las dos ultimas fotos) o { a, b, obj, exigirFilas }
async function probarEn(ancho, modo, ctx, par = PAR_DEFAULT) {
  const pag = await ctx.newPage();
  const exigirFilas = !!par?.exigirFilas;
  const rot = `${ancho} px · ${modo === 'query' ? '?k=' : modo === 'hash' ? '#k=' : 'sin clave (memoria)'}` +
    (par ? ` · ${exigirFilas ? 'par fijo' : 'par'} ${par.a} -> ${par.b}${par.obj ? ' obj ' + par.obj : ''}` : '');
  const errores = [];
  pag.on('pageerror', (e) => errores.push('PAGEERROR: ' + e.message));
  pag.on('console', (m) => {
    // Un 404 de favicon no es la pagina rota: se ignora (la pagina ya trae un icono vacio).
    if (m.type() === 'error' && !/favicon/.test(m.location()?.url ?? '')) errores.push('CONSOLE: ' + m.text());
  });

  const base = URL_PUBLICADA ? URL_PUBLICADA.split('#')[0].split('?')[0] : 'https://tablero.local/tabla.html';
  // El deep link (a, b, obj) va siempre en el hash, igual que lo arma la pagina.
  const extra = new URLSearchParams();
  if (par) { extra.set('a', par.a); extra.set('b', par.b); if (par.obj) extra.set('obj', par.obj); }
  extra.set('prueba', '1');
  const destino = modo === 'query' ? base + '?k=' + encodeURIComponent(KEY) + '#' + extra.toString()
                : modo === 'hash'  ? base + '#k=' + encodeURIComponent(KEY) + '&' + extra.toString()
                : base + '#' + extra.toString();
  await pag.goto(destino, { waitUntil: 'domcontentloaded' });

  // El comparador es lo primero que tiene que aparecer: filas, o el cartel de
  // "Ningun rubro cambio" (estado vacio valido). 45 s cubre la edge function fria.
  try {
    await pag.waitForFunction(() =>
      !!document.querySelector('table.comp tbody tr') ||
      Array.from(document.querySelectorAll('.ok')).some((e) => /Ning[uú]n rubro cambi/.test(e.textContent || '')),
      null, { timeout: 45000 });
  } catch {
    const aviso = await pag.evaluate(() => document.querySelector('.aviso')?.textContent?.trim() ?? '');
    falla(`${rot}: el comparador no aparecio en 45 s` + (aviso ? ` (la pagina dice: "${aviso.slice(0, 160)}")` : ''));
  }
  await pag.waitForTimeout(800); // el sello del contraste llega en una segunda llamada

  const r = await pag.evaluate((w) => {
    const h = new URLSearchParams(location.hash.slice(1));
    return {
      filas: document.querySelectorAll('table.comp tbody tr').length,
      vacio: Array.from(document.querySelectorAll('.ok')).some((e) => /Ning[uú]n rubro cambi/.test(e.textContent || '')),
      vacioTexto: (Array.from(document.querySelectorAll('.ok')).find((e) => /Ning[uú]n rubro cambi/.test(e.textContent || ''))?.textContent || '').replace(/\s+/g, ' ').trim(),
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
      hashA: h.get('a'), hashB: h.get('b'), hashObj: h.get('obj'),
      olvidar: !!document.querySelector('#olvidar'),
      claveGuardada: (function () { try { return !!localStorage.getItem('cf_clave'); } catch (e) { return false; } })(),
    };
  }, ancho);

  if (process.env.FOTO) {
    await pag.screenshot({ path: `${FOTO_DIR}/tabla_${ancho}_${modo}${par ? '_' + par.a + '_' + par.b : ''}.png`, fullPage: true });
  }
  await pag.close();

  resumen.push(`--- ${rot} ---`);
  resumen.push('clave                : ' + (r.search.indexOf('k=') >= 0 ? 'QUEDO EN LA BARRA (?k=)' : 'no esta en la query') +
    ' · en el hash: ' + (r.hashConClave ? 'si' : 'no') + ' · recordada: ' + (r.claveGuardada ? 'si' : 'no') +
    ' · link olvidar: ' + (r.olvidar ? 'si' : 'no'));
  resumen.push('errores de la pagina : ' + (errores.length ? errores.join(' | ') : 'ninguno'));
  resumen.push('fotos comparadas     : ' + (r.hashA && r.hashB ? `${r.hashA} -> ${r.hashB}` : '(sin a/b en el hash)') + (r.hashObj ? ' · acumulado a ' + r.hashObj : ''));
  resumen.push('numero grande        : ' + (r.heroNum || '(vacio)') + '  ' + r.heroDelta);
  resumen.push('sello del contraste  : ' + (r.sello || '(vacio)'));
  resumen.push('comparador           : ' + (r.filas ? r.filas + ' filas' : r.vacio ? 'sin movimiento entre las dos fotos (estado vacío válido)' : 'SIN FILAS Y SIN CARTEL') +
    '  (evolucion: ' + r.evoFilas + ' filas, linea svg: ' + (r.spark ? 'si' : 'no') + ')');
  resumen.push('pie del residuo      : ' + r.lineasPie + ' lineas' + (r.lineasPie === 3 ? '' : '  <- ' + r.pieTexto));
  resumen.push('scroll horizontal    : scrollWidth ' + r.scrollWidth + ' vs viewport ' + ancho);

  if (errores.length) falla(`${rot}: la pagina tiro errores (${errores[0].slice(0, 120)})`);
  if (!r.filas && !r.vacio) falla(`${rot}: el comparador no tiene filas ni el cartel de "Ningún rubro cambió"`);
  if (exigirFilas && !r.filas && r.vacio) {
    falla(`${rot}: se esperaban filas (par con movimiento conocido) y la pagina pinto el estado vacio: "${r.vacioTexto.slice(0, 140)}"`, true);
  }
  if (par && r.hashA && r.hashB && (r.hashA !== par.a || r.hashB !== par.b)) {
    falla(`${rot}: se pidio ${par.a} -> ${par.b} y la pagina muestra ${r.hashA} -> ${r.hashB}`);
  }
  if (r.lineasPie !== 3) falla(`${rot}: el pie del residuo tiene ${r.lineasPie} lineas y no 3`);
  if (!r.heroNum || r.heroNum === '·MM') falla(`${rot}: el numero grande esta vacio`);
  if (r.scrollWidth > ancho) falla(`${rot}: hay scroll horizontal (scrollWidth ${r.scrollWidth})`);
  if (/(^\?|&)k=/.test(r.search)) falla(`${rot}: la clave quedo en la barra de direcciones (?k=)`);
  if (!r.olvidar) falla(`${rot}: falta el link "olvidar la clave en este aparato"`);
  // La clave se guarda apenas se lee del link, antes de cualquier consulta: no depende de que haya filas.
  if (!r.claveGuardada) falla(`${rot}: la clave no quedo recordada en el aparato (localStorage cf_clave)`);
  return r.filas;
}

// El par con movimiento se elige antes de abrir nada (una o dos consultas a la funcion).
const parMovimiento = await elegirParConMovimiento();
resumen.push('par con movimiento   : ' + (parMovimiento
  ? `${parMovimiento.a} -> ${parMovimiento.b} obj ${parMovimiento.obj} (${parMovimiento.origen}: ${parMovimiento.filas} rubros, Δ ${parMovimiento.delta} MM)`
  : 'NINGUNO (no se pudo exigir filas)'));
if (PAR_DEFAULT) resumen.push('par por defecto      : forzado por entorno ' + PAR_DEFAULT.a + ' -> ' + PAR_DEFAULT.b + (PAR_DEFAULT.obj ? ' obj ' + PAR_DEFAULT.obj : ''));

// 375: primero ?k= (la forma que se comparte), despues #k=.
const c375 = await contexto(375);
await probarEn(375, 'query', c375);
await probarEn(375, 'hash', c375);
await c375.close();
// 1280: #k=, ?k=, una tercera apertura SIN clave en el mismo navegador (memoria),
// y la apertura con el par que SI se movio (aca se exigen filas).
const c1280 = await contexto(1280);
await probarEn(1280, 'hash', c1280);
await probarEn(1280, 'query', c1280);
await probarEn(1280, 'memoria', c1280);
if (parMovimiento) {
  await probarEn(1280, 'hash', c1280, { ...parMovimiento, exigirFilas: true });
} else {
  falla('no hay ningun par de fotos con movimiento para exigir filas: no se pudo probar el comparador con datos', true);
}
await c1280.close();
await nav.close();

console.log(resumen.join('\n'));
console.log(`duracion             : ${((Date.now() - t0) / 1000).toFixed(1)} s`);
if (!fallas.length) {
  console.log('\nTodo OK.');
} else {
  console.log('\nFALLA:\n  - ' + fallas.map((f) => f.texto).join('\n  - '));
  // Si TODO lo que fallo es "faltan filas donde tendria que haber movimiento", no es la web
  // caida: es que no hay par con movimiento. El watchdog lo registra como INFO.
  if (fallas.every((f) => f.sinMovimiento)) console.log('PATRON: WEB_PRUEBA_SIN_MOVIMIENTO');
}
process.exit(fallas.length ? 1 : 0);
