import type { StitchBlock } from "@/types/embroidery.types";
import { MAP_BYTE } from "./constants";

/*
export const MAP_BYTE = {
  COMMANDS: {
    JUMP_FLAG: 0x10,
    TRIM_FLAG: 0x20,
    LONG_FLAG: 0x80,
    END_FLAG: 0xff,
    COLOR_CHANGE_FLAG: [0xfe, 0xb0],
    COLOR_CHANGE: (b1: number, b2: number) => b1 === 0xfe && b2 === 0xb0,
    END: (b1: number, b2: number) => (b1 === 0xff && b2 === 0x00) || b2 === undefined,
  },
  PEC_HEADER: {
    FIRST_SECTION: {
      LA: 0x13, // Number of colors minus one
      COLOR_COUNT: 0x30, // Number of colors minus one
    },
    SECOND_SECTION: {
      WIDTH: PEC_HEADER_SIZE + 8, // s16 in the doc says, 10 but is 8
      HEIGHT: PEC_HEADER_SIZE + 10, // s16 in the doc says, 12 but is 10
      "0x01E0": PEC_HEADER_SIZE + 12,
      "0x01B0": PEC_HEADER_SIZE + 14,
      "pec-stitch-list-subsection": PEC_HEADER_SIZE + 20,
    },
  },
};

*/
export class PESWriter {
  private static readonly PES_HEADER = "#PES0001";
  private static readonly PEC_HEADER_SIZE = 512;
  private static readonly MAP_BYTE = MAP_BYTE;

  private static readonly JUMP_CODE = 0x90; // Código para jump
  private static readonly TRIM_CODE = 0x80; // Código para trim
  private static readonly STITCH_CODE = 0x00; // Código para stitch normal
  private static readonly COLOR_CHANGE_CODE = 0xfe; // Inicio de cambio de color

  private static calculateBounds(blocks: StitchBlock[]): {
    width: number;
    height: number;
    minX: number;
    minY: number;
  } {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    let x = 0,
      y = 0;

    for (const block of blocks) {
      for (const stitch of block.stitches) {
        x += stitch.x;
        y += stitch.y;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    return {
      width: maxX - minX,
      height: maxY - minY,
      minX,
      minY,
    };
  }

  static getBuffer(stitchesBlocks: StitchBlock[]): Uint8Array {
    const stitches = this.encodeStitches(stitchesBlocks);
    const designName = "Design";
    const colorChanges = stitchesBlocks.filter((b) => b.isColorChange).length;

    const bounds = this.calculateBounds(stitchesBlocks);
    const width = 100;
    const height = 100;

    const pecHeader = this.writePecHeader(designName, colorChanges, width, height);

    const pesHeaderPlaceholder = this.writePESHeader(0); // Temp header to measure
    const PES_HEADER_ACTUAL_SIZE = pesHeaderPlaceholder.length;

    // Update the PEC lock offset in the PES header
    const updatedPesHeader = this.writePESHeader(PES_HEADER_ACTUAL_SIZE);

    const totalSize = updatedPesHeader.length + pecHeader.length + stitches.length;
    const finalBuffer = new Uint8Array(totalSize);

    let currentOffset = 0;

    finalBuffer.set(updatedPesHeader, currentOffset);
    currentOffset += updatedPesHeader.length;

    finalBuffer.set(pecHeader, currentOffset);
    currentOffset += pecHeader.length;

    finalBuffer.set(stitches, currentOffset);

    return finalBuffer;
  }

  // PES v1 Header
  private static writePESHeader(pecBlockOffset: number): Uint8Array {
    const header = new Uint8Array(20);

    let offset = 0;
    const view = new DataView(header.buffer);

    // 8 bytes: "#PES0001"
    const pesHeaderBytes = new TextEncoder().encode(this.PES_HEADER);
    header.set(pesHeaderBytes, offset);
    offset += 8;

    // 4 bytes: Location of PEC block (Little Endian)
    view.setUint32(offset, pecBlockOffset, true);
    offset += 4;

    // 2 bytes: 1 (scale to fit) - Little Endian
    view.setUint16(offset, 1, true);
    offset += 2;

    // 2 bytes: 1 (hoop size: 130mm x 180mm) - Little Endian
    view.setUint16(offset, 1, true);
    offset += 2;

    // 2 bytes: 1 (only one ThreeBlock object) - Little Endian
    view.setUint16(offset, 1, true);
    offset += 2;

    // 4 bytes: FF FF 00 00 - end the header
    header[offset++] = 0xff;
    header[offset++] = 0xff;
    header[offset++] = 0x00;
    header[offset++] = 0x00;

    return header;
  }

  // PEC header
  static writePecHeader(designName: string, colorChanges: number, width: number, height: number): Uint8Array {
    /*
      this.PEC_HEADER_SIZE + 20, toma en cuenta los 512 bytes del primer header y 20 bytes para el segundo, 
      sin tomar en cuenta "Pec Encoded stitches" y "Graphics Objects".

      "Pec Encoded stitches" y "Graphics Objects", seran añadidos en otra seccion del codigo.

      El tamaño completo de este HEADER es 532 bytes.
    */
    const header = new Uint8Array(this.PEC_HEADER_SIZE + 20);
    let offset = 0;

    // 1. write "LA:"
    header.set([0x4c, 0x41, 0x3a], offset); // "L", "A", ":"
    offset += 3;

    // 2. Name (8 chars + padding to 20 bytes)
    const nameBytes = new TextEncoder().encode(designName.padEnd(8, " ").substring(0, 8));
    header.set(nameBytes, offset);
    offset += 20; // Total 20 bytes for the name

    // 3. Byte 0x0D
    header[offset++] = 0x0d;

    // 4. 12 spaces (0x20)
    for (let i = 0; i < 12; i++) {
      header[offset++] = 0x20;
    }

    // 5. 0xFF, 0x00
    header[offset++] = 0xff;
    header[offset++] = 0x00;

    // 6. Graphics size info: 0x06, 0x26
    header[offset++] = 0x06;
    header[offset++] = 0x26;

    // 7. 12 more spaces
    for (let i = 0; i < 12; i++) {
      header[offset++] = 0x20;
    }

    // 8. Number of color changes.
    /*
      Ubicacion 48, porque desde el readerPes accedo de esta forma, 
      const colorOffset = PEC_BYTE_OFFSET + MAP_BYTE.PEC_HEADER.FIRST_SECTION.COLOR_COUNT;, 
      donde FIRST_SECTION.COLOR_COUNT es 0x30.
    */
    header[0x30] = colorChanges;
    offset++;

    // 9. Alternating color indices (2, 1, 2, 1, ...)
    for (let i = 0; i < colorChanges; i++) {
      header[offset++] = i % 2 === 0 ? 2 : 1;
    }

    const spacesToFill = this.PEC_HEADER_SIZE - offset;

    // 10. Fill with spaces until 463 bytes are complete from the beginning
    // So far we have written: 3 + 20 + 1 + 12 + 2 + 2 + 12 + 1 + n = 53 + n bytes

    for (let i = 0; i < spacesToFill; i++) {
      header[offset++] = 0x20;
    }

    // 11. Now we write the last 16 bytes (512 - 463 = 49 bytes remaining)
    // But according to the specification, the next ones are:

    // 2 bytes de zeros
    offset += 2;

    // Graphics offset (3 bytes) - placeholder for graphics position
    // This value will be calculated later when we know the position of the graphics
    header[offset++] = 0x00;
    header[offset++] = 0x00;
    header[offset++] = 0x00;

    // Magic bytes
    header[offset++] = 0x31;
    header[offset++] = 0xff;
    header[offset++] = 0xf0;

    // Use DataView for numeric values ​​(Big Endian)
    const view = new DataView(header.buffer);

    // Width (2 bytes) - Big Endian
    view.setUint16(offset, width, false);
    offset += 2;

    // Height (2 bytes) - Big Endian
    view.setUint16(offset, height, false);
    offset += 2;

    // Fixed values: 0x01E0, 0x01B0
    view.setUint16(offset, 0x01e0, false);
    offset += 2;
    view.setUint16(offset, 0x01b0, false);
    offset += 2;

    // Adjusted MinX and MinY: 0x9000 - minX, 0x9000 - minY (Big Endian)
    view.setUint16(offset, 0x9000, false);
    offset += 2;
    view.setUint16(offset, 0x9000, false);
    offset += 2;

    if (offset !== this.PEC_HEADER_SIZE + 20) {
      throw new Error(`SECOND Header PEC wrong size: ${offset} bytes, should be ${this.PEC_HEADER_SIZE + 20} bytes.`);
    }

    return header;
  }

  static encodeStitches_(blocks: StitchBlock[]): Uint8Array {
    const bytes: number[] = [];
    let colorChangeCounter = 2;
    let x = 0,
      y = 0;

    for (const block of blocks) {
      if (block.isColorChange) {
        // Color changes should write: Write 1 byte: 0xfe Write 1 byte: 0xb0 Write 1 byte: 2, 1, 2, 1, 2, 1...
        // alternating back and forth. Starting with 2 and each additional color change use the next character in sequence.
        bytes.push(this.MAP_BYTE.COMMANDS.COLOR_CHANGE_FLAG[0], this.MAP_BYTE.COMMANDS.COLOR_CHANGE_FLAG[1], colorChangeCounter);
        colorChangeCounter = colorChangeCounter === 2 ? 1 : 2;
        continue;
      } else if (block.isJump) {
        // Jumps are long form stitches with the command bit for Jump set. 0b1001????_????????, 0b1001????_????????
        for (const stitch of block.stitches) {
          const dx = stitch.x + x;
          const dy = stitch.y + y;

          this.encodeJump(bytes, dx, dy);
        }

        continue;
      }

      for (const stitch of block.stitches) {
        const dx = stitch.x;
        const dy = -stitch.y;
        x += dx;
        y += dy;
        this.encodeNormalStitch(bytes, dx, dy);
      }
    }

    bytes.push(this.MAP_BYTE.COMMANDS.END_FLAG); // END
    return new Uint8Array(bytes);
  }

  private static encodeShortStitch(bytes: number[], dx: number, dy: number): void {
    bytes.push(dx & 0x7f, dy & 0x7f);
  }

  private static encodeLongStitch(bytes: number[], value: number, command: number): void {
    const absValue = Math.min(2047, Math.abs(value));
    const signBit = value < 0 ? 0x08 : 0x00;

    const highByte = 0x80 | command | signBit | ((absValue >> 8) & 0x07);
    const lowByte = absValue & 0xff;

    bytes.push(highByte, lowByte);
  }

  private static encodeJump(bytes: number[], dx: number, dy: number): void {
    this.encodeLongStitch(bytes, dx, this.MAP_BYTE.COMMANDS.JUMP_FLAG);
    this.encodeLongStitch(bytes, dy, this.MAP_BYTE.COMMANDS.JUMP_FLAG);
  }

  private static encodeNormalStitch(bytes: number[], dx: number, dy: number): void {
    if (Math.abs(dx) <= 127 && Math.abs(dy) <= 127) {
      // Short form: 2 bytes for normal stitches
      this.encodeShortStitch(bytes, dx, dy);
    } else {
      // Long form: 4 bytes for large moves
      this.encodeLongStitch(bytes, dx, this.MAP_BYTE.COMMANDS.LONG_FLAG);
      this.encodeLongStitch(bytes, dy, this.MAP_BYTE.COMMANDS.LONG_FLAG);
    }
  }

  static encodeStitches(blocks: StitchBlock[]): Uint8Array {
    const bytes: number[] = [];
    let colorTwo = true;
    let jumping = false;
    let isInitial = true;

    for (const block of blocks) {
      if (block.isColorChange) {
        if (jumping) {
          // Finalizar salto antes de cambio de color
          this.writeValue(bytes, 0, false, this.STITCH_CODE);
          this.writeValue(bytes, 0, false, this.STITCH_CODE);
          jumping = false;
        }

        // Comando de cambio de color
        bytes.push(0xfe, 0xb0);
        bytes.push(colorTwo ? 2 : 1);
        colorTwo = !colorTwo;
        isInitial = false;
        continue;
      }

      for (const stitch of block.stitches) {
        const dx = stitch.x;
        const dy = -stitch.y;

        if (block.isJump) {
          jumping = true;

          if (isInitial) {
            // Salto inicial
            this.writeValue(bytes, dx, true, this.JUMP_CODE);
            this.writeValue(bytes, dy, true, this.JUMP_CODE);
          } else {
            // Trim o salto posterior
            this.writeValue(bytes, dx, true, this.TRIM_CODE);
            this.writeValue(bytes, dy, true, this.TRIM_CODE);
          }
          isInitial = false;
        } else {
          // Stitch normal
          if (jumping) {
            // Finalizar salto antes de stitch normal
            this.writeValue(bytes, 0, false, this.STITCH_CODE);
            this.writeValue(bytes, 0, false, this.STITCH_CODE);
            jumping = false;
          }

          if (Math.abs(dx) < 127 && Math.abs(dy) < 127) {
            // Stitch corto (2 bytes)
            this.writeValue(bytes, dx, true, this.STITCH_CODE);
            this.writeValue(bytes, dy, true, this.STITCH_CODE);
          } else {
            // Stitch largo (4 bytes)
            this.writeValue(bytes, dx, false, this.STITCH_CODE);
            this.writeValue(bytes, dy, false, this.STITCH_CODE);
          }
          isInitial = false;
        }
      }
    }

    // Comando END
    bytes.push(0xff);
    return new Uint8Array(bytes);
  }

  private static writeValue(bytes: number[], value: number, isShort: boolean, command: number): void {
    if (isShort) {
      // Formato corto: 1 byte
      if (value < -128 || value > 127) {
        throw new Error(`Short stitch value out of range: ${value}`);
      }
      bytes.push(value & 0x7f);
    } else {
      // Formato largo: 2 bytes con comando
      const absValue = Math.min(2047, Math.abs(value));
      const signBit = value < 0 ? 0x08 : 0x00;

      const highByte = command | signBit | ((absValue >> 8) & 0x07);
      const lowByte = absValue & 0xff;

      bytes.push(highByte, lowByte);
    }
  }
}
