import { processGeometry } from "@/helpers/processGeometry.helper";
import { LineBasicMaterial } from "three";
import { readStitches } from "./readStitches";
import { processLine } from "@/helpers/processLines.helper";

// https://edutechwiki.unige.ch/en/Embroidery_format_JEF
export const readerJEF = async (file: File) => {
  const { blocks, colorGroup, file_details } = await readStitches(file);

  console.log("Parsed JEF file:", { file_details, colorGroup, blocks });

  const geometries = blocks.map((b) => processGeometry(b.vertices, b.colors));

  const material = new LineBasicMaterial({ vertexColors: true });

  // Transform geometries to THREE.Line objects
  const lines = geometries.map((geometry) => processLine(geometry, material));

  return { lines, colorGroup, file_details };
};
