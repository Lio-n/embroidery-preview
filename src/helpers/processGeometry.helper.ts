import {
  BufferGeometry,
  Float32BufferAttribute,
  Uint8BufferAttribute,
} from "three";

export const processGeometry = (
  vertices: unknown,
  colors: unknown
): BufferGeometry => {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(vertices as [], 3)
  );
  geometry.setAttribute("color", new Uint8BufferAttribute(colors as [], 3));

  return geometry;
};
