// ===========================================================================
//  probar_cashflow.mjs v2 (02/10/2026) — prueba de cashflow.html v2 (la web nueva COMPLETA: Inicio · Saldo
//  proyectado · Cuadro Pekín · Granos · Foto Albor · Dato crudo · Estado de la web · Notas), contra la edge
//  function REAL (`tabla` v13). Reescritura: la v1.2.1 (que probaba la web anterior) quedó como
//  probar_cashflow_v1.mjs. probar.mjs (tabla.html) no se toca.
//
//  Qué verifica (PROMPT_code_web_nueva_completa_2026-10-02.md):
//    1. A 375 y a 1280 px, abriendo con ?k= (la clave desaparece de la barra y queda recordada): las 8 pantallas,
//       0 errores de consola y sin scroll horizontal de página en cada una; botones de la barra de abajo ≥ 44 px.
//    2. Cero cifras / fechas escritas a mano en el HTML (grep sobre el archivo, local o publicado).
//    3. Casos congelados con hoy=2026-09-30 (exactos a 2 decimales; lo que lee el detalle crudo ya raleado se
//       marca «NO SE PUDO CORRER», no falla):
//       · Inicio: Hoy 1.280,38 · 30/11 −1.060,76 · peor día −1.474,85 el 14/11 · carga 28/09 al 30/11 −1.018,78
//         (chip −41,98). El mismo −1.018,78 en Inicio, Saldo proyectado, Pekín y Foto Albor.
//       · Saldo proyectado: día por día hasta el 16/10 cierra en 14,37; el 16/10 abre por rubro: 01 −44,85 ·
//         02 +1,35 · 05 −276,41 · 09 −990,86. Vencimientos grandes: 16/10 −723,68 · 01/12 −418,38 · 08/01 −1.159,51 ·
//         31/05 −367,81 (la regla de Peio da exactamente las 4 de la maqueta; manda la base).
//       · Pekín: 22 columnas hábiles, 19 filas, los valores de casos_2026-10-01 (columna Hoy = bajada 30/09 y columna
//         31/08 = bajada 01/09). Panel 15/09 → 29/09 al 30/11: −958,24 → −1.060,76, y los rubros suman el total.
//       · Por motivo (hoy=2026-10-02): los valores de la VERSIÓN 2.1 (carga 30/09 → 01/10 = bajadas 01/10 → 02/10:
//         suma −1.692,40; A REVISAR Zeni 948,00 y OC-150; carga 29/09 → 30/09: Préstamos y cauciones +1.425,50…);
//         «De un día para el otro», lista con etiquetas, «Ver estos en la lista», filtro por rubro.
//       · Granos (hoy=2026-09-29): el caso congelado de la v1.1 (stock 20.231,58, gastos −8.885,64, cosecha −4.078,48).
//       · Foto Albor: control 30/09 = 32 · +39,89 / 19 · +1,39 / 95 · −326,47 (la base en pesos; la maqueta decía
//         −326,48 por sumar rubros redondeados); acumulado sin el primer mes en octubre −1.823,84.
//       · Dato crudo: carga 27/09 → A 6117 filas, B 3775; «Ver acá» de 3 cargas al azar: filas = n_filas; ninguna
//         respuesta de crudo_filas con un número de 22 dígitos, ni clave "cbu", ni storage_path / URL.
//       · Estado: igual que la v1.1 para hoy=2026-09-30 (coincide, 0,07, +36,75, 59 días, bitácora de 10, 22/09 Revisar).
//       · Píldora «N a revisar» y «Ver por qué» (hoy=2026-10-02) llevan al Pekín y bajan a «Por motivo».
//    4. Clave mal → la página lo dice. Una ruta que falla (simulada) → ese bloque avisa y el resto sigue.
//
//  Salida: "FALLA:" + exit 1 si algo falla (el watchdog abre WEB_CAIDA). «NO SE PUDO CORRER» se lista aparte con
//  exit 0 y "AVISO: …" (raleo del detalle crudo: GRANOS_SIN_DETALLE, DETALLE_RALEADO).
//
//  Uso:
//    TABLERO_KEY=... node probar_cashflow.mjs                               -> cashflow.html LOCAL
//    TABLERO_KEY=... TABLERO_URL=https://.../cashflow.html node probar_cashflow.mjs   -> la página PUBLICADA
//    ARCHIVO=cashflow_nueva.html  -> otro archivo local (por defecto cashflow.html)
//    FOTO=1 (y FOTO_DIR)          -> guarda capturas a 375 y 1280 de cada pantalla
//    PW_CHANNEL=chrome            -> usa el Chrome del sistema
//  Todas las consultas van con prueba=1 (origen=prueba en cf_uso_web). La clave NUNCA vive en este repo.
// ===========================================================================
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const KEY = process.env.TABLERO_KEY;
if (!KEY) { console.error('Falta TABLERO_KEY. Corre:  TABLERO_KEY=... node probar_cashflow.mjs'); process.exit(1); }
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
const ARCHIVO = process.env.ARCHIVO || 'cashflow.html';
const html = URL_PUBLICADA ? await (await fetch(URL_PUBLICADA.split('#')[0].split('?')[0])).text() : readFileSync(new URL('./' + ARCHIVO, import.meta.url), 'utf8');
let svg = '<svg xmlns="http://www.w3.org/2000/svg"/>';
try { svg = readFileSync(new URL('./trebol_blanco.svg', import.meta.url), 'utf8'); } catch { /* sin el trébol, la prueba sigue */ }
const FOTO_DIR = process.env.FOTO_DIR || '/tmp';
const HOY = '2026-09-30', HOY2 = '2026-10-02', HOY_GR = '2026-09-29';
const t0 = Date.now();
const nav = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
const fallas = [], resumen = [], noCorridos = [];
const falla = (t) => fallas.push(t);
const ok = (t) => resumen.push('  ok  ' + t);
const noCorrido = (t) => { noCorridos.push(t); resumen.push('  --  NO SE PUDO CORRER: ' + t); };
const chk = (rot) => (nombre, real, esp) => { if (real !== esp) falla(`${rot}: ${nombre} da "${real}" y se esperaba "${esp}"`); else ok(`${rot}: ${nombre} = ${esp}`); };
const RE_RALEADO = /ya no está guardado/;

async function contexto(ancho, simular = null) {
  const ctx = await nav.newContext({ viewport: { width: ancho, height: ancho < 600 ? 812 : 900 }, deviceScaleFactor: 2 });
  if (!URL_PUBLICADA) {
    await ctx.route('https://tablero.local/**', (r) => r.request().url().endsWith('.svg')
      ? r.fulfill({ status: 200, contentType: 'image/svg+xml', body: svg })
      : r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html }));
  }
  if (simular) {
    await ctx.route((u) => u.searchParams.get('vista') === simular, (r) => r.fulfill({ status: 500, contentType: 'text/plain; charset=utf-8', body: 'Error simulado de la vista ' + simular }));
  }
  return ctx;
}
const base = URL_PUBLICADA ? URL_PUBLICADA.split('#')[0].split('?')[0] : 'https://tablero.local/' + ARCHIVO;
const link = (h, conClave = true) => base + (conClave ? '?k=' + encodeURIComponent(KEY) : '') + '#' + new URLSearchParams({ prueba: '1', hoy: HOY, ...h }).toString();
async function abrir(ctx, url) {
  const pag = await ctx.newPage();
  const errores = [], respuestas = [];
  pag.on('pageerror', (e) => errores.push('PAGEERROR: ' + e.message));
  pag.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.location()?.url ?? '') && !(/status of (500|401)/.test(m.text()))) errores.push('CONSOLE: ' + m.text()); });
  pag.on('response', async (r) => { try { const u = new URL(r.url()); if (u.searchParams.get('vista') === 'crudo_filas') respuestas.push({ url: r.url(), status: r.status(), body: await r.text() }); } catch { /* noop */ } });
  await pag.goto(url, { waitUntil: 'domcontentloaded' });
  return { pag, errores, respuestas };
}
const texto = (pag, sel) => pag.evaluate((s) => document.querySelector(s)?.textContent?.replace(/\s+/g, ' ').trim() ?? '', sel);
const existe = (pag, sel) => pag.evaluate((s) => !!document.querySelector(s), sel);
const esperar = (pag, sel, ms = 60000) => pag.waitForSelector(sel, { timeout: ms });
const esperarTxt = (pag, sel, re, ms = 60000) => pag.waitForFunction(([s, r]) => new RegExp(r).test(document.querySelector(s)?.textContent ?? ''), [sel, re.source], { timeout: ms });
const scroll = (pag) => pag.evaluate(() => document.documentElement.scrollWidth);
const alto = (pag, sel) => pag.evaluate((s) => Array.from(document.querySelectorAll(s)).map((e) => Math.round(e.getBoundingClientRect().height)), sel);
const foto = async (pag, nombre) => { if (process.env.FOTO) await pag.screenshot({ path: `${FOTO_DIR}/cashflow_${nombre}.png`, fullPage: true }); };
const num = (s) => { const m = String(s).match(/[−-]?\d{1,3}(\.\d{3})*,\d{2}/); return m ? m[0].replace('−', '-') : null; };   // la primera cifra de un texto, con «−» ascii
const PANT = ['inicio', 'proy', 'pekin', 'granos', 'albor', 'crudo', 'estado', 'notas'];
const NOMBRE = { inicio: 'Inicio', proy: 'Saldo proyectado', pekin: 'Cuadro Pekín', granos: 'Granos', albor: 'Foto Albor', crudo: 'Dato crudo', estado: 'Estado de la web', notas: 'Notas' };
const ESPERA = { inicio: '#cf-cards', proy: '#cf-c-fe', pekin: '#cf-pekin', granos: '#cf-gr-cards', albor: '#cf-rxm', crudo: '#cf-crudo-arch', estado: '#cf-est-checks', notas: '#cf-notas-lista-xl' };

// --- 2. Nada escrito a mano en el HTML ---------------------------------------------------
{
  const rot = 'HTML sin cifras ni fechas a mano';
  const lineas = html.split('\n');
  const malas = [];
  lineas.forEach((l, i) => {
    if (/var VERSION = |cashflow\.html v2 \(|var PRIMERA_CARGA = |«mar 29\/09|^\s*(\/\/|\*|<!--|  [A-Za-zÁÉÍÓÚ])/.test(l) && !/'<|"<|\+ "/.test(l)) return;   // comentarios, la versión y la constante estructural
    if (/\d{1,3}(\.\d{3})+,\d{2}/.test(l) || /\d{2}\/\d{2}\/20\d{2}/.test(l) || /"20\d{2}-\d{2}-\d{2}"/.test(l)) malas.push((i + 1) + ': ' + l.trim().slice(0, 120));
  });
  if (malas.length) falla(`${rot}: hay cifras o fechas escritas en el HTML:\n      ` + malas.slice(0, 8).join('\n      ')); else ok(`${rot}: ninguna (grep de MM, dd/mm/aaaa y "aaaa-mm-dd")`);
  if (/supabase\.co[^"]*[?&]k=/.test(html) || /set\("k", k\)/.test(html)) falla(`${rot}: la clave viaja en la URL de alguna consulta`); else ok(`${rot}: la clave va solo por encabezado x-cf-clave`);
}

// --- 1. Las 8 pantallas a cada ancho ------------------------------------------------------
async function recorrer(ancho) {
  const ctx = await contexto(ancho);
  const { pag, errores } = await abrir(ctx, link({}));
  const rot = `${ancho} px`;
  try { await esperar(pag, '#cf-cards'); } catch { falla(`${rot}: Inicio no apareció en 60 s (${await texto(pag, '#cf-error, .err')})`); }
  const clave = await pag.evaluate(() => ({ search: location.search, guardada: (function () { try { return !!localStorage.getItem('cf_clave'); } catch (e) { return false; } })(), olvidar: !!document.querySelector('#olvidar') }));
  if (/(^\?|&)k=/.test(clave.search)) falla(`${rot}: la clave quedó en la barra (?k=)`); else ok(`${rot}: ?k= se sacó de la barra`);
  if (!clave.guardada) falla(`${rot}: la clave no quedó recordada (localStorage cf_clave)`); else ok(`${rot}: clave recordada en el aparato`);
  if (!clave.olvidar) falla(`${rot}: falta el link «olvidar la clave»`);
  for (const p of PANT) {
    if (ancho < 600 && ['granos', 'albor', 'crudo', 'estado'].includes(p)) { await pag.click('.tabbar [data-mas]'); await pag.click(`.tab-mas [data-p="${p}"]`); }
    else if (ancho < 600) await pag.click(`.tabbar [data-p="${p}"]`);
    else if (p === 'notas') { await pag.click('.lat .lat-btn[data-p="inicio"]'); await esperar(pag, '.acc[data-p="notas"]'); await pag.click('.acc[data-p="notas"]'); }   // Notas no está en la columna: se llega desde Inicio (o la barra de abajo)
    else await pag.click(`.lat .lat-btn[data-p="${p}"]`);
    if (p === 'granos') {
      try {
        await pag.waitForFunction((re) => !!document.querySelector('#cf-gr-cards') || Array.from(document.querySelectorAll('section[aria-label="Granos"] .aviso')).some((a) => new RegExp(re).test(a.textContent || '')), RE_RALEADO.source, { timeout: 60000 });
        if (!(await existe(pag, '#cf-gr-cards'))) noCorrido(`${rot} · Granos: la carga de hoy ya no tiene el detalle crudo (raleado); la pantalla avisa y no pinta tablas`);
      } catch { falla(`${rot} · Granos: no apareció ni la tabla ni el aviso de raleo en 60 s (${await texto(pag, '.err, #cf-error')})`); }
    } else {
      try { await esperar(pag, ESPERA[p]); } catch { falla(`${rot} · ${NOMBRE[p]}: no apareció ${ESPERA[p]} en 60 s (${await texto(pag, '.err, #cf-error')})`); }
    }
    await pag.waitForTimeout(400);
    const sw = await scroll(pag);
    if (sw > ancho) falla(`${rot} · ${NOMBRE[p]}: hay scroll horizontal de página (scrollWidth ${sw})`); else ok(`${rot} · ${NOMBRE[p]}: sin scroll horizontal (scrollWidth ${sw})`);
    const miga = await texto(pag, '.miga');
    if (!miga.endsWith(NOMBRE[p])) falla(`${rot} · ${NOMBRE[p]}: la miga dice "${miga}"`);
    await foto(pag, `${ancho}_${p}`);
  }
  if (ancho < 600) {
    const a = await alto(pag, '.tabbar .tab');
    if (Math.min(...a) < 44) falla(`${rot}: la barra de abajo tiene botones de ${Math.min(...a)} px (< 44)`); else ok(`${rot}: barra de abajo con 5 botones ≥ 44 px`);
    if (a.length !== 5) falla(`${rot}: la barra de abajo tiene ${a.length} botones y no 5`);
    if (await pag.evaluate(() => getComputedStyle(document.querySelector('.lat')).display !== 'none')) falla(`${rot}: la columna lateral se ve en celular`);
  } else {
    const sello = await texto(pag, '#cf-sello');
    if (!/^Albor al cierre del \w{3} \d{2}\/\d{2} · bajada \d{2}\/\d{2} a las \d{2}:\d{2}$/.test(sello)) falla(`${rot}: el sello no dice «Albor al cierre del … · bajada … a las …» ("${sello}")`); else ok(`${rot}: sello «${sello}»`);
    await pag.click('.lat [data-lat]');
    if (!(await existe(pag, '.lat.lat-cerrada'))) falla(`${rot}: «Cerrar la columna» no cierra la columna`); else ok(`${rot}: «Cerrar la columna» anda`);
    await pag.click('.lat [data-lat]');
  }
  if (errores.length) falla(`${rot}: la página tiró errores (${errores.slice(0, 3).join(' | ').slice(0, 300)})`); else ok(`${rot}: 0 errores de consola en las 8 pantallas`);
  await pag.close(); await ctx.close();
}

// --- 3a. Inicio y Saldo proyectado (hoy=2026-09-30) -----------------------------------------
async function inicioYProy() {
  const ctx = await contexto(1280);
  {
    const rot = 'Inicio (hoy=2026-09-30)', c = chk(rot);
    const { pag, errores } = await abrir(ctx, link({ p: 'inicio' }));
    try { await esperar(pag, '#cf-cards'); await esperarTxt(pag, '#cf-card-hoy', /carga 28\/09: [−\d]/); } catch { falla(`${rot}: las tarjetas no aparecieron completas (${await texto(pag, '#cf-cards')})`); }
    const tit = await texto(pag, '#cf-titular');
    resumen.push(`--- ${rot} ---`); resumen.push('titular: ' + tit);
    c('titular empieza', tit.startsWith('Hoy hay 1.280,38. Al 30/11 da −1.060,76, 41,98 menos que en la carga del 28/09. El peor día hasta ahí es el sáb 14/11/2026, con −1.474,85'), true);
    try { await esperarTxt(pag, '#cf-titular', /al día siguiente entra/, 30000); ok(`${rot}: el titular dice qué entra al día siguiente`); } catch { falla(`${rot}: el titular no dice qué entra al día siguiente ("${(await texto(pag, '#cf-titular')).slice(-120)}")`); }
    const card = async (id) => { const t = await texto(pag, '#' + id); return { t, v: num(t.split('MM')[0]), ref: num((t.split('carga 28/09:')[1] || '').split(/[▲▼=]/)[0]), chip: (t.match(/[▲▼] [+−]\d[\d.,]*|= 0,00/) || [''])[0] }; };
    const hoy = await card('cf-card-hoy'), fija = await card('cf-card-fija'), peor = await card('cf-card-peor'), d10 = await card('cf-card-d10'), fm = await card('cf-card-fm');
    resumen.push(`cards: hoy ${hoy.v} (${hoy.ref} ${hoy.chip}) · 30/11 ${fija.v} (${fija.ref} ${fija.chip}) · peor ${peor.v} (${peor.ref} ${peor.chip}) · d10 ${d10.v} · fm ${fm.v}`);
    c('Hoy', hoy.v, '1.280,38'); c('30/11 ★ hoy', fija.v, '-1.060,76'); c('30/11 ★ carga 28/09', fija.ref, '-1.018,78'); c('30/11 ★ chip', fija.chip, '▼ −41,98');
    c('peor día', peor.v, '-1.474,85'); c('peor día es el 14/11', /sáb 14\/11\/2026/.test(peor.t), true);
    c('próximo día 10 (10/10)', d10.v, '-60,70'); c('fin de septiembre', fm.v, '1.280,38');
    c('la fecha fija lleva ★', /30\/11 ★/.test(fija.t), true);
    await pag.click('#cf-card-fija');
    try { await esperar(pag, '#cf-c-fe'); } catch { /* abajo */ }
    c('tocar la tarjeta abre Saldo proyectado mirando al 30/11', await pag.evaluate(() => document.querySelector('#cf-mira')?.value), '2026-11-30');
    if (errores.length) falla(`${rot}: errores de página (${errores[0].slice(0, 200)})`);
    await foto(pag, 'inicio'); await pag.close();
  }
  {
    const rot = 'Saldo proyectado (hoy=2026-09-30, parado 28/09, mirando al 30/11)', c = chk(rot);
    const { pag, errores } = await abrir(ctx, link({ p: 'proy', sec: 'fechas,venc,dxd,rub' }));
    try { await esperar(pag, '#cf-c-fe'); await esperarTxt(pag, '#cf-frase', /daba/); } catch { falla(`${rot}: la frase no apareció (${await texto(pag, '.err, #cf-error')})`); }
    const frase = await texto(pag, '#cf-frase'), fe = await texto(pag, '#cf-c-fe'), mn = await texto(pag, '#cf-c-min');
    resumen.push(`--- ${rot} ---`); resumen.push('frase: ' + frase); resumen.push('fecha elegida: ' + fe); resumen.push('mínimo: ' + mn);
    c('Parado el abre en la carga del lunes 28/09', await pag.evaluate(() => document.querySelector('#cf-parado')?.value), '2026-09-28');
    c('Mirando al abre en la fecha fija 30/11', await pag.evaluate(() => document.querySelector('#cf-mira')?.value), '2026-11-30');
    c('frase', frase.startsWith('Al 30/11/2026 da −1.060,76; en la carga del 28/09 daba −1.018,78 (▼ −41,98).'), true);
    c('tarjeta grande: hoy', num(fe.split('MM')[0]), '-1.060,76'); c('tarjeta grande: carga 28/09', num(fe.split('carga 28/09:')[1]), '-1.018,78'); c('tarjeta grande: chip', /▼ −41,98/.test(fe), true);
    c('punto más bajo entre hoy y el 30/11', num(mn.split('MM')[0]), '-1.474,85'); c('… el 14/11', /sáb 14\/11\/2026/.test(mn), true);
    const tiras = await pag.evaluate(() => Array.from(document.querySelectorAll('#cf-finmes .tile')).map((t) => t.textContent.replace(/\s+/g, ' ').trim()));
    resumen.push('fin de mes: ' + tiras.join(' | '));
    c('tira fin de mes: sep 26 = 1.280,38', num(tiras[0]), '1.280,38'); c('tira fin de mes: nov 26 apretada', await pag.evaluate(() => document.querySelector('#cf-finmes .tile[aria-pressed="true"]')?.textContent.replace(/\s+/g, ' ').trim().startsWith('nov 26')), true);
    // Fechas clave: la fija dice −1.060,76 / carga 28/09 −1.018,78
    const clave = await pag.evaluate(() => Array.from(document.querySelectorAll('#cf-clave .kcard')).map((k) => k.textContent.replace(/\s+/g, ' ').trim()));
    resumen.push('fechas clave: ' + clave.join(' || '));
    c('5 fechas clave', clave.length, 5);
    const fijaC = clave.find((t) => /★/.test(t)) || '';
    c('fecha clave ★: −1.060,76 / carga 28/09 −1.018,78 / ▼ −41,98', /−1\.060,76/.test(fijaC) && /carga 28\/09: −1\.018,78/.test(fijaC) && /▼ −41,98/.test(fijaC), true);
    // Vencimientos grandes
    try { await esperar(pag, '#cf-venc'); } catch { falla(`${rot}: los vencimientos no aparecieron (${await texto(pag, 'section[aria-label="Saldo proyectado"] .err')})`); }
    const venc = await pag.evaluate(() => Array.from(document.querySelectorAll('#cf-venc .tr:not(.th)')).map((r) => Array.from(r.children).map((x) => x.textContent.replace(/\s+/g, ' ').trim())));
    resumen.push('vencimientos: ' + venc.map((v) => v[0] + ' ' + v[2] + ' (saldo ' + v[3] + ')').join(' | '));
    if (venc.length === 1 && /Ningún vencimiento|no está guardado/.test(venc[0][0])) noCorrido(`${rot}: vencimientos sin detalle crudo (raleado)`);
    else {
      c('4 vencimientos', venc.length, 4);
      [['vie 16/10/26', '−723,68', '14,37'], ['mar 01/12/26', '−418,38', null], ['vie 08/01/27', '−1.159,51', null], ['lun 31/05/27', '−367,81', null]].forEach(([f, m, s], i) => { c(`vencimiento ${i + 1}: fecha`, venc[i]?.[0], f); c(`vencimiento ${i + 1}: importe`, venc[i]?.[2], m); if (s) c(`vencimiento ${i + 1}: saldo ese día`, venc[i]?.[3], s); });
      c('el 1º es el retiro del Fondo (Llambías)', /RETIRO FONDO - LLAMBIAS/.test(venc[0]?.[1] ?? ''), true);
    }
    // Día por día hasta el 16/10
    await pag.fill('#cf-mira', '2026-10-16'); await pag.dispatchEvent('#cf-mira', 'change');
    try { await esperarTxt(pag, '#cf-dxd', /16\/10\/26/); } catch { falla(`${rot}: el día por día hasta el 16/10 no apareció`); }
    const dias = await pag.evaluate(() => Array.from(document.querySelectorAll('#cf-dxd .tr:not(.th):not(.tr-hijo)')).map((r) => Array.from(r.children).map((x) => x.textContent.replace(/\s+/g, ' ').trim())));
    resumen.push('día por día (últimos 3): ' + dias.slice(-3).map((d) => d.join(' / ')).join(' | '));
    c('día por día: 17 filas (partida + 16 días con movimiento)', dias.length, 17);
    c('el 16/10 cierra en 14,37', dias[dias.length - 1]?.[2], '14,37'); c('el 16/10 se mueve −1.310,77', dias[dias.length - 1]?.[1], '▼ −1.310,77');
    c('el 10/10 da −60,70', dias.find((d) => /10\/10\/26/.test(d[0]))?.[2], '-60,70'.replace('-', '−'));
    await pag.click('#cf-dxd [data-dia-ab="2026-10-16"]');
    try { await esperarTxt(pag, '#cf-dia-2026-10-16', /comprobantes/); } catch { /* abajo */ }
    const dia = await texto(pag, '#cf-dia-2026-10-16');
    if (RE_RALEADO.test(dia)) noCorrido(`${rot}: los comprobantes del 16/10 (detalle raleado)`);
    else {
      c('16/10 por rubro: 01 −44,85', /01 · Bancos 5 · ▼ −44,85/.test(dia), true); c('16/10: 02 +1,35', /02 · Ventas 1 · ▲ \+1,35/.test(dia), true);
      c('16/10: 05 −276,41', /05 · Compras 60 · ▼ −276,41/.test(dia), true); c('16/10: 09 −990,86', /09 · Otros egresos 10 · ▼ −990,86/.test(dia), true);
      c('16/10: 76 comprobantes', /76 comprobantes/.test(dia), true);
    }
    // Por rubro al 16/10: la fila Total es −78,64 → 14,37
    const tot = await pag.evaluate(() => Array.from(document.querySelector('#cf-rub .tr-tot')?.children ?? []).map((x) => x.textContent.replace(/\s+/g, ' ').trim()));
    resumen.push('por rubro total: ' + tot.join(' | '));
    c('Por rubro al 16/10: total carga 28/09 −78,64', tot[1], '−78,64'); c('… hoy 14,37', tot[2], '14,37'); c('… chip ▲ +93,01', tot[3], '▲ +93,01');
    await pag.click('#cf-rub [data-rub-ab="09"]');
    try { await pag.waitForFunction(() => document.querySelectorAll('#cf-rub .tr-hijo').length > 1, null, { timeout: 60000 }); ok(`${rot}: tocar el rubro 09 abre sus comprobantes (${await pag.evaluate(() => document.querySelectorAll('#cf-rub .tr-hijo').length)} renglones)`); } catch { falla(`${rot}: el rubro 09 no abrió sus comprobantes`); }
    const sw = await scroll(pag); if (sw > 1280) falla(`${rot}: scroll horizontal (${sw})`);
    if (errores.length) falla(`${rot}: errores de página (${errores[0].slice(0, 200)})`);
    await foto(pag, 'proy'); await pag.close();
  }
  await ctx.close();
}

// --- 3b. Cuadro Pekín (hoy=2026-09-30) ---------------------------------------------------------
async function pekin() {
  const ctx = await contexto(1280);
  const rot = 'Cuadro Pekín (hoy=2026-09-30)', c = chk(rot);
  const { pag, errores } = await abrir(ctx, link({ p: 'pekin', a: '2026-09-15', ver: '2026-11-30' }));
  try { await esperar(pag, '#cf-pekin'); await esperar(pag, '#cf-panel-total'); } catch { falla(`${rot}: el cuadro o el panel no aparecieron (${await texto(pag, '.err, #cf-error')})`); }
  const M = await pag.evaluate(() => ({
    cols: Array.from(document.querySelectorAll('#cf-pekin .pk-th')).map((t) => t.querySelector('span').textContent.trim()),
    filas: Array.from(document.querySelectorAll('#cf-pekin .pk-fila')).map((f) => ({ label: f.querySelector('.pk-rh span').textContent.trim(), fecha: f.getAttribute('data-corte'), cells: Array.from(f.querySelectorAll('.pk-c')).map((x) => x.textContent.trim()), chip: f.querySelector('.pk-last .chip')?.textContent.trim(), ver: !!f.querySelector('.pk-last button') })),
    a: document.querySelector('#cf-pk-a')?.textContent.trim(), b: document.querySelector('#cf-pk-b')?.textContent.trim(),
  }));
  resumen.push(`--- ${rot} ---`); resumen.push(`columnas (${M.cols.length}): ${M.cols.join(' ')}`); resumen.push(`filas: ${M.filas.length} · parado ${M.a} comparado con ${M.b}`);
  c('22 columnas hábiles', M.cols.length, 22); c('19 filas (días 10 y fines de mes)', M.filas.length, 19);
  c('la primera columna es la carga del 31/08 y la última es Hoy', M.cols[0] + ' ' + M.cols[M.cols.length - 1], '31/08 Hoy');
  c('Parado el 15/09, comparado con Hoy', M.a + ' ' + M.b, '15/09 Hoy');
  const esp30 = ['1.280,38', '−60,70', '−543,46', '−1.470,10', '−1.060,76', '−2.379,37', '−1.652,43', '−4.367,86', '−4.133,35', '−4.878,45', '−2.903,38', '−4.949,08', '−3.086,84', '−4.086,95', '−625,65', '−3.980,36', '−740,30', '−1.470,58', '−3.285,59'];
  const esp01 = ['−413,86', '−1.619,95', '−1.211,05', '−2.137,66', '—', '—', '—'];   // 31/08: las primeras 4 y las 3 últimas (fuera del horizonte 30/04)
  const iHoy = M.cols.indexOf('Hoy'), i31 = M.cols.indexOf('31/08');
  const colHoy = M.filas.map((f) => f.cells[iHoy]), col31 = M.filas.map((f) => f.cells[i31]);
  c('columna Hoy = los 19 valores de casos_2026-10-01', colHoy.join(' '), esp30.join(' '));
  c('columna 31/08: primeras 4 y últimas 3 (— fuera del horizonte)', col31.slice(0, 4).concat(col31.slice(-3)).join(' '), esp01.join(' '));
  const f30 = M.filas.find((f) => f.fecha === '2026-11-30');
  c('fila 30/11 ★: chip 15/09 → hoy = ▼ −102,52', f30?.chip, '▼ −102,52'); c('fila 30/11 tiene «Ver»', f30?.ver, true);
  c('columna 15/09 al 30/11 = −958,24', f30?.cells[M.cols.indexOf('15/09')], '−958,24');
  // Panel 15/09 → 29/09 al 30/11
  const res = await texto(pag, '#cf-panel-resumen'), tot = await pag.evaluate(() => Array.from(document.querySelector('#cf-panel-total')?.children ?? []).map((x) => x.textContent.replace(/\s+/g, ' ').trim()));
  resumen.push('panel: ' + res); resumen.push('panel total: ' + tot.join(' | '));
  c('panel resumen', res, 'Con lo cargado hoy (mar 29/09) da −1.060,76. Con lo cargado el 15/09 daba −958,24. Cambió ▼ −102,52.');
  c('panel total A/B/chip', tot.slice(1).join(' '), '−958,24 −1.060,76 ▼ −102,52');
  const rubros = await pag.evaluate(() => Array.from(document.querySelectorAll('#cf-panel-rubros .tr-btn')).map((r) => Array.from(r.children).map((x) => x.textContent.replace(/\s+/g, ' ').trim())));
  const suma = (i) => Math.round(rubros.reduce((s, r) => s + (r[i] === '—' ? 0 : Number(r[i].replace(/\./g, '').replace(',', '.').replace('−', '-'))), 0) * 100) / 100;
  resumen.push(`rubros del panel (${rubros.length}): ` + rubros.map((r) => r[0] + ' ' + r[1] + '→' + r[2]).join(' · '));
  c('los rubros suman el total parado el 15/09 (±0,05)', Math.abs(suma(1) - (-958.24)) <= 0.05, true); c('los rubros suman el total de hoy (±0,05)', Math.abs(suma(2) - (-1060.76)) <= 0.05, true);
  c('rubros ordenados por lo que más movió', rubros.every((r, i) => i === 0 || Math.abs(Number(rubros[i - 1][3].replace(/[▲▼= ]/g, '').replace(/\./g, '').replace(',', '.').replace('−', '-')) || 0) >= Math.abs(Number(r[3].replace(/[▲▼= ]/g, '').replace(/\./g, '').replace(',', '.').replace('−', '-')) || 0)), true);
  // la lista de comprobantes aparece sola
  try { await pag.waitForFunction(() => document.querySelectorAll('#cf-lista-tabla .lista-row:not(.th)').length > 0, null, { timeout: 60000 }); ok(`${rot}: la lista de comprobantes apareció sola (${await pag.evaluate(() => document.querySelectorAll('#cf-lista-tabla .lista-row:not(.th)').length)} renglones)`); } catch { falla(`${rot}: la lista de comprobantes no apareció (${(await texto(pag, '#cf-lista')).slice(0, 160)})`); }
  c('Por motivo: par no seguido → la línea «de un día para el otro»', /de un día para el otro/.test(await texto(pag, '#cf-motivo-txt')), true);
  // Mirar otra fecha
  await pag.click('#cf-panel [data-ver="2026-10-31"]');
  try { await esperarTxt(pag, '#cf-panel-resumen', /da −594,16/); ok(`${rot}: «Mirar otra fecha» 31/10 → hoy da −594,16`); } catch { falla(`${rot}: mirar al 31/10 no dio −594,16 ("${await texto(pag, '#cf-panel-resumen')}")`); }
  // Solo fin de mes / quitar / agregar
  await pag.click('#cf-cuadro [data-con10="0"]');
  c('«Solo fin de mes»: 10 filas', await pag.evaluate(() => document.querySelectorAll('#cf-pekin .pk-fila').length), 10);
  await pag.click('#cf-pekin [data-quitar="2026-09-01"]');
  c('× Quitar saca una columna (21)', await pag.evaluate(() => document.querySelectorAll('#cf-pekin .pk-th').length), 21);
  await pag.click('#cf-cuadro [data-add]'); await pag.fill('#cf-agregar', '2026-09-06'); await pag.dispatchEvent('#cf-agregar', 'change');
  c('agregar el domingo 06/09 avisa que se agrega la del 04/09', /no hubo carga en Albor: se agrega la del vie 04\/09\/2026/.test(await texto(pag, '#cf-cuadro .aviso')), true);
  await pag.fill('#cf-agregar', '2026-09-01'); await pag.dispatchEvent('#cf-agregar', 'change'); await pag.click('#cf-cuadro [data-agregar]');
  c('+ Agregar un día vuelve a poner el 01/09 (22)', await pag.evaluate(() => document.querySelectorAll('#cf-pekin .pk-th').length), 22);
  c('«Dato crudo ↗» en cada columna', await pag.evaluate(() => document.querySelectorAll('#cf-pekin [data-crudo]').length), 22);
  await pag.click('#cf-pekin [data-crudo="2026-09-27"]');
  try { await esperar(pag, '#cf-crudo-arch'); c('«Dato crudo ↗» abre Dato crudo en esa carga', await pag.evaluate(() => document.querySelector('#cf-crudo')?.value), '2026-09-27'); } catch { falla(`${rot}: «Dato crudo ↗» no abrió Dato crudo`); }
  if (errores.length) falla(`${rot}: errores de página (${errores[0].slice(0, 200)})`);
  await foto(pag, 'pekin'); await pag.close(); await ctx.close();
}

// --- 3c. Por motivo (hoy=2026-10-02) ---------------------------------------------------------
const grupos = (pag) => pag.evaluate(() => Array.from(document.querySelectorAll('#cf-motivo-grupos details')).map((d) => ({ motivo: d.getAttribute('data-motivo'), neto: d.querySelector('.sv')?.textContent.trim(), open: d.open, items: d.querySelectorAll('.it').length, mas: d.querySelector('.mas[data-d="1"]')?.textContent.trim() ?? null, lnk: !!d.querySelector('.lnk2[data-mot]'), tag: d.querySelectorAll('.tagg').length, det: Array.from(d.querySelectorAll('.detb')).map((x) => x.textContent).join(' | ') })));
const filasLista = (pag) => pag.evaluate(() => Array.from(document.querySelectorAll('#cf-lista-tabla .lista-row:not(.th)')).map((f) => ({ txt: f.children[0].textContent.replace(/\s+/g, ' ').trim().slice(0, 60), tags: Array.from(f.querySelectorAll('.gtag')).map((t) => t.textContent.trim()), efecto: f.children[3].textContent.trim() })));
const masLista = (pag) => pag.evaluate(() => ({ mas: document.querySelector('#cf-lista .mas[data-d="1"]')?.textContent.trim() ?? null, menos: !!document.querySelector('#cf-lista .mas[data-d="-1"]') }));
async function porMotivo() {
  const ctx = await contexto(1280);
  const abrirPar = async (a, b, extra = {}) => { const r = await abrir(ctx, link({ hoy: HOY2, p: 'pekin', a, b, ver: '2027-06-30', ...extra })); try { await esperar(r.pag, '#cf-panel-total'); } catch { falla(`Por motivo ${a} → ${b}: el panel no apareció`); } return r; };
  {
    const rot = 'Por motivo carga 30/09 → 01/10 (bajadas 01/10 → 02/10)', c = chk(rot);
    const { pag, errores } = await abrirPar('2026-09-30', '2026-10-01');
    try { await esperar(pag, '#cf-motivo-grupos'); } catch { falla(`${rot}: «Por motivo» no se pintó (${await texto(pag, '#cf-motivo-txt, .err')})`); }
    c('panel total chip', (await pag.evaluate(() => document.querySelector('#cf-panel-total .chip')?.textContent.trim())), '▼ −1.692,40');
    c('Por motivo · suma', await texto(pag, '#cf-motivo-suma'), 'suma ▼ −1.692,40 MM');
    const g = await grupos(pag);
    resumen.push(`--- ${rot} ---`); resumen.push('grupos: ' + g.map((x) => `${x.motivo} ${x.neto}${x.open ? ' (abierto)' : ''}`).join(' · '));
    const neto = (m) => g.find((x) => x.motivo === m)?.neto ?? '(no está)';
    c('Nuevo o eliminado', neto('real'), '▼ −1.809,50'); c('Cambió el importe', neto('ajuste'), '▲ +105,26'); c('Se pagó o se cobró', neto('ejecutado'), '▲ +7,41'); c('Conciliación', neto('conciliacion'), '▲ +4,44');
    c('Se corrió de fecha', neto('fecha'), '0,00'); c('Pase', neto('interno'), '0,00'); c('Anticipo', neto('anticipo'), '0,00'); c('solo esos 7 grupos', g.length, 7);
    c('orden de pantalla', g.map((x) => x.motivo).join(','), 'real,ajuste,fecha,anticipo,ejecutado,conciliacion,interno');
    c('«Nuevo o eliminado» abre solo', g.find((x) => x.motivo === 'real')?.open, true); c('«Anticipo» abre solo (tiene algo a revisar)', g.find((x) => x.motivo === 'anticipo')?.open, true);
    c('etiqueta PASÓ AL ÚLTIMO MES en Anticipo', g.find((x) => x.motivo === 'anticipo')?.tag, 1); c('Nuevo o eliminado: 5 visibles', g.find((x) => x.motivo === 'real')?.items, 5);
    c('Conciliación (bancos) sin «Ver estos en la lista»', g.find((x) => x.motivo === 'conciliacion')?.lnk, false); c('Nuevo o eliminado con «Ver estos en la lista»', g.find((x) => x.motivo === 'real')?.lnk, true);
    const rev = await texto(pag, '#cf-arevisar'); resumen.push('A REVISAR: ' + rev.slice(0, 300));
    for (const re of [/ZENI/, /948,00 MM/, /30\/06/, /OC-150/, /−1\.579,40/, /−1\.841,70/]) { if (!re.test(rev)) falla(`${rot}: A REVISAR no dice ${re}`); else ok(`${rot}: A REVISAR dice ${re}`); }
    const href = await pag.evaluate(() => document.querySelector('#cf-giorgi')?.getAttribute('href') ?? '');
    c('«Armar consulta para Giorgi» es un borrador (mailto: gvidela@lacau.com.ar)', href.startsWith('mailto:gvidela@lacau.com.ar?subject='), true);
    c('barra con 7 tramos', await pag.evaluate(() => document.querySelectorAll('#cf-motivo-bar span').length), 7);
    const chips = await pag.evaluate(() => Array.from(document.querySelectorAll('#cf-dias .dchip')).map((b) => b.textContent.replace(/\s+/g, ' ').trim() + (b.getAttribute('aria-pressed') === 'true' ? ' *' : '')));
    resumen.push('De un día para el otro: ' + chips.join(' | '));
    c('10 botones', chips.length, 10); c('el último (30/09 → 01/10, en cargas) apretado', chips[9], '30/09 → 01/10▼ −1.692,40 *');
    const txt = await texto(pag, '#cf-lista-txt'); resumen.push('lista: ' + txt.slice(0, 220));
    c('263 comprobantes', /cambiaron 263 comprobantes/.test(txt), true); c('«Estos son los 20 que más pesan:»', /Estos son los 20 que más pesan:/.test(txt), true);
    let L = await filasLista(pag);
    c('20 renglones visibles', L.length, 20); c('el primero es la OC de Cargill', /OC - 150/.test(L[0]?.txt), true);
    try { await pag.waitForFunction(() => { const f = Array.from(document.querySelectorAll('#cf-lista-tabla .lista-row:not(.th)')); return f.length > 0 && f.every((r) => r.querySelector('.gtag')); }, null, { timeout: 60000 }); } catch { /* abajo */ }
    L = await filasLista(pag); c('los 20 renglones llevan etiqueta de motivo', L.filter((f) => f.tags.length).length, 20);
    let mb = await masLista(pag); c('«Ver 10 más · quedan 243»', mb.mas, 'Ver 10 más · quedan 243');
    await pag.click('#cf-lista .mas[data-d="1"]'); await pag.waitForFunction(() => document.querySelectorAll('#cf-lista-tabla .lista-row:not(.th)').length === 30, null, { timeout: 10000 }).catch(() => {});
    c('después de «Ver 10 más»: 30', (await filasLista(pag)).length, 30);
    await pag.click('#cf-lista .mas[data-d="-1"]'); await pag.waitForFunction(() => document.querySelectorAll('#cf-lista-tabla .lista-row:not(.th)').length === 20, null, { timeout: 10000 }).catch(() => {});
    c('«Ver menos»: 20', (await filasLista(pag)).length, 20);
    await pag.click('#cf-motivo-grupos details[data-motivo="real"] .mas[data-d="1"]'); await pag.waitForFunction(() => document.querySelectorAll('#cf-motivo-grupos details[data-motivo="real"] .it').length === 15, null, { timeout: 10000 }).catch(() => {});
    c('Nuevo o eliminado: «Ver 10 más» → 15', (await grupos(pag)).find((x) => x.motivo === 'real')?.items, 15);
    await pag.click('#cf-motivo-grupos details[data-motivo="real"] .mas[data-d="1"]'); await pag.waitForFunction(() => document.querySelectorAll('#cf-motivo-grupos details[data-motivo="real"] .it').length === 25, null, { timeout: 60000 }).catch(() => {});
    c('otro «Ver 10 más» → 25 (pide el motivo entero)', (await grupos(pag)).find((x) => x.motivo === 'real')?.items, 25);
    await pag.click('#cf-motivo-grupos details[data-motivo="interno"] summary');
    const det = (await grupos(pag)).find((x) => x.motivo === 'interno')?.det ?? '';
    if (/FIMA/.test(det)) ok(`${rot}: el pase muestra el detalle de bancos (RESCATE FIMA)`); else noCorrido(`${rot}: el detalle de bancos del pase (RESCATE FIMA) no está: el crudo de esa bajada ya se raleó`);
    await pag.click('#cf-motivo-grupos details[data-motivo="real"] .lnk2[data-mot="real"]');
    await pag.waitForFunction(() => !!document.querySelector('#cf-lista-filtro') && !document.querySelector('#cf-lista .cargando'), null, { timeout: 60000 }).catch(() => {});
    c('chip de la lista «Solo: Nuevo o eliminado»', /^Solo: Nuevo o eliminado/.test(await texto(pag, '#cf-lista-filtro')), true);
    L = await filasLista(pag); c('la lista filtrada tiene más de 20', L.length > 20, true); c('todos llevan la etiqueta', L.every((f) => f.tags.includes('Nuevo o eliminado')), true);
    c('el link lleva motivo=real', /motivo=real/.test(await pag.evaluate(() => location.hash)), true);
    await pag.click('#cf-lista-filtro .x'); await pag.waitForFunction(() => !document.querySelector('#cf-lista-filtro'), null, { timeout: 10000 }).catch(() => {});
    c('✕ saca el filtro', await existe(pag, '#cf-lista-filtro'), false);
    await pag.click('#cf-panel-rubros [data-rubro="05"]');
    await pag.waitForFunction(() => /Mirando solo 05 ·/.test(document.querySelector('#cf-motivo-filtro')?.textContent ?? '') && !!document.querySelector('#cf-motivo-grupos'), null, { timeout: 60000 }).catch(() => {});
    c('chip «Mirando solo 05 · …»', /^Mirando solo 05 · /.test(await texto(pag, '#cf-motivo-filtro')), true); c('suma del rubro 05', await texto(pag, '#cf-motivo-suma'), 'suma ▲ +3,49 MM');
    c('«A revisar» sigue con el filtro', await existe(pag, '#cf-arevisar'), true); c('la lista NO se filtra por rubro', (await filasLista(pag)).length, 20);
    await pag.click('#cf-panel-rubros [data-rubro="05A"]');
    await pag.waitForFunction(() => /Mirando solo 05A ·/.test(document.querySelector('#cf-motivo-filtro')?.textContent ?? ''), null, { timeout: 60000 }).catch(() => {});
    const s05A = await texto(pag, '#cf-motivo-suma'); c('05A es distinto de 05', s05A !== 'suma ▲ +3,49 MM' && /^suma /.test(s05A), true);
    await pag.click('#cf-motivo-filtro .x'); await pag.waitForFunction(() => !document.querySelector('#cf-motivo-filtro'), null, { timeout: 10000 }).catch(() => {});
    if (errores.length) falla(`${rot}: errores de página (${errores[0].slice(0, 200)})`); else ok(`${rot}: 0 errores de consola`);
    await foto(pag, 'por_motivo'); await pag.close();
  }
  for (const cc of [
    { a: '2026-09-29', b: '2026-09-30', rot: 'Por motivo carga 29/09 → 30/09', suma: 'suma ▲ +1.009,30 MM', netos: { financiacion: '▲ +1.425,50', interno: '▼ −350,00', ejecutado: '▼ −292,64', real: '▲ +185,91', ajuste: '▲ +64,17', vencio: '▼ −23,64' }, sinLnk: ['financiacion', 'vencio'], aRevisar: false },
    { a: '2026-09-23', b: '2026-09-24', rot: 'Por motivo carga 23/09 → 24/09', suma: 'suma ▼ −446,84 MM', netos: { horizonte: '▲ +172,89' }, lectura: /Cambió el horizonte de 30\/04 a 30\/06/, aRevisar: false },
    { a: '2026-09-27', b: '2026-09-28', rot: 'Por motivo carga 27/09 → 28/09', suma: 'suma ▼ −135,50 MM', netos: { conciliacion: '▼ −32,00' }, revisar: [/reacomodó movimientos de bancos/, /5\.700 filas contra 6\.117/], aRevisar: true },
  ]) {
    const c = chk(cc.rot);
    const { pag, errores } = await abrirPar(cc.a, cc.b);
    try { await esperar(pag, '#cf-motivo-grupos'); } catch { falla(`${cc.rot}: «Por motivo» no se pintó (${await texto(pag, '#cf-motivo-txt, .err')})`); }
    const g = await grupos(pag);
    resumen.push(`--- ${cc.rot} --- ` + g.map((x) => `${x.motivo} ${x.neto}`).join(' · '));
    c('suma', await texto(pag, '#cf-motivo-suma'), cc.suma);
    for (const [m, v] of Object.entries(cc.netos)) c(m, g.find((x) => x.motivo === m)?.neto ?? '(no está)', v);
    for (const m of cc.sinLnk || []) c(`${m} sin «Ver estos en la lista»`, g.find((x) => x.motivo === m)?.lnk, false);
    c('A REVISAR ' + (cc.aRevisar ? 'presente' : 'ausente'), await existe(pag, '#cf-arevisar'), cc.aRevisar);
    if (cc.lectura) { const l = await pag.evaluate(() => Array.from(document.querySelectorAll('#cf-motivo .lect')).map((x) => x.textContent).join(' | ')); if (!cc.lectura.test(l)) falla(`${cc.rot}: la Lectura no dice ${cc.lectura}`); else ok(`${cc.rot}: Lectura ${cc.lectura}`); }
    if (cc.revisar) { const rv = await texto(pag, '#cf-arevisar'); for (const re of cc.revisar) { if (!re.test(rv)) falla(`${cc.rot}: A REVISAR no dice ${re}`); else ok(`${cc.rot}: A REVISAR dice ${re}`); } }
    if (errores.length) falla(`${cc.rot}: errores de página (${errores[0].slice(0, 200)})`);
    await pag.close();
  }
  {
    const rot = 'Por motivo carga 25/09 → 26/09 (sin cambios)';
    const { pag, errores } = await abrirPar('2026-09-25', '2026-09-26');
    try { await esperarTxt(pag, '#cf-motivo-txt', /Sin cambios entre esas dos cargas/); ok(`${rot}: «Sin cambios»`); } catch { falla(`${rot}: no dijo «Sin cambios» ("${(await texto(pag, '#cf-motivo')).slice(0, 160)}")`); }
    if (errores.length) falla(`${rot}: errores de página (${errores[0].slice(0, 200)})`);
    await pag.close();
  }
  {
    const rot = 'Píldora «a revisar» (Inicio, hoy=2026-10-02)', c = chk(rot);
    const { pag, errores } = await abrir(ctx, link({ hoy: HOY2, p: 'inicio' }));
    try { await esperar(pag, '#cf-pill'); } catch { falla(`${rot}: la píldora no apareció`); }
    c('texto', await texto(pag, '#cf-pill'), '2 a revisar'); c('alto ≥ 44 px', ((await alto(pag, '#cf-pill'))[0] || 0) >= 44, true);
    await pag.click('#cf-pill');
    try { await esperar(pag, '#cf-motivo-grupos'); } catch { falla(`${rot}: no llegó a «Por motivo»`); }
    c('abre el Cuadro Pekín', await pag.evaluate(() => document.querySelector('.miga')?.textContent.trim()), 'Cash Flow / Cuadro Pekín');
    c('parado el 30/09, comparado con Hoy', (await texto(pag, '#cf-pk-a')) + ' ' + (await texto(pag, '#cf-pk-b')), '30/09 Hoy');
    const hs = await pag.evaluate(() => location.hash); c('el link lleva ancla=motivo', /ancla=motivo/.test(hs), true);
    await pag.waitForTimeout(800);
    const top = await pag.evaluate(() => Math.round(document.querySelector('#cf-motivo').getBoundingClientRect().top));
    resumen.push(`píldora: «Por motivo» quedó a ${top} px del borde de arriba`);
    c('bajó hasta «Por motivo»', top >= -20 && top < 300, true);
    c('aviso «Arriba quedó…» con «Volver»', /^Arriba quedó: parado el 30\/09 comparado con hoy/.test(await texto(pag, '#cf-salto')), true);
    await pag.click('#cf-salto [data-volver]');
    try { await pag.waitForFunction(() => document.querySelector('#cf-pk-a')?.textContent.trim() === '28/09', null, { timeout: 60000 }); ok(`${rot}: «Volver» deja parado el 28/09 (la carga del lunes)`); } catch { falla(`${rot}: «Volver» no volvió a la carga del lunes ("${await texto(pag, '#cf-pk-a')}")`); }
    if (errores.length) falla(`${rot}: errores de página (${errores[0].slice(0, 200)})`);
    await pag.close();
  }
  {
    const rot = 'Estado · saltos grandes (hoy=2026-10-02)', c = chk(rot);
    const { pag, errores } = await abrir(ctx, link({ hoy: HOY2, p: 'estado' }));
    try { await esperar(pag, '#cf-est-saltos button[data-dia]'); } catch { falla(`${rot}: no aparecieron los botones «Ver por qué»`); }
    const dias = await pag.evaluate(() => Array.from(document.querySelectorAll('#cf-est-saltos button[data-dia]')).map((b) => b.getAttribute('data-dia')));
    resumen.push(`saltos grandes (cargas): ${dias.join(', ')}`);
    c('3 cargas con saltos de más de 500 MM', dias.join(','), '2026-09-29,2026-09-30,2026-10-01');
    await pag.click('#cf-est-saltos button[data-dia="2026-09-29"]');
    try { await esperar(pag, '#cf-motivo-grupos'); c('«Ver por qué» → Pekín parado el 28/09 comparado con 29/09', (await texto(pag, '#cf-pk-a')) + ' ' + (await texto(pag, '#cf-pk-b')), '28/09 29/09'); c('suma de la carga del 29/09', await texto(pag, '#cf-motivo-suma'), 'suma ▼ −1.877,77 MM'); } catch { falla(`${rot}: «Ver por qué» no llegó a «Por motivo»`); }
    if (errores.length) falla(`${rot}: errores de página (${errores[0].slice(0, 200)})`);
    await pag.close();
  }
  await ctx.close();
}

// --- 3d. Granos (hoy=2026-09-29), Foto Albor, Dato crudo y Estado (hoy=2026-09-30) ------------
async function resto() {
  const ctx = await contexto(1280);
  {
    const rot = 'Granos (hoy=2026-09-29)', c = chk(rot);
    const { pag, errores } = await abrir(ctx, link({ p: 'granos', hoy: HOY_GR, sec: 'gstock,gdet,gfle' }));
    let sinDetalle = false;
    try { await pag.waitForFunction((re) => !!document.querySelector('#cf-gr-tabla') || Array.from(document.querySelectorAll('section[aria-label="Granos"] .aviso')).some((a) => new RegExp(re).test(a.textContent || '')), RE_RALEADO.source, { timeout: 60000 }); sinDetalle = !(await existe(pag, '#cf-gr-tabla')); } catch { falla(`${rot}: la tabla no apareció (${await texto(pag, '.err, #cf-error')})`); }
    if (sinDetalle) noCorrido(`${rot}: el detalle crudo de esa bajada ya no está guardado (raleado): el caso congelado de granos no se puede correr`);
    else {
      const leer = () => pag.evaluate(() => {
        const filas = Array.from(document.querySelectorAll('#cf-gr-tabla .tr:not(.th)')).map((f) => Array.from(f.children).map((x) => x.textContent.trim()));
        const fila = (n) => filas.find((f) => f[0].startsWith(n)) ?? [];
        return { titulo: document.querySelector('#sec-gmes span')?.textContent.trim(), stock: fila('Stock').slice(-1)[0], gcom: fila('Gastos').slice(-1)[0], cos: fila('Cosecha').slice(-1)[0], neto: fila('Neto').slice(-1)[0], fichas: document.querySelectorAll('#cf-gr-fichas .cf-gr-ficha').length, noCuadra: document.querySelectorAll('#cf-gr-fichas .cf-gr-nocuadra').length, det: document.querySelectorAll('#cf-gr-det .tr').length, chips: document.querySelectorAll('#cf-gr-chips button').length, meses: document.querySelectorAll('#cf-gr-tabla .th > span').length - 2, notas: Array.from(document.querySelectorAll('#cf-gr-tabla .cf-gr-nota')).map((n) => n.textContent), cards: document.querySelector('#cf-gr-cards')?.textContent.replace(/\s+/g, ' ') };
      });
      const g = await leer();
      resumen.push(`--- ${rot} ---`); resumen.push(`${g.titulo} · meses ${g.meses} · stock ${g.stock} · gastos ${g.gcom} · cosecha ${g.cos} · neto ${g.neto} · ${g.fichas} renglones de stock (${g.noCuadra} no cuadran) · ${g.det} de detalle`);
      c('meses', g.meses, 10); c('chips', g.chips, 9); c('Stock (total)', g.stock, '20.231,58'); c('Gastos comerciales (total)', g.gcom, '−8.885,64'); c('Cosecha (total)', g.cos, '−4.078,48'); c('Neto (total)', g.neto, '7.267,45');
      c('renglones de stock', g.fichas, 12); c('renglones que no cuadran', g.noCuadra, 2); c('renglones de gastos y cosecha', g.det, 29);
      c('nota de fletes del 16 (−311,44)', g.notas.some((n) => /−311,44 MM de fletes/.test(n)), true); c('nota de fletes sin grano (−272,57)', g.notas.some((n) => /−272,57 MM no dicen el grano/.test(n)), true);
      c('tarjeta Gastos comerciales dice los fletes', /fletes del 16 \(−311,44\)/.test(g.cards), true);
      await pag.click('#cf-gr-chips button[data-grano="Soja"]'); await pag.waitForFunction(() => /^Soja/.test(document.querySelector('#sec-gmes span')?.textContent ?? ''), null, { timeout: 10000 }).catch(() => {});
      const sj = await leer(); resumen.push(`Soja: stock ${sj.stock} · gastos ${sj.gcom} · cosecha ${sj.cos} · ${sj.fichas} renglones de stock · ${sj.det} de detalle`);
      c('Soja: stock', sj.stock, '8.363,74'); c('Soja: gastos', sj.gcom, '−4.774,85'); c('Soja: cosecha', sj.cos, '−2.494,75'); c('Soja: renglones de stock', sj.fichas, 2);
      c('Girasol AO es un chip aparte', await existe(pag, '#cf-gr-chips button[data-grano="Girasol AO"]'), true);
      c('el grano quedó en el link', /grano=Soja/.test(await pag.evaluate(() => location.hash)), true);
    }
    if (errores.length) falla(`${rot}: errores de página (${errores[0].slice(0, 200)})`);
    await foto(pag, 'granos'); await pag.close();
  }
  {
    const rot = 'Foto Albor (hoy=2026-09-30)', c = chk(rot);
    const { pag, errores } = await abrir(ctx, link({ p: 'albor', sec: 'cambios' }));
    try { await esperar(pag, '#cf-rxm-acum2'); await esperarTxt(pag, '#cf-contraste', /coincide|revisar|casi|horizonte/i); } catch { falla(`${rot}: rubro × mes o el contraste no aparecieron`); }
    const con = await texto(pag, '#cf-contraste'); resumen.push(`--- ${rot} ---`); resumen.push('contraste: ' + con.slice(0, 200));
    c('contraste 30/09 coincide, 0,07 MM, ninguna celda, bancos +36,75', /30\/09: coincide\. Diferencia de 0,07 MM sin contar bancos y ninguna celda a revisar\. Bancos da \+36,75/.test(con), true);
    const acum2 = await pag.evaluate(() => Array.from(document.querySelector('#cf-rxm-acum2')?.children ?? []).map((x) => x.textContent.replace(/\s+/g, ' ').trim()));
    c('acumulado sin el primer mes: sep —, oct −1.823,84', acum2[1] + ' ' + acum2[2], '— ▼ −1.823,84');
    const acum = await pag.evaluate(() => Array.from(document.querySelector('#cf-rxm-acum')?.children ?? []).map((x) => x.textContent.trim()));
    c('saldo a fin de mes: sep 1.280,38 · nov −1.060,76', acum[1] + ' ' + acum[3], '1.280,38 −1.060,76');
    const lun = await pag.evaluate(() => Array.from(document.querySelector('#cf-rxm-lunes')?.children ?? []).map((x) => x.textContent.replace(/\s+/g, ' ').trim()));
    c('saldo en la carga del lun 28/09 a fin de noviembre = −1.018,78', lun[0].startsWith('Saldo en la carga del lun 28/09') && lun[3] === '−1.018,78', true);
    const cam = await pag.evaluate(() => Array.from(document.querySelector('#cf-rxm-cambio')?.children ?? []).map((x) => x.textContent.replace(/\s+/g, ' ').trim()));
    c('cambió contra la carga del lunes en noviembre = ▼ −41,98', cam[3], '▼ −41,98');
    await pag.click('#cf-rxm [data-rxm="capa"]'); await pag.click('#cf-rxm [data-capa="comprometido"]');
    c('por capa: abre los rubros de Comprometido', await pag.evaluate(() => document.querySelectorAll('#cf-rxm .tr-hijo').length > 3), true);
    try { await esperar(pag, '#cf-control'); } catch { falla(`${rot}: el control de la mañana no apareció`); }
    const ctl = { v: await texto(pag, '#cf-ctrl-ventas .tbl-h'), cmp: await texto(pag, '#cf-ctrl-compras .tbl-h'), ad: await texto(pag, '#cf-ctrl-adicionales .tbl-h') };
    resumen.push('control: ' + [ctl.v, ctl.cmp, ctl.ad].join(' || '));
    if (RE_RALEADO.test(await texto(pag, 'section[aria-label="Foto Albor"]')) && !ctl.v) noCorrido(`${rot}: control de la mañana sin detalle crudo (raleado)`);
    else {
      c('ventas: 32 · +39,89', /32 comprobantes · ▲ \+39,89 MM/.test(ctl.v), true); c('compras: 19 · +1,39', /19 comprobantes · ▲ \+1,39 MM/.test(ctl.cmp), true);
      c('adicionales: 95 · −326,47 (la base en pesos; la maqueta decía −326,48)', /95 comprobantes · ▼ −326,47 MM/.test(ctl.ad), true);
      c('adicionales por rubro 12: 7 · −8,95 / 16: 44 · −311,44 / 17: 44 · −6,09', /12: 7 · −8,95 \/ 16: 44 · −311,44 \/ 17: 44 · −6,09/.test(ctl.ad), true);
      c('el 1º de ventas es tal cual Albor («LHA 2027 - VEN - 1044: VENTA 20 VAQ HOL RZO»)', /LHA 2027 - VEN - 1044: VENTA 20 VAQ HOL RZO/.test(await texto(pag, '#cf-ctrl-ventas .tr')), true);
    }
    try { await esperar(pag, '#cf-lunes'); } catch { falla(`${rot}: «Cambios en Albor» no apareció`); }
    const lunes = await pag.evaluate(() => Array.from(document.querySelectorAll('#cf-lunes .tr:not(.th)')).map((r) => Array.from(r.children).map((x) => x.textContent.replace(/\s+/g, ' ').trim())));
    c('lunes a lunes: la última fila es hoy y da −1.060,76', /^Hoy/.test(lunes[lunes.length - 1]?.[0] ?? '') && lunes[lunes.length - 1]?.[1] === '−1.060,76', true);
    c('no se muestran los textos editoriales de la maqueta (ELE)', /A corregir en Albor/.test(await texto(pag, 'section[aria-label="Foto Albor"]')), false);
    if (errores.length) falla(`${rot}: errores de página (${errores[0].slice(0, 200)})`);
    await foto(pag, 'albor'); await pag.close();
  }
  {
    const rot = 'Dato crudo (hoy=2026-09-30)', c = chk(rot);
    const { pag, errores, respuestas } = await abrir(ctx, link({ p: 'crudo', carga: '2026-09-27' }));
    try { await esperarTxt(pag, '#cf-crudo-arch', /filas/); } catch { falla(`${rot}: los archivos no aparecieron (${await texto(pag, '.err')})`); }
    const arch = await texto(pag, '#cf-crudo-arch'); resumen.push(`--- ${rot} ---`); resumen.push('archivos: ' + arch.slice(0, 300));
    c('A: CuboCashFlow_2026-09-28-02-23-07.xlsx · 6.117 filas', /CuboCashFlow_2026-09-28-02-23-07\.xlsx\s*6\.117 filas/.test(arch), true); c('B: GiorgiCashFlow_2026-09-28-02-25-28.xlsx · 3.775 filas', /GiorgiCashFlow_2026-09-28-02-25-28\.xlsx\s*3\.775 filas/.test(arch), true);
    c('«Abrir en Excel» apagado con el motivo', await pag.evaluate(() => Array.from(document.querySelectorAll('#cf-crudo-arch button[disabled]')).length === 2 && /se activa con el login de Microsoft/.test(document.querySelector('#cf-crudo-arch').textContent)), true);
    await pag.click('#cf-crudo-arch [data-crudo-ver="A"]');
    try { await esperar(pag, '#cf-crudo-tabla'); } catch { falla(`${rot}: «Ver acá» no mostró la tabla (${await texto(pag, '#cf-crudo-ver')})`); }
    c('Ver acá: 100 filas en la página 1', await pag.evaluate(() => document.querySelectorAll('#cf-crudo-tabla tbody tr').length), 100);
    c('Ver acá: filas 1–100 de 6.117', /Filas 1–100 de 6\.117/.test(await texto(pag, '#cf-crudo-ver .pag')), true);
    c('ninguna columna CBU / ID_Tercero / Observacion', await pag.evaluate(() => Array.from(document.querySelectorAll('#cf-crudo-tabla th')).some((t) => /^(CBU|ID_Tercero|Observaci)/.test(t.textContent))), false);
    await pag.fill('#cf-crudo-q', 'cargill'); await pag.press('#cf-crudo-q', 'Enter');
    try { await esperarTxt(pag, '#cf-crudo-ver .pag', /que dicen «cargill»/); ok(`${rot}: el buscador filtra (${await texto(pag, '#cf-crudo-ver .pag')})`); } catch { falla(`${rot}: el buscador no filtró`); }
    await pag.click('#cf-crudo-ver [data-crudo-q-limpiar]'); await pag.click('#cf-crudo-ver [data-crudo-pag="2"]');
    try { await esperarTxt(pag, '#cf-crudo-ver .pag', /Filas 101–200/); ok(`${rot}: página 2 = filas 101–200`); } catch { falla(`${rot}: la página 2 no apareció`); }
    try { await esperar(pag, '#cf-crudo-cols'); c('«Qué columnas trae» sale del encabezado (24, CBU en trigo)', await pag.evaluate(() => document.querySelectorAll('#cf-crudo-cols .chip').length === 24 && /CBU/.test(document.querySelector('#cf-crudo-cols .chip-rev')?.textContent)), true); } catch { falla(`${rot}: «Qué columnas trae» no apareció`); }
    // 3 cargas al azar: filas de la tabla = n_filas del archivo
    const dia = (n) => new Date(Date.UTC(2026, 6, 13) + n * 864e5).toISOString().slice(0, 10);
    const azar = [0, 1, 2].map(() => dia(Math.floor(Math.random() * 79)));   // del 13/07 al 29/09
    for (const carga of azar) {
      await pag.fill('#cf-crudo', carga); await pag.dispatchEvent('#cf-crudo', 'change');
      try { await esperarTxt(pag, '#cf-crudo-arch', /filas/); await pag.click('#cf-crudo-arch [data-crudo-ver="A"]'); await esperar(pag, '#cf-crudo-tabla'); } catch { falla(`${rot}: carga ${carga}: «Ver acá» no abrió`); continue; }
      const n1 = (await texto(pag, '#cf-crudo-arch')).match(/([\d.]+) filas/)?.[1], n2 = (await texto(pag, '#cf-crudo-ver .pag')).match(/de ([\d.]+)/)?.[1];
      resumen.push(`al azar ${carga}: archivo ${n1} filas · tabla dice ${n2}`);
      c(`carga al azar ${carga}: filas de la tabla = n_filas del archivo`, n2, n1);
    }
    c('respuestas de crudo_filas vistas', respuestas.length > 0, true);
    c('ninguna respuesta de crudo_filas con 22 dígitos', respuestas.some((r) => /\d{22}/.test(r.body)), false);
    c('ninguna con la clave "cbu"', respuestas.some((r) => /"cbu"/.test(r.body)), false);
    c('ninguna con storage_path / http', respuestas.some((r) => /storage_path|https?:/.test(r.body)), false);
    c('ninguna consulta lleva ?k=', respuestas.some((r) => /[?&]k=/.test(r.url)), false);
    if (errores.length) falla(`${rot}: errores de página (${errores[0].slice(0, 200)})`);
    await foto(pag, 'crudo'); await pag.close();
  }
  for (const [dia, esp] of [['2026-09-29', { bancos: '+21,80', dias: '58 días', hora: '08:35' }], ['2026-09-30', { bancos: '+36,75', dias: '59 días', hora: '08:39' }]]) {
    const rot = `Estado de la web (hoy=${dia})`;
    const { pag, errores } = await abrir(ctx, link({ p: 'estado', hoy: dia }));
    try { await esperar(pag, '#cf-est-checks'); } catch { falla(`${rot}: los controles no aparecieron (${await texto(pag, '.err, #cf-error')})`); }
    const e = await pag.evaluate(() => ({ c1: document.querySelector('#cf-est-contraste')?.textContent.replace(/\s+/g, ' ').trim(), c1dot: document.querySelector('#cf-est-contraste .dot')?.className, c2: document.querySelector('#cf-est-integridad')?.textContent.replace(/\s+/g, ' ').trim(), c2dot: document.querySelector('#cf-est-integridad .dot')?.className, c3: document.querySelector('#cf-est-incidentes')?.textContent.replace(/\s+/g, ' ').trim(), bit: Array.from(document.querySelectorAll('#cf-est-bitacora .bit > div')).map((d) => d.textContent.replace(/\s+/g, ' ').trim()) }));
    resumen.push(`--- ${rot} ---`); resumen.push(`1) ${e.c1.slice(0, 200)}`); resumen.push(`2) ${e.c2.slice(0, 160)}`); resumen.push(`3) ${e.c3.slice(0, 160)}`); resumen.push(`bitácora: ${e.bit.join(' | ')}`);
    const has = (nombre, txt, re) => { if (!re.test(txt)) falla(`${rot}: ${nombre} no dice ${re} ("${txt.slice(0, 160)}")`); else ok(`${rot}: ${nombre} ${re}`); };
    has('control 1', e.c1, /^1 · Coincide con administración/); has('control 1', e.c1, new RegExp(dia.slice(8) + '/' + dia.slice(5, 7) + ', ' + esp.hora)); has('control 1', e.c1, /diferencia 0,07 MM sin contar bancos, ninguna celda a revisar/); has('control 1', e.c1, new RegExp('Bancos da ' + esp.bancos.replace('+', '\\+')));
    if (!/dot ok/.test(e.c1dot)) falla(`${rot}: el punto del control 1 no es verde (${e.c1dot})`);
    has('control 2', e.c2, /^2 · Los datos guardados están bien/); has('control 2', e.c2, new RegExp('Desde el 14/07 se guardaron los datos de ' + esp.dias + '; ninguno se modificó después. La de hoy se controló a las 07:30'));
    if (!/dot ok/.test(e.c2dot)) falla(`${rot}: el punto del control 2 no es verde (${e.c2dot})`);
    if (e.bit.length !== 10) falla(`${rot}: la bitácora tiene ${e.bit.length} días y no 10`); else ok(`${rot}: bitácora de 10 días hábiles`);
    if (!/22\/09\s*Revisar/.test(e.bit.join(' | '))) falla(`${rot}: la bitácora no marca el 22/09 como Revisar`);
    if (errores.length) falla(`${rot}: errores de página (${errores[0].slice(0, 200)})`);
    await foto(pag, `estado_${dia}`); await pag.close();
  }
  {
    const rot = 'Notas (solo en este aparato)', c = chk(rot);
    const { pag, errores } = await abrir(ctx, link({ p: 'notas' }));
    try { await esperar(pag, '#cf-nota-xl'); } catch { falla(`${rot}: la pantalla no apareció`); }
    c('rótulo «Solo en este aparato · todavía no se comparten»', /Solo en este aparato · todavía no se comparten/.test(await texto(pag, 'section[aria-label="Notas"]')), true);
    await pag.fill('#cf-nota-xl', 'Nota de prueba <b>sin html</b> ' + Date.now()); await pag.click('[data-nota-guardar="cf-nota-xl"]');
    c('la nota aparece en la lista', /Nota de prueba/.test(await texto(pag, '#cf-notas-lista-xl')), true);
    c('el texto va plano (no se interpreta HTML)', await pag.evaluate(() => !document.querySelector('#cf-notas-lista-xl b')), true);
    await pag.click('.lat [data-notas-ab]');
    c('en la columna también', /Nota de prueba/.test(await texto(pag, '#cf-notas-lista')), true);
    await pag.evaluate(() => { try { localStorage.removeItem('cf_notas'); } catch (e) { /* noop */ } });
    if (errores.length) falla(`${rot}: errores de página (${errores[0].slice(0, 200)})`);
    await pag.close();
  }
  await ctx.close();
}

// --- 4. Clave mal y una ruta que falla --------------------------------------------------------
async function errores() {
  {
    const rot = 'Clave mal';
    const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 } });
    if (!URL_PUBLICADA) await ctx.route('https://tablero.local/**', (r) => r.request().url().endsWith('.svg') ? r.fulfill({ status: 200, contentType: 'image/svg+xml', body: svg }) : r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html }));
    const pag = await ctx.newPage();
    await pag.goto(base + '?k=no-es-la-clave#prueba=1&hoy=' + HOY, { waitUntil: 'domcontentloaded' });
    try { await esperarTxt(pag, '#cf-error', /clave/i, 30000); ok(`${rot}: la página lo dice («${(await texto(pag, '#cf-error')).slice(0, 90)}…»)`); } catch { falla(`${rot}: la página no avisó que la clave no es válida (${await texto(pag, '#app')})`); }
    await pag.close(); await ctx.close();
  }
  {
    const rot = 'Una ruta que falla (vencimientos simulada en 500): ese bloque avisa y el resto sigue';
    const ctx = await contexto(1280, 'vencimientos');
    const { pag, errores } = await abrir(ctx, link({ p: 'proy', sec: 'venc' }));
    try { await esperar(pag, '#cf-c-fe'); await esperarTxt(pag, '#sec-venc ~ p.err, section[aria-label="Saldo proyectado"] .err', /Error simulado/); ok(`${rot}`); } catch { falla(`${rot}: no se vio el aviso del bloque (${(await texto(pag, 'section[aria-label="Saldo proyectado"]')).slice(0, 200)})`); }
    if (num(await texto(pag, '#cf-c-fe')) !== '-1.060,76') falla(`${rot}: la tarjeta grande no siguió (${await texto(pag, '#cf-c-fe')})`);
    if (errores.length) falla(`${rot}: errores de página (${errores[0].slice(0, 200)})`);
    await pag.close(); await ctx.close();
  }
}

await recorrer(375);
await recorrer(1280);
await inicioYProy();
await pekin();
await porMotivo();
await resto();
await errores();
await nav.close();

console.log(resumen.join('\n'));
console.log(`duración             : ${((Date.now() - t0) / 1000).toFixed(1)} s`);
console.log(`comprobaciones       : ${resumen.filter((l) => l.startsWith('  ok  ')).length} ok, ${fallas.length} mal, ${noCorridos.length} no corridas`);
if (noCorridos.length) {
  console.log('\nNO SE PUDO CORRER:\n  - ' + noCorridos.join('\n  - '));
  if (noCorridos.some((t) => /Granos/.test(t))) console.log('AVISO: GRANOS_SIN_DETALLE');
  if (noCorridos.some((t) => /raleado/.test(t) && !/Granos/.test(t))) console.log('AVISO: DETALLE_RALEADO');
}
if (!fallas.length) console.log(noCorridos.length ? '\nTodo OK (con casos que no se pudieron correr).' : '\nTodo OK.');
else console.log('\nFALLA:\n  - ' + fallas.join('\n  - '));
process.exit(fallas.length ? 1 : 0);
