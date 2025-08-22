import { processGeometry } from "@/helpers/processGeometry.helper";
import { LineBasicMaterial } from "three";
import { processLine } from "@/helpers/processLines.helper";
import { readStitches } from "./readStitches";

// https://edutechwiki.unige.ch/en/Embroidery_format_DST
// The DST file is just a collection of stitch start and end points on a piece of fabric.
// What I did in my DST loader is simulate that machine… and instead of thread, i draw quads with a texture of a small piece of thread on them, so when they are combined side by side it looks like the embroidery.
export const readerDST = async (file: File) => {
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
