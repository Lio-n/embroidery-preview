import { FORMAT_EMBROIDERY, type OutputStitchGeometry, type StitchBlock } from "@/types/embroidery.types";
import { DSTReader } from "./dst/DSTReader";
import { JEFWriter } from "./jef/JEF.writer";
import { JEFReader } from "./jef/JEF.reader";

export class EmbroideryManager {
  // Proccess for Three.Js
  async readFile(file: File, format: FORMAT_EMBROIDERY): Promise<OutputStitchGeometry> {
    switch (format) {
      case FORMAT_EMBROIDERY.DST: {
        return new DSTReader(file).process();
      }
      case FORMAT_EMBROIDERY.JEF: {
        return new JEFReader(file).process();
      }
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  // Proccess for Conversion format
  private async readSimpleFile(file: File, format: FORMAT_EMBROIDERY): Promise<StitchBlock[]> {
    switch (format) {
      case FORMAT_EMBROIDERY.DST: {
        const r = new DSTReader(file);
        await r.getSimpleStitches();
        return r.createToStitchBlocks();
      }
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private writeFile(design: StitchBlock[], format: FORMAT_EMBROIDERY): Uint8Array {
    switch (format) {
      case FORMAT_EMBROIDERY.JEF:
        return JEFWriter.getBuffer(design);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  async convertFormat(file: File, from: FORMAT_EMBROIDERY, to: FORMAT_EMBROIDERY): Promise<Uint8Array> {
    const r = await this.readSimpleFile(file, from);
    const buffer = this.writeFile(r, to);

    if (!buffer) throw new Error("Something goes wrong with Writer Embroidery File!");

    return buffer;
  }
}
