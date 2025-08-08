import { BufferGeometry, Line, LineBasicMaterial } from "three";

export const processLine = (
  geometry: BufferGeometry,
  material: LineBasicMaterial
): Line => {
  const line = new Line(geometry, material);
  line.scale.set(0.01, 0.01, 0.01);
  line.updateMatrixWorld(true);

  return line;
};
