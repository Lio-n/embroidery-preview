import type { StitchBlock } from "@/types/embroidery.types";
import { MAP_BYTE } from "./pes/constants";

export class PESWriter {
  private static readonly PES_HEADER = "#PES0001";
  private static readonly PEC_HEADER_SIZE = 512;
  private static readonly PEC_COMMANDS = MAP_BYTE.COMMANDS;

  static getBuffer(stitchesBlocks: StitchBlock[]): Uint8Array {
    const stitches = this.encodeStitches(stitchesBlocks);
    const designName = "Design";
    const colorChanges = stitchesBlocks.filter((b) => b.isColorChange).length;

    // Calcular dimensiones
    const width = 100;
    const height = 100;

    // Escribir encabezado PEC
    const pecHeader = this.writePecHeader(designName, colorChanges - 1, width, height);

    // Primero necesitamos saber el tamaño real del header PES
    const pesHeaderPlaceholder = this.writePESHeader(0); // Header temporal para medir
    const PES_HEADER_ACTUAL_SIZE = pesHeaderPlaceholder.length;

    // Actualizar el offset del bloque PEC en el header PES
    const updatedPesHeader = this.writePESHeader(PES_HEADER_ACTUAL_SIZE);

    // Crear buffer final
    const totalSize = updatedPesHeader.length + pecHeader.length + stitches.length;
    const finalBuffer = new Uint8Array(totalSize);

    let currentOffset = 0;

    // 1. Encabezado PES (con offset correcto)
    finalBuffer.set(updatedPesHeader, currentOffset);
    currentOffset += updatedPesHeader.length;

    // 2. Encabezado PEC (en la posición indicada por pecBlockOffset)
    finalBuffer.set(pecHeader, currentOffset);
    currentOffset += pecHeader.length;

    // 3. Puntadas PEC
    finalBuffer.set(stitches, currentOffset);

    return finalBuffer;
  }

  // Escribir encabezado PES v1
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

  // Escribir encabezado PEC
  static writePecHeader(designName: string, colorChanges: number, width: number, height: number): Uint8Array {
    /*
      this.PEC_HEADER_SIZE + 20, toma en cuenta los 512 bytes del primer header y 20 bytes para el segundo, 
      sin tomar en cuenta "Pec Encoded stitches" y "Graphics Objects".

      "Pec Encoded stitches" y "Graphics Objects", seran añadidos en otra seccion del codigo.

      El tamaño completo de este HEADER es 532 bytes.
    */
    const header = new Uint8Array(this.PEC_HEADER_SIZE + 20);
    let offset = 0;

    // 1. Escribir "LA:"
    header.set([0x4c, 0x41, 0x3a], offset); // "L", "A", ":"
    offset += 3;

    // 2. Nombre (8 chars + padding a 20 bytes)
    const nameBytes = new TextEncoder().encode(designName.padEnd(8, " ").substring(0, 8));
    header.set(nameBytes, offset);
    offset += 20; // Total 20 bytes para el nombre

    // 3. Byte 0x0D
    header[offset++] = 0x0d;

    // 4. 12 espacios (0x20)
    for (let i = 0; i < 12; i++) {
      header[offset++] = 0x20;
    }

    // 5. 0xFF, 0x00
    header[offset++] = 0xff;
    header[offset++] = 0x00;

    // 6. Graphics size info: 0x06, 0x26
    header[offset++] = 0x06;
    header[offset++] = 0x26;

    // 7. 12 espacios más
    for (let i = 0; i < 12; i++) {
      header[offset++] = 0x20;
    }

    // 8. Número de cambios de color.
    /*
      Ubicacion 48, porque desde el readerPes accedo de esta forma, 
      const colorOffset = PEC_BYTE_OFFSET + MAP_BYTE.PEC_HEADER.FIRST_SECTION.COLOR_COUNT;, 
      donde FIRST_SECTION.COLOR_COUNT es 0x30.
    */
    header[0x30] = colorChanges;
    offset++;

    // 9. Índices de color alternados (2, 1, 2, 1, ...)
    for (let i = 0; i < colorChanges; i++) {
      header[offset++] = i % 2 === 0 ? 2 : 1;
    }

    const spacesToFill = this.PEC_HEADER_SIZE - offset;

    // 10. Rellenar con espacios hasta completar 463 bytes desde el inicio
    // Hasta ahora hemos escrito: 3 + 20 + 1 + 12 + 2 + 2 + 12 + 1 + n = 53 + n bytes

    for (let i = 0; i < spacesToFill; i++) {
      header[offset++] = 0x20;
    }

    // 11. Ahora escribimos los últimos 16 bytes (512 - 463 = 49 bytes restantes)
    // Pero según la especificación, los próximos son:

    // 2 bytes de zeros
    offset += 2; // Simplemente avanzamos, los bytes ya son 0x00

    // Graphics offset (3 bytes) - placeholder para la posición de los gráficos
    // Este valor se calculará más tarde cuando sepamos la posición de los gráficos
    header[offset++] = 0x00;
    header[offset++] = 0x00;
    header[offset++] = 0x00;

    // Magic bytes
    header[offset++] = 0x31;
    header[offset++] = 0xff;
    header[offset++] = 0xf0;

    // Usar DataView para los valores numéricos (Big Endian)
    const view = new DataView(header.buffer);

    // Width (2 bytes) - Big Endian
    view.setUint16(offset, width, false);
    offset += 2;

    // Height (2 bytes) - Big Endian
    view.setUint16(offset, height, false);
    offset += 2;

    // Valores fijos: 0x01E0, 0x01B0
    view.setUint16(offset, 0x01e0, false);
    offset += 2;
    view.setUint16(offset, 0x01b0, false);
    offset += 2;

    // MinX y MinY ajustados: 0x9000 - minX, 0x9000 - minY (Big Endian)
    view.setUint16(offset, 0x9000, false);
    offset += 2;
    view.setUint16(offset, 0x9000, false);
    offset += 2;

    if (offset !== this.PEC_HEADER_SIZE + 20) {
      throw new Error(`SECOND Header PEC tamaño incorrecto: ${offset} bytes, deberían ser ${this.PEC_HEADER_SIZE + 20}`);
    }

    return header;
  }

  static encodeStitches(blocks: StitchBlock[]): Uint8Array {
    const bytes: number[] = [];
    let colorChangeCounter = 2;
    // let currentX = 0;
    // let currentY = 0;

    for (const block of blocks) {
      if (block.isColorChange) {
        bytes.push(this.PEC_COMMANDS.COLOR_CHANGE_FLAG[0], this.PEC_COMMANDS.COLOR_CHANGE_FLAG[1], colorChangeCounter);
        colorChangeCounter = colorChangeCounter === 2 ? 1 : 2;
        continue;
      }

      for (const stitch of block.stitches) {
        const dx = stitch.x;
        const dy = stitch.y;

        if (block.isJump) {
          this.encodeJump(bytes, dx, dy);
        } else if (block.isTrim) {
          this.encodeTrim(bytes, dx, dy);
        } else {
          this.encodeNormalStitch(bytes, dx, dy);
        }
      }
    }

    bytes.push(this.PEC_COMMANDS.END_FLAG); // END
    return new Uint8Array(bytes);
  }

  private static encodeNormalStitch(bytes: number[], dx: number, dy: number): void {
    if (Math.abs(dx) <= 63 && Math.abs(dy) <= 63) {
      // Formato corto
      bytes.push(dx & 0x7f);
      bytes.push(dy & 0x7f);
    } else {
      // Formato largo
      this.encodeLongStitch(bytes, dx, 0);
      this.encodeLongStitch(bytes, dy, 0);
    }
  }

  private static encodeJump(bytes: number[], dx: number, dy: number): void {
    this.encodeLongStitch(bytes, dx, this.PEC_COMMANDS.JUMP_FLAG); // JUMP_FLAG
    this.encodeLongStitch(bytes, dy, this.PEC_COMMANDS.JUMP_FLAG);
  }

  private static encodeTrim(bytes: number[], dx: number, dy: number): void {
    this.encodeLongStitch(bytes, dx, this.PEC_COMMANDS.TRIM_FLAG); // TRIM_FLAG
    this.encodeLongStitch(bytes, dy, this.PEC_COMMANDS.TRIM_FLAG);
  }

  private static encodeLongStitch(bytes: number[], value: number, command: number): void {
    const absValue = Math.min(2047, Math.abs(value));
    const signBit = value < 0 ? 0x08 : 0x00;

    const highByte = 0x80 | command | signBit | ((absValue >> 8) & 0x07);
    const lowByte = absValue & 0xff;

    bytes.push(highByte, lowByte);
  }
}
