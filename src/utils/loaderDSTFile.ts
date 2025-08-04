import { parseDST } from "./parseDST";
import * as THREE from "three/webgpu";

export const loaderDSTFile = async (file: File): Promise<THREE.Line> => {
  const geometry = await parseDST(file);

  const material = new THREE.LineBasicMaterial({ vertexColors: true });

  const lines = new THREE.Line(geometry, material);

  lines.scale.set(0.01, 0.01, 0.01);
  lines.updateMatrixWorld(true);
  return lines;
};
