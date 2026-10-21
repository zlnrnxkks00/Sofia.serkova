export const clamp = (value, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));
