import type { ColorGroup } from "../components/ColorGroup";
import { parseDST } from "./parseDST";
import * as THREE from "three";

export const loaderDSTFile = async (
  file: File
): Promise<[THREE.Line, ColorGroup[]]> => {
  const { geometry, colorGroup } = await parseDST(file);

  const material = new THREE.LineBasicMaterial({ vertexColors: true });

  const lines = new THREE.Line(geometry, material);

  lines.scale.set(0.01, 0.01, 0.01);
  lines.updateMatrixWorld(true);
  return [lines, colorGroup];
};
