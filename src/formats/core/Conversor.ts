import { COMMAND, type Point, type Stitch, type StitchBlock } from "@/types/embroidery.types";

export class Conversor {
  constructor(stitches: Stitch[]) {
    this.stitches = stitches;
  }

  stitches: Stitch[];

  toStitchBlocks(): StitchBlock[] {
    const blocks: StitchBlock[] = [];
    let currentBlock: Point[] = [];
    let currentCommand = COMMAND.STITCH;

    for (const stitch of this.stitches) {
      if (stitch.command !== currentCommand) {
        if (currentBlock.length > 0) {
          blocks.push(this.createStitchBlock(currentBlock, currentCommand));
          currentBlock = [];
        }
        currentCommand = stitch.command;
      }

      if (stitch.command === COMMAND.COLOR_CHANGE) {
        blocks.push({
          stitches: [],
          isColorChange: true,
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

  private createStitchBlock(stitches: Point[], command: string): StitchBlock {
    return {
      stitches: stitches,
      isJump: command === COMMAND.JUMP,
      isTrim: command === COMMAND.TRIM,
      isColorChange: command === COMMAND.COLOR_CHANGE,
    };
  }
}
