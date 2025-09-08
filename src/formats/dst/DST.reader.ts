// 7.23 kib
import { blobToData } from "@/helpers/processBuffer.helper";
import { generatePalette } from "@/utils/generatePalette.utils";
import { colorFloatToUint8 } from "@/utils/colorUtils.utils";
import { MAP_BYTE } from "./constants";
import { COMMAND, type DecodedBytes, type OutputStitchGeometry } from "@/types/embroidery.types";
import { BaseEmbroidery } from "../core/BaseEmbroidery";

type DecodedHeader = {
  "+X": string;
  "+Y": string;
  "-X": string;
  "-Y": string;
  AX: string;
  AY: string;
  CO: string;
  LA: string;
  MX: string;
  MY: string;
  PD: string;
  ST: string;
};

export class DSTReader extends BaseEmbroidery {
  // Configuration and constants
  private readonly OFFSET_SIZE = 512;
  private readonly BYTES_PER_STITCH = 3;
  private readonly MAP_BYTE = MAP_BYTE;

  // Processing status
  private cx: number = 0;
  private cy: number = 0;
  private buffer!: ArrayBuffer;

  constructor(private file: File) {
    super(file);
  }

  public async process(): Promise<OutputStitchGeometry> {
    try {
      this.buffer = await blobToData(this.file);

      await this.extractMetadata();
      await this.createStitchGeometry();

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

  private async extractMetadata(): Promise<void> {
    const header = this.decodeHeader();

    this.metadata = {
      name: this.file.name.substring(0, this.file.name.lastIndexOf(".")),
      extension: this.file.name.split(".").pop()?.toUpperCase() || "",
      color_changes: +(header?.CO || 0) + 1,
      stitches: parseInt(header?.ST || "0"),
      width: 0,
      height: 0,
      jumps: 0,
      size: this.file.size / 1024,
    };

    this.threeColors = generatePalette(this.metadata.color_changes);
  }

  private async createStitchGeometry(): Promise<void> {
    const uint8List = new Uint8Array(this.buffer);
    const limit = this.buffer.byteLength;

    this.initializeNewColorGroup();

    for (let i = this.OFFSET_SIZE; i < limit; i += this.BYTES_PER_STITCH) {
      if (i >= limit - this.BYTES_PER_STITCH) break;

      const stitch = this.parseSingleStitch(uint8List, i);
      if (stitch === null) break; // End design
      if (stitch === undefined) continue; // Jump, continue

      this.processStitch(stitch);
    }

    this.finalizeCurrentBlock();
  }

  private parseSingleStitch(uint8List: Uint8Array, index: number): [number, number, number] | null | undefined {
    const b1 = uint8List[index];
    const b2 = uint8List[index + 1];
    const b3 = uint8List[index + 2];

    if (this.MAP_BYTE.COMMANDS.END(b1, b2, b3)) return null;

    const { x, y, isColorChange, isJump } = this.decodeBytes(b3, b2, b1);

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

  async getSimpleStitches(): Promise<void> {
    if (!this.buffer) {
      this.buffer = await blobToData(this.file);
    }

    const uint8List = new Uint8Array(this.buffer);
    const limit = this.buffer.byteLength;

    for (let i = this.OFFSET_SIZE; i < limit; i += this.BYTES_PER_STITCH) {
      if (i >= limit - this.BYTES_PER_STITCH) break;

      const b1 = uint8List[i];
      const b2 = uint8List[i + 1];
      const b3 = uint8List[i + 2];

      if (this.MAP_BYTE.COMMANDS.END(b1, b2, b3)) break;

      const { x, y, isColorChange, isJump } = this.decodeBytes(b3, b2, b1);

      let command = COMMAND.STITCH;
      if (isJump) command = COMMAND.JUMP;
      if (isColorChange) command = COMMAND.COLOR_CHANGE;

      this.stitches.push({
        x,
        y,
        command,
      });
    }
  }

  private decodeBytes(byte1: number, byte2: number, byte3: number): DecodedBytes {
    const cmd = byte1 | (byte2 << 8) | (byte3 << 16); // Compact the 3 bytes into a single number
    let x = 0,
      y = 0,
      isJump = false,
      isColorChange = false;
    const bit = (bit: number) => cmd & (1 << bit); // Check if a bit is active

    if (bit(23)) y += 1;
    if (bit(22)) y -= 1;
    if (bit(21)) y += 9;
    if (bit(20)) y -= 9;
    if (bit(19)) x -= 9;
    if (bit(18)) x += 9;
    if (bit(17)) x -= 1;
    if (bit(16)) x += 1;

    if (bit(15)) y += 3;
    if (bit(14)) y -= 3;
    if (bit(13)) y += 27;
    if (bit(12)) y -= 27;
    if (bit(11)) x -= 27;
    if (bit(10)) x += 27;
    if (bit(9)) x -= 3;
    if (bit(8)) x += 3;

    if (bit(7)) isJump = true;
    if (bit(6)) isColorChange = true;
    if (bit(5)) y += 81;
    if (bit(4)) y -= 81;
    if (bit(3)) x -= 81;
    if (bit(2)) x += 81;

    return { x, y, isJump, isColorChange };
  }

  private decodeHeader(): DecodedHeader {
    const header = new TextDecoder("ascii").decode(this.buffer.slice(0, 512));
    const lines = header.split("\r");

    const info: Record<string, string> = {};

    for (const line of lines) {
      const [key, ...rest] = line.split(":");
      if (!key || rest.length === 0) continue;
      const value = rest.join(":").trim();
      info[key.trim()] = value;
    }

    return info as DecodedHeader;
  }
}
