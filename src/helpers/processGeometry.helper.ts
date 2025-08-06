import { BufferGeometry, Float32BufferAttribute } from "three";

export const processGeometry = (
  vertices: number[],
  colors: number[]
): BufferGeometry => {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));

  return geometry;
};
