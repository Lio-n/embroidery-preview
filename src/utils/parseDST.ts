import { blobToData } from "../helpers/processBuffer.helper";
import { decodeCoord } from "./decodeCoord";
import { decodeHeader } from "./docodeHeader";
import { parseColor } from "./parseColor";
import * as THREE from "three/webgpu";

const processGeometry = (
  vertices: number[],
  colors: number[]
): THREE.BufferGeometry => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  return geometry;
};

type StitchBlock = {
  vertices: number[];
  colors: number[];
};
export const parseDST = async (file: File): Promise<THREE.BufferGeometry> => {
  const buffer = await blobToData(file);
  const dataView = new DataView(buffer);
  const header = decodeHeader(buffer);
  const threeColors = parseColor(parseInt(header?.CO));
  let currentColor = threeColors[0];
  let index = 0;
  let cx = 0,
    cy = 0;

  const blocks: StitchBlock[] = [];
  let currentBlock: StitchBlock = { vertices: [], colors: [] };

  for (let i = 512; i < dataView.byteLength; i += 3) {
    if (i >= dataView.byteLength - 3) break;

    const byte1 = dataView.getUint8(i);
    const byte2 = dataView.getUint8(i + 1);
    const byte3 = dataView.getUint8(i + 2);

    // Check for end of file sequence
    if (byte1 === 0x00 && byte2 === 0x00 && byte3 === 0xf3) break;

    const { x, y, color_stop } = decodeCoord(byte3, byte2, byte1);
    cx += x;
    cy += y;

    if (color_stop) {
      if (currentBlock.vertices.length > 0) {
        blocks.push(currentBlock);
        currentBlock = { vertices: [], colors: [] };
      }

      index++;
      currentColor = threeColors[index % threeColors.length];
    }

    currentBlock.vertices.push(cx, cy, 0);
    currentBlock.colors.push(currentColor.r, currentColor.g, currentColor.b);
  }

  if (currentBlock.vertices.length > 0) {
    blocks.push(currentBlock);
  }

  const mergedVertices: number[] = [];
  const mergedColors: number[] = [];

  // unify blocks
  blocks.forEach((b) => {
    mergedVertices.push(...b.vertices);
    mergedColors.push(...b.colors);
  });

  console.log("VERTICES - COLORS : ", { mergedVertices, mergedColors });
  // THREE GEOMETRY : position=vertice - color=colors
  const geometry = processGeometry(mergedVertices, mergedColors);

  return geometry;
};
// The DST file is just a collection of stitch start and end points on a piece of fabric.

// What I did in my DST loader is simulate that machine… and instead of thread, i draw quads with a texture of a small piece of thread on them, so when they are combined side by side it looks like the embroidery.
