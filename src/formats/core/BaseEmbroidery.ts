// 3.38 kib
import {
  COMMAND,
  type ColorGroup,
  type DesignMetrics,
  type FileDetails,
  type Point,
  type Stitch,
  type StitchBlock,
  type ThreeBlock,
} from "@/types/embroidery.types";
import type { Color } from "three";

export class BaseEmbroidery {
  // Pre-allocated buffers
  vertexBuffer: Float32Array;
  colorBuffer: Uint8Array;

  // Processing status
  private minX: number = Infinity;
  private minY: number = Infinity;
  private maxX: number = -Infinity;
  private maxY: number = -Infinity;
  private MAX_EXPECTED_POINTS: number = 0;
  vIndex: number = 0;
  cIndex: number = 0;
  pointIndex: number = 0;
  currentColorIndex: number = 0;

  // Results
  blocks: ThreeBlock[] = [];
  colorGroups: ColorGroup[] = [];
  metadata?: FileDetails;
  threeColors: Color[] = [];
  currentGroup!: ColorGroup;
  stitches: Stitch[] = [];

  constructor(file: File) {
    // Buffer pre-allocation
    this.MAX_EXPECTED_POINTS = Math.max(1000, Math.floor(file.size / 2));
    this.vertexBuffer = new Float32Array(this.MAX_EXPECTED_POINTS * 3);
    this.colorBuffer = new Uint8Array(this.MAX_EXPECTED_POINTS * 3);
  }

  handleColorChange(): void {
    this.finalizeCurrentBlock();

    this.currentColorIndex++;

    this.initializeNewColorGroup();
  }

  handleJump(): void {
    if (this.vIndex > 0) {
      this.blocks.push({
        vertices: this.vertexBuffer.slice(0, this.vIndex),
        colors: this.colorBuffer.slice(0, this.cIndex),
      });

      this.vIndex = 0;
      this.cIndex = 0;
    }
  }

  finalizeCurrentBlock(): void {
    this.handleJump(); // it's not a jump, just reuse the code.

    if (this.currentGroup.count > 0) {
      this.colorGroups.push(this.currentGroup);

      this.currentGroup.count = 0;
      this.currentGroup.start = this.pointIndex;
    }
  }

  initializeNewColorGroup(): void {
    const currentColor = this.threeColors[this.currentColorIndex];

    this.currentGroup = {
      index: this.currentColorIndex,
      start: this.pointIndex,
      count: 0,
      color: [currentColor.r, currentColor.g, currentColor.b],
    };
  }

  updateBoundingBox(x: number, y: number): void {
    this.minX = Math.min(this.minX, x);
    this.minY = Math.min(this.minY, y);
    this.maxX = Math.max(this.maxX, x);
    this.maxY = Math.max(this.maxY, y);
  }

  calculateDesignMetrics(): DesignMetrics {
    const sizeX = this.maxX - this.minX;
    const sizeY = this.maxY - this.minY;

    // Update metadata with actual dimensions
    if (this.metadata) {
      this.metadata.width = sizeX / 10;
      this.metadata.height = sizeY / 10;
    }

    return {
      boundingBox: {
        center: [(this.minX + this.maxX) / 2, (this.minY + this.maxY) / 2],
        maxDimension: Math.max(0.01 * sizeX, 0.01 * sizeY, 0),
        size: {
          x: { max: this.maxX, min: this.minX },
          y: { max: this.maxY, min: this.minY },
        },
      },
    };
  }

  growBuffers(): void {
    // Double the size of buffers when necessary
    const newVertexBuffer = new Float32Array(this.vertexBuffer.length * 2);
    const newColorBuffer = new Uint8Array(this.colorBuffer.length * 2);

    newVertexBuffer.set(this.vertexBuffer);
    newColorBuffer.set(this.colorBuffer);

    this.vertexBuffer = newVertexBuffer;
    this.colorBuffer = newColorBuffer;
  }

  createToStitchBlocks(): StitchBlock[] {
    const blocks: StitchBlock[] = [];
    let currentBlock: Point[] = [];
    let currentCommand = COMMAND.STITCH;

    for (const stitch of this.stitches) {
      if (stitch.command !== currentCommand) {
        if (currentBlock.length > 0) {
          blocks.push(this.parseStitchBlock(currentBlock, currentCommand));
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
      blocks.push(this.parseStitchBlock(currentBlock, currentCommand));
    }

    return blocks;
  }

  private parseStitchBlock(stitches: Point[], command: string): StitchBlock {
    return {
      stitches: stitches,
      isJump: command === COMMAND.JUMP,
      isTrim: command === COMMAND.TRIM,
      isColorChange: command === COMMAND.COLOR_CHANGE,
    };
  }
}
