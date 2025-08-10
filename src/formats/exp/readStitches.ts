import { blobToData } from "@/helpers/processBuffer.helper";
import { signed8 } from "@/helpers/readBit.helper";
import type {
  ColorGroup,
  FileDetails,
  PromiseReadStitches,
  StitchBlock,
} from "@/types/embroidery.types";
import { generatePalette } from "@/utils/generatePalette";

export const readStitches = async (
  file: File
): Promise<PromiseReadStitches> => {
  const buffer = await blobToData(file);
  const view = new DataView(buffer);

  const file_details: FileDetails = {
    name: file.name.substring(0, file.name.lastIndexOf(".")),
    extension: file.name.split(".").pop()?.toLocaleUpperCase() + "",
    color_changes: 0,
    stitches: 0,
    width: 0, // Diameter is not provided in the header, can be calculated if needed
    height: 0, // Diameter is not provided in the header, can be calculated if needed
    jumps: 0, // Jumps are not counted in the original header, but can be calculated
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
  let currentBlock: StitchBlock = { vertices: [], colors: [] };

  let cx = 0,
    cy = 0,
    ptr = 0;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  while (ptr < view.byteLength) {
    const b1 = view.getUint8(ptr++);
    const b2 = view.getUint8(ptr++);

    minX = Math.min(minX, cx);
    minY = Math.min(minY, cy);
    maxX = Math.max(maxX, cx);
    maxY = Math.max(maxY, cy);

    // Normal Stitch
    if (b1 !== 0x80) {
      const dx = signed8(b1);
      const dy = signed8(b2);
      cx += dx;
      cy += dy;

      currentBlock.vertices.push(cx, cy, 0);
      currentBlock.colors.push(currentColor.r, currentColor.g, currentColor.b);

      pointIndex++;
      continue;
    }

    const isEnd = b2 === 0x80; // This could be b1 === 0x80 && b2 === 0x80;
    if (isEnd) continue;

    const isColorChange = b2 === 0x01; // This could be b1 === 0x80 && b2 === 0x01;
    if (isColorChange) {
      currentGroup.count = pointIndex - currentGroup.start;
      colorGroup.push(currentGroup);

      if (currentBlock.vertices.length > 0) {
        blocks.push(currentBlock);
        currentBlock = { vertices: [], colors: [] };
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

    const ex = view.getUint8(ptr++);
    const ey = view.getUint8(ptr++);
    const dx = signed8(ex);
    const dy = signed8(ey);

    const isJump = b2 === 0x04; // This could be b1 === 0x80 && b2 === 0x04;
    // const isTrim = b2 === 0x05; // This could be b1

    if (isJump) {
      if (currentBlock.vertices.length > 0) {
        blocks.push(currentBlock);
        currentBlock = { vertices: [], colors: [] };
      }
      cx += dx;
      cy += dy;
      continue;
    } else {
      cx += dx;
      cy += dy;
      currentBlock.vertices.push(cx, cy, 0);
      currentBlock.colors.push(currentColor.r, currentColor.g, currentColor.b);
      pointIndex++;
      continue;
    }
  }

  if (currentBlock.vertices.length > 0) {
    blocks.push(currentBlock);
  }

  currentGroup.count = pointIndex - currentGroup.start;
  colorGroup.push(currentGroup);

  file_details.color_changes = colorGroup.length;
  file_details.stitches = pointIndex;
  file_details.width = (maxX - minX) / 10; // fix, divide by 10 to match the original scale
  file_details.height = (maxY - minY) / 10; // e.x, 504 to 50.4

  return {
    blocks,
    colorGroup,
    file_details,
  };
};
