'use strict';
if (window.lucide) window.lucide.createIcons();

const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
const menuHeader = document.querySelector('.header');
const menuRoot = document.documentElement;
const menuBackground = [...document.querySelectorAll('body > :not(.header):not(script)')];
const menuReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let menuOpen = false;
let menuScroll = 0;
let menuCloseTimer;
let menuCloseAction;
const menuInertState = new Map();

function setMenuButton(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  menuButton.title = open ? 'Закрыть меню' : 'Открыть меню';
}
function finishMenuClose() {
  if (menuOpen || mobileNav.hidden) return;
  window.clearTimeout(menuCloseTimer);
  mobileNav.hidden = true;
  menuHeader.removeAttribute('role');
  menuHeader.removeAttribute('aria-modal');
  menuHeader.removeAttribute('aria-label');
  const previousScrollBehavior = menuRoot.style.scrollBehavior;
  menuRoot.style.scrollBehavior = 'auto';
  menuRoot.classList.remove('menu-visible');
  menuRoot.style.removeProperty('--menu-scroll-offset');
  menuInertState.forEach((value, element) => { element.inert = value; });
  menuInertState.clear();
  window.scrollTo(0, menuScroll);
  menuRoot.style.scrollBehavior = previousScrollBehavior;
  const action = menuCloseAction;
  menuCloseAction = null;
  if (action?.hash) {
    if (window.location.hash === action.hash) {
      document.getElementById(decodeURIComponent(action.hash.slice(1)))?.scrollIntoView();
    } else window.location.hash = action.hash;
  }
  else if (action?.restoreFocus) menuButton.focus({ preventScroll: true });
}
function closeMenu(action = {}) {
  if (mobileNav.hidden) return;
  menuOpen = false;
  menuCloseAction = action;
  mobileNav.inert = true;
  menuRoot.classList.remove('menu-open');
  setMenuButton(false);
  window.clearTimeout(menuCloseTimer);
  if (action.immediate || menuReducedMotion.matches) finishMenuClose();
  else menuCloseTimer = window.setTimeout(finishMenuClose, 900);
}
function openMenu() {
  window.clearTimeout(menuCloseTimer);
  menuCloseAction = null;
  if (mobileNav.hidden) {
    menuScroll = window.scrollY;
    menuRoot.style.setProperty('--menu-scroll-offset', `${-menuScroll}px`);
    menuBackground.forEach(element => {
      menuInertState.set(element, element.inert);
      element.inert = true;
    });
  }
  menuOpen = true;
  mobileNav.hidden = false;
  mobileNav.inert = false;
  menuRoot.classList.add('menu-visible');
  menuHeader.setAttribute('role', 'dialog');
  menuHeader.setAttribute('aria-modal', 'true');
  menuHeader.setAttribute('aria-label', 'Меню сайта');
  setMenuButton(true);
  // Commit the off-screen position before starting the entrance transition.
  mobileNav.getBoundingClientRect();
  menuRoot.classList.add('menu-open');
  menuButton.focus({ preventScroll: true });
}
menuButton.addEventListener('click', () => {
  if (menuOpen) closeMenu({ restoreFocus: true });
  else openMenu();
});
mobileNav.addEventListener('transitionend', event => {
  if (event.target === mobileNav && event.propertyName === 'transform') finishMenuClose();
});
function menuLinkClick(event) {
  const link = event.currentTarget;
  if (link.hash && link.getAttribute('href').startsWith('#')) {
    event.preventDefault();
    closeMenu({ hash: link.hash });
  } else closeMenu();
}
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', menuLinkClick));
menuHeader.querySelector('.wordmark').addEventListener('click', event => {
  if (menuOpen) menuLinkClick(event);
});
document.addEventListener('keydown', event => {
  if (!menuOpen) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeMenu({ restoreFocus: true });
  } else if (event.key === 'Tab') {
    const items = [...menuHeader.querySelectorAll('a[href],button:not([disabled])')]
      .filter(element => element.offsetParent !== null && !element.closest('[inert]'));
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});
document.addEventListener('click', event => {
  if (menuOpen && !event.target.closest('.header')) closeMenu({ restoreFocus: true });
});
window.matchMedia('(min-width: 1101px)').addEventListener('change', event => {
  if (event.matches) closeMenu({ immediate: true });
});
menuReducedMotion.addEventListener('change', event => {
  if (event.matches && !menuOpen) finishMenuClose();
});

const filterButtons = document.querySelectorAll('[data-filter]');
const priceRows = document.querySelectorAll('[data-category]');
function setupServiceDescription(row) {
  const toggle = row.querySelector('.service-toggle');
  const description = row.querySelector('.service-description');
  let open = false;
  function render() {
    description.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.title = open ? 'Скрыть описание' : 'Описание услуги';
    row.classList.toggle('is-expanded', open);
  }
  function close() {
    open = false;
    render();
  }
  toggle.disabled = false;
  toggle.addEventListener('click', () => {
    open = !open;
    render();
  });
  row.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    toggle.focus();
    close();
  });
  document.addEventListener('click', event => {
    if (!row.contains(event.target)) close();
  });
  render();
  return close;
}
document.documentElement.classList.add('has-service-disclosures');
const closeServiceDescriptions = [...priceRows].map(setupServiceDescription);
filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    closeServiceDescriptions.forEach(close => close());
    filterButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    priceRows.forEach(row => {
      row.hidden = button.dataset.filter !== 'all' && row.dataset.category !== button.dataset.filter;
    });
  });
});

function setupReviews() {
  const section = document.querySelector('#reviews');
  let images;
  try { images = JSON.parse(document.querySelector('#review-images').textContent); }
  catch { return; }
  if (!Array.isArray(images)) return;
  images = images.filter(path => typeof path === 'string' && path.startsWith('assets/reviews/') && !path.includes('..'));
  if (!images.length) return;
  const gallery = section.querySelector('.reviews-grid');
  const viewer = section.querySelector('.review-viewer');
  const fullImage = viewer.querySelector('img');
  const counter = viewer.querySelector('.review-counter');
  let current = 0;
  let opener;
  function show(index) {
    current = (index + images.length) % images.length;
    fullImage.src = images[current];
    fullImage.alt = `Отзыв ${current + 1}`;
    counter.textContent = `${current + 1} / ${images.length}`;
  }
  images.forEach((path, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'review-item';
      button.title = `Открыть отзыв ${index + 1}`;
      const image = document.createElement('img');
      image.src = path;
      image.alt = `Скриншот отзыва ${index + 1}`;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.width = 170;
      image.height = 226;
      button.append(image);
      button.addEventListener('click', () => {
        opener = button;
        show(index);
        viewer.showModal();
      });
      gallery.append(button);
  });
  viewer.querySelector('[data-review-prev]').addEventListener('click', () => show(current - 1));
  viewer.querySelector('[data-review-next]').addEventListener('click', () => show(current + 1));
  viewer.querySelector('[data-review-close]').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(current + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  viewer.addEventListener('close', () => opener?.focus());
  section.hidden = false;
}
setupReviews();

function setupHistory() {
  const section = document.querySelector('#my-history');
  const entries = [...section.querySelectorAll('[data-history-image]')];
  const images = [...section.querySelectorAll('[data-history-media]')];
  const caption = section.querySelector('.history-caption');
  let selection = 0;
  function selectEntry(entry) {
    const image = images.find(item => item.dataset.historyMedia === entry.dataset.historyImage);
    if (!image) return;
    entries.forEach(item => {
      item.classList.toggle('is-active', item === entry);
      item.setAttribute('aria-pressed', String(item === entry));
    });
    const version = ++selection;
    function show() {
      if (version !== selection) return;
      images.forEach(item => {
        item.classList.toggle('is-active', item === image);
        item.setAttribute('aria-hidden', String(item !== image));
      });
      caption.textContent = entry.dataset.historyCaption;
    }
    if (image.complete && image.naturalWidth) show();
    else image.decode().then(show).catch(() => {});
  }
  entries.forEach(entry => {
    entry.disabled = false;
    entry.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') selectEntry(entry); });
    entry.addEventListener('focus', () => selectEntry(entry));
    entry.addEventListener('click', () => selectEntry(entry));
  });
  selectEntry(entries[0]);
}
setupHistory();

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const flowingStory = window.matchMedia('(max-width: 1100px), (max-height: 650px)');
const story = document.querySelector('.story');
const storyStage = document.querySelector('.story-stage');
const storyPanels = [...document.querySelectorAll('[data-story-panel]')];
const storyButtons = [...document.querySelectorAll('[data-story-step]')];
const storyImage = document.querySelector('.story-image');
const storyImages = [...document.querySelectorAll('[data-story-image]')];
const storyProgress = document.querySelector('.story-progress > span');
const hero = document.querySelector('.hero');
const heroImage = document.querySelector('.hero-image');
const chapterLinks = [...document.querySelectorAll('.desktop-nav a')];
let motionEnabled = false;
let storyMotionEnabled = false;
let framePending = false;
let activeStoryStep = -1;
let revealObserver;

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

function setStoryStep(index) {
  if (index === activeStoryStep) return;
  activeStoryStep = index;
  storyImages.forEach((image, i) => image.classList.toggle('is-active', i === index));
  storyPanels.forEach((panel, i) => {
    const active = i === index;
    panel.classList.toggle('is-active', active);
    panel.setAttribute('aria-hidden', String(!active));
    panel.inert = !active;
  });
  storyButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
}

function paintScroll() {
  framePending = false;
  const viewportHeight = window.innerHeight;
  let currentChapter = null;
  chapterLinks.forEach(link => {
    const section = document.querySelector(link.getAttribute('href'));
    if (section.getBoundingClientRect().top <= viewportHeight * 0.25) currentChapter = link;
  });
  chapterLinks.forEach(link => {
    if (link === currentChapter) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  if (!motionEnabled) return;

  const storyBounds = story.getBoundingClientRect();
  if (storyMotionEnabled) {
    // Native sticky positioning keeps the scene pinned; only the visual state follows scroll.
    const storyDistance = story.offsetHeight - storyStage.offsetHeight;
    const amount = storyDistance > 0 ? clamp(-storyBounds.top / storyDistance) : 0;
    setStoryStep(Math.min(2, Math.floor(amount * 3)));
    if (storyBounds.bottom > 0 && storyBounds.top < viewportHeight) {
      storyProgress.style.transform = `scaleX(${amount})`;
      storyImages.forEach(image => {
        image.style.transform = `translate3d(${-amount * 28}px, 0, 0) scale(${1.025 + amount * 0.1})`;
      });
    }
  } else if (storyBounds.bottom > 0 && storyBounds.top < viewportHeight) {
    const amount = clamp((viewportHeight - storyBounds.top) / (viewportHeight + storyBounds.height));
    storyImage.style.transform = `translate3d(${-amount * 14}px, 0, 0) scale(${1.025 + amount * .05})`;
  }

}

function requestScrollPaint() {
  if (framePending) return;
  framePending = true;
  window.requestAnimationFrame(paintScroll);
}

function configureMotion() {
  motionEnabled = !reducedMotion.matches && CSS.supports('position', 'sticky');
  document.documentElement.classList.toggle('has-motion', motionEnabled);
  storyMotionEnabled = motionEnabled && !flowingStory.matches;
  document.documentElement.classList.toggle('has-story-motion', storyMotionEnabled);
  revealObserver?.disconnect();
  activeStoryStep = -1;
  if (motionEnabled) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('[data-reveal]:not(.is-visible)').forEach(element => revealObserver.observe(element));
    if (storyMotionEnabled) setStoryStep(0);
  } else {
    document.querySelectorAll('[data-reveal]').forEach(element => element.classList.add('is-visible'));
    storyPanels.forEach(panel => {
      panel.removeAttribute('aria-hidden');
      panel.inert = false;
      panel.classList.remove('is-active');
    });
    [heroImage, ...storyImages].forEach(element => element.style.removeProperty('transform'));
  }
  if (!storyMotionEnabled) {
    storyImages.forEach((image, i) => {
      image.classList.toggle('is-active', i === 0);
      image.style.removeProperty('transform');
    });
    storyPanels.forEach(panel => {
      panel.removeAttribute('aria-hidden');
      panel.inert = false;
      panel.classList.remove('is-active');
    });
    storyImage.style.removeProperty('transform');
  }
  sectionEnergies.forEach(energy => energy.setMotion(motionEnabled));
  requestScrollPaint();
}

storyButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    if (!storyMotionEnabled) return;
    const storyTop = story.getBoundingClientRect().top + window.scrollY;
    const distance = story.offsetHeight - storyStage.offsetHeight;
    window.scrollTo({ top: storyTop + distance * ((index + 0.15) / 3), behavior: 'smooth' });
  });
  button.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const next = clamp(index + (event.key === 'ArrowRight' ? 1 : -1), 0, 2);
    storyButtons[next].focus();
    storyButtons[next].click();
  });
});

const counterStates = new WeakMap();
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const element = entry.target;
    const target = Number(element.dataset.counter);
    const state = counterStates.get(element) || { visible: false, frame: 0 };
    counterStates.set(element, state);
    if (!entry.isIntersecting) {
      state.visible = false;
      cancelAnimationFrame(state.frame);
      state.frame = 0;
      element.textContent = String(target);
      return;
    }
    if (state.visible) return;
    state.visible = true;
    if (!motionEnabled) { element.textContent = String(target); return; }
    element.textContent = '0';
    const startedAt = performance.now();
    function count(now) {
      state.frame = 0;
      if (!state.visible) return;
      const amount = motionEnabled ? clamp((now - startedAt) / 1150) : 1;
      element.textContent = String(Math.round(target * (1 - (1 - amount) ** 3)));
      if (amount < 1) state.frame = window.requestAnimationFrame(count);
    }
    state.frame = window.requestAnimationFrame(count);
  });
}, { threshold: 0 });
document.querySelectorAll('[data-counter]').forEach(element => counterObserver.observe(element));

function createSectionEnergy(section, mode, options = {}) {
  const canvas = section.querySelector('canvas');
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return { setMotion() {} };
  const palette = ['#3f4739', '#bacba9', '#b4656f', '#e1f4cb'];
  const baseColor = options.baseColor || [225, 244, 203];
  const strengthScale = options.strength ?? 1;
  const speedScale = options.speed ?? 1;
  const field = document.createElement('canvas');
  const fieldContext = field.getContext('2d');
  const cellColors = options.colors || [[145, 73, 82], [48, 56, 44], [145, 73, 82], [48, 56, 44]];
  let fieldPixels;
  let textRects = [];
  let textMask;
  const cellOffsets = cellColors.map(() => ({ x: 0, y: 0 }));
  const grain = document.createElement('canvas');
  grain.width = grain.height = 128;
  const grainContext = grain.getContext('2d');
  const pixels = grainContext.createImageData(128, 128);
  let seed = 24028;
  for (let i = 0; i < pixels.data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const shade = seed >>> 24;
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = shade;
    pixels.data[i + 3] = 48;
  }
  grainContext.putImageData(pixels, 0, 0);
  const texture = context.createPattern(grain, 'repeat');
  let allowed = false;
  let hovered = false;
  let visible = false;
  let frame = 0;
  let lastPaint = 0;
  let phase = 0;
  let enteredAt = 0;
  const origin = options.origin || (mode === 'cells' ? { x: .84, y: .18 } : { x: .5, y: .5 });
  const pointer = { ...origin };
  const target = { ...origin };

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastPaint = 0;
    section.classList.remove('energy-active');
  }
  function resize() {
    const width = Math.max(1, section.clientWidth);
    const scale = Math.min(1, 960 / width);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.max(1, Math.round(section.clientHeight * scale));
    if (mode === 'letters') {
      const font = '400 160px Oswald';
      fieldContext.font = font;
      const metrics = fieldContext.measureText('СОФИЯ СЕРКОВА');
      const ascent = metrics.actualBoundingBoxAscent || 160;
      const descent = metrics.actualBoundingBoxDescent || 0;
      field.width = Math.ceil(metrics.width + 32);
      field.height = Math.ceil(ascent + descent + 16);
      fieldContext.font = font;
      fieldContext.fillStyle = options.letterColor || '#7e3f48';
      fieldContext.fillText('СОФИЯ СЕРКОВА', 16, ascent + 8);
      paintLetters();
    }
    if (mode === 'cells') {
      const fieldScale = Math.min(1, 220 / Math.max(canvas.width, canvas.height));
      field.width = Math.max(1, Math.round(canvas.width * fieldScale));
      field.height = Math.max(1, Math.round(canvas.height * fieldScale));
      fieldPixels = fieldContext.createImageData(field.width, field.height);
      const bounds = section.getBoundingClientRect();
      const ratio = field.width / section.clientWidth;
      textRects = [];
      section.querySelectorAll(options.textSelector || '.section-kicker, #audience-title, .small-index, .audiences h3, .audiences p, .touch-inner .story-label, #touch-title, .touch-inner p').forEach(element => {
        const reveal = element.closest('[data-reveal], .hero-enter');
        const cssTransform = reveal ? getComputedStyle(reveal).transform : 'none';
        const transform = cssTransform === 'none' ? { m41: 0, m42: 0 } : new DOMMatrixReadOnly(cssTransform);
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          if (!walker.currentNode.textContent.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(walker.currentNode);
          for (const rect of range.getClientRects()) {
            textRects.push({
              x: (rect.left - bounds.left - transform.m41) * ratio,
              y: (rect.top - bounds.top - transform.m42) * ratio,
              width: rect.width * ratio,
              height: rect.height * ratio
            });
          }
        }
      });
      const halo = (options.textHalo ?? 110) * ratio;
      textMask = new Float32Array(field.width * field.height);
      // A broad Gaussian falloff protects text without a visible outline or cutoff.
      for (let y = 0; y < field.height; y++) {
        for (let x = 0; x < field.width; x++) {
          let clearance = 1;
          textRects.forEach(rect => {
            const radius = Math.min(rect.height, rect.width) / 2;
            const nearestX = clamp(x, rect.x + radius, rect.x + rect.width - radius);
            const distance = Math.hypot(x - nearestX, y - rect.y - rect.height / 2) - rect.height / 2;
            const amount = Math.max(0, distance) / halo;
            clearance = Math.min(clearance, 1 - Math.exp(-amount * amount));
          });
          textMask[y * field.width + x] = clearance;
        }
      }
    }
    sync();
  }
  function paintLetters() {
    const width = canvas.width;
    const height = canvas.height;
    context.fillStyle = `rgb(${baseColor.join(',')})`;
    context.fillRect(0, 0, width, height);
    context.filter = 'blur(4px)';
    // Narrow bands give the stretched lettering a gentle flowing contour.
    for (let y = 0; y < field.height; y += 3) {
      const strip = Math.min(3, field.height - y);
      const drift = Math.sin(y / field.height * 7 + phase) * width * .006;
      context.drawImage(field, 0, y, field.width, strip,
        width * -.06 + drift, height * -.3 + y / field.height * height * 1.6,
        width * 1.12, strip / field.height * height * 1.6 + 1);
    }
    context.filter = 'none';
  }
  function paint(now) {
    frame = 0;
    if (!allowed || (mode === 'ribbons' && !hovered) || !visible || document.hidden) return;
    if (lastPaint && now - lastPaint < 32) {
      frame = requestAnimationFrame(paint);
      return;
    }
    phase += (lastPaint ? Math.min(now - lastPaint, 80) * .00035 : .02) * speedScale;
    lastPaint = now;
    const follow = mode === 'cells' ? (hovered ? .045 * clamp((now - enteredAt) / 400) : .035) : .08;
    pointer.x += (target.x - pointer.x) * follow;
    pointer.y += (target.y - pointer.y) * follow;
    const width = canvas.width;
    const height = canvas.height;
    if (mode === 'cells') {
      const radius = Math.min(field.width, field.height) * (options.radius ?? .3);
      const cells = cellColors.map((color, index) => {
        const cell = {
          x: pointer.x * field.width + Math.cos(phase * .6 + index * 1.9) * radius * (options.spread ?? 1.2),
          y: pointer.y * field.height + Math.sin(phase * .45 + index * 1.9) * radius,
          radius: radius * (.9 + .3 * Math.sin(phase * 3.2 + index * 1.6)),
          color
        };
        let nearest;
        textRects.forEach(rect => {
          const lineRadius = Math.min(rect.height, rect.width) / 2;
          const dx = cell.x - clamp(cell.x, rect.x + lineRadius, rect.x + rect.width - lineRadius);
          const dy = cell.y - rect.y - rect.height / 2;
          const length = Math.hypot(dx, dy);
          const clearance = length - rect.height / 2;
          if (!nearest || clearance < nearest.clearance) nearest = { dx, dy, length, clearance };
        });
        const offset = cellOffsets[index];
        const push = nearest ? Math.max(0, cell.radius * .8 - nearest.clearance) * .8 : 0;
        const nextX = nearest && nearest.length > .01 ? nearest.dx / nearest.length * push : 0;
        const nextY = nearest && nearest.length > .01 ? nearest.dy / nearest.length * push : -push;
        offset.x += (nextX - offset.x) * .06;
        offset.y += (nextY - offset.y) * .06;
        cell.x += offset.x;
        cell.y += offset.y;
        return cell;
      });
      // Summed soft fields fuse into rounded clusters instead of separate circles.
      for (let y = 0; y < field.height; y++) {
        for (let x = 0; x < field.width; x++) {
          let strength = 0;
          const color = [0, 0, 0];
          cells.forEach((cell, cellIndex) => {
            const dx = x - cell.x;
            const dy = y - cell.y;
            const angle = Math.atan2(dy, dx);
            // Traveling angular waves deform the contour without a hard boundary.
            const edge = 1 + (options.deformation ?? 1) * (
              .1 * Math.sin(angle * 3 + phase * 2 + cellIndex)
              + .06 * Math.sin(angle * 5 - phase * 1.4 + cellIndex * 1.7));
            const distance = (dx * dx + dy * dy) / (cell.radius * edge) ** 2;
            const weight = 1 / (1 + distance) ** 3;
            strength += weight;
            color.forEach((_, channel) => { color[channel] += cell.color[channel] * weight; });
          });
          const intensity = clamp((strength - .06) / .62);
          const blend = intensity * intensity * (3 - 2 * intensity) * textMask[y * field.width + x] * strengthScale;
          const index = (y * field.width + x) * 4;
          baseColor.forEach((base, channel) => {
            const tint = strength ? color[channel] / strength : base;
            fieldPixels.data[index + channel] = base + (tint - base) * blend;
          });
          fieldPixels.data[index + 3] = 255;
        }
      }
      fieldContext.putImageData(fieldPixels, 0, 0);
      context.drawImage(field, 0, 0, width, height);
    } else if (mode === 'letters') {
      paintLetters();
    } else {
      context.fillStyle = palette[0];
      context.fillRect(0, 0, width, height);
      context.filter = 'blur(14px)';
      // Continuous folded ribbons span the whole surface; the cursor bends the flow.
      for (let band = 0; band < 9; band++) {
        const center = height * (band / 8 - .1);
        const thickness = height * (.13 + .025 * Math.sin(phase + band));
        const wave = (x, edge) => center + edge * thickness
          + height * .11 * Math.sin(x / width * 5.5 + phase * 2 + band * .65)
          + height * .06 * Math.sin(x / width * 11 - phase + band)
          + height * (pointer.y - .5) * .24 * Math.sin(x / width * 3 + pointer.x * 3);
        context.beginPath();
        for (let x = -30; x <= width + 30; x += 18) {
          if (x === -30) context.moveTo(x, wave(x, 0));
          else context.lineTo(x, wave(x, 0));
        }
        for (let x = width + 30; x >= -30; x -= 18) context.lineTo(x, wave(x, 1));
        context.closePath();
        context.globalAlpha = band % 3 === 1 ? .36 : .23;
        context.fillStyle = palette[1 + band % 3];
        context.fill();
      }
      }
    context.filter = 'none';
    context.globalAlpha = options.grainOpacity ?? .42 * strengthScale;
    context.fillStyle = texture;
    context.fillRect(0, 0, width, height);
    context.globalAlpha = 1;
    frame = requestAnimationFrame(paint);
  }
  function sync() {
    if (allowed && (mode !== 'ribbons' || hovered) && visible && !document.hidden) {
      section.classList.add('energy-active');
      if (!frame) frame = requestAnimationFrame(paint);
    } else stop();
  }
  section.addEventListener('pointerenter', event => {
    if (event.pointerType === 'touch') return;
    enteredAt = performance.now();
    const bounds = section.getBoundingClientRect();
    target.x = clamp((event.clientX - bounds.left) / bounds.width);
    target.y = clamp((event.clientY - bounds.top) / bounds.height);
    hovered = true;
    sync();
  });
  section.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const bounds = section.getBoundingClientRect();
    target.x = clamp((event.clientX - bounds.left) / bounds.width);
    target.y = clamp((event.clientY - bounds.top) / bounds.height);
  });
  function returnHome() {
    hovered = false;
    target.x = origin.x;
    target.y = origin.y;
  }
  section.addEventListener('pointerleave', () => { returnHome(); sync(); });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible && mode === 'cells') returnHome();
    sync();
  }).observe(section);
  new ResizeObserver(resize).observe(section);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && mode === 'cells') returnHome();
    sync();
  });
  resize();
  if (mode === 'cells' || mode === 'letters') document.fonts.ready.then(resize);
  return { setMotion(value) { allowed = value; if (mode === 'letters' && !value) paintLetters(); sync(); } };
}

const sectionEnergies = [
  createSectionEnergy(hero, 'cells', {
    baseColor: [234, 240, 226], strength: .8, speed: .35,
    colors: [[225, 244, 203], [225, 244, 203], [225, 244, 203], [225, 244, 203]],
    radius: .14, spread: 1.4, deformation: 0, grainOpacity: .035,
    origin: { x: .55, y: .36 },
    textSelector: '.hero .location, #hero-title, .hero-message, .hero-profession, .hero-actions, .hero-foot'
  }),
  createSectionEnergy(document.querySelector('.statement'), 'ribbons'),
  createSectionEnergy(document.querySelector('#my-history'), 'cells', {
    textSelector: '.section-kicker, #history-title, .history-entry, .history-caption'
  }),
  createSectionEnergy(document.querySelector('.energy-flow'), 'cells'),
  createSectionEnergy(document.querySelector('.footer'), 'cells', {
    baseColor: [145, 73, 82],
    radius: 1.2, origin: { x: .65, y: .1 }, textHalo: 24,
    colors: [[225, 244, 203], [186, 203, 169], [225, 244, 203], [48, 56, 44]],
    textSelector: '.footer-inner .wordmark, .footer-inner > span, .footer-inner > a:last-child'
  })
];

window.addEventListener('scroll', requestScrollPaint, { passive: true });
window.addEventListener('resize', requestScrollPaint);
reducedMotion.addEventListener('change', configureMotion);
flowingStory.addEventListener('change', configureMotion);
configureMotion();
document.fonts.ready.then(requestScrollPaint);
