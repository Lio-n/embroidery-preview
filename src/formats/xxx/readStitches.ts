import { blobToData } from "@/helpers/processBuffer.helper";
import { decodeSignedByte } from "@/helpers/readBit.helper";
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

  let ptr = 0;
  const colorCount = view.getUint16(0x27, true);

  const palette_offset = view.getUint32(0xfc, true);
  console.log({ colorCount, palette_offset });

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  // view es un DataView del ArrayBuffer del archivo XXX
  const width = view.getUint16(0x30, true); // LE = little-endian
  const height = view.getUint16(0x32, true);

  console.log(`Ancho: ${width}, Alto: ${height}`);

  const file_details: FileDetails = {
    name: file.name.substring(0, file.name.lastIndexOf(".")),
    extension: file.name.split(".").pop()?.toLocaleUpperCase() + "",
    color_changes: colorCount,
    stitches: 0, // Stitches will be calculated later
    width: 0, // Diameter is not provided in the header, can be calculated if needed
    height: 0, // Diameter is not provided in the header, can be calculated if needed
    jumps: 0, // Jumps are not counted in the original header, but can be calculated
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
  let currentBlock: StitchBlock = { vertices: [], colors: [] };

  // const stitches = [];
  let cx = 0,
    cy = 0;
  while (ptr < palette_offset) {
    // let isJump=false;
    let b1 = view.getUint8(ptr++);
    let b2 = view.getUint8(ptr++);

    // let stitchType = "STITCH";
    // if (isJump) {
    //   stitchType = "TRIM";
    // }

    /* XXX Body - Command Table
    | Command      | B0   | B1   |
    | ------------ | ---- | ---- |
    | END          | 0x7F | 0x7F |
    | COLOR_CHANGE | 0x7F | 0x08 |
    | STOP         | 0x7F | 0x08 |
    | JUMP         | 0x7F | 0x01 |
    | TRIM         | 0x7F | 0x03 |
*/

    minX = Math.min(minX, cx);
    minY = Math.min(minY, cy);
    maxX = Math.max(maxX, cx);
    maxY = Math.max(maxY, cy);

    let dx, dy;

    // LONG
    if (b1 === 0x7e || b1 === 0x7d) {
      dx = (b2 & 0xff) + (view.getUint8(ptr++) << 8);
      dy = view.getInt16(ptr, true);
      ptr += 2;
      // stitchType = "TRIM";
    }

    // SHORT
    else if (b1 === 0x7f) {
      // CHANGE_COLOR
      if (b2 !== 0x17 && b2 !== 0x46 && b2 >= 8) {
        b1 = 0;
        b2 = 0;
        // isJump = true;
        // stitchType = "STOP";

        currentGroup.count = pointIndex - currentGroup.start;
        colorGroup.push(currentGroup);

        if (currentBlock.vertices.length > 0) {
          blocks.push(currentBlock);
          currentBlock = { vertices: [], colors: [] };
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
      // JUMP
      else if (b2 === 1) {
        // Skip jump-stitch
        // b1 = view.getUint8(ptr++);
        // b2 = view.getUint8(ptr++);
        // stitchType = "JUMP";
        if (currentBlock.vertices.length > 0) {
          blocks.push(currentBlock);
          currentBlock = { vertices: [], colors: [] };
        }
        file_details.jumps += 1;
        continue; // JUMP
      } else {
        if (currentBlock.vertices.length > 0) {
          blocks.push(currentBlock);
          currentBlock = { vertices: [], colors: [] };
        }
        continue; // TRIM
      }
      // dx = decodeSignedByte(b1);
      // dy = decodeSignedByte(b2);
    }

    // NORMAL STITCH
    else {
      dx = decodeSignedByte(b1);
      dy = decodeSignedByte(b2);
    }
    cx += dx;
    cy += dy;

    // stitches.push({ dx, dy, type: stitchType });
    currentBlock.vertices.push(cx, cy, 0);
    currentBlock.colors.push(currentColor.r, currentColor.g, currentColor.b);

    pointIndex++;
  }

  file_details.stitches = pointIndex; // Total stitches parsed
  file_details.width = (maxX - minX) / 10;
  file_details.height = (maxY - minY) / 10;

  if (currentBlock.vertices.length > 0) {
    blocks.push(currentBlock);
  }

  return { blocks, colorGroup, file_details };
};

/* 
0x17=23 
0x0c=12 
0x25=37 
0xE2=226  
0x100=256
0x27=39
/ 23+2+12+2=39

| Offset relativo | Tipo        | Descripción             |
| --------------- | ----------- | ----------------------- |
| `0x00 .. 0x16`  | Uint8\[23]  | Ceros                   |
| `0x17`          | Uint16 LE   | Length of stitches - 1  |
| `0x19 .. 0x24`  | Uint8\[12]  | Ceros                   |
| `0x25`          | Uint16 LE   | Número total de colores |
| `0x27`          | Uint16 LE   | Ceros                   |
| `0x29`          | Uint16 LE   | Width                   |
| `0x2B`          | Uint16 LE   | Height                  |
| `0x2D`          | Int16 LE    | Last stitch X           |
| `0x2F`          | Int16 LE    | Last stitch Y           |
| `0x31`          | Int16 LE    | Min X                   |
| `0x33`          | Int16 LE    | Min Y                   |
| `0x35 .. 0x76`  | Uint8\[66]  | Ceros                   |
| `0x77 .. 0x7A`  | Uint8\[4]   | Ceros                   |
| `0x7B .. 0xF1`  | Uint8\[115] | Ceros                   |
| `0xF2`          | Uint16 LE   | 0x20                    |
| `0xF4 .. 0xFB`  | Uint8\[8]   | Ceros                   |
*/
