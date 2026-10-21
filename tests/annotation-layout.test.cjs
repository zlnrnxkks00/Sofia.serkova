const assert = require('node:assert/strict');
const fs = require('node:fs');
const root = 'dist/';
const html = fs.readFileSync(root + 'index.html', 'utf8');
const css = fs.readFileSync(root + 'styles.css', 'utf8');
assert(html.includes('data-counter="28">28</span><span class="fact-plus">+</span>'));
assert.equal((html.match(/class="fact-plus"/g) || []).length, 3);
assert(css.includes('.fact-plus{font-size:30px;color:var(--rose);vertical-align:top}'));
for (const [limit, size] of [[1100, 44], [1000, 36], [850, 32]]) {
  const start = css.lastIndexOf(`@media(min-width:768px) and (max-width:${limit}px){`);
  assert(start > 0);
  const rule = css.slice(start, css.indexOf('\n}', start));
  assert(rule.includes(`.touch-scene.viewport-section .touch-inner h2{font-size:${size}px`));
  assert(!rule.includes('>img'), 'Tablet fix adjusts text, never the portrait');
}
assert(css.includes('font-size:44px;line-height:1.12;max-width:46%'));
assert(css.includes('.story{--story-gutter:56px}'));
assert(css.includes('.story{--story-gutter:36px}'));
assert(css.includes('.story{--story-gutter:20px}'));
assert(css.includes('.touch-scene.viewport-section>img{height:100%;width:auto;max-width:100%;object-fit:contain;object-position:right bottom}'));
console.log('Statistic plus, responsive text-only tablet fix, preserved portrait and scene gutters passed');
