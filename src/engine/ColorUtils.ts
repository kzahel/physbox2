/** Generate a random HSLA body color. */
export function randomBodyColor(satBase = 50, satRange = 40, litBase = 40, litRange = 25, alpha = 0.85): string {
  const hue = Math.floor(Math.random() * 360);
  const sat = satBase + Math.floor(Math.random() * satRange);
  const lit = litBase + Math.floor(Math.random() * litRange);
  return `hsla(${hue},${sat}%,${lit}%,${alpha})`;
}
