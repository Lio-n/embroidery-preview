import type { ColorGroup } from "../components/ColorGroup";
import { parseDST, type FileDetails } from "./parseDST";
import { Line, LineBasicMaterial } from "three";

type PromiseLoaderDSTFile = {
  lines: Line[]; // Cambia a array de líneas
  colorGroup: ColorGroup[];
  file_details: FileDetails;
};

export const loaderDSTFile = async (
  file: File
): Promise<PromiseLoaderDSTFile> => {
  const { geometries, colorGroup, file_details } = await parseDST(file);

  const material = new LineBasicMaterial({ vertexColors: true });

  // Transform geometries to THREE.Line objects
  const lines = geometries.map((geometry) => {
    const line = new Line(geometry, material);
    line.scale.set(0.01, 0.01, 0.01);
    line.updateMatrixWorld(true);
    return line;
  });

  return { lines, colorGroup, file_details };
};
