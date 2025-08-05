import type { ColorGroup } from "../components/ColorGroup";
import { parseDST } from "./parseDST";
import * as THREE from "three";

type PromiseLoaderDSTFile = {
  lines: THREE.Line;
  colorGroup: ColorGroup[];
};

export const loaderDSTFile = async (
  file: File
): Promise<PromiseLoaderDSTFile> => {
  const { geometry, colorGroup } = await parseDST(file);

  const material = new THREE.LineBasicMaterial({ vertexColors: true });

  const lines = new THREE.Line(geometry, material);

  lines.scale.set(0.01, 0.01, 0.01);
  lines.updateMatrixWorld(true);
  return { lines, colorGroup };
};
