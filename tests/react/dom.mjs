import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { App, render } from "../../.ssr/entry-server.mjs";

export async function mount({
  width = 390,
  height = 844,
  reduced = false,
} = {}) {
  const errors = [];
  const dom = new JSDOM(
    `<!doctype html><html><body><div id="root">${render()}</div></body></html>`,
    { url: "https://sofia.example/" },
  );
  const { window } = dom;
  const { document } = window;
  window.innerWidth = width;
  window.innerHeight = height;
  const media = new Map();
  window.matchMedia = (query) => {
    if (!media.has(query)) {
      const target = new window.EventTarget();
      target.media = query;
      target.matches = query.includes("prefers-reduced-motion")
        ? reduced
        : query.includes("min-width: 1101")
          ? width >= 1101
          : width <= 1100 || height <= 650;
      media.set(query, target);
    }
    return media.get(query);
  };
  const observers = [];
  class Observer {
    constructor(callback) {
      this.callback = callback;
      this.targets = new Set();
      observers.push(this);
    }
    observe(target) {
      this.targets.add(target);
    }
    unobserve(target) {
      this.targets.delete(target);
    }
    disconnect() {
      this.targets.clear();
    }
  }
  const frames = new Map();
  let frameId = 0;
  window.requestAnimationFrame = (callback) => {
    frames.set(++frameId, callback);
    return frameId;
  };
  window.cancelAnimationFrame = (id) => frames.delete(id);
  window.IntersectionObserver = Observer;
  window.ResizeObserver = Observer;
  window.CSS = { supports: () => true };
  document.fonts = { ready: Promise.resolve() };
  window.HTMLCanvasElement.prototype.getContext = () => null;
  window.HTMLImageElement.prototype.decode = () => Promise.resolve();
  window.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new window.Event("close"));
  };
  window.HTMLElement.prototype.scrollIntoView = function () {
    this.scrolledIntoView = true;
  };
  Object.defineProperty(window.HTMLElement.prototype, "offsetParent", {
    get() {
      return this.closest("[hidden]") ||
        (width <= 1100 && this.matches(".desktop-nav a,.header-call"))
        ? null
        : this.parentElement;
    },
  });
  window.scrollTo = (first, second) => {
    window.scrollY = typeof first === "object" ? first.top : second;
  };
  for (const [name, value] of Object.entries({
    window,
    document,
    HTMLElement: window.HTMLElement,
    HTMLDialogElement: window.HTMLDialogElement,
    Node: window.Node,
    NodeFilter: window.NodeFilter,
    AbortController: window.AbortController,
    IntersectionObserver: Observer,
    ResizeObserver: Observer,
    CSS: window.CSS,
    getComputedStyle: window.getComputedStyle,
    requestAnimationFrame: window.requestAnimationFrame,
    cancelAnimationFrame: window.cancelAnimationFrame,
    IS_REACT_ACT_ENVIRONMENT: true,
  }))
    Object.defineProperty(globalThis, name, {
      value,
      configurable: true,
      writable: true,
    });
  const { hydrateRoot } = await import("react-dom/client");
  let root;
  await act(async () => {
    root = hydrateRoot(document.getElementById("root"), createElement(App), {
      onRecoverableError: (error) => errors.push(error),
    });
  });
  assertNoHydrationErrors();
  function assertNoHydrationErrors() {
    if (errors.length) throw new AggregateError(errors, "Hydration errors");
  }
  const click = async (selector) => {
    const node =
      typeof selector === "string"
        ? document.querySelector(selector)
        : selector;
    await act(async () => node.click());
    return node;
  };
  const dispatch = async (node, type, properties = {}) => {
    const event = new window.Event(type, { bubbles: true, cancelable: true });
    for (const [name, value] of Object.entries(properties))
      Object.defineProperty(event, name, { value });
    await act(async () => node.dispatchEvent(event));
    return event;
  };
  const setMedia = async (query, matches) => {
    const target = window.matchMedia(query);
    target.matches = matches;
    await dispatch(target, "change", { matches });
  };
  const flushFrames = async (now) => {
    const callbacks = [...frames.values()];
    frames.clear();
    await act(async () => callbacks.forEach((callback) => callback(now)));
  };
  const intersect = async (visible) => {
    await act(async () =>
      observers.forEach((observer) => {
        if (observer.targets.size)
          observer.callback(
            [...observer.targets].map((target) => ({
              target,
              isIntersecting: visible,
            })),
          );
      }),
    );
  };
  return {
    window,
    document,
    click,
    dispatch,
    setMedia,
    flushFrames,
    intersect,
    frames,
    observers,
    errors,
    assertNoHydrationErrors,
    async unmount() {
      await act(async () => root.unmount());
      assertNoHydrationErrors();
      dom.window.close();
    },
  };
}

export { act };
