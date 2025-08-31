import { decodeCoord } from "./dst/decodeCoord";
import type { Point, Stitch_Block } from "./interface";

export interface DSTStitch {
  x: number;
  y: number;
  command: string;
}

export class DSTReader {
  static getStitches(buffer: ArrayBuffer): Stitch_Block[] {
    const dstStitches = this.readDST(buffer);
    const stitchBlocks = this.convertToStitchBlocks(dstStitches);

    return stitchBlocks;
  }

  static readDST(buffer: ArrayBuffer): DSTStitch[] {
    const view = new DataView(buffer);
    const stitches: DSTStitch[] = [];

    for (let i = 512; i < buffer.byteLength; i += 3) {
      if (i >= buffer.byteLength - 3) break;

      const byte1 = view.getUint8(i);
      const byte2 = view.getUint8(i + 1);
      const byte3 = view.getUint8(i + 2);

      const coord = decodeCoord(byte3, byte2, byte1);

      let command = "STITCH";
      if (coord.jump) command = "JUMP";
      if (coord.color_stop) command = "COLOR_CHANGE";

      stitches.push({
        x: coord.x,
        y: coord.y,
        command,
      });
    }

    return stitches;
  }

  static convertToStitchBlocks(dstStitches: DSTStitch[]): Stitch_Block[] {
    const blocks: Stitch_Block[] = [];
    let currentBlock: Point[] = [];
    let currentCommand = "STITCH";

    for (const stitch of dstStitches) {
      if (stitch.command !== currentCommand) {
        if (currentBlock.length > 0) {
          blocks.push(this.createStitchBlock(currentBlock, currentCommand));
          currentBlock = [];
        }
        currentCommand = stitch.command;
      }

      if (stitch.command === "COLOR_CHANGE") {
        blocks.push({
          stitches: [],
          colorChange: true,
        });
        continue;
      }

      currentBlock.push({ x: stitch.x, y: stitch.y });
    }

    if (currentBlock.length > 0) {
      blocks.push(this.createStitchBlock(currentBlock, currentCommand));
    }

    return blocks;
  }

  private static createStitchBlock(stitches: Point[], command: string): Stitch_Block {
    return {
      stitches: stitches,
      isJump: command === "JUMP",
      isTrim: command === "TRIM",
      colorChange: command === "COLOR_CHANGE",
    };
  }
}
