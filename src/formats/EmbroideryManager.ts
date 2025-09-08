import { FORMAT_EMBROIDERY, type OutputStitchGeometry, type StitchBlock } from "@/types/embroidery.types";
import { DSTReader } from "./dst/DST.reader";
import { JEFWriter } from "./jef/JEF.writer";
import { JEFReader } from "./jef/JEF.reader";
// import { PESWriter } from "./pes/PES.writer";
import { DSTWriter } from "./dst/DST.writer";
// import { EXPReader } from "./exp/EXP.reader";

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
      case FORMAT_EMBROIDERY.JEF: {
        const r = new JEFReader(file);
        await r.getSimpleStitches();
        return r.createToStitchBlocks();
      }
      // case FORMAT_EMBROIDERY.EXP: {
      //   const r = new EXPReader(file);
      //   await r.getSimpleStitches();
      //   return r.createToStitchBlocks();
      // }
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private writeFile(design: StitchBlock[], format: FORMAT_EMBROIDERY): Uint8Array {
    switch (format) {
      case FORMAT_EMBROIDERY.DST: {
        const r = new DSTWriter(design);
        return r.getBuffer();
      }
      case FORMAT_EMBROIDERY.JEF:
        return JEFWriter.getBuffer(design);
      // case FORMAT_EMBROIDERY.PES:
      //   return PESWriter.getBuffer(design);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  async convertFormat(file: File, from: FORMAT_EMBROIDERY, to: FORMAT_EMBROIDERY): Promise<Uint8Array> {
    console.log(`Convert from ${from} to ${to}`);
    const r = await this.readSimpleFile(file, from);
    const buffer = this.writeFile(r, to);

    if (!buffer) throw new Error("Something goes wrong with Writer Embroidery File!");

    return buffer;
  }
}

/*
  DST -> JEF working
  DST -> PES Not working
  JEF -> JEF working
  JEF -> PES Not working has expected
  EXP -> JEF Not working has expected
*/
