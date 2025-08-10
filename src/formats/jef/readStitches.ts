import { parseDatetime } from "@/helpers/parseDatetime.helper";
import { blobToData } from "@/helpers/processBuffer.helper";
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
  const colorCount = view.getInt32(0x18, true); // Amount of colors
  const stitchOffset = view.getInt32(0, true); // Offset to stitch data
  const dateStr = parseDatetime(
    new TextDecoder("ascii").decode(buffer.slice(8, 8 + 14))
  );

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  const file_details: FileDetails = {
    name: file.name.substring(0, file.name.lastIndexOf(".")),
    extension: file.name.split(".").pop()?.toLocaleUpperCase() + "",
    color_changes: colorCount,
    date: dateStr.toLocaleDateString(),
    stitches: 0, // Stitches will be calculated later
    width: 0, // Diameter is not provided in the header, can be calculated if needed
    height: 0, // Diameter is not provided in the header, can be calculated if needed
    jumps: 0, // Jumps are not counted in the original header, but can be calculated
    size: file.size / 1024, // Size in KB
  };

  // ---- PARSE COLOR TABLE ----
  const colors: number[] = [];
  let colorTableOffset = 0x74; // Color table starts at byte 0x74
  for (let i = 0; i < colorCount; i++) {
    colors.push(view.getInt32(colorTableOffset, true));
    colorTableOffset += 4;
  }

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

  // ---- PARSE STITCH DATA ----
  const blocks: StitchBlock[] = [];
  let currentBlock: StitchBlock = { vertices: [], colors: [] };

  let ptr = stitchOffset; // Start of stitch data
  let cx = 0,
    cy = 0;
  while (ptr < buffer.byteLength) {
    const b1 = view.getUint8(ptr++); // First byte of stitch command
    const b2 = view.getUint8(ptr++); // Second byte of stitch command

    /* JEF Body - Command Table
    | Command      | B0   | B1   |
    | ------------ | ---- | ---- |
    | END          | 0x80 | 0x10 |
    | COLOR_CHANGE | 0x80 | 0x01 |
    | STOP         | 0x80 | 0x01 |
    | JUMP         | 0x80 | 0x02 |
    | TRIM         | 0x80 | 0x02 |
    */

    // Normal stitch
    const dx = b1 & 0x80 ? b1 - 0x100 : b1;
    const dy = b2 & 0x80 ? b2 - 0x100 : b2;

    minX = Math.min(minX, cx);
    minY = Math.min(minY, cy);
    maxX = Math.max(maxX, cx);
    maxY = Math.max(maxY, cy);

    if (b1 === 0x80) {
      if (b2 === 0x10) {
        // END
        currentBlock.vertices.push(0, 0, 0);
        break;
      }
      if (b2 === 0x01) {
        // COLOR CHANGE

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
        continue;
      }
      if (b2 === 0x02) {
        // TRIM/JUMP
        file_details.jumps += 1; // Count jumps

        if (currentBlock.vertices.length > 0) {
          blocks.push(currentBlock);
          currentBlock = { vertices: [], colors: [] };
        }
        continue; // Skip jump stitches
      }
    }

    cx += dx;
    cy += dy;

    currentBlock.vertices.push(cx, cy, 0); // Z-coordinate is 0 as embroidery designs are 2D
    currentBlock.colors.push(currentColor.r, currentColor.g, currentColor.b);

    pointIndex++;
  }

  file_details.stitches = pointIndex; // Total stitches parsed
  currentGroup.count = pointIndex - currentGroup.start;
  colorGroup.push(currentGroup);

  file_details.width = (maxX - minX) / 10; // fix, divide by 10 to match the original scale
  file_details.height = (maxY - minY) / 10; // e.x, 504 to 50.4

  // If there are any remaining vertices in the current block, push it to blocks
  if (currentBlock.vertices.length > 0) {
    blocks.push(currentBlock);
  }

  return {
    blocks,
    colorGroup,
    file_details,
  };
};
