import type { Point, StitchBlock } from "@/types/embroidery.types";

interface Header {
  [key: string]: string;
}

enum FLAG_MAP {
  STITCH,
  JUMP,
  COLOR_CHANGE,
  STOP,
  END,
  SEQUIN_MODE,
  SEQUIN_EJECT,
}

export class DSTWriter {
  private HEADER_SIZE = 512; // DST headers are always 512 bytes long.

  stitchBlocks: StitchBlock[] = [];

  constructor(stitchBlocks: StitchBlock[]) {
    this.stitchBlocks = stitchBlocks;
  }

  getBuffer(): Uint8Array {
    const stitches = this.encodeStitches();

    const header = this.writeHeader();

    const jefFile = new Uint8Array(header.length + stitches.length);
    jefFile.set(header);
    jefFile.set(stitches, header.length);

    return jefFile;
  }

  private createHeader(): Header {
    const colorCount = this.stitchBlocks.filter((b) => b.isColorChange).length;
    const stitchCount = this.stitchBlocks.reduce((sum, block) => sum + block.stitches.length, 0);
    const stitches: Point[] = [];
    this.stitchBlocks.filter((b) => stitches.push(...b.stitches));
    const bounds = this.calculateBounds(stitches);

    return {
      LA: `LA:${"DESIGN".padEnd(8, " ")}`,
      ST: `ST:${stitchCount.toString().padStart(7, " ")}`,
      CO: `CO:${colorCount.toString().padStart(3, " ")}`,
      "+X": `+X:${bounds[2].toString().padStart(4, " ")}`,
      "-X": `-X:${bounds[0].toString().padStart(4, " ")}`,
      "+Y": `+Y:${bounds[3].toString().padStart(4, " ")}`,
      "-Y": `-Y:${bounds[1].toString().padStart(4, " ")}`,
      AX: "AX:+    0",
      AY: "AY:+    0",
      MX: "MX:+    0",
      MY: "MY:+    0",
      PD: "PD:******",
    };
  }

  private calculateBounds(stitches: Point[]): [number, number, number, number] {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    stitches.forEach((stitch) => {
      minX = Math.min(minX, stitch.x);
      minY = Math.min(minY, stitch.y);
      maxX = Math.max(maxX, stitch.x);
      maxY = Math.max(maxY, stitch.y);
    });

    return [minX, minY, maxX, maxY];
  }

  private writeHeader(): Uint8Array {
    const headerDict = this.createHeader();
    const header = new Uint8Array(this.HEADER_SIZE);

    let headerString = "";
    const headerOrder = ["LA", "ST", "CO", "+X", "-X", "+Y", "-Y", "AX", "AY", "MX", "MY", "PD"];

    headerOrder.forEach((key) => {
      headerString += headerDict[key] + "\r";
    });

    headerString += "\u001a";
    headerString = headerString.padEnd(this.HEADER_SIZE, " ");

    for (let i = 0; i < this.HEADER_SIZE; i++) {
      header[i] = i < headerString.length ? headerString.charCodeAt(i) : 0x20; // Space
    }

    return header;
  }

  private encodeStitches(): Uint8Array {
    const encoded: number[] = [];

    for (const block of this.stitchBlocks) {
      if (block.isColorChange) {
        const [byte1, byte2, byte3] = this.encodeRecord(0, 0, FLAG_MAP.COLOR_CHANGE);
        encoded.push(byte1, byte2, byte3);
      }
      if (block.isJump) {
        for (const stitch of block.stitches) {
          const dx = stitch.x;
          const dy = stitch.y;

          const [byte1, byte2, byte3] = this.encodeRecord(dx, dy, FLAG_MAP.JUMP);

          encoded.push(byte1, byte2, byte3);
        }
        continue;
      }

      // Normal stitches
      for (const stitch of block.stitches) {
        const dx = stitch.x;
        const dy = stitch.y;

        const [byte1, byte2, byte3] = this.encodeRecord(dx, dy, FLAG_MAP.STITCH);

        encoded.push(byte1, byte2, byte3);
      }
    }

    encoded.push(0x00, 0x00, 0xf3);

    return new Uint8Array(encoded);
  }

  private encodeRecord(x: number, y: number, flags: FLAG_MAP): [number, number, number] {
    let b0 = 0,
      b1 = 0,
      b2 = 0;

    // Helper function to set bits
    const setBit = (byte: number, bit: number): number => byte | (1 << bit);

    switch (flags) {
      case FLAG_MAP.JUMP:
      case FLAG_MAP.SEQUIN_EJECT:
        b2 = setBit(b2, 7); // jumpstitch 10xxxx11
      // fallthrough - continue with STITCH
      case FLAG_MAP.STITCH:
        b2 = setBit(b2, 0);
        b2 = setBit(b2, 1);

        // Coding for X
        if (x > 40) {
          b2 = setBit(b2, 2);
          x -= 81;
        }
        if (x < -40) {
          b2 = setBit(b2, 3);
          x += 81;
        }
        if (x > 13) {
          b1 = setBit(b1, 2);
          x -= 27;
        }
        if (x < -13) {
          b1 = setBit(b1, 3);
          x += 27;
        }
        if (x > 4) {
          b0 = setBit(b0, 2);
          x -= 9;
        }
        if (x < -4) {
          b0 = setBit(b0, 3);
          x += 9;
        }
        if (x > 1) {
          b1 = setBit(b1, 0);
          x -= 3;
        }
        if (x < -1) {
          b1 = setBit(b1, 1);
          x += 3;
        }
        if (x > 0) {
          b0 = setBit(b0, 0);
          x -= 1;
        }
        if (x < 0) {
          b0 = setBit(b0, 1);
          x += 1;
        }
        if (x !== 0) {
          console.error("Error: Write exceeded possible distance for X.");
        }

        // Coding for Y
        if (y > 40) {
          b2 = setBit(b2, 5);
          y -= 81;
        }
        if (y < -40) {
          b2 = setBit(b2, 4);
          y += 81;
        }
        if (y > 13) {
          b1 = setBit(b1, 5);
          y -= 27;
        }
        if (y < -13) {
          b1 = setBit(b1, 4);
          y += 27;
        }
        if (y > 4) {
          b0 = setBit(b0, 5);
          y -= 9;
        }
        if (y < -4) {
          b0 = setBit(b0, 4);
          y += 9;
        }
        if (y > 1) {
          b1 = setBit(b1, 7);
          y -= 3;
        }
        if (y < -1) {
          b1 = setBit(b1, 6);
          y += 3;
        }
        if (y > 0) {
          b0 = setBit(b0, 7);
          y -= 1;
        }
        if (y < 0) {
          b0 = setBit(b0, 6);
          y += 1;
        }
        if (y !== 0) {
          console.error("Error: Write exceeded possible distance for Y.");
        }
        break;

      case FLAG_MAP.COLOR_CHANGE:
        b2 = 0b11000011;
        break;

      case FLAG_MAP.STOP:
      case FLAG_MAP.END:
        b2 = 0b11110011;
        break;

      case FLAG_MAP.SEQUIN_MODE:
        b2 = 0b01000011;
        break;

      default:
        console.error("Error: Unknown flag:", flags);
    }

    return [b0, b1, b2];
  }
}
