import type { Stitch_Block } from "./interface";
import { MAP_BYTE } from "./jef/constants";

export class JEFWriter {
  private static readonly JEF_HEADER_SIZE = 116; // BASIC HEADER BYTES -> 4 + 4 + 14 + 1 + 1 + 4 + 4 + 4 + 16 + 16 + 16 + 16 + 16 = 116
  private static readonly JEF_COMMANDS = MAP_BYTE.COMMANDS;

  static getBuffer(stitchesBlocks: Stitch_Block[]): Uint8Array {
    const stitches = this.encodeStitches(stitchesBlocks);
    const colorChanges = stitchesBlocks.filter((b) => b.colorChange).length;

    const header = this.writeHeader(colorChanges);

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

  static encodeStitches(blocks: Stitch_Block[]): Uint8Array {
    const bytes: number[] = [];

    let offset = 0;
    for (const block of blocks) {
      if (block.colorChange) {
        // COLOR_CHANGE command: 0x80, 0x01, 0x00, 0x00
        bytes[offset++] = 0x80;
        bytes[offset++] = 0x01;
        bytes[offset++] = 0x00;
        bytes[offset++] = 0x00;
      } else if (block.isTrim) {
        bytes[offset++] = 0x80; // COMMAND_FLAG
        bytes[offset++] = 0x02; // TRIM_COMMAND
        bytes[offset++] = 0x00;
        bytes[offset++] = 0x00;
      } else if (block.isJump) {
        for (const stitch of block.stitches) {
          bytes[offset++] = 0x80; // COMMAND_FLAG
          bytes[offset++] = 0x02; // JUMP_COMMAND
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
    bytes[offset++] = 0x80;
    bytes[offset++] = 0x10;
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

/* JEF Header
Type 	Bytes 	Value 	Description
`u32` 	4 	0x74 +8 * Color_Changes 	Offset into file where stitches begin.
`u32` 	4 	0x14 	Unknown.
`char` 	14 	"20180712082429" (example) 	Date
`char` 	1 	'm', 'n', 'o','p','q','r','s',t' 	Version letter. 12000: m, 11000: n, 10000v3: o, 10000 v2.2 p, 9000 q, mc350, r, mc200 s, mb4 t. Janome's software leaves this as 00 00 at times.
`u8` 	1 	0x20 	Unknown
`u32` 	4 	Color Count 	Color Count
`u32` 	4 	Points Length / 2 	Points Length /2. So 80 01 00 00 is 2 not 1.
`u32` 	4 	Hoop Used 	Hoop
`u32` 	16 	Extends 	Distances from center of hoop.
`u32` 	16 	Edge amount for hoop 	Distance from default 110 x 110 Hoop, or -1,-1,-1,-1 if does not fit.
`u32` 	16 	Edge amount for hoop 	Distance from default 50 x 50 Hoop, or -1,-1,-1,-1 if does not fit.
`u32` 	16 	Edge amount for hoop 	Distance from default 140 x 200 Hoop, or -1,-1,-1,-1 if does not fit.
`u32` 	16 	Edge amount for hoop 	Distance from custom hoop, or -1,-1,-1,-1 if does not fit.
`u32` 	4 * Color_Changes 	Magic Number Color Lookup 	List of colors changes.
`u32` 	4 * Color_Changes 	0x0D 	The values 0x0D, 0x0D, 0x0D, 0x0D repeated as many times as there are color changes. 
*/
