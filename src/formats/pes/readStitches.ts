import { blobToData } from "@/helpers/processBuffer.helper";
// import { signed7, signed8 } from "@/helpers/readBit.helper";
import type {
  ColorGroup,
  FileDetails,
  PromiseReadStitches,
  StitchBlock,
} from "@/types/embroidery.types";
import { generatePalette } from "@/utils/generatePalette";

const PEC_HEADER_SIZE = 512;

const MAP_BYTE = {
  PEC_HEADER: {
    FIRST_SECTION: {},
    SECOND_SECTION: {
      WIDTH: PEC_HEADER_SIZE + 8, // s16 in the doc says, 10 but is 8
      HEIGHT: PEC_HEADER_SIZE + 10, // s16 in the doc says, 12 but is 10
      "0x01E0": PEC_HEADER_SIZE + 12,
      "0x01B0": PEC_HEADER_SIZE + 14,
    },
  },
};

// Uso, WIDTH_BYTE_LOC = PEC_BYTE_OFFSET + MAP_BYTE.PEC_HEADER.SECOND_SECTION.WIDTH;

const JUMP_CODE = 0x10;
const TRIM_CODE = 0x20;
const FLAG_LONG = 0x80;

export const readStitches = async (
  file: File
): Promise<PromiseReadStitches> => {
  const buffer = await blobToData(file);
  const view = new DataView(buffer);
  const PEC_BYTE_OFFSET = view.getUint32(8, true);

  const BYTE_TEST_LOC =
    PEC_BYTE_OFFSET + MAP_BYTE.PEC_HEADER.SECOND_SECTION.HEIGHT;

  const BYTE_TEST = view
    .getUint16(BYTE_TEST_LOC + 10, true)
    .toString(16)
    .padStart(2, "0");
  console.log({ BYTE_TEST });

  const file_details: FileDetails = {
    name: file.name.substring(0, file.name.lastIndexOf(".")),
    extension: file.name.split(".").pop()?.toLocaleUpperCase() + "",
    color_changes: 0,
    stitches: 0, // Stitches will be calculated later
    width: 0, // Diameter is not provided in the header, can be calculated if needed
    height: 0, // Diameter is not provided in the header, can be calculated if needed
    jumps: 0, // Jumps are not counted in the original header, but can be calculated
    size: file.size / 1024, // Size in KB
    version: new TextDecoder("utf8").decode(buffer.slice(0, 8)),
  };

  const blocks: StitchBlock[] = [];

  const start = PEC_BYTE_OFFSET + 512 + 2;

  console.log(view.getUint16(start + 12, true));

  const firstBytes = [];
  for (let i = 0; i < 40; i++) {
    firstBytes.push(
      view
        .getUint8(start + i)
        .toString(16)
        .padStart(2, "0")
    );
  }

  console.log(firstBytes.join(" "));
  const threeColors = generatePalette(1);
  let currentColor = threeColors[0];

  let currentBlock: StitchBlock = { vertices: [], colors: [] };

  const colorGroup: ColorGroup[] = [];
  let pointIndex = 0;
  let index = 0;
  let currentGroup: ColorGroup = {
    index,
    start: pointIndex,
    count: 0,
    color: [currentColor.r, currentColor.g, currentColor.b],
  };

  let cx = 0,
    cy = 0,
    x = 0,
    y = 0;
  let ptr = PEC_BYTE_OFFSET + 512 + 20;
  while (ptr < buffer.byteLength) {
    let trim = false,
      jump = false;

    const b1 = view.getUint8(ptr++);
    const b2 = view.getUint8(ptr++);

    if ((b1 === 0xff && b2 === 0x00) || b2 === undefined) {
      console.log("END : ", b1, b2);
      break;
    }

    const isColorChange = b1 === 0xfe && b2 === 0xb0;
    if (isColorChange) {
      ptr++;

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

    // X
    if (b1 & FLAG_LONG) {
      if (b1 & JUMP_CODE) jump = true;
      if (b1 & TRIM_CODE) trim = true;

      const b2x = view.getUint8(ptr++);
      if (b2x === undefined) break;
      x = signed12((b1 << 8) | b2x);
    } else {
      x = signed7(b1);
    }

    // Y
    if (b2 & FLAG_LONG) {
      if (b2 & JUMP_CODE) jump = true;
      if (b2 & TRIM_CODE) trim = true;

      const b3 = view.getUint8(ptr++);
      if (b3 === undefined) break;
      y = -signed12((b2 << 8) | b3);
    } else {
      y = -signed7(b2);
    }

    if (jump || trim) {
      if (currentBlock.vertices.length > 0) {
        blocks.push(currentBlock);
        currentBlock = { vertices: [], colors: [] };
      }
    } else {
      cx += x;
      cy += y;
      currentBlock.vertices.push(cx, cy, 0);
      currentBlock.colors.push(currentColor.r, currentColor.g, currentColor.b);
      pointIndex++;
    }
  }

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

function signed12(b: number): number {
  b &= 0xfff;
  if (b > 0x7ff) return -0x1000 + b;
  return b;
}
function signed7(b: number): number {
  if (b > 63) return -128 + (b & 0x7f);
  return b;
}

// const b1x = b1 & 0x0f; // parte baja
// const b2x = view.getUint8(ptr++);
// x = -signed12((b1x << 8) | b2x);

// const b2y = b2 & 0x0f;
// const b3y = view.getUint8(ptr++);
// y = -signed12((b2y << 8) | b3y);
