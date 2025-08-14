import { processGeometry } from "@/helpers/processGeometry.helper";
import { LineBasicMaterial } from "three";
import { processLine } from "@/helpers/processLines.helper";

import { readStitches } from "./readStitches";

// https://edutechwiki.unige.ch/en/Embroidery_format_JEF
export const readerPES = async (file: File) => {
  const { blocks, colorGroup, file_details } = await readStitches(file);

  console.log({ blocks, colorGroup, file_details });
  const geometries = blocks.map((b) => processGeometry(b.vertices, b.colors));

  const material = new LineBasicMaterial({ vertexColors: true });

  // Transform geometries to THREE.Line objects
  const lines = geometries.map((geometry) => processLine(geometry, material));

  return { lines, colorGroup, file_details };
};
