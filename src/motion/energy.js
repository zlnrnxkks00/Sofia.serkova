import { clamp } from "./math.js";

export function createSectionEnergy(section, mode, options = {}) {
  const canvas = section.querySelector("canvas");
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) return { setMotion() {}, destroy() {} };
  const lifetime = new AbortController();
  let disposed = false;
  const listen = (target, type, handler) =>
    target.addEventListener(type, handler, { signal: lifetime.signal });
  const palette = ["#3f4739", "#bacba9", "#b4656f", "#e1f4cb"];
  const baseColor = options.baseColor || [225, 244, 203];
  const strengthScale = options.strength ?? 1;
  const speedScale = options.speed ?? 1;
  const field = document.createElement("canvas");
  const fieldContext = field.getContext("2d");
  if (!fieldContext) return { setMotion() {}, destroy() {} };
  const cellColors = options.colors || [
    [145, 73, 82],
    [48, 56, 44],
    [145, 73, 82],
    [48, 56, 44],
  ];
  let fieldPixels;
  let textRects = [];
  let textMask;
  const cellOffsets = cellColors.map(() => ({ x: 0, y: 0 }));
  const grain = document.createElement("canvas");
  grain.width = grain.height = 128;
  const grainContext = grain.getContext("2d");
  if (!grainContext) return { setMotion() {}, destroy() {} };
  const pixels = grainContext.createImageData(128, 128);
  let seed = 24028;
  for (let i = 0; i < pixels.data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const shade = seed >>> 24;
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = shade;
    pixels.data[i + 3] = 48;
  }
  grainContext.putImageData(pixels, 0, 0);
  const texture = context.createPattern(grain, "repeat");
  let allowed = false;
  let hovered = false;
  let visible = false;
  let frame = 0;
  let lastPaint = 0;
  let phase = 0;
  let enteredAt = 0;
  const origin =
    options.origin ||
    (mode === "cells" ? { x: 0.84, y: 0.18 } : { x: 0.5, y: 0.5 });
  const pointer = { ...origin };
  const target = { ...origin };

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastPaint = 0;
    section.classList.remove("energy-active");
  }
  function resize() {
    if (disposed) return;
    const width = Math.max(1, section.clientWidth);
    const scale = Math.min(1, 960 / width);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.max(1, Math.round(section.clientHeight * scale));
    if (mode === "letters") {
      const font = "400 160px Oswald";
      fieldContext.font = font;
      const metrics = fieldContext.measureText("СОФИЯ СЕРКОВА");
      const ascent = metrics.actualBoundingBoxAscent || 160;
      const descent = metrics.actualBoundingBoxDescent || 0;
      field.width = Math.ceil(metrics.width + 32);
      field.height = Math.ceil(ascent + descent + 16);
      fieldContext.font = font;
      fieldContext.fillStyle = options.letterColor || "#7e3f48";
      fieldContext.fillText("СОФИЯ СЕРКОВА", 16, ascent + 8);
      paintLetters();
    }
    if (mode === "cells") {
      const fieldScale = Math.min(
        1,
        220 / Math.max(canvas.width, canvas.height),
      );
      field.width = Math.max(1, Math.round(canvas.width * fieldScale));
      field.height = Math.max(1, Math.round(canvas.height * fieldScale));
      fieldPixels = fieldContext.createImageData(field.width, field.height);
      const bounds = section.getBoundingClientRect();
      const ratio = field.width / width;
      textRects = [];
      section
        .querySelectorAll(
          options.textSelector ||
            ".section-kicker, #audience-title, .small-index, .audiences h3, .audiences p, .touch-inner .story-label, #touch-title, .touch-inner p",
        )
        .forEach((element) => {
          const reveal = element.closest("[data-reveal], .hero-enter");
          const cssTransform = reveal
            ? getComputedStyle(reveal).transform
            : "none";
          const transform =
            cssTransform === "none"
              ? { m41: 0, m42: 0 }
              : new DOMMatrixReadOnly(cssTransform);
          const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
          );
          while (walker.nextNode()) {
            if (!walker.currentNode.textContent.trim()) continue;
            const range = document.createRange();
            range.selectNodeContents(walker.currentNode);
            for (const rect of range.getClientRects()) {
              textRects.push({
                x: (rect.left - bounds.left - transform.m41) * ratio,
                y: (rect.top - bounds.top - transform.m42) * ratio,
                width: rect.width * ratio,
                height: rect.height * ratio,
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
          textRects.forEach((rect) => {
            const radius = Math.min(rect.height, rect.width) / 2;
            const nearestX = clamp(
              x,
              rect.x + radius,
              rect.x + rect.width - radius,
            );
            const distance =
              Math.hypot(x - nearestX, y - rect.y - rect.height / 2) -
              rect.height / 2;
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
    context.fillStyle = `rgb(${baseColor.join(",")})`;
    context.fillRect(0, 0, width, height);
    context.filter = "blur(4px)";
    // Narrow bands give the stretched lettering a gentle flowing contour.
    for (let y = 0; y < field.height; y += 3) {
      const strip = Math.min(3, field.height - y);
      const drift = Math.sin((y / field.height) * 7 + phase) * width * 0.006;
      context.drawImage(
        field,
        0,
        y,
        field.width,
        strip,
        width * -0.06 + drift,
        height * -0.3 + (y / field.height) * height * 1.6,
        width * 1.12,
        (strip / field.height) * height * 1.6 + 1,
      );
    }
    context.filter = "none";
  }
  function paint(now) {
    frame = 0;
    if (
      !allowed ||
      (mode === "ribbons" && !hovered) ||
      !visible ||
      document.hidden
    )
      return;
    if (lastPaint && now - lastPaint < 32) {
      frame = requestAnimationFrame(paint);
      return;
    }
    phase +=
      (lastPaint ? Math.min(now - lastPaint, 80) * 0.00035 : 0.02) * speedScale;
    lastPaint = now;
    const follow =
      mode === "cells"
        ? hovered
          ? 0.045 * clamp((now - enteredAt) / 400)
          : 0.035
        : 0.08;
    pointer.x += (target.x - pointer.x) * follow;
    pointer.y += (target.y - pointer.y) * follow;
    const width = canvas.width;
    const height = canvas.height;
    if (mode === "cells") {
      const radius =
        Math.min(field.width, field.height) * (options.radius ?? 0.3);
      const cells = cellColors.map((color, index) => {
        const cell = {
          x:
            pointer.x * field.width +
            Math.cos(phase * 0.6 + index * 1.9) *
              radius *
              (options.spread ?? 1.2),
          y:
            pointer.y * field.height +
            Math.sin(phase * 0.45 + index * 1.9) * radius,
          radius: radius * (0.9 + 0.3 * Math.sin(phase * 3.2 + index * 1.6)),
          color,
        };
        let nearest;
        textRects.forEach((rect) => {
          const lineRadius = Math.min(rect.height, rect.width) / 2;
          const dx =
            cell.x -
            clamp(
              cell.x,
              rect.x + lineRadius,
              rect.x + rect.width - lineRadius,
            );
          const dy = cell.y - rect.y - rect.height / 2;
          const length = Math.hypot(dx, dy);
          const clearance = length - rect.height / 2;
          if (!nearest || clearance < nearest.clearance)
            nearest = { dx, dy, length, clearance };
        });
        const offset = cellOffsets[index];
        const push = nearest
          ? Math.max(0, cell.radius * 0.8 - nearest.clearance) * 0.8
          : 0;
        const nextX =
          nearest && nearest.length > 0.01
            ? (nearest.dx / nearest.length) * push
            : 0;
        const nextY =
          nearest && nearest.length > 0.01
            ? (nearest.dy / nearest.length) * push
            : -push;
        offset.x += (nextX - offset.x) * 0.06;
        offset.y += (nextY - offset.y) * 0.06;
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
            const edge =
              1 +
              (options.deformation ?? 1) *
                (0.1 * Math.sin(angle * 3 + phase * 2 + cellIndex) +
                  0.06 * Math.sin(angle * 5 - phase * 1.4 + cellIndex * 1.7));
            const distance = (dx * dx + dy * dy) / (cell.radius * edge) ** 2;
            const weight = 1 / (1 + distance) ** 3;
            strength += weight;
            color.forEach((_, channel) => {
              color[channel] += cell.color[channel] * weight;
            });
          });
          const intensity = clamp((strength - 0.06) / 0.62);
          const blend =
            intensity *
            intensity *
            (3 - 2 * intensity) *
            textMask[y * field.width + x] *
            strengthScale;
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
    } else if (mode === "letters") {
      paintLetters();
    } else {
      context.fillStyle = palette[0];
      context.fillRect(0, 0, width, height);
      context.filter = "blur(14px)";
      // Continuous folded ribbons span the whole surface; the cursor bends the flow.
      for (let band = 0; band < 9; band++) {
        const center = height * (band / 8 - 0.1);
        const thickness = height * (0.13 + 0.025 * Math.sin(phase + band));
        const wave = (x, edge) =>
          center +
          edge * thickness +
          height *
            0.11 *
            Math.sin((x / width) * 5.5 + phase * 2 + band * 0.65) +
          height * 0.06 * Math.sin((x / width) * 11 - phase + band) +
          height *
            (pointer.y - 0.5) *
            0.24 *
            Math.sin((x / width) * 3 + pointer.x * 3);
        context.beginPath();
        for (let x = -30; x <= width + 30; x += 18) {
          if (x === -30) context.moveTo(x, wave(x, 0));
          else context.lineTo(x, wave(x, 0));
        }
        for (let x = width + 30; x >= -30; x -= 18)
          context.lineTo(x, wave(x, 1));
        context.closePath();
        context.globalAlpha = band % 3 === 1 ? 0.36 : 0.23;
        context.fillStyle = palette[1 + (band % 3)];
        context.fill();
      }
    }
    context.filter = "none";
    context.globalAlpha = options.grainOpacity ?? 0.42 * strengthScale;
    context.fillStyle = texture;
    context.fillRect(0, 0, width, height);
    context.globalAlpha = 1;
    frame = requestAnimationFrame(paint);
  }
  function sync() {
    if (
      allowed &&
      (mode !== "ribbons" || hovered) &&
      visible &&
      !document.hidden
    ) {
      section.classList.add("energy-active");
      if (!frame) frame = requestAnimationFrame(paint);
    } else stop();
  }
  listen(section, "pointerenter", (event) => {
    if (event.pointerType === "touch") return;
    enteredAt = performance.now();
    const bounds = section.getBoundingClientRect();
    target.x = clamp((event.clientX - bounds.left) / bounds.width);
    target.y = clamp((event.clientY - bounds.top) / bounds.height);
    hovered = true;
    sync();
  });
  listen(section, "pointermove", (event) => {
    if (event.pointerType === "touch") return;
    const bounds = section.getBoundingClientRect();
    target.x = clamp((event.clientX - bounds.left) / bounds.width);
    target.y = clamp((event.clientY - bounds.top) / bounds.height);
  });
  function returnHome() {
    hovered = false;
    target.x = origin.x;
    target.y = origin.y;
  }
  listen(section, "pointerleave", () => {
    returnHome();
    sync();
  });
  const visibilityObserver = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (!visible && mode === "cells") returnHome();
    sync();
  });
  visibilityObserver.observe(section);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(section);
  listen(document, "visibilitychange", () => {
    if (document.hidden && mode === "cells") returnHome();
    sync();
  });
  resize();
  if (mode === "cells" || mode === "letters") document.fonts.ready.then(resize);
  return {
    setMotion(value) {
      if (disposed) return;
      allowed = value;
      if (mode === "letters" && !value) paintLetters();
      sync();
    },
    destroy() {
      disposed = true;
      allowed = false;
      stop();
      lifetime.abort();
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
    },
  };
}
