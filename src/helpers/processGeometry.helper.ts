import {
  BufferGeometry,
  Float32BufferAttribute,
  Uint8BufferAttribute,
} from "three";

export const processGeometry = (
  vertices: Float32Array<ArrayBuffer>,
  colors: Uint8Array<ArrayBuffer>
): BufferGeometry => {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("color", new Uint8BufferAttribute(colors, 3));

  return geometry;
};
