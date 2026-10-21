import assert from 'node:assert/strict';
import path from 'node:path';
import * as fontkit from 'fontkit';
import { read, source } from '../scripts/project.mjs';

const css = await read('styles.css');
const html = await read('index.html');
const faces = await read('fonts.css');
const fonts = [
  ['Onest', 'onest-variable.ttf', 'ONEST-OFL.txt', 600],
  ['Golos Text', 'golos-text-variable.ttf', 'GOLOS-TEXT-OFL.txt', 400],
  ['Nunito', 'nunito-variable.ttf', 'NUNITO-OFL.txt', 700]
];
const instances = new Map();
for (const [name, file, license, weight] of fonts) {
  const font = fontkit.openSync(path.join(source, 'assets/fonts', file));
  assert(font.familyName.startsWith(name));
  assert(font.variationAxes.wght.min <= weight && font.variationAxes.wght.max >= weight);
  assert((await read(`assets/fonts/${license}`)).includes('SIL OPEN FONT LICENSE'));
  for (const character of 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя0123456789₽') {
    assert(font.hasGlyphForCodePoint(character.codePointAt(0)), `${name} missing ${character}`);
  }
  assert(html.includes(`href="assets/fonts/${file}" as="font"`));
  assert(faces.includes(`font-family:'${name}'`));
  instances.set(name, font.getVariation({ wght: weight }));
}
function advance(name, text) {
  const font = instances.get(name);
  return [...text].reduce((sum, character) => sum + font.glyphForCodePoint(character.codePointAt(0)).advanceWidth, 0) / font.unitsPerEm;
}
assert(css.includes("--heading:'Onest',var(--sans)"));
assert(css.includes("--sans:'Golos Text','Geist',Arial,sans-serif"));
assert(css.includes("font:700 32px/1.1 'Nunito',var(--sans)"));
assert(html.includes('class="brand-lockup">serkova<small'));
assert(advance('Nunito', 'serkova') * 32 + 54 + 8 <= 280);
assert(advance('Golos Text', 'Записаться на приём') * 20 <= 226);
assert(advance('Golos Text', '+7 978 808 84 92') * 24 + 32 <= 280);
const heroWidths = ['СОФИЯ', 'СЕРКОВА'].map(word => advance('Onest', word));
let checks = 0;
for (let viewport = 320; viewport <= 1920; viewport++) {
  const wrap = Math.min(1264, viewport - (viewport <= 760 ? 40 : viewport <= 1100 ? 72 : 112));
  const container = viewport <= 767 ? wrap : wrap * .55;
  let sizes = viewport <= 767 ? [viewport <= 340 ? 52 : viewport <= 390 ? 56 : 64] :
    viewport <= 1000 ? [94, 74] : viewport <= 1100 ? [126, 100] : viewport <= 1300 ? [136, 108] : [162, 126];
  if (sizes.length === 1) sizes = [sizes[0], sizes[0]];
  for (const height of [600, 800, 1034, 1180]) {
    const actual = height <= 650 ? (viewport <= 767 ? [48, 48] : [94, 74]) : sizes;
    heroWidths.forEach((width, index) => assert(width * actual[index] <= container, `Hero text at ${viewport}x${height}`));
    checks += 2;
  }
  if (viewport <= 1100) {
    const size = viewport <= 767 ? (viewport <= 340 ? 32 : viewport <= 390 ? 36 : 40) : viewport <= 850 ? 32 : viewport <= 1000 ? 36 : 44;
    assert(advance('Onest', 'Восстановление.') * size <= (viewport <= 767 ? wrap : wrap * .46), `Touch text at ${viewport}`);
    if (viewport <= 767) assert(advance('Onest', 'БЛАГОДАРНОСТИ') * (viewport <= 340 ? 30 : viewport <= 390 ? 32 : 38) <= wrap);
  }
}
console.log(`Three font identities, Cyrillic, licenses, controls and ${checks} hero glyph-width checks passed (not browser QA).`);
