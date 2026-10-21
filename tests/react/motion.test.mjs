import assert from "node:assert/strict";
import { mount } from "./dom.mjs";

const site = await mount({ width: 1366, height: 1034 });
const { document } = site;
const story = document.querySelector(".story");
const stage = document.querySelector(".story-stage");
Object.defineProperty(story, "offsetHeight", { value: 2700 });
Object.defineProperty(stage, "offsetHeight", { value: 900 });
story.getBoundingClientRect = () => ({
  top: -1250,
  bottom: 1450,
  height: 2700,
});
await site.flushFrames(performance.now());
assert(document.documentElement.classList.contains("has-story-motion"));
assert(
  document
    .querySelector('[data-story-panel="2"]')
    .classList.contains("is-active"),
);
assert(document.querySelector('[data-story-panel="0"]').inert);
assert.equal(
  document.querySelector('[data-story-step="2"]').getAttribute("aria-pressed"),
  "true",
);
assert(
  document
    .querySelector('[data-story-image="2"]')
    .style.transform.includes("scale("),
);
await site.intersect(true);
assert.equal(document.querySelector('[data-counter="28"]').textContent, "0");
await site.flushFrames(performance.now() + 1300);
assert.equal(document.querySelector('[data-counter="28"]').textContent, "28");
await site.intersect(false);
await site.intersect(true);
assert.equal(
  document.querySelector('[data-counter="28"]').textContent,
  "0",
  "Counters replay after re-entry",
);
await site.setMedia("(max-width: 1100px), (max-height: 650px)", true);
assert(!document.documentElement.classList.contains("has-story-motion"));
assert(
  [...document.querySelectorAll("[data-story-panel]")].every(
    (panel) => !panel.inert && !panel.hasAttribute("aria-hidden"),
  ),
);
assert(
  document
    .querySelector('[data-story-image="0"]')
    .classList.contains("is-active"),
);
assert(
  [...document.querySelectorAll("[data-story-image]")].every(
    (image) => !image.style.transform,
  ),
);
await site.setMedia("(prefers-reduced-motion: reduce)", true);
await site.flushFrames(performance.now() + 2600);
assert(!document.documentElement.classList.contains("has-motion"));
assert.equal(document.querySelector('[data-counter="28"]').textContent, "28");
assert(
  [...document.querySelectorAll("[data-reveal]")].every((node) =>
    node.classList.contains("is-visible"),
  ),
);
await site.unmount();
assert.equal(site.frames.size, 0);
assert(site.observers.every((observer) => !observer.targets.size));
console.log(
  "Desktop pinned scenes, scroll transforms, replaying counters, tablet/mobile flow, reduced motion and lifecycle cleanup passed.",
);
