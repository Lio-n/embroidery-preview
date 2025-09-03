import { signed8 } from "@/helpers/readBit.helper";
import { type DecodedBytes, type OutputStitchGeometry } from "@/types/embroidery.types";
import { BaseEmbroidery } from "../core/BaseEmbroidery";
import { blobToData } from "@/helpers/processBuffer.helper";
import { MAP_BYTE } from "./constants";
import { generatePalette } from "@/utils/generatePalette.utils";
import { parseDatetime } from "@/helpers/parseDatetime.helper";
import { colorFloatToUint8 } from "@/utils/colorUtils.utils";

export class JEFReader extends BaseEmbroidery {
  // Configuration and constants
  private readonly MAP_BYTE = MAP_BYTE;
  private uint8List!: Uint8Array<ArrayBuffer>;
  private readonly BYTES_PER_STITCH = 2;

  // Processing status
  private buffer!: ArrayBuffer;
  private cx: number = 0;
  private cy: number = 0;
  private OFFSET_SIZE = 0;

  constructor(private file: File) {
    super(file);
  }

  public async process(): Promise<OutputStitchGeometry> {
    try {
      this.buffer = await blobToData(this.file);

      // TODO : TOMAR SOLO LA LONGITUD DE LAS PUNTADAS, UTILIZAR OFFSET_SIZE
      this.uint8List = new Uint8Array(this.buffer);

      await this.extractMetadata();
      await this.createStitchGeometry();

      this.metadata!.stitches = this.pointIndex;

      return {
        blocks: this.blocks,
        colorGroup: this.colorGroups,
        filesDetails: this.metadata!,
        designMetrics: this.calculateDesignMetrics(),
      };
    } catch (error) {
      throw new Error(`Failed to process DST file: ${JSON.stringify(error)}`);
    }
  }

  private async createStitchGeometry(): Promise<void> {
    this.initializeNewColorGroup();

    let ptr = this.OFFSET_SIZE; // Start of stitch data

    while (ptr < this.buffer.byteLength) {
      const b1 = this.uint8List[ptr++];
      const b2 = this.uint8List[ptr++];

      const stitch = this.parseSingleStitch(b1, b2);
      if (stitch === null) break; // End design
      if (stitch === undefined) {
        const dx = signed8(this.uint8List[ptr++]);
        const dy = signed8(this.uint8List[ptr++]);
        this.cx += dx;
        this.cy += dy;

        continue; // Jump, continue
      }

      this.processStitch(stitch);
    }

    this.finalizeCurrentBlock();
  }

  private parseSingleStitch(b1: number, b2: number): [number, number, number] | null | undefined {
    if (b1 === this.MAP_BYTE.COMMANDS.FLAG && b2 === this.MAP_BYTE.COMMANDS.END_FLAG) return null;

    const { x, y, isColorChange, isJump } = this.decodeBytes(b1, b2);

    this.cx += x;
    this.cy += y;

    if (isColorChange) this.handleColorChange();

    if (isJump) {
      this.metadata!.jumps++;
      this.handleJump();
      return undefined;
    }

    return [this.cx, this.cy, 0];
  }

  private processStitch(stitch: [number, number, number]): void {
    if (this.vIndex >= this.vertexBuffer.length - this.BYTES_PER_STITCH) this.growBuffers();

    // Update geometry
    this.vertexBuffer[this.vIndex++] = stitch[0];
    this.vertexBuffer[this.vIndex++] = stitch[1];
    this.vertexBuffer[this.vIndex++] = stitch[2];

    // Update colors
    const currentColor = this.threeColors[this.currentColorIndex];
    const tempColor = colorFloatToUint8([currentColor.r, currentColor.g, currentColor.b]);

    this.colorBuffer[this.cIndex++] = tempColor[0];
    this.colorBuffer[this.cIndex++] = tempColor[1];
    this.colorBuffer[this.cIndex++] = tempColor[2];

    this.updateBoundingBox(stitch[0], stitch[1]);

    this.pointIndex++;
    this.currentGroup.count++;
  }

  private decodeBytes(b1: number, b2: number): DecodedBytes {
    let x = 0,
      y = 0,
      isJump = false,
      isColorChange = false;

    // Detect special commands (byte1 = 0x80)
    if (b1 === this.MAP_BYTE.COMMANDS.FLAG) {
      switch (b2) {
        case this.MAP_BYTE.COMMANDS.COLOR_CHANGE_FLAG: // COLOR_CHANGE or STOP
          isColorChange = true;
          break;
        case this.MAP_BYTE.COMMANDS.JUMP_FLAG: // JUMP or TRIM, TRIM is a JUMP with distance 0 between x e y
          isJump = true;
          break;
        default:
          break;
      }
    } else {
      // Stitch normal
      x = signed8(b1);
      y = signed8(b2);
    }

    return { x, y, isJump, isColorChange };
  }

  private async extractMetadata(): Promise<void> {
    this.OFFSET_SIZE = this.uint8List[this.MAP_BYTE.OFFSET_STITCH];

    const dateStr = new TextDecoder("ascii").decode(this.uint8List.subarray(8, 8 + 14));
    const date = parseDatetime(dateStr);

    this.metadata = {
      name: this.file.name.substring(0, this.file.name.lastIndexOf(".")),
      extension: this.file.name.split(".").pop()?.toUpperCase() || "",
      color_changes: this.uint8List[this.MAP_BYTE.COLOR_COUNT],
      date: date.toLocaleDateString(),
      stitches: 0,
      width: 0,
      height: 0,
      jumps: 0,
      size: this.file.size / 1024,
    };

    this.threeColors = generatePalette(this.metadata.color_changes);
  }

  /*
  getSimpleStitches(buffer: ArrayBuffer): Stitch[] {
    const view = new DataView(buffer);
    const stitches: Stitch[] = [];

    const stitchOffset = view.getUint32(0, true);

    let ptr = stitchOffset;

    while (ptr < buffer.byteLength - 1) {
      const b1 = view.getUint8(ptr++);
      const b2 = view.getUint8(ptr++);

      // Detect special commands (byte1 = 0x80)
      if (b1 === this.COMMAND.FLAG) {
        switch (b2) {
          case this.COMMAND.END_FLAG: // END command
            stitches.push({ x: 0, y: 0, command: COMMAND.END });
            return stitches;

          case this.COMMAND.COLOR_CHANGE_FLAG: // COLOR_CHANGE or STOP
            {
              const dx1 = signed8(view.getUint8(ptr++));
              const dy1 = signed8(view.getUint8(ptr++));
              stitches.push({ x: dx1, y: dy1, command: COMMAND.COLOR_CHANGE });
            }
            break;

          case this.COMMAND.JUMP_FLAG: // JUMP or TRIM
            {
              const dx2 = signed8(view.getUint8(ptr++));
              const dy2 = signed8(view.getUint8(ptr++));

              // TRIM is a JUMP with distance 0
              if (dx2 === 0 && dy2 === 0) {
                stitches.push({ x: 0, y: 0, command: COMMAND.TRIM });
              } else {
                stitches.push({ x: dx2, y: dy2, command: COMMAND.JUMP });
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
        stitches.push({ x: dx, y: dy, command: COMMAND.STITCH });
      }
    }

    return stitches;
  }
  */
}
