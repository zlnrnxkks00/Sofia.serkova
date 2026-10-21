export const energyOptions = {
  hero: {
    baseColor: [234, 240, 226],
    strength: 0.8,
    speed: 0.35,
    colors: [
      [225, 244, 203],
      [225, 244, 203],
      [225, 244, 203],
      [225, 244, 203],
    ],
    radius: 0.14,
    spread: 1.4,
    deformation: 0,
    grainOpacity: 0.035,
    origin: { x: 0.55, y: 0.36 },
    textSelector:
      ".hero .location, #hero-title, .hero-message, .hero-profession, .hero-actions, .hero-foot",
  },
  history: {
    textSelector:
      ".section-kicker, #history-title, .history-entry, .history-caption",
  },
  footer: {
    baseColor: [145, 73, 82],
    radius: 1.2,
    origin: { x: 0.65, y: 0.1 },
    textHalo: 24,
    colors: [
      [225, 244, 203],
      [186, 203, 169],
      [225, 244, 203],
      [48, 56, 44],
    ],
    textSelector:
      ".footer-inner .wordmark, .footer-inner > span, .footer-inner > a:last-child",
  },
};
