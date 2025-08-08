import type {
  ColorGroup,
  FileDetails,
  PromiseReadStitches,
  StitchBlock,
} from "@/types/embroidery.types";
import { decodeCoord } from "./decodeCoord";
import { decodeHeader } from "./docodeHeader";
import { blobToData } from "@/helpers/processBuffer.helper";
import { generatePalette } from "@/utils/generatePalette";

export const readStitches = async (
  file: File
): Promise<PromiseReadStitches> => {
  const buffer = await blobToData(file);
  const header = decodeHeader(buffer);
  const threeColors = generatePalette(parseInt(header?.CO));

  const dataView = new DataView(buffer);

  let currentColor = threeColors[0];
  let index = 0,
    cx = 0,
    cy = 0;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  const blocks: StitchBlock[] = [];
  let currentBlock: StitchBlock = { vertices: [], colors: [] };

  const colorGroup: ColorGroup[] = [];
  let pointIndex = 0;

  let currentGroup: ColorGroup = {
    index,
    start: pointIndex,
    count: 0,
    color: [currentColor.r, currentColor.g, currentColor.b],
  };

  const file_details: FileDetails = {
    name: file.name.split(".")[0],
    extension: file.name.split(".")[1].toLocaleUpperCase(),
    color_changes: +header.CO + 1,
    stitches: parseInt(header?.ST),
    width: 0, // Diameter is not provided in the header, can be calculated if needed
    height: 0, // Diameter is not provided in the header, can be calculated if needed
    jumps: 0, // Jumps are not counted in the original header, but can be calculated
    size: file.size / 1024, // Size in KB
  };

  for (let i = 512; i < dataView.byteLength; i += 3) {
    if (i >= dataView.byteLength - 3) break;

    const byte1 = dataView.getUint8(i);
    const byte2 = dataView.getUint8(i + 1);
    const byte3 = dataView.getUint8(i + 2);

    // Check for end of file sequence
    if (byte1 === 0x00 && byte2 === 0x00 && byte3 === 0xf3) break;

    const { x, y, color_stop, jump } = decodeCoord(byte3, byte2, byte1);
    file_details.jumps += jump ? 1 : 0;
    cx += x;
    cy += y;

    if (!jump) {
      minX = Math.min(minX, cx);
      minY = Math.min(minY, cy);
      maxX = Math.max(maxX, cx);
      maxY = Math.max(maxY, cy);
    }

    if (color_stop) {
      currentGroup.count = pointIndex - currentGroup.start;
      colorGroup.push(currentGroup);

      if (currentBlock.vertices.length > 0) {
        blocks.push(currentBlock);
        currentBlock = { vertices: [], colors: [] };
      }

      index++;
      currentColor = threeColors[index % threeColors.length];

      // new color group
      currentGroup = {
        index,
        start: pointIndex,
        count: 0,
        color: [currentColor.r, currentColor.g, currentColor.b],
      };
    }

    if (jump) {
      if (currentBlock.vertices.length > 0) {
        blocks.push(currentBlock);
        currentBlock = { vertices: [], colors: [] };
      }
      continue; // Skip jump stitches
    }

    currentBlock.vertices.push(cx, cy, 0); // Z-coordinate is 0 as embroidery designs are 2D
    currentBlock.colors.push(currentColor.r, currentColor.g, currentColor.b);
    pointIndex++;
  }

  file_details.width = (maxX - minX) / 10; // fix, divide by 10 to match the original scale
  file_details.height = (maxY - minY) / 10; // e.x, 504 to 50.4

  currentGroup.count = pointIndex - currentGroup.start;
  colorGroup.push(currentGroup);

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

  console.log("VERTICES - COLORS : ", {
    mergedVertices,
    mergedColors,
    file_details,
  });

  return {
    blocks,
    colorGroup,
    file_details,
  };
};
