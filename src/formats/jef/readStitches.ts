import { parseDatetime } from "@/helpers/parseDatetime.helper";
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
  const view = new DataView(buffer);
  const uint8List = new Uint8Array(buffer);

  const colorCount = view.getInt32(MAP_BYTE.COLOR_COUNT, true);
  const stitchOffset = view.getInt32(MAP_BYTE.OFFSET_STITCH, true);

  const dateStr = parseDatetime(
    new TextDecoder("ascii").decode(buffer.slice(8, 8 + 14))
  );

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  let cx = 0,
    cy = 0;

  const file_details: FileDetails = {
    name: file.name.substring(0, file.name.lastIndexOf(".")),
    extension: file.name.split(".").pop()?.toLocaleUpperCase() + "",
    color_changes: colorCount,
    date: dateStr.toLocaleDateString(),
    stitches: 0,
    width: 0,
    height: 0,
    jumps: 0,
    size: file.size / 1024, // Size in KB
  };

  // TODO: implement Janome color table
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

  let ptr = stitchOffset; // Start of stitch data

  const { JUMP_CODE, FLAG, END_CODE, COLOR_CHANGE_CODE } = MAP_BYTE.COMMANDS;

  while (ptr < buffer.byteLength) {
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

    if (b2 === END_CODE) break;

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

    if (b2 === JUMP_CODE) {
      file_details.jumps += 1;

      const dx = signed8(view.getUint8(ptr++));
      const dy = signed8(view.getUint8(ptr++));
      cx += dx;
      cy += dy;

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
  }

  file_details.stitches = pointIndex;
  currentGroup.count = pointIndex - currentGroup.start;
  colorGroup.push(currentGroup);

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

  return {
    blocks,
    colorGroup,
    file_details,
  };
};
