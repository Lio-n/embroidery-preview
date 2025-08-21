import type {
  ColorGroup,
  FileDetails,
  PromiseReadStitches,
  StitchBlock,
} from "@/types/embroidery.types";
import { decodeCoord } from "./decodeCoord";
import { decodeHeader } from "./docodeHeader";
import { blobToData } from "@/helpers/processBuffer.helper";
import { generatePalette } from "@/utils/generatePalette.utils";
import { MAP_BYTE } from "./constants";

export const readStitches = async (
  file: File
): Promise<PromiseReadStitches> => {
  const buffer = await blobToData(file);
  const header = decodeHeader(buffer);
  const threeColors = generatePalette(parseInt(header?.CO));
  const uint8List = new Uint8Array(buffer);

  let currentColor = threeColors[0];
  let index = 0,
    cx = 0,
    cy = 0;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  const blocks: StitchBlock[] = [];

  const estimatedPoints = Math.floor(file.size / 2);

  let vertices = new Float32Array(estimatedPoints * 3);
  let colors = new Uint8Array(estimatedPoints * 3);
  let vIndex = 0,
    cIndex = 0;

  const colorGroup: ColorGroup[] = [];
  let pointIndex = 0;

  let currentGroup: ColorGroup = {
    index,
    start: pointIndex,
    count: 0,
    color: [currentColor.r, currentColor.g, currentColor.b],
  };

  const filesDetails: FileDetails = {
    name: file.name.substring(0, file.name.lastIndexOf(".")),
    extension: file.name.split(".").pop()?.toLocaleUpperCase() + "",
    color_changes: +header.CO + 1,
    stitches: parseInt(header?.ST),
    width: 0,
    height: 0,
    jumps: 0,
    size: file.size / 1024, // Size in KB
  };

  const { END } = MAP_BYTE.COMMANDS;

  for (let i = 512; i < uint8List.length; i += 3) {
    if (i >= uint8List.length - 3) break;

    const b1 = uint8List[i];
    const b2 = uint8List[i + 1];
    const b3 = uint8List[i + 2];

    if (END(b1, b2, b3)) break;

    const {
      x,
      y,
      color_stop: isColorChange,
      jump: isJump,
    } = decodeCoord(b3, b2, b1);
    filesDetails.jumps += isJump ? 1 : 0;
    cx += x;
    cy += y;

    if (isColorChange) {
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
    }

    if (isJump) {
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

    vertices[vIndex++] = cx;
    vertices[vIndex++] = cy;
    vertices[vIndex++] = 0;

    colors[cIndex++] = currentColor.r;
    colors[cIndex++] = currentColor.g;
    colors[cIndex++] = currentColor.b;
    pointIndex++;
  }

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
      },
    },
  };
};
