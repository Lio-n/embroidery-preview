import { Color } from "three";

export const generatePalette = (colorCount: number): Color[] => {
  const palette: Color[] = [];

  for (let i = 0; i < colorCount + 1; i++) {
    const r = Math.random();
    const g = Math.random();
    const b = Math.random();

    palette.push(new Color(r, g, b));
  }

  return palette;
};
