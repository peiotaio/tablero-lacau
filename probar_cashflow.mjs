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
    const espera = { venimos: '#cf-det-v', hecho: '#cf-acum', cambio: '#cf-q-total', granos: '#cf-construccion', fiar: '#cf-construccion' }[t];
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

await recorrer(375);
await recorrer(1280);
await casos();
await nav.close();

console.log(resumen.join('\n'));
console.log(`duracion             : ${((Date.now() - t0) / 1000).toFixed(1)} s`);
if (!fallas.length) console.log('\nTodo OK.');
else console.log('\nFALLA:\n  - ' + fallas.join('\n  - '));
process.exit(fallas.length ? 1 : 0);
