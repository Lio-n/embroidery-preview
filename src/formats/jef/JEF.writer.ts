import type { StitchBlock } from "@/types/embroidery.types";
import { MAP_BYTE } from "./constants";

export class JEFWriter {
  private static readonly JEF_HEADER_SIZE = 116; // BASIC HEADER BYTES -> 4 + 4 + 14 + 1 + 1 + 4 + 4 + 4 + 16 + 16 + 16 + 16 + 16 = 116
  private static readonly COMMAND = MAP_BYTE.COMMANDS;

  static getBuffer(stitchesBlocks: StitchBlock[]): Uint8Array {
    const stitches = this.encodeStitches(stitchesBlocks);
    const colorChanges = stitchesBlocks.filter((b) => b.isColorChange).length;

    const header = this.writeHeader(colorChanges + 1);

    const jefFile = new Uint8Array(header.length + stitches.length);
    jefFile.set(header);
    jefFile.set(stitches, header.length);

    return jefFile;
  }

  private static writeHeader(colorChanges: number): Uint8Array {
    const header = new Uint8Array(this.JEF_HEADER_SIZE);
    const view = new DataView(header.buffer);

    let offset = 0;

    // Offset where stitches begin (0x74 + 8 * Color_Changes)
    view.setUint32(offset, 0x74 + 8 * colorChanges, true);
    offset += 4;

    // Unknown value (0x14)
    view.setUint32(offset, 0x14, true);
    offset += 4;

    // Date string (14 bytes) - using current date in format YYYYMMDDHHMMSS
    const now = new Date();
    const dateStr =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, "0") +
      now.getDate().toString().padStart(2, "0") +
      now.getHours().toString().padStart(2, "0") +
      now.getMinutes().toString().padStart(2, "0") +
      now.getSeconds().toString().padStart(2, "0");

    for (let i = 0; i < 14; i++) {
      header[offset++] = i < dateStr.length ? dateStr.charCodeAt(i) : 0x00;
    }

    // Version letter (1 byte) - using 'm' for 12000 version
    header[offset++] = "m".charCodeAt(0);

    // Unknown value (0x20)
    header[offset++] = 0x20;

    // Color Count
    view.setUint32(offset, colorChanges, true);
    offset += 4;

    // Points Length / 2 (placeholder - will need to be calculated later)
    view.setUint32(offset, 0, true);
    offset += 4;

    // Hoop Used (default to 0 for 110x110)
    view.setUint32(offset, 0, true);
    offset += 4;

    // Extends - distances from center of hoop (16 bytes)
    // Default values for 110x110 hoop: left=-55, top=-55, right=55, bottom=55
    view.setInt32(offset, -55, true);
    offset += 4; // left
    view.setInt32(offset, -55, true);
    offset += 4; // top
    view.setInt32(offset, 55, true);
    offset += 4; // right
    view.setInt32(offset, 55, true);
    offset += 4; // bottom

    // Edge amounts for different hoops (4 sets of 16 bytes each)
    const hoops = [
      { width: 110, height: 110 }, // Hoop 0
      { width: 50, height: 50 }, // Hoop 1
      { width: 140, height: 200 }, // Hoop 2
      { width: 0, height: 0 }, // Custom hoop (placeholder)
    ];

    for (const hoop of hoops) {
      if (hoop.width > 0 && hoop.height > 0) {
        const halfWidth = Math.floor(hoop.width / 2);
        const halfHeight = Math.floor(hoop.height / 2);

        view.setInt32(offset, -halfWidth, true);
        offset += 4; // left
        view.setInt32(offset, -halfHeight, true);
        offset += 4; // top
        view.setInt32(offset, halfWidth, true);
        offset += 4; // right
        view.setInt32(offset, halfHeight, true);
        offset += 4; // bottom
      } else {
        // Custom hoop or invalid - set to -1,-1,-1,-1
        view.setInt32(offset, -1, true);
        offset += 4;
        view.setInt32(offset, -1, true);
        offset += 4;
        view.setInt32(offset, -1, true);
        offset += 4;
        view.setInt32(offset, -1, true);
        offset += 4;
      }
    }

    // // Magic Number Color Lookup (4 bytes per color change)
    // for (let i = 0; i < colorChanges; i++) {
    //     // Default color lookup values (may need adjustment based on actual colors)
    //     view.setUint32(offset, 0x00000000, true);
    //     offset += 4;
    // }

    // // 0x0D values repeated for each color change
    // for (let i = 0; i < colorChanges; i++) {
    //     view.setUint32(offset, 0x0D0D0D0D, true);
    //     offset += 4;
    // }

    return header;
  }

  static encodeStitches(blocks: StitchBlock[]): Uint8Array {
    const bytes: number[] = [];

    // Each command is 4 bytes long: 0x80, 0x??, dx, dy (except END which simply ends at 0x80, 0x10).

    let offset = 0;
    for (const block of blocks) {
      if (block.isColorChange) {
        bytes[offset++] = this.COMMAND.FLAG;
        bytes[offset++] = this.COMMAND.COLOR_CHANGE_FLAG;
        bytes[offset++] = 0x00;
        bytes[offset++] = 0x00;
      } else if (block.isTrim) {
        bytes[offset++] = this.COMMAND.FLAG;
        bytes[offset++] = this.COMMAND.TRIM_FLAG;
        bytes[offset++] = 0x00;
        bytes[offset++] = 0x00;
      } else if (block.isJump) {
        for (const stitch of block.stitches) {
          bytes[offset++] = this.COMMAND.FLAG;
          bytes[offset++] = this.COMMAND.JUMP_FLAG;
          bytes[offset++] = this.clampToSignedByte(stitch.x);
          bytes[offset++] = this.clampToSignedByte(stitch.y);
        }

        continue;
      }

      // Encode all stitches in this block
      for (const stitch of block.stitches) {
        bytes[offset++] = this.clampToSignedByte(stitch.x);
        bytes[offset++] = this.clampToSignedByte(stitch.y);
      }
    }

    // Add END command at the very end
    bytes[offset++] = this.COMMAND.FLAG;
    bytes[offset++] = this.COMMAND.END_FLAG;
    bytes[offset++] = 0x00;
    bytes[offset++] = 0x00;

    return new Uint8Array(bytes);
  }

  // Helper method to clamp values to signed byte range (-128 to 127)
  private static clampToSignedByte(value: number): number {
    if (value > 127) return 127;
    if (value < -128) return -128;
    return value & 0xff; // Ensure it's treated as unsigned byte
  }
}
