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
//  Uso:
//    TABLERO_KEY=... node probar_cashflow.mjs            -> cashflow.html LOCAL
//    TABLERO_KEY=... TABLERO_URL=https://.../cashflow.html node probar_cashflow.mjs
//                                                         -> la pagina PUBLICADA
//    FOTO=1                                               -> guarda capturas (FOTO_DIR o /tmp)
//    PW_CHANNEL=chrome                                    -> usa el Chrome del sistema
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
const falla = (t) => fallas.push(t);
const ok = (t) => resumen.push('  ok  ' + t);

const TABS = ['venimos', 'hecho', 'cambio', 'granos', 'fiar'];
const NOMBRE = { venimos: 'Saldo proyectado', hecho: 'Cash Flow Hoy', cambio: 'Qué cambió', granos: 'Granos', fiar: 'Estado de la web' };

async function contexto(ancho) {
  const ctx = await nav.newContext({ viewport: { width: ancho, height: ancho < 600 ? 812 : 900 }, deviceScaleFactor: 2 });
  if (!URL_PUBLICADA) {
    await ctx.route('https://tablero.local/**', (r) =>
      r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html }));
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
  pag.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.location()?.url ?? '')) errores.push('CONSOLE: ' + m.text()); });
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
    try { await esperar(pag, espera); } catch { falla(`${rot} · ${NOMBRE[t]}: no aparecio ${espera} en 45 s (${await texto(pag, '.cf-err, #cf-error')})`); }
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
    try { await esperar(pag, '#cf-gr-tabla'); } catch { falla(`${rot}: la tabla no aparecio (${await texto(pag, '.cf-err, #cf-error')})`); }
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

await recorrer(375);
await recorrer(1280);
await casos();
await granosYEstado();
await nav.close();

console.log(resumen.join('\n'));
console.log(`duracion             : ${((Date.now() - t0) / 1000).toFixed(1)} s`);
if (!fallas.length) console.log('\nTodo OK.');
else console.log('\nFALLA:\n  - ' + fallas.join('\n  - '));
process.exit(fallas.length ? 1 : 0);
