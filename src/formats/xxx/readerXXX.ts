import { processGeometry } from "@/helpers/processGeometry.helper";
import { LineBasicMaterial } from "three";
import { readStitches } from "./readStitches";
import { processLine } from "@/helpers/processLines.helper";

// https://edutechwiki.unige.ch/en/Embroidery_format_XXX
export const readerXXX = async (file: File) => {
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
