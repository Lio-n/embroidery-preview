import { signed8 } from "@/helpers/readBit.helper";
import type { Point, Stitch_Block } from "./interface";
import { MAP_BYTE } from "./jef/constants";

export interface JEFStitch {
  x: number;
  y: number;
  command: string;
}

export class JEFReader {
  private static readonly COMMANDS = MAP_BYTE.COMMANDS;
  private static readonly OFFSET_STITCH = MAP_BYTE.OFFSET_STITCH;

  static getStitches(buffer: ArrayBuffer): Stitch_Block[] {
    const jefStitches = this.readJEF(buffer);
    const stitchBlocks = this.convertToStitchBlocks(jefStitches);

    return stitchBlocks;
  }

  static readJEF(buffer: ArrayBuffer): JEFStitch[] {
    const view = new DataView(buffer);
    const stitches: JEFStitch[] = [];

    const stitchOffset = view.getUint32(0, true);

    let ptr = stitchOffset;

    while (ptr < buffer.byteLength - 1) {
      const b1 = view.getUint8(ptr++);
      const b2 = view.getUint8(ptr++);

      // Detect special commands (byte1 = 0x80)
      if (b1 === 0x80) {
        switch (b2) {
          case 0x10: // END command
            stitches.push({ x: 0, y: 0, command: "END" });
            return stitches;

          case 0x01: // COLOR_CHANGE or STOP
            {
              const dx1 = signed8(view.getUint8(ptr++));
              const dy1 = signed8(view.getUint8(ptr++));
              stitches.push({ x: dx1, y: dy1, command: "COLOR_CHANGE" });
            }
            break;

          case 0x02: // JUMP or TRIM
            {
              const dx2 = signed8(view.getUint8(ptr++));
              const dy2 = signed8(view.getUint8(ptr++));

              // TRIM es un JUMP con distancia 0
              if (dx2 === 0 && dy2 === 0) {
                stitches.push({ x: 0, y: 0, command: "TRIM" });
              } else {
                stitches.push({ x: dx2, y: dy2, command: "JUMP" });
              }
            }
            break;

          default:
            break;
        }
      } else {
        // Stitch normal
        const dx = signed8(b1);
        const dy = signed8(b2);
        stitches.push({ x: dx, y: dy, command: "STITCH" });
      }
    }

    return stitches;
  }

  static convertToStitchBlocks(jefStitches: JEFStitch[]): Stitch_Block[] {
    const blocks: Stitch_Block[] = [];
    let currentBlock: Point[] = [];
    let currentCommand = "STITCH";

    for (const stitch of jefStitches) {
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
