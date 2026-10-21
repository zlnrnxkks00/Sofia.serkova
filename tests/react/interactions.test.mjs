import assert from "node:assert/strict";
import { mount, act } from "./dom.mjs";

const site = await mount();
const { window, document, click, dispatch, setMedia } = site;
assert.equal(document.querySelector(".reviews-grid").children.length, 13);
assert(
  [...document.querySelectorAll(".service-description")].every(
    (node) => node.hidden,
  ),
);
assert(!document.documentElement.classList.contains("has-story-motion"));

window.scrollY = 417;
await click(".menu-toggle");
assert(document.documentElement.classList.contains("menu-visible"));
assert(document.documentElement.classList.contains("menu-open"));
assert(document.querySelector("main").inert);
assert.equal(document.querySelector("header").getAttribute("role"), "dialog");
assert.equal(document.activeElement, document.querySelector(".menu-toggle"));
document.querySelector(".mobile-nav-socials a:last-child").focus();
await dispatch(document, "keydown", { key: "Tab" });
assert.equal(
  document.activeElement,
  document.querySelector("header .wordmark"),
);
await dispatch(document, "keydown", { key: "Tab", shiftKey: true });
assert.equal(
  document.activeElement,
  document.querySelector(".mobile-nav-socials a:last-child"),
);
await dispatch(document, "keydown", { key: "Escape" });
assert(
  !document.querySelector("#mobile-nav").hidden,
  "Exit animation is not cut short",
);
assert.equal(
  document.querySelector(".menu-toggle").getAttribute("aria-expanded"),
  "false",
);
await dispatch(document.querySelector("#mobile-nav"), "transitionend", {
  propertyName: "transform",
});
assert(document.querySelector("#mobile-nav").hidden);
assert(!document.querySelector("main").inert && window.scrollY === 417);
assert.equal(document.activeElement, document.querySelector(".menu-toggle"));
await click(".menu-toggle");
await click('.mobile-nav-links a[href="#services"]');
await dispatch(document.querySelector("#mobile-nav"), "transitionend", {
  propertyName: "transform",
});
assert.equal(window.location.hash, "#services");
await click(".menu-toggle");
await click('.mobile-nav-links a[href="#services"]');
await dispatch(document.querySelector("#mobile-nav"), "transitionend", {
  propertyName: "transform",
});
assert(document.querySelector("#services").scrolledIntoView);
await click(".menu-toggle");
await click(".menu-toggle");
await click(".menu-toggle");
await dispatch(document.querySelector("#mobile-nav"), "transitionend", {
  propertyName: "transform",
});
assert(
  !document.querySelector("#mobile-nav").hidden,
  "Quick reopen cancels pending exit",
);
await setMedia("(min-width: 1101px)", true);
assert(
  document.querySelector("#mobile-nav").hidden &&
    !document.querySelector("main").inert,
);
await setMedia("(prefers-reduced-motion: reduce)", true);
await click(".menu-toggle");
await click(".menu-toggle");
assert(
  document.querySelector("#mobile-nav").hidden,
  "Reduced motion skips exit animation",
);

await click("#toggle-hijama");
assert(!document.querySelector("#description-hijama").hidden);
await click("#toggle-face");
assert(
  document.querySelector("#description-hijama").hidden &&
    !document.querySelector("#description-face").hidden,
);
await dispatch(document.querySelector("#toggle-face"), "keydown", {
  key: "Escape",
});
assert(document.querySelector("#description-face").hidden);
await click('[data-filter="special"]');
assert.equal(
  [...document.querySelectorAll(".price-row")].filter((node) => !node.hidden)
    .length,
  2,
);
await click("#toggle-device");
assert(!document.querySelector("#description-device").hidden);
await click("#contact-title");
assert(document.querySelector("#description-device").hidden);
await click('[data-filter="all"]');
assert(
  [...document.querySelectorAll(".price-row")].every((node) => !node.hidden),
);

await click('[data-history-image="education"]');
assert(
  document
    .querySelector('[data-history-media="education"]')
    .classList.contains("is-active"),
);
await dispatch(
  document.querySelector('[data-history-image="closing"]'),
  "pointerover",
  { pointerType: "touch" },
);
assert(
  document
    .querySelector('[data-history-media="education"]')
    .classList.contains("is-active"),
  "Touch hover does not select",
);
await click('[data-history-image="closing"]');
assert(
  document
    .querySelector('[data-history-media="closing"]')
    .classList.contains("is-active"),
);
assert.equal(
  document.querySelector(".history-caption").textContent,
  "Любимое дело",
);
let resolveEducation, resolveFace;
document.querySelector('[data-history-media="education"]').decode = () =>
  new Promise((resolve) => {
    resolveEducation = resolve;
  });
document.querySelector('[data-history-media="face"]').decode = () =>
  new Promise((resolve) => {
    resolveFace = resolve;
  });
await click('[data-history-image="education"]');
await click('[data-history-image="face"]');
await act(async () => resolveFace());
await act(async () => resolveEducation());
assert(
  document
    .querySelector('[data-history-media="face"]')
    .classList.contains("is-active"),
  "Late image decode cannot override newer selection",
);

const opener = await click(".review-item");
assert(document.querySelector("dialog").open);
assert.equal(document.querySelector(".review-counter").textContent, "1 / 13");
await click("[data-review-prev]");
assert.equal(document.querySelector(".review-counter").textContent, "13 / 13");
await dispatch(document.querySelector("dialog"), "keydown", {
  key: "ArrowRight",
});
assert.equal(document.querySelector(".review-counter").textContent, "1 / 13");
await click("[data-review-close]");
assert(
  !document.querySelector("dialog").open && document.activeElement === opener,
);
await click(".review-item");
await act(async () => document.querySelector("dialog").close());
assert(!document.querySelector("dialog").open);
await click(".menu-toggle");
await site.unmount();
assert(
  !document.documentElement.classList.contains("menu-visible"),
  "Unmount releases scroll lock",
);
assert(
  site.observers.every((observer) => observer.targets.size === 0),
  "Unmount disconnects every observer",
);
assert.equal(site.frames.size, 0, "Unmount cancels animation frames");
console.log(
  "Hydration, focus trap, menu transitions/reopen/resize/reduced motion, repeated anchors, service filters, history decode races, 13-review viewer and effect cleanup passed.",
);
