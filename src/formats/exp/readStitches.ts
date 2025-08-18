import { blobToData } from "@/helpers/processBuffer.helper";
import { signed8 } from "@/helpers/readBit.helper";
import type {
  ColorGroup,
  FileDetails,
  PromiseReadStitches,
  StitchBlock,
} from "@/types/embroidery.types";
import { generatePalette } from "@/utils/generatePalette";
import { MAP_BYTE } from "./constants";

export const readStitches = async (
  file: File
): Promise<PromiseReadStitches> => {
  const buffer = await blobToData(file);
  const uint8List = new Uint8Array(buffer);

  const filesDetails: FileDetails = {
    name: file.name.substring(0, file.name.lastIndexOf(".")),
    extension: file.name.split(".").pop()?.toLocaleUpperCase() + "",
    color_changes: 0,
    stitches: 0,
    width: 0,
    height: 0,
    jumps: 0,
    size: file.size / 1024, // Size in KB
  };

  const palette = generatePalette(10);

  let colorIndex = 0;
  let currentColor = palette[colorIndex];

  const colorGroup: ColorGroup[] = [];
  let pointIndex = 0;

  let currentGroup: ColorGroup = {
    index: colorIndex,
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

  let cx = 0,
    cy = 0,
    ptr = 0;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  const { JUMP_CODE, COLOR_CHANGE_CODE, END_CODE, FLAG } = MAP_BYTE.COMMANDS;

  while (ptr < uint8List.length) {
    const b1 = uint8List[ptr++];
    const b2 = uint8List[ptr++];

    // Normal Stitch
    if (b1 !== FLAG) {
      minX = Math.min(minX, cx);
      minY = Math.min(minY, cy);
      maxX = Math.max(maxX, cx);
      maxY = Math.max(maxY, cy);

      const dx = signed8(b1);
      const dy = signed8(b2);
      cx += dx;
      cy += dy;

      vertices[vIndex++] = cx;
      vertices[vIndex++] = cy;
      vertices[vIndex++] = 0;

      colors[cIndex++] = currentColor.r;
      colors[cIndex++] = currentColor.g;
      colors[cIndex++] = currentColor.b;

      pointIndex++;
      continue;
    }

    if (b2 === END_CODE) continue;

    if (b2 === COLOR_CHANGE_CODE) {
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

      colorIndex++;
      currentColor = palette[colorIndex % palette.length];

      currentGroup = {
        index: colorIndex,
        start: pointIndex,
        count: 0,
        color: [currentColor.r, currentColor.g, currentColor.b],
      };

      continue;
    }

    const ex = uint8List[ptr++];
    const ey = uint8List[ptr++];
    const dx = signed8(ex);
    const dy = signed8(ey);
    cx += dx;
    cy += dy;

    if (b2 === JUMP_CODE) {
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
    } else {
      vertices[vIndex++] = cx;
      vertices[vIndex++] = cy;
      vertices[vIndex++] = 0;

      colors[cIndex++] = currentColor.r;
      colors[cIndex++] = currentColor.g;
      colors[cIndex++] = currentColor.b;
      pointIndex++;
      continue;
    }
  }

  if (vIndex > 0) {
    const finalVertices = vertices.subarray(0, vIndex);
    const finalColors = colors.subarray(0, cIndex);

    blocks.push({
      vertices: finalVertices,
      colors: finalColors,
    });
  }

  currentGroup.count = pointIndex - currentGroup.start;
  colorGroup.push(currentGroup);

  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  filesDetails.color_changes = colorGroup.length;
  filesDetails.stitches = pointIndex;
  filesDetails.width = sizeX / 10;
  filesDetails.height = sizeY / 10;

  return {
    blocks,
    colorGroup,
    filesDetails,
    designMetrics: {
      boundingBox: {
        center: [(minX + maxX) / 2, (minY + maxY) / 2],
        maxDimension: Math.max(0.01 * sizeX, 0.01 * sizeY, 0),
      },
    },
  };
};
