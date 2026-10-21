const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('dist/script.js', 'utf8');
const css = fs.readFileSync('dist/styles.css', 'utf8');
const html = fs.readFileSync('dist/index.html', 'utf8');
function node(attrs = {}) {
  const handlers = new Map();
  const attributes = new Map(Object.entries(attrs));
  const classes = new Set();
  const properties = new Map();
  return {
    handlers, attributes, classes, inert: false, offsetParent: {},
    style: { scrollBehavior: '', setProperty: (key, value) => properties.set(key, value),
      removeProperty: key => properties.delete(key) },
    properties,
    classList: { add: value => classes.add(value), remove: value => classes.delete(value), contains: value => classes.has(value) },
    addEventListener: (key, callback) => handlers.set(key, callback),
    getAttribute: key => attributes.get(key),
    setAttribute: (key, value) => attributes.set(key, value),
    removeAttribute: key => attributes.delete(key),
    closest() { return null; },
    getBoundingClientRect: () => ({ height: 844 }),
    focus() { document.activeElement = this; }
  };
}
const button = node({ 'aria-expanded': 'false' });
const wordmark = node({ href: '#home' });
wordmark.hash = '#home';
const links = ['approach', 'services', 'questions', 'contact'].map(id => Object.assign(node({ href: `#${id}` }), { hash: `#${id}` }));
const nav = Object.assign(node(), { hidden: true, inert: true, querySelectorAll: () => links });
const header = Object.assign(node(), { querySelector: () => wordmark, querySelectorAll: () => [wordmark, button, ...links] });
const background = [node(), node(), node(), node()];
background[3].inert = true;
const root = node();
let repeatedAnchor = null;
const document = Object.assign(node(), {
  documentElement: root, activeElement: button,
  getElementById: id => ({ scrollIntoView() { repeatedAnchor = id; } }),
  querySelector: selector => ({ '.menu-toggle': button, '#mobile-nav': nav, '.header': header })[selector],
  querySelectorAll: () => background
});
const timers = new Map();
let timerId = 0;
const desktop = Object.assign(node(), { matches: false });
const reduced = Object.assign(node(), { matches: false });
const window = Object.assign(node(), {
  scrollY: 317, location: { hash: '#home' },
  matchMedia: query => query.includes('prefers-reduced-motion') ? reduced : desktop,
  setTimeout(fn) { const id = ++timerId; timers.set(id, fn); return id; },
  clearTimeout: id => timers.delete(id),
  scrollTo(_x, y) { this.scrollY = y; }
});
vm.runInNewContext(source.slice(0, source.indexOf('\nconst filterButtons')), { document, window });
let checks = 0;
function check(value, label) { assert(value, label); checks++; }
const toggle = () => button.handlers.get('click')();
const endTransition = () => nav.handlers.get('transitionend')({ target: nav, propertyName: 'transform' });
const event = extra => ({ prevented: false, preventDefault() { this.prevented = true; }, ...extra });

toggle();
check(!nav.hidden && !nav.inert && button.attributes.get('aria-expanded') === 'true', 'Menu opens');
check(root.classes.has('menu-visible') && root.classes.has('menu-open'), 'The overlay locks the page and starts its transition');
check(root.properties.get('--menu-scroll-offset') === '-317px', 'Page position is preserved when locked');
check(background.every(element => element.inert), 'Background is inert');
check(header.attributes.get('role') === 'dialog' && header.attributes.get('aria-modal') === 'true', 'Modal semantics include the close button');
endTransition();
check(!nav.hidden, 'Entrance transition does not close the menu');
document.activeElement = links[3];
let key = event({ key: 'Tab' });
document.handlers.get('keydown')(key);
check(key.prevented && document.activeElement === wordmark, 'Tab wraps inside the menu');
key = event({ key: 'Tab', shiftKey: true });
document.handlers.get('keydown')(key);
check(key.prevented && document.activeElement === links[3], 'Shift+Tab wraps inside the menu');
key = event({ key: 'Escape' });
document.handlers.get('keydown')(key);
check(!nav.hidden && nav.inert && !root.classes.has('menu-open'), 'Escape begins an animated exit');
endTransition();
check(nav.hidden && !root.classes.has('menu-visible'), 'Exit completes and unlocks the page');
check(window.scrollY === 317 && document.activeElement === button, 'Escape restores page position and focus');
check(!background[0].inert && background[3].inert, 'Original inert states are restored');
check(!header.attributes.has('role') && !header.attributes.has('aria-modal'), 'Header returns to its banner role');

toggle();
const click = event({ currentTarget: links[1] });
links[1].handlers.get('click')(click);
check(click.prevented && window.location.hash === '#home', 'Anchor navigation waits for the exit animation');
endTransition();
check(nav.hidden && window.location.hash === '#services', 'Anchor navigation happens after unlocking');
toggle();
links[1].handlers.get('click')(event({ currentTarget: links[1] }));
endTransition();
check(repeatedAnchor === 'services', 'Selecting the current hash scrolls back to the section');

toggle();
toggle();
toggle();
endTransition();
check(!nav.hidden && root.classes.has('menu-open') && timers.size === 0, 'A quick reopen cancels the pending close');
toggle();
const fallback = [...timers.values()][0];
fallback();
check(nav.hidden && !root.classes.has('menu-visible'), 'Timer fallback completes an interrupted transition');

reduced.matches = true;
toggle();
toggle();
check(nav.hidden && timers.size === 0, 'Reduced motion closes immediately');
reduced.matches = false;
toggle();
desktop.handlers.get('change')({ matches: true });
check(nav.hidden && !root.classes.has('menu-visible'), 'Changing to desktop unlocks the page immediately');

toggle();
document.handlers.get('click')({ target: { closest: () => null } });
endTransition();
check(nav.hidden, 'An outside click closes the menu');
toggle();
toggle();
reduced.handlers.get('change')({ matches: true });
check(nav.hidden, 'Enabling reduced motion while closing finalizes the exit');

check(/\.header\{[^}]*position:absolute/.test(css), 'Only the main non-fixed header remains when closed');
check(!css.includes('is-compact') && !source.includes('updateHeader'), 'Compact header remains removed');
check(!html.includes('brand-monogram'), 'Monogram remains removed');
check(/\.has-story-motion \.story-stage\{[^}]*top:0/.test(css), 'Pinned story reserves no header space');
check(source.includes('(min-width: 1101px)') && css.includes('@media(max-width:1100px)'), 'Tablet breakpoint matches CSS and JavaScript');
check(/\.menu-toggle\{[^}]*color:var\(--rose\)/.test(css), 'Toggle uses brand rose #B4656F');
check(css.includes('.menu-toggle svg{width:36px;height:36px;stroke-width:1.5}'), 'Menu lines are longer');
check(css.includes('translateY(7px) rotate(45deg)') && css.includes('translateY(-7px) rotate(-45deg)'), 'Lucide menu paths morph to a cross');
check(/\.mobile-nav\{[^}]*position:fixed;inset:0;[^}]*height:100dvh/.test(css), 'Overlay fills the viewport');
check(css.includes('transform:translate3d(0,-100%,0)') && css.includes('transition:transform .85s cubic-bezier(.4,0,.2,1)'), 'Overlay eases in and out smoothly over 850ms');
check(source.includes('window.setTimeout(finishMenuClose, 900)'), 'Close fallback cannot truncate the longer transition');
check(!source.includes("window.addEventListener('scroll', () => {\n  if (!mobileNav.hidden)"), 'Scrolling the overlay does not dismiss it');
console.log(`${checks} fullscreen menu and main-header checks passed`);
