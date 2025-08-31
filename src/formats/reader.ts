import { processGeometry } from "@/helpers/processGeometry.helper";
import { LineBasicMaterial } from "three";
import { processLine } from "@/helpers/processLines.helper";
import type { OutpusReaderFormats, OutputReadStitches, SuportFormats } from "@/types/embroidery.types";
import { readStitchesXXX } from "./xxx/readStitches.xxx";
import { readStitchesPES } from "./pes/readStitches.pes";
import { readStitchesJEF } from "./jef/readStitches.jef";
import { readStitchesEXP } from "./exp/readStitches.exp";
import { DSTReader } from "./DST.reader";
import { blobToData } from "@/helpers/processBuffer.helper";
import type { Stitch_Block } from "./interface";
import { JEFWriter } from "./JEF.writer";
import { JEFReader } from "./JEF.reader";

export const readerEmbroideryFormats = async (extension: SuportFormats, file: File): Promise<OutpusReaderFormats> => {
  let processedData: OutputReadStitches | null = null;

  switch (extension) {
    case "pes":
      processedData = await readStitchesPES(file);
      break;
    case "xxx":
      processedData = await readStitchesXXX(file);

      break;
    case "jef":
      processedData = await readStitchesJEF(file);
      {
        const buffer = await blobToData(file);

        const stitchBlocks: Stitch_Block[] = JEFReader.getStitches(buffer);
        console.log({ stitchBlocks });

        // const buffer: Uint8Array = PESWriter.getBuffer(stitchBlocks);
        const bufferParsed: Uint8Array = JEFWriter.getBuffer(stitchBlocks);

        saveFile(bufferParsed, "design.JEF");
      }
      break;
    case "exp":
      processedData = await readStitchesEXP(file);

      break;
    case "dst":
      //  processedData = await readStitchesDST(file);
      {
        const buffer = await blobToData(file);

        const stitchBlocks: Stitch_Block[] = DSTReader.getStitches(buffer);
        console.log({ stitchBlocks });

        // const buffer: Uint8Array = PESWriter.getBuffer(stitchBlocks);
        const bufferParsed: Uint8Array = JEFWriter.getBuffer(stitchBlocks);

        saveFile(bufferParsed, "design.JEF");
      }

      break;
    default:
      throw new Error("Unsupported file format. Please upload a JEF, DST or EXP file.");
  }

  if (!processedData) throw new Error("Something goes wrong with Reader Embroidery File!");

  const geometries = processedData.blocks.map((b) => processGeometry(b.vertices, b.colors));

  const material = new LineBasicMaterial({ vertexColors: true });

  // Transform geometries to THREE.Line objects
  const lines = geometries.map((geometry) => processLine(geometry, material));

  return {
    lines,
    ...processedData,
  };
};

const saveFile = (data: Uint8Array, filename: string = "design.pes"): void => {
  try {
    const blob = new Blob([data as BlobPart], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";

    document.body.appendChild(a);
    a.click();

    // Limpieza
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error("Error saving PES file:", error);
  }
};
