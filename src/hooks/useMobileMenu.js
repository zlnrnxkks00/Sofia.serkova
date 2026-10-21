import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

export function useMobileMenu() {
  const [phase, setPhase] = useState("hidden");
  const phaseRef = useRef("hidden");
  const headerRef = useRef(null);
  const buttonRef = useRef(null);
  const navRef = useRef(null);
  const timer = useRef(null);
  const session = useRef(null);
  const action = useRef(null);
  const changePhase = useCallback((value) => {
    phaseRef.current = value;
    setPhase(value);
  }, []);

  const unlock = useCallback(() => {
    if (!session.current) return;
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    root.classList.remove("menu-open", "menu-visible");
    root.style.removeProperty("--menu-scroll-offset");
    session.current.background.forEach(([element, inert]) => {
      element.inert = inert;
    });
    window.scrollTo(0, session.current.scroll);
    root.style.scrollBehavior = previous;
    session.current = null;
  }, []);

  const finishClose = useCallback(() => {
    if (phaseRef.current !== "closing") return;
    window.clearTimeout(timer.current);
    unlock();
    changePhase("hidden");
    const next = action.current;
    action.current = null;
    if (next?.hash) {
      if (window.location.hash === next.hash)
        document
          .getElementById(decodeURIComponent(next.hash.slice(1)))
          ?.scrollIntoView();
      else window.location.hash = next.hash;
    } else if (next?.restoreFocus)
      buttonRef.current?.focus({ preventScroll: true });
  }, [changePhase, unlock]);

  const close = useCallback(
    (next = {}) => {
      if (phaseRef.current === "hidden") return;
      action.current = next;
      changePhase("closing");
      document.documentElement.classList.remove("menu-open");
      window.clearTimeout(timer.current);
      if (
        next.immediate ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        finishClose();
      else timer.current = window.setTimeout(finishClose, 900);
    },
    [changePhase, finishClose],
  );

  const toggle = useCallback(() => {
    if (phaseRef.current === "open") {
      close({ restoreFocus: true });
      return;
    }
    window.clearTimeout(timer.current);
    action.current = null;
    if (!session.current) {
      const background = [...headerRef.current.parentElement.children]
        .filter((element) => element !== headerRef.current)
        .map((element) => [element, element.inert]);
      session.current = { scroll: window.scrollY, background };
      background.forEach(([element]) => {
        element.inert = true;
      });
      document.documentElement.style.setProperty(
        "--menu-scroll-offset",
        `${-window.scrollY}px`,
      );
    }
    document.documentElement.classList.add("menu-visible");
    changePhase("open");
  }, [changePhase, close]);

  useLayoutEffect(() => {
    if (phase !== "open") return;
    navRef.current.getBoundingClientRect();
    document.documentElement.classList.add("menu-open");
    buttonRef.current.focus({ preventScroll: true });
  }, [phase]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1101px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onDesktop = (event) => {
      if (event.matches) close({ immediate: true });
    };
    const onReduced = (event) => {
      if (event.matches) finishClose();
    };
    const onOutside = (event) => {
      if (
        phaseRef.current === "open" &&
        !headerRef.current.contains(event.target)
      )
        close({ restoreFocus: true });
    };
    const onKey = (event) => {
      if (phaseRef.current !== "open") return;
      if (event.key === "Escape") {
        event.preventDefault();
        close({ restoreFocus: true });
      }
      if (event.key !== "Tab") return;
      const items = [
        ...headerRef.current.querySelectorAll("a[href],button:not([disabled])"),
      ].filter(
        (element) =>
          element.offsetParent !== null && !element.closest("[inert]"),
      );
      const first = items[0],
        last = items.at(-1);
      if (!first) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    desktop.addEventListener("change", onDesktop);
    reduced.addEventListener("change", onReduced);
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onOutside);
    return () => {
      window.clearTimeout(timer.current);
      desktop.removeEventListener("change", onDesktop);
      reduced.removeEventListener("change", onReduced);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onOutside);
      unlock();
    };
  }, [close, finishClose, unlock]);

  const onLink = (event) => {
    if (phaseRef.current === "hidden") return;
    const link = event.currentTarget;
    if (link.getAttribute("href").startsWith("#")) {
      event.preventDefault();
      close({ hash: link.hash });
    } else close();
  };
  return {
    phase,
    headerRef,
    buttonRef,
    navRef,
    toggle,
    onLink,
    onTransitionEnd: (event) => {
      if (event.target === navRef.current && event.propertyName === "transform")
        finishClose();
    },
  };
}
