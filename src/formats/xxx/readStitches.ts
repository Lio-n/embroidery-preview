import { blobToData } from "@/helpers/processBuffer.helper";
import { decodeSignedByte } from "@/helpers/readBit.helper";
import type { ColorGroup, FileDetails } from "@/types/embroidery.types";
import { generatePalette } from "@/utils/generatePalette";
import { MAP_BYTE } from "./constants";

type StitchBlock = {
  vertices: Float32Array<ArrayBuffer>;
  colors: Uint8Array<ArrayBuffer>;
};

type PromiseReadStitches = {
  blocks: StitchBlock[];
  colorGroup: ColorGroup[];
  file_details: FileDetails;
};

export const readStitches = async (
  file: File
): Promise<PromiseReadStitches> => {
  const buffer = await blobToData(file);
  const view = new DataView(buffer);
  const uint8List = new Uint8Array(buffer);

  const colorCount = view.getUint16(MAP_BYTE.COLOR_COUNT, true);

  const palette_offset = view.getUint32(MAP_BYTE.PALETTE_OFFSET, true);

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  let cx = 0,
    cy = 0,
    x = 0,
    y = 0;

  const file_details: FileDetails = {
    name: file.name.substring(0, file.name.lastIndexOf(".")),
    extension: file.name.split(".").pop()?.toLocaleUpperCase() + "",
    color_changes: colorCount,
    stitches: 0,
    width: 0,
    height: 0,
    jumps: 0,
    size: file.size / 1024, // Size in KB
  };

  const threeColors = generatePalette(colorCount);

  let currentColor = threeColors[0];
  const colorGroup: ColorGroup[] = [];
  let pointIndex = 0,
    index = 0;

  let currentGroup: ColorGroup = {
    index,
    start: pointIndex,
    count: 0,
    color: [currentColor.r, currentColor.g, currentColor.b],
  };

  const blocks: StitchBlock[] = [];
  const estimatedPoints = Math.floor(file.size / 2);

  let vertices = new Float32Array(estimatedPoints * 3);
  let colors = new Uint8Array(estimatedPoints * 3);
  let vIndex = 0,
    cIndex = 0;

  const { TRIM, JUMP, END, COLOR_CHANGE, LONG } = MAP_BYTE.COMMANDS;

  let ptr = 0x100;
  while (ptr < palette_offset) {
    const b1 = uint8List[ptr++];
    const b2 = uint8List[ptr++];

    if (END(b1, b2)) break;

    if (LONG(b1)) {
      x = (b2 & 0xff) + (uint8List[ptr++] << 8);
      y = view.getInt16(ptr, true);
      ptr += 2;
    } else {
      // NORMAL STITCH
      x = decodeSignedByte(b1);
      y = decodeSignedByte(b2);
    }

    if (COLOR_CHANGE(b1, b2)) {
      currentGroup.count = pointIndex - currentGroup.start;
      colorGroup.push(currentGroup);

      if (vIndex > 0) {
        const finalVertices = vertices.subarray(0, vIndex);
        const finalColors = colors.subarray(0, cIndex);

        blocks.push({
          vertices: finalVertices,
          colors: finalColors,
        });

        vertices = new Float32Array(estimatedPoints * 3);
        colors = new Uint8Array(estimatedPoints * 3);
        vIndex = 0;
        cIndex = 0;
      }

      index++;
      currentColor = threeColors[index % threeColors.length];

      currentGroup = {
        index,
        start: pointIndex,
        count: 0,
        color: [currentColor.r, currentColor.g, currentColor.b],
      };
      continue;
    }

    if (JUMP(b1, b2)) {
      if (vIndex > 0) {
        const finalVertices = vertices.subarray(0, vIndex);
        const finalColors = colors.subarray(0, cIndex);

        blocks.push({
          vertices: finalVertices,
          colors: finalColors,
        });

        vertices = new Float32Array(estimatedPoints * 3);
        colors = new Uint8Array(estimatedPoints * 3);
        vIndex = 0;
        cIndex = 0;
      }

      file_details.jumps += 1;
      continue;
    }

    if (TRIM(b1, b2)) {
      if (vIndex > 0) {
        const finalVertices = vertices.subarray(0, vIndex);
        const finalColors = colors.subarray(0, cIndex);

        blocks.push({
          vertices: finalVertices,
          colors: finalColors,
        });

        vertices = new Float32Array(estimatedPoints * 3);
        colors = new Uint8Array(estimatedPoints * 3);
        vIndex = 0;
        cIndex = 0;
      }

      continue;
    }

    minX = Math.min(minX, cx);
    minY = Math.min(minY, cy);
    maxX = Math.max(maxX, cx);
    maxY = Math.max(maxY, cy);

    cx += x;
    cy += y;

    vertices[vIndex++] = cx;
    vertices[vIndex++] = cy;
    vertices[vIndex++] = 0;

    colors[cIndex++] = currentColor.r;
    colors[cIndex++] = currentColor.g;
    colors[cIndex++] = currentColor.b;

    pointIndex++;
  }

  file_details.stitches = pointIndex;
  file_details.width = (maxX - minX) / 10;
  file_details.height = (maxY - minY) / 10;

  if (vIndex > 0) {
    const finalVertices = vertices.subarray(0, vIndex);
    const finalColors = colors.subarray(0, cIndex);

    blocks.push({
      vertices: finalVertices,
      colors: finalColors,
    });
  }

  return { blocks, colorGroup, file_details };
};
