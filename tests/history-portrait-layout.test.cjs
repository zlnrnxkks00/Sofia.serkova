const assert = require('node:assert/strict');
const fs = require('node:fs');
const sharp = require('sharp');
const root = 'dist/';
const html = fs.readFileSync(root + 'index.html', 'utf8');
const css = fs.readFileSync(root + 'styles.css', 'utf8');
assert(css.includes('@media(min-width:768px){\n  .personal-history.viewport-section .history-media img[data-history-media="portrait"],.personal-history.viewport-section .history-media img[data-history-media="closing"]{object-fit:cover;object-position:center top}'));
assert(css.includes('object-fit:contain;object-position:center;background:#f6eff1'));
assert(html.includes('data-history-image="closing" data-history-caption="Любимое дело"'));
assert(html.includes('src="assets/history-education.webp"') && html.includes('src="assets/history-face.webp"') && html.includes('src="assets/massage-scene.webp"'));
async function main() {
  for (const name of ['portrait', 'closing']) {
    const path = root + `assets/history-${name}-blush.webp`;
    assert(html.includes(`src="assets/history-${name}-blush.webp"`));
    const metadata = await sharp(path).metadata();
    assert.equal(metadata.width, 1080);
    assert.equal(metadata.height, 1440);
    assert(!metadata.hasAlpha, 'Background is opaque, without transparent edges');
    for (const left of [0, 1060]) {
      const pixels = await sharp(path).extract({left, top: 0, width: 20, height: 20}).removeAlpha().raw().toBuffer();
      const sums = [0, 0, 0];
      for (let i = 0; i < pixels.length; i++) sums[i % 3] += pixels[i];
      const [r, g, b] = sums.map(sum => sum / 400);
      assert(r > 225 && g > 215 && b > 220, 'Background stays delicate and light');
      assert(r > g + 3 && b > g, 'Backdrop has a powder-rose tone, not green');
    }
  }
  console.log('Two blush portraits, light non-green opaque edges, both desktop portraits cover/top crop, preserved mobile contain and other images passed (offline)');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
