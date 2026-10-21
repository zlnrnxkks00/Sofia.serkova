import { clamp } from "./math.js";
import { createSectionEnergy } from "./energy.js";
import { energyOptions } from "./energyOptions.js";

export function setupPageMotion() {
  if (!window.IntersectionObserver || !window.ResizeObserver) return () => {};
  const lifetime = new AbortController();
  const listen = (target, type, handler, options = {}) =>
    target.addEventListener(type, handler, {
      ...options,
      signal: lifetime.signal,
    });
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const flowingStory = window.matchMedia(
    "(max-width: 1100px), (max-height: 650px)",
  );
  const story = document.querySelector(".story");
  const storyStage = document.querySelector(".story-stage");
  const storyPanels = [...document.querySelectorAll("[data-story-panel]")];
  const storyButtons = [...document.querySelectorAll("[data-story-step]")];
  const storyImage = document.querySelector(".story-image");
  const storyImages = [...document.querySelectorAll("[data-story-image]")];
  const storyProgress = document.querySelector(".story-progress > span");
  const hero = document.querySelector(".hero");
  const heroImage = document.querySelector(".hero-image");
  const chapterLinks = [...document.querySelectorAll(".desktop-nav a")];
  let motionEnabled = false;
  let storyMotionEnabled = false;
  let framePending = false;
  let scrollFrame = 0;
  let disposed = false;
  let activeStoryStep = -1;
  let revealObserver;

  function setStoryStep(index) {
    if (index === activeStoryStep) return;
    activeStoryStep = index;
    storyImages.forEach((image, i) =>
      image.classList.toggle("is-active", i === index),
    );
    storyPanels.forEach((panel, i) => {
      const active = i === index;
      panel.classList.toggle("is-active", active);
      panel.setAttribute("aria-hidden", String(!active));
      panel.inert = !active;
    });
    storyButtons.forEach((button, i) =>
      button.setAttribute("aria-pressed", String(i === index)),
    );
  }

  function paintScroll() {
    if (disposed) return;
    framePending = false;
    const viewportHeight = window.innerHeight;
    let currentChapter = null;
    chapterLinks.forEach((link) => {
      const section = document.querySelector(link.getAttribute("href"));
      if (section.getBoundingClientRect().top <= viewportHeight * 0.25)
        currentChapter = link;
    });
    chapterLinks.forEach((link) => {
      if (link === currentChapter)
        link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    if (!motionEnabled) return;

    const storyBounds = story.getBoundingClientRect();
    if (storyMotionEnabled) {
      // Native sticky positioning keeps the scene pinned; only the visual state follows scroll.
      const storyDistance = story.offsetHeight - storyStage.offsetHeight;
      const amount =
        storyDistance > 0 ? clamp(-storyBounds.top / storyDistance) : 0;
      setStoryStep(Math.min(2, Math.floor(amount * 3)));
      if (storyBounds.bottom > 0 && storyBounds.top < viewportHeight) {
        storyProgress.style.transform = `scaleX(${amount})`;
        storyImages.forEach((image) => {
          image.style.transform = `translate3d(${-amount * 28}px, 0, 0) scale(${1.025 + amount * 0.1})`;
        });
      }
    } else if (storyBounds.bottom > 0 && storyBounds.top < viewportHeight) {
      const amount = clamp(
        (viewportHeight - storyBounds.top) /
          (viewportHeight + storyBounds.height),
      );
      storyImage.style.transform = `translate3d(${-amount * 14}px, 0, 0) scale(${1.025 + amount * 0.05})`;
    }
  }

  function requestScrollPaint() {
    if (disposed || framePending) return;
    framePending = true;
    scrollFrame = window.requestAnimationFrame(paintScroll);
  }

  function configureMotion() {
    motionEnabled =
      !reducedMotion.matches && CSS.supports("position", "sticky");
    document.documentElement.classList.toggle("has-motion", motionEnabled);
    storyMotionEnabled = motionEnabled && !flowingStory.matches;
    document.documentElement.classList.toggle(
      "has-story-motion",
      storyMotionEnabled,
    );
    revealObserver?.disconnect();
    activeStoryStep = -1;
    if (motionEnabled) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.12 },
      );
      document
        .querySelectorAll("[data-reveal]:not(.is-visible)")
        .forEach((element) => revealObserver.observe(element));
      if (storyMotionEnabled) setStoryStep(0);
    } else {
      document
        .querySelectorAll("[data-reveal]")
        .forEach((element) => element.classList.add("is-visible"));
      storyPanels.forEach((panel) => {
        panel.removeAttribute("aria-hidden");
        panel.inert = false;
        panel.classList.remove("is-active");
      });
      [heroImage, ...storyImages].forEach((element) =>
        element.style.removeProperty("transform"),
      );
    }
    if (!storyMotionEnabled) {
      storyImages.forEach((image, i) => {
        image.classList.toggle("is-active", i === 0);
        image.style.removeProperty("transform");
      });
      storyPanels.forEach((panel) => {
        panel.removeAttribute("aria-hidden");
        panel.inert = false;
        panel.classList.remove("is-active");
      });
      storyImage.style.removeProperty("transform");
    }
    sectionEnergies.forEach((energy) => energy.setMotion(motionEnabled));
    requestScrollPaint();
  }

  storyButtons.forEach((button, index) => {
    listen(button, "click", () => {
      if (!storyMotionEnabled) return;
      const storyTop = story.getBoundingClientRect().top + window.scrollY;
      const distance = story.offsetHeight - storyStage.offsetHeight;
      window.scrollTo({
        top: storyTop + distance * ((index + 0.15) / 3),
        behavior: "smooth",
      });
    });
    listen(button, "keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const next = clamp(index + (event.key === "ArrowRight" ? 1 : -1), 0, 2);
      storyButtons[next].focus();
      storyButtons[next].click();
    });
  });

  const counterStates = new WeakMap();
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const element = entry.target;
        const target = Number(element.dataset.counter);
        const state = counterStates.get(element) || {
          visible: false,
          frame: 0,
        };
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
        if (!motionEnabled) {
          element.textContent = String(target);
          return;
        }
        element.textContent = "0";
        const startedAt = performance.now();
        function count(now) {
          state.frame = 0;
          if (!state.visible) return;
          const amount = motionEnabled ? clamp((now - startedAt) / 1150) : 1;
          element.textContent = String(
            Math.round(target * (1 - (1 - amount) ** 3)),
          );
          if (amount < 1) state.frame = window.requestAnimationFrame(count);
        }
        state.frame = window.requestAnimationFrame(count);
      });
    },
    { threshold: 0 },
  );
  document
    .querySelectorAll("[data-counter]")
    .forEach((element) => counterObserver.observe(element));

  const sectionEnergies = [
    createSectionEnergy(hero, "cells", energyOptions.hero),
    createSectionEnergy(document.querySelector(".statement"), "ribbons"),
    createSectionEnergy(
      document.querySelector("#my-history"),
      "cells",
      energyOptions.history,
    ),
    createSectionEnergy(document.querySelector(".energy-flow"), "cells"),
    createSectionEnergy(
      document.querySelector(".footer"),
      "cells",
      energyOptions.footer,
    ),
  ];

  listen(window, "scroll", requestScrollPaint, { passive: true });
  listen(window, "resize", requestScrollPaint);
  listen(reducedMotion, "change", configureMotion);
  listen(flowingStory, "change", configureMotion);
  configureMotion();
  document.fonts?.ready.then(requestScrollPaint);

  return () => {
    disposed = true;
    lifetime.abort();
    cancelAnimationFrame(scrollFrame);
    revealObserver?.disconnect();
    counterObserver.disconnect();
    document.querySelectorAll("[data-counter]").forEach((element) => {
      const state = counterStates.get(element);
      if (state) {
        state.visible = false;
        cancelAnimationFrame(state.frame);
      }
      element.textContent = element.dataset.counter;
    });
    sectionEnergies.forEach((energy) => energy.destroy());
    document.documentElement.classList.remove("has-motion", "has-story-motion");
    storyPanels.forEach((panel) => {
      panel.inert = false;
      panel.removeAttribute("aria-hidden");
    });
    storyImages.forEach((image) => image.style.removeProperty("transform"));
  };
}
