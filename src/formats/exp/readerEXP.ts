import { processGeometry } from "@/helpers/processGeometry.helper";
import { LineBasicMaterial } from "three";
import { processLine } from "@/helpers/processLines.helper";
import { readStitches } from "./readStitches";

// https://edutechwiki.unige.ch/en/Embroidery_format_EXP
export const readerEXP = async (file: File) => {
  const { blocks, ...r } = await readStitches(file);

  const geometries = blocks.map((b) => processGeometry(b.vertices, b.colors));

  const material = new LineBasicMaterial({ vertexColors: true });

  // Transform geometries to THREE.Line objects
  const lines = geometries.map((geometry) => processLine(geometry, material));

  return {
    lines,
    blocks,
    ...r,
  };
};
