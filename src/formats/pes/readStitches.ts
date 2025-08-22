import { blobToData } from "@/helpers/processBuffer.helper";
import type {
  ColorGroup,
  FileDetails,
  PromiseReadStitches,
  StitchBlock,
} from "@/types/embroidery.types";
import { generatePalette } from "@/utils/generatePalette.utils";
import { MAP_BYTE } from "./constants";
import { colorFloatToUint8 } from "@/utils/colorUtils.utils";

export const readStitches = async (
  file: File
): Promise<PromiseReadStitches> => {
  const buffer = await blobToData(file);
  const view = new DataView(buffer);
  const uint8List = new Uint8Array(buffer);
  const decoder = new TextDecoder("utf8");

  const PEC_BYTE_OFFSET = view.getUint32(8, true);
  const colorOffset =
    PEC_BYTE_OFFSET + MAP_BYTE.PEC_HEADER.FIRST_SECTION.COLOR_COUNT;
  const colorCount = uint8List[colorOffset] + 1;

  const filesDetails: FileDetails = {
    name: file.name.substring(0, file.name.lastIndexOf(".")),
    extension: file.name.split(".").pop()?.toLocaleUpperCase() + "",
    color_changes: colorCount,
    stitches: 0,
    width: 0,
    height: 0,
    jumps: 0,
    size: file.size / 1024, // Size in KB
    version: decoder.decode(buffer.slice(0, 8)),
  };

  const blocks: StitchBlock[] = [];

  const threeColors = generatePalette(colorCount);
  let currentColor = threeColors[0];

  const colorGroup: ColorGroup[] = [];
  let pointIndex = 0;
  let index = 0;
  let currentGroup: ColorGroup = {
    index,
    start: pointIndex,
    count: 0,
    color: [currentColor.r, currentColor.g, currentColor.b],
  };

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  let cx = 0,
    cy = 0,
    x = 0,
    y = 0;
  let ptr =
    PEC_BYTE_OFFSET +
    MAP_BYTE.PEC_HEADER.SECOND_SECTION["pec-stitch-list-subsection"];
  const { FLAG_LONG, JUMP_CODE, TRIM_CODE, END, COLOR_CHANGE } =
    MAP_BYTE.COMMANDS;

  const estimatedPoints = Math.floor(file.size / 2);
  let vertices = new Float32Array(estimatedPoints * 3);
  let colors = new Uint8Array(estimatedPoints * 3);
  let vIndex = 0,
    cIndex = 0;

  while (ptr < uint8List.length) {
    let trim = false,
      jump = false;

    const b1 = uint8List[ptr++];
    let b2 = uint8List[ptr++];

    if (END(b1, b2)) break;

    if (COLOR_CHANGE(b1, b2)) {
      ptr++;

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
      currentColor = threeColors[index];

      currentGroup = {
        index,
        start: pointIndex,
        count: 0,
        color: [currentColor.r, currentColor.g, currentColor.b],
      };

      continue;
    }

    // X
    if (b1 & FLAG_LONG) {
      const code = (b1 << 8) | b2;

      jump = !!(b1 & JUMP_CODE);
      trim = !!(b1 & TRIM_CODE);

      x = (code << 20) >> 20;
      b2 = uint8List[ptr++];
    } else {
      x = (b1 << 25) >> 25;
    }

    // Y
    if (b2 & FLAG_LONG) {
      const b3 = uint8List[ptr++];

      const code = (b2 << 8) | b3;
      jump = !!(b2 & JUMP_CODE);
      trim = !!(b2 & TRIM_CODE);

      y = -(code << 20) >> 20;
    } else {
      y = -(b2 << 25) >> 25;
    }

    if (jump || trim) {
      filesDetails.jumps += 1;

      cx += x;
      cy += y;

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
    } else {
      cx += x;
      cy += y;

      minX = Math.min(minX, cx);
      minY = Math.min(minY, cy);
      maxX = Math.max(maxX, cx);
      maxY = Math.max(maxY, cy);

      vertices[vIndex++] = cx;
      vertices[vIndex++] = cy;
      vertices[vIndex++] = 0;

      const tempColor = colorFloatToUint8([
        currentColor.r,
        currentColor.g,
        currentColor.b,
      ]);

      colors[cIndex++] = tempColor[0];
      colors[cIndex++] = tempColor[1];
      colors[cIndex++] = tempColor[2];
      pointIndex++;
    }
  }

  filesDetails.stitches = pointIndex;
  const sizeX = maxX - minX;
  const sizeY = maxY - minY;

  filesDetails.width = sizeX / 10;
  filesDetails.height = sizeY / 10;

  currentGroup.count = pointIndex - currentGroup.start;
  colorGroup.push(currentGroup);

  if (vIndex > 0) {
    const finalVertices = vertices.subarray(0, vIndex);
    const finalColors = colors.subarray(0, cIndex);

    blocks.push({
      vertices: finalVertices,
      colors: finalColors,
    });
  }

  return {
    blocks,
    colorGroup,
    filesDetails,
    designMetrics: {
      boundingBox: {
        center: [(minX + maxX) / 2, (minY + maxY) / 2],
        maxDimension: Math.max(0.01 * sizeX, 0.01 * sizeY, 0),
        size: {
          x: { max: maxX, min: minX },
          y: { max: maxY, min: minY },
        },
      },
    },
  };
};
