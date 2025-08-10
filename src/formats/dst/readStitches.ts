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
    name: file.name.substring(0, file.name.lastIndexOf(".")),
    extension: file.name.split(".").pop()?.toLocaleUpperCase() + "",
    color_changes: +header.CO + 1,
    stitches: parseInt(header?.ST),
    width: 0, // Diameter is not provided in the header, can be calculated if needed
    height: 0, // Diameter is not provided in the header, can be calculated if needed
    jumps: 0, // Jumps are not counted in the original header, but can be calculated
    size: file.size / 1024, // Size in KB
  };

  for (let i = 512; i < dataView.byteLength; i += 3) {
    if (i >= dataView.byteLength - 3) break;

    const b1 = dataView.getUint8(i);
    const b2 = dataView.getUint8(i + 1);
    const b3 = dataView.getUint8(i + 2);

    const isEnd = b1 === 0x00 && b2 === 0x00 && b3 === 0xf3;
    // Check for end of file sequence
    if (isEnd) break;

    const {
      x,
      y,
      color_stop: isColorChange,
      jump: isJump,
    } = decodeCoord(b3, b2, b1);
    file_details.jumps += isJump ? 1 : 0;
    cx += x;
    cy += y;

    minX = Math.min(minX, cx);
    minY = Math.min(minY, cy);
    maxX = Math.max(maxX, cx);
    maxY = Math.max(maxY, cy);

    if (isColorChange) {
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

    if (isJump) {
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

  file_details.width = (maxX - minX) / 10;
  file_details.height = (maxY - minY) / 10;

  currentGroup.count = pointIndex - currentGroup.start;
  colorGroup.push(currentGroup);

  if (currentBlock.vertices.length > 0) {
    blocks.push(currentBlock);
  }

  return {
    blocks,
    colorGroup,
    file_details,
  };
};
