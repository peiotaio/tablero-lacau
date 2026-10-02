// ===========================================================================
//  probar_cashflow.mjs — prueba de humo de cashflow.html (la web «Dónde te
//  parás»), contra la edge function REAL. No toca probar.mjs (tabla.html).
//
//  30/09/2026 (v1). Que verifica:
//    1. A 375 y a 1280 px, abriendo con ?k= (la clave tiene que desaparecer de
//       la barra y quedar recordada en el aparato): recorre las 5 pestañas
//       (Saldo proyectado · Cash Flow Hoy · Qué cambió · Granos · Estado de la
//       web) y en cada una exige 0 errores de consola y sin scroll horizontal
//       de pagina (scrollWidth <= ancho).
//    2. A 375 px, en «Qué cambió», la columna «Tipo» del cuadro por rubro no se
//       ve (decision 3 de Peio) y la primera cifra del cuadro entra en la
//       pantalla sin deslizar.
//    3. Con hoy=2026-09-29 (dia congelado; las bajadas pasadas no cambian
//       nunca), los casos del PROMPT 1 en «Qué cambió»:
//         15/09 · hoy   · 30/11 -> −1.315,29 · −1.018,78 · cambió +296,52
//         15/09 · 22/09 · 30/11 -> −1.315,29 · −348,29   · cambió +967,00
//       exactos en las tarjetas y en la fila «Saldo total».
//    4. La ultima columna del cuadro por rubro («Diferencia al … vs. hoy»)
//       cambia al mover «Mirando al» (en la v22 de la maqueta daba siempre
//       0,00 y fue un error real).
//    5. En Saldo proyectado, al mover «Mirando al» cambia el bloque «Fecha
//       elegida» (decision 2: nada queda fijo a hoy).
//    6. Abrir «Qué cambió» sin tocar nada: hoy contra hoy, «Cambió» en 0,00,
//       sin error (decision 1: es un estado valido).
//
//    7. (v1.1, PROMPT 3) Granos con hoy=2026-09-29: en pantalla, el caso congelado
//       de la maqueta: stock 20.231,58 MM (12 renglones, 2 sin tn/USD/TC), gastos
//       comerciales −8.885,64 (con −311,44 de fletes del 16) y cosecha −4.078,48;
//       el chip «Soja» filtra (título, stock 8.363,74, 2 renglones de stock).
//    8. (v1.1) Estado de la web: 29/09 -> coincide, 0,07 MM sin bancos, ninguna
//       celda, bancos +21,80, 58 días guardados, bitácora de 10 hábiles;
//       30/09 -> coincide, 0,07, ninguna celda, bancos +36,75, 59 días.
//
//    9. (v1.2, PROMPT 4, 30/09/2026) Corre en el watchdog diario del bot
//       (chequeo.yml) contra la pagina PUBLICADA. Dos cosas que NO son falla:
//       · hoy contra hoy en 0,00 (punto 6) es un estado valido (leccion
//         WEB_PRUEBA_SIN_MOVIMIENTO del 28/09): ya estaba aceptado desde la v1.
//       · el caso de granos lee el detalle crudo de la bajada del 29/09, que
//         cf_ralear borra a los 60 dias (salvo la ultima bajada de cada semana).
//         Cuando pase, la funcion devuelve disponible:false y la pagina pinta el
//         aviso «…ya no está guardado…» sin tabla. Eso se marca como «NO SE PUDO
//         CORRER» (se lista aparte, exit 0 si no hay otra falla) y la salida
//         termina con "AVISO: GRANOS_SIN_DETALLE"; el watchdog no abre incidente.
//       Si algo si falla, exit 1 con "FALLA:" y el watchdog abre WEB_CAIDA (ROJO)
//       con la salida completa.
//
//   10. (v1.2.1, 02/10/2026) La lista «Comprobantes que más movieron» aparece SIN tocar nada
//       (caso 15/09 · hoy · 30/11): en la v1.1 la página no la pedía al llegar el par y
//       quedaba en «Buscando los comprobantes…» hasta que la persona tocaba algo.
//   11. (v1.3, 02/10/2026, propuesta #6 «Qué cambió: subtítulo Por motivo») Con hoy=2026-10-02:
//       · 01/10 -> 02/10: Saldo total −1.692,40 = «Por motivo» suma −1.692,40; grupos Nuevo o eliminado −1.809,50 ·
//         Cambió el importe +105,26 · Se pagó o se cobró +7,41 · Conciliación +4,44 · Se corrió de fecha 0,00 · Pase
//         0,00 · Anticipo 0,00 (y ningún otro); «A REVISAR» con Zeni 948,00 y Cargill OC-150 (−1.579,40 / −1.841,70) y
//         el borrador para Giorgi (mailto:, nunca manda); la fila «De un día para el otro» con 10 botones y el del
//         02/10 apretado; la lista: 263 comprobantes, 20 visibles, «Ver 10 más · quedan 243» → 30 → «Ver menos»;
//         etiquetas de motivo en los renglones; «Ver 10 más» en un grupo (pide &motivo=X al pasar de 15); «Ver estos
//         en la lista ↓» filtra la lista (chip «Solo: … ✕»); el clic en rubro 05 y 05A filtra SOLO «Por motivo».
//       · par no seguido (30/09 -> 02/10): la línea «de un día para el otro»; la lista sigue.
//       · hoy contra hoy: «misma carga» + botones; tocar uno salta y deja el aviso «Arriba quedó…» con «Volver».
//       · 30/09 -> 01/10: Préstamos y cauciones +1.425,50 (sin «Ver estos en la lista»); 24/09 -> 25/09: Lectura
//         del cambio de horizonte y Entró al horizonte +172,89; 28/09 -> 29/09: conciliacion_grande y caida_filas;
//         26/09 -> 27/09: «Sin cambios».
//       · respuestas simuladas: existe=false -> «No hay foto»; cierra=false -> «no cierra» y la lista sigue; la vista
//         falla (500) -> la lista sigue; variaciones_dias falla -> sin píldora, sin romper nada.
//       · Saldo proyectado: píldora «2 a revisar» -> Qué cambió en 01/10 -> 02/10 con #ancla=motivo.
//       · Estado de la web: «Ver por qué» en los 3 días con |total| ≥ 500 (30/09, 01/10, 02/10).
//       · 375 px: sin scroll horizontal con «Por motivo» pintado; ✕, «Ver más», enlaces y píldora ≥ 44 px.
//       Lo que depende del crudo (el detalle «RESCATE FIMA» de un pase de bancos) se marca «NO SE PUDO CORRER»
//       después del raleo de 60 días. Si la función publicada todavía no tiene las vistas variaciones (antes del
//       deploy de tabla v12), todo el bloque se marca «NO SE PUDO CORRER» y no abre incidente.
//       VARIACIONES_LOCAL=1: las vistas variaciones / variaciones_dias se responden desde
//       ../albor-cashflow-bot/supabase/functions/tabla/variaciones.ts contra la base (SUPABASE_URL / SUPABASE_KEY del
//       entorno o del .env del bot). Sirve para probar la página antes de desplegar la función.
//
//  Uso:
//    TABLERO_KEY=... node probar_cashflow.mjs            -> cashflow.html LOCAL
//    TABLERO_KEY=... TABLERO_URL=https://.../cashflow.html node probar_cashflow.mjs
//                                                         -> la pagina PUBLICADA
//    FOTO=1                                               -> guarda capturas (FOTO_DIR o /tmp)
//    PW_CHANNEL=chrome                                    -> usa el Chrome del sistema
//    SIMULAR_GRANOS_RALEADO=1                             -> (solo para probar a mano el camino «detalle
//                                                            raleado») responde vista=granos con disponible:false
//
//  Todas las consultas van con prueba=1 (origen=prueba en cf_uso_web).
//  La clave NUNCA vive en este repo: sale del entorno o aborta.
// ===========================================================================
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const KEY = process.env.TABLERO_KEY;
if (!KEY) {
  console.error('Falta TABLERO_KEY. Corre:  TABLERO_KEY=... node probar_cashflow.mjs');
  process.exit(1);
}

async function cargarPlaywright() {
  const candidatos = [];
  const bases = [new URL('./', import.meta.url).href, pathToFileURL(process.cwd() + '/').href];
  if (process.env.PLAYWRIGHT_DIR) bases.push(pathToFileURL(process.env.PLAYWRIGHT_DIR.replace(/\/$/, '') + '/').href);
  bases.push(new URL('../albor-cashflow-bot/', import.meta.url).href);
  for (const b of bases) for (const pkg of ['playwright-core', 'playwright']) candidatos.push(b + `node_modules/${pkg}/index.mjs`);
  for (const c of candidatos) { try { return await import(c); } catch { /* siguiente */ } }
  console.error('No encuentro Playwright. Probe:\n  ' + candidatos.join('\n  '));
  process.exit(2);
}
const { chromium } = await cargarPlaywright();

const URL_PUBLICADA = process.env.TABLERO_URL || null;
const html = URL_PUBLICADA ? null : readFileSync(new URL('./cashflow.html', import.meta.url), 'utf8');
const FOTO_DIR = process.env.FOTO_DIR || '/tmp';
const HOY = '2026-09-29';            // dia congelado de los casos del PROMPT 1
const t0 = Date.now();
const nav = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
const fallas = [];
const resumen = [];
const noCorridos = [];       // (v1.2) casos que no se pudieron correr: no son falla, se listan aparte
const falla = (t) => fallas.push(t);
const ok = (t) => resumen.push('  ok  ' + t);
const noCorrido = (t) => { noCorridos.push(t); resumen.push('  --  NO SE PUDO CORRER: ' + t); };
const SIMULAR_RALEADO = process.env.SIMULAR_GRANOS_RALEADO === '1';
// La pagina pinta este aviso (y ninguna tabla) cuando la funcion devuelve disponible:false.
const RE_GRANOS_RALEADO = /ya no está guardado/;
const granosRaleado = (pag) => pag.evaluate((re) => Array.from(document.querySelectorAll('section[aria-label="Granos"] .cf-aviso')).some((a) => new RegExp(re).test(a.textContent || '')), RE_GRANOS_RALEADO.source);

// (v1.3) Modo local de las vistas variaciones: la lógica de la función, en Node, contra la base.
const VAR_LOCAL = process.env.VARIACIONES_LOCAL === '1';
let varLocal = null;   // { armarVariaciones, armarVariacionesDias, supa, ctx }
if (VAR_LOCAL) {
  const bot = new URL('../albor-cashflow-bot/', import.meta.url);
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    try {
      for (const l of readFileSync(new URL('.env', bot), 'utf8').split('\n')) {
        const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    } catch { /* sin .env del bot */ }
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) { console.error('VARIACIONES_LOCAL=1 necesita SUPABASE_URL y SUPABASE_KEY (o el .env del bot).'); process.exit(2); }
  const mod = await import(new URL('supabase/functions/tabla/variaciones.ts', bot).href);
  const { createClient } = await import(new URL('node_modules/@supabase/supabase-js/dist/index.mjs', bot).href);
  const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, { auth: { persistSession: false } });
  const consulta = async (etiqueta, fn, veces = 3) => {
    let ultimo;
    for (let i = 0; i < veces; i++) {
      try { const r = await fn(); if (r.error) throw new Error(r.error.message); return r.data; }
      catch (e) { ultimo = e; await new Promise((res) => setTimeout(res, 250 * (i + 1))); }
    }
    throw ultimo;
  };
  varLocal = { ...mod, supa, ctx: { consulta } };
  console.log('variaciones: modo LOCAL (variaciones.ts contra la base)');
}
// ¿La función que usa la página tiene las vistas variaciones? (antes del deploy de tabla v12 responde otra cosa)
async function funcionTieneVariaciones() {
  if (VAR_LOCAL) return true;
  try {
    const r = await fetch('https://htxtrmfmrzvgukqzjjnh.supabase.co/functions/v1/tabla?vista=variaciones_dias&n=1&origen=prueba&k=' + encodeURIComponent(KEY));
    if (!r.ok) return false;
    const d = await r.json();
    return !!(d && Array.isArray(d.dias));
  } catch { return false; }
}

const TABS = ['venimos', 'hecho', 'cambio', 'granos', 'fiar'];
const NOMBRE = { venimos: 'Saldo proyectado', hecho: 'Cash Flow Hoy', cambio: 'Qué cambió', granos: 'Granos', fiar: 'Estado de la web' };

async function contexto(ancho, simular = null) {
  const ctx = await nav.newContext({ viewport: { width: ancho, height: ancho < 600 ? 812 : 900 }, deviceScaleFactor: 2 });
  if (!URL_PUBLICADA) {
    await ctx.route('https://tablero.local/**', (r) =>
      r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html }));
  }
  // (v1.3) Las vistas variaciones: simuladas (para los caminos de error) o locales (variaciones.ts contra la base).
  if (simular || VAR_LOCAL) {
    await ctx.route((u) => /^variaciones(_dias)?$/.test(u.searchParams.get('vista') || ''), async (r) => {
      const u = new URL(r.request().url());
      const vista = u.searchParams.get('vista');
      const json = (d, status = 200) => r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(d) });
      if (simular === 'dias_falla' && vista === 'variaciones_dias') return r.fulfill({ status: 500, contentType: 'text/plain; charset=utf-8', body: 'Error simulado de la vista variaciones_dias' });
      if (simular === 'falla' && vista === 'variaciones') return r.fulfill({ status: 500, contentType: 'text/plain; charset=utf-8', body: 'Error simulado de la vista variaciones' });
      if (simular === 'noexiste' && vista === 'variaciones') return json({ vista: 'variaciones', fecha: u.searchParams.get('fecha'), existe: false });
      let d;
      if (VAR_LOCAL) {
        const fn = vista === 'variaciones' ? varLocal.armarVariaciones : varLocal.armarVariacionesDias;
        try { d = await fn(varLocal.supa, u.searchParams, varLocal.ctx); }
        catch (e) { return r.fulfill({ status: e.status || 500, contentType: 'text/plain; charset=utf-8', body: e.message }); }
      } else {
        const resp = await r.fetch();
        if (!simular) return r.fulfill({ response: resp });
        try { d = await resp.json(); } catch { return r.fulfill({ response: resp }); }
      }
      if (simular === 'nocierra' && vista === 'variaciones' && d && d.existe) d = { ...d, cierra: false, suma_mm: (d.total_mm || 0) + 100, sin_explicar_mm: 100 };
      return json(d);
    });
  }
  if (SIMULAR_RALEADO) {
    // Lo que devuelve la funcion cuando cf_ralear ya borro el detalle crudo (granos.ts): mismo cuerpo, disponible:false.
    await ctx.route((u) => u.searchParams.get('vista') === 'granos', async (r) => {
      const resp = await r.fetch();
      let d; try { d = await resp.json(); } catch { return r.fulfill({ response: resp }); }
      d = { ...d, avisos: [...(d.avisos || []), 'El detalle renglón por renglón de la bajada del ' + d.foto + ' ya no está guardado (se ralea a los 60 días): no se puede leer el stock, los gastos ni la cosecha por grano de ese día. (SIMULADO por SIMULAR_GRANOS_RALEADO=1)'],
        disponible: false, meses: [], por_grano: {}, fichas: [], detalle: [], fletes16: [], no_leidos: [], totales: null };
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(d) });
    });
  }
  return ctx;
}
const base = URL_PUBLICADA ? URL_PUBLICADA.split('#')[0].split('?')[0] : 'https://tablero.local/cashflow.html';
const link = (hashParams, conClave = true) => {
  const h = new URLSearchParams({ prueba: '1', hoy: HOY, ...hashParams });
  return base + (conClave ? '?k=' + encodeURIComponent(KEY) : '') + '#' + h.toString();
};

// Abre una pagina con los errores de consola capturados.
async function abrir(ctx, url) {
  const pag = await ctx.newPage();
  const errores = [];
  pag.on('pageerror', (e) => errores.push('PAGEERROR: ' + e.message));
  // (v1.3) el 500 simulado de una vista nueva es el camino que se prueba: el aviso del navegador no es error de la página.
  pag.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.location()?.url ?? '') && !(/status of 500/.test(m.text()) && /vista=variaciones/.test(m.location()?.url ?? ''))) errores.push('CONSOLE: ' + m.text()); });
  await pag.goto(url, { waitUntil: 'domcontentloaded' });
  return { pag, errores };
}
const texto = (pag, sel) => pag.evaluate((s) => document.querySelector(s)?.textContent?.replace(/\s+/g, ' ').trim() ?? '', sel);
const celdas = (pag, sel) => pag.evaluate((s) => Array.from(document.querySelector(s)?.children ?? []).map((c) => c.textContent.replace(/\s+/g, ' ').trim()), sel);
const esperar = (pag, sel, ms = 45000) => pag.waitForSelector(sel, { timeout: ms });
const scroll = (pag) => pag.evaluate(() => document.documentElement.scrollWidth);
const foto = async (pag, nombre) => { if (process.env.FOTO) await pag.screenshot({ path: `${FOTO_DIR}/cashflow_${nombre}.png`, fullPage: true }); };

// --- 1. Las 5 pestañas a cada ancho -------------------------------------------------
async function recorrer(ancho) {
  const ctx = await contexto(ancho);
  const { pag, errores } = await abrir(ctx, link({}));
  const rot = `${ancho} px`;
  try { await esperar(pag, '#cf-partida'); } catch { falla(`${rot}: Saldo proyectado no aparecio en 45 s (${await texto(pag, '#cf-error, .cf-err')})`); }
  const clave = await pag.evaluate(() => ({
    search: location.search,
    guardada: (function () { try { return !!localStorage.getItem('cf_clave'); } catch (e) { return false; } })(),
    olvidar: !!document.querySelector('#olvidar'),
  }));
  if (/(^\?|&)k=/.test(clave.search)) falla(`${rot}: la clave quedo en la barra de direcciones (?k=)`); else ok(`${rot}: ?k= se saco de la barra`);
  if (!clave.guardada) falla(`${rot}: la clave no quedo recordada (localStorage cf_clave)`); else ok(`${rot}: clave recordada en el aparato`);
  if (!clave.olvidar) falla(`${rot}: falta el link "olvidar la clave"`);
  for (const t of TABS) {
    await pag.click(`.cf-tabs button[data-tab="${t}"]`);
    const espera = { venimos: '#cf-det-v', hecho: '#cf-acum', cambio: '#cf-q-total', granos: '#cf-gr-tabla', fiar: '#cf-est-checks' }[t];
    if (t === 'granos') {
      // (v1.2) la tabla, o el aviso de detalle raleado (valido: no es falla, se anota como no corrido).
      try {
        await pag.waitForFunction((re) => !!document.querySelector('#cf-gr-tabla') ||
          Array.from(document.querySelectorAll('section[aria-label="Granos"] .cf-aviso')).some((a) => new RegExp(re).test(a.textContent || '')), RE_GRANOS_RALEADO.source, { timeout: 45000 });
        if (!(await pag.$('#cf-gr-tabla'))) noCorrido(`${rot} · Granos: la bajada de hoy ya no tiene el detalle crudo (raleado); la pestaña pinta el aviso y ninguna tabla`);
      } catch { falla(`${rot} · ${NOMBRE[t]}: no aparecio ${espera} ni el aviso de detalle raleado en 45 s (${await texto(pag, '.cf-err, #cf-error')})`); }
    } else {
      try { await esperar(pag, espera); } catch { falla(`${rot} · ${NOMBRE[t]}: no aparecio ${espera} en 45 s (${await texto(pag, '.cf-err, #cf-error')})`); }
    }
    await pag.waitForTimeout(300);
    const sw = await scroll(pag);
    if (sw > ancho) falla(`${rot} · ${NOMBRE[t]}: hay scroll horizontal de pagina (scrollWidth ${sw})`); else ok(`${rot} · ${NOMBRE[t]}: sin scroll horizontal (scrollWidth ${sw})`);
    if (t === 'cambio' && ancho < 600) {
      const m = await pag.evaluate(() => {
        const cab = document.querySelector('#cf-q-tabla .cf-head');
        const tipo = cab?.children[1];
        const fila = document.querySelector('#cf-q-tabla .cf-fila-rubro');
        const r = fila?.children[2]?.getBoundingClientRect();
        return { tipoVisible: !!tipo && getComputedStyle(tipo).display !== 'none', cifraDerecha: r ? Math.round(r.right) : null, cifraTxt: fila?.children[2]?.textContent?.trim() ?? '' };
      });
      if (m.tipoVisible) falla(`${rot}: la columna Tipo se ve en celular`); else ok(`${rot}: la columna Tipo esta escondida`);
      if (m.cifraDerecha === null || m.cifraDerecha > ancho) falla(`${rot}: la primera cifra del cuadro por rubro no entra en la pantalla (derecha ${m.cifraDerecha})`);
      else ok(`${rot}: la primera cifra del cuadro (${m.cifraTxt}) termina en ${m.cifraDerecha} px, dentro de ${ancho}`);
    }
    await foto(pag, `${ancho}_${t}`);
  }
  if (errores.length) falla(`${rot}: la pagina tiro errores (${errores.slice(0, 3).join(' | ').slice(0, 300)})`); else ok(`${rot}: 0 errores de consola en las 5 pestañas`);
  await pag.close();
  await ctx.close();
}

// --- 3, 4 y 6. Que cambio con los casos congelados ---------------------------------
async function casoCambio(ctx, desde, hasta, esperado) {
  const rot = `Qué cambió ${desde.slice(5)} · ${hasta ? hasta.slice(5) : 'hoy'} · 30/11`;
  const params = { tab: 'cambio', desde, mira: '2026-11-30' };
  if (hasta) params.hasta = hasta;
  const { pag, errores } = await abrir(ctx, link(params));
  try { await esperar(pag, '#cf-q-total'); } catch { falla(`${rot}: el cuadro no aparecio (${await texto(pag, '.cf-err, #cf-error')})`); await pag.close(); return null; }
  const a = await texto(pag, '#cf-res-Q-a .cf-num'), b = await texto(pag, '#cf-res-Q-b .cf-num'), dif = await texto(pag, '#cf-res-Q-dif .cf-num');
  const tot = await celdas(pag, '#cf-q-total');
  resumen.push(`--- ${rot} ---`);
  resumen.push(`tarjetas   : ${a} · ${b} · ${dif}`);
  resumen.push(`Saldo total: ${tot.join(' | ')}`);
  const chk = (nombre, real, esp) => { if (real !== esp) falla(`${rot}: ${nombre} da "${real}" y se esperaba "${esp}"`); else ok(`${rot}: ${nombre} = ${esp}`); };
  chk('tarjeta parado el', a, esperado.a); chk('tarjeta contra', b, esperado.b); chk('tarjeta cambió', dif, esperado.dif);
  chk('fila Saldo total · A', tot[2], esperado.a); chk('fila Saldo total · B', tot[3], esperado.b); chk('fila Saldo total · diferencia', tot[4], esperado.dif);
  if (errores.length) falla(`${rot}: errores de pagina (${errores[0].slice(0, 200)})`);
  await foto(pag, `caso_${desde.slice(5)}_${hasta ? hasta.slice(5) : 'hoy'}`);
  return pag;
}

async function casos() {
  const ctx = await contexto(1280);
  // Caso 2: 15/09 · hoy · 30/11
  const pag = await casoCambio(ctx, '2026-09-15', null, { a: '−1.315,29', b: '−1.018,78', dif: '▲ +296,52' });
  if (pag) {
    // 10. (v1.2.1) La lista de comprobantes aparece sin tocar nada (la v1.1 no la pedía al llegar el par).
    {
      const rot = 'Qué cambió 09-15 · hoy · 30/11 · lista sin tocar nada';
      try {
        await pag.waitForFunction(() => document.querySelectorAll('#cf-comps .cf-row:not(.cf-head)').length > 0, null, { timeout: 45000 });
        const n = await pag.evaluate(() => document.querySelectorAll('#cf-comps .cf-row:not(.cf-head)').length);
        ok(`${rot}: la lista apareció sola (${n} renglones)`);
      } catch {
        falla(`${rot}: la lista de comprobantes no apareció en 45 s sin tocar nada (dice "${(await texto(pag, '#cf-comps')).slice(0, 160)}")`);
      }
    }
    // 4. La ultima columna cambia al mover «Mirando al» (30/11 -> 31/10).
    const antes = (await celdas(pag, '#cf-q-total'))[6];
    const filaAntes = (await celdas(pag, '#cf-q-tabla .cf-fila-rubro'))[6];
    await pag.fill('#cf-mira', '2026-10-31');
    try {
      await pag.waitForFunction((a) => { const c = document.querySelector('#cf-q-total')?.children; return !!c && c[6].textContent.trim() !== a && !document.querySelector('#cf-sel-Q .cf-cargando'); }, antes, { timeout: 45000 });
    } catch { /* se evalua abajo */ }
    const despues = (await celdas(pag, '#cf-q-total'))[6];
    const filaDespues = (await celdas(pag, '#cf-q-tabla .cf-fila-rubro'))[6];
    const tit = await texto(pag, '#cf-q-tabla h3');
    resumen.push(`ultima columna al mover Mirando al: total ${antes} -> ${despues} · primer rubro ${filaAntes} -> ${filaDespues} · titulo "${tit}"`);
    if (!/31\/10/.test(tit)) falla(`Qué cambió: el titulo del cuadro no cambio a 31/10 ("${tit}")`);
    if (antes === despues) falla(`Qué cambió: la ultima columna del cuadro (Saldo total) no cambio al mover Mirando al (${antes})`);
    else ok(`Qué cambió: la ultima columna cambia con Mirando al (${antes} -> ${despues})`);
    if (antes === '0,00' && despues === '0,00') falla('Qué cambió: la ultima columna da siempre 0,00 (el error de la v22)');
    await pag.close();
  }
  // Caso 7: 15/09 · 22/09 · 30/11
  const pag7 = await casoCambio(ctx, '2026-09-15', '2026-09-22', { a: '−1.315,29', b: '−348,29', dif: '▲ +967,00' });
  if (pag7) await pag7.close();

  // 6. Abrir «Qué cambió» sin tocar nada: hoy contra hoy, todo 0,00, sin error.
  {
    const { pag: p, errores } = await abrir(ctx, link({ tab: 'cambio' }));
    const rot = 'Qué cambió sin tocar nada (hoy contra hoy)';
    try { await esperar(p, '#cf-q-total'); } catch { falla(`${rot}: el cuadro no aparecio (${await texto(p, '.cf-err, #cf-error')})`); }
    const r = await p.evaluate(() => ({
      desde: document.querySelector('#cf-desde')?.value, mira: document.querySelector('#cf-mira')?.value,
      dif: document.querySelector('#cf-res-Q-dif .cf-num')?.textContent.trim(),
      tot: Array.from(document.querySelector('#cf-q-total')?.children ?? []).map((c) => c.textContent.trim()),
      difRubros: Array.from(document.querySelectorAll('#cf-q-tabla .cf-fila-rubro')).map((f) => f.children[4].textContent.trim()),
      err: document.querySelector('.cf-err, #cf-error')?.textContent.trim() ?? '',
      igual: /misma carga/.test(document.querySelector('#cf-comps')?.textContent ?? ''),
      top: document.querySelector('.cf-top')?.textContent ?? '',
    }));
    resumen.push(`--- ${rot} ---`);
    resumen.push(`parado ${r.desde} · mirando ${r.mira} · cambió ${r.dif} · Saldo total ${r.tot.join(' | ')}`);
    if (r.desde !== HOY) falla(`${rot}: Parado el abrio en ${r.desde} y no en hoy (${HOY})`);
    if (r.dif !== '0,00') falla(`${rot}: la tarjeta Cambió da "${r.dif}" y no 0,00`); else ok(`${rot}: Cambió = 0,00`);
    if (r.tot[4] !== '0,00') falla(`${rot}: Saldo total · diferencia da "${r.tot[4]}" y no 0,00`);
    if (r.difRubros.some((d) => d !== '0,00')) falla(`${rot}: hay rubros con diferencia distinta de 0,00 (${r.difRubros.join(' ')})`); else ok(`${rot}: los ${r.difRubros.length} rubros en 0,00`);
    if (r.err) falla(`${rot}: la pagina muestra un error ("${r.err.slice(0, 160)}")`); else ok(`${rot}: sin error`);
    if (!r.igual) falla(`${rot}: falta el cartel "Estás parado en la misma carga que la que comparás"`);
    if (!/Es la misma carga: no hay cambios/.test(r.top)) falla(`${rot}: los top 3 no dicen "Es la misma carga: no hay cambios."`);
    if (errores.length) falla(`${rot}: errores de pagina (${errores[0].slice(0, 200)})`);
    await foto(p, 'hoy_contra_hoy');
    await p.close();
  }

  // 5. Saldo proyectado: «Fecha elegida» cambia al mover «Mirando al».
  {
    const { pag: p, errores } = await abrir(ctx, link({}));
    const rot = 'Saldo proyectado · Fecha elegida';
    try { await esperar(p, '#cf-det-v'); } catch { falla(`${rot}: no aparecio (${await texto(p, '.cf-err, #cf-error')})`); }
    const antes = await texto(p, '#cf-det'), vAntes = await texto(p, '#cf-det-v'), franjaAntes = await texto(p, '#cf-vslunes');
    await p.fill('#cf-pmira', '2026-10-31');
    try { await p.waitForFunction((a) => document.querySelector('#cf-det')?.textContent.replace(/\s+/g, ' ').trim() !== a && !document.querySelector('#cf-det .cf-cargando'), antes, { timeout: 45000 }); } catch { /* abajo */ }
    const despues = await texto(p, '#cf-det'), vDespues = await texto(p, '#cf-det-v'), franjaDespues = await texto(p, '#cf-vslunes');
    resumen.push(`--- ${rot} ---`);
    resumen.push(`antes  : ${antes.slice(0, 160)}`);
    resumen.push(`despues: ${despues.slice(0, 160)}`);
    resumen.push(`franja : ${franjaDespues}`);
    if (antes === despues) falla(`${rot}: el bloque no cambio al mover Mirando al`); else ok(`${rot}: el bloque cambia con Mirando al (${vAntes} -> ${vDespues})`);
    if (!/31\/10\/2026/.test(despues)) falla(`${rot}: el bloque no muestra la fecha 31/10/2026`);
    if (!/31\/10\/2026/.test(franjaDespues)) falla(`${rot}: la franja "contra" no se recalculo al 31/10/2026 ("${franjaDespues}")`);
    if (franjaAntes === franjaDespues) falla(`${rot}: la franja "contra" quedo igual`);
    // Con hoy congelado, parado hoy mirando al 31/10: −594,16 (fin de octubre de la bajada del 29/09).
    if (vDespues !== '−594,16 MM') falla(`${rot}: mirando al 31/10 da "${vDespues}" y se esperaba "−594,16 MM"`); else ok(`${rot}: mirando al 31/10 = −594,16 MM`);
    if (errores.length) falla(`${rot}: errores de pagina (${errores[0].slice(0, 200)})`);
    await foto(p, 'fecha_elegida_31-10');
    await p.close();
  }
  await ctx.close();
}

// --- 7 y 8. Granos y Estado de la web (v1.1) ---------------------------------------
async function granosYEstado() {
  const ctx = await contexto(1280);
  {
    const rot = 'Granos (hoy=2026-09-29)';
    const { pag, errores } = await abrir(ctx, link({ tab: 'granos' }));
    let sinDetalle = false;
    try {
      await pag.waitForFunction((re) => !!document.querySelector('#cf-gr-tabla') ||
        Array.from(document.querySelectorAll('section[aria-label="Granos"] .cf-aviso')).some((a) => new RegExp(re).test(a.textContent || '')), RE_GRANOS_RALEADO.source, { timeout: 45000 });
      sinDetalle = !(await pag.$('#cf-gr-tabla')) && await granosRaleado(pag);
    } catch { falla(`${rot}: la tabla no aparecio (${await texto(pag, '.cf-err, #cf-error')})`); }
    if (sinDetalle) {
      // (v1.2) cf_ralear ya borro el detalle crudo de esa bajada: el caso congelado no se puede correr.
      // No es la web rota (la pagina aviso bien y sin tabla): se anota y se sigue, sin incidente.
      const aviso = await pag.evaluate(() => Array.from(document.querySelectorAll('section[aria-label="Granos"] .cf-aviso')).map((a) => a.textContent.trim()).join(' | '));
      resumen.push(`--- ${rot} ---`);
      resumen.push(`la pagina dice: ${aviso.slice(0, 240)}`);
      noCorrido(`${rot}: el detalle crudo de esa bajada ya no está guardado (raleado): el caso congelado de granos no se puede correr. Si se quiere un caso que dure, la base tendría que guardar stock/gastos/cosecha por grano por foto (plan para Peio, no se toca la base)`);
      if (errores.length) falla(`${rot}: errores de pagina (${errores[0].slice(0, 200)})`);
      await foto(pag, 'granos_sin_detalle');
      await pag.close();
    } else {
    const leer = () => pag.evaluate(() => {
      const filas = Array.from(document.querySelectorAll('#cf-gr-tabla .cf-row:not(.cf-head)')).map((f) => Array.from(f.children).map((c) => c.textContent.trim()));
      const fila = (n) => filas.find((f) => f[0].startsWith(n)) ?? [];
      return {
        titulo: document.querySelector('#cf-gr-tabla h3')?.textContent.trim(),
        stockTit: document.querySelector('#cf-gr-stock h3')?.textContent.trim(),
        totStock: fila('Stock').slice(-1)[0], totGcom: fila('Gastos').slice(-1)[0], totCos: fila('Cosecha').slice(-1)[0], totNeto: fila('Neto').slice(-1)[0],
        fichas: document.querySelectorAll('#cf-gr-fichas .cf-row:not(.cf-head)').length,
        noCuadra: document.querySelectorAll('#cf-gr-fichas .cf-gr-nocuadra').length,
        notas: Array.from(document.querySelectorAll('#cf-gr-tabla .cf-gr-nota')).map((n) => n.textContent),
        det: document.querySelectorAll('#cf-gr-det .cf-row:not(.cf-head)').length,
        chips: document.querySelectorAll('#cf-gr-chips button').length,
        meses: document.querySelectorAll('#cf-gr-tabla .cf-head > div').length - 2,
      };
    });
    const g = await leer();
    resumen.push(`--- ${rot} ---`);
    resumen.push(`${g.titulo} · meses ${g.meses} · stock ${g.totStock} · gastos ${g.totGcom} · cosecha ${g.totCos} · neto ${g.totNeto} · ${g.fichas} renglones de stock (${g.noCuadra} no cuadran) · ${g.det} renglones de detalle`);
    const chk = (nombre, real, esp) => { if (real !== esp) falla(`${rot}: ${nombre} da "${real}" y se esperaba "${esp}"`); else ok(`${rot}: ${nombre} = ${esp}`); };
    chk('titulo', g.titulo, 'Todos los granos · por mes'); chk('meses', g.meses, 10); chk('chips', g.chips, 9);
    chk('Stock a vender (total)', g.totStock, '20.231,58'); chk('titulo del stock', g.stockTit, 'Stock a vender · 20.231,58 MM');
    chk('Gastos comerciales (total)', g.totGcom, '−8.885,64'); chk('Cosecha (total)', g.totCos, '−4.078,48'); chk('Neto (total)', g.totNeto, '7.267,45');
    chk('renglones de stock', g.fichas, 12); chk('renglones que no cuadran', g.noCuadra, 2); chk('renglones de gastos y cosecha', g.det, 29);
    if (!g.notas.some((n) => /−311,44 MM de fletes/.test(n))) falla(`${rot}: falta la nota de los fletes del 16 (−311,44)`); else ok(`${rot}: nota de fletes −311,44`);
    if (!g.notas.some((n) => /−272,57 MM no dicen el grano/.test(n))) falla(`${rot}: falta la nota de fletes sin grano (−272,57)`); else ok(`${rot}: nota de fletes sin grano −272,57`);
    // El chip «Soja» filtra todo.
    await pag.click('#cf-gr-chips button[data-grano="Soja"]');
    await pag.waitForFunction(() => /^Soja/.test(document.querySelector('#cf-gr-tabla h3')?.textContent ?? ''), null, { timeout: 10000 }).catch(() => {});
    const sj = await leer();
    resumen.push(`Soja: ${sj.titulo} · stock ${sj.totStock} · gastos ${sj.totGcom} · cosecha ${sj.totCos} · ${sj.fichas} renglones de stock · ${sj.det} de detalle`);
    chk('Soja: titulo', sj.titulo, 'Soja · por mes'); chk('Soja: stock', sj.totStock, '8.363,74'); chk('Soja: gastos', sj.totGcom, '−4.774,85'); chk('Soja: cosecha', sj.totCos, '−2.494,75');
    chk('Soja: renglones de stock', sj.fichas, 2);
    if (!/grano=Soja/.test(await pag.evaluate(() => location.hash))) falla(`${rot}: el grano elegido no quedo en el link (#grano=Soja)`);
    const sw = await scroll(pag);
    if (sw > 1280) falla(`${rot}: scroll horizontal de pagina (${sw})`);
    if (errores.length) falla(`${rot}: errores de pagina (${errores[0].slice(0, 200)})`);
    await foto(pag, 'granos');
    await pag.close();
    }
  }
  for (const [dia, esp] of [['2026-09-29', { bancos: '+21,80', dias: '58 días', hora: '08:35' }], ['2026-09-30', { bancos: '+36,75', dias: '59 días', hora: '08:39' }]]) {
    const rot = `Estado de la web (hoy=${dia})`;
    const { pag, errores } = await abrir(ctx, link({ tab: 'fiar', hoy: dia }));
    try { await esperar(pag, '#cf-est-checks'); } catch { falla(`${rot}: los controles no aparecieron (${await texto(pag, '.cf-err, #cf-error')})`); }
    const e = await pag.evaluate(() => ({
      c1: document.querySelector('#cf-est-contraste')?.textContent.replace(/\s+/g, ' ').trim(), c1dot: document.querySelector('#cf-est-contraste .cf-dot')?.className,
      c2: document.querySelector('#cf-est-integridad')?.textContent.replace(/\s+/g, ' ').trim(), c2dot: document.querySelector('#cf-est-integridad .cf-dot')?.className,
      c3: document.querySelector('#cf-est-incidentes')?.textContent.replace(/\s+/g, ' ').trim(),
      bit: Array.from(document.querySelectorAll('#cf-est-bitacora .cf-bit > div')).map((d) => d.textContent.replace(/\s+/g, ' ').trim()),
      sello: document.querySelector('#cf-sello')?.textContent.trim(),
    }));
    resumen.push(`--- ${rot} ---`);
    resumen.push(`1) ${e.c1.slice(0, 220)}`); resumen.push(`2) ${e.c2.slice(0, 160)}`); resumen.push(`3) ${e.c3.slice(0, 160)}`); resumen.push(`bitacora: ${e.bit.join(' | ')}`);
    const has = (nombre, txt, re) => { if (!re.test(txt)) falla(`${rot}: ${nombre} no dice ${re} ("${txt.slice(0, 160)}")`); else ok(`${rot}: ${nombre} ${re}`); };
    has('control 1', e.c1, /^Coincide con administración/); has('control 1', e.c1, new RegExp(dia.slice(8) + '/' + dia.slice(5, 7) + ', ' + esp.hora));
    has('control 1', e.c1, /diferencia 0,07 MM sin contar bancos, ninguna celda a revisar/); has('control 1', e.c1, new RegExp('Bancos da ' + esp.bancos.replace('+', '\\+')));
    if (!/cf-dot ok/.test(e.c1dot)) falla(`${rot}: el punto del control 1 no es verde (${e.c1dot})`);
    has('control 2', e.c2, /^Los datos guardados están bien/); has('control 2', e.c2, new RegExp('Desde el 14/07 se guardaron los datos de ' + esp.dias + '; ninguno se modificó después. La de hoy se controló a las 07:30'));
    if (!/cf-dot ok/.test(e.c2dot)) falla(`${rot}: el punto del control 2 no es verde (${e.c2dot})`);
    if (e.bit.length !== 10) falla(`${rot}: la bitacora tiene ${e.bit.length} dias y no 10`); else ok(`${rot}: bitacora de 10 dias habiles`);
    if (!/22\/09\s*Revisar/.test(e.bit.join(' | '))) falla(`${rot}: la bitacora no marca el 22/09 como Revisar`);
    if (!/^Verificado/.test(e.sello ?? '')) falla(`${rot}: el sello de arriba no dice Verificado ("${e.sello}")`);
    if (errores.length) falla(`${rot}: errores de pagina (${errores[0].slice(0, 200)})`);
    await foto(pag, `estado_${dia}`);
    await pag.close();
  }
  await ctx.close();
}

// --- 10. Por motivo (v1.3) ---------------------------------------------------------
const HOY2 = '2026-10-02';
const grupos = (pag) => pag.evaluate(() => Array.from(document.querySelectorAll('#cf-motivo-grupos details')).map((d) => ({
  motivo: d.getAttribute('data-motivo'), neto: d.querySelector('.cf-sv')?.textContent.trim(), open: d.open,
  items: d.querySelectorAll('.cf-it').length, mas: d.querySelector('.cf-mas[data-d="1"]')?.textContent.trim() ?? null,
  menos: !!d.querySelector('.cf-mas[data-d="-1"]'), lnk: !!d.querySelector('.cf-lnk[data-mot]'), tag: d.querySelectorAll('.cf-tagg').length,
  det: Array.from(d.querySelectorAll('.cf-detb')).map((x) => x.textContent).join(' | '),
})));
const filasLista = (pag) => pag.evaluate(() => Array.from(document.querySelectorAll('#cf-lista-tabla .cf-row:not(.cf-head)')).map((f) => ({
  txt: f.children[0].textContent.replace(/\s+/g, ' ').trim().slice(0, 60), tags: Array.from(f.querySelectorAll('.cf-gtag')).map((t) => t.textContent.trim()), efecto: f.children[3].textContent.trim(),
})));
const masLista = (pag) => pag.evaluate(() => ({ mas: document.querySelector('#cf-lista .cf-mas[data-d="1"]')?.textContent.trim() ?? null, menos: !!document.querySelector('#cf-lista .cf-mas[data-d="-1"]') }));
const alto = (pag, sel) => pag.evaluate((s) => Array.from(document.querySelectorAll(s)).map((e) => Math.round(e.getBoundingClientRect().height)), sel);
const esperarGrupos = async (pag, rot) => { try { await esperar(pag, '#cf-motivo-grupos'); return true; } catch { falla(`${rot}: «Por motivo» no se pintó en 45 s (${await texto(pag, '#cf-motivo-txt, .cf-err, #cf-error')})`); return false; } };
const esperarTxt = async (pag, rot, re) => { try { await pag.waitForFunction((r) => new RegExp(r).test(document.querySelector('#cf-motivo-txt')?.textContent ?? ''), re.source, { timeout: 45000 }); return true; } catch { falla(`${rot}: «Por motivo» no dijo ${re} (dice "${(await texto(pag, '#cf-motivo')).slice(0, 200)}")`); return false; } };
const chk2 = (rot) => (nombre, real, esp) => { if (real !== esp) falla(`${rot}: ${nombre} da "${real}" y se esperaba "${esp}"`); else ok(`${rot}: ${nombre} = ${esp}`); };

async function porMotivo() {
  if (!(await funcionTieneVariaciones())) {
    noCorrido('Por motivo (v1.3): la función publicada todavía no tiene las vistas variaciones / variaciones_dias (tabla v12 sin desplegar): no se prueba nada de «Por motivo». Para probarlo antes del deploy: VARIACIONES_LOCAL=1');
    return;
  }
  const ctx = await contexto(1280);
  // A. 01/10 -> 02/10
  {
    const rot = 'Por motivo 01/10 → 02/10';
    const chk = chk2(rot);
    const { pag, errores } = await abrir(ctx, link({ tab: 'cambio', hoy: HOY2, desde: '2026-10-01', mira: '2027-06-30' }));   // la lista mira al 30/06/27 (263 comprobantes)
    if (await esperarGrupos(pag, rot)) {
      const tot = await celdas(pag, '#cf-q-total');
      chk('fila Saldo total · diferencia', tot[4], '▼ −1.692,40');
      chk('Por motivo · suma', await texto(pag, '#cf-motivo-suma'), 'suma ▼ −1.692,40 MM');
      const g = await grupos(pag);
      resumen.push(`--- ${rot} ---`);
      resumen.push('grupos: ' + g.map((x) => `${x.motivo} ${x.neto}${x.open ? ' (abierto)' : ''}`).join(' · '));
      const neto = (m) => g.find((x) => x.motivo === m)?.neto ?? '(no está)';
      chk('Nuevo o eliminado', neto('real'), '▼ −1.809,50'); chk('Cambió el importe', neto('ajuste'), '▲ +105,26'); chk('Se pagó o se cobró', neto('ejecutado'), '▲ +7,41');
      chk('Conciliación de bancos', neto('conciliacion'), '▲ +4,44'); chk('Se corrió de fecha', neto('fecha'), '0,00'); chk('Pase entre cuentas propias', neto('interno'), '0,00'); chk('Anticipo pagado o cobrado', neto('anticipo'), '0,00');
      chk('solo esos 7 grupos', g.length, 7);
      chk('orden de pantalla', g.map((x) => x.motivo).join(','), 'real,ajuste,fecha,anticipo,ejecutado,conciliacion,interno');
      chk('«Nuevo o eliminado» abre solo', g.find((x) => x.motivo === 'real')?.open, true);
      chk('«Anticipo» abre solo (tiene algo a revisar)', g.find((x) => x.motivo === 'anticipo')?.open, true);
      chk('«Se pagó o se cobró» cerrado', g.find((x) => x.motivo === 'ejecutado')?.open, false);
      chk('etiqueta PASÓ AL ÚLTIMO MES en Anticipo', g.find((x) => x.motivo === 'anticipo')?.tag, 1);
      chk('Nuevo o eliminado: 5 visibles', g.find((x) => x.motivo === 'real')?.items, 5);
      chk('Conciliación (bancos) sin «Ver estos en la lista»', g.find((x) => x.motivo === 'conciliacion')?.lnk, false);
      chk('Nuevo o eliminado con «Ver estos en la lista»', g.find((x) => x.motivo === 'real')?.lnk, true);
      const rev = await texto(pag, '#cf-arevisar');
      resumen.push('A REVISAR: ' + rev.slice(0, 300));
      for (const re of [/ZENI/, /948,00 MM/, /30\/06/, /OC-150/, /−1\.579,40/, /−1\.841,70/]) { if (!re.test(rev)) falla(`${rot}: A REVISAR no dice ${re}`); else ok(`${rot}: A REVISAR dice ${re}`); }
      const href = await pag.evaluate(() => document.querySelector('#cf-giorgi')?.getAttribute('href') ?? '');
      chk('«Armar consulta para Giorgi» es un borrador (mailto:)', href.startsWith('mailto:?subject='), true);
      if (!/ZENI/.test(decodeURIComponent(href))) falla(`${rot}: el borrador para Giorgi no lleva el texto de Zeni`);
      chk('no hay «Lectura» en este día', await pag.evaluate(() => document.querySelectorAll('#cf-motivo .cf-lect').length), 0);
      const bar = await pag.evaluate(() => document.querySelectorAll('#cf-motivo-bar span').length);
      chk('barra con 7 tramos', bar, 7);
      // De un día para el otro
      const chips = await pag.evaluate(() => Array.from(document.querySelectorAll('#cf-dias .cf-dchip')).map((b) => b.textContent.replace(/\s+/g, ' ').trim() + (b.getAttribute('aria-pressed') === 'true' ? ' *' : '')));
      resumen.push('De un día para el otro: ' + chips.join(' | '));
      chk('10 botones', chips.length, 10);
      chk('el del 02/10 apretado', chips[9], '01/10 → 02/10▼ −1.692,40 *');   // (textContent: fecha y cifra sin espacio entre medio)
      chk('sin aviso «Arriba quedó» (no se usó el atajo)', await pag.evaluate(() => !!document.querySelector('#cf-salto')), false);
      // la lista
      const txt = await texto(pag, '#cf-lista-txt');
      resumen.push('lista: ' + txt.slice(0, 220));
      if (!/cambiaron 263 comprobantes/.test(txt)) falla(`${rot}: la lista no dice "cambiaron 263 comprobantes" ("${txt.slice(0, 160)}")`); else ok(`${rot}: 263 comprobantes`);
      if (!/Estos son los 20 que más pesan:/.test(txt)) falla(`${rot}: la lista no dice "Estos son los 20 que más pesan:"`); else ok(`${rot}: "Estos son los 20 que más pesan:"`);
      let L = await filasLista(pag);
      chk('20 renglones visibles', L.length, 20);
      chk('el primero es la OC de Cargill', /OC - 150/.test(L[0]?.txt), true);
      chk('el primero lleva la etiqueta «Nuevo o eliminado»', L[0]?.tags.join(','), 'Nuevo o eliminado');
      chk('renglones con etiqueta de motivo (de 20)', L.filter((f) => f.tags.length).length >= 15, true);
      resumen.push('etiquetas: ' + L.map((f) => f.tags.join('+') || '—').join(' · '));
      let mb = await masLista(pag);
      chk('botón «Ver 10 más · quedan 243»', mb.mas, 'Ver 10 más · quedan 243'); chk('sin «Ver menos» al principio', mb.menos, false);
      await pag.click('#cf-lista .cf-mas[data-d="1"]');
      await pag.waitForFunction(() => document.querySelectorAll('#cf-lista-tabla .cf-row:not(.cf-head)').length === 30, null, { timeout: 10000 }).catch(() => {});
      L = await filasLista(pag); mb = await masLista(pag);
      chk('después de «Ver 10 más»: 30 renglones', L.length, 30); chk('«quedan 233»', mb.mas, 'Ver 10 más · quedan 233'); chk('ahora sí «Ver menos»', mb.menos, true);
      if (!/Estos son los 30 que más pesan:/.test(await texto(pag, '#cf-lista-txt'))) falla(`${rot}: el texto no pasó a "los 30 que más pesan"`);
      await pag.click('#cf-lista .cf-mas[data-d="-1"]');
      await pag.waitForFunction(() => document.querySelectorAll('#cf-lista-tabla .cf-row:not(.cf-head)').length === 20, null, { timeout: 10000 }).catch(() => {});
      chk('después de «Ver menos»: 20 (nunca menos de 20)', (await filasLista(pag)).length, 20);
      // «Ver 10 más» en un grupo: 5 → 15 (lo que vino) → 25 (pide &motivo=real)
      await pag.click('#cf-motivo-grupos details[data-motivo="real"] .cf-mas[data-d="1"]');
      await pag.waitForFunction(() => document.querySelectorAll('#cf-motivo-grupos details[data-motivo="real"] .cf-it').length === 15, null, { timeout: 10000 }).catch(() => {});
      chk('Nuevo o eliminado: «Ver 10 más» → 15', (await grupos(pag)).find((x) => x.motivo === 'real')?.items, 15);
      await pag.click('#cf-motivo-grupos details[data-motivo="real"] .cf-mas[data-d="1"]');
      await pag.waitForFunction(() => document.querySelectorAll('#cf-motivo-grupos details[data-motivo="real"] .cf-it').length === 25, null, { timeout: 45000 }).catch(() => {});
      const gr = (await grupos(pag)).find((x) => x.motivo === 'real');
      chk('Nuevo o eliminado: otro «Ver 10 más» → 25 (pide el motivo entero)', gr?.items, 25);
      chk('y sigue habiendo «quedan»', /quedan \d+/.test(gr?.mas ?? ''), true);
      resumen.push(`Nuevo o eliminado tras 2 «Ver más»: ${gr?.items} visibles · ${gr?.mas}`);
      // detalle crudo de bancos (pase RESCATE FIMA): depende del raleo
      await pag.click('#cf-motivo-grupos details[data-motivo="interno"] summary');
      const det = (await grupos(pag)).find((x) => x.motivo === 'interno')?.det ?? '';
      if (/FIMA/.test(det)) ok(`${rot}: el pase muestra el detalle de bancos (RESCATE FIMA)`);
      else noCorrido(`${rot}: el detalle de bancos del pase (RESCATE FIMA) no está: el crudo de esa bajada ya se raleó (60 días)`);
      // «Ver estos en la lista ↓» desde Nuevo o eliminado
      await pag.click('#cf-motivo-grupos details[data-motivo="real"] .cf-lnk[data-mot="real"]');
      await pag.waitForFunction(() => !!document.querySelector('#cf-lista-filtro') && !document.querySelector('#cf-lista .cf-cargando'), null, { timeout: 45000 }).catch(() => {});
      const fl = await texto(pag, '#cf-lista-filtro');
      chk('chip de la lista', /^Solo: Nuevo o eliminado/.test(fl), true);
      L = await filasLista(pag);
      resumen.push(`lista filtrada por Nuevo o eliminado: ${L.length} renglones`);
      chk('la lista filtrada tiene renglones', L.length > 20, true);
      chk('todos llevan la etiqueta', L.every((f) => f.tags.includes('Nuevo o eliminado')), true);
      if (!/Filtrados por motivo:/.test(await texto(pag, '#cf-lista-txt'))) falla(`${rot}: el texto no dice "Filtrados por motivo:"`);
      chk('el link lleva motivo=real', /motivo=real/.test(await pag.evaluate(() => location.hash)), true);
      await pag.click('#cf-lista-filtro .cf-x');
      await pag.waitForFunction(() => !document.querySelector('#cf-lista-filtro'), null, { timeout: 10000 }).catch(() => {});
      chk('✕ saca el filtro de la lista', await pag.evaluate(() => !!document.querySelector('#cf-lista-filtro')), false);
      // clic en rubro: filtra SOLO «Por motivo» (05 vs 05A)
      await pag.click('#cf-q-tabla .cf-fila-rubro[data-rubro="05"]');
      await pag.waitForFunction(() => /Mirando solo 05 ·/.test(document.querySelector('#cf-motivo-filtro')?.textContent ?? '') && !!document.querySelector('#cf-motivo-grupos'), null, { timeout: 45000 }).catch(() => {});
      const f05 = await texto(pag, '#cf-motivo-filtro'), s05 = await texto(pag, '#cf-motivo-suma');
      chk('chip «Mirando solo 05 · …»', /^Mirando solo 05 · /.test(f05), true); chk('suma del rubro 05', s05, 'suma ▲ +3,49 MM');
      chk('«A revisar» sigue visible con el filtro', await pag.evaluate(() => !!document.querySelector('#cf-arevisar')), true);
      chk('la lista NO se filtra por rubro', (await filasLista(pag)).length, 20);
      chk('Lunes a lunes sigue tomando el rubro (lo de siempre)', /· 05 ·/.test(await texto(pag, '#cf-lunes h3')), true);
      await pag.click('#cf-q-tabla .cf-fila-rubro[data-rubro="05A"]');
      await pag.waitForFunction(() => /Mirando solo 05A ·/.test(document.querySelector('#cf-motivo-filtro')?.textContent ?? '') && !!document.querySelector('#cf-motivo-grupos, #cf-motivo-txt'), null, { timeout: 45000 }).catch(() => {});
      const s05A = await texto(pag, '#cf-motivo-suma');
      resumen.push(`rubro 05: ${s05} · rubro 05A: ${s05A}`);
      chk('05A es distinto de 05', s05A !== s05 && /^suma /.test(s05A), true);
      await pag.click('#cf-motivo-filtro .cf-x');
      await pag.waitForFunction(() => !document.querySelector('#cf-motivo-filtro'), null, { timeout: 10000 }).catch(() => {});
      chk('✕ saca el filtro de rubro', await pag.evaluate(() => !!document.querySelector('#cf-motivo-filtro')), false);
    }
    if (errores.length) falla(`${rot}: errores de pagina (${errores[0].slice(0, 200)})`); else ok(`${rot}: 0 errores de consola`);
    await foto(pag, 'por_motivo_02-10');
    await pag.close();
  }
  // B. par no seguido
  {
    const rot = 'Por motivo 30/09 → 02/10 (no seguido)';
    const { pag, errores } = await abrir(ctx, link({ tab: 'cambio', hoy: HOY2, desde: '2026-09-30' }));
    if (await esperarTxt(pag, rot, /de un día para el otro/)) ok(`${rot}: la línea «de un día para el otro»`);
    try { await esperar(pag, '#cf-lista-tabla'); ok(`${rot}: la lista sigue (${(await filasLista(pag)).length} renglones)`); } catch { falla(`${rot}: la lista no apareció`); }
    chk2(rot)('sin grupos', await pag.evaluate(() => !!document.querySelector('#cf-motivo-grupos')), false);
    if (errores.length) falla(`${rot}: errores de pagina (${errores[0].slice(0, 200)})`);
    await pag.close();
  }
  // C. hoy contra hoy + atajo + volver
  {
    const rot = 'Por motivo hoy contra hoy (02/10)';
    const chk = chk2(rot);
    const { pag, errores } = await abrir(ctx, link({ tab: 'cambio', hoy: HOY2 }));
    if (await esperarTxt(pag, rot, /misma carga/)) ok(`${rot}: «misma carga»`);
    try { await pag.waitForSelector('#cf-dias .cf-dchip', { timeout: 45000 }); } catch { falla(`${rot}: no aparecieron los botones «De un día para el otro»`); }
    chk('ningún botón apretado', await pag.evaluate(() => document.querySelectorAll('#cf-dias .cf-dchip[aria-pressed="true"]').length), 0);
    await pag.click('#cf-dias .cf-dchip[data-dia="2026-10-02"]');
    if (await esperarGrupos(pag, rot + ' tras el atajo')) {
      chk('Parado el = 01/10', await pag.evaluate(() => document.querySelector('#cf-desde')?.value), '2026-10-01');
      chk('contra hoy (sin «Comparar contra otro día» activo)', await pag.evaluate(() => !!document.querySelector('#cf-hasta')), false);
      const salto = await texto(pag, '#cf-salto');
      chk('aviso «Arriba quedó…»', /^Arriba quedó: Parado el 01\/10 contra lo cargado hoy/.test(salto), true);
      chk('el link lleva desde=2026-10-01', /desde=2026-10-01/.test(await pag.evaluate(() => location.hash)), true);
      await pag.click('#cf-salto [data-volver]');
      await pag.waitForFunction(() => document.querySelector('#cf-desde')?.value === '2026-10-02' && !document.querySelector('#cf-salto'), null, { timeout: 45000 }).catch(() => {});
      chk('«Volver a hoy contra hoy»: Parado el = hoy', await pag.evaluate(() => document.querySelector('#cf-desde')?.value), HOY2);
      chk('y el aviso se fue', await pag.evaluate(() => !!document.querySelector('#cf-salto')), false);
    }
    // atajo a un día que no es hoy: activa «Comparar contra otro día»
    await pag.click('#cf-dias .cf-dchip[data-dia="2026-09-30"]');
    await pag.waitForFunction(() => document.querySelector('#cf-hasta')?.value === '2026-09-30', null, { timeout: 45000 }).catch(() => {});
    chk('atajo 29/09 → 30/09: Contra = 30/09', await pag.evaluate(() => document.querySelector('#cf-hasta')?.value), '2026-09-30');
    chk('atajo 29/09 → 30/09: Parado el = 29/09', await pag.evaluate(() => document.querySelector('#cf-desde')?.value), '2026-09-29');
    if (errores.length) falla(`${rot}: errores de pagina (${errores[0].slice(0, 200)})`);
    await pag.close();
  }
  // D, E, F, G: otras fotos
  for (const c of [
    { desde: '2026-09-30', hasta: '2026-10-01', rot: 'Por motivo 30/09 → 01/10', suma: 'suma ▲ +1.009,30 MM', netos: { financiacion: '▲ +1.425,50', interno: '▼ −350,00', ejecutado: '▼ −292,64', real: '▲ +185,91', ajuste: '▲ +64,17', vencio: '▼ −23,64' }, sinLnk: ['financiacion', 'vencio'], aRevisar: false },
    { desde: '2026-09-24', hasta: '2026-09-25', rot: 'Por motivo 24/09 → 25/09', suma: 'suma ▼ −446,84 MM', netos: { horizonte: '▲ +172,89' }, lectura: /Cambió el horizonte de 30\/04 a 30\/06/, aRevisar: false },
    { desde: '2026-09-28', hasta: '2026-09-29', rot: 'Por motivo 28/09 → 29/09', suma: 'suma ▼ −135,50 MM', netos: { conciliacion: '▼ −32,00' }, revisar: [/reacomodó movimientos de bancos/, /5\.700 filas contra 6\.117/], aRevisar: true },
  ]) {
    const chk = chk2(c.rot);
    const { pag, errores } = await abrir(ctx, link({ tab: 'cambio', hoy: HOY2, desde: c.desde, hasta: c.hasta }));
    if (await esperarGrupos(pag, c.rot)) {
      const g = await grupos(pag);
      resumen.push(`--- ${c.rot} --- ` + g.map((x) => `${x.motivo} ${x.neto}`).join(' · '));
      chk('suma', await texto(pag, '#cf-motivo-suma'), c.suma);
      for (const [m, v] of Object.entries(c.netos)) chk(m, g.find((x) => x.motivo === m)?.neto ?? '(no está)', v);
      for (const m of c.sinLnk || []) chk(`${m} sin «Ver estos en la lista» (bancos)`, g.find((x) => x.motivo === m)?.lnk, false);
      chk('A REVISAR ' + (c.aRevisar ? 'presente' : 'ausente'), await pag.evaluate(() => !!document.querySelector('#cf-arevisar')), c.aRevisar);
      if (c.lectura) { const l = await pag.evaluate(() => Array.from(document.querySelectorAll('#cf-motivo .cf-lect')).map((x) => x.textContent).join(' | ')); if (!c.lectura.test(l)) falla(`${c.rot}: la Lectura no dice ${c.lectura} ("${l.slice(0, 160)}")`); else ok(`${c.rot}: Lectura ${c.lectura}`); }
      if (c.revisar) { const rv = await texto(pag, '#cf-arevisar'); for (const re of c.revisar) { if (!re.test(rv)) falla(`${c.rot}: A REVISAR no dice ${re} ("${rv.slice(0, 200)}")`); else ok(`${c.rot}: A REVISAR dice ${re}`); } }
    }
    if (errores.length) falla(`${c.rot}: errores de pagina (${errores[0].slice(0, 200)})`);
    await pag.close();
  }
  {
    const rot = 'Por motivo 26/09 → 27/09 (sin cambios)';
    const { pag, errores } = await abrir(ctx, link({ tab: 'cambio', hoy: HOY2, desde: '2026-09-26', hasta: '2026-09-27' }));
    if (await esperarTxt(pag, rot, /Sin cambios entre esas dos cargas/)) ok(`${rot}: «Sin cambios»`);
    if (errores.length) falla(`${rot}: errores de pagina (${errores[0].slice(0, 200)})`);
    await pag.close();
  }
  // I. Saldo proyectado: píldora «2 a revisar»
  {
    const rot = 'Saldo proyectado · píldora «a revisar»';
    const chk = chk2(rot);
    const { pag, errores } = await abrir(ctx, link({ hoy: HOY2 }));
    try { await pag.waitForSelector('#cf-pill', { timeout: 45000 }); } catch { falla(`${rot}: la píldora no apareció`); }
    chk('texto', await texto(pag, '#cf-pill'), '2 a revisar');
    chk('alto ≥ 44 px', ((await alto(pag, '#cf-pill'))[0] || 0) >= 44, true);
    await pag.click('#cf-pill');
    if (await esperarGrupos(pag, rot + ' → Qué cambió')) {
      chk('abre Qué cambió', await pag.evaluate(() => document.querySelector('.cf-tabs button[aria-selected="true"]')?.getAttribute('data-tab')), 'cambio');
      chk('Parado el = 01/10', await pag.evaluate(() => document.querySelector('#cf-desde')?.value), '2026-10-01');
      const hs = await pag.evaluate(() => location.hash);
      chk('el link lleva ancla=motivo', /ancla=motivo/.test(hs), true); chk('y desde=2026-10-01', /desde=2026-10-01/.test(hs), true);
      await pag.waitForTimeout(800);
      const top = await pag.evaluate(() => Math.round(document.querySelector('#cf-motivo').getBoundingClientRect().top));
      resumen.push(`píldora: «Por motivo» quedó a ${top} px del borde de arriba`);
      chk('bajó hasta «Por motivo» (está en pantalla)', top >= -20 && top < 300, true);
    }
    if (errores.length) falla(`${rot}: errores de pagina (${errores[0].slice(0, 200)})`);
    await pag.close();
  }
  // J. Estado de la web: «Ver por qué»
  {
    const rot = 'Estado de la web · saltos grandes';
    const chk = chk2(rot);
    const { pag, errores } = await abrir(ctx, link({ tab: 'fiar', hoy: HOY2 }));
    try { await pag.waitForSelector('#cf-est-saltos button[data-dia]', { timeout: 45000 }); } catch { falla(`${rot}: no aparecieron los botones «Ver por qué»`); }
    const dias = await pag.evaluate(() => Array.from(document.querySelectorAll('#cf-est-saltos button[data-dia]')).map((b) => b.getAttribute('data-dia')));
    resumen.push(`saltos grandes: ${dias.join(', ')}`);
    chk('3 días con |total| ≥ 500', dias.join(','), '2026-09-30,2026-10-01,2026-10-02');
    await pag.click('#cf-est-saltos button[data-dia="2026-09-30"]');
    if (await esperarGrupos(pag, rot + ' → Qué cambió')) {
      chk('Parado el = 29/09', await pag.evaluate(() => document.querySelector('#cf-desde')?.value), '2026-09-29');
      chk('Contra = 30/09', await pag.evaluate(() => document.querySelector('#cf-hasta')?.value), '2026-09-30');
      chk('suma del 30/09', await texto(pag, '#cf-motivo-suma'), 'suma ▼ −1.877,77 MM');
    }
    if (errores.length) falla(`${rot}: errores de pagina (${errores[0].slice(0, 200)})`);
    await pag.close();
  }
  await ctx.close();
  // H. respuestas simuladas (caminos de error): la lista nunca se rompe
  for (const sim of [
    { s: 'noexiste', rot: 'simulado existe=false', re: /No hay foto del 02\/10\/2026/ },
    { s: 'nocierra', rot: 'simulado cierra=false', re: /no cierra contra la foto/ },
    { s: 'falla', rot: 'simulado: la vista variaciones falla', re: /No se pudo agrupar por motivo/ },
  ]) {
    const ctxS = await contexto(1280, sim.s);
    const { pag, errores } = await abrir(ctxS, link({ tab: 'cambio', hoy: HOY2, desde: '2026-10-01' }));
    if (await esperarTxt(pag, sim.rot, sim.re)) ok(`${sim.rot}: «Por motivo» dice ${sim.re}`);
    try { await esperar(pag, '#cf-lista-tabla'); const n = (await filasLista(pag)).length; if (n !== 20) falla(`${sim.rot}: la lista muestra ${n} renglones y no 20`); else ok(`${sim.rot}: la lista sigue con 20 renglones`); } catch { falla(`${sim.rot}: la lista no apareció`); }
    chk2(sim.rot)('sin grupos', await pag.evaluate(() => !!document.querySelector('#cf-motivo-grupos')), false);
    if (errores.length) falla(`${sim.rot}: errores de pagina (${errores[0].slice(0, 200)})`);
    await pag.close();
    await ctxS.close();
  }
  {
    const rot = 'simulado: variaciones_dias falla';
    const ctxS = await contexto(1280, 'dias_falla');
    const { pag, errores } = await abrir(ctxS, link({ hoy: HOY2 }));
    try { await esperar(pag, '#cf-vslunes'); } catch { falla(`${rot}: Saldo proyectado no apareció`); }
    await pag.waitForTimeout(1500);
    chk2(rot)('sin píldora', await pag.evaluate(() => !!document.querySelector('#cf-pill')), false);
    await pag.click('.cf-tabs button[data-tab="cambio"]');
    try { await esperar(pag, '#cf-q-total'); ok(`${rot}: Qué cambió sigue`); } catch { falla(`${rot}: Qué cambió no apareció`); }
    await pag.waitForFunction(() => /Error simulado/.test(document.querySelector('#cf-dias')?.textContent ?? ''), null, { timeout: 10000 }).catch(() => {});
    chk2(rot)('la fila dice el error y nada más se rompe', /Error simulado de la vista variaciones_dias/.test(await texto(pag, '#cf-dias')), true);
    if (errores.length) falla(`${rot}: errores de pagina (${errores[0].slice(0, 200)})`); else ok(`${rot}: 0 errores de consola`);
    await pag.close();
    await ctxS.close();
  }
  // K. 375 px
  {
    const rot = '375 px · Por motivo';
    const chk = chk2(rot);
    const ctxM = await contexto(375);
    const { pag, errores } = await abrir(ctxM, link({ tab: 'cambio', hoy: HOY2, desde: '2026-10-01', mira: '2027-06-30' }));
    if (await esperarGrupos(pag, rot)) {
      await pag.waitForTimeout(400);
      const sw = await scroll(pag);
      if (sw > 375) falla(`${rot}: scroll horizontal de pagina (${sw})`); else ok(`${rot}: sin scroll horizontal (scrollWidth ${sw})`);
      const minAlto = async (sel, nombre) => { const a = await alto(pag, sel); if (!a.length) falla(`${rot}: no hay ${nombre} (${sel})`); else if (Math.min(...a) < 44) falla(`${rot}: ${nombre} mide ${Math.min(...a)} px (< 44)`); else ok(`${rot}: ${nombre} ≥ 44 px (${Math.min(...a)})`); };
      await minAlto('#cf-motivo .cf-mas', 'botón «Ver más» de un grupo'); await minAlto('#cf-motivo .cf-lnk', 'enlace «Ver estos en la lista»'); await minAlto('#cf-lista .cf-mas', 'botón «Ver más» de la lista');
      await minAlto('#cf-dias .cf-dchip', 'botón «De un día para el otro»'); await minAlto('#cf-giorgi', 'botón del borrador para Giorgi');
      await pag.click('#cf-q-tabla .cf-fila-rubro[data-rubro="05"]');
      await pag.waitForSelector('#cf-motivo-filtro .cf-x', { timeout: 45000 }).catch(() => {});
      await minAlto('#cf-motivo-filtro .cf-x', 'botón ✕ del filtro');
      const rubroOculto = await pag.evaluate(() => { const c = document.querySelector('#cf-lista-tabla .cf-head')?.children[1]; return !!c && getComputedStyle(c).display === 'none'; });
      chk('en la lista se esconde Rubro', rubroOculto, true);
      const sw2 = await scroll(pag);
      if (sw2 > 375) falla(`${rot}: scroll horizontal con el filtro de rubro (${sw2})`);
      await foto(pag, 'por_motivo_375');
    }
    if (errores.length) falla(`${rot}: errores de pagina (${errores[0].slice(0, 200)})`); else ok(`${rot}: 0 errores de consola`);
    await pag.close();
    const { pag: p2 } = await abrir(ctxM, link({ hoy: HOY2 }));
    try { await p2.waitForSelector('#cf-pill', { timeout: 45000 }); const a = (await alto(p2, '#cf-pill'))[0]; if (a < 44) falla(`${rot}: la píldora mide ${a} px`); else ok(`${rot}: píldora ≥ 44 px (${a})`); } catch { falla(`${rot}: la píldora no apareció en Saldo proyectado`); }
    const swP = await scroll(p2); if (swP > 375) falla(`${rot}: Saldo proyectado con píldora tiene scroll horizontal (${swP})`);
    await p2.close();
    await ctxM.close();
  }
}

await recorrer(375);
await recorrer(1280);
await casos();
await granosYEstado();
await porMotivo();
await nav.close();

console.log(resumen.join('\n'));
console.log(`duracion             : ${((Date.now() - t0) / 1000).toFixed(1)} s`);
console.log(`comprobaciones       : ${resumen.filter((l) => l.startsWith('  ok  ')).length} ok, ${fallas.length} mal, ${noCorridos.length} no corridas`);
if (noCorridos.length) {
  // (v1.2) No es falla: se lista aparte y la salida lleva el aviso para el watchdog.
  console.log('\nNO SE PUDO CORRER:\n  - ' + noCorridos.join('\n  - '));
  // (v1.3) el aviso dice de qué se trata: granos raleado, el crudo de bancos raleado o la función sin las vistas nuevas.
  if (noCorridos.some((t) => /Granos/.test(t))) console.log('AVISO: GRANOS_SIN_DETALLE');
  if (noCorridos.some((t) => /tabla v12 sin desplegar/.test(t))) console.log('AVISO: VARIACIONES_SIN_DESPLEGAR');
  if (noCorridos.some((t) => /RESCATE FIMA/.test(t))) console.log('AVISO: DETALLE_BANCOS_RALEADO');
}
if (!fallas.length) console.log(noCorridos.length ? '\nTodo OK (con casos que no se pudieron correr).' : '\nTodo OK.');
else console.log('\nFALLA:\n  - ' + fallas.join('\n  - '));
process.exit(fallas.length ? 1 : 0);
