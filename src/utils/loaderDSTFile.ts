import type { ColorGroup } from "../components/ColorGroup";
import { parseDST, type FileDetails } from "./parseDST";
import * as THREE from "three";

type PromiseLoaderDSTFile = {
  lines: THREE.Line[]; // Cambia a array de líneas
  colorGroup: ColorGroup[];
  file_details: FileDetails;
};

export const loaderDSTFile = async (
  file: File
): Promise<PromiseLoaderDSTFile> => {
  const { geometries, colorGroup, file_details } = await parseDST(file);

  const material = new THREE.LineBasicMaterial({ vertexColors: true });

  // Transform geometries to THREE.Line objects
  const lines = geometries.map((geometry) => {
    const line = new THREE.Line(geometry, material);
    line.scale.set(0.01, 0.01, 0.01);
    line.updateMatrixWorld(true);
    return line;
  });

  return { lines, colorGroup, file_details };
};
